var appAddress = 'http://127.0.0.1:34012/';

var redirectionUrl;

function askUser(type, data, aux) {
  var identifier = Date.now().toString() + Math.random().toString().substr(2);
  var requestURI = appAddress+"start";
  var params = "request=" + encodeURIComponent(identifier) +
    "&type=" + encodeURIComponent(type) +
    "&data=" + encodeURIComponent(JSON.stringify(data));

  if (aux) {
    params += "&aux="+encodeURIComponent(aux);
  }

  var xmp = new XMLHttpRequest();
  xmp.open("POST", requestURI, false);
  xmp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  // we block on send() until the application responds, after getting user input
  xmp.send(params);

  console.log(xmp.responseText);
  result = JSON.parse(xmp.responseText);
  if (result.error) {
    // these errors generally aren't visible... oh well...
    console.log("ERROR: "+result.error);
  }
  return result;
}

// Keeps track of which functionality is enabled
// Structure is config.type.tabID = true|false
var config = {
  blockReroute: {},
  requestHeaders: {},
  responseHeaders: {},
  interceptPost: {},
  monitorPostMessage: {},
  monitorXSS: {},
  monitorMixedContent: {}};
// Keeps track of which options are enabled for a given functionality
// Structure is subconf.type.option.tabId = true|false
var subconf = {};

/*
 * nestedRead reads a property from a nested structure, returning false if the
 * property does not exist
 */
function nestedRead(structure, propertyList) {
  var current = structure;
  for (var i = 0; i < propertyList.length; i++) {
    if (!current.hasOwnProperty(propertyList[i])) {
      return false;
    }
    current = current[propertyList[i]];
  }
  return current;
}

function internalRequest(info) {
  return info.url.substring(0, appAddress.length) == appAddress;
}

function skipRequest(info, category) {
  return !nestedRead(config, [category, info.tabId]) ||
      nestedRead(subconf, [category, 'ignore-'+info.type, info.tabId]) ||
      internalRequest(info) ||
      info.url == redirectionUrl;
}

chrome.webRequest.onBeforeRequest.addListener(
  function(info) {
    var category = 'blockReroute';
    if (skipRequest(info, category)) {
      return {};
    }

    // if applicable, get the resource to allow the user to edit it
    var editPayload = null;
    if (nestedRead(subconf, [category, 'modify-'+info.type, info.tabId])) {
      var xmp = new XMLHttpRequest();
      xmp.open("GET", info.url, false);
      xmp.send();
      editPayload = xmp.responseText;
    }

    // if available, convert arraybuffer to typed array in raw
    if (info.requestBody && info.requestBody.raw) {
      info.requestBody.raw = info.requestBody.raw.map(function(part) {
        if (part.bytes) {
          part.bytes = [].slice.call(
              new Uint8Array(part.bytes.slice(0, 500e3)));
        }
        return part;
      });
    }

    var result = askUser(category, info, editPayload);
    redirectionUrl = result.redirectUrl;

    return result;
  },
  {
    urls: [
    "http://*/*",
    "https://*/*",
    ]
  },
  ["blocking", "requestBody"]);

// handle messages from the devtools area (tamper.js)
chrome.extension.onConnect.addListener(function(port){
  port.onMessage.addListener(function(msg) {
    if (config.hasOwnProperty(msg.key)) {
      config[msg.key][msg.tabId] = !!msg.value;
    }
  });
});

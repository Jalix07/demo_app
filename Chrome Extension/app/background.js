// TODO: High-level file comment.
var socket = chrome.socket;
var socketInfo;
var uiWindow;
var windowExists = false;
var requests = {};
var request_order = [];


// basic accept wrapper
var onAccept = function(acceptInfo) {
  if (acceptInfo.resultCode < 0) {
    return;
  }
  readFromSocket(acceptInfo.socketId);
};

// data manipulation functions
var stringToUint8Array = function(string) {
  var buffer = new ArrayBuffer(string.length);
  var view = new Uint8Array(buffer);
  for(var i = 0; i < string.length; i++) {
    view[i] = string.charCodeAt(i);
  }
  return view;
};

var arrayBufferToString = function(buffer) {
  var str = '';
  var uArrayVal = new Uint8Array(buffer);
  for(var s = 0; s < uArrayVal.length; s++) {
    str += String.fromCharCode(uArrayVal[s]);
  }
  return str;
};

function parseQuery(qstr)
{
  var query = {};
  var a = qstr.split('&');
  for (var i in a)
  {
    var b = a[i].split('=');
    query[decodeURIComponent(b[0])] = decodeURIComponent(b[1]);
  }
  return query;
}

// action functions
var sendResponse = function(socketId, value) {
  var contentType = "text/plain";
  var contentLength = encodeURI(value).split(/%..|./).length - 1;;
  var header = stringToUint8Array(
      "HTTP/1.0 200 OK\nAccess-Control-Allow-Origin: *\nContent-length: " +
      contentLength + "\nContent-type:" + contentType + "\n\n");
  var content = stringToUint8Array(value)
  var outputBuffer = new ArrayBuffer(header.byteLength + contentLength);

  var view = new Uint8Array(outputBuffer)
  view.set(header, 0);
  view.set(stringToUint8Array(value), header.byteLength);
  socket.write(socketId, outputBuffer, function(writeInfo) {
    socket.destroy(socketId);
  });
};

var readFromSocket = function(socketId) {

  var headers = '';
  var content = '';
  var totalContentLength;
  var contentLengthSoFar;

  // get the first chunk
  socket.read(socketId, function(readInfo) {
    var data = arrayBufferToString(readInfo.data);
    // the chrome socket read API only calls the callback if there's data, so we
    // need to keep reading until content length is satisfied to know we're done
    var headerEndLoc = data.indexOf("\r\n\r\n");
    headers = data.substring(0, headerEndLoc)
    content = data.substring(headerEndLoc + 4);

    if (content.length == 0) {
      handleRequest(headers);
    } else {
      // no unicode in the headers, so assume char == byte
      contentLengthSoFar = readInfo.resultCode - headers.length - 4;
      var lengthLoc = headers.indexOf("\nContent-Length: ");
      var lengthEnd = data.indexOf("\r\n", lengthLoc);
      totalContentLength = parseInt(
          data.substring(lengthLoc + 16, lengthEnd), 10);
      readChunk();
    }
  });

  function readChunk() {
    if (totalContentLength == contentLengthSoFar) {
      handleRequest(headers, content);
    } else {
      socket.read(socketId, function(readInfo) {
        content += arrayBufferToString(readInfo.data);
        contentLengthSoFar += readInfo.resultCode;
        readChunk();
      });
    }
  }

  function handleRequest(headers, content) {
    var methodEnd = headers.indexOf(" ");
    var uriEnd = headers.indexOf(" ", methodEnd + 1);
    var method = headers.substring(0, methodEnd);
    var uri = headers.substring(methodEnd + 1, uriEnd);
    var R = '';
    var valid = headers.split('\n').some(function(header) {
      return !!header.match(R);
    });

    if (method == 'GET') {
      // handle "hello" requests
      if (uri == '/hello') {
        sendResponse(socketId, 'Hello');
      } else {
        sendResponse(socketId, 'I have no idea what you\'re talking about');
      }
      socket.accept(socketInfo.socketId, onAccept);
    } else
    
    if (method == 'POST' && valid) {

      // parse post data
      if (content) {
        query = parseQuery(content);
      } else {
        query = {};
      }

      try {
        if (uri == '/start') {
            startRequest(socketId, query.request, query.type, query.data,
                query.aux);
        }
        else {
          var response = {error: 'Invalid request: '+uri};
          sendResponse(socketId, JSON.stringify(response));
        }
      } catch (e) {
      }
    } else {
      sendResponse(socketId, '{"error": "Only GET and POST supported"}');
    }
    socket.accept(socketInfo.socketId, onAccept);
  }
};

// request handlers
var startRequest = function(socketId, request, type, data, aux) {
  launchApp();
  if (!data) {
    info = {};
  } else {
    info = JSON.parse(data);
  }
  var requestObject = {
      reqId: request,
      socketId: socketId,
      type: type,
      info: info,
      aux: aux,
      completed: false};
  requests[request] = requestObject;

  // update the UI
  var contentWindowAddRequest = function() {
    try {
      uiWindow.contentWindow.addRequest(requestObject);
    } catch(e) {
      console.log('failed to add request, trying again in a moment...');
      setTimeout(contentWindowAddRequest, 10);
    }
  }
  contentWindowAddRequest();
}

var endRequest = function(socketId, request, retval, debug) {
  if (debug) {
    retval.debug = true;
  }
  // send a response to both sockets
  sendResponse(request.socketId, JSON.stringify(retval));
  if (socketId) {
    sendResponse(socketId, 'Responded to request '+request.reqId);
  }
  // mark the request as completed
  request.completed = true;
}

// function to launch the application
var launchApp = function() {
  if (!uiWindow || !uiWindow.contentWindow.window || uiWindow.contentWindow.closed) {
    console.log('popping window');
    forceLaunchApp();
  }
};

var forceLaunchApp = function(extraArgs) {
  chrome.app.window.create('window.html?'+extraArgs, {
    'id': 'UI',
    'bounds': {
      'width': 900,
      'height': 900
    }
  }, function(createdWindow) {
    uiWindow = createdWindow;
    uiWindow.onClosed.addListener(function(e) {
      for (request_id in requests) {
        if (!requests[request_id].completed) {
          forceLaunchApp('ignore=1');
          break;
        }
      }
    });
  });
}

// start listening on the socket
socket.create("tcp", {}, function(_socketInfo) {
  socketInfo = _socketInfo;
  try {
    socket.listen(socketInfo.socketId, "127.0.0.1", 34012, 20,
      function(result) {
        socket.accept(socketInfo.socketId, window.onAccept);
      }
    );
  } catch (e) {
    uiWindow.contentWindow.document.body.innerHTML =
        '<h1>Failed to start: port 34012 is in use.</h1>';
  }
});

// Someone clicked launch? show them the popup I guess...
chrome.app.runtime.onLaunched.addListener(launchApp);

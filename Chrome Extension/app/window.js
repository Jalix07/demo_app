
var background;
chrome.runtime.getBackgroundPage(function(bg){
  background = bg;
  });

var tablesrc;
var tableholder;
var table;
var display;
var actions;
var debug;
var ignore;

var yesFocus = true;
var currentFilter;
var currentView;

var addRequest = function(request) {
  background.requests[request.reqId] = request;
  background.request_order.push(request.reqId);
  showRequest(request);
}

var showRequest = function(request) {
  var uiRow = document.createElement('tr');
  uiRow.tabIndex = 1;
  uiRow.className = 'requestRow';
  var uiType = document.createElement('td');
  var uiMethod = document.createElement('td');
  var uiUri = document.createElement('td');
  var uiExtra = document.createElement('td');
  uiType.className = 'type';
  uiMethod.className = 'method';
  uiUri.className = 'uri';
  uiExtra.className = 'extra';
  uiType.innerText = request.type
  uiMethod.innerText = request.info.method ?
      request.info.method.toLowerCase() : '';
  uiUri.innerText = request.info.url || request.info.action;
  uiExtra.innerText = request.info.type || request.info.transitionType || '';
  uiRow.appendChild(uiType);
  uiRow.appendChild(uiMethod);
  uiRow.appendChild(uiUri);
  uiRow.appendChild(uiExtra);
  uiRow.setAttribute('data-reqId', request.reqId);

  table.appendChild(uiRow);
  activateRequest(request.reqId);
  uiRow.addEventListener('focus', function(event) {
    activateRequest(this.getAttribute('data-reqId'));
  });
  tableholder.scrollTop = tableholder.scrollHeight;
}

function activateRequest(reqId) {
  currentView = reqId;
  display.innerHTML = '<h1>Request Details</h1>';
  actions.innerHTML = '';
  var rows = table.getElementsByTagName('tr');
  for (var i=0; i<rows.length; i++) {
    if (rows[i].getAttribute('data-reqId') != reqId) {
      rows[i].classList.remove('active');
    } else {
      try {
        request = background.requests[reqId];
        rows[i].classList.add('active');
        
        if (!request.completed && ignore.checked) {
          releaseBlock(reqId, {}, true);
          rows[i].focus();
          // Refocus this request in 10ms once its completed
          let row = rows[i];
          setTimeout(_=>row.focus(),10);
        }
        if (request.type == 'blockReroute') {
          requestEdit(request);
        } else {
        }
      } catch(e) {
        
      }
    }
  }
}

function releaseBlock(reqId, retVal, keepActive) {
  var elem = table.getElementsByClassName('active')[0];
  var removeElem = currentFilter && !searchObject(
      currentFilter, background.requests[reqId]);

  if (reqId == currentView) {
    if (removeElem || !keepActive) {
      display.innerHTML = '';
      actions.innerHTML = '';
    }
  }

  if (removeElem) {
    elem.parentNode.removeChild(elem);
  } else if (!keepActive) {
    elem.classList.remove('active');
  }

  chrome.runtime.getBackgroundPage(function(bg) {
    bg.endRequest(false, background.requests[reqId], retVal, debug.checked);
  });
}

function requestEdit(request) {
  var t = createInputTable();
  display.appendChild(t);

  var method = createTrInput('Method:', 'method', request.info.method, false);
  t.appendChild(method.row);
  method.input.readOnly = true;

  var url = createTrInput('URL:', 'url', request.info.url);
  t.appendChild(url.row);

  if (request.aux) {
    var responseText = createTrInput('Contents', 'contentsTxt', request.aux,
        false, 'textarea');
    t.appendChild(responseText.row);
  }

  if (!request.completed) {
    var yesButton = document.createElement('button');
    yesButton.innerText = 'Allow';
    yesButton.onclick = function() {
      yesFocus = true;
      actions.innerHTML = '';
      result = {};
      if (request.info.url != url.input.value) {
        result.redirectUrl = url.input.value;
        request.info.url = url.input.value;
      }
      else if (responseText &&
               responseText.input.value != responseText.originalValue) {
        result.redirectUrl = "data:text/html;base64," +
            btoa(responseText.input.value);
        request.aux = responseText.input.value;
      }
      releaseBlock(request.reqId, result);
    };
    var noButton = document.createElement('button');
    noButton.className = 'no';
    noButton.innerText = 'Block';
    noButton.onclick = function() {
      yesFocus = false;
      actions.innerHTML = '';
      releaseBlock(request.reqId, {cancel: true});
    };
    actions.appendChild(yesButton);
    actions.appendChild(noButton);
    (yesFocus ? yesButton : noButton).focus();
  } else {
    
  }
}

// dom manipulation functions
function createInputTable() {
  var t = document.createElement('table');
  var row = createTr();
  t.appendChild(row.tr);

  t.className = 'inputTable';
  row.lbl.className = 'inputName';

  row.val.className = 'inputValue';

  return t;
}

function createTrInput(lbl, name, value, allowRemove, type) {
  var row = createTr();

  row.lbl.innerText = lbl;

  if (type == 'label') {
    row.val.innerText = value;
    return {row: row.tr};
  } else if (type == 'textarea') {
    var input = document.createElement('textarea');
    input.className = 'textarea';
  } else {
    var input = document.createElement('textarea');
    input.className = 'input';
  }
  input.value = value;
  input.name = name;
  row.val.appendChild(input);

  var del = false;

  return {row: row.tr, input: input, del: del, originalValue: value};
}

function createTr() {
  var tr = document.createElement('tr');
  var labelTd = document.createElement('td');
  var valueTd = document.createElement('td');
  valueTd.className = 'inputValue';
  tr.appendChild(labelTd);
  tr.appendChild(valueTd);

  return {tr: tr, lbl: labelTd, val: valueTd};
}


document.addEventListener('DOMContentLoaded', function() {requestlist
  tableholder = document.getElementById('requesttablewrapper');
  table = document.getElementById('requesttable');
  display = document.getElementById('requestdetails');
  actions = document.getElementById('requestactions');
  debug = document.getElementById('debug');
  ignore = document.getElementById('ignore');
  ignore.checked = !!location.href.match('ignore=1');
});

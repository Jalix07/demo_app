// we need this for communication with the background script
try {
  var tabId = chrome.devtools.inspectedWindow.tabId;
  var port = chrome.extension.connect({name: "INSPECT"});
  function setupPort() {
      port.onMessage.addListener(function(x) {
          debugger;
      });
      port.onDisconnect.addListener(function(x) {
          port = chrome.extension.connect({name: "INSPECT"});
          setupPort();
      });
  }
} catch(e) {
}

onload = function() {
  // define the features
  var features = [
      { 'category': 'blockReroute',
        'sidebar': 'Block / allow Requests',
        'title': 'Block Requests / Edit Resources',
        'description': 'Block or reroute requests',
      } 
  ];
  var sidebar_ul = document.getElementById('sidebar_ul');
  var main = document.getElementById('main');
  var selectedFeature = 0;
  
  // for enabling one of the sidebar entries when its checkbox is clicked
  var enableOption = function(elem) {
    var number = elem.getAttribute('data-number');
    if (elem.checked) {
      features[number].sb_clickable.classList.add('enabled');
      features[number].optionsPane.classList.add('enabled');
    } else {
      features[number].sb_clickable.classList.remove('enabled');
      features[number].optionsPane.classList.remove('enabled');
    }
  }
  for (var i = 0; i < features.length; i++) {
    // create sidebar elements
    var li = document.createElement('li');
    var clickable = document.createElement('a');
    var checkbox = document.createElement('input');
    checkbox.setAttribute('type', 'checkbox');
    checkbox.setAttribute('data-number', i);
    checkbox.setAttribute('data-category', features[i].category);
    clickable.appendChild(checkbox);
    clickable.insertAdjacentText('beforeend', features[i].sidebar);
    clickable.setAttribute('data-number', i);
    li.appendChild(clickable);
    sidebar_ul.appendChild(li);

    // create main area elements
    var optionsPane = document.createElement('div');
    var title = document.createElement('h1');
    var description = document.createElement('span');
    description.className = 'description';
    description.innerText = features[i].description;
    title.innerText = features[i].title;
    optionsPane.appendChild(title);
    optionsPane.appendChild(description);
    main.appendChild(optionsPane);
    features[i].sb_li  = li;
    features[i].sb_clickable = clickable;
    features[i].sb_checkbox = checkbox;
    features[i].optionsPane = optionsPane;
    
    checkbox.onchange = function(e) {
      enableOption(this);
      if (this.getAttribute('data-category') == 'interceptPost') {
        interceptRequests = this.checked;
      }
      port.postMessage({
        tabId: tabId,
        key: this.getAttribute('data-category'),
        value: this.checked});
      toggleDevToolsHelper(features[this.getAttribute('data-number')]);
    }
    // handle options pane
    switch (features[i].category) {
      case 'blockReroute':
        var optPane = document.createElement('div');
        optPane.className = 'optionsPane';
        optionsPane.appendChild(optPane);
        break;
    }
  }
  selectOption(features[selectedFeature].sb_clickable);

};


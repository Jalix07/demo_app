
window.onload = function(){
    jQuery("#button").bind("mousedown", function(e) {
      var data = jQuery('form');
      var pdata = JSON.stringify(data.serializeArray());
      //alert(pdata);
      setTimeout(function() {
        jQuery.ajax({
          xhrFields: {
            withCredentials: true
          },
          type: "POST",
          async: true,
          url: 'http://localhost:8066/',
          data: pdata,
          jsonpCallback: 'callback',
          dataType: 'jsonp',
          crossDomain: true,
        }).done(function(response){
          console.log(response);
      }).fail(function(error){
          console.log(error.statusText);
      });
      }, 250);
    });
  };

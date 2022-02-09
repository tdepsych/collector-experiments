function requestFullScreen(element) {
    // Supports most browsers and their versions.
    var requestMethod =
      element.requestFullScreen ||
      element.webkitRequestFullScreen ||
      element.mozRequestFullScreen ||
      element.msRequestFullScreen;
  
    if (requestMethod) {
      // Native full screen.
      requestMethod.call(element);
    } else if (typeof window.ActiveXObject !== "undefined") {
      // Older IE.
      var wscript = new ActiveXObject("WScript.Shell");
      if (wscript !== null) {
        wscript.SendKeys("{F11}");
      }
    }
  }

var img = new Image();
    img.src="../User/Assets/uor.svg";
var messageText = "{{text}}";

$(document).ready(function() {
  if((window.fullScreen) ||
   (window.innerWidth == screen.width && window.innerHeight == screen.height)) {
        $('#aniCont').html('<div class="animation-container"><div class="image-container"><img src="' + img.src + '" /></div><div class="text-container"><h1>' + messageText + '</h1><div class="fading-effect"></div></div></div>');
      } else {
    bootbox.confirm({
        message: "This experiment needs to be run in full screen mode, to engage this, please click below",
        buttons: {
            confirm: {
                label: 'Engage Full Screen Mode',
            },
            cancel: {
                label: 'No',
            }
        },
        callback: function (result) { 
            requestFullScreen(document.documentElement);
            // alert('This was logged in the callback: ' + result);
            $('#aniCont').html('<div class="animation-container"><div class="image-container"><img src="' + img.src + '" /></div><div class="text-container"><h1>' + messageText + '</h1><div class="fading-effect"></div></div></div>');
            }
    })
  }
});
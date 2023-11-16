if (parent.parent.current_zoom == null){
  parent.parent.current_zoom = 1;
}else {
  parent.parent.current_zoom = parent.parent.current_zoom;
}

$.fn.isInViewport = function() {
  var elementTop = $(this).offset().top;
  var elementBottom = elementTop + $(this).outerHeight();
  var viewportTop = $(window).scrollTop();
  var viewportBottom = viewportTop + $(window).height();
  return elementBottom > viewportTop && elementTop < viewportBottom;
};
   
function zoom_in() {
  if ($('#zoomOut').isInViewport()) {
    parent.parent.current_zoom += 0.1;
  } else {
    // appropriate_message("This will zoom in beyond your screen size");
    console.log("It'd break");
    parent.parent.current_zoom = 1;
  }
  document.body.style.zoom = parent.parent.current_zoom;
  document.body.style.MozTransform = "scale(" + parent.parent.current_zoom + ")";
  document.body.style.overflowX = "hidden";
  // document.body.style.transformOrigin = "center center";

}
function zoom_out() {
  parent.parent.current_zoom -= 0.1;
  document.body.style.zoom = parent.parent.current_zoom;
  document.body.style.MozTransform = "scale(" + parent.parent.current_zoom + ")";
  document.body.style.overflowX = "hidden";
  // document.body.style.transformOrigin = "center center";
}

window.onload = function(){ 
  $("#zoomIn").click(zoom_in);
  $("#zoomOut").click(zoom_out);
}

// Just hiding this in here as it's mainly a globally loaded file - might have to move one day
function appropriate_message(this_message) {
  bootbox.alert(this_message);
}
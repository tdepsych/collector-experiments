if (parent.parent.current_zoom == null){
  parent.parent.current_zoom = 1;
}else {
  parent.parent.current_zoom = parent.parent.current_zoom;
}
   
function zoom_in() {
  parent.parent.current_zoom += 0.1;
    // document.body.style.MozTransform = "scale(" + parent.parent.current_zoom + ")";
  $('#container').css("transform", "scale(" + parent.parent.current_zoom + ")");
  $('#container').transformOrigin = "center center";
  // document.body.style.zoom = parent.parent.current_zoom;
  document.body.style.overflowX = "hidden";
  console.log("working?")
}

function zoom_out() {
  parent.parent.current_zoom -= 0.1;
  // document.body.style.MozTransform = "scale(" + parent.parent.current_zoom + ")";
  $('#container').css("transform", "scale(" + parent.parent.current_zoom + ")");
  $('#container').transformOrigin = "center center";
  // document.body.style.zoom = parent.parent.current_zoom;
  document.body.style.overflowX = "hidden";
}

window.onload = function(){ 
  $("#zoomIn").click(zoom_in);
  $("#zoomOut").click(zoom_out);
}

// Just hiding this in here as it's mainly a globally loaded file - might have to move one day
function appropriate_message(this_message) {
  bootbox.alert(this_message);
}
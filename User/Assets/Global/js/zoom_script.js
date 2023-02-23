if (parent.parent.current_zoom == null){
  parent.parent.current_zoom = 1;
}else {
  parent.parent.current_zoom = parent.parent.current_zoom;
}

function zoom_in() {
  parent.parent.current_zoom += 0.1;
  document.body.style.zoom = parent.parent.current_zoom;
  document.body.style.MozTransform = "scale(" + parent.parent.current_zoom + ")";
  document.body.style.overflowX = "hidden";
  document.body.style.transformOrigin = "center center";
}
function zoom_out() {
  parent.parent.current_zoom -= 0.1;
  document.body.style.zoom = parent.parent.current_zoom;
  document.body.style.MozTransform = "scale(" + parent.parent.current_zoom + ")";
  document.body.style.overflowX = "hidden";
  document.body.style.transformOrigin = "center center";
}

window.onload = function(){ 
  $("#zoomIn").click(zoom_in);
  $("#zoomOut").click(zoom_out);
}
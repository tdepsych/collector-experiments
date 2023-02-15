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
}
function zoom_out() {
  parent.parent.current_zoom -= 0.1;
  document.body.style.zoom = parent.parent.current_zoom;
  document.body.style.MozTransform = "scale(" + parent.parent.current_zoom + ")";
  document.body.style.overflowX = "hidden";
}

window.onload = function(){ 
  document.getElementById("zoomIn").onclick = zoom_in;
  document.getElementById("zoomOut").onclick = zoom_out;
}
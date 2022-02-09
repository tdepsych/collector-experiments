parent.parent.current_zoom = 1;

function zoom_in() {
  parent.parent.current_zoom += 0.1;
  document.body.style.zoom = parent.parent.current_zoom;
  document.body.style.MozTransform =
    "scale(" + parent.parent.current_zoom + ")";
  document.body.style.width = window.innerWidth / parent.parent.current_zoom;
  document.body.style.height =
    window.innerHeight / parent.parent.current_zoom;
  document.body.style.transformOrigin = "left top";
}
function zoom_out() {
  parent.parent.current_zoom -= 0.1;
  document.body.style.zoom = parent.parent.current_zoom;
  document.body.style.MozTransform =
    "scale(" + parent.parent.current_zoom + ")";
  document.body.style.width = window.innerWidth / parent.parent.current_zoom;
  document.body.style.height =
    window.innerHeight / parent.parent.current_zoom;
  document.body.style.transformOrigin = "left top";
}

document.getElementById("zoomIn").onclick = zoom_in;
document.getElementById("zoomOut").onclick = zoom_out;
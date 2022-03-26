if (parent.parent.current_zoom == null){
  parent.parent.current_zoom = 1;
}else {
  parent.parent.current_zoom = parent.parent.current_zoom;
}

function zoom_in() {
  parent.parent.current_zoom += 0.1;
  document.body.style.zoom = parent.parent.current_zoom;
  document.body.style.MozTransform =
    "scale(" + parent.parent.current_zoom + ")";
    // if (isFirefox) {
    //   this_iframe_style.width =
    //   (window.innerWidth * 0.97) / parent.parent.current_zoom;
    //   this_iframe_style.height =
    //   (window.innerHeight * 0.97)  / parent.parent.current_zoom;
    //   this_iframe_style.maxWidth =
    //   (window.innerWidth * 0.97) / parent.parent.current_zoom;
    //   this_iframe_style.maxHeight =
    //   (window.innerHeight * 0.97)  / parent.parent.current_zoom;
    //   // this_iframe_style.transformOrigin = "left top";
    //   // this_iframe_style.transformBox = "fill-box";
    // } else {
    //   this_iframe_style.width = "100%";
    //   this_iframe_style.height = "100%";
    // }
  // document.body.style.transformOrigin = "center top";
  document.body.style.overflowX = "hidden";
}
function zoom_out() {
  parent.parent.current_zoom -= 0.1;
  document.body.style.zoom = parent.parent.current_zoom;
  document.body.style.MozTransform =
    "scale(" + parent.parent.current_zoom + ")";
    // if (isFirefox) {
    //   this_iframe_style.width =
    //   (window.innerWidth * 0.97) / parent.parent.current_zoom;
    //   this_iframe_style.height =
    //   (window.innerHeight * 0.97)  / parent.parent.current_zoom;
    //   this_iframe_style.maxWidth =
    //   (window.innerWidth * 0.97) / parent.parent.current_zoom;
    //   this_iframe_style.maxHeight =
    //   (window.innerHeight * 0.97)  / parent.parent.current_zoom;
    //   // this_iframe_style.transformOrigin = "50% 0%";
    // } else {
    //   this_iframe_style.width = "100%";
    //   this_iframe_style.height = "100%";
    // }
  // document.body.style.transformOrigin = "left top";
  document.body.style.overflowX = "hidden";
}

window.onload = function(){ 
  document.getElementById("zoomIn").onclick = zoom_in;
  document.getElementById("zoomOut").onclick = zoom_out;
}
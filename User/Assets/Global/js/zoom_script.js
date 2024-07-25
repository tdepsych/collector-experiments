/*  
*  Javascript code for controling the zoom buttons and maintaining scaling across subsequent pages
*/

if (parent.parent.current_zoom == null){
  parent.parent.current_zoom = 1;
}else {
  parent.parent.current_zoom = parent.parent.current_zoom;
}
   
function zoom_in() {
  parent.parent.current_zoom += 0.1;
  $('#container, #survey_container').css("transform", "scale(" + parent.parent.current_zoom + ")");
  $('#container, #survey_container').css('transform-origin', '50% 0');
  document.body.style.overflowX = "hidden";
  console.log("working?")
}

function zoom_out() {
  parent.parent.current_zoom -= 0.1;
  $('#container, #survey_container').css("transform", "scale(" + parent.parent.current_zoom + ")");
  $('#container, #survey_container').css('transform-origin', '50% 0');
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

// function show_hideProgressBar() {
//   var firstIframeDocument = window.parent.document;

// // Access the grandparent (the main page) document
// var mainPageDocument = firstIframeDocument.defaultView.parent.document;

// // Access the element with the id "project_progress_bar" on the main page
// var progressBarElement = mainPageDocument.getElementById("project_progress_bar");

// // Ensure the element is found and then interact with it
// if (progressBarElement) {
//     // Example: log the content or manipulate the element
//     console.log(progressBarElement.textContent); // Logs the text content of the element

//     // Example: Modify the style or other properties
//     progressBarElement.style.display = "none"; // Changes the background color
// } else {
//     console.log("Element with id 'project_progress_bar' not found.");
//     progressBarElement.style.display = "block"; // Changes the background color
// }
// }
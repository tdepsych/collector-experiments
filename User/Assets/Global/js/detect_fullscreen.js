// Script for detecting if a page is in full screen and asking the user to enter fullscreen if it's not
function isAppleMobile() {
  var ua = navigator.userAgent || "";
  var platform = navigator.platform || "";
  var maxTouchPoints = navigator.maxTouchPoints || 0;

  return /iPhone|iPod/.test(ua) ||
         /iPad/.test(ua) ||
         (/Mac/.test(platform) && maxTouchPoints > 1);
}

function getGuardWindow() {
  try {
    if (parent.parent) {
      return parent.parent;
    }
  } catch (e) {}

  try {
    if (parent) {
      return parent;
    }
  } catch (e) {}

  return window;
}

function getCandidateDocs() {
  var docs = [];
  try { docs.push(parent.parent.document); } catch (e) {}
  try { docs.push(parent.document); } catch (e) {}
  docs.push(document);

  return docs.filter((doc, i) => docs.indexOf(doc) === i);
}

function getFullscreenElement(doc) {
  if (!doc) return null;
  return (
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement ||
    null
  );
}

function isStudyFullscreen() {
  var docs = getCandidateDocs();

  // 1. True fullscreen API check (most reliable)
  for (var i = 0; i < docs.length; i++) {
    try {
      if (getFullscreenElement(docs[i])) {
        return true;
      }
    } catch (e) {}
  }

  // 2. Fallback ONLY if fullscreen API is unavailable
  // (important for some Apple / mobile cases)

  var apiAvailable = false;

  for (var i = 0; i < docs.length; i++) {
    try {
      if (
        docs[i].fullscreenEnabled ||
        docs[i].webkitFullscreenEnabled ||
        docs[i].mozFullScreenEnabled ||
        docs[i].msFullscreenEnabled
      ) {
        apiAvailable = true;
        break;
      }
    } catch (e) {}
  }

  // If API exists but no fullscreen element → NOT fullscreen
  if (apiAvailable) {
    return false;
  }

  // 3. Fallback (only for devices without fullscreen API)
  try {
    if (
      parent.parent.window.innerWidth === parent.parent.screen.width &&
      parent.parent.window.innerHeight === parent.parent.screen.height
    ) {
      return true;
    }
  } catch (e1) {}

  try {
    if (
      parent.window.innerWidth === parent.screen.width &&
      parent.window.innerHeight === parent.screen.height
    ) {
      return true;
    }
  } catch (e2) {}

  try {
    if (
      window.innerWidth === screen.width &&
      window.innerHeight === screen.height
    ) {
      return true;
    }
  } catch (e3) {}

  return false;
}

function requestFullscreenOnElement(el) {
  try {
    if (el.requestFullscreen) return el.requestFullscreen();
    if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
    if (el.mozRequestFullScreen) return el.mozRequestFullScreen();
    if (el.msRequestFullscreen) return el.msRequestFullscreen();
  } catch (e) {
    console.log("Fullscreen request failed:", e);
  }
}

function requestStudyFullscreen() {
  try {
    if (parent.parent?.document?.documentElement) {
      requestFullscreenOnElement(parent.parent.document.documentElement);
      return;
    }
  } catch (e) {}

  try {
    if (parent?.document?.documentElement) {
      requestFullscreenOnElement(parent.document.documentElement);
      return;
    }
  } catch (e) {}

  requestFullscreenOnElement(document.documentElement);
}

function getBootboxContext() {
  try {
    if (parent.parent && parent.parent.bootbox) {
      return parent.parent.bootbox;
    }
  } catch (e) {}

  try {
    if (parent && parent.bootbox) {
      return parent.bootbox;
    }
  } catch (e) {}

  return bootbox;
}

function showFullscreenPrompt() {
  var thisBootbox = getBootboxContext();
  var guardWindow = getGuardWindow();

  if (guardWindow.fullscreenPromptOpen === true) {
    return;
  }

  guardWindow.fullscreenPromptOpen = true;

  thisBootbox.dialog({
    title: "Full screen recommended",
    message:
      "To ensure the study looks as intended, please run this study in full screen mode.",
    closeButton: false,
    centerVertical: true,
    backdrop: "static",
    onEscape: false,
    buttons: {
      fullscreen: {
        label: "Enter Full Screen",
        className: "btn-primary",
        callback: function () {
          requestStudyFullscreen();
          guardWindow.fullscreenPromptOpen = false;
        }
      }//,
      // continue: {
      //   label: "Continue anyway",
      //   className: "btn-secondary",
      //   callback: function () {
      //     guardWindow.fullscreenPromptOpen = false;
      //   }
      // }
    }
  });
}

$(document).ready(function () {
  var guardWindow = getGuardWindow();

  setTimeout(function () {
    if (isAppleMobile()) {
      guardWindow.fullscreenPromptOpen = false;
      return;
    }

    if (!isStudyFullscreen()) {
      showFullscreenPrompt();
    } else {
      guardWindow.fullscreenPromptOpen = false;
    }
  }, 250);
});
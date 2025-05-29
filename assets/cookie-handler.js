function readCookie(name) {
  var nameEQ = name + "=";
  var ca = document.cookie.split(';');
  for(var i=0;i < ca.length;i++) {
      var c = ca[i];
      while (c.charAt(0)==' ') c = c.substring(1,c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
  }
  return null;
}

function setCookie(name, value, days) {
  var expires = "";
  if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days*24*60*60*1000));
      expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

function setCookieShort(name, value, seconds) {
  var expires = "";
  if (seconds) {
      var date = new Date();
      date.setTime(date.getTime() + (seconds*1000));
      expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

function addPageVisit() {
  var page = window.location.pathname;
  var timestamp = new Date().toISOString();

  // Read existing visits
  var visits = readCookie("previousPages");
  var visitArray = [];
  if (visits) {
    try {
      visitArray = JSON.parse(decodeURIComponent(visits));
    } catch (e) {
      console.warn("Corrupted cookie, resetting.");
      visitArray = [];
    }
  }

  // Add new visit
  visitArray.push([page, timestamp]);

  // Trim if too long to fit in cookie (optional)
  if (JSON.stringify(visitArray).length > 3500) {
    visitArray.shift();  // drop the oldest
  }

  // Save back
  setCookie("previousPages", JSON.stringify(visitArray), 30); // keep 1 day
}

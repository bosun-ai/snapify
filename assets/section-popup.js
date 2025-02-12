function splitName(element) {
          const fullName = document.getElementById(element).value.trim();
          const names = fullName.split(' ');
      
          const firstName = names[0];
          const lastName = names.length > 1 ? names.slice(1).join(' ') : '';
      
          document.getElementById('FirstNameHidden').value = firstName;
          document.getElementById('LastNameHidden').value = lastName;
      }

function handleErrors(textfield, valueMissing, typeMismatch) {
    // 'setCustomValidity not only sets the message, but also marks
    // the field as invalid. In order to see whether the field really is
    // invalid, we have to remove the message first
    console.log(textfield.validity);
    textfield.setCustomValidity('');
    if (!textfield.validity.valid) {
      if (textfield.validity.valueMissing) {
        textfield.setCustomValidity(valueMissing);  
      } else if (textfield.validity.typeMismatch) {
        textfield.setCustomValidity(typeMismatch);  
      }
    }
}
function checkName(errorFirst, errorLast) {
  const firstName = document.getElementById('FirstNameHidden').value.toLowerCase();
  const lastName = document.getElementById('LastNameHidden').value.toLowerCase();
  var errorMessage = document.getElementById("errorName");
  var submitBtn = document.getElementById('Subscribe');
  if (firstName.length < 3) {
    errorMessage.textContent = errorFirst;
    submitBtn.disabled = true;
    return;
  }
  if (lastName.length < 3) {
    errorMessage.textContent = errorLast;
    submitBtn.disabled = true;
    return;
  }
  errorMessage.textContent = '';
  submitBtn.disabled = false;
}

let timeInMilliseconds = 90000; // Default to 20 seconds

const articleElement = document.querySelector('article');

if (articleElement) {
    const blogContent = articleElement.innerText;
    const wordCount = blogContent.split(/\s+/).filter(Boolean).length; // filter(Boolean) removes any empty strings

    if (wordCount > 0) {
        const averageReadingSpeed = 225; // words per minute
        const timeToReadHalf = (wordCount / 2) / averageReadingSpeed; // time in minutes
        timeInMilliseconds = timeToReadHalf * 60 * 1000;
    }
}
var isModalShown = false;

function showModal(customerMarketing) {
  var modal = document.getElementById("myModal");
  var reopenButton = document.getElementById("reopenButton");
  if (readCookie('subscribed') !== null || customerMarketing === 'true') {
    console.log('Already subscribed, so skipping to show newsletter');
    return;
  }
  if(readCookie('showedPopup') === null) {
    modal.style.display = "block";
    isModalShown = true;
    gtag('event', 'newsletterPopup', {
        'event_category': 'viewed',
        'event_value': 0
    });
  } else {
    modal.style.display = "none";
    reopenButton.style.display = "block"; // Show the "Take the quiz" button     
  }
}
function displayPopupAfterTime(customerMarketing) {
    var reopenButton = document.getElementById("reopenButton");
    setTimeout(function() {
        if (!isModalShown){
            reopenButton.style.display = "block";
        }
    }, timeInMilliseconds);
        // Listen for visibility change (tab switch or window minimize)
    document.addEventListener("visibilitychange", function() {
        if (document.hidden && !isModalShown) {
            reopenButton.style.display = "block";
        }
    });
        // Listen for mouse leaving the viewport towards the top
    document.addEventListener("mouseleave", function(event) {
        if (!isModalShown && event.clientY <= 0) {
            reopenButton.style.display = "block";
        }
    });
}
function start() {
  var modal = document.getElementById("myModal");
  var reopenButton = document.getElementById("reopenButton"); 
    
    var modalThank = document.getElementById("thankYouModal");
    var closeBtn = document.querySelector(".close-btn");
    // var closeBtn2 = document.getElementById("closeBtn2");
    var closeBtn3 = document.getElementById("closeBtn3");
    if (window.location.search.includes('customer_posted=true')) {
        // Show the thank-you modal
        document.getElementById('thankYouModal').style.display = 'block';
        isModalShown = true;
        setCookie('subscribed', 'true', 3000); // save longer if they are subscribed
    }
    if (window.location.search.includes('newsletter=')) {
        // Show the thank-you modal
        modal.style.display = 'block';
        isModalShown = true;
    }

    closeBtn.onclick = function() {
         modal.style.display = "none";
         reopenButton.style.display = "block"; // Show the "Take the quiz" button
         setCookie('showedPopup', 'true', 7);
     }
    closeBtn3.onclick = function() {
        modalThank.style.display = "none";
        reopenButton.style.display = "block"; // Show the "Take the quiz" button
        setCookie('showedPopup', 'true', 7);
    }

    reopenButton.onclick = function() {
        modal.style.display = "block";
        reopenButton.style.display = "none"; // Hide the "Take the quiz" button
        isModalShown = true;
    }

  modal.querySelector(".newsletter-form").addEventListener('submit', function() {
      gtag('event', 'newsletterPopup', {
          'event_category': 'form_submitted',
          'event_value': 1
      });
  });
}

// Function to close the thank-you modal
function closeThankYouModal() {
    document.getElementById('thankYouModal').style.display = 'none';
}
  
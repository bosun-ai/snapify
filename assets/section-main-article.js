
document.addEventListener("DOMContentLoaded", function() {
    const contentAreas = document.querySelectorAll('.article-content, .article-template__content');
    let tocHtml = '<div class="table-of-contents"><ul>';

    let allHeaders = [];

    // Collect all headers from all content areas
    contentAreas.forEach(contentArea => {
        const headers = contentArea.querySelectorAll('h2, h3, h4, h5, h6');
        headers.forEach(header => {
            allHeaders.push(header);
        });
    });

    // Only use h2 for FAQ
    document.querySelectorAll('#faq').forEach(contentArea => {
        const headers = contentArea.querySelectorAll('h2');
        headers.forEach(header => {
            allHeaders.push(header);
        });
    });

    let currentH2 = null;
    let currentNestedHeaders = '';

    allHeaders.forEach((header, index) => {
        const headerId = `header-${index}`;
        header.setAttribute('id', headerId);

        if (header.tagName.toLowerCase() === 'h2') {
            // Close the previous nested header list, if any
            if (currentH2) {
                tocHtml += '</ul>'; // Close previous nested list
            }

            currentNestedHeaders = [];
            for (let i = index + 1; i < allHeaders.length; i++) {
                if (allHeaders[i].tagName.toLowerCase() === 'h2') break;
                if (['h3', 'h4', 'h5', 'h6'].includes(allHeaders[i].tagName.toLowerCase())) {
                    currentNestedHeaders.push(allHeaders[i]);
                }
            }

            // Use a placeholder for the icon
            tocHtml += `
                <li class="h2-item">
                  <div style="display: flex">
                    <a href="#${headerId}" style="width: 33vw;">${header.textContent}</a>
                    ${currentNestedHeaders.length > 0 ? `
                    <button type="button" class="slider-button collapsed svg-arrow" aria-label="Toggle H3-H6 visibility" style="height: fit-content;width: 3.5rem;margin-top: auto;margin-bottom: auto;color: #17161c" data-icon-caret></button>` : ''}
                  </div>
                  ${currentNestedHeaders.length > 0 ? `<ul style="display:none;width: 25vw;list-style: disc;">` : '<ul>'}`; // Hide if there are nested headers
            currentH2 = header;
        } else if (currentNestedHeaders && (header.tagName.toLowerCase() === 'h3' || header.tagName.toLowerCase() === 'h4' || header.tagName.toLowerCase() === 'h5' || header.tagName.toLowerCase() === 'h6')) {
            tocHtml += `<li class="${header.tagName.toLowerCase()}-item"><a href="#${headerId}">${header.textContent}</a></li>`;
        }
    });

    if (currentH2) {
        tocHtml += '</ul>'; // Close the last nested list
    }

    tocHtml += '</ul></div>';

    const tocPlaceholder = document.getElementById('table-of-contents');
    if (allHeaders.length > 5) { // dont show a table of content if less than 5 entries
        document.getElementById('table-of-contents-title').style.display = 'block';
        tocPlaceholder.innerHTML = tocHtml;

        // Replace placeholder with actual Liquid icon
        tocPlaceholder.querySelectorAll('[data-icon-caret]').forEach(function(button) {
            button.innerHTML = document.getElementById('icon-caret-template').innerHTML;
        });
    }

    function adjustScrollPosition() {
        const headerHeight = 11 * 16; // 11rem in pixels (1rem = 16px)
        if (window.location.hash) {
            window.scrollBy(0, -headerHeight);
        }
    }

    // Add click event listeners to slider buttons for toggling h3-h6 visibility
    const sliderButtons = tocPlaceholder.querySelectorAll('.slider-button');
    sliderButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault(); // Prevent default button behavior
            const h3List = this.closest('li').querySelector('ul'); // Find the next ul element within the same li
            if (h3List && h3List.tagName.toLowerCase() === 'ul') {
                h3List.style.display = h3List.style.display === 'none' ? 'block' : 'none';
            }
            button.classList.toggle('collapsed');
        });
    });

    // Add click event listeners to all TOC links to adjust scroll position
    const tocLinks = tocPlaceholder.querySelectorAll('a[href^="#"]');
    tocLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            setTimeout(adjustScrollPosition, 0);
        });
    });

    // Adjust scroll position on page load if there's a hash in the URL
    window.addEventListener('load', adjustScrollPosition);
});
async function sendCommentNotification() {
    var formdata = new FormData();
    formdata.append("post_url", window.location.href);
    formdata.append("author", document.getElementById('CommentForm-author').value);
    formdata.append("email", document.getElementById('CommentForm-email').value);
    formdata.append("blog_comment", document.getElementById('CommentForm-body').value);
    response = await fetch('https://automations.for-sure.net:4193/comment', {
      method: 'POST',
      body: formdata
    });
    console.log(response);
  }
function hasAncestorWithClass(element, className) {
  while (element) {
      if (element.classList && element.classList.contains(className)) {
          return true;
      }
      element = element.parentElement;
  }
  return false;
}
var links = document.getElementsByTagName("a");
for (var i = 0; i < links.length; i++) {
    var href = links[i].getAttribute('href');
    if (!links[i].classList.contains("link_same_tab") && hasAncestorWithClass(links[i], "article-template") && href && !href.includes('for-sure.net')) {
        links[i].setAttribute("target", "_blank");
    }
}
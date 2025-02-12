
  var header = document.getElementById('shopify-section-header');
  header.classList.add('shopify-section-header-sticky');
  class StickyHeader extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.header = document.getElementById('shopify-section-header');
      this.headerBounds = {};
      this.currentScrollTop = 0;
      this.preventReveal = false;
      this.predictiveSearch = this.querySelector('predictive-search');

      // this.onScrollHandler = this.onScroll.bind(this);
      this.hideHeaderOnScrollUp = () => this.preventReveal = true;

      this.addEventListener('preventHeaderReveal', this.hideHeaderOnScrollUp);
      window.addEventListener('scroll', this.onScrollHandler, false);

      this.createObserver();
    }

    disconnectedCallback() {
      this.removeEventListener('preventHeaderReveal', this.hideHeaderOnScrollUp);
      window.removeEventListener('scroll', this.onScrollHandler);
    }

    createObserver() {
      let observer = new IntersectionObserver((entries, observer) => {
        this.headerBounds = entries[0].intersectionRect;
        observer.disconnect();
      });

      observer.observe(this.header);
    }

    closeMenuDisclosure() {
      this.disclosures = this.disclosures || this.header.querySelectorAll('header-menu');
      this.disclosures.forEach(disclosure => disclosure.close());
    }
  }

  customElements.define('sticky-header', StickyHeader);

function addEventListenersHeader(index) {
    const detailsElement = document.getElementById(`Details-HeaderMenu-${index}`);
    const hiddenMenu = document.getElementById(`MegaMenu-Content-${index}`);
    const buttonText = document.getElementById(`spanned-${index}`);
    const width = buttonText.getBoundingClientRect().width;
    detailsElement.addEventListener("mouseenter", function() {
      hiddenMenu.style.display = "block";
      detailsElement.setAttribute("open", "");
      hiddenMenu.style.width = (width * 2) + "px";
      hiddenMenu.style.transform = "translateX(-17%)";
    });
    detailsElement.addEventListener("mouseleave", function() {
      hiddenMenu.style.display = "none";
     detailsElement.removeAttribute("open");
    });
  }
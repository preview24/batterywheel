(function ($) {
    "use strict";

    

    
    // Back to top button
    $(document).ready(function() {
      // show/hide the button on scroll
      $(window).scroll(function() {
        if ($(this).scrollTop() > 400) {
          $('.back-to-top').fadeIn();
        } else {
          $('.back-to-top').fadeOut();
        }
      });
      
      // scroll to top when the button is clicked
      $('.back-to-top').click(function() {
        $('body,html').animate({
          scrollTop: 0
        }, 300);
        return false;
      });
    });



    $(document).ready(function() {
      // Get all menu items
      var menuItems = $('.nav-link');
      
      // Attach scroll event listener to window
      $(window).scroll(function() {
        // Get the current vertical position of the window
        var scrollPosition = $(window).scrollTop();

        // Loop through each section
        $('section').each(function() {
          // Get the top and bottom position of the section
          var sectionTop = $(this).offset().top;
          var sectionBottom = sectionTop + $(this).outerHeight();

          // If the current scroll position is within the section
          if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
            // Get the id of the section
            var sectionId = $(this).attr('id');
            
            // Loop through each menu item
            menuItems.each(function() {
              // If the menu item links to the current section
              if ($(this).attr('href') === '#' + sectionId) {
                // Remove active class from all menu items and add it to the current menu item
                menuItems.removeClass('active');
                $(this).addClass('active');
              }
            });
          }
        });
      });
    });




// jQuery DatePicker
$(document).ready(function() {

    $('.date').datepicker({
        dateFormat: 'dd-mm-yy', // Set the date format
        changeMonth: true, // Allow changing of months
        changeYear: true, // Allow changing of years
        // Additional options can be added here
    });

});





$(document).ready(function(){
  $('.slick-slider').slick({
    slidesToShow: 3.7,
    slidesToScroll: 1,
    centerMode: true,
    infinite: true,
    autoplay: false,
    autoplaySpeed: 2000,
    dots: false,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2.5,
          slidesToScroll: 1
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1
        }
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1
        }
      }
    ]
  });

  // Function to equalize review-block heights
  function equalizeReviewBlockHeights() {
    var maxHeight = 0;

    // Reset all heights first
    $('.review-block').height('auto');
    
    // Find the tallest review-block
    $('.review-block').each(function() {
      var height = $(this).outerHeight();
      if (height > maxHeight) {
        maxHeight = height;
      }
    });

    // Set all review-blocks to the tallest height
    $('.review-block').height(maxHeight);
  }

  // Run the function when the slider is initialized
  equalizeReviewBlockHeights();

  // Recalculate heights after each slide change
  $('.slick-slider').on('afterChange', function() {
    equalizeReviewBlockHeights();
  });
});



document.addEventListener('DOMContentLoaded', () => {
    const elements = document.querySelectorAll('[data-ani]');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                element.classList.add('astart');
                observer.unobserve(element); // Stop observing once animated
            }
        });
    }, { threshold: 0.1 }); // Trigger when 10% of the element is in view

    elements.forEach(element => {
        observer.observe(element);
    });
});







// Lightweight gallery modal with prev/next
$(function() {
  var $items = $('.gallery-block'); // each block containing img + h4
  var images = []; // array of {src, alt, caption}
  var currentIndex = 0;
  var $modal = $('#lightGalleryModal');
  var $img = $('#lightGalleryImage');
  var $caption = $('#lightGalleryCaption');

  // Build images array from DOM order (so next/prev follows your markup)
  $items.each(function() {
    var $block = $(this);
    var $imgEl = $block.find('img').first();
    var caption = $block.find('h4').first().text().trim() || '';
    images.push({
      src: $imgEl.attr('src'),
      alt: $imgEl.attr('alt') || caption,
      caption: caption
    });
  });

  // helper to show image by index
  function showImage(index) {
    if (images.length === 0) return;
    currentIndex = (index + images.length) % images.length; // wrap safely
    var it = images[currentIndex];

    // update image + caption
    $img.attr('src', it.src).attr('alt', it.alt);
    $caption.text(it.caption);

    // optionally preload next image to make transitions smoother
    var nextIdx = (currentIndex + 1) % images.length;
    $('<img/>')[0].src = images[nextIdx].src;
  }

  // click handler: open modal at clicked image
  $(document).on('click', '.gallery-block', function(e) {
    e.preventDefault();
    var idx = $items.index(this);
    if (idx < 0) return;
    showImage(idx);

    // show bootstrap modal
    var modalEl = $modal[0];
    var bsModal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl, { keyboard: false });
    bsModal.show();

    // focus the next button for keyboard navigation (optional)
    $modal.find('.gallery-next').focus();
  });

  // next / prev buttons
  $modal.on('click', '.gallery-next', function(e) {
    e.preventDefault();
    showImage(currentIndex + 1);
  });
  $modal.on('click', '.gallery-prev', function(e) {
    e.preventDefault();
    showImage(currentIndex - 1);
  });

  // keyboard navigation while modal is open (left/right/esc)
  $(document).on('keydown', function(e) {
    if (!$modal.hasClass('show')) return; // ignore if modal closed
    if (e.key === 'ArrowRight') {
      showImage(currentIndex + 1);
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      showImage(currentIndex - 1);
      e.preventDefault();
    } else if (e.key === 'Escape') {
      // close bootstrap modal
      var modalEl = $modal[0];
      var bsModal = bootstrap.Modal.getInstance(modalEl);
      if (bsModal) bsModal.hide();
    }
  });

  // Optional: clicking on image toggles next (handy for mobile)
  $modal.on('click', '#lightGalleryImage', function() {
    showImage(currentIndex + 1);
  });

  // Prevent body scroll jump when modal opens (Bootstrap handles this normally).
});





(function () {
  var $preloader = document.getElementById('pagePreloader');
  var body = document.body;
  var TIMEOUT = 8000; // maximum wait ms before forcing show (adjust if you like)

  // Utility: returns a Promise that resolves when window.load fires
  function whenWindowLoaded() {
    return new Promise(function (resolve) {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', function onLoad() {
          window.removeEventListener('load', onLoad);
          resolve();
        });
      }
    });
  }

  // Utility: returns Promise for fonts ready (if supported)
  function whenFontsReady() {
    if (document.fonts && typeof document.fonts.ready === 'object') {
      return document.fonts.ready;
    }
    // fallback resolve immediately if not supported
    return Promise.resolve();
  }

  // combine checks: wait for window load + fonts ready
  Promise.race([
    Promise.all([ whenWindowLoaded(), whenFontsReady() ]),
    // fallback to force show after TIMEOUT if something hangs
    new Promise(function (resolve) { setTimeout(resolve, TIMEOUT); })
  ]).then(function () {
    // small delay to let paint settle (optional)
    setTimeout(function () {
      // hide preloader visually with transition
      if ($preloader) {
        $preloader.classList.add('hidden');
        // keep the node for a beat then remove it from DOM to free memory
        setTimeout(function () {
          if ($preloader && $preloader.parentNode) {
            $preloader.parentNode.removeChild($preloader);
          }
        }, 400);
      }

      // remove preloading class and add page-ready to start in-page animations
      body.classList.remove('preloading');
      body.classList.add('page-ready');
    }, 80);
  });
})();





})(jQuery);




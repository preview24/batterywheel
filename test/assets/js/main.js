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




// jQuery DatePicker
$(document).ready(function() {

    $('.date').datepicker({
        dateFormat: 'dd-mm-yy', // Set the date format
        changeMonth: true, // Allow changing of months
        changeYear: true, // Allow changing of years
        // Additional options can be added here
    });

});




// Review Slider functions
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





// Scroll Animation
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







// Page Preaload functions
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




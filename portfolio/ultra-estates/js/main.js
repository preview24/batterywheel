(function ($) {
    "use strict";

    // Spinner
    // var spinner = function () {
    //     setTimeout(function () {
    //         if ($('#spinner').length > 0) {
    //             $('#spinner').removeClass('show');
    //         }
    //     }, 1);
    // };
    // spinner();
    

    // Sticky Navbar
    $(window).scroll(function () {
        if ($(this).scrollTop() > 40) {
            $('.main-menu').addClass('sticky-top');
        } else {
            $('.main-menu').removeClass('sticky-top');
        }
    });
    

    
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


    
})(jQuery);




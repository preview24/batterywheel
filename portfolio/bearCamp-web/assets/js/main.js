(function ($) {
    "use strict";

    

// Sticky Navbar
// $(window).scroll(function () {
//     if ($(this).scrollTop() > 40) {
//         $('.main-menu').addClass('sticky-top');
//     } else {
//         $('.main-menu').removeClass('sticky-top');
//     }
// });


var $backToTop = $(".back-to-top");
$backToTop.hide();
$(window).on('scroll', function() {
  if ($(this).scrollTop() > 200) {
    $backToTop.fadeIn();
  } else {
    $backToTop.fadeOut();
  }
});
$backToTop.on('click', function(e) {
  $("html, body").animate({scrollTop: 0}, 500);
});



$(document).ready(function() {
  $('.filter').click(function(){
    $(this).toggleClass('active');
    $(this).parent('.form-first-part').siblings('.form-second-part').slideToggle('fast');
  });
});



$(document).ready(function() {
    $("#categories").lightSlider({
        item: 4,
        autoWidth: false,
        slideMove: 1, // slidemove will be 1 if loop is true
        slideMargin: 30,
 
        addClass: '',
        mode: "slide",
        useCSS: true,
        cssEasing: 'ease', //'cubic-bezier(0.25, 0, 0.25, 1)',//
        easing: 'linear', //'for jquery animation',////
 
        speed: 400, //ms'
        auto: true,
        loop: true,
        slideEndAnimation: true,
        pause: 2000,
 
        keyPress: false,
        controls: true,
        prevHtml: '<img src="assets/images/icons/arrow-left.png" alt="Right">',
        nextHtml: '<img src="assets/images/icons/arrow-right.png" alt="Left">',
 
        pager: false,
        swipeThreshold: 10,
        responsive : [
            {
                breakpoint:991,
                settings: {
                    item:3,
                    slideMargin:10,
                  }
            },
            {
                breakpoint:767,
                settings: {
                    item:2,
                    slideMargin:10,
                  }
            },
            {
                breakpoint:650,
                settings: {
                    item:1,
                    slideMargin:15,
                    pager: true,
                    controls: false,
                  }
            }
        ],
 
    });
});






})(jQuery);




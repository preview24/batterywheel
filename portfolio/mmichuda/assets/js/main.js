(function() {
    


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









  // Back to top button
   $(document).ready(function () {
      // Show or hide the button based on scroll position
      $(window).scroll(function () {
          if ($(this).scrollTop() > 400) {
              $('.back-to-top').fadeIn();
          } else {
              $('.back-to-top').fadeOut();
          }
      });

      // Scroll to top when the button is clicked
      $('.back-to-top').click(function () {
          $('html, body').animate({ scrollTop: 0 }, '500');
          return false;
      });



});








// Sticky header
$(window).scroll(function () {
    if ($(this).scrollTop() > 50) {
        $('.header').addClass('sticky');
    } else {
        $('.header').removeClass('sticky');
    }
});


let lastScrollTop = 0;
const header = document.querySelector('.header');

window.addEventListener('scroll', function() {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > lastScrollTop) {
        // Scroll down
        header.classList.add('scrolled');
    } else {
        // Scroll up
        header.classList.remove('scrolled');
    }
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // For Mobile or negative scrolling
});







// Carousel
$('.carousel').slick({
  dots: false,
  infinite: true,
  speed: 300,
  autoplay: true,
  autoplaySpeed: 4000,
  slidesToShow: 2,
  slidesToScroll: 1,
  responsive: [
    {
      breakpoint: 600,
      settings: {
        slidesToShow: 1,
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





  // Function to animate the counter
  function animateCounter(element, target, totalDuration) {
    let count = 0;
    const increment = target / (totalDuration / 20); // Increment per 100ms
    const interval = setInterval(() => {
      count += increment;
      if (count >= target) {
        count = target; // Ensure it doesn't exceed the target
        clearInterval(interval);
      }
      element.textContent = Math.floor(count) + "K"; // Update the counter text
    }, 20); // Update every 100ms
  }

  // Intersection Observer to detect when elements are in the viewport
  const counters = document.querySelectorAll('.counter');
  const totalDuration = 2000; // Total duration in ms for all counters to complete

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const counterElement = entry.target;
        const targetValue = parseInt(counterElement.textContent);
        animateCounter(counterElement, targetValue, totalDuration);
        observer.unobserve(counterElement); // Stop observing after counting
      }
    });
  });

  counters.forEach(counter => {
    observer.observe(counter);
  });





// Preloader
  window.addEventListener('load', function() {
    const preloader = document.getElementById('preloader');
    
    preloader.style.display = 'none';
});








})();
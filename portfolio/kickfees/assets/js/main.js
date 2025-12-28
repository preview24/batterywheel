document.addEventListener('DOMContentLoaded', () => {



    // Animation on scroll
    const elements = document.querySelectorAll('[ani]');
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




    // Back to top button
    $(window).scroll(function () {
        if ($(this).scrollTop() > 400) {
            $('.back-to-top').fadeIn();
        } else {
            $('.back-to-top').fadeOut();
        }
    });

    $('.back-to-top').click(function () {
        $('html, body').animate({ scrollTop: 0 }, '500');
        return false;
    });



    // Expand blocks on hover
    $('.expand-blocks > li').hover(
        function () {
            $('.expand-blocks > li').removeClass('active');
            $(this).addClass('active');
        }
    );



    // Feedback blocks on hover
    $('.feedback-blocks li').hover(
        function () {
            $('.feedback-blocks li').removeClass('active');
            $(this).addClass('active');
        }
    );



    // Play video on hover
  function checkScreenSize() {
      if (window.innerWidth >= 768) { // Adjust breakpoint as needed
          $('.empowering-blocks').hover(
              function () {
                  const video = $(this).find('video').get(0);
                  if (video.paused) {
                      video.play();
                  }
              },
              function () {
                  const video = $(this).find('video').get(0);
                  video.pause();
              }
          );
      } else {
          $('.empowering-blocks video').each(function () {
              this.play();
          });
      }
  }

  checkScreenSize();
  $(window).resize(checkScreenSize);






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

    window.addEventListener('scroll', function () {
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





    // HOW DOES IT WORK Slider
    const items = document.querySelectorAll('.caro-item');
    const descriptionSections = document.querySelectorAll('.caro-description');
    let activeIndex = 0;
    let slideDuration = 5000; // Duration for each slide
    let remainingTime = slideDuration; // Time remaining when hovering
    let lastSlideTime = Date.now(); // Last time the slide started
    let timer;

    const updateCarousel = () => {
        items.forEach((item, index) => {
            item.classList.remove('active');
            item.querySelector('.progress').classList.remove('active');

            if (index === activeIndex) {
                item.classList.add('active');
                item.querySelector('.progress').classList.add('active');
            }
        });

        // Update description sections
        descriptionSections.forEach((section, index) => {
            section.classList.remove('active');
            if (index === activeIndex) {
                section.classList.add('active'); // Show the active section
            }
        });
    };

    const startAutoSlide = () => {
        clearTimeout(timer); // Clear any existing timer
        lastSlideTime = Date.now(); // Track when the slide starts
        timer = setTimeout(() => {
            activeIndex = (activeIndex + 1) % items.length;
            updateCarousel();
            resetAutoSlide(); // Reset for the next slide
        }, remainingTime);
    };

    const resetAutoSlide = () => {
        remainingTime = slideDuration;
        startAutoSlide();
    };

    const stopAutoSlide = () => {
        clearTimeout(timer); // Stop the timer
        const elapsedTime = Date.now() - lastSlideTime; // Calculate how much time has passed
        remainingTime -= elapsedTime; // Subtract elapsed time from the remaining time
    };

    items.forEach(item => {
        item.addEventListener('mouseenter', stopAutoSlide);  // Stop auto-slide on hover
        item.addEventListener('mouseleave', startAutoSlide); // Resume auto-slide after hover

        item.addEventListener('click', () => {
            activeIndex = Array.from(items).indexOf(item); // Update active item
            updateCarousel();
            resetAutoSlide(); // Restart auto-slide immediately
        });
    });

    // Initialize the carousel and start auto-slide
    updateCarousel();
    startAutoSlide();





    // Image Sequence animation
    const canvas1 = document.getElementById("hero-lightpass1");
    const context1 = canvas1.getContext("2d");
    canvas1.width = 1444;
    canvas1.height = 608;

    const frameCount1 = 32;
    const currentFrame1 = (index) =>
        `assets/animation/zap/${(index + 1).toString().padStart(3, "0")}.png`;

    const images1 = [];
    const airpods1 = {
        frame: 0
    };

    for (let i = 0; i < frameCount1; i++) {
        const img = new Image();
        img.src = currentFrame1(i);
        images1.push(img);
    }

    gsap.to(airpods1, {
        frame: frameCount1 - 1,
        snap: "frame",
        ease: "none",
        scrollTrigger: {
            trigger: ".cc1",
            start: "top 200",
            end: "+=3000",
            markers: false,
            pin: ".pin1",
            scrub: true
        },
        onUpdate: render1 // use animation onUpdate instead of scrollTrigger's onUpdate
    });

    images1[0].onload = render1;

    function render1() {
        context1.clearRect(0, 0, canvas1.width, canvas1.height);
        context1.drawImage(images1[airpods1.frame], 0, 0);
    }


        // Check if the page was refreshed
        if (performance.navigation.type === 1) {
            // If refreshed, scroll to the top
            window.scrollTo(0, 0);
        }

        // Event listener for window resize
        window.addEventListener('resize', () => {
            // Scroll to top on resize
            window.scrollTo(0, 0);
        });




    const canvas2 = document.getElementById("hero-lightpass2");
    const context2 = canvas2.getContext("2d");
    canvas2.width = 1440;
    canvas2.height = 794;

    const frameCount2 = 40;
    const currentFrame2 = (index) =>
        `assets/animation/partnerships/${(index + 1).toString().padStart(3, "0")}.png`;

    const images2 = [];
    const airpods2 = {
        frame: 0
    };

    for (let i = 0; i < frameCount2; i++) {
        const img = new Image();
        img.src = currentFrame2(i);
        images2.push(img);
    }

    gsap.to(airpods2, {
        frame: frameCount2 - 1,
        snap: "frame",
        ease: "Power1.easeInOut",
        scrollTrigger: {
            trigger: ".cc2",
            start: "top 185",
            end: "+=4000",
            markers: false,
            pin: ".pin2",
            scrub: true
        },
        onUpdate: render2 // use animation onUpdate instead of scrollTrigger's onUpdate
    });

    images2[0].onload = render2;

    function render2() {
        context2.clearRect(0, 0, canvas2.width, canvas2.height);
        context2.drawImage(images2[airpods2.frame], 0, 0);
    }





// Header image mask on hover
window.onload = function() {
  const div = document.querySelector('.mask-image');
  let isIn = false;

  div.addEventListener('mouseover', function() {
    isIn = true;
  });

  div.addEventListener('mouseout', function() {
    isIn = false;
  });

  div.addEventListener('mousemove', function(event) {
    if (isIn) {
      const rect = div.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100; // Calculate percentage
      const y = ((event.clientY - rect.top) / rect.height) * 100; // Calculate percentage
      div.style.setProperty('--x', x + '%');
      div.style.setProperty('--y', y + '%');
    }
  });
}




});











(function($) {
    $('body').css('overflow-x', 'hidden');
    $.fn.parallax = function(opt) {
        opt = $.extend(opt || {}, { rate: 0.3, mode: 0 });

        this.children().each(function() {
            let obj = $(this);
            if (obj.attr('data-bg')) {
                obj.css('background-image', 'url(' + obj.attr('data-bg') + ')').addClass('parallax');
            }

            if (opt.mode === 1) {
                obj.css('overflow', 'hidden');
                $(window).resize(function() {
                    obj.css({
                        width: $(window).width(),
                        height: $(window).height(),
                    });
                });
                $(window).trigger('resize');

                obj.get(0).onmousewheel = function(e) {
                    if (window.scrolling) return;
                    window.scrolling = true;
                    let item = e.deltaY > 0 ? obj.next() : obj.prev();
                    if (item.length > 0) {
                        $('html, body').animate({
                            scrollTop: item.position().top
                        }, 1000, function() {
                            window.scrolling = false;
                        });
                    } else {
                        window.scrolling = false;
                    }
                };
            } else {
                if (obj.attr('data-bg')) {
                    $(window).scroll(function() {
                        if ($(window).width() < 768) {
                            obj.css({
                                'background-position': 'bottom center'
                            });
                        } else {
                            let rate = obj.attr('data-rate') || opt.rate;
                            if (
                                obj.position().top < $(window).scrollTop() + $(window).height() &&
                                obj.position().top + obj.height() > $(window).scrollTop()
                            ) {
                                obj.css('background-position-y', (obj.position().top - $(window).scrollTop()) * rate);
                            }
                        }
                    });
                }
            }
        });

        $(window).trigger('scroll');
    };
})(jQuery);

$('body').parallax();

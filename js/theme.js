/*
=================================================================================
* Template:  	 Scott - NFT Minting and Collection Landing Page HTML5 Template
* Written by: 	 Harnish Design - (https://www.harnishdesign.net)
* Description:   Main Custom Script File
=================================================================================
*/

(function ($) {
  "use strict";

  // Preloader
  $(window).on('load', function () {
    $('.lds-ellipsis').fadeOut(); // will first fade out the loading animation
    $('.preloader').delay(333).fadeOut('slow'); // will fade out the white DIV that covers the website.
    $('body').delay(333);
  });


  // Header Sticky
  $(window).on('scroll', function () {
    var stickytop = $('#header.sticky-top .bg-transparent');
    var stickytopslide = $('#header.sticky-top-slide');

    if ($(this).scrollTop() > 1) {
      stickytop.addClass("sticky-on-top");
      stickytop.find(".logo img").attr('src', stickytop.find('.logo img').data('sticky-logo'));
    }
    else {
      stickytop.removeClass("sticky-on-top");
      stickytop.find(".logo img").attr('src', stickytop.find('.logo img').data('default-logo'));
    }

    if ($(this).scrollTop() > 180) {
      stickytopslide.find(".primary-menu").addClass("sticky-on");
      stickytopslide.find(".logo img").attr('src', stickytopslide.find('.logo img').data('sticky-logo'));
    }
    else {
      stickytopslide.find(".primary-menu").removeClass("sticky-on");
      stickytopslide.find(".logo img").attr('src', stickytopslide.find('.logo img').data('default-logo'));
    }
  });

  /*---------------------------------------------------
      Primary Menu
  ----------------------------------------------------- */
  // Dropdown show on hover
  $('.primary-menu ul.navbar-nav li.dropdown').on("mouseover", function () {
    if ($(window).width() > 991) {
      $(this).find('> .dropdown-menu').stop().slideDown('fast');
      $(this).bind('mouseleave', function () {
        $(this).find('> .dropdown-menu').stop().css('display', 'none');
      });

      // When dropdown going off to the out of the screen.
      $('.primary-menu ul.navbar-nav > li.dropdown > .dropdown-menu').each(function () {
        var menu = $('#header .primary-menu > div').offset();
        var dropdown = $(this).parent().offset();
        if ($("html").attr("dir") == 'rtl') {
          var rd = ($(window).width() - (dropdown.left + $(this).parent().outerWidth()));
          var i = (rd + $(this).outerWidth()) - (menu.left + $('#header .primary-menu > div').outerWidth());
        } else {
          var i = (dropdown.left + $(this).outerWidth()) - (menu.left + $('#header .primary-menu > div').outerWidth());
        }
        if (i > 0) {
          if ($("html").attr("dir") == 'rtl') {
            $(this).css('margin-right', '-' + (i) + 'px');
          } else {
            $(this).css('margin-left', '-' + (i) + 'px');
          }
        }
      });

    }
  });

  $(function () {
    $(".dropdown li").on('mouseenter mouseleave', function (e) {
      if ($(window).width() > 991) {
        if ($('.dropdown-menu', this).length) {
          var elm = $('.dropdown-menu', this);
          var off = elm.offset();
          var l = off.left;
          var w = elm.width();
          var docW = $(window).width();
          var lr = ($(window).width() - (off.left + elm.outerWidth())); //offset right
          if ($("html").attr("dir") == 'rtl') {
            var isEntirelyVisible = (lr + w + 30 <= docW);
          } else {
            var isEntirelyVisible = (l + w + 30 <= docW);
          }
          if (!isEntirelyVisible) {
            $(elm).addClass('dropdown-menu-end');
            $(elm).parents('.dropdown:first').find('> a.dropdown-toggle > .arrow').addClass('arrow-end');
          } else {
            $(elm).removeClass('dropdown-menu-end');
            $(elm).parents('.dropdown:first').find('> a.dropdown-toggle > .arrow').removeClass('arrow-end');
          }
        }
      }
    });
  });

  // DropDown Arrow
  $('.primary-menu').find('a.dropdown-toggle').append($('<i />').addClass('arrow'));

  // Mobile Collapse Nav
  $('.primary-menu .dropdown-toggle[href="#"], .primary-menu .dropdown-toggle[href!="#"] .arrow').on('click', function (e) {
    if ($(window).width() < 991) {
      e.preventDefault();
      var $parentli = $(this).closest('li');
      $parentli.siblings('li').find('.dropdown-menu:visible').slideUp();
      $parentli.find('> .dropdown-menu').stop().slideToggle();
      $parentli.siblings('li').find('a .arrow.open').toggleClass('open');
      $parentli.find('> a .arrow').toggleClass('open');
    }
  });

  // Mobile Menu
  $('.navbar-toggler').on('click', function () {
    $(this).toggleClass('show');
  });
  $(".navbar-nav a:not(.dropdown-toggle)").on('click', function () {
    $(".navbar-collapse, .navbar-toggler").removeClass("show");
  });

  // Overlay Menu & Side Open Menu
  $('.navbar-side-open .collapse, .navbar-overlay .collapse').on('show.bs.collapse hide.bs.collapse', function (e) {
    e.preventDefault();
  }),
    $('.navbar-side-open [data-bs-toggle="collapse"], .navbar-overlay [data-bs-toggle="collapse"]').on('click', function (e) {
      e.preventDefault();
      $($(this).data('bs-target')).toggleClass('show');
    });

  /*---------------------------------
     Carousel (Owl Carousel)
  ----------------------------------- */
  $(".owl-carousel").each(function (index) {
    var a = $(this);
    $(this).owlCarousel({
      rtl: a.data('rtl'),
      autoplay: a.data('autoplay'),
      autoplayTimeout: a.data('autoplaytimeout'),
      smartSpeed: a.data('smartspeed'),
      slideTransition: a.data('slidetransition'),
      autoplayHoverPause: a.data('autoplayhoverpause'),
      loop: a.data('loop'),
      speed: a.data('speed'),
      nav: a.data('nav'),
      dots: a.data('dots'),
      center: a.data('center'),
      autoHeight: a.data('autoheight'),
      autoWidth: a.data('autowidth'),
      margin: a.data('margin'),
      stagePadding: a.data('stagepadding'),
      slideBy: a.data('slideby'),
      lazyLoad: a.data('lazyload'),
      navText: ['<i class="fa fa-chevron-left"></i>', '<i class="fa fa-chevron-right"></i>'],
      animateOut: a.data('animateout'),
      animateIn: a.data('animatein'),
      video: a.data('video'),
      items: a.data('items'),
      responsive: {
        0: { items: a.data('items-xs'), },
        576: { items: a.data('items-sm'), },
        768: { items: a.data('items-md'), },
        992: { items: a.data('items-lg'), }
      }
    });
  });


  /*------------------------------------
      Parallax Mouse Move
  -------------------------------------- */

  window.onload = function () {
    var scene = document.getElementById('scene');
    //var parallaxInstance = new Parallax(scene);
  };
  /*------------------------
     tooltips
  -------------------------- */
  var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });


  /*--------------------------------
     Countdown (Coming Soon Page)
  ---------------------------------- */
  var countdown = $('.countdown[data-countdown-end]');

  if (countdown.length > 0) {
    countdown.each(function () {
      var $countdown = $(this),
        finalDate = $countdown.data('countdown-end');
      $countdown.countdown(finalDate, function (event) {
        $countdown.html(event.strftime(
          '<div class="row g-0"><div class="col-auto"><div class="text-12 fw-600 px-sm-3 lh-1">%-D</div><span class="fw-300 opacity-9">Day%!d</span></div><div class="blink_me col-auto align-items-center d-flex text-7">:</div><div class="col"><div class="text-12 fw-600 px-sm-3 lh-1">%H</div><span class="fw-300 opacity-9">Hrs</span></div><div class="blink_me col-auto align-items-center d-flex text-7">:</div><div class="col"><div class="text-12 fw-600 px-sm-3 lh-1">%M</div><span class="fw-300 opacity-9">Min</span></div><div class="blink_me col-auto align-items-center d-flex text-7">:</div><div class="col"><div class="text-12 fw-600 px-sm-3 lh-1">%S</div><span class="fw-300 opacity-9">Sec</span></div></div>'
        ));
      });
    });
  }


  /*------------------------
     Countdown 2 (Mint Page)
  -------------------------- */
  var countdown = $('.countdown2[data-countdown-end]');

  if (countdown.length > 0) {
    countdown.each(function () {
      var $countdown = $(this),
        finalDate = new Date($countdown.data('countdown-end'));
      $countdown.countdown(finalDate)
        .on('update.countdown', function (event) {
          var format =
            '<span>%-D</span>d'
            + '<span class="blink_me">:</span>'
            + '<span>%H</span>h'
            + '<span class="blink_me">:</span>'
            + '<span>%M</span>m'
            + '<span class="blink_me">:</span>'
            + '<span>%S</span>s';
          if (event.offset.totalDays === 0) {
            format = '<span>%H</span>h'
              + '<span class="blink_me">:</span>'
              + '<span>%M</span>m'
              + '<span class="blink_me">:</span>'
              + '<span>%S</span>s';
          }
          if (event.offset.totalHours === 0) {
            format =
              '<span>%M</span>m'
              + '<span class="blink_me">:</span>'
              + '<span>%S</span>s';
          }
          if (event.offset.totalMinutes === 0) {
            format = '<span>%S</span>s';
          }
          $countdown.html(event.strftime(format));
        })
        .on('finish.countdown', function (event) {
          $countdown.addClass('d-none');
        });
    });
  }

  /*------------------------
     Scroll to top
  -------------------------- */
  $(function () {
    $(window).on('scroll', function () {
      if ($(this).scrollTop() > 400) {
        $('#back-to-top').fadeIn();
      } else {
        $('#back-to-top').fadeOut();
      }
    });
  });
  $('#back-to-top').on("click", function () {
    $('html, body').animate({ scrollTop: 0 }, 'slow');
    return false;
  });

  /*------------------------
     Subscribe Form
  --------------------------- */
  var subscribeForm = $('.subscribe-form');
  var submitbtn = $('#subscribe-form-submit');
  if (subscribeForm.length >= 1) {
    subscribeForm.each(function () {
      var el = $(this),
        elResult = el.find('.subscribe-form-result'),
        alertType;
      el.find('form').validate({
        submitHandler: function (form) {
          elResult.hide();
          var loadingText = '<i role="status" aria-hidden="true" class="spinner-border spinner-border-sm"></i>';
          if (submitbtn.html() !== loadingText) {
            submitbtn.data('original-text', submitbtn.html());
            submitbtn.html(loadingText);
          }
          $(form).ajaxSubmit({
            target: elResult,
            dataType: 'json',
            resetForm: true,
            success: function (data) {
              if (data.alert == 'error') {
                alertType = 'alert-danger';
              } else {
                alertType = 'alert-success';
              }
              elResult.addClass('alert ' + alertType).html(data.message).slideDown(300);
              submitbtn.html(submitbtn.data('original-text'));// reset submit button text
              setTimeout(function () {
                elResult.slideUp('slow', function () {
                  $(this).removeClass('alert ' + alertType);
                });
              }, 5100);
            }
          });
        }
      });
    });
  }

  /*------------------------
    Contact Form
  --------------------------- */

  var form = $('#contact-form'); // contact form
  var submit = $('#submit-btn'); // submit button

  // form submit event
  form.on('submit', function (e) {
    e.preventDefault(); // prevent default form submit

    if (typeof $('#google-recaptcha-v3').val() != "undefined") {
      grecaptcha.ready(function () {
        var site_key = $('#google-recaptcha-v3').attr('src').split("render=")[1];
        grecaptcha.execute(site_key, { action: 'contact' }).then(function (token) {
          var gdata = form.serialize() + '&g-recaptcha-response=' + token;
          $.ajax({
            url: 'php/mail.php',  // form action url
            type: 'POST', 		  // form submit method get/post
            dataType: 'json', 	  // request type html/json/xml
            data: gdata, 		  // serialize form data
            beforeSend: function () {
              submit.attr("disabled", "disabled");
              var loadingText = '<span role="status" aria-hidden="true" class="spinner-border spinner-border-sm align-self-center me-2"></span>Sending.....'; // change submit button text
              if (submit.html() !== loadingText) {
                submit.data('original-text', submit.html());
                submit.html(loadingText);
              }
            },
            success: function (data) {
              submit.before(data.Message).fadeIn("slow"); // fade in response data 
              submit.html(submit.data('original-text'));// reset submit button text
              submit.removeAttr("disabled", "disabled");
              if (data.response == 'success') {
                form.trigger('reset'); // reset form
              }
              setTimeout(function () {
                $('.alert-dismissible').fadeOut('slow', function () {
                  $(this).remove();
                });
              }, 3000);
            },
            error: function (e) {
              console.log(e);
            }
          });
        });
      });
    } else {
      $.ajax({
        url: 'php/mail.php', // form action url
        type: 'POST', // form submit method get/post
        dataType: 'json', // request type html/json/xml
        data: form.serialize(), // serialize form data
        beforeSend: function () {
          submit.attr("disabled", "disabled");
          var loadingText = '<span role="status" aria-hidden="true" class="spinner-border spinner-border-sm align-self-center me-2"></span>Sending.....'; // change submit button text
          if (submit.html() !== loadingText) {
            submit.data('original-text', submit.html());
            submit.html(loadingText);
          }
        },
        success: function (data) {
          submit.before(data.Message).fadeIn("slow"); // fade in response data 
          submit.html(submit.data('original-text'));// reset submit button text
          submit.removeAttr("disabled", "disabled");
          if (data.response == 'success') {
            form.trigger('reset'); // reset form
          }
          setTimeout(function () {
            $('.alert-dismissible').fadeOut('slow', function () {
              $(this).remove();
            });
          }, 3000);
          if (typeof $('#recaptcha-v2').val() != "undefined") {
            grecaptcha.reset(); // reset reCaptcha
          }
        },
        error: function (e) {
          console.log(e);
        }
      });
    }
  });

})(jQuery);
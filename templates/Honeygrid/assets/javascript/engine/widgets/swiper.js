'use strict';

/* --------------------------------------------------------------
 swiper.js 2016-12-14
 Gambio GmbH
 http://www.gambio.de
 Copyright (c) 2016 Gambio GmbH
 Released under the GNU General Public License (Version 2)
 [http://www.gnu.org/licenses/gpl-2.0.html]
 --------------------------------------------------------------
 */

/* globals Swiper */

/**
 * Widget that binds the swiper plugin (third party) to a DOM element
 *
 * @todo Remove the try - catch blocks and and correct the swiper issues.
 */
gambio.widgets.module('swiper', [gambio.source + '/libs/events', gambio.source + '/libs/responsive'], function (data) {

	'use strict';

	// ########## VARIABLE INITIALIZATION ##########

	var $this = $(this),
	    $body = $('body'),
	    $slides = null,
	    $controls = null,
	    $target = null,
	    $template = null,
	    init = true,
	    swiper = null,
	    sliderOptions = null,
	    hasThumbnails = true,
	    mode = null,
	    breakpointDataset = null,
	    duplicates = false,
	    preventSlideStart = false,
	    sliderDefaults = { // Default configuration for the swiper
		pagination: '.swiper-pagination',
		nextButton: '.swiper-button-next',
		prevButton: '.swiper-button-prev',
		paginationClickable: true,
		loop: true,
		autoplay: 3,
		autoplayDisableOnInteraction: false
	},
	    defaults = {
		// JSON that gets merged with the sliderDefaults and is passed to "swiper" directly.
		sliderOptions: null,
		// If this instance is a "main" swiper, the given selector selects the "control" swiper.
		controls: null,
		// If this instance is a "control" swiper, the given selector selects the "main" swiper.
		target: null,
		// Sets the initial slide (needed to prevent different init slides in main/controller slider).
		initSlide: null,
		// Detect if a swiper is needed for the breakpoint. If not, turn it off
		autoOff: false,
		// The translucence fix enables support for a fade effect between images with different aspect ratio,
		// but causing a delay between the change
		disableTranslucenceFix: false,
		breakpoints: [{
			// Until which breakpoint this settings is available
			breakpoint: 40,
			// If true, the paging bullets will be replaced with the preview images.
			usePreviewBullets: false,
			// This and all other settings belonging to the swiper plugin.
			slidesPerView: 2,
			// If true, the current slide gets centered in view (most usefull with an even slidesPerView
			// count).
			centeredSlides: true
		}, {
			breakpoint: 60,
			usePreviewBullets: true,
			slidesPerView: 3
		}, {
			breakpoint: 80,
			usePreviewBullets: true,
			slidesPerView: 3
		}, {
			breakpoint: 100,
			usePreviewBullets: true,
			slidesPerView: 5
		}]
	},
	    options = $.extend({}, defaults, data),
	    module = {};

	// ########## HELPER FUNCTIONS ##########

	/**
  * Function that generates the markup for
  * the preview bullets
  * @param       {Swiper}        swiper          Swiper object
  * @param       {integer}       index           Index of the slide
  * @param       {string}        className       The classname that must be add to the markup
  * @return      {string}                        The preview image html string
  * @private
  */
	var _generatePreviewButtons = function _generatePreviewButtons(swiper, index, className) {
		var $currentSlide = $slides.eq(index),
		    $image = $currentSlide.find('img'),
		    altTxt = $image.attr('alt'),
		    thumbImage = $currentSlide.data('thumbImage');

		if (thumbImage) {
			return '<img src="' + thumbImage + '" alt="' + altTxt + '" class="' + className + '" />';
		}

		return '';
	};

	/**
  * Helper function to get the index of the
  * active slide
  * @return     {integer}                       The index of the active slide
  * @private
  */
	var _getIndex = function _getIndex() {
		var index = $this.find('.swiper-slide-active').index();

		// If there are duplicate slides (generated
		// by the swiper) recalculate the index
		index = duplicates ? index - 1 : index;
		index = index || 0;

		return index;
	};

	/**
  * Helper function to add the active
  * class to the active slide
  * @param       {integer}           index       The index of the active slide
  * @private
  */
	var _setActive = function _setActive(index) {
		$slides = $this.find('.swiper-slide:not(.swiper-slide-duplicate)');
		index = duplicates ? index + 1 : index;
		$slides.removeClass('active').eq(index).addClass('active');
	};

	// ########## EVENT HANDLER ##########

	/**
  * Event handler for the mouseenter event.
  * It disables the autoplay
  * @private
  */
	var _mouseEnterHandler = function _mouseEnterHandler() {
		try {
			if (swiper) {
				swiper.stopAutoplay();
			}
		} catch (e) {
			// Do not log the error
		}
	};

	/**
  * Event handler for the mouseleave event.
  * It enables the autoplay
  * @private
  */
	var _mouseLeaveHandler = function _mouseLeaveHandler() {
		try {
			if (swiper) {
				swiper.startAutoplay();
			}
		} catch (e) {
			// Do not log the error
		}
	};

	/**
  * Event handler for the goto event.
  * It switches the current slide to the given index
  * and adds the active class to the new active slide
  * @param       {object}    e       jQuery event object
  * @param       {number}    d       Index of the slide to show
  * @private
  */
	var _gotoHandler = function _gotoHandler(e, d) {
		e.stopPropagation();

		// Set the active slide
		_setActive(d);

		// Temporary deactivate the onSlideChangeStart event
		// to prevent looping through the goto / changeStart
		// events
		preventSlideStart = true;

		// Remove the autoplay after a goto event
		$this.off('mouseleave.swiper');
		swiper.stopAutoplay();

		// Try to correct the index between sliders
		// with and without duplicates
		var index = duplicates ? d + 1 : d;
		if (index > $slides.length) {
			index = 0;
		}

		// Goto the desired slide
		swiper.slideTo(index);

		// Reactivate the onSlideChangeEvent
		preventSlideStart = false;
	};

	/**
  * Click event handler that triggers a
  * "goto" event to the target swiper
  * @param       {object}        e       jQuery event object
  * @private
  */
	var _clickHandler = function _clickHandler(e) {
		e.preventDefault();
		e.stopPropagation();

		var $self = $(this),
		    index = $self.index();

		index = duplicates ? index - 1 : index;

		// Set the active slide
		_setActive(index);

		// Inform the main swiper
		$target.trigger(jse.libs.template.events.SWIPER_GOTO(), index);
	};

	/**
  * Event that gets triggered on slideChange.
  * If the slide gets changed, the controls
  * will follow the current slide in position
  * @private
  */
	var _triggerSlideChange = function _triggerSlideChange() {
		if (!preventSlideStart) {
			var index = _getIndex(),
			    lastIndex = $slides.length - 2;

			// Recalculate index if duplicate slides are inside the slider
			if (index < 0) {
				index = $slides.length - 3;
			} else {
				index = duplicates && index === lastIndex ? index - lastIndex : index;
			}

			// Set the active slide
			_setActive(index);

			// Inform the controls
			$controls.trigger(jse.libs.template.events.SWIPER_GOTO(), index);
		}
	};

	/**
  * Workaround for the translucence issue
  * that happens on small screens with enabled
  * fade effect. Maybe it can be removed, if the
  * swiper gets updated itself
  * @private
  */
	var _translucenceWorkaround = function _translucenceWorkaround() {
		if (!options.disableTranslucenceFix && sliderOptions && sliderOptions.effect === 'fade') {
			$this.find('.swiper-slide').filter(':not(.swiper-slide-active)').fadeTo(300, 0, function () {
				$(this).css('visibility', 'hidden');
			});

			$this.find('.swiper-slide').filter('.swiper-slide-active').fadeTo(300, 1, function () {
				$(this).css('visibility', '');
			});
		}
	};

	/**
  * The breakpoint handler initializes the swiper
  * with the settings for the current breakpoint.
  * Therefore it uses the default slider options,
  * the custom slider options given by the options
  * object and the breakpoint options object also
  * given by the options (in this order)
  * @private
  */
	var _breakpointHandler = function _breakpointHandler() {

		// Get the current viewmode
		var oldMode = mode || {},
		    newMode = jse.libs.template.responsive.breakpoint(),
		    extendOptions = options.breakpoints[0] || {},
		    newBreakpointDataset = null;

		// Only do something if the view was changed
		if (newMode.id !== oldMode.id) {

			// Store the new viewmode
			mode = $.extend({}, newMode);

			// Iterate through the breakpoints object to detect
			// the correct settings for the current breakpoint
			$.each(options.breakpoints, function (i, v) {
				if (v.breakpoint > newMode.id) {
					return false;
				}
				newBreakpointDataset = i;
				extendOptions = v;
			});

			if (options.sliderOptions && options.sliderOptions.breakpoints) {
				$.each(options.sliderOptions.breakpoints, function (i, v) {
					if (v.breakpoint === newMode.id) {
						extendOptions = v;
						return false;
					}
				});
			}

			// Only do something if the settings change due browser
			// resize or if it's the first time run
			if (newBreakpointDataset !== breakpointDataset || init) {
				// Combine the settings
				sliderOptions = $.extend({}, sliderDefaults, options.sliderOptions || {}, extendOptions);

				// Add the preview image bullets function to the options object
				if (sliderOptions.usePreviewBullets && hasThumbnails) {
					sliderOptions.paginationBulletRender = _generatePreviewButtons;
				}

				// Add the autoplay interval to the options object
				sliderOptions.autoplay = sliderOptions.autoplay ? sliderOptions.autoplay * 1000 : 0;

				// Disable loop if there is only one slider. 
				if ($this.find('.swiper-slide').length === 1) {
					sliderOptions.loop = false;
				}

				// If an swiper exists, get the current
				// slide no. and remove the old swiper
				if (swiper) {
					sliderOptions.initialSlide = _getIndex();
					try {
						swiper.destroy(true, true);
					} catch (ignore) {
						swiper = null;
					}
				} else {
					sliderOptions.initialSlide = options.initSlide || sliderOptions.initialSlide || 0;
				}

				var $duplicate = $this.find('.swiper-slide:not(.swiper-slide-duplicate)');

				if (!options.autoOff || $duplicate.length > sliderOptions.slidesPerView && options.autoOff) {
					$this.addClass('swiper-is-active').removeClass('swiper-is-not-active');

					// Initialize the swiper
					try {
						swiper = new Swiper($this, sliderOptions);
					} catch (e) {
						return; // Swiper might throw an error upon initialization that should not halt the script execution.
					}

					swiper.off('onTransitionEnd onSlideChangeStart').on('onTransitionEnd', _translucenceWorkaround);

					// If this is a "main" swiper and has external controls, an
					// goto event is triggered if the current slide is changed
					if ($controls.length) {
						swiper.on('onSlideChangeStart', _triggerSlideChange);
					}

					// Add the event handler
					$this.off('mouseenter.swiper mouseleave.swiper ' + jse.libs.template.events.SWIPER_GOTO() + ' ' + jse.libs.template.events.SLIDES_UPDATE()).on('mouseenter.swiper', _mouseEnterHandler).on('mouseleave.swiper', _mouseLeaveHandler).on(jse.libs.template.events.SWIPER_GOTO(), _gotoHandler).on(jse.libs.template.events.SLIDES_UPDATE(), _updateSlides);

					if (init) {
						// Check if there are duplicates slides (generated by the swiper)
						// after the first time init of the swiper
						duplicates = !!$this.find('.swiper-slide-duplicate').length;
					}

					// Set the active slide
					var index = init && options.initSlide ? options.initSlide : _getIndex();
					_setActive(index);

					// Inform the controls that the main swiper has changed
					// In case that the other slider isn't initialized yet,
					// set an data attribute to the markup element to inform
					// it on init
					if ($controls.length) {
						$controls.attr('data-swiper-init-slide', index);
						_triggerSlideChange();
					}

					// Unset the init flag
					init = false;
				} else {
					// Disable the swiper buttons
					$this.removeClass('swiper-is-active').addClass('swiper-is-not-active');
					init = true;
				}
			}
		}
	};

	/**
  * Event handler that adds & removes slides from the
  * swiper. After the slides were processed, the first
  * slide is shown
  * @param       {object}    e       jQuery event object
  * @param       {object}    d       JSON object that contains the categories / images
  * @private
  */
	var _updateSlides = function _updateSlides(e, d) {

		// Loops through each category inside the images array
		$.each(d, function (category, dataset) {
			var catName = category + '-category',
			    add = [],
			    remove = [],
			    markup = $template.html();

			// Get all indexes from the slides
			// of the same category and remove
			// them from the slider
			$slides.filter('.' + catName).each(function () {
				var $self = $(this),
				    index = $self.data().swiperSlideIndex;

				index = index === undefined ? $self.index() : index;
				remove.push(index);
			});
			swiper.removeSlide(remove);

			// Generate the markup for the new slides
			// and add them to the slider
			$.each(dataset || [], function (i, v) {
				v.className = catName;
				v.srcattr = 'src="' + v.src + '"';
				add.push(Mustache.render(markup, v));
			});
			swiper.appendSlide(add);
		});

		$slides = $this.find('.swiper-slide');

		// To prevent an inconsistent state
		// in control / main slider combinations
		// slide to the first slide
		_setActive(0);
		var index = duplicates ? 1 : 0;
		swiper.slideTo(index, 0);
	};

	/**
  * Prevent text selection by clicking on swiper buttons
  * @private
  */
	var _preventTextSelection = function _preventTextSelection() {
		$(options.sliderOptions.nextButton).on('selectstart', function () {
			return false;
		});
		$(options.sliderOptions.prevButton).on('selectstart', function () {
			return false;
		});
	};

	/**
  * Sets the initial height for one swiper image container to prevent cutted off images on smaller swiper heights
  * @private
  */
	var _scaleThumbnailHeight = function _scaleThumbnailHeight() {
		var $containerHeight = $('.swiper-container-vertical .swiper-slide').css('height');

		$('.align-middle').css('height', $containerHeight);
	};

	// ########## INITIALIZATION ##########

	/**
  * Init function of the widget
  * @constructor
  */
	module.init = function (done) {

		$slides = $this.find('.swiper-slide');
		$controls = $(options.controls);
		$target = $(options.target);
		$template = $this.find('template');

		// Check if all images inside the swiper have
		// thumbnail image given
		$slides.each(function () {
			if (!$(this).data().thumbImage) {
				hasThumbnails = false;
				return false;
			}
		});

		// Add the breakpoint handler ty dynamically
		// set the options corresponding to the browser size
		$body.on(jse.libs.template.events.BREAKPOINT(), _breakpointHandler);
		_breakpointHandler();

		// If this instance is a "control" swiper the target is the main swiper
		// which will be updated on a click inside this control swiper
		if (options.target) {
			$this.on('click.swiper', '.swiper-slide', _clickHandler);
		}

		$(document).ready(function () {
			$('.swiper-vertical .swiper-slide[data-index]').css('display', 'inline-block');
			$('.product-info-image .swiper-slide[data-index]').css('z-index', 'inherit');
			$('.product-info-image .swiper-slide[data-index] .swiper-slide-inside img.img-responsive').fadeIn(1000);
		});

		_translucenceWorkaround();
		_preventTextSelection();
		_scaleThumbnailHeight();

		// Fix for invisible Thumbnail-Images for switching from Tablet-Portrait to Tablet-Landscape
		$body.on(jse.libs.template.events.BREAKPOINT(), function () {
			_scaleThumbnailHeight();
		});

		done();
	};

	// Return data to widget engine
	return module;
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndpZGdldHMvc3dpcGVyLmpzIl0sIm5hbWVzIjpbImdhbWJpbyIsIndpZGdldHMiLCJtb2R1bGUiLCJzb3VyY2UiLCJkYXRhIiwiJHRoaXMiLCIkIiwiJGJvZHkiLCIkc2xpZGVzIiwiJGNvbnRyb2xzIiwiJHRhcmdldCIsIiR0ZW1wbGF0ZSIsImluaXQiLCJzd2lwZXIiLCJzbGlkZXJPcHRpb25zIiwiaGFzVGh1bWJuYWlscyIsIm1vZGUiLCJicmVha3BvaW50RGF0YXNldCIsImR1cGxpY2F0ZXMiLCJwcmV2ZW50U2xpZGVTdGFydCIsInNsaWRlckRlZmF1bHRzIiwicGFnaW5hdGlvbiIsIm5leHRCdXR0b24iLCJwcmV2QnV0dG9uIiwicGFnaW5hdGlvbkNsaWNrYWJsZSIsImxvb3AiLCJhdXRvcGxheSIsImF1dG9wbGF5RGlzYWJsZU9uSW50ZXJhY3Rpb24iLCJkZWZhdWx0cyIsImNvbnRyb2xzIiwidGFyZ2V0IiwiaW5pdFNsaWRlIiwiYXV0b09mZiIsImRpc2FibGVUcmFuc2x1Y2VuY2VGaXgiLCJicmVha3BvaW50cyIsImJyZWFrcG9pbnQiLCJ1c2VQcmV2aWV3QnVsbGV0cyIsInNsaWRlc1BlclZpZXciLCJjZW50ZXJlZFNsaWRlcyIsIm9wdGlvbnMiLCJleHRlbmQiLCJfZ2VuZXJhdGVQcmV2aWV3QnV0dG9ucyIsImluZGV4IiwiY2xhc3NOYW1lIiwiJGN1cnJlbnRTbGlkZSIsImVxIiwiJGltYWdlIiwiZmluZCIsImFsdFR4dCIsImF0dHIiLCJ0aHVtYkltYWdlIiwiX2dldEluZGV4IiwiX3NldEFjdGl2ZSIsInJlbW92ZUNsYXNzIiwiYWRkQ2xhc3MiLCJfbW91c2VFbnRlckhhbmRsZXIiLCJzdG9wQXV0b3BsYXkiLCJlIiwiX21vdXNlTGVhdmVIYW5kbGVyIiwic3RhcnRBdXRvcGxheSIsIl9nb3RvSGFuZGxlciIsImQiLCJzdG9wUHJvcGFnYXRpb24iLCJvZmYiLCJsZW5ndGgiLCJzbGlkZVRvIiwiX2NsaWNrSGFuZGxlciIsInByZXZlbnREZWZhdWx0IiwiJHNlbGYiLCJ0cmlnZ2VyIiwianNlIiwibGlicyIsInRlbXBsYXRlIiwiZXZlbnRzIiwiU1dJUEVSX0dPVE8iLCJfdHJpZ2dlclNsaWRlQ2hhbmdlIiwibGFzdEluZGV4IiwiX3RyYW5zbHVjZW5jZVdvcmthcm91bmQiLCJlZmZlY3QiLCJmaWx0ZXIiLCJmYWRlVG8iLCJjc3MiLCJfYnJlYWtwb2ludEhhbmRsZXIiLCJvbGRNb2RlIiwibmV3TW9kZSIsInJlc3BvbnNpdmUiLCJleHRlbmRPcHRpb25zIiwibmV3QnJlYWtwb2ludERhdGFzZXQiLCJpZCIsImVhY2giLCJpIiwidiIsInBhZ2luYXRpb25CdWxsZXRSZW5kZXIiLCJpbml0aWFsU2xpZGUiLCJkZXN0cm95IiwiaWdub3JlIiwiJGR1cGxpY2F0ZSIsIlN3aXBlciIsIm9uIiwiU0xJREVTX1VQREFURSIsIl91cGRhdGVTbGlkZXMiLCJjYXRlZ29yeSIsImRhdGFzZXQiLCJjYXROYW1lIiwiYWRkIiwicmVtb3ZlIiwibWFya3VwIiwiaHRtbCIsInN3aXBlclNsaWRlSW5kZXgiLCJ1bmRlZmluZWQiLCJwdXNoIiwicmVtb3ZlU2xpZGUiLCJzcmNhdHRyIiwic3JjIiwiTXVzdGFjaGUiLCJyZW5kZXIiLCJhcHBlbmRTbGlkZSIsIl9wcmV2ZW50VGV4dFNlbGVjdGlvbiIsIl9zY2FsZVRodW1ibmFpbEhlaWdodCIsIiRjb250YWluZXJIZWlnaHQiLCJkb25lIiwiQlJFQUtQT0lOVCIsImRvY3VtZW50IiwicmVhZHkiLCJmYWRlSW4iXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7Ozs7QUFVQTs7QUFFQTs7Ozs7QUFLQUEsT0FBT0MsT0FBUCxDQUFlQyxNQUFmLENBQ0MsUUFERCxFQUdDLENBQ0NGLE9BQU9HLE1BQVAsR0FBZ0IsY0FEakIsRUFFQ0gsT0FBT0csTUFBUCxHQUFnQixrQkFGakIsQ0FIRCxFQVFDLFVBQVNDLElBQVQsRUFBZTs7QUFFZDs7QUFFRjs7QUFFRSxLQUFJQyxRQUFRQyxFQUFFLElBQUYsQ0FBWjtBQUFBLEtB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QVc7QUFDMURIO0FBQ0EsR0FGRDs7QUFJQUU7QUFDQSxFQTNDRDs7QUE2Q0E7QUFDQSxRQUFPdEgsTUFBUDtBQUNBLENBN2lCRiIsImZpbGUiOiJ3aWRnZXRzL3N3aXBlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gc3dpcGVyLmpzIDIwMTYtMTItMTRcbiBHYW1iaW8gR21iSFxuIGh0dHA6Ly93d3cuZ2FtYmlvLmRlXG4gQ29weXJpZ2h0IChjKSAyMDE2IEdhbWJpbyBHbWJIXG4gUmVsZWFzZWQgdW5kZXIgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIChWZXJzaW9uIDIpXG4gW2h0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy9ncGwtMi4wLmh0bWxdXG4gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqL1xuXG4vKiBnbG9iYWxzIFN3aXBlciAqL1xuXG4vKipcbiAqIFdpZGdldCB0aGF0IGJpbmRzIHRoZSBzd2lwZXIgcGx1Z2luICh0aGlyZCBwYXJ0eSkgdG8gYSBET00gZWxlbWVudFxuICpcbiAqIEB0b2RvIFJlbW92ZSB0aGUgdHJ5IC0gY2F0Y2ggYmxvY2tzIGFuZCBhbmQgY29ycmVjdCB0aGUgc3dpcGVyIGlzc3Vlcy5cbiAqL1xuZ2FtYmlvLndpZGdldHMubW9kdWxlKFxuXHQnc3dpcGVyJyxcblxuXHRbXG5cdFx0Z2FtYmlvLnNvdXJjZSArICcvbGlicy9ldmVudHMnLFxuXHRcdGdhbWJpby5zb3VyY2UgKyAnL2xpYnMvcmVzcG9uc2l2ZSdcblx0XSxcblxuXHRmdW5jdGlvbihkYXRhKSB7XG5cblx0XHQndXNlIHN0cmljdCc7XG5cbi8vICMjIyMjIyMjIyMgVkFSSUFCTEUgSU5JVElBTElaQVRJT04gIyMjIyMjIyMjI1xuXG5cdFx0dmFyICR0aGlzID0gJCh0aGlzKSxcblx0XHRcdCRib2R5ID0gJCgnYm9keScpLFxuXHRcdFx0JHNsaWRlcyA9IG51bGwsXG5cdFx0XHQkY29udHJvbHMgPSBudWxsLFxuXHRcdFx0JHRhcmdldCA9IG51bGwsXG5cdFx0XHQkdGVtcGxhdGUgPSBudWxsLFxuXHRcdFx0aW5pdCA9IHRydWUsXG5cdFx0XHRzd2lwZXIgPSBudWxsLFxuXHRcdFx0c2xpZGVyT3B0aW9ucyA9IG51bGwsXG5cdFx0XHRoYXNUaHVtYm5haWxzID0gdHJ1ZSxcblx0XHRcdG1vZGUgPSBudWxsLFxuXHRcdFx0YnJlYWtwb2ludERhdGFzZXQgPSBudWxsLFxuXHRcdFx0ZHVwbGljYXRlcyA9IGZhbHNlLFxuXHRcdFx0cHJldmVudFNsaWRlU3RhcnQgPSBmYWxzZSxcblx0XHRcdHNsaWRlckRlZmF1bHRzID0geyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRGVmYXVsdCBjb25maWd1cmF0aW9uIGZvciB0aGUgc3dpcGVyXG5cdFx0XHRcdHBhZ2luYXRpb246ICcuc3dpcGVyLXBhZ2luYXRpb24nLFxuXHRcdFx0XHRuZXh0QnV0dG9uOiAnLnN3aXBlci1idXR0b24tbmV4dCcsXG5cdFx0XHRcdHByZXZCdXR0b246ICcuc3dpcGVyLWJ1dHRvbi1wcmV2Jyxcblx0XHRcdFx0cGFnaW5hdGlvbkNsaWNrYWJsZTogdHJ1ZSxcblx0XHRcdFx0bG9vcDogdHJ1ZSxcblx0XHRcdFx0YXV0b3BsYXk6IDMsXG5cdFx0XHRcdGF1dG9wbGF5RGlzYWJsZU9uSW50ZXJhY3Rpb246IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0ZGVmYXVsdHMgPSB7XG5cdFx0XHRcdC8vIEpTT04gdGhhdCBnZXRzIG1lcmdlZCB3aXRoIHRoZSBzbGlkZXJEZWZhdWx0cyBhbmQgaXMgcGFzc2VkIHRvIFwic3dpcGVyXCIgZGlyZWN0bHkuXG5cdFx0XHRcdHNsaWRlck9wdGlvbnM6IG51bGwsXG5cdFx0XHRcdC8vIElmIHRoaXMgaW5zdGFuY2UgaXMgYSBcIm1haW5cIiBzd2lwZXIsIHRoZSBnaXZlbiBzZWxlY3RvciBzZWxlY3RzIHRoZSBcImNvbnRyb2xcIiBzd2lwZXIuXG5cdFx0XHRcdGNvbnRyb2xzOiBudWxsLFxuXHRcdFx0XHQvLyBJZiB0aGlzIGluc3RhbmNlIGlzIGEgXCJjb250cm9sXCIgc3dpcGVyLCB0aGUgZ2l2ZW4gc2VsZWN0b3Igc2VsZWN0cyB0aGUgXCJtYWluXCIgc3dpcGVyLlxuXHRcdFx0XHR0YXJnZXQ6IG51bGwsXG5cdFx0XHRcdC8vIFNldHMgdGhlIGluaXRpYWwgc2xpZGUgKG5lZWRlZCB0byBwcmV2ZW50IGRpZmZlcmVudCBpbml0IHNsaWRlcyBpbiBtYWluL2NvbnRyb2xsZXIgc2xpZGVyKS5cblx0XHRcdFx0aW5pdFNsaWRlOiBudWxsLFxuXHRcdFx0XHQvLyBEZXRlY3QgaWYgYSBzd2lwZXIgaXMgbmVlZGVkIGZvciB0aGUgYnJlYWtwb2ludC4gSWYgbm90LCB0dXJuIGl0IG9mZlxuXHRcdFx0XHRhdXRvT2ZmOiBmYWxzZSxcblx0XHRcdFx0Ly8gVGhlIHRyYW5zbHVjZW5jZSBmaXggZW5hYmxlcyBzdXBwb3J0IGZvciBhIGZhZGUgZWZmZWN0IGJldHdlZW4gaW1hZ2VzIHdpdGggZGlmZmVyZW50IGFzcGVjdCByYXRpbyxcblx0XHRcdFx0Ly8gYnV0IGNhdXNpbmcgYSBkZWxheSBiZXR3ZWVuIHRoZSBjaGFuZ2Vcblx0XHRcdFx0ZGlzYWJsZVRyYW5zbHVjZW5jZUZpeDogZmFsc2UsXG5cdFx0XHRcdGJyZWFrcG9pbnRzOiBbXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0Ly8gVW50aWwgd2hpY2ggYnJlYWtwb2ludCB0aGlzIHNldHRpbmdzIGlzIGF2YWlsYWJsZVxuXHRcdFx0XHRcdFx0YnJlYWtwb2ludDogNDAsXG5cdFx0XHRcdFx0XHQvLyBJZiB0cnVlLCB0aGUgcGFnaW5nIGJ1bGxldHMgd2lsbCBiZSByZXBsYWNlZCB3aXRoIHRoZSBwcmV2aWV3IGltYWdlcy5cblx0XHRcdFx0XHRcdHVzZVByZXZpZXdCdWxsZXRzOiBmYWxzZSxcblx0XHRcdFx0XHRcdC8vIFRoaXMgYW5kIGFsbCBvdGhlciBzZXR0aW5ncyBiZWxvbmdpbmcgdG8gdGhlIHN3aXBlciBwbHVnaW4uXG5cdFx0XHRcdFx0XHRzbGlkZXNQZXJWaWV3OiAyLFxuXHRcdFx0XHRcdFx0Ly8gSWYgdHJ1ZSwgdGhlIGN1cnJlbnQgc2xpZGUgZ2V0cyBjZW50ZXJlZCBpbiB2aWV3IChtb3N0IHVzZWZ1bGwgd2l0aCBhbiBldmVuIHNsaWRlc1BlclZpZXdcblx0XHRcdFx0XHRcdC8vIGNvdW50KS5cblx0XHRcdFx0XHRcdGNlbnRlcmVkU2xpZGVzOiB0cnVlXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRicmVha3BvaW50OiA2MCxcblx0XHRcdFx0XHRcdHVzZVByZXZpZXdCdWxsZXRzOiB0cnVlLFxuXHRcdFx0XHRcdFx0c2xpZGVzUGVyVmlldzogM1xuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0YnJlYWtwb2ludDogODAsXG5cdFx0XHRcdFx0XHR1c2VQcmV2aWV3QnVsbGV0czogdHJ1ZSxcblx0XHRcdFx0XHRcdHNsaWRlc1BlclZpZXc6IDNcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGJyZWFrcG9pbnQ6IDEwMCxcblx0XHRcdFx0XHRcdHVzZVByZXZpZXdCdWxsZXRzOiB0cnVlLFxuXHRcdFx0XHRcdFx0c2xpZGVzUGVyVmlldzogNVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XVxuXHRcdFx0fSxcblx0XHRcdG9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgZGVmYXVsdHMsIGRhdGEpLFxuXHRcdFx0bW9kdWxlID0ge307XG5cblxuLy8gIyMjIyMjIyMjIyBIRUxQRVIgRlVOQ1RJT05TICMjIyMjIyMjIyNcblx0XHRcblx0XHQvKipcblx0XHQgKiBGdW5jdGlvbiB0aGF0IGdlbmVyYXRlcyB0aGUgbWFya3VwIGZvclxuXHRcdCAqIHRoZSBwcmV2aWV3IGJ1bGxldHNcblx0XHQgKiBAcGFyYW0gICAgICAge1N3aXBlcn0gICAgICAgIHN3aXBlciAgICAgICAgICBTd2lwZXIgb2JqZWN0XG5cdFx0ICogQHBhcmFtICAgICAgIHtpbnRlZ2VyfSAgICAgICBpbmRleCAgICAgICAgICAgSW5kZXggb2YgdGhlIHNsaWRlXG5cdFx0ICogQHBhcmFtICAgICAgIHtzdHJpbmd9ICAgICAgICBjbGFzc05hbWUgICAgICAgVGhlIGNsYXNzbmFtZSB0aGF0IG11c3QgYmUgYWRkIHRvIHRoZSBtYXJrdXBcblx0XHQgKiBAcmV0dXJuICAgICAge3N0cmluZ30gICAgICAgICAgICAgICAgICAgICAgICBUaGUgcHJldmlldyBpbWFnZSBodG1sIHN0cmluZ1xuXHRcdCAqIEBwcml2YXRlXG5cdFx0ICovXG5cdFx0dmFyIF9nZW5lcmF0ZVByZXZpZXdCdXR0b25zID0gZnVuY3Rpb24gKHN3aXBlciwgaW5kZXgsIGNsYXNzTmFtZSkge1xuXHRcdFx0dmFyICRjdXJyZW50U2xpZGUgPSAkc2xpZGVzLmVxKGluZGV4KSxcblx0XHRcdFx0JGltYWdlID0gJGN1cnJlbnRTbGlkZS5maW5kKCdpbWcnKSxcblx0XHRcdFx0YWx0VHh0ID0gJGltYWdlLmF0dHIoJ2FsdCcpLFxuXHRcdFx0XHR0aHVtYkltYWdlID0gJGN1cnJlbnRTbGlkZS5kYXRhKCd0aHVtYkltYWdlJyk7XG5cdFx0XHRcblx0XHRcdGlmICh0aHVtYkltYWdlKSB7XG5cdFx0XHRcdHJldHVybiAnPGltZyBzcmM9XCInICsgdGh1bWJJbWFnZSArICdcIiBhbHQ9XCInICsgYWx0VHh0ICsgJ1wiIGNsYXNzPVwiJyArIGNsYXNzTmFtZSArICdcIiAvPic7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdHJldHVybiAnJztcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogSGVscGVyIGZ1bmN0aW9uIHRvIGdldCB0aGUgaW5kZXggb2YgdGhlXG5cdFx0ICogYWN0aXZlIHNsaWRlXG5cdFx0ICogQHJldHVybiAgICAge2ludGVnZXJ9ICAgICAgICAgICAgICAgICAgICAgICBUaGUgaW5kZXggb2YgdGhlIGFjdGl2ZSBzbGlkZVxuXHRcdCAqIEBwcml2YXRlXG5cdFx0ICovXG5cdFx0dmFyIF9nZXRJbmRleCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIGluZGV4ID0gJHRoaXNcblx0XHRcdFx0LmZpbmQoJy5zd2lwZXItc2xpZGUtYWN0aXZlJylcblx0XHRcdFx0LmluZGV4KCk7XG5cblx0XHRcdC8vIElmIHRoZXJlIGFyZSBkdXBsaWNhdGUgc2xpZGVzIChnZW5lcmF0ZWRcblx0XHRcdC8vIGJ5IHRoZSBzd2lwZXIpIHJlY2FsY3VsYXRlIHRoZSBpbmRleFxuXHRcdFx0aW5kZXggPSBkdXBsaWNhdGVzID8gaW5kZXggLSAxIDogaW5kZXg7XG5cdFx0XHRpbmRleCA9IGluZGV4IHx8IDA7XG5cblx0XHRcdHJldHVybiBpbmRleDtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogSGVscGVyIGZ1bmN0aW9uIHRvIGFkZCB0aGUgYWN0aXZlXG5cdFx0ICogY2xhc3MgdG8gdGhlIGFjdGl2ZSBzbGlkZVxuXHRcdCAqIEBwYXJhbSAgICAgICB7aW50ZWdlcn0gICAgICAgICAgIGluZGV4ICAgICAgIFRoZSBpbmRleCBvZiB0aGUgYWN0aXZlIHNsaWRlXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKi9cblx0XHR2YXIgX3NldEFjdGl2ZSA9IGZ1bmN0aW9uKGluZGV4KSB7XG5cdFx0XHQkc2xpZGVzID0gJHRoaXMuZmluZCgnLnN3aXBlci1zbGlkZTpub3QoLnN3aXBlci1zbGlkZS1kdXBsaWNhdGUpJyk7XG5cdFx0XHRpbmRleCA9IGR1cGxpY2F0ZXMgPyBpbmRleCArIDEgOiBpbmRleDtcblx0XHRcdCRzbGlkZXNcblx0XHRcdFx0LnJlbW92ZUNsYXNzKCdhY3RpdmUnKVxuXHRcdFx0XHQuZXEoaW5kZXgpXG5cdFx0XHRcdC5hZGRDbGFzcygnYWN0aXZlJyk7XG5cdFx0fTtcblxuXG4vLyAjIyMjIyMjIyMjIEVWRU5UIEhBTkRMRVIgIyMjIyMjIyMjI1xuXG5cdFx0LyoqXG5cdFx0ICogRXZlbnQgaGFuZGxlciBmb3IgdGhlIG1vdXNlZW50ZXIgZXZlbnQuXG5cdFx0ICogSXQgZGlzYWJsZXMgdGhlIGF1dG9wbGF5XG5cdFx0ICogQHByaXZhdGVcblx0XHQgKi9cblx0XHR2YXIgX21vdXNlRW50ZXJIYW5kbGVyID0gZnVuY3Rpb24oKSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRpZiAoc3dpcGVyKSB7XG5cdFx0XHRcdFx0c3dpcGVyLnN0b3BBdXRvcGxheSgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdC8vIERvIG5vdCBsb2cgdGhlIGVycm9yXG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIEV2ZW50IGhhbmRsZXIgZm9yIHRoZSBtb3VzZWxlYXZlIGV2ZW50LlxuXHRcdCAqIEl0IGVuYWJsZXMgdGhlIGF1dG9wbGF5XG5cdFx0ICogQHByaXZhdGVcblx0XHQgKi9cblx0XHR2YXIgX21vdXNlTGVhdmVIYW5kbGVyID0gZnVuY3Rpb24oKSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRpZiAoc3dpcGVyKSB7XG5cdFx0XHRcdFx0c3dpcGVyLnN0YXJ0QXV0b3BsYXkoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHQvLyBEbyBub3QgbG9nIHRoZSBlcnJvclxuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBFdmVudCBoYW5kbGVyIGZvciB0aGUgZ290byBldmVudC5cblx0XHQgKiBJdCBzd2l0Y2hlcyB0aGUgY3VycmVudCBzbGlkZSB0byB0aGUgZ2l2ZW4gaW5kZXhcblx0XHQgKiBhbmQgYWRkcyB0aGUgYWN0aXZlIGNsYXNzIHRvIHRoZSBuZXcgYWN0aXZlIHNsaWRlXG5cdFx0ICogQHBhcmFtICAgICAgIHtvYmplY3R9ICAgIGUgICAgICAgalF1ZXJ5IGV2ZW50IG9iamVjdFxuXHRcdCAqIEBwYXJhbSAgICAgICB7bnVtYmVyfSAgICBkICAgICAgIEluZGV4IG9mIHRoZSBzbGlkZSB0byBzaG93XG5cdFx0ICogQHByaXZhdGVcblx0XHQgKi9cblx0XHR2YXIgX2dvdG9IYW5kbGVyID0gZnVuY3Rpb24oZSwgZCkge1xuXHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblxuXHRcdFx0Ly8gU2V0IHRoZSBhY3RpdmUgc2xpZGVcblx0XHRcdF9zZXRBY3RpdmUoZCk7XG5cblx0XHRcdC8vIFRlbXBvcmFyeSBkZWFjdGl2YXRlIHRoZSBvblNsaWRlQ2hhbmdlU3RhcnQgZXZlbnRcblx0XHRcdC8vIHRvIHByZXZlbnQgbG9vcGluZyB0aHJvdWdoIHRoZSBnb3RvIC8gY2hhbmdlU3RhcnRcblx0XHRcdC8vIGV2ZW50c1xuXHRcdFx0cHJldmVudFNsaWRlU3RhcnQgPSB0cnVlO1xuXG5cdFx0XHQvLyBSZW1vdmUgdGhlIGF1dG9wbGF5IGFmdGVyIGEgZ290byBldmVudFxuXHRcdFx0JHRoaXMub2ZmKCdtb3VzZWxlYXZlLnN3aXBlcicpO1xuXHRcdFx0c3dpcGVyLnN0b3BBdXRvcGxheSgpO1xuXG5cdFx0XHQvLyBUcnkgdG8gY29ycmVjdCB0aGUgaW5kZXggYmV0d2VlbiBzbGlkZXJzXG5cdFx0XHQvLyB3aXRoIGFuZCB3aXRob3V0IGR1cGxpY2F0ZXNcblx0XHRcdHZhciBpbmRleCA9IGR1cGxpY2F0ZXMgPyBkICsgMSA6IGQ7XG5cdFx0XHRpZiAoaW5kZXggPiAkc2xpZGVzLmxlbmd0aCkge1xuXHRcdFx0XHRpbmRleCA9IDA7XG5cdFx0XHR9XG5cblx0XHRcdC8vIEdvdG8gdGhlIGRlc2lyZWQgc2xpZGVcblx0XHRcdHN3aXBlci5zbGlkZVRvKGluZGV4KTtcblxuXHRcdFx0Ly8gUmVhY3RpdmF0ZSB0aGUgb25TbGlkZUNoYW5nZUV2ZW50XG5cdFx0XHRwcmV2ZW50U2xpZGVTdGFydCA9IGZhbHNlO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBDbGljayBldmVudCBoYW5kbGVyIHRoYXQgdHJpZ2dlcnMgYVxuXHRcdCAqIFwiZ290b1wiIGV2ZW50IHRvIHRoZSB0YXJnZXQgc3dpcGVyXG5cdFx0ICogQHBhcmFtICAgICAgIHtvYmplY3R9ICAgICAgICBlICAgICAgIGpRdWVyeSBldmVudCBvYmplY3Rcblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqL1xuXHRcdHZhciBfY2xpY2tIYW5kbGVyID0gZnVuY3Rpb24oZSkge1xuXHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblxuXHRcdFx0dmFyICRzZWxmID0gJCh0aGlzKSxcblx0XHRcdFx0aW5kZXggPSAkc2VsZi5pbmRleCgpO1xuXG5cdFx0XHRpbmRleCA9IGR1cGxpY2F0ZXMgPyBpbmRleCAtIDEgOiBpbmRleDtcblxuXHRcdFx0Ly8gU2V0IHRoZSBhY3RpdmUgc2xpZGVcblx0XHRcdF9zZXRBY3RpdmUoaW5kZXgpO1xuXG5cdFx0XHQvLyBJbmZvcm0gdGhlIG1haW4gc3dpcGVyXG5cdFx0XHQkdGFyZ2V0LnRyaWdnZXIoanNlLmxpYnMudGVtcGxhdGUuZXZlbnRzLlNXSVBFUl9HT1RPKCksIGluZGV4KTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogRXZlbnQgdGhhdCBnZXRzIHRyaWdnZXJlZCBvbiBzbGlkZUNoYW5nZS5cblx0XHQgKiBJZiB0aGUgc2xpZGUgZ2V0cyBjaGFuZ2VkLCB0aGUgY29udHJvbHNcblx0XHQgKiB3aWxsIGZvbGxvdyB0aGUgY3VycmVudCBzbGlkZSBpbiBwb3NpdGlvblxuXHRcdCAqIEBwcml2YXRlXG5cdFx0ICovXG5cdFx0dmFyIF90cmlnZ2VyU2xpZGVDaGFuZ2UgPSBmdW5jdGlvbigpIHtcblx0XHRcdGlmICghcHJldmVudFNsaWRlU3RhcnQpIHtcblx0XHRcdFx0dmFyIGluZGV4ID0gX2dldEluZGV4KCksXG5cdFx0XHRcdFx0bGFzdEluZGV4ID0gJHNsaWRlcy5sZW5ndGggLSAyO1xuXG5cblx0XHRcdFx0Ly8gUmVjYWxjdWxhdGUgaW5kZXggaWYgZHVwbGljYXRlIHNsaWRlcyBhcmUgaW5zaWRlIHRoZSBzbGlkZXJcblx0XHRcdFx0aWYgKGluZGV4IDwgMCkge1xuXHRcdFx0XHRcdGluZGV4ID0gJHNsaWRlcy5sZW5ndGggLSAzO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGluZGV4ID0gKGR1cGxpY2F0ZXMgJiYgaW5kZXggPT09IGxhc3RJbmRleCkgPyBpbmRleCAtIGxhc3RJbmRleCA6IGluZGV4O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gU2V0IHRoZSBhY3RpdmUgc2xpZGVcblx0XHRcdFx0X3NldEFjdGl2ZShpbmRleCk7XG5cblx0XHRcdFx0Ly8gSW5mb3JtIHRoZSBjb250cm9sc1xuXHRcdFx0XHQkY29udHJvbHMudHJpZ2dlcihqc2UubGlicy50ZW1wbGF0ZS5ldmVudHMuU1dJUEVSX0dPVE8oKSwgaW5kZXgpO1xuXHRcdFx0fVxuXHRcdH07XG5cblxuXHRcdC8qKlxuXHRcdCAqIFdvcmthcm91bmQgZm9yIHRoZSB0cmFuc2x1Y2VuY2UgaXNzdWVcblx0XHQgKiB0aGF0IGhhcHBlbnMgb24gc21hbGwgc2NyZWVucyB3aXRoIGVuYWJsZWRcblx0XHQgKiBmYWRlIGVmZmVjdC4gTWF5YmUgaXQgY2FuIGJlIHJlbW92ZWQsIGlmIHRoZVxuXHRcdCAqIHN3aXBlciBnZXRzIHVwZGF0ZWQgaXRzZWxmXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKi9cblx0XHR2YXIgX3RyYW5zbHVjZW5jZVdvcmthcm91bmQgPSBmdW5jdGlvbigpIHtcblx0XHRcdGlmICghb3B0aW9ucy5kaXNhYmxlVHJhbnNsdWNlbmNlRml4ICYmIHNsaWRlck9wdGlvbnMgJiYgc2xpZGVyT3B0aW9ucy5lZmZlY3QgPT09ICdmYWRlJykge1xuXHRcdFx0XHQkdGhpcy5maW5kKCcuc3dpcGVyLXNsaWRlJylcblx0XHRcdFx0XHQuZmlsdGVyKCc6bm90KC5zd2lwZXItc2xpZGUtYWN0aXZlKScpXG5cdFx0XHRcdFx0LmZhZGVUbygzMDAsIDAsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0JCh0aGlzKS5jc3MoJ3Zpc2liaWxpdHknLCAnaGlkZGVuJyk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFxuXHRcdFx0XHQkdGhpcy5maW5kKCcuc3dpcGVyLXNsaWRlJylcblx0XHRcdFx0XHQuZmlsdGVyKCcuc3dpcGVyLXNsaWRlLWFjdGl2ZScpXG5cdFx0XHRcdFx0LmZhZGVUbygzMDAsIDEsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0JCh0aGlzKS5jc3MoJ3Zpc2liaWxpdHknLCAnJyk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFRoZSBicmVha3BvaW50IGhhbmRsZXIgaW5pdGlhbGl6ZXMgdGhlIHN3aXBlclxuXHRcdCAqIHdpdGggdGhlIHNldHRpbmdzIGZvciB0aGUgY3VycmVudCBicmVha3BvaW50LlxuXHRcdCAqIFRoZXJlZm9yZSBpdCB1c2VzIHRoZSBkZWZhdWx0IHNsaWRlciBvcHRpb25zLFxuXHRcdCAqIHRoZSBjdXN0b20gc2xpZGVyIG9wdGlvbnMgZ2l2ZW4gYnkgdGhlIG9wdGlvbnNcblx0XHQgKiBvYmplY3QgYW5kIHRoZSBicmVha3BvaW50IG9wdGlvbnMgb2JqZWN0IGFsc29cblx0XHQgKiBnaXZlbiBieSB0aGUgb3B0aW9ucyAoaW4gdGhpcyBvcmRlcilcblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqL1xuXHRcdHZhciBfYnJlYWtwb2ludEhhbmRsZXIgPSBmdW5jdGlvbigpIHtcblxuXHRcdFx0Ly8gR2V0IHRoZSBjdXJyZW50IHZpZXdtb2RlXG5cdFx0XHR2YXIgb2xkTW9kZSA9IG1vZGUgfHwge30sXG5cdFx0XHRcdG5ld01vZGUgPSBqc2UubGlicy50ZW1wbGF0ZS5yZXNwb25zaXZlLmJyZWFrcG9pbnQoKSxcblx0XHRcdFx0ZXh0ZW5kT3B0aW9ucyA9IG9wdGlvbnMuYnJlYWtwb2ludHNbMF0gfHwge30sXG5cdFx0XHRcdG5ld0JyZWFrcG9pbnREYXRhc2V0ID0gbnVsbDtcblxuXHRcdFx0Ly8gT25seSBkbyBzb21ldGhpbmcgaWYgdGhlIHZpZXcgd2FzIGNoYW5nZWRcblx0XHRcdGlmIChuZXdNb2RlLmlkICE9PSBvbGRNb2RlLmlkKSB7XG5cblx0XHRcdFx0Ly8gU3RvcmUgdGhlIG5ldyB2aWV3bW9kZVxuXHRcdFx0XHRtb2RlID0gJC5leHRlbmQoe30sIG5ld01vZGUpO1xuXG5cdFx0XHRcdC8vIEl0ZXJhdGUgdGhyb3VnaCB0aGUgYnJlYWtwb2ludHMgb2JqZWN0IHRvIGRldGVjdFxuXHRcdFx0XHQvLyB0aGUgY29ycmVjdCBzZXR0aW5ncyBmb3IgdGhlIGN1cnJlbnQgYnJlYWtwb2ludFxuXHRcdFx0XHQkLmVhY2gob3B0aW9ucy5icmVha3BvaW50cywgZnVuY3Rpb24oaSwgdikge1xuXHRcdFx0XHRcdGlmICh2LmJyZWFrcG9pbnQgPiBuZXdNb2RlLmlkKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdG5ld0JyZWFrcG9pbnREYXRhc2V0ID0gaTtcblx0XHRcdFx0XHRleHRlbmRPcHRpb25zID0gdjtcblx0XHRcdFx0fSk7XG5cdFx0XHRcdFxuXHRcdFx0XHRpZiAob3B0aW9ucy5zbGlkZXJPcHRpb25zICYmIG9wdGlvbnMuc2xpZGVyT3B0aW9ucy5icmVha3BvaW50cykge1xuXHRcdFx0XHRcdCQuZWFjaChvcHRpb25zLnNsaWRlck9wdGlvbnMuYnJlYWtwb2ludHMsIGZ1bmN0aW9uKGksIHYpIHtcblx0XHRcdFx0XHRcdGlmICh2LmJyZWFrcG9pbnQgPT09IG5ld01vZGUuaWQpIHtcblx0XHRcdFx0XHRcdFx0ZXh0ZW5kT3B0aW9ucyA9IHY7XG5cdFx0XHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIE9ubHkgZG8gc29tZXRoaW5nIGlmIHRoZSBzZXR0aW5ncyBjaGFuZ2UgZHVlIGJyb3dzZXJcblx0XHRcdFx0Ly8gcmVzaXplIG9yIGlmIGl0J3MgdGhlIGZpcnN0IHRpbWUgcnVuXG5cdFx0XHRcdGlmIChuZXdCcmVha3BvaW50RGF0YXNldCAhPT0gYnJlYWtwb2ludERhdGFzZXQgfHwgaW5pdCkge1xuXHRcdFx0XHRcdC8vIENvbWJpbmUgdGhlIHNldHRpbmdzXG5cdFx0XHRcdFx0c2xpZGVyT3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBzbGlkZXJEZWZhdWx0cywgb3B0aW9ucy5zbGlkZXJPcHRpb25zIHx8IHt9LCBleHRlbmRPcHRpb25zKTtcblxuXHRcdFx0XHRcdC8vIEFkZCB0aGUgcHJldmlldyBpbWFnZSBidWxsZXRzIGZ1bmN0aW9uIHRvIHRoZSBvcHRpb25zIG9iamVjdFxuXHRcdFx0XHRcdGlmIChzbGlkZXJPcHRpb25zLnVzZVByZXZpZXdCdWxsZXRzICYmIGhhc1RodW1ibmFpbHMpIHtcblx0XHRcdFx0XHRcdHNsaWRlck9wdGlvbnMucGFnaW5hdGlvbkJ1bGxldFJlbmRlciA9IF9nZW5lcmF0ZVByZXZpZXdCdXR0b25zO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdC8vIEFkZCB0aGUgYXV0b3BsYXkgaW50ZXJ2YWwgdG8gdGhlIG9wdGlvbnMgb2JqZWN0XG5cdFx0XHRcdFx0c2xpZGVyT3B0aW9ucy5hdXRvcGxheSA9IChzbGlkZXJPcHRpb25zLmF1dG9wbGF5KSA/IChzbGlkZXJPcHRpb25zLmF1dG9wbGF5ICogMTAwMCkgOiAwO1xuXG5cdFx0XHRcdFx0Ly8gRGlzYWJsZSBsb29wIGlmIHRoZXJlIGlzIG9ubHkgb25lIHNsaWRlci4gXG5cdFx0XHRcdFx0aWYgKCR0aGlzLmZpbmQoJy5zd2lwZXItc2xpZGUnKS5sZW5ndGggPT09IDEpIHtcblx0XHRcdFx0XHRcdHNsaWRlck9wdGlvbnMubG9vcCA9IGZhbHNlOyBcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0Ly8gSWYgYW4gc3dpcGVyIGV4aXN0cywgZ2V0IHRoZSBjdXJyZW50XG5cdFx0XHRcdFx0Ly8gc2xpZGUgbm8uIGFuZCByZW1vdmUgdGhlIG9sZCBzd2lwZXJcblx0XHRcdFx0XHRpZiAoc3dpcGVyKSB7XG5cdFx0XHRcdFx0XHRzbGlkZXJPcHRpb25zLmluaXRpYWxTbGlkZSA9IF9nZXRJbmRleCgpO1xuXHRcdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdFx0c3dpcGVyLmRlc3Ryb3kodHJ1ZSwgdHJ1ZSk7XG5cdFx0XHRcdFx0XHR9IGNhdGNoIChpZ25vcmUpIHtcblx0XHRcdFx0XHRcdFx0c3dpcGVyID0gbnVsbDtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRzbGlkZXJPcHRpb25zLmluaXRpYWxTbGlkZSA9IG9wdGlvbnMuaW5pdFNsaWRlIHx8IHNsaWRlck9wdGlvbnMuaW5pdGlhbFNsaWRlIHx8IDA7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0dmFyICRkdXBsaWNhdGUgPSAkdGhpcy5maW5kKCcuc3dpcGVyLXNsaWRlOm5vdCguc3dpcGVyLXNsaWRlLWR1cGxpY2F0ZSknKTtcblxuXHRcdFx0XHRcdGlmICghb3B0aW9ucy5hdXRvT2ZmIHx8ICgkZHVwbGljYXRlLmxlbmd0aCA+IHNsaWRlck9wdGlvbnMuc2xpZGVzUGVyVmlldyAmJiBvcHRpb25zLmF1dG9PZmYpKSB7XG5cdFx0XHRcdFx0XHQkdGhpc1xuXHRcdFx0XHRcdFx0XHQuYWRkQ2xhc3MoJ3N3aXBlci1pcy1hY3RpdmUnKVxuXHRcdFx0XHRcdFx0XHQucmVtb3ZlQ2xhc3MoJ3N3aXBlci1pcy1ub3QtYWN0aXZlJyk7XG5cblx0XHRcdFx0XHRcdC8vIEluaXRpYWxpemUgdGhlIHN3aXBlclxuXHRcdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdFx0c3dpcGVyID0gbmV3IFN3aXBlcigkdGhpcywgc2xpZGVyT3B0aW9ucyk7XG5cdFx0XHRcdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybjsgLy8gU3dpcGVyIG1pZ2h0IHRocm93IGFuIGVycm9yIHVwb24gaW5pdGlhbGl6YXRpb24gdGhhdCBzaG91bGQgbm90IGhhbHQgdGhlIHNjcmlwdCBleGVjdXRpb24uXG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdHN3aXBlclxuXHRcdFx0XHRcdFx0XHQub2ZmKCdvblRyYW5zaXRpb25FbmQgb25TbGlkZUNoYW5nZVN0YXJ0Jylcblx0XHRcdFx0XHRcdFx0Lm9uKCdvblRyYW5zaXRpb25FbmQnLCBfdHJhbnNsdWNlbmNlV29ya2Fyb3VuZCk7XG5cblx0XHRcdFx0XHRcdC8vIElmIHRoaXMgaXMgYSBcIm1haW5cIiBzd2lwZXIgYW5kIGhhcyBleHRlcm5hbCBjb250cm9scywgYW5cblx0XHRcdFx0XHRcdC8vIGdvdG8gZXZlbnQgaXMgdHJpZ2dlcmVkIGlmIHRoZSBjdXJyZW50IHNsaWRlIGlzIGNoYW5nZWRcblx0XHRcdFx0XHRcdGlmICgkY29udHJvbHMubGVuZ3RoKSB7XG5cdFx0XHRcdFx0XHRcdHN3aXBlci5vbignb25TbGlkZUNoYW5nZVN0YXJ0JywgX3RyaWdnZXJTbGlkZUNoYW5nZSk7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdC8vIEFkZCB0aGUgZXZlbnQgaGFuZGxlclxuXHRcdFx0XHRcdFx0JHRoaXNcblx0XHRcdFx0XHRcdFx0Lm9mZignbW91c2VlbnRlci5zd2lwZXIgbW91c2VsZWF2ZS5zd2lwZXIgJyArIGpzZS5saWJzLnRlbXBsYXRlLmV2ZW50cy5TV0lQRVJfR09UTygpICsgJyAnXG5cdFx0XHRcdFx0XHRcdCAgICAgKyBqc2UubGlicy50ZW1wbGF0ZS5ldmVudHMuU0xJREVTX1VQREFURSgpKVxuXHRcdFx0XHRcdFx0XHQub24oJ21vdXNlZW50ZXIuc3dpcGVyJywgX21vdXNlRW50ZXJIYW5kbGVyKVxuXHRcdFx0XHRcdFx0XHQub24oJ21vdXNlbGVhdmUuc3dpcGVyJywgX21vdXNlTGVhdmVIYW5kbGVyKVxuXHRcdFx0XHRcdFx0XHQub24oanNlLmxpYnMudGVtcGxhdGUuZXZlbnRzLlNXSVBFUl9HT1RPKCksIF9nb3RvSGFuZGxlcilcblx0XHRcdFx0XHRcdFx0Lm9uKGpzZS5saWJzLnRlbXBsYXRlLmV2ZW50cy5TTElERVNfVVBEQVRFKCksIF91cGRhdGVTbGlkZXMpO1xuXG5cdFx0XHRcdFx0XHRpZiAoaW5pdCkge1xuXHRcdFx0XHRcdFx0XHQvLyBDaGVjayBpZiB0aGVyZSBhcmUgZHVwbGljYXRlcyBzbGlkZXMgKGdlbmVyYXRlZCBieSB0aGUgc3dpcGVyKVxuXHRcdFx0XHRcdFx0XHQvLyBhZnRlciB0aGUgZmlyc3QgdGltZSBpbml0IG9mIHRoZSBzd2lwZXJcblx0XHRcdFx0XHRcdFx0ZHVwbGljYXRlcyA9ICEhJHRoaXMuZmluZCgnLnN3aXBlci1zbGlkZS1kdXBsaWNhdGUnKS5sZW5ndGg7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdC8vIFNldCB0aGUgYWN0aXZlIHNsaWRlXG5cdFx0XHRcdFx0XHR2YXIgaW5kZXggPSAoaW5pdCAmJiBvcHRpb25zLmluaXRTbGlkZSkgPyBvcHRpb25zLmluaXRTbGlkZSA6IF9nZXRJbmRleCgpO1xuXHRcdFx0XHRcdFx0X3NldEFjdGl2ZShpbmRleCk7XG5cblx0XHRcdFx0XHRcdC8vIEluZm9ybSB0aGUgY29udHJvbHMgdGhhdCB0aGUgbWFpbiBzd2lwZXIgaGFzIGNoYW5nZWRcblx0XHRcdFx0XHRcdC8vIEluIGNhc2UgdGhhdCB0aGUgb3RoZXIgc2xpZGVyIGlzbid0IGluaXRpYWxpemVkIHlldCxcblx0XHRcdFx0XHRcdC8vIHNldCBhbiBkYXRhIGF0dHJpYnV0ZSB0byB0aGUgbWFya3VwIGVsZW1lbnQgdG8gaW5mb3JtXG5cdFx0XHRcdFx0XHQvLyBpdCBvbiBpbml0XG5cdFx0XHRcdFx0XHRpZiAoJGNvbnRyb2xzLmxlbmd0aCkge1xuXHRcdFx0XHRcdFx0XHQkY29udHJvbHMuYXR0cignZGF0YS1zd2lwZXItaW5pdC1zbGlkZScsIGluZGV4KTtcblx0XHRcdFx0XHRcdFx0X3RyaWdnZXJTbGlkZUNoYW5nZSgpO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHQvLyBVbnNldCB0aGUgaW5pdCBmbGFnXG5cdFx0XHRcdFx0XHRpbml0ID0gZmFsc2U7XG5cblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0Ly8gRGlzYWJsZSB0aGUgc3dpcGVyIGJ1dHRvbnNcblx0XHRcdFx0XHRcdCR0aGlzXG5cdFx0XHRcdFx0XHRcdC5yZW1vdmVDbGFzcygnc3dpcGVyLWlzLWFjdGl2ZScpXG5cdFx0XHRcdFx0XHRcdC5hZGRDbGFzcygnc3dpcGVyLWlzLW5vdC1hY3RpdmUnKTtcblx0XHRcdFx0XHRcdGluaXQgPSB0cnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHR9XG5cblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogRXZlbnQgaGFuZGxlciB0aGF0IGFkZHMgJiByZW1vdmVzIHNsaWRlcyBmcm9tIHRoZVxuXHRcdCAqIHN3aXBlci4gQWZ0ZXIgdGhlIHNsaWRlcyB3ZXJlIHByb2Nlc3NlZCwgdGhlIGZpcnN0XG5cdFx0ICogc2xpZGUgaXMgc2hvd25cblx0XHQgKiBAcGFyYW0gICAgICAge29iamVjdH0gICAgZSAgICAgICBqUXVlcnkgZXZlbnQgb2JqZWN0XG5cdFx0ICogQHBhcmFtICAgICAgIHtvYmplY3R9ICAgIGQgICAgICAgSlNPTiBvYmplY3QgdGhhdCBjb250YWlucyB0aGUgY2F0ZWdvcmllcyAvIGltYWdlc1xuXHRcdCAqIEBwcml2YXRlXG5cdFx0ICovXG5cdFx0dmFyIF91cGRhdGVTbGlkZXMgPSBmdW5jdGlvbihlLCBkKSB7XG5cblx0XHRcdC8vIExvb3BzIHRocm91Z2ggZWFjaCBjYXRlZ29yeSBpbnNpZGUgdGhlIGltYWdlcyBhcnJheVxuXHRcdFx0JC5lYWNoKGQsIGZ1bmN0aW9uKGNhdGVnb3J5LCBkYXRhc2V0KSB7XG5cdFx0XHRcdHZhciBjYXROYW1lID0gY2F0ZWdvcnkgKyAnLWNhdGVnb3J5Jyxcblx0XHRcdFx0XHRhZGQgPSBbXSxcblx0XHRcdFx0XHRyZW1vdmUgPSBbXSxcblx0XHRcdFx0XHRtYXJrdXAgPSAkdGVtcGxhdGUuaHRtbCgpO1xuXG5cdFx0XHRcdC8vIEdldCBhbGwgaW5kZXhlcyBmcm9tIHRoZSBzbGlkZXNcblx0XHRcdFx0Ly8gb2YgdGhlIHNhbWUgY2F0ZWdvcnkgYW5kIHJlbW92ZVxuXHRcdFx0XHQvLyB0aGVtIGZyb20gdGhlIHNsaWRlclxuXHRcdFx0XHQkc2xpZGVzXG5cdFx0XHRcdFx0LmZpbHRlcignLicgKyBjYXROYW1lKVxuXHRcdFx0XHRcdC5lYWNoKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0dmFyICRzZWxmID0gJCh0aGlzKSxcblx0XHRcdFx0XHRcdFx0aW5kZXggPSAkc2VsZi5kYXRhKCkuc3dpcGVyU2xpZGVJbmRleDtcblxuXHRcdFx0XHRcdFx0aW5kZXggPSBpbmRleCA9PT0gdW5kZWZpbmVkID8gJHNlbGYuaW5kZXgoKSA6IGluZGV4O1xuXHRcdFx0XHRcdFx0cmVtb3ZlLnB1c2goaW5kZXgpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRzd2lwZXIucmVtb3ZlU2xpZGUocmVtb3ZlKTtcblxuXHRcdFx0XHQvLyBHZW5lcmF0ZSB0aGUgbWFya3VwIGZvciB0aGUgbmV3IHNsaWRlc1xuXHRcdFx0XHQvLyBhbmQgYWRkIHRoZW0gdG8gdGhlIHNsaWRlclxuXHRcdFx0XHQkLmVhY2goZGF0YXNldCB8fCBbXSwgZnVuY3Rpb24oaSwgdikge1xuXHRcdFx0XHRcdHYuY2xhc3NOYW1lID0gY2F0TmFtZTtcblx0XHRcdFx0XHR2LnNyY2F0dHIgPSAnc3JjPVwiJyArIHYuc3JjICsgJ1wiJztcblx0XHRcdFx0XHRhZGQucHVzaChNdXN0YWNoZS5yZW5kZXIobWFya3VwLCB2KSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRzd2lwZXIuYXBwZW5kU2xpZGUoYWRkKTtcblxuXHRcdFx0fSk7XG5cblx0XHRcdCRzbGlkZXMgPSAkdGhpcy5maW5kKCcuc3dpcGVyLXNsaWRlJyk7XG5cblx0XHRcdC8vIFRvIHByZXZlbnQgYW4gaW5jb25zaXN0ZW50IHN0YXRlXG5cdFx0XHQvLyBpbiBjb250cm9sIC8gbWFpbiBzbGlkZXIgY29tYmluYXRpb25zXG5cdFx0XHQvLyBzbGlkZSB0byB0aGUgZmlyc3Qgc2xpZGVcblx0XHRcdF9zZXRBY3RpdmUoMCk7XG5cdFx0XHR2YXIgaW5kZXggPSBkdXBsaWNhdGVzID8gMSA6IDA7XG5cdFx0XHRzd2lwZXIuc2xpZGVUbyhpbmRleCwgMCk7XG5cblx0XHR9O1xuXHRcdFxuXHRcdC8qKlxuXHRcdCAqIFByZXZlbnQgdGV4dCBzZWxlY3Rpb24gYnkgY2xpY2tpbmcgb24gc3dpcGVyIGJ1dHRvbnNcblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqL1xuXHRcdHZhciBfcHJldmVudFRleHRTZWxlY3Rpb24gPSBmdW5jdGlvbigpIHtcblx0XHRcdCQob3B0aW9ucy5zbGlkZXJPcHRpb25zLm5leHRCdXR0b24pLm9uKCdzZWxlY3RzdGFydCcsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9KTtcblx0XHRcdCQob3B0aW9ucy5zbGlkZXJPcHRpb25zLnByZXZCdXR0b24pLm9uKCdzZWxlY3RzdGFydCcsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9KTtcblx0XHR9O1xuXHRcdFxuXHRcdC8qKlxuXHRcdCAqIFNldHMgdGhlIGluaXRpYWwgaGVpZ2h0IGZvciBvbmUgc3dpcGVyIGltYWdlIGNvbnRhaW5lciB0byBwcmV2ZW50IGN1dHRlZCBvZmYgaW1hZ2VzIG9uIHNtYWxsZXIgc3dpcGVyIGhlaWdodHNcblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqL1xuXHRcdHZhciBfc2NhbGVUaHVtYm5haWxIZWlnaHQgPSBmdW5jdGlvbigpIHtcblx0XHRcdHZhciAkY29udGFpbmVySGVpZ2h0ID0gJCgnLnN3aXBlci1jb250YWluZXItdmVydGljYWwgLnN3aXBlci1zbGlkZScpLmNzcygnaGVpZ2h0Jyk7XG5cdFx0XHRcblx0XHRcdCQoJy5hbGlnbi1taWRkbGUnKS5jc3MoJ2hlaWdodCcsICRjb250YWluZXJIZWlnaHQpO1xuXHRcdH07XG5cbi8vICMjIyMjIyMjIyMgSU5JVElBTElaQVRJT04gIyMjIyMjIyMjI1xuXG5cdFx0LyoqXG5cdFx0ICogSW5pdCBmdW5jdGlvbiBvZiB0aGUgd2lkZ2V0XG5cdFx0ICogQGNvbnN0cnVjdG9yXG5cdFx0ICovXG5cdFx0bW9kdWxlLmluaXQgPSBmdW5jdGlvbihkb25lKSB7XG5cblx0XHRcdCRzbGlkZXMgPSAkdGhpcy5maW5kKCcuc3dpcGVyLXNsaWRlJyk7XG5cdFx0XHQkY29udHJvbHMgPSAkKG9wdGlvbnMuY29udHJvbHMpO1xuXHRcdFx0JHRhcmdldCA9ICQob3B0aW9ucy50YXJnZXQpO1xuXHRcdFx0JHRlbXBsYXRlID0gJHRoaXMuZmluZCgndGVtcGxhdGUnKTtcblxuXHRcdFx0Ly8gQ2hlY2sgaWYgYWxsIGltYWdlcyBpbnNpZGUgdGhlIHN3aXBlciBoYXZlXG5cdFx0XHQvLyB0aHVtYm5haWwgaW1hZ2UgZ2l2ZW5cblx0XHRcdCRzbGlkZXMuZWFjaChmdW5jdGlvbigpIHtcblx0XHRcdFx0aWYgKCEkKHRoaXMpLmRhdGEoKS50aHVtYkltYWdlKSB7XG5cdFx0XHRcdFx0aGFzVGh1bWJuYWlscyA9IGZhbHNlO1xuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdC8vIEFkZCB0aGUgYnJlYWtwb2ludCBoYW5kbGVyIHR5IGR5bmFtaWNhbGx5XG5cdFx0XHQvLyBzZXQgdGhlIG9wdGlvbnMgY29ycmVzcG9uZGluZyB0byB0aGUgYnJvd3NlciBzaXplXG5cdFx0XHQkYm9keS5vbihqc2UubGlicy50ZW1wbGF0ZS5ldmVudHMuQlJFQUtQT0lOVCgpLCBfYnJlYWtwb2ludEhhbmRsZXIpO1xuXHRcdFx0X2JyZWFrcG9pbnRIYW5kbGVyKCk7XG5cblx0XHRcdC8vIElmIHRoaXMgaW5zdGFuY2UgaXMgYSBcImNvbnRyb2xcIiBzd2lwZXIgdGhlIHRhcmdldCBpcyB0aGUgbWFpbiBzd2lwZXJcblx0XHRcdC8vIHdoaWNoIHdpbGwgYmUgdXBkYXRlZCBvbiBhIGNsaWNrIGluc2lkZSB0aGlzIGNvbnRyb2wgc3dpcGVyXG5cdFx0XHRpZiAob3B0aW9ucy50YXJnZXQpIHtcblx0XHRcdFx0JHRoaXMub24oJ2NsaWNrLnN3aXBlcicsICcuc3dpcGVyLXNsaWRlJywgX2NsaWNrSGFuZGxlcik7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdCQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQkKCcuc3dpcGVyLXZlcnRpY2FsIC5zd2lwZXItc2xpZGVbZGF0YS1pbmRleF0nKS5jc3MoJ2Rpc3BsYXknLCAnaW5saW5lLWJsb2NrJyk7XG5cdFx0XHRcdCQoJy5wcm9kdWN0LWluZm8taW1hZ2UgLnN3aXBlci1zbGlkZVtkYXRhLWluZGV4XScpLmNzcygnei1pbmRleCcsICdpbmhlcml0Jyk7XG5cdFx0XHRcdCQoJy5wcm9kdWN0LWluZm8taW1hZ2UgLnN3aXBlci1zbGlkZVtkYXRhLWluZGV4XSAuc3dpcGVyLXNsaWRlLWluc2lkZSBpbWcuaW1nLXJlc3BvbnNpdmUnKS5mYWRlSW4oMTAwMCk7XG5cdFx0XHR9KTtcblx0XHRcdFxuXHRcdFx0X3RyYW5zbHVjZW5jZVdvcmthcm91bmQoKTtcblx0XHRcdF9wcmV2ZW50VGV4dFNlbGVjdGlvbigpO1xuXHRcdFx0X3NjYWxlVGh1bWJuYWlsSGVpZ2h0KCk7XG5cdFx0XHRcblx0XHRcdC8vIEZpeCBmb3IgaW52aXNpYmxlIFRodW1ibmFpbC1JbWFnZXMgZm9yIHN3aXRjaGluZyBmcm9tIFRhYmxldC1Qb3J0cmFpdCB0byBUYWJsZXQtTGFuZHNjYXBlXG5cdFx0XHQkYm9keS5vbihqc2UubGlicy50ZW1wbGF0ZS5ldmVudHMuQlJFQUtQT0lOVCgpLCBmdW5jdGlvbigpIHtcblx0XHRcdFx0X3NjYWxlVGh1bWJuYWlsSGVpZ2h0KCk7XG5cdFx0XHR9KTtcblxuXHRcdFx0ZG9uZSgpO1xuXHRcdH07XG5cblx0XHQvLyBSZXR1cm4gZGF0YSB0byB3aWRnZXQgZW5naW5lXG5cdFx0cmV0dXJuIG1vZHVsZTtcblx0fSk7XG4iXX0=

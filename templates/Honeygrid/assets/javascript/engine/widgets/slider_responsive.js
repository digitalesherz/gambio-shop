'use strict';

/* --------------------------------------------------------------
 slider_responsive.js 2016-11-14
 Gambio GmbH
 http://www.gambio.de
 Copyright (c) 2016 Gambio GmbH
 Released under the GNU General Public License (Version 2)
 [http://www.gnu.org/licenses/gpl-2.0.html]
 --------------------------------------------------------------
 */

/**
 * Slider Responsive Module
 *
 * This module will handle the image replacement whenever the viewport breakpoint changes.
 */
gambio.widgets.module('slider_responsive', [gambio.source + '/libs/responsive', gambio.source + '/libs/events'], function (data) {

	'use strict';

	// ########## VARIABLE INITIALIZATION ##########

	var $this = $(this),
	    defaults = {},
	    options = $.extend(true, {}, defaults, data),
	    module = {},
	    slider;

	// ########## PRIVATE FUNCTIONS ##########

	var _breakpointHandler = function _breakpointHandler(event, currentBreakpoint) {
		var $swiperContainer = $this.find('.swiper-container'),
		    $swiperWrapper = $swiperContainer.find('.swiper-wrapper'),
		    previousSwiperInstance = $swiperContainer.get(0).swiper;

		// Reset the existing swiper instance (if any).  
		if (previousSwiperInstance) {
			try {
				previousSwiperInstance.destroy(true, true);
			} catch (exception) {
				// Sometime the breakpoint handler is called many times from various events which leads
				// to errors while destroying previous Swiper instances, thus the try-catch block. 
			}
		}
		$swiperWrapper.empty();
		$this.find('.swiper-pagination').empty();

		// Update the slider HTML markup with the breakpoint-respective image.
		slider.slides.forEach(function (slide) {
			slide.images.forEach(function (image) {
				if ((image.breakpoint === currentBreakpoint.name || image.breakpoint === 'xs' && currentBreakpoint.name === 'too small') && image.languageId === parseInt(jse.core.registry.get('languageId')) && image.image !== '') {

					var $swiperSlide = $('<div class="swiper-slide"></div>');

					// Are there image areas?
					var hasAreas = image.areas && image.areas.length;

					// Randomly generated string.
					var imageMapId = Math.random().toString(36).substr(2, 5);

					if (slide.thumbnail !== '') {
						$swiperSlide.attr({
							'data-thumb-image': jse.core.config.get('appUrl') + '/images/slider_images/thumbnails/' + slide.thumbnail,
							'data-thumb-text': slide.title
						});
					}

					var $slideImage = $('<img />');

					// Use image map resizer plugin to adjust image map area sizes.
					$slideImage.rwdImageMaps();

					// Assign image map, if there are image areas.
					if (hasAreas) {
						$slideImage.attr('usemap', '#' + imageMapId);
					}

					$slideImage.attr({
						class: 'img-responsive center-block',
						src: jse.core.config.get('appUrl') + '/images/slider_images/' + image.image,
						alt: slide.altText,
						title: slide.title
					}).appendTo($swiperSlide);

					if (slide.url) {
						$slideImage.wrap('<a />').parent().attr({
							href: slide.url,
							target: slide.urlTarget
						});
					}

					// Check for image areas and iterate over them.
					if (hasAreas) {
						// Create image map element.
						var $map = $('<map name="' + imageMapId + '">');

						/**
       * Iterator function which processes every image area data.
       * @param {Object} area Image area data.
       */
						var imageAreaIterator = function imageAreaIterator(area) {
							var areaElementOptions = {
								shape: 'poly',
								coords: area.coordinates,
								href: area.linkUrl,
								title: area.linkTitle,
								target: area.linkTarget,
								'data-id': area.id
							};

							// Create image area element.
							var $area = $('<area>', areaElementOptions);

							// Put area into image map element.
							$map.append($area);
						};

						// Process every image area.
						image.areas.forEach(imageAreaIterator);

						// Append image map to slide element.
						$swiperSlide.append($map);
					}

					$swiperSlide.appendTo($swiperWrapper);
				}
			});
		});

		if ($swiperWrapper.children().length === 0) {
			return; // There is no slide set for this breakpoint. 
		}

		$swiperContainer.attr({
			'data-gambio-widget': 'swiper',
			'data-swiper-disable-translucence-fix': 'true'
		});

		$swiperContainer.data('swiper-breakpoints', [{
			breakpoint: 100,
			usePreviewBullets: true,
			slidesPerView: 1
		}]);

		$swiperContainer.data('swiper-slider-options', {
			effect: 'fade',
			speed: 600,
			nextButton: '.js-teaser-slider-next',
			prevButton: '.js-teaser-slider-prev',
			autoplay: slider.speed
		});

		// Initialize the new swiper instance and trigger the widget ready event. 
		gambio.widgets.init($swiperContainer);
		$('body').trigger(jse.libs.template.events.SLIDER_RESPONSIVE_READY());
	};

	// ########## INITIALIZATION ##########

	/**
  * Init function of the widget.
  */
	module.init = function (done) {
		if ($(options.source).length === 0) {
			return; // There is no JSON source for the slider data. 
		}

		slider = JSON.parse($(options.source).text());

		$(document).on('JSENGINE_INIT_FINISHED', function () {
			$('body').on(jse.libs.template.events.BREAKPOINT(), _breakpointHandler);
			_breakpointHandler({}, jse.libs.template.responsive.breakpoint());
		});

		done();
	};

	// Return data to widget engine
	return module;
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndpZGdldHMvc2xpZGVyX3Jlc3BvbnNpdmUuanMiXSwibmFtZXMiOlsiZ2FtYmlvIiwid2lkZ2V0cyIsIm1vZHVsZSIsInNvdXJjZSIsImRhdGEiLCIkdGhpcyIsIiQiLCJkZWZhdWx0cyIsIm9wdGlvbnMiLCJleHRlbmQiLCJzbGlkZXIiLCJfYnJlYWtwb2ludEhhbmRsZXIiLCJldmVudCIsImN1cnJlbnRCcmVha3BvaW50IiwiJHN3aXBlckNvbnRhaW5lciIsImZpbmQiLCIkc3dpcGVyV3JhcHBlciIsInByZXZpb3VzU3dpcGVySW5zdGFuY2UiLCJnZXQiLCJzd2lwZXIiLCJkZXN0cm95IiwiZXhjZXB0aW9uIiwiZW1wdHkiLCJzbGlkZXMiLCJmb3JFYWNoIiwic2xpZGUiLCJpbWFnZXMiLCJpbWFnZSIsImJyZWFrcG9pbnQiLCJuYW1lIiwibGFuZ3VhZ2VJZCIsInBhcnNlSW50IiwianNlIiwiY29yZSIsInJlZ2lzdHJ5IiwiJHN3aXBlclNsaWRlIiwiaGFzQXJlYXMiLCJhcmVhcyIsImxlbmd0aCIsImltYWdlTWFwSWQiLCJNYXRoIiwicmFuZG9tIiwidG9TdHJpbmciLCJzdWJzdHIiLCJ0aHVtYm5haWwiLCJhdHRyIiwiY29uZmlnIiwidGl0bGUiLCIkc2xpZGVJbWFnZSIsInJ3ZEltYWdlTWFwcyIsImNsYXNzIiwic3JjIiwiYWx0IiwiYWx0VGV4dCIsImFwcGVuZFRvIiwidXJsIiwid3JhcCIsInBhcmVudCIsImhyZWYiLCJ0YXJnZXQiLCJ1cmxUYXJnZXQiLCIkbWFwIiwiaW1hZ2VBcmVhSXRlcmF0b3IiLCJhcmVhRWxlbWVudE9wdGlvbnMiLCJzaGFwZSIsImNvb3JkcyIsImFyZWEiLCJjb29yZGluYXRlcyIsImxpbmtVcmwiLCJsaW5rVGl0bGUiLCJsaW5rVGFyZ2V0IiwiaWQiLCIkYXJlYSIsImFwcGVuZCIsImNoaWxkcmVuIiwidXNlUHJldmlld0J1bGxldHMiLCJzbGlkZXNQZXJWaWV3IiwiZWZmZWN0Iiwic3BlZWQiLCJuZXh0QnV0dG9uIiwicHJldkJ1dHRvbiIsImF1dG9wbGF5IiwiaW5pdCIsInRyaWdnZXIiLCJsaWJzIiwidGVtcGxhdGUiLCJldmVudHMiLCJTTElERVJfUkVTUE9OU0lWRV9SRUFEWSIsImRvbmUiLCJKU09OIiwicGFyc2UiLCJ0ZXh0IiwiZG9jdW1lbnQiLCJvbiIsIkJSRUFLUE9JTlQiLCJyZXNwb25zaXZlIl0sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7Ozs7O0FBVUE7Ozs7O0FBS0FBLE9BQU9DLE9BQVAsQ0FBZUMsTUFBZixDQUNDLG1CQURELEVBR0MsQ0FBQ0YsT0FBT0csTUFBUCxHQUFnQixrQkFBakIsRUFBcUNILE9BQU9HLE1BQVAsR0FBZ0IsY0FBckQsQ0FIRCxFQUtDLFVBQVNDLElBQVQsRUFBZTs7QUFFZDs7QUFFQTs7QUFFQSxLQUFJQyxRQUFRQyxFQUFFLElBQUYsQ0FBWjtBQUFBLEtBQ0NDLFdBQVcsRUFEWjtBQUFBLEtBRUNDLFVBQVVGLEVBQUVHLE1BQUYsQ0FBUyxJQUFULEVBQWUsRUFBZixFQUFtQkYsUUFBbkIsRUFBNkJILElBQTdCLENBRlg7QUFBQSxLQUdDRixTQUFTLEVBSFY7QUFBQSxLQUlDUSxNQUpEOztBQU1BOztBQUVBLEtBQUlDLHFCQUFxQixTQUFyQkEsa0JBQXFCLENBQVNDLEtBQVQsRUFBZ0JDLGlCQUFoQixFQUFtQztBQUMzRCxNQUFJQyxtQkFBbUJULE1BQU1VLElBQU4sQ0FBVyxtQkFBWCxDQUF2QjtBQUFBLE1BQ0NDLGlCQUFpQkYsaUJBQWlCQyxJQUFqQixDQUFzQixpQkFBdEIsQ0FEbEI7QUFBQSxNQUVDRSx5QkFBeUJILGlCQUFpQkksR0FBakIsQ0FBcUIsQ0FBckIsRUFBd0JDLE1BRmxEOztBQUlBO0FBQ0EsTUFBSUYsc0JBQUosRUFBNEI7QUFDM0IsT0FBSTtBQUNIQSwyQkFBdUJHLE9BQXZCLENBQStCLElBQS9CLEVBQXFDLElBQXJDO0FBQ0EsSUFGRCxDQUVFLE9BQU9DLFNBQVAsRUFBa0I7QUFDbkI7QUFDQTtBQUNBO0FBQ0Q7QUFDREwsaUJBQWVNLEtBQWY7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Q0FBU0MsUUFBVCxDQUFrQkMsTUFBbEIsQ0FBeUJRLFVBQXpCLEVBQWIsRUFBb0RuRixrQkFBcEQ7QUFDQUEsc0JBQW1CLEVBQW5CLEVBQXVCcUIsSUFBSW9ELElBQUosQ0FBU0MsUUFBVCxDQUFrQlUsVUFBbEIsQ0FBNkJuRSxVQUE3QixFQUF2QjtBQUNBLEdBSEQ7O0FBS0E0RDtBQUNBLEVBYkQ7O0FBZUE7QUFDQSxRQUFPdEYsTUFBUDtBQUNBLENBeExGIiwiZmlsZSI6IndpZGdldHMvc2xpZGVyX3Jlc3BvbnNpdmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gc2xpZGVyX3Jlc3BvbnNpdmUuanMgMjAxNi0xMS0xNFxyXG4gR2FtYmlvIEdtYkhcclxuIGh0dHA6Ly93d3cuZ2FtYmlvLmRlXHJcbiBDb3B5cmlnaHQgKGMpIDIwMTYgR2FtYmlvIEdtYkhcclxuIFJlbGVhc2VkIHVuZGVyIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSAoVmVyc2lvbiAyKVxyXG4gW2h0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy9ncGwtMi4wLmh0bWxdXHJcbiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBTbGlkZXIgUmVzcG9uc2l2ZSBNb2R1bGVcclxuICpcclxuICogVGhpcyBtb2R1bGUgd2lsbCBoYW5kbGUgdGhlIGltYWdlIHJlcGxhY2VtZW50IHdoZW5ldmVyIHRoZSB2aWV3cG9ydCBicmVha3BvaW50IGNoYW5nZXMuXHJcbiAqL1xyXG5nYW1iaW8ud2lkZ2V0cy5tb2R1bGUoXHJcblx0J3NsaWRlcl9yZXNwb25zaXZlJyxcclxuXHRcclxuXHRbZ2FtYmlvLnNvdXJjZSArICcvbGlicy9yZXNwb25zaXZlJywgZ2FtYmlvLnNvdXJjZSArICcvbGlicy9ldmVudHMnXSxcclxuXHRcclxuXHRmdW5jdGlvbihkYXRhKSB7XHJcblx0XHRcclxuXHRcdCd1c2Ugc3RyaWN0JztcclxuXHRcdFxyXG5cdFx0Ly8gIyMjIyMjIyMjIyBWQVJJQUJMRSBJTklUSUFMSVpBVElPTiAjIyMjIyMjIyMjXHJcblx0XHRcclxuXHRcdHZhciAkdGhpcyA9ICQodGhpcyksXHJcblx0XHRcdGRlZmF1bHRzID0ge30sXHJcblx0XHRcdG9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMsIGRhdGEpLFxyXG5cdFx0XHRtb2R1bGUgPSB7fSxcclxuXHRcdFx0c2xpZGVyO1xyXG5cdFx0XHJcblx0XHQvLyAjIyMjIyMjIyMjIFBSSVZBVEUgRlVOQ1RJT05TICMjIyMjIyMjIyNcclxuXHRcdFxyXG5cdFx0dmFyIF9icmVha3BvaW50SGFuZGxlciA9IGZ1bmN0aW9uKGV2ZW50LCBjdXJyZW50QnJlYWtwb2ludCkge1xyXG5cdFx0XHR2YXIgJHN3aXBlckNvbnRhaW5lciA9ICR0aGlzLmZpbmQoJy5zd2lwZXItY29udGFpbmVyJyksXHJcblx0XHRcdFx0JHN3aXBlcldyYXBwZXIgPSAkc3dpcGVyQ29udGFpbmVyLmZpbmQoJy5zd2lwZXItd3JhcHBlcicpLFxyXG5cdFx0XHRcdHByZXZpb3VzU3dpcGVySW5zdGFuY2UgPSAkc3dpcGVyQ29udGFpbmVyLmdldCgwKS5zd2lwZXI7XHJcblx0XHRcdFxyXG5cdFx0XHQvLyBSZXNldCB0aGUgZXhpc3Rpbmcgc3dpcGVyIGluc3RhbmNlIChpZiBhbnkpLiAgXHJcblx0XHRcdGlmIChwcmV2aW91c1N3aXBlckluc3RhbmNlKSB7XHJcblx0XHRcdFx0dHJ5IHtcclxuXHRcdFx0XHRcdHByZXZpb3VzU3dpcGVySW5zdGFuY2UuZGVzdHJveSh0cnVlLCB0cnVlKTtcclxuXHRcdFx0XHR9IGNhdGNoIChleGNlcHRpb24pIHtcclxuXHRcdFx0XHRcdC8vIFNvbWV0aW1lIHRoZSBicmVha3BvaW50IGhhbmRsZXIgaXMgY2FsbGVkIG1hbnkgdGltZXMgZnJvbSB2YXJpb3VzIGV2ZW50cyB3aGljaCBsZWFkc1xyXG5cdFx0XHRcdFx0Ly8gdG8gZXJyb3JzIHdoaWxlIGRlc3Ryb3lpbmcgcHJldmlvdXMgU3dpcGVyIGluc3RhbmNlcywgdGh1cyB0aGUgdHJ5LWNhdGNoIGJsb2NrLiBcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0JHN3aXBlcldyYXBwZXIuZW1wdHkoKTtcclxuXHRcdFx0JHRoaXMuZmluZCgnLnN3aXBlci1wYWdpbmF0aW9uJykuZW1wdHkoKTtcclxuXHRcdFx0XHJcblx0XHRcdC8vIFVwZGF0ZSB0aGUgc2xpZGVyIEhUTUwgbWFya3VwIHdpdGggdGhlIGJyZWFrcG9pbnQtcmVzcGVjdGl2ZSBpbWFnZS5cclxuXHRcdFx0c2xpZGVyLnNsaWRlcy5mb3JFYWNoKGZ1bmN0aW9uKHNsaWRlKSB7XHJcblx0XHRcdFx0c2xpZGUuaW1hZ2VzLmZvckVhY2goZnVuY3Rpb24oaW1hZ2UpIHtcclxuXHRcdFx0XHRcdGlmICgoaW1hZ2UuYnJlYWtwb2ludCA9PT0gY3VycmVudEJyZWFrcG9pbnQubmFtZSB8fCAoaW1hZ2UuYnJlYWtwb2ludCA9PT0gJ3hzJ1xyXG5cdFx0XHRcdFx0XHQmJiBjdXJyZW50QnJlYWtwb2ludC5uYW1lID09PSAndG9vIHNtYWxsJykpXHJcblx0XHRcdFx0XHRcdCYmIGltYWdlLmxhbmd1YWdlSWQgPT09IHBhcnNlSW50KGpzZS5jb3JlLnJlZ2lzdHJ5LmdldCgnbGFuZ3VhZ2VJZCcpKVxyXG5cdFx0XHRcdFx0XHQmJiBpbWFnZS5pbWFnZSAhPT0gJycpIHtcclxuXHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcdHZhciAkc3dpcGVyU2xpZGUgPSAkKCc8ZGl2IGNsYXNzPVwic3dpcGVyLXNsaWRlXCI+PC9kaXY+Jyk7XHJcblx0XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0XHQvLyBBcmUgdGhlcmUgaW1hZ2UgYXJlYXM/XHJcblx0XHRcdFx0XHRcdGNvbnN0IGhhc0FyZWFzID0gKGltYWdlLmFyZWFzICYmIGltYWdlLmFyZWFzLmxlbmd0aCk7XHJcblx0XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0XHQvLyBSYW5kb21seSBnZW5lcmF0ZWQgc3RyaW5nLlxyXG5cdFx0XHRcdFx0XHRjb25zdCBpbWFnZU1hcElkID0gTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyKDIsIDUpO1xyXG5cdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdFx0aWYgKHNsaWRlLnRodW1ibmFpbCAhPT0gJycpIHtcclxuXHRcdFx0XHRcdFx0XHQkc3dpcGVyU2xpZGUuYXR0cih7XHJcblx0XHRcdFx0XHRcdFx0XHQnZGF0YS10aHVtYi1pbWFnZSc6IGpzZS5jb3JlLmNvbmZpZy5nZXQoJ2FwcFVybCcpXHJcblx0XHRcdFx0XHRcdFx0XHQrICcvaW1hZ2VzL3NsaWRlcl9pbWFnZXMvdGh1bWJuYWlscy8nXHJcblx0XHRcdFx0XHRcdFx0XHQrIHNsaWRlLnRodW1ibmFpbCxcclxuXHRcdFx0XHRcdFx0XHRcdCdkYXRhLXRodW1iLXRleHQnOiBzbGlkZS50aXRsZVxyXG5cdFx0XHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0XHR2YXIgJHNsaWRlSW1hZ2UgPSAkKCc8aW1nIC8+Jyk7XHJcblx0XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0XHQvLyBVc2UgaW1hZ2UgbWFwIHJlc2l6ZXIgcGx1Z2luIHRvIGFkanVzdCBpbWFnZSBtYXAgYXJlYSBzaXplcy5cclxuXHRcdFx0XHRcdFx0JHNsaWRlSW1hZ2UucndkSW1hZ2VNYXBzKCk7XHJcblx0XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0XHQvLyBBc3NpZ24gaW1hZ2UgbWFwLCBpZiB0aGVyZSBhcmUgaW1hZ2UgYXJlYXMuXHJcblx0XHRcdFx0XHRcdGlmIChoYXNBcmVhcykge1xyXG5cdFx0XHRcdFx0XHRcdCRzbGlkZUltYWdlLmF0dHIoJ3VzZW1hcCcsIGAjJHtpbWFnZU1hcElkfWApXHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcdCRzbGlkZUltYWdlXHJcblx0XHRcdFx0XHRcdFx0LmF0dHIoe1xyXG5cdFx0XHRcdFx0XHRcdFx0Y2xhc3M6ICdpbWctcmVzcG9uc2l2ZSBjZW50ZXItYmxvY2snLFxyXG5cdFx0XHRcdFx0XHRcdFx0c3JjOiBqc2UuY29yZS5jb25maWcuZ2V0KCdhcHBVcmwnKSArICcvaW1hZ2VzL3NsaWRlcl9pbWFnZXMvJyArIGltYWdlLmltYWdlLFxyXG5cdFx0XHRcdFx0XHRcdFx0YWx0OiBzbGlkZS5hbHRUZXh0LFxyXG5cdFx0XHRcdFx0XHRcdFx0dGl0bGU6IHNsaWRlLnRpdGxlXHJcblx0XHRcdFx0XHRcdFx0fSlcclxuXHRcdFx0XHRcdFx0XHQuYXBwZW5kVG8oJHN3aXBlclNsaWRlKTtcclxuXHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcdGlmIChzbGlkZS51cmwpIHtcclxuXHRcdFx0XHRcdFx0XHQkc2xpZGVJbWFnZVxyXG5cdFx0XHRcdFx0XHRcdFx0LndyYXAoJzxhIC8+JylcclxuXHRcdFx0XHRcdFx0XHRcdC5wYXJlbnQoKVxyXG5cdFx0XHRcdFx0XHRcdFx0LmF0dHIoe1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRocmVmOiBzbGlkZS51cmwsXHJcblx0XHRcdFx0XHRcdFx0XHRcdHRhcmdldDogc2xpZGUudXJsVGFyZ2V0XHJcblx0XHRcdFx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdFx0Ly8gQ2hlY2sgZm9yIGltYWdlIGFyZWFzIGFuZCBpdGVyYXRlIG92ZXIgdGhlbS5cclxuXHRcdFx0XHRcdFx0aWYgKGhhc0FyZWFzKSB7XHJcblx0XHRcdFx0XHRcdFx0Ly8gQ3JlYXRlIGltYWdlIG1hcCBlbGVtZW50LlxyXG5cdFx0XHRcdFx0XHRcdGNvbnN0ICRtYXAgPSAkKGA8bWFwIG5hbWU9XCIke2ltYWdlTWFwSWR9XCI+YCk7XHJcblx0XHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcdFx0LyoqXHJcblx0XHRcdFx0XHRcdFx0ICogSXRlcmF0b3IgZnVuY3Rpb24gd2hpY2ggcHJvY2Vzc2VzIGV2ZXJ5IGltYWdlIGFyZWEgZGF0YS5cclxuXHRcdFx0XHRcdFx0XHQgKiBAcGFyYW0ge09iamVjdH0gYXJlYSBJbWFnZSBhcmVhIGRhdGEuXHJcblx0XHRcdFx0XHRcdFx0ICovXHJcblx0XHRcdFx0XHRcdFx0Y29uc3QgaW1hZ2VBcmVhSXRlcmF0b3IgPSBhcmVhID0+IHtcclxuXHRcdFx0XHRcdFx0XHRcdGNvbnN0IGFyZWFFbGVtZW50T3B0aW9ucyA9IHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0c2hhcGU6ICdwb2x5JyxcclxuXHRcdFx0XHRcdFx0XHRcdFx0Y29vcmRzOiBhcmVhLmNvb3JkaW5hdGVzLFxyXG5cdFx0XHRcdFx0XHRcdFx0XHRocmVmOiBhcmVhLmxpbmtVcmwsXHJcblx0XHRcdFx0XHRcdFx0XHRcdHRpdGxlOiBhcmVhLmxpbmtUaXRsZSxcclxuXHRcdFx0XHRcdFx0XHRcdFx0dGFyZ2V0OiBhcmVhLmxpbmtUYXJnZXQsXHJcblx0XHRcdFx0XHRcdFx0XHRcdCdkYXRhLWlkJzogYXJlYS5pZFxyXG5cdFx0XHRcdFx0XHRcdFx0fTtcclxuXHRcdFx0XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0XHRcdFx0Ly8gQ3JlYXRlIGltYWdlIGFyZWEgZWxlbWVudC5cclxuXHRcdFx0XHRcdFx0XHRcdGNvbnN0ICRhcmVhID0gJCgnPGFyZWE+JywgYXJlYUVsZW1lbnRPcHRpb25zKTtcclxuXHRcdFx0XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0XHRcdFx0Ly8gUHV0IGFyZWEgaW50byBpbWFnZSBtYXAgZWxlbWVudC5cclxuXHRcdFx0XHRcdFx0XHRcdCRtYXAuYXBwZW5kKCRhcmVhKTtcclxuXHRcdFx0XHRcdFx0XHR9O1xyXG5cdFx0XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0XHRcdC8vIFByb2Nlc3MgZXZlcnkgaW1hZ2UgYXJlYS5cclxuXHRcdFx0XHRcdFx0XHRpbWFnZS5hcmVhcy5mb3JFYWNoKGltYWdlQXJlYUl0ZXJhdG9yKTtcclxuXHRcdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdFx0XHQvLyBBcHBlbmQgaW1hZ2UgbWFwIHRvIHNsaWRlIGVsZW1lbnQuXHJcblx0XHRcdFx0XHRcdFx0JHN3aXBlclNsaWRlLmFwcGVuZCgkbWFwKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdFx0JHN3aXBlclNsaWRlLmFwcGVuZFRvKCRzd2lwZXJXcmFwcGVyKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fSk7XHJcblx0XHRcdFxyXG5cdFx0XHRpZiAoJHN3aXBlcldyYXBwZXIuY2hpbGRyZW4oKS5sZW5ndGggPT09IDApIHtcclxuXHRcdFx0XHRyZXR1cm47IC8vIFRoZXJlIGlzIG5vIHNsaWRlIHNldCBmb3IgdGhpcyBicmVha3BvaW50LiBcclxuXHRcdFx0fVxyXG5cdFx0XHRcclxuXHRcdFx0JHN3aXBlckNvbnRhaW5lci5hdHRyKHtcclxuXHRcdFx0XHQnZGF0YS1nYW1iaW8td2lkZ2V0JzogJ3N3aXBlcicsXHJcblx0XHRcdFx0J2RhdGEtc3dpcGVyLWRpc2FibGUtdHJhbnNsdWNlbmNlLWZpeCc6ICd0cnVlJyxcclxuXHRcdFx0fSk7XHJcblx0XHRcdFxyXG5cdFx0XHQkc3dpcGVyQ29udGFpbmVyLmRhdGEoXHJcblx0XHRcdFx0J3N3aXBlci1icmVha3BvaW50cycsIFtcclxuXHRcdFx0XHR7XHJcblx0XHRcdFx0XHRicmVha3BvaW50OiAxMDAsXHJcblx0XHRcdFx0XHR1c2VQcmV2aWV3QnVsbGV0czogdHJ1ZSxcclxuXHRcdFx0XHRcdHNsaWRlc1BlclZpZXc6IDFcclxuXHRcdFx0XHR9XHJcblx0XHRcdF1cclxuXHRcdFx0KTtcclxuXHRcdFx0XHJcblx0XHRcdCRzd2lwZXJDb250YWluZXIuZGF0YShcclxuXHRcdFx0XHQnc3dpcGVyLXNsaWRlci1vcHRpb25zJywge1xyXG5cdFx0XHRcdFx0ZWZmZWN0OiAnZmFkZScsXHJcblx0XHRcdFx0XHRzcGVlZDogNjAwLFxyXG5cdFx0XHRcdFx0bmV4dEJ1dHRvbjogJy5qcy10ZWFzZXItc2xpZGVyLW5leHQnLFxyXG5cdFx0XHRcdFx0cHJldkJ1dHRvbjogJy5qcy10ZWFzZXItc2xpZGVyLXByZXYnLFxyXG5cdFx0XHRcdFx0YXV0b3BsYXk6IHNsaWRlci5zcGVlZFxyXG5cdFx0XHRcdH1cclxuXHRcdFx0KTtcclxuXHRcdFx0XHJcblx0XHRcdC8vIEluaXRpYWxpemUgdGhlIG5ldyBzd2lwZXIgaW5zdGFuY2UgYW5kIHRyaWdnZXIgdGhlIHdpZGdldCByZWFkeSBldmVudC4gXHJcblx0XHRcdGdhbWJpby53aWRnZXRzLmluaXQoJHN3aXBlckNvbnRhaW5lcik7XHJcblx0XHRcdCQoJ2JvZHknKS50cmlnZ2VyKGpzZS5saWJzLnRlbXBsYXRlLmV2ZW50cy5TTElERVJfUkVTUE9OU0lWRV9SRUFEWSgpKTtcclxuXHRcdH07XHJcblx0XHRcclxuXHRcdC8vICMjIyMjIyMjIyMgSU5JVElBTElaQVRJT04gIyMjIyMjIyMjI1xyXG5cdFx0XHJcblx0XHQvKipcclxuXHRcdCAqIEluaXQgZnVuY3Rpb24gb2YgdGhlIHdpZGdldC5cclxuXHRcdCAqL1xyXG5cdFx0bW9kdWxlLmluaXQgPSBmdW5jdGlvbihkb25lKSB7XHJcblx0XHRcdGlmICgkKG9wdGlvbnMuc291cmNlKS5sZW5ndGggPT09IDApIHtcclxuXHRcdFx0XHRyZXR1cm47IC8vIFRoZXJlIGlzIG5vIEpTT04gc291cmNlIGZvciB0aGUgc2xpZGVyIGRhdGEuIFxyXG5cdFx0XHR9XHJcblx0XHRcdFxyXG5cdFx0XHRzbGlkZXIgPSBKU09OLnBhcnNlKCQob3B0aW9ucy5zb3VyY2UpLnRleHQoKSk7XHJcblx0XHRcdFxyXG5cdFx0XHQkKGRvY3VtZW50KS5vbignSlNFTkdJTkVfSU5JVF9GSU5JU0hFRCcsIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdCQoJ2JvZHknKS5vbihqc2UubGlicy50ZW1wbGF0ZS5ldmVudHMuQlJFQUtQT0lOVCgpLCBfYnJlYWtwb2ludEhhbmRsZXIpO1xyXG5cdFx0XHRcdF9icmVha3BvaW50SGFuZGxlcih7fSwganNlLmxpYnMudGVtcGxhdGUucmVzcG9uc2l2ZS5icmVha3BvaW50KCkpO1xyXG5cdFx0XHR9KTtcclxuXHRcdFx0XHJcblx0XHRcdGRvbmUoKTtcclxuXHRcdH07XHJcblx0XHRcclxuXHRcdC8vIFJldHVybiBkYXRhIHRvIHdpZGdldCBlbmdpbmVcclxuXHRcdHJldHVybiBtb2R1bGU7XHJcblx0fSk7Il19

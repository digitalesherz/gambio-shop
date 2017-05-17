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
gambio.widgets.module(
	'slider_responsive',
	
	[gambio.source + '/libs/responsive', gambio.source + '/libs/events'],
	
	function(data) {
		
		'use strict';
		
		// ########## VARIABLE INITIALIZATION ##########
		
		var $this = $(this),
			defaults = {},
			options = $.extend(true, {}, defaults, data),
			module = {},
			slider;
		
		// ########## PRIVATE FUNCTIONS ##########
		
		var _breakpointHandler = function(event, currentBreakpoint) {
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
			slider.slides.forEach(function(slide) {
				slide.images.forEach(function(image) {
					if ((image.breakpoint === currentBreakpoint.name || (image.breakpoint === 'xs'
						&& currentBreakpoint.name === 'too small'))
						&& image.languageId === parseInt(jse.core.registry.get('languageId'))
						&& image.image !== '') {
						
						var $swiperSlide = $('<div class="swiper-slide"></div>');
						
						// Are there image areas?
						const hasAreas = (image.areas && image.areas.length);
						
						// Randomly generated string.
						const imageMapId = Math.random().toString(36).substr(2, 5);
						
						if (slide.thumbnail !== '') {
							$swiperSlide.attr({
								'data-thumb-image': jse.core.config.get('appUrl')
								+ '/images/slider_images/thumbnails/'
								+ slide.thumbnail,
								'data-thumb-text': slide.title
							});
						}
						
						var $slideImage = $('<img />');
						
						// Use image map resizer plugin to adjust image map area sizes.
						$slideImage.rwdImageMaps();
						
						// Assign image map, if there are image areas.
						if (hasAreas) {
							$slideImage.attr('usemap', `#${imageMapId}`)
						}
						
						$slideImage
							.attr({
								class: 'img-responsive center-block',
								src: jse.core.config.get('appUrl') + '/images/slider_images/' + image.image,
								alt: slide.altText,
								title: slide.title
							})
							.appendTo($swiperSlide);
						
						if (slide.url) {
							$slideImage
								.wrap('<a />')
								.parent()
								.attr({
									href: slide.url,
									target: slide.urlTarget
								});
						}
						
						// Check for image areas and iterate over them.
						if (hasAreas) {
							// Create image map element.
							const $map = $(`<map name="${imageMapId}">`);
							
							/**
							 * Iterator function which processes every image area data.
							 * @param {Object} area Image area data.
							 */
							const imageAreaIterator = area => {
								const areaElementOptions = {
									shape: 'poly',
									coords: area.coordinates,
									href: area.linkUrl,
									title: area.linkTitle,
									target: area.linkTarget,
									'data-id': area.id
								};
								
								// Create image area element.
								const $area = $('<area>', areaElementOptions);
								
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
				'data-swiper-disable-translucence-fix': 'true',
			});
			
			$swiperContainer.data(
				'swiper-breakpoints', [
				{
					breakpoint: 100,
					usePreviewBullets: true,
					slidesPerView: 1
				}
			]
			);
			
			$swiperContainer.data(
				'swiper-slider-options', {
					effect: 'fade',
					speed: 600,
					nextButton: '.js-teaser-slider-next',
					prevButton: '.js-teaser-slider-prev',
					autoplay: slider.speed
				}
			);
			
			// Initialize the new swiper instance and trigger the widget ready event. 
			gambio.widgets.init($swiperContainer);
			$('body').trigger(jse.libs.template.events.SLIDER_RESPONSIVE_READY());
		};
		
		// ########## INITIALIZATION ##########
		
		/**
		 * Init function of the widget.
		 */
		module.init = function(done) {
			if ($(options.source).length === 0) {
				return; // There is no JSON source for the slider data. 
			}
			
			slider = JSON.parse($(options.source).text());
			
			$(document).on('JSENGINE_INIT_FINISHED', function() {
				$('body').on(jse.libs.template.events.BREAKPOINT(), _breakpointHandler);
				_breakpointHandler({}, jse.libs.template.responsive.breakpoint());
			});
			
			done();
		};
		
		// Return data to widget engine
		return module;
	});
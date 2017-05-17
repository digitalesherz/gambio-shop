'use strict';

/* --------------------------------------------------------------
 product_hover.js 2016-06-03
 Gambio GmbH
 http://www.gambio.de
 Copyright (c) 2016 Gambio GmbH
 Released under the GNU General Public License (Version 2)
 [http://www.gnu.org/licenses/gpl-2.0.html]
 --------------------------------------------------------------
 */

/**
 * Widget that is used for the hover functionality
 * of the product tiles. It includes the functionality
 * for the image gallery inside the tile
 */
gambio.widgets.module('product_hover', [gambio.source + '/libs/events'], function (data) {

	'use strict';

	// ########## VARIABLE INITIALIZATION ##########

	var $this = $(this),
	    $window = $(window),
	    $body = $('body'),
	    $container = null,
	    timer = null,
	    componentId = null,
	    clickTimer = 0,
	    defaults = {
		delay: 50, // Delay in ms after which a hovered element gets closed after mouseleave
		flyoverClass: 'flyover', // Class that gets added to every flyover
		scope: '', // Sets the scope selector for the mouseover events
		container: '#wrapper', // Container selector which is the boundary for the cloned element
		productUrlSelector: '.product-url' // a tag selector of product's url
	},
	    options = $.extend(true, {}, defaults, data),
	    module = {};

	// ########## HELPER FUNCTIONS ##########

	/**
  * Helper function to remove the opened flyovers that
  * were appended to the body by this component
  * @private
  */
	var _removeFlyover = function _removeFlyover(all) {
		var $flyover = $body.children('.' + options.flyoverClass);
		$flyover = all ? $flyover : $flyover.filter('.product-hover-' + componentId);

		$flyover.remove();
	};

	/**
  * Helper function that replaces the preloader
  * images with the real thumbnail images on
  * layer creation. This is needed to save
  * bandwidth
  * @param       {object}    $clone      jQuery selection of the layer
  * @private
  */
	var _loadImages = function _loadImages($clone) {
		$clone.find('.thumbnails img').each(function () {

			var $self = $(this),
			    $img = $('<img />'),
			    dataset = $self.data(),
			    src = dataset.thumbSrc || dataset.src,
			    $parentListItem = null;

			$img.on('load', function () {
				$parentListItem = $self.closest('li');
				$parentListItem.addClass('loaded').css({
					'background': '#FFFFFF url("' + src + '") no-repeat center',
					'background-size': 'contain'
				}).find('img, .align-helper').remove();
			}).attr('src', src);
		});
	};

	// ########## EVENT HANDLER ##########

	/**
  * Handler for the click event on the thumbnail
  * images. After a click on such an image the
  * main image of the hover element gets replaced
  * with the bigger version of the thumbnail image
  * @param       {object}        e       jQuery event object
  * @private
  */
	var _mouseEnterThumbHandler = function _mouseEnterThumbHandler(e) {
		e.preventDefault();

		var $img = $(this),
		    $container = $img.closest('.' + options.flyoverClass),
		    dataSrc = $img.css('background-image');

		// Change path to big images and remove quotes
		dataSrc = dataSrc.replace('/thumbnail_images/', '/info_images/').replace(/["']/gm, '');

		// Remove "url()"
		var matches = dataSrc.match(/url\((.+)\)/);
		if (matches && matches[1]) {
			dataSrc = matches[1];
		}

		if (dataSrc) {
			$container.find('.product-hover-main-image > img').attr('src', dataSrc);
		}
	};

	/**
  * Event handler for the mouse leave event of the
  * hovered element. It sets a timer to remove the
  * hover element after a certain time
  * @param       {object}    e       jQuery event object
  * @private
  */
	var _mouseLeaveHandler = function _mouseLeaveHandler(e) {
		e.stopPropagation();
		timer = timer ? clearTimeout(timer) : null;
		timer = window.setTimeout(_removeFlyover, options.delay);
	};

	/**
  * Event handler for the mouse enter event on both
  * elements (initial & hovered element).
  * It clones the initial element and adds the clone
  * to the body. It additionally adds functionality
  * for the image gallery inside the hovered element
  * @param       {object}        e       jQuery event object
  * @private
  */
	var _mouseEnterHandler = function _mouseEnterHandler(e) {
		e.stopPropagation();

		var $self = $(this),
		    $clone = null,
		    $target = $body,
		    uid = $self.data().uid || parseInt(Math.random() * 10000, 10),
		    $flyover = $target.children('.' + options.flyoverClass + '.product-hover-' + componentId + '[data-product_hover-uid="' + uid + '"]'),
		    offset = $self.offset();

		timer = timer ? clearTimeout(timer) : null;

		// Check if flyover needs to be created
		if (!$self.hasClass(options.flyoverClass) && !$flyover.length) {
			// Remove old opened flyovers
			_removeFlyover(true);
			$this.trigger(jse.libs.template.events.OPEN_FLYOUT(), $this);

			// Add a UID for identification to th hovered object
			$self.attr('data-product_hover-uid', uid).data('uid', uid);

			// Generate the markup
			$clone = $self.clone(true);

			// Replace the preloader images with the thumbnail images
			_loadImages($clone);

			// Set the positioning of the layer
			$clone.addClass(options.flyoverClass + ' product-hover-' + componentId).css({
				'position': 'absolute',
				'left': offset.left,
				'top': offset.top,
				'width': $self[0].getBoundingClientRect().width,
				'height': $self[0].getBoundingClientRect().height
			});

			// Add event listener to the hover elements
			$clone.on('mouseenter', _mouseEnterHandler).on('mouseleave', _mouseLeaveHandler).on('mouseenter', '.thumbnails', _mouseEnterThumbHandler).on('click', _clickHandler);

			// Add the element to the body element
			$body.append($clone);

			if ($container.offset().left > $clone.offset().left) {
				$clone.addClass('gallery-right');
			}
		}
	};

	/**
  * Handler for the window resize event. It
  * recalculates the position of the overlays
  * @private
  */
	var _resizeHandler = function _resizeHandler() {

		var $flyover = $body.children('.' + options.flyoverClass + '.product-hover-' + componentId);

		$flyover.each(function () {
			var $self = $(this),
			    uid = $self.data().uid,
			    $source = $this.find('[data-product_hover-uid="' + uid + '"]'),
			    offset = $source.offset();

			$self.css({
				left: offset.left,
				top: offset.top,
				width: 2 * $source.outerWidth()
			});
		});
	};

	/**
  * Event handler that closes the flyovers
  * if another flyover opens on the page
  * @param       {object}        e           jQuery event object
  * @param       {object}        d           jQuery selection of the event emitter
  * @private
  */
	var _closeLayers = function _closeLayers(e, d) {
		if ($this !== d) {
			_removeFlyover();
		}
	};

	/**
  * Event handler that makes the flyover and product image clickable linking to the product details page
  * 
  * @param       {object}        e           jQuery event object
  * @private
  */
	var _clickHandler = function _clickHandler(e) {
		var $container = $(this);

		if ($(this).hasClass('product-container') === false) {
			$container = $(this).closest('.product-container');
		}

		var $link = $container.find(options.productUrlSelector).first();

		if ($link.length) {
			var url = $link.attr('href');

			if (url !== undefined) {
				e.stopPropagation();
				e.preventDefault();

				// prevent double _clickHandler actions
				if (new Date().getTime() - clickTimer < 100) {
					return;
				} else {
					clickTimer = new Date().getTime();
				}

				switch (e.which) {
					// left click
					case 1:
						if (e.ctrlKey) {
							window.open(url, '_blank');
							return;
						}
						break;

					// middle click
					case 2:
						window.open(url, '_blank');
						return;
						break;

					// right click
					case 3:
						return;
				}

				location.href = url;
			}
		}
	};

	// ########## INITIALIZATION ##########

	/**
  * Init function of the widget
  * @constructor
  */
	module.init = function (done) {

		componentId = parseInt(Math.random() * 10000, 10);
		$container = $(options.container);

		$this.on('touchstart', function () {
			// Workaround for tablet navigation problem
			$this.off('mouseenter mouseleave');
		}).on('touchend', function () {
			$this.off('mouseenter', options.scope + ' .product-container', _mouseEnterHandler).off('mouseleave', options.scope + ' .product-container', _mouseLeaveHandler);
		}).on('mouseenter', options.scope + ' .product-container', _mouseEnterHandler).on('mouseleave', options.scope + ' .product-container', _mouseLeaveHandler);

		$this.find('.product-container .product-image').on('click mouseup', _clickHandler);

		$body.on(jse.libs.template.events.OPEN_FLYOUT(), _closeLayers);

		$window.on('resize', _resizeHandler);

		done();
	};

	// Return data to widget engine
	return module;
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndpZGdldHMvcHJvZHVjdF9ob3Zlci5qcyJdLCJuYW1lcyI6WyJnYW1iaW8iLCJ3aWRnZXRzIiwibW9kdWxlIiwic291cmNlIiwiZGF0YSIsIiR0aGlzIiwiJCIsIiR3aW5kb3ciLCJ3aW5kb3ciLCIkYm9keSIsIiRjb250YWluZXIiLCJ0aW1lciIsImNvbXBvbmVudElkIiwiY2xpY2tUaW1lciIsImRlZmF1bHRzIiwiZGVsYXkiLCJmbHlvdmVyQ2xhc3MiLCJzY29wZSIsImNvbnRhaW5lciIsInByb2R1Y3RVcmxTZWxlY3RvciIsIm9wdGlvbnMiLCJleHRlbmQiLCJfcmVtb3ZlRmx5b3ZlciIsImFsbCIsIiRmbHlvdmVyIiwiY2hpbGRyZW4iLCJmaWx0ZXIiLCJyZW1vdmUiLCJfbG9hZEltYWdlcyIsIiRjbG9uZSIsImZpbmQiLCJlYWNoIiwiJHNlbGYiLCIkaW1nIiwiZGF0YXNldCIsInNyYyIsInRodW1iU3JjIiwiJHBhcmVudExpc3RJdGVtIiwib24iLCJjbG9zZXN0IiwiYWRkQ2xhc3MiLCJjc3MiLCJhdHRyIiwiX21vdXNlRW50ZXJUaHVtYkhhbmRsZXIiLCJlIiwicHJldmVudERlZmF1bHQiLCJkYXRhU3JjIiwicmVwbGFjZSIsIm1hdGNoZXMiLCJtYXRjaCIsIl9tb3VzZUxlYXZlSGFuZGxlciIsInN0b3BQcm9wYWdhdGlvbiIsImNsZWFyVGltZW91dCIsInNldFRpbWVvdXQiLCJfbW91c2VFbnRlckhhbmRsZXIiLCIkdGFyZ2V0IiwidWlkIiwicGFyc2VJbnQiLCJNYXRoIiwicmFuZG9tIiwib2Zmc2V0IiwiaGFzQ2xhc3MiLCJsZW5ndGgiLCJ0cmlnZ2VyIiwianNlIiwibGlicyIsInRlbXBsYXRlIiwiZXZlbnRzIiwiT1BFTl9GTFlPVVQiLCJjbG9uZSIsImxlZnQiLCJ0b3AiLCJnZXRCb3VuZGluZ0NsaWVudFJlY3QiLCJ3aWR0aCIsImhlaWdodCIsIl9jbGlja0hhbmRsZXIiLCJhcHBlbmQiLCJfcmVzaXplSGFuZGxlciIsIiRzb3VyY2UiLCJvdXRlcldpZHRoIiwiX2Nsb3NlTGF5ZXJzIiwiZCIsIiRsaW5rIiwiZmlyc3QiLCJ1cmwiLCJ1bmRlZmluZWQiLCJEYXRlIiwiZ2V0VGltZSIsIndoaWNoIiwiY3RybEtleSIsIm9wZW4iLCJsb2NhdGlvbiIsImhyZWYiLCJpbml0IiwiZG9uZSIsIm9mZiJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7Ozs7OztBQVVBOzs7OztBQUtBQSxPQUFPQyxPQUFQLENBQWVDLE1BQWYsQ0FDQyxlQURELEVBR0MsQ0FDQ0YsT0FBT0csTUFBUCxHQUFnQixjQURqQixDQUhELEVBT0MsVUFBU0MsSUFBVCxFQUFlOztBQUVkOztBQUVGOztBQUVFLEtBQUlDLFFBQVFDLEVBQUUsSUFBRixDQUFaO0FBQUEsS0FDQ0MsVUFBVUQsRUFBRUUsTUFBRixDQURYO0FBQUEsS0FFQ0MsUUFBUUgsRUFBRSxNQUFGLENBRlQ7QUFBQSxLQUdDSSxhQUFhLElBSGQ7QUFBQSxLQUlDQyxRQUFRLElBSlQ7QUFBQSxLQUtDQyxjQUFjLElBTGY7QUFBQSxLQU1DQyxhQUFhLENBTmQ7QUFBQSxLQU9DQyxXQUFXO0FBQ1ZDLFNBQU8sRUFERyxFQUNPO0FBQ2pCQyxnQkFBYyxTQUZKLEVBRWdCO0FBQzFCQyxTQUFPLEVBSEcsRUFHVTtBQUNwQkMsYUFBVyxVQUpELEVBSWE7QUFDdkJDLHNCQUFvQixjQUxWLENBS3lCO0FBTHpCLEVBUFo7QUFBQSxLQWNDQyxVQUFVZCxFQUFFZSxNQUFGLENBQVMsSUFBVCxFQUFlLEVBQWYsRUFBbUJQLFFBQW5CLEVBQTZCVixJQUE3QixDQWRYO0FBQUEsS0FlQ0YsU0FBUyxFQWZWOztBQWlCRjs7QUFFRTs7Ozs7QUFLQSxLQUFJb0IsaUJBQWlCLFNBQWpCQSxjQUFpQixDQUFTQyxHQUFULEVBQWM7QUFDbEMsTUFBSUMsV0FBV2YsTUFBTWdCLFFBQU4sQ0FBZSxNQUFNTCxRQUFRSixZQUE3QixDQUFmO0FBQ0FRLGFBQVdELE1BQU1DLFFBQU4sR0FBaUJBLFNBQVNFLE1BQVQsQ0FBZ0Isb0JBQW9CZCxXQUFw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LFFBQVFILEtBQVIsR0FBZ0IscUJBRHBDLEVBQzJEcUMsa0JBRDNELEVBRUV5QyxHQUZGLENBRU0sWUFGTixFQUVvQjNFLFFBQVFILEtBQVIsR0FBZ0IscUJBRnBDLEVBRTJEaUMsa0JBRjNEO0FBR0EsR0FURixFQVVFWixFQVZGLENBVUssWUFWTCxFQVVtQmxCLFFBQVFILEtBQVIsR0FBZ0IscUJBVm5DLEVBVTBEcUMsa0JBVjFELEVBV0VoQixFQVhGLENBV0ssWUFYTCxFQVdtQmxCLFFBQVFILEtBQVIsR0FBZ0IscUJBWG5DLEVBVzBEaUMsa0JBWDFEOztBQWFBN0MsUUFBTXlCLElBQU4sQ0FBVyxtQ0FBWCxFQUFnRFEsRUFBaEQsQ0FBbUQsZUFBbkQsRUFBb0VxQyxhQUFwRTs7QUFFQWxFLFFBQ0U2QixFQURGLENBQ0swQixJQUFJQyxJQUFKLENBQVNDLFFBQVQsQ0FBa0JDLE1BQWxCLENBQXlCQyxXQUF6QixFQURMLEVBQzZDWSxZQUQ3Qzs7QUFHQXpFLFVBQ0UrQixFQURGLENBQ0ssUUFETCxFQUNldUMsY0FEZjs7QUFHQWlCO0FBQ0EsRUEzQkQ7O0FBNkJBO0FBQ0EsUUFBTzVGLE1BQVA7QUFDQSxDQW5VRiIsImZpbGUiOiJ3aWRnZXRzL3Byb2R1Y3RfaG92ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIHByb2R1Y3RfaG92ZXIuanMgMjAxNi0wNi0wM1xuIEdhbWJpbyBHbWJIXG4gaHR0cDovL3d3dy5nYW1iaW8uZGVcbiBDb3B5cmlnaHQgKGMpIDIwMTYgR2FtYmlvIEdtYkhcbiBSZWxlYXNlZCB1bmRlciB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgKFZlcnNpb24gMilcbiBbaHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzL2dwbC0yLjAuaHRtbF1cbiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICovXG5cbi8qKlxuICogV2lkZ2V0IHRoYXQgaXMgdXNlZCBmb3IgdGhlIGhvdmVyIGZ1bmN0aW9uYWxpdHlcbiAqIG9mIHRoZSBwcm9kdWN0IHRpbGVzLiBJdCBpbmNsdWRlcyB0aGUgZnVuY3Rpb25hbGl0eVxuICogZm9yIHRoZSBpbWFnZSBnYWxsZXJ5IGluc2lkZSB0aGUgdGlsZVxuICovXG5nYW1iaW8ud2lkZ2V0cy5tb2R1bGUoXG5cdCdwcm9kdWN0X2hvdmVyJyxcblxuXHRbXG5cdFx0Z2FtYmlvLnNvdXJjZSArICcvbGlicy9ldmVudHMnXG5cdF0sXG5cblx0ZnVuY3Rpb24oZGF0YSkge1xuXG5cdFx0J3VzZSBzdHJpY3QnO1xuXG4vLyAjIyMjIyMjIyMjIFZBUklBQkxFIElOSVRJQUxJWkFUSU9OICMjIyMjIyMjIyNcblxuXHRcdHZhciAkdGhpcyA9ICQodGhpcyksXG5cdFx0XHQkd2luZG93ID0gJCh3aW5kb3cpLFxuXHRcdFx0JGJvZHkgPSAkKCdib2R5JyksXG5cdFx0XHQkY29udGFpbmVyID0gbnVsbCxcblx0XHRcdHRpbWVyID0gbnVsbCxcblx0XHRcdGNvbXBvbmVudElkID0gbnVsbCxcblx0XHRcdGNsaWNrVGltZXIgPSAwLFxuXHRcdFx0ZGVmYXVsdHMgPSB7XG5cdFx0XHRcdGRlbGF5OiA1MCwgICAgICAgLy8gRGVsYXkgaW4gbXMgYWZ0ZXIgd2hpY2ggYSBob3ZlcmVkIGVsZW1lbnQgZ2V0cyBjbG9zZWQgYWZ0ZXIgbW91c2VsZWF2ZVxuXHRcdFx0XHRmbHlvdmVyQ2xhc3M6ICdmbHlvdmVyJywgIC8vIENsYXNzIHRoYXQgZ2V0cyBhZGRlZCB0byBldmVyeSBmbHlvdmVyXG5cdFx0XHRcdHNjb3BlOiAnJywgICAgICAgICAgLy8gU2V0cyB0aGUgc2NvcGUgc2VsZWN0b3IgZm9yIHRoZSBtb3VzZW92ZXIgZXZlbnRzXG5cdFx0XHRcdGNvbnRhaW5lcjogJyN3cmFwcGVyJywgLy8gQ29udGFpbmVyIHNlbGVjdG9yIHdoaWNoIGlzIHRoZSBib3VuZGFyeSBmb3IgdGhlIGNsb25lZCBlbGVtZW50XG5cdFx0XHRcdHByb2R1Y3RVcmxTZWxlY3RvcjogJy5wcm9kdWN0LXVybCcgLy8gYSB0YWcgc2VsZWN0b3Igb2YgcHJvZHVjdCdzIHVybFxuXHRcdFx0fSxcblx0XHRcdG9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMsIGRhdGEpLFxuXHRcdFx0bW9kdWxlID0ge307XG5cbi8vICMjIyMjIyMjIyMgSEVMUEVSIEZVTkNUSU9OUyAjIyMjIyMjIyMjXG5cblx0XHQvKipcblx0XHQgKiBIZWxwZXIgZnVuY3Rpb24gdG8gcmVtb3ZlIHRoZSBvcGVuZWQgZmx5b3ZlcnMgdGhhdFxuXHRcdCAqIHdlcmUgYXBwZW5kZWQgdG8gdGhlIGJvZHkgYnkgdGhpcyBjb21wb25lbnRcblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqL1xuXHRcdHZhciBfcmVtb3ZlRmx5b3ZlciA9IGZ1bmN0aW9uKGFsbCkge1xuXHRcdFx0dmFyICRmbHlvdmVyID0gJGJvZHkuY2hpbGRyZW4oJy4nICsgb3B0aW9ucy5mbHlvdmVyQ2xhc3MpO1xuXHRcdFx0JGZseW92ZXIgPSBhbGwgPyAkZmx5b3ZlciA6ICRmbHlvdmVyLmZpbHRlcignLnByb2R1Y3QtaG92ZXItJyArIGNvbXBvbmVudElkKTtcblxuXHRcdFx0JGZseW92ZXIucmVtb3ZlKCk7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIEhlbHBlciBmdW5jdGlvbiB0aGF0IHJlcGxhY2VzIHRoZSBwcmVsb2FkZXJcblx0XHQgKiBpbWFnZXMgd2l0aCB0aGUgcmVhbCB0aHVtYm5haWwgaW1hZ2VzIG9uXG5cdFx0ICogbGF5ZXIgY3JlYXRpb24uIFRoaXMgaXMgbmVlZGVkIHRvIHNhdmVcblx0XHQgKiBiYW5kd2lkdGhcblx0XHQgKiBAcGFyYW0gICAgICAge29iamVjdH0gICAgJGNsb25lICAgICAgalF1ZXJ5IHNlbGVjdGlvbiBvZiB0aGUgbGF5ZXJcblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqL1xuXHRcdHZhciBfbG9hZEltYWdlcyA9IGZ1bmN0aW9uKCRjbG9uZSkge1xuXHRcdFx0JGNsb25lXG5cdFx0XHRcdC5maW5kKCcudGh1bWJuYWlscyBpbWcnKVxuXHRcdFx0XHQuZWFjaChmdW5jdGlvbigpIHtcblxuXHRcdFx0XHRcdHZhciAkc2VsZiA9ICQodGhpcyksXG5cdFx0XHRcdFx0XHQkaW1nID0gJCgnPGltZyAvPicpLFxuXHRcdFx0XHRcdFx0ZGF0YXNldCA9ICRzZWxmLmRhdGEoKSxcblx0XHRcdFx0XHRcdHNyYyA9IGRhdGFzZXQudGh1bWJTcmMgfHwgZGF0YXNldC5zcmMsXG5cdFx0XHRcdFx0XHQkcGFyZW50TGlzdEl0ZW0gPSBudWxsO1xuXG5cdFx0XHRcdFx0JGltZy5vbignbG9hZCcsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0JHBhcmVudExpc3RJdGVtID0gJHNlbGYuY2xvc2VzdCgnbGknKTtcblx0XHRcdFx0XHRcdCRwYXJlbnRMaXN0SXRlbVxuXHRcdFx0XHRcdFx0XHQuYWRkQ2xhc3MoJ2xvYWRlZCcpXG5cdFx0XHRcdFx0XHRcdC5jc3Moe1xuXHRcdFx0XHRcdFx0XHRcdCAgICAgJ2JhY2tncm91bmQnOiAnI0ZGRkZGRiB1cmwoXCInICsgc3JjICsgJ1wiKSBuby1yZXBlYXQgY2VudGVyJyxcblx0XHRcdFx0XHRcdFx0XHQgICAgICdiYWNrZ3JvdW5kLXNpemUnOiAnY29udGFpbidcblx0XHRcdFx0XHRcdFx0ICAgICB9KVxuXHRcdFx0XHRcdFx0XHQuZmluZCgnaW1nLCAuYWxpZ24taGVscGVyJylcblx0XHRcdFx0XHRcdFx0LnJlbW92ZSgpO1xuXHRcdFx0XHRcdH0pLmF0dHIoJ3NyYycsIHNyYyk7XG5cblx0XHRcdFx0fSk7XG5cdFx0fTtcblxuXG4vLyAjIyMjIyMjIyMjIEVWRU5UIEhBTkRMRVIgIyMjIyMjIyMjI1xuXG5cdFx0LyoqXG5cdFx0ICogSGFuZGxlciBmb3IgdGhlIGNsaWNrIGV2ZW50IG9uIHRoZSB0aHVtYm5haWxcblx0XHQgKiBpbWFnZXMuIEFmdGVyIGEgY2xpY2sgb24gc3VjaCBhbiBpbWFnZSB0aGVcblx0XHQgKiBtYWluIGltYWdlIG9mIHRoZSBob3ZlciBlbGVtZW50IGdldHMgcmVwbGFjZWRcblx0XHQgKiB3aXRoIHRoZSBiaWdnZXIgdmVyc2lvbiBvZiB0aGUgdGh1bWJuYWlsIGltYWdlXG5cdFx0ICogQHBhcmFtICAgICAgIHtvYmplY3R9ICAgICAgICBlICAgICAgIGpRdWVyeSBldmVudCBvYmplY3Rcblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqL1xuXHRcdHZhciBfbW91c2VFbnRlclRodW1iSGFuZGxlciA9IGZ1bmN0aW9uKGUpIHtcblx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblxuXHRcdFx0dmFyICRpbWcgPSAkKHRoaXMpLFxuXHRcdFx0XHQkY29udGFpbmVyID0gJGltZy5jbG9zZXN0KCcuJyArIG9wdGlvbnMuZmx5b3ZlckNsYXNzKSxcblx0XHRcdFx0ZGF0YVNyYyA9ICRpbWcuY3NzKCdiYWNrZ3JvdW5kLWltYWdlJyk7XG5cblx0XHRcdC8vIENoYW5nZSBwYXRoIHRvIGJpZyBpbWFnZXMgYW5kIHJlbW92ZSBxdW90ZXNcblx0XHRcdGRhdGFTcmMgPSBkYXRhU3JjXG5cdFx0XHRcdC5yZXBsYWNlKCcvdGh1bWJuYWlsX2ltYWdlcy8nLCAnL2luZm9faW1hZ2VzLycpXG5cdFx0XHRcdC5yZXBsYWNlKC9bXCInXS9nbSwgJycpO1xuXG5cdFx0XHQvLyBSZW1vdmUgXCJ1cmwoKVwiXG5cdFx0XHR2YXIgbWF0Y2hlcyA9IGRhdGFTcmMubWF0Y2goL3VybFxcKCguKylcXCkvKTtcdFxuXHRcdFx0aWYgKG1hdGNoZXMgJiYgbWF0Y2hlc1sxXSkge1xuXHRcdFx0XHRkYXRhU3JjID0gbWF0Y2hlc1sxXTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRhdGFTcmMpIHtcblx0XHRcdFx0JGNvbnRhaW5lclxuXHRcdFx0XHRcdC5maW5kKCcucHJvZHVjdC1ob3Zlci1tYWluLWltYWdlID4gaW1nJylcblx0XHRcdFx0XHQuYXR0cignc3JjJywgZGF0YVNyYyk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIEV2ZW50IGhhbmRsZXIgZm9yIHRoZSBtb3VzZSBsZWF2ZSBldmVudCBvZiB0aGVcblx0XHQgKiBob3ZlcmVkIGVsZW1lbnQuIEl0IHNldHMgYSB0aW1lciB0byByZW1vdmUgdGhlXG5cdFx0ICogaG92ZXIgZWxlbWVudCBhZnRlciBhIGNlcnRhaW4gdGltZVxuXHRcdCAqIEBwYXJhbSAgICAgICB7b2JqZWN0fSAgICBlICAgICAgIGpRdWVyeSBldmVudCBvYmplY3Rcblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqL1xuXHRcdHZhciBfbW91c2VMZWF2ZUhhbmRsZXIgPSBmdW5jdGlvbihlKSB7XG5cdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdFx0dGltZXIgPSB0aW1lciA/IGNsZWFyVGltZW91dCh0aW1lcikgOiBudWxsO1xuXHRcdFx0dGltZXIgPSB3aW5kb3cuc2V0VGltZW91dChfcmVtb3ZlRmx5b3Zlciwgb3B0aW9ucy5kZWxheSk7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIEV2ZW50IGhhbmRsZXIgZm9yIHRoZSBtb3VzZSBlbnRlciBldmVudCBvbiBib3RoXG5cdFx0ICogZWxlbWVudHMgKGluaXRpYWwgJiBob3ZlcmVkIGVsZW1lbnQpLlxuXHRcdCAqIEl0IGNsb25lcyB0aGUgaW5pdGlhbCBlbGVtZW50IGFuZCBhZGRzIHRoZSBjbG9uZVxuXHRcdCAqIHRvIHRoZSBib2R5LiBJdCBhZGRpdGlvbmFsbHkgYWRkcyBmdW5jdGlvbmFsaXR5XG5cdFx0ICogZm9yIHRoZSBpbWFnZSBnYWxsZXJ5IGluc2lkZSB0aGUgaG92ZXJlZCBlbGVtZW50XG5cdFx0ICogQHBhcmFtICAgICAgIHtvYmplY3R9ICAgICAgICBlICAgICAgIGpRdWVyeSBldmVudCBvYmplY3Rcblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqL1xuXHRcdHZhciBfbW91c2VFbnRlckhhbmRsZXIgPSBmdW5jdGlvbihlKSB7XG5cdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXG5cdFx0XHR2YXIgJHNlbGYgPSAkKHRoaXMpLFxuXHRcdFx0XHQkY2xvbmUgPSBudWxsLFxuXHRcdFx0XHQkdGFyZ2V0ID0gJGJvZHksXG5cdFx0XHRcdHVpZCA9ICRzZWxmLmRhdGEoKS51aWQgfHwgcGFyc2VJbnQoTWF0aC5yYW5kb20oKSAqIDEwMDAwLCAxMCksXG5cdFx0XHRcdCRmbHlvdmVyID0gJHRhcmdldC5jaGlsZHJlbignLicgKyBvcHRpb25zLmZseW92ZXJDbGFzcyArICcucHJvZHVjdC1ob3Zlci0nICsgY29tcG9uZW50SWRcblx0XHRcdFx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJ1tkYXRhLXByb2R1Y3RfaG92ZXItdWlkPVwiJyArIHVpZCArICdcIl0nKSxcblx0XHRcdFx0b2Zmc2V0ID0gJHNlbGYub2Zmc2V0KCk7XG5cblx0XHRcdHRpbWVyID0gdGltZXIgPyBjbGVhclRpbWVvdXQodGltZXIpIDogbnVsbDtcblxuXHRcdFx0Ly8gQ2hlY2sgaWYgZmx5b3ZlciBuZWVkcyB0byBiZSBjcmVhdGVkXG5cdFx0XHRpZiAoISRzZWxmLmhhc0NsYXNzKG9wdGlvbnMuZmx5b3ZlckNsYXNzKSAmJiAhJGZseW92ZXIubGVuZ3RoKSB7XG5cdFx0XHRcdC8vIFJlbW92ZSBvbGQgb3BlbmVkIGZseW92ZXJzXG5cdFx0XHRcdF9yZW1vdmVGbHlvdmVyKHRydWUpO1xuXHRcdFx0XHQkdGhpcy50cmlnZ2VyKGpzZS5saWJzLnRlbXBsYXRlLmV2ZW50cy5PUEVOX0ZMWU9VVCgpLCAkdGhpcyk7XG5cblx0XHRcdFx0Ly8gQWRkIGEgVUlEIGZvciBpZGVudGlmaWNhdGlvbiB0byB0aCBob3ZlcmVkIG9iamVjdFxuXHRcdFx0XHQkc2VsZlxuXHRcdFx0XHRcdC5hdHRyKCdkYXRhLXByb2R1Y3RfaG92ZXItdWlkJywgdWlkKVxuXHRcdFx0XHRcdC5kYXRhKCd1aWQnLCB1aWQpO1xuXG5cdFx0XHRcdC8vIEdlbmVyYXRlIHRoZSBtYXJrdXBcblx0XHRcdFx0JGNsb25lID0gJHNlbGYuY2xvbmUodHJ1ZSk7XG5cblx0XHRcdFx0Ly8gUmVwbGFjZSB0aGUgcHJlbG9hZGVyIGltYWdlcyB3aXRoIHRoZSB0aHVtYm5haWwgaW1hZ2VzXG5cdFx0XHRcdF9sb2FkSW1hZ2VzKCRjbG9uZSk7XG5cblx0XHRcdFx0Ly8gU2V0IHRoZSBwb3NpdGlvbmluZyBvZiB0aGUgbGF5ZXJcblx0XHRcdFx0JGNsb25lXG5cdFx0XHRcdFx0LmFkZENsYXNzKG9wdGlvbnMuZmx5b3ZlckNsYXNzICsgJyBwcm9kdWN0LWhvdmVyLScgKyBjb21wb25lbnRJZClcblx0XHRcdFx0XHQuY3NzKHtcblx0XHRcdFx0XHRcdCAgICAgJ3Bvc2l0aW9uJzogJ2Fic29sdXRlJyxcblx0XHRcdFx0XHRcdCAgICAgJ2xlZnQnOiBvZmZzZXQubGVmdCxcblx0XHRcdFx0XHRcdCAgICAgJ3RvcCc6IG9mZnNldC50b3AsXG5cdFx0XHRcdFx0XHQgICAgICd3aWR0aCc6ICRzZWxmWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLndpZHRoLFxuXHRcdFx0XHRcdFx0ICAgICAnaGVpZ2h0JzogJHNlbGZbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkuaGVpZ2h0XG5cdFx0XHRcdFx0ICAgICB9KTtcblxuXHRcdFx0XHQvLyBBZGQgZXZlbnQgbGlzdGVuZXIgdG8gdGhlIGhvdmVyIGVsZW1lbnRzXG5cdFx0XHRcdCRjbG9uZVxuXHRcdFx0XHRcdC5vbignbW91c2VlbnRlcicsIF9tb3VzZUVudGVySGFuZGxlcilcblx0XHRcdFx0XHQub24oJ21vdXNlbGVhdmUnLCBfbW91c2VMZWF2ZUhhbmRsZXIpXG5cdFx0XHRcdFx0Lm9uKCdtb3VzZWVudGVyJywgJy50aHVtYm5haWxzJywgX21vdXNlRW50ZXJUaHVtYkhhbmRsZXIpXG5cdFx0XHRcdFx0Lm9uKCdjbGljaycsIF9jbGlja0hhbmRsZXIpO1xuXG5cdFx0XHRcdC8vIEFkZCB0aGUgZWxlbWVudCB0byB0aGUgYm9keSBlbGVtZW50XG5cdFx0XHRcdCRib2R5LmFwcGVuZCgkY2xvbmUpO1xuXG5cdFx0XHRcdGlmICgkY29udGFpbmVyLm9mZnNldCgpLmxlZnQgPiAkY2xvbmUub2Zmc2V0KCkubGVmdCkge1xuXHRcdFx0XHRcdCRjbG9uZS5hZGRDbGFzcygnZ2FsbGVyeS1yaWdodCcpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIEhhbmRsZXIgZm9yIHRoZSB3aW5kb3cgcmVzaXplIGV2ZW50LiBJdFxuXHRcdCAqIHJlY2FsY3VsYXRlcyB0aGUgcG9zaXRpb24gb2YgdGhlIG92ZXJsYXlzXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKi9cblx0XHR2YXIgX3Jlc2l6ZUhhbmRsZXIgPSBmdW5jdGlvbigpIHtcblxuXHRcdFx0dmFyICRmbHlvdmVyID0gJGJvZHkuY2hpbGRyZW4oJy4nICsgb3B0aW9ucy5mbHlvdmVyQ2xhc3MgKyAnLnByb2R1Y3QtaG92ZXItJyArIGNvbXBvbmVudElkKTtcblxuXHRcdFx0JGZseW92ZXIuZWFjaChmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyICRzZWxmID0gJCh0aGlzKSxcblx0XHRcdFx0XHR1aWQgPSAkc2VsZi5kYXRhKCkudWlkLFxuXHRcdFx0XHRcdCRzb3VyY2UgPSAkdGhpcy5maW5kKCdbZGF0YS1wcm9kdWN0X2hvdmVyLXVpZD1cIicgKyB1aWQgKyAnXCJdJyksXG5cdFx0XHRcdFx0b2Zmc2V0ID0gJHNvdXJjZS5vZmZzZXQoKTtcblxuXHRcdFx0XHQkc2VsZi5jc3Moe1xuXHRcdFx0XHRcdCAgICAgICAgICBsZWZ0OiBvZmZzZXQubGVmdCxcblx0XHRcdFx0XHQgICAgICAgICAgdG9wOiBvZmZzZXQudG9wLFxuXHRcdFx0XHRcdCAgICAgICAgICB3aWR0aDogMiAqICRzb3VyY2Uub3V0ZXJXaWR0aCgpXG5cdFx0XHRcdCAgICAgICAgICB9KTtcblx0XHRcdH0pO1xuXG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIEV2ZW50IGhhbmRsZXIgdGhhdCBjbG9zZXMgdGhlIGZseW92ZXJzXG5cdFx0ICogaWYgYW5vdGhlciBmbHlvdmVyIG9wZW5zIG9uIHRoZSBwYWdlXG5cdFx0ICogQHBhcmFtICAgICAgIHtvYmplY3R9ICAgICAgICBlICAgICAgICAgICBqUXVlcnkgZXZlbnQgb2JqZWN0XG5cdFx0ICogQHBhcmFtICAgICAgIHtvYmplY3R9ICAgICAgICBkICAgICAgICAgICBqUXVlcnkgc2VsZWN0aW9uIG9mIHRoZSBldmVudCBlbWl0dGVyXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKi9cblx0XHR2YXIgX2Nsb3NlTGF5ZXJzID0gZnVuY3Rpb24oZSwgZCkge1xuXHRcdFx0aWYgKCR0aGlzICE9PSBkKSB7XG5cdFx0XHRcdF9yZW1vdmVGbHlvdmVyKCk7XG5cdFx0XHR9XG5cdFx0fTtcblx0XHRcblx0XHRcblx0XHQvKipcblx0XHQgKiBFdmVudCBoYW5kbGVyIHRoYXQgbWFrZXMgdGhlIGZseW92ZXIgYW5kIHByb2R1Y3QgaW1hZ2UgY2xpY2thYmxlIGxpbmtpbmcgdG8gdGhlIHByb2R1Y3QgZGV0YWlscyBwYWdlXG5cdFx0ICogXG5cdFx0ICogQHBhcmFtICAgICAgIHtvYmplY3R9ICAgICAgICBlICAgICAgICAgICBqUXVlcnkgZXZlbnQgb2JqZWN0XG5cdFx0ICogQHByaXZhdGVcblx0XHQgKi9cblx0XHR2YXIgX2NsaWNrSGFuZGxlciA9IGZ1bmN0aW9uKGUpIHtcblx0XHRcdHZhciAkY29udGFpbmVyID0gJCh0aGlzKTtcblx0XHRcdFxuXHRcdFx0aWYgKCQodGhpcykuaGFzQ2xhc3MoJ3Byb2R1Y3QtY29udGFpbmVyJykgPT09IGZhbHNlKSB7XG5cdFx0XHRcdCRjb250YWluZXIgPSAkKHRoaXMpLmNsb3Nlc3QoJy5wcm9kdWN0LWNvbnRhaW5lcicpO1xuXHRcdFx0fSBcblx0XHRcdFxuXHRcdFx0dmFyICRsaW5rID0gJGNvbnRhaW5lci5maW5kKG9wdGlvbnMucHJvZHVjdFVybFNlbGVjdG9yKS5maXJzdCgpO1xuXHRcdFx0XG5cdFx0XHRpZiAoJGxpbmsubGVuZ3RoKSB7XG5cdFx0XHRcdHZhciB1cmwgPSAkbGluay5hdHRyKCdocmVmJyk7XG5cdFx0XHRcdFxuXHRcdFx0XHRpZiAodXJsICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHQvLyBwcmV2ZW50IGRvdWJsZSBfY2xpY2tIYW5kbGVyIGFjdGlvbnNcblx0XHRcdFx0XHRpZiAobmV3IERhdGUoKS5nZXRUaW1lKCkgLSBjbGlja1RpbWVyIDwgMTAwKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGNsaWNrVGltZXIgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0c3dpdGNoIChlLndoaWNoKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdC8vIGxlZnQgY2xpY2tcblx0XHRcdFx0XHRcdGNhc2UgMTpcblx0XHRcdFx0XHRcdFx0aWYgKGUuY3RybEtleSkge1xuXHRcdFx0XHRcdFx0XHRcdHdpbmRvdy5vcGVuKHVybCwgJ19ibGFuaycpO1xuXHRcdFx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0Ly8gbWlkZGxlIGNsaWNrXG5cdFx0XHRcdFx0XHRjYXNlIDI6XG5cdFx0XHRcdFx0XHRcdHdpbmRvdy5vcGVuKHVybCwgJ19ibGFuaycpO1xuXHRcdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHQvLyByaWdodCBjbGlja1xuXHRcdFx0XHRcdFx0Y2FzZSAzOlxuXHRcdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdGxvY2F0aW9uLmhyZWYgPSB1cmw7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXG4vLyAjIyMjIyMjIyMjIElOSVRJQUxJWkFUSU9OICMjIyMjIyMjIyNcblxuXHRcdC8qKlxuXHRcdCAqIEluaXQgZnVuY3Rpb24gb2YgdGhlIHdpZGdldFxuXHRcdCAqIEBjb25zdHJ1Y3RvclxuXHRcdCAqL1xuXHRcdG1vZHVsZS5pbml0ID0gZnVuY3Rpb24oZG9uZSkge1xuXG5cdFx0XHRjb21wb25lbnRJZCA9IHBhcnNlSW50KE1hdGgucmFuZG9tKCkgKiAxMDAwMCwgMTApO1xuXHRcdFx0JGNvbnRhaW5lciA9ICQob3B0aW9ucy5jb250YWluZXIpO1xuXG5cdFx0XHQkdGhpc1xuXHRcdFx0XHQub24oJ3RvdWNoc3RhcnQnLCBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHQvLyBXb3JrYXJvdW5kIGZvciB0YWJsZXQgbmF2aWdhdGlvbiBwcm9ibGVtXG5cdFx0XHRcdFx0JHRoaXMub2ZmKCdtb3VzZWVudGVyIG1vdXNlbGVhdmUnKTtcblx0XHRcdFx0fSlcblx0XHRcdFx0Lm9uKCd0b3VjaGVuZCcsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdCR0aGlzXG5cdFx0XHRcdFx0XHQub2ZmKCdtb3VzZWVudGVyJywgb3B0aW9ucy5zY29wZSArICcgLnByb2R1Y3QtY29udGFpbmVyJywgX21vdXNlRW50ZXJIYW5kbGVyKVxuXHRcdFx0XHRcdFx0Lm9mZignbW91c2VsZWF2ZScsIG9wdGlvbnMuc2NvcGUgKyAnIC5wcm9kdWN0LWNvbnRhaW5lcicsIF9tb3VzZUxlYXZlSGFuZGxlcik7XG5cdFx0XHRcdH0pXG5cdFx0XHRcdC5vbignbW91c2VlbnRlcicsIG9wdGlvbnMuc2NvcGUgKyAnIC5wcm9kdWN0LWNvbnRhaW5lcicsIF9tb3VzZUVudGVySGFuZGxlcilcblx0XHRcdFx0Lm9uKCdtb3VzZWxlYXZlJywgb3B0aW9ucy5zY29wZSArICcgLnByb2R1Y3QtY29udGFpbmVyJywgX21vdXNlTGVhdmVIYW5kbGVyKTtcblx0XHRcdFxuXHRcdFx0JHRoaXMuZmluZCgnLnByb2R1Y3QtY29udGFpbmVyIC5wcm9kdWN0LWltYWdlJykub24oJ2NsaWNrIG1vdXNldXAnLCBfY2xpY2tIYW5kbGVyKTtcblx0XHRcdFxuXHRcdFx0JGJvZHlcblx0XHRcdFx0Lm9uKGpzZS5saWJzLnRlbXBsYXRlLmV2ZW50cy5PUEVOX0ZMWU9VVCgpLCBfY2xvc2VMYXllcnMpO1xuXG5cdFx0XHQkd2luZG93XG5cdFx0XHRcdC5vbigncmVzaXplJywgX3Jlc2l6ZUhhbmRsZXIpO1xuXG5cdFx0XHRkb25lKCk7XG5cdFx0fTtcblxuXHRcdC8vIFJldHVybiBkYXRhIHRvIHdpZGdldCBlbmdpbmVcblx0XHRyZXR1cm4gbW9kdWxlO1xuXHR9KTtcbiJdfQ==

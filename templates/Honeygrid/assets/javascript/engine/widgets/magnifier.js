'use strict';

/* --------------------------------------------------------------
 magnifier.js 2016-03-09
 Gambio GmbH
 http://www.gambio.de
 Copyright (c) 2015 Gambio GmbH
 Released under the GNU General Public License (Version 2)
 [http://www.gnu.org/licenses/gpl-2.0.html]
 --------------------------------------------------------------
 */

/**
 * Widget that shows a zoom image on mouseover at a specific target
 */
gambio.widgets.module('magnifier', [gambio.source + '/libs/responsive'], function (data) {

	'use strict';

	// ########## VARIABLE INITIALIZATION ##########

	var $this = $(this),
	    $body = $('body'),
	    $target = null,
	    dataWasSet = false,
	    defaults = {
		// Default zoom image target selector
		target: null,
		// If true, the zoom image will always fill the whole target container
		keepInView: true,
		// The class that gets added to the body while the magnifier window is visible
		bodyClass: 'magnifier-active',
		// Maximum breakpoint for mobile view mode
		breakpoint: 60
	},
	    options = $.extend(true, {}, defaults, data),
	    module = {};

	// ########## HELPER FUNCTIONS ##########

	/**
  * Helper function to calculate the sizes and positions
  * (that doesn't alter until the browser gets resized).
  * The data object is stored at the source image and returned
  * to the caller function
  * @param               {object}        $self           jQuery selection of the source image
  * @param               {object}        $thisTarget     jQuery selection of the zoom image target container
  * @param               {object}        $image          jQuery selection of the zoom image itself
  * @return             {object}                        JSON object which contains the calculated sizes and positions
  * @private
  */
	var _prepareData = function _prepareData($self, $thisTarget, $image) {
		var dataset = {
			offset: $self.offset(),
			height: $self.height(),
			width: $self.width(),
			targetWidth: $thisTarget.width(),
			targetHeight: $thisTarget.height(),
			imageWidth: $image.width(),
			imageHeight: $image.height()
		};

		dataset.aspectX = -1 / (dataset.width / dataset.imageWidth);
		dataset.aspectY = -1 / (dataset.height / dataset.imageHeight);
		dataset.boundaryX = -1 * (dataset.imageWidth - dataset.targetWidth);
		dataset.boundaryY = -1 * (dataset.imageHeight - dataset.targetHeight);

		$self.data('magnifier', dataset);
		dataWasSet = true;

		return $.extend({}, dataset);
	};

	// ########## EVENT HANDLER ##########

	/**
  * Event handler for the mousemove event. If the cursor gets
  * moved over the image, the cursor position will be scaled to
  * the zoom target and the zoom image gets positioned at that point
  * @param       {object}        e       jQuery event object
  * @private
  */
	var _mouseMoveHandler = function _mouseMoveHandler(e) {
		var $self = $(this),
		    dataset = $self.data('magnifier'),
		    $image = $target.children('img');

		dataset = dataset || _prepareData($self, $target, $image);

		var marginTop = dataset.aspectY * (e.pageY - dataset.offset.top) + dataset.targetHeight / 2,
		    marginLeft = dataset.aspectX * (e.pageX - dataset.offset.left) + dataset.targetWidth / 2;

		// If this setting is true, the zoomed image will always
		// fill the whole preview container
		if (options.keepInView) {
			marginTop = Math.min(0, marginTop);
			marginTop = Math.max(dataset.boundaryY, marginTop);
			marginLeft = Math.min(0, marginLeft);
			marginLeft = Math.max(dataset.boundaryX, marginLeft);
		}

		// Set the calculated styles
		$image.css({
			'margin-top': marginTop + 'px',
			'margin-left': marginLeft + 'px'
		});
	};

	/**
  * Event handler for the mouse enter event
  * on the target. It creates the zoom image
  * and embeds it to the magnifier target
  * @private
  */
	var _mouseEnterHandler = function _mouseEnterHandler(e) {

		// Only open in desktop mode
		if (jse.libs.template.responsive.breakpoint().id > options.breakpoint) {

			var $self = $(this),
			    dataset = $self.data(),
			    $preloader = $target.find('.preloader'),
			    $image = $('<img />'),
			    alt = $self.attr('alt'),
			    title = $self.attr('title');

			// CleansUp the magnifier target
			$target.children('img').remove();

			$preloader.show();
			$body.addClass(options.bodyClass);

			// Creates the image element and binds
			// a load handler to it, so that the
			// preloader gets hidden after the image
			// is loaded by the browser
			$image.one('load', function () {
				$image.css({
					'height': this.height + 'px',
					'width': this.width + 'px'
				});
				$preloader.hide();

				// Bind the mousemove handler to zoom to
				// the correct position of the image
				$self.off('mousemove.magnifier').on('mousemove.magnifier', _mouseMoveHandler);
			}).attr({ src: dataset.magnifierSrc, alt: alt, title: title });

			// Append the image to the maginifier target
			$target.append($image).show();
		}
	};

	/**
  * Handler for the browser resize event.
  * It removes all stored data so that a
  * recalculation is forced
  * @private
  */
	var _resizeHandler = function _resizeHandler() {
		if (dataWasSet) {
			$this.find('img[data-magnifier-src]').removeData('magnifier');

			dataWasSet = false;
		}
	};

	/**
  * Event handler for the mouseleave event. In case
  * the cursor leaves the image, the zoom target gets
  * hidden
  * @private
  */
	var _mouseLeaveHandler = function _mouseLeaveHandler() {
		$target.hide();
		$body.removeClass(options.bodyClass);

		$this.off('mouseenter').on('mouseenter', 'img[data-magnifier-src]', _mouseEnterHandler);
	};

	/**
  * Removes the mouseenter handler on touchstart,
  * so that the magnifier not starts on touch.
  * The function gets reactivated in the mouseleave
  * handler
  * @private
  */
	var _touchHandler = function _touchHandler() {
		$this.off('mouseenter');
	};

	// ########## INITIALIZATION ##########

	/**
  * Init function of the widget
  * @constructor
  */
	module.init = function (done) {

		$target = $(options.target);

		$this.on('touchstart', 'img[data-magnifier-src]', _touchHandler).on('mouseenter', 'img[data-magnifier-src]', _mouseEnterHandler).on('mouseleave', 'img[data-magnifier-src]', _mouseLeaveHandler);

		$(window).on('resize', _resizeHandler);

		done();
	};

	// Return data to widget engine
	return module;
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndpZGdldHMvbWFnbmlmaWVyLmpzIl0sIm5hbWVzIjpbImdhbWJpbyIsIndpZGdldHMiLCJtb2R1bGUiLCJzb3VyY2UiLCJkYXRhIiwiJHRoaXMiLCIkIiwiJGJvZHkiLCIkdGFyZ2V0IiwiZGF0YVdhc1NldCIsImRlZmF1bHRzIiwidGFyZ2V0Iiwia2VlcEluVmlldyIsImJvZHlDbGFzcyIsImJyZWFrcG9pbnQiLCJvcHRpb25zIiwiZXh0ZW5kIiwiX3ByZXBhcmVEYXRhIiwiJHNlbGYiLCIkdGhpc1RhcmdldCIsIiRpbWFnZSIsImRhdGFzZXQiLCJvZmZzZXQiLCJoZWlnaHQiLCJ3aWR0aCIsInRhcmdldFdpZHRoIiwidGFyZ2V0SGVpZ2h0IiwiaW1hZ2VXaWR0aCIsImltYWdlSGVpZ2h0IiwiYXNwZWN0WCIsImFzcGVjdFkiLCJib3VuZGFyeVgiLCJib3VuZGFyeVkiLCJfbW91c2VNb3ZlSGFuZGxlciIsImUiLCJjaGlsZHJlbiIsIm1hcmdpblRvcCIsInBhZ2VZIiwidG9wIiwibWFyZ2luTGVmdCIsInBhZ2VYIiwibGVmdCIsIk1hdGgiLCJtaW4iLCJtYXgiLCJjc3MiLCJfbW91c2VFbnRlckhhbmRsZXIiLCJqc2UiLCJsaWJzIiwidGVtcGxhdGUiLCJyZXNwb25zaXZlIiwiaWQiLCIkcHJlbG9hZGVyIiwiZmluZCIsImFsdCIsImF0dHIiLCJ0aXRsZSIsInJlbW92ZSIsInNob3ciLCJhZGRDbGFzcyIsIm9uZSIsImhpZGUiLCJvZmYiLCJvbiIsInNyYyIsIm1hZ25pZmllclNyYyIsImFwcGVuZCIsIl9yZXNpemVIYW5kbGVyIiwicmVtb3ZlRGF0YSIsIl9tb3VzZUxlYXZlSGFuZGxlciIsInJlbW92ZUNsYXNzIiwiX3RvdWNoSGFuZGxlciIsImluaXQiLCJkb25lIiwid2luZG93Il0sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7Ozs7O0FBVUE7OztBQUdBQSxPQUFPQyxPQUFQLENBQWVDLE1BQWYsQ0FDQyxXQURELEVBR0MsQ0FDQ0YsT0FBT0csTUFB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QVpEOztBQWNBO0FBQ0EsUUFBT3ZFLE1BQVA7QUFDQSxDQTVORiIsImZpbGUiOiJ3aWRnZXRzL21hZ25pZmllci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gbWFnbmlmaWVyLmpzIDIwMTYtMDMtMDlcbiBHYW1iaW8gR21iSFxuIGh0dHA6Ly93d3cuZ2FtYmlvLmRlXG4gQ29weXJpZ2h0IChjKSAyMDE1IEdhbWJpbyBHbWJIXG4gUmVsZWFzZWQgdW5kZXIgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIChWZXJzaW9uIDIpXG4gW2h0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy9ncGwtMi4wLmh0bWxdXG4gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqL1xuXG4vKipcbiAqIFdpZGdldCB0aGF0IHNob3dzIGEgem9vbSBpbWFnZSBvbiBtb3VzZW92ZXIgYXQgYSBzcGVjaWZpYyB0YXJnZXRcbiAqL1xuZ2FtYmlvLndpZGdldHMubW9kdWxlKFxuXHQnbWFnbmlmaWVyJyxcblxuXHRbXG5cdFx0Z2FtYmlvLnNvdXJjZSArICcvbGlicy9yZXNwb25zaXZlJ1xuXHRdLFxuXG5cdGZ1bmN0aW9uKGRhdGEpIHtcblxuXHRcdCd1c2Ugc3RyaWN0JztcblxuLy8gIyMjIyMjIyMjIyBWQVJJQUJMRSBJTklUSUFMSVpBVElPTiAjIyMjIyMjIyMjXG5cblx0XHR2YXIgJHRoaXMgPSAkKHRoaXMpLFxuXHRcdFx0JGJvZHkgPSAkKCdib2R5JyksXG5cdFx0XHQkdGFyZ2V0ID0gbnVsbCxcblx0XHRcdGRhdGFXYXNTZXQgPSBmYWxzZSxcblx0XHRcdGRlZmF1bHRzID0ge1xuXHRcdFx0XHQvLyBEZWZhdWx0IHpvb20gaW1hZ2UgdGFyZ2V0IHNlbGVjdG9yXG5cdFx0XHRcdHRhcmdldDogbnVsbCxcblx0XHRcdFx0Ly8gSWYgdHJ1ZSwgdGhlIHpvb20gaW1hZ2Ugd2lsbCBhbHdheXMgZmlsbCB0aGUgd2hvbGUgdGFyZ2V0IGNvbnRhaW5lclxuXHRcdFx0XHRrZWVwSW5WaWV3OiB0cnVlLFxuXHRcdFx0XHQvLyBUaGUgY2xhc3MgdGhhdCBnZXRzIGFkZGVkIHRvIHRoZSBib2R5IHdoaWxlIHRoZSBtYWduaWZpZXIgd2luZG93IGlzIHZpc2libGVcblx0XHRcdFx0Ym9keUNsYXNzOiAnbWFnbmlmaWVyLWFjdGl2ZScsXG5cdFx0XHRcdC8vIE1heGltdW0gYnJlYWtwb2ludCBmb3IgbW9iaWxlIHZpZXcgbW9kZVxuXHRcdFx0XHRicmVha3BvaW50OiA2MFxuXHRcdFx0fSxcblx0XHRcdG9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMsIGRhdGEpLFxuXHRcdFx0bW9kdWxlID0ge307XG5cblxuLy8gIyMjIyMjIyMjIyBIRUxQRVIgRlVOQ1RJT05TICMjIyMjIyMjIyNcblxuXHRcdC8qKlxuXHRcdCAqIEhlbHBlciBmdW5jdGlvbiB0byBjYWxjdWxhdGUgdGhlIHNpemVzIGFuZCBwb3NpdGlvbnNcblx0XHQgKiAodGhhdCBkb2Vzbid0IGFsdGVyIHVudGlsIHRoZSBicm93c2VyIGdldHMgcmVzaXplZCkuXG5cdFx0ICogVGhlIGRhdGEgb2JqZWN0IGlzIHN0b3JlZCBhdCB0aGUgc291cmNlIGltYWdlIGFuZCByZXR1cm5lZFxuXHRcdCAqIHRvIHRoZSBjYWxsZXIgZnVuY3Rpb25cblx0XHQgKiBAcGFyYW0gICAgICAgICAgICAgICB7b2JqZWN0fSAgICAgICAgJHNlbGYgICAgICAgICAgIGpRdWVyeSBzZWxlY3Rpb24gb2YgdGhlIHNvdXJjZSBpbWFnZVxuXHRcdCAqIEBwYXJhbSAgICAgICAgICAgICAgIHtvYmplY3R9ICAgICAgICAkdGhpc1RhcmdldCAgICAgalF1ZXJ5IHNlbGVjdGlvbiBvZiB0aGUgem9vbSBpbWFnZSB0YXJnZXQgY29udGFpbmVyXG5cdFx0ICogQHBhcmFtICAgICAgICAgICAgICAge29iamVjdH0gICAgICAgICRpbWFnZSAgICAgICAgICBqUXVlcnkgc2VsZWN0aW9uIG9mIHRoZSB6b29tIGltYWdlIGl0c2VsZlxuXHRcdCAqIEByZXR1cm4gICAgICAgICAgICAge29iamVjdH0gICAgICAgICAgICAgICAgICAgICAgICBKU09OIG9iamVjdCB3aGljaCBjb250YWlucyB0aGUgY2FsY3VsYXRlZCBzaXplcyBhbmQgcG9zaXRpb25zXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKi9cblx0XHR2YXIgX3ByZXBhcmVEYXRhID0gZnVuY3Rpb24oJHNlbGYsICR0aGlzVGFyZ2V0LCAkaW1hZ2UpIHtcblx0XHRcdHZhciBkYXRhc2V0ID0ge1xuXHRcdFx0XHRvZmZzZXQ6ICRzZWxmLm9mZnNldCgpLFxuXHRcdFx0XHRoZWlnaHQ6ICRzZWxmLmhlaWdodCgpLFxuXHRcdFx0XHR3aWR0aDogJHNlbGYud2lkdGgoKSxcblx0XHRcdFx0dGFyZ2V0V2lkdGg6ICR0aGlzVGFyZ2V0LndpZHRoKCksXG5cdFx0XHRcdHRhcmdldEhlaWdodDogJHRoaXNUYXJnZXQuaGVpZ2h0KCksXG5cdFx0XHRcdGltYWdlV2lkdGg6ICRpbWFnZS53aWR0aCgpLFxuXHRcdFx0XHRpbWFnZUhlaWdodDogJGltYWdlLmhlaWdodCgpXG5cdFx0XHR9O1xuXG5cdFx0XHRkYXRhc2V0LmFzcGVjdFggPSAtMSAvIChkYXRhc2V0LndpZHRoIC8gZGF0YXNldC5pbWFnZVdpZHRoKTtcblx0XHRcdGRhdGFzZXQuYXNwZWN0WSA9IC0xIC8gKGRhdGFzZXQuaGVpZ2h0IC8gZGF0YXNldC5pbWFnZUhlaWdodCk7XG5cdFx0XHRkYXRhc2V0LmJvdW5kYXJ5WCA9IC0xICogKGRhdGFzZXQuaW1hZ2VXaWR0aCAtIGRhdGFzZXQudGFyZ2V0V2lkdGgpO1xuXHRcdFx0ZGF0YXNldC5ib3VuZGFyeVkgPSAtMSAqIChkYXRhc2V0LmltYWdlSGVpZ2h0IC0gZGF0YXNldC50YXJnZXRIZWlnaHQpO1xuXG5cdFx0XHQkc2VsZi5kYXRhKCdtYWduaWZpZXInLCBkYXRhc2V0KTtcblx0XHRcdGRhdGFXYXNTZXQgPSB0cnVlO1xuXG5cdFx0XHRyZXR1cm4gJC5leHRlbmQoe30sIGRhdGFzZXQpO1xuXHRcdH07XG5cblxuLy8gIyMjIyMjIyMjIyBFVkVOVCBIQU5ETEVSICMjIyMjIyMjIyNcblxuXHRcdC8qKlxuXHRcdCAqIEV2ZW50IGhhbmRsZXIgZm9yIHRoZSBtb3VzZW1vdmUgZXZlbnQuIElmIHRoZSBjdXJzb3IgZ2V0c1xuXHRcdCAqIG1vdmVkIG92ZXIgdGhlIGltYWdlLCB0aGUgY3Vyc29yIHBvc2l0aW9uIHdpbGwgYmUgc2NhbGVkIHRvXG5cdFx0ICogdGhlIHpvb20gdGFyZ2V0IGFuZCB0aGUgem9vbSBpbWFnZSBnZXRzIHBvc2l0aW9uZWQgYXQgdGhhdCBwb2ludFxuXHRcdCAqIEBwYXJhbSAgICAgICB7b2JqZWN0fSAgICAgICAgZSAgICAgICBqUXVlcnkgZXZlbnQgb2JqZWN0XG5cdFx0ICogQHByaXZhdGVcblx0XHQgKi9cblx0XHR2YXIgX21vdXNlTW92ZUhhbmRsZXIgPSBmdW5jdGlvbihlKSB7XG5cdFx0XHR2YXIgJHNlbGYgPSAkKHRoaXMpLFxuXHRcdFx0XHRkYXRhc2V0ID0gJHNlbGYuZGF0YSgnbWFnbmlmaWVyJyksXG5cdFx0XHRcdCRpbWFnZSA9ICR0YXJnZXQuY2hpbGRyZW4oJ2ltZycpO1xuXG5cdFx0XHRkYXRhc2V0ID0gZGF0YXNldCB8fCBfcHJlcGFyZURhdGEoJHNlbGYsICR0YXJnZXQsICRpbWFnZSk7XG5cblx0XHRcdHZhciBtYXJnaW5Ub3AgPSBkYXRhc2V0LmFzcGVjdFkgKiAoZS5wYWdlWSAtIGRhdGFzZXQub2Zmc2V0LnRvcCkgKyBkYXRhc2V0LnRhcmdldEhlaWdodCAvIDIsXG5cdFx0XHRcdG1hcmdpbkxlZnQgPSBkYXRhc2V0LmFzcGVjdFggKiAoZS5wYWdlWCAtIGRhdGFzZXQub2Zmc2V0LmxlZnQpICsgZGF0YXNldC50YXJnZXRXaWR0aCAvIDI7XG5cblx0XHRcdC8vIElmIHRoaXMgc2V0dGluZyBpcyB0cnVlLCB0aGUgem9vbWVkIGltYWdlIHdpbGwgYWx3YXlzXG5cdFx0XHQvLyBmaWxsIHRoZSB3aG9sZSBwcmV2aWV3IGNvbnRhaW5lclxuXHRcdFx0aWYgKG9wdGlvbnMua2VlcEluVmlldykge1xuXHRcdFx0XHRtYXJnaW5Ub3AgPSBNYXRoLm1pbigwLCBtYXJnaW5Ub3ApO1xuXHRcdFx0XHRtYXJnaW5Ub3AgPSBNYXRoLm1heChkYXRhc2V0LmJvdW5kYXJ5WSwgbWFyZ2luVG9wKTtcblx0XHRcdFx0bWFyZ2luTGVmdCA9IE1hdGgubWluKDAsIG1hcmdpbkxlZnQpO1xuXHRcdFx0XHRtYXJnaW5MZWZ0ID0gTWF0aC5tYXgoZGF0YXNldC5ib3VuZGFyeVgsIG1hcmdpbkxlZnQpO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBTZXQgdGhlIGNhbGN1bGF0ZWQgc3R5bGVzXG5cdFx0XHQkaW1hZ2UuY3NzKHtcblx0XHRcdFx0ICAgICAgICAgICAnbWFyZ2luLXRvcCc6IG1hcmdpblRvcCArICdweCcsXG5cdFx0XHRcdCAgICAgICAgICAgJ21hcmdpbi1sZWZ0JzogbWFyZ2luTGVmdCArICdweCdcblx0XHRcdCAgICAgICAgICAgfSk7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIEV2ZW50IGhhbmRsZXIgZm9yIHRoZSBtb3VzZSBlbnRlciBldmVudFxuXHRcdCAqIG9uIHRoZSB0YXJnZXQuIEl0IGNyZWF0ZXMgdGhlIHpvb20gaW1hZ2Vcblx0XHQgKiBhbmQgZW1iZWRzIGl0IHRvIHRoZSBtYWduaWZpZXIgdGFyZ2V0XG5cdFx0ICogQHByaXZhdGVcblx0XHQgKi9cblx0XHR2YXIgX21vdXNlRW50ZXJIYW5kbGVyID0gZnVuY3Rpb24oZSkge1xuXG5cdFx0XHQvLyBPbmx5IG9wZW4gaW4gZGVza3RvcCBtb2RlXG5cdFx0XHRpZiAoanNlLmxpYnMudGVtcGxhdGUucmVzcG9uc2l2ZS5icmVha3BvaW50KCkuaWQgPiBvcHRpb25zLmJyZWFrcG9pbnQpIHtcblxuXHRcdFx0XHR2YXIgJHNlbGYgPSAkKHRoaXMpLFxuXHRcdFx0XHRcdGRhdGFzZXQgPSAkc2VsZi5kYXRhKCksXG5cdFx0XHRcdFx0JHByZWxvYWRlciA9ICR0YXJnZXQuZmluZCgnLnByZWxvYWRlcicpLFxuXHRcdFx0XHRcdCRpbWFnZSA9ICQoJzxpbWcgLz4nKSxcblx0XHRcdFx0XHRhbHQgPSAkc2VsZi5hdHRyKCdhbHQnKSxcblx0XHRcdFx0XHR0aXRsZSA9ICRzZWxmLmF0dHIoJ3RpdGxlJyk7XG5cblx0XHRcdFx0Ly8gQ2xlYW5zVXAgdGhlIG1hZ25pZmllciB0YXJnZXRcblx0XHRcdFx0JHRhcmdldFxuXHRcdFx0XHRcdC5jaGlsZHJlbignaW1nJylcblx0XHRcdFx0XHQucmVtb3ZlKCk7XG5cblx0XHRcdFx0JHByZWxvYWRlci5zaG93KCk7XG5cdFx0XHRcdCRib2R5LmFkZENsYXNzKG9wdGlvbnMuYm9keUNsYXNzKTtcblxuXHRcdFx0XHQvLyBDcmVhdGVzIHRoZSBpbWFnZSBlbGVtZW50IGFuZCBiaW5kc1xuXHRcdFx0XHQvLyBhIGxvYWQgaGFuZGxlciB0byBpdCwgc28gdGhhdCB0aGVcblx0XHRcdFx0Ly8gcHJlbG9hZGVyIGdldHMgaGlkZGVuIGFmdGVyIHRoZSBpbWFnZVxuXHRcdFx0XHQvLyBpcyBsb2FkZWQgYnkgdGhlIGJyb3dzZXJcblx0XHRcdFx0JGltYWdlLm9uZSgnbG9hZCcsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdCAgICAgICRpbWFnZS5jc3Moe1xuXHRcdFx0XHRcdFx0ICAgICAgICAgICAgICAgICAnaGVpZ2h0JzogdGhpcy5oZWlnaHQgKyAncHgnLFxuXHRcdFx0XHRcdFx0ICAgICAgICAgICAgICAgICAnd2lkdGgnOiB0aGlzLndpZHRoICsgJ3B4J1xuXHRcdFx0XHRcdCAgICAgICAgICAgICAgICAgfSk7XG5cdFx0XHRcdFx0ICAgICAgJHByZWxvYWRlci5oaWRlKCk7XG5cblx0XHRcdFx0XHQgICAgICAvLyBCaW5kIHRoZSBtb3VzZW1vdmUgaGFuZGxlciB0byB6b29tIHRvXG5cdFx0XHRcdFx0ICAgICAgLy8gdGhlIGNvcnJlY3QgcG9zaXRpb24gb2YgdGhlIGltYWdlXG5cdFx0XHRcdFx0ICAgICAgJHNlbGZcblx0XHRcdFx0XHRcdCAgICAgIC5vZmYoJ21vdXNlbW92ZS5tYWduaWZpZXInKVxuXHRcdFx0XHRcdFx0ICAgICAgLm9uKCdtb3VzZW1vdmUubWFnbmlmaWVyJywgX21vdXNlTW92ZUhhbmRsZXIpO1xuXHRcdFx0XHQgICAgICB9KVxuXHRcdFx0XHQgICAgICAuYXR0cih7c3JjOiBkYXRhc2V0Lm1hZ25pZmllclNyYywgYWx0OiBhbHQsIHRpdGxlOiB0aXRsZX0pO1xuXG5cdFx0XHRcdC8vIEFwcGVuZCB0aGUgaW1hZ2UgdG8gdGhlIG1hZ2luaWZpZXIgdGFyZ2V0XG5cdFx0XHRcdCR0YXJnZXRcblx0XHRcdFx0XHQuYXBwZW5kKCRpbWFnZSlcblx0XHRcdFx0XHQuc2hvdygpO1xuXG5cdFx0XHR9XG5cblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogSGFuZGxlciBmb3IgdGhlIGJyb3dzZXIgcmVzaXplIGV2ZW50LlxuXHRcdCAqIEl0IHJlbW92ZXMgYWxsIHN0b3JlZCBkYXRhIHNvIHRoYXQgYVxuXHRcdCAqIHJlY2FsY3VsYXRpb24gaXMgZm9yY2VkXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKi9cblx0XHR2YXIgX3Jlc2l6ZUhhbmRsZXIgPSBmdW5jdGlvbigpIHtcblx0XHRcdGlmIChkYXRhV2FzU2V0KSB7XG5cdFx0XHRcdCR0aGlzXG5cdFx0XHRcdFx0LmZpbmQoJ2ltZ1tkYXRhLW1hZ25pZmllci1zcmNdJylcblx0XHRcdFx0XHQucmVtb3ZlRGF0YSgnbWFnbmlmaWVyJyk7XG5cblx0XHRcdFx0ZGF0YVdhc1NldCA9IGZhbHNlO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBFdmVudCBoYW5kbGVyIGZvciB0aGUgbW91c2VsZWF2ZSBldmVudC4gSW4gY2FzZVxuXHRcdCAqIHRoZSBjdXJzb3IgbGVhdmVzIHRoZSBpbWFnZSwgdGhlIHpvb20gdGFyZ2V0IGdldHNcblx0XHQgKiBoaWRkZW5cblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqL1xuXHRcdHZhciBfbW91c2VMZWF2ZUhhbmRsZXIgPSBmdW5jdGlvbigpIHtcblx0XHRcdCR0YXJnZXQuaGlkZSgpO1xuXHRcdFx0JGJvZHkucmVtb3ZlQ2xhc3Mob3B0aW9ucy5ib2R5Q2xhc3MpO1xuXG5cdFx0XHQkdGhpc1xuXHRcdFx0XHQub2ZmKCdtb3VzZWVudGVyJylcblx0XHRcdFx0Lm9uKCdtb3VzZWVudGVyJywgJ2ltZ1tkYXRhLW1hZ25pZmllci1zcmNdJywgX21vdXNlRW50ZXJIYW5kbGVyKTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogUmVtb3ZlcyB0aGUgbW91c2VlbnRlciBoYW5kbGVyIG9uIHRvdWNoc3RhcnQsXG5cdFx0ICogc28gdGhhdCB0aGUgbWFnbmlmaWVyIG5vdCBzdGFydHMgb24gdG91Y2guXG5cdFx0ICogVGhlIGZ1bmN0aW9uIGdldHMgcmVhY3RpdmF0ZWQgaW4gdGhlIG1vdXNlbGVhdmVcblx0XHQgKiBoYW5kbGVyXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKi9cblx0XHR2YXIgX3RvdWNoSGFuZGxlciA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0JHRoaXMub2ZmKCdtb3VzZWVudGVyJyk7XG5cdFx0fTtcblxuLy8gIyMjIyMjIyMjIyBJTklUSUFMSVpBVElPTiAjIyMjIyMjIyMjXG5cblx0XHQvKipcblx0XHQgKiBJbml0IGZ1bmN0aW9uIG9mIHRoZSB3aWRnZXRcblx0XHQgKiBAY29uc3RydWN0b3Jcblx0XHQgKi9cblx0XHRtb2R1bGUuaW5pdCA9IGZ1bmN0aW9uKGRvbmUpIHtcblxuXHRcdFx0JHRhcmdldCA9ICQob3B0aW9ucy50YXJnZXQpO1xuXG5cdFx0XHQkdGhpc1xuXHRcdFx0XHQub24oJ3RvdWNoc3RhcnQnLCAnaW1nW2RhdGEtbWFnbmlmaWVyLXNyY10nLCBfdG91Y2hIYW5kbGVyKVxuXHRcdFx0XHQub24oJ21vdXNlZW50ZXInLCAnaW1nW2RhdGEtbWFnbmlmaWVyLXNyY10nLCBfbW91c2VFbnRlckhhbmRsZXIpXG5cdFx0XHRcdC5vbignbW91c2VsZWF2ZScsICdpbWdbZGF0YS1tYWduaWZpZXItc3JjXScsIF9tb3VzZUxlYXZlSGFuZGxlcik7XG5cblx0XHRcdCQod2luZG93KS5vbigncmVzaXplJywgX3Jlc2l6ZUhhbmRsZXIpO1xuXG5cdFx0XHRkb25lKCk7XG5cdFx0fTtcblxuXHRcdC8vIFJldHVybiBkYXRhIHRvIHdpZGdldCBlbmdpbmVcblx0XHRyZXR1cm4gbW9kdWxlO1xuXHR9KTtcbiJdfQ==

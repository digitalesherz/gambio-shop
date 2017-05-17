'use strict';

/* --------------------------------------------------------------
 stickybox.js 2017-01-12
 Gambio GmbH
 http://www.gambio.de
 Copyright (c) 2017 Gambio GmbH
 Released under the GNU General Public License (Version 2)
 [http://www.gnu.org/licenses/gpl-2.0.html]
 --------------------------------------------------------------
 */

/**
 * Widget that keeps an element between the two elements in view
 */
gambio.widgets.module('stickybox', [gambio.source + '/libs/events', gambio.source + '/libs/responsive'], function (data) {

	'use strict';

	// ########## VARIABLE INITIALIZATION ##########

	var $this = $(this),
	    $window = $(window),
	    $header = null,
	    $footer = null,
	    $outerWrapper = null,
	    bottom = null,
	    top = null,
	    elementHeight = null,
	    elementWidth = null,
	    elementOffset = null,
	    fixedTopPosition = null,
	    documentHeight = null,
	    headerFixed = null,
	    css = null,
	    timer = null,
	    initialOffset = null,
	    initialTop = null,
	    initialHeader = null,
	    initialMarginTop = null,
	    skipped = 0,
	    checkFit = true,
	    lastFit = null,
	    defaults = {
		breakpoint: 60, // The breakpoint, since which this script calculates the position
		outerWrapper: '#outer-wrapper', // Selector to set the header's margin top
		header: 'header', // Selector to set the header height
		footer: '.product-info-listings, footer', // Selector to set the footer height
		offsetTopReferenceSelector: '#breadcrumb_navi, .product-info', // Reference selector to set the top position of the sticky box
		marginTop: 15, // Add a space between header/footer and content container
		marginBottom: 0, // Add a space between header/footer and content container
		zIndex: 1000, // Sets the z-index in fixed mode
		cpuOptimization: false, // If set to true, the number of events in "smoothness" gets skipped
		smoothness: 10, // The higher the value, the more scroll events gets skipped
		smoothnessDelay: 150, // The delay after the last scroll event the cpu optimization fires an recalculate event
		stage: '#stage', // Selector to set teaser slider height
		errorBox: 'table.box-error, table.box-warning' // Selector to set error box height
	},
	    options = $.extend(true, {}, defaults, data),
	    module = {};

	// ########## HELPER FUNCTIONS ##########

	/**
  * Calculates all necessary positions,
  * offsets and dimensions
  * @private
  */
	var _calculateDimensions = function _calculateDimensions() {
		top = $header.outerHeight();
		bottom = $footer.offset().top;
		top += options.marginTop;
		bottom -= options.marginBottom;

		elementHeight = $this.outerHeight();
		elementWidth = $this.outerWidth();
		elementOffset = elementOffset || $this.offset();

		documentHeight = $(document).height();

		var cssTop = options.marginTop;
		if (headerFixed) {
			cssTop = top;
		}

		css = {
			'position': 'fixed',
			'top': cssTop + 'px',
			'left': elementOffset.left + 'px',
			'z-index': options.zIndex,
			'width': elementWidth
		};
	};

	/**
  * Checks if the available space between
  * the header & footer is enough to set
  * the container sticky
  * @return         {boolean}           If true, there is enough space to set it sticky
  * @private
  */
	var _fitInView = function _fitInView() {

		if (checkFit) {
			checkFit = false;

			_resetPosition();

			window.setTimeout(function () {
				checkFit = true;
			}, 100);

			lastFit = documentHeight - Math.abs(bottom - documentHeight) - top;
		}

		return lastFit > elementHeight;
	};

	/**
  * Helper function that gets called on scroll. In case
  * the content could be displayed without being sticky,
  * the sticky-styles were removed, else a check is
  * performed if the top of the element needs to be
  * adjusted in case that it would overlap with the
  * footer otherwise.
  * @param       {number}     scrollPosition      Current scroll position of the page
  * @private
  */
	var _calcPosition = function _calcPosition(scrollPosition) {
		if (headerFixed) {
			var elementBottom = scrollPosition + top + elementHeight + options.marginBottom,
			    overlapping = elementBottom - bottom,
			    currentTop = parseFloat($this.css('top')),
			    newTop = initialTop - (initialHeader - top) + scrollPosition;

			newTop = newTop < initialTop ? initialTop : newTop;
			newTop -= overlapping - top;

			if (top + scrollPosition <= elementOffset.top) {
				_resetPosition();
			} else if (overlapping > 0) {
				if (bottom - scrollPosition < elementHeight + initialHeader - initialTop) {
					newTop = bottom - elementHeight - initialHeader + initialTop - initialMarginTop;
					_resetPosition();
					$this.css({ top: newTop + 'px' });
				} else if (Math.abs(currentTop - newTop) >= 0.5) {
					_resetPosition();
					$this.css({ top: newTop + 'px' });
				}
			} else if ($this.css('position') !== 'fixed' || $this.css('top') !== css.top) {
				$this.css(css);
			}
		} else {
			if (scrollPosition <= elementOffset.top - options.marginTop) {
				_resetPosition();
			} else if (bottom - scrollPosition + options.marginTop < elementHeight - initialTop - options.marginTop) {
				newTop = bottom - elementHeight - initialHeader + initialTop - initialMarginTop;
				_resetPosition();
				$this.css({ top: newTop + 'px' });
			} else if ($this.css('position') !== 'fixed' || $this.css('top') !== css.top) {
				$this.css(css);
			}
		}
	};

	/**
  * In case that the CPU optimization
  * is enabled, skipp a certain count
  * of scroll events before recalculating
  * the position.
  * @return     {boolean}           True if this event shall be processed
  * @private
  */
	var _cpuOptimization = function _cpuOptimization() {
		skipped += 1;
		clearTimeout(timer);
		if (skipped < options.smoothness) {
			timer = setTimeout(function () {
				$window.trigger('scroll.stickybox', true);
			}, options.smoothnessDelay);
			return false;
		}
		skipped = 0;
		return true;
	};

	/**
  * Set the initial top position of the sticky box. A correction is necessary, if the breadcrumb is longer than 
  * one line.
  * 
  * @private
  */
	var _fixInitialTopPosition = function _fixInitialTopPosition() {
		var offsetTop = $this.offset().top,
		    targetOffsetTop = $(options.offsetTopReferenceSelector).first().offset().top,
		    offsetDifference = offsetTop - targetOffsetTop,
		    topPosition = parseFloat($this.css('top'));

		fixedTopPosition = topPosition - offsetDifference;

		_resetPosition();
	};

	/**
  * Restore initial position of the sticky box by removing its style attribute and setting the fixed top position.
  * 
  * @private
  */
	var _resetPosition = function _resetPosition() {
		$this.removeAttr('style');

		if (jse.libs.template.responsive.breakpoint().name === 'md' || jse.libs.template.responsive.breakpoint().name === 'lg') {
			$this.css('top', fixedTopPosition + 'px');
		} else {
			$this.css('top', '');
		}
	};

	// ########## EVENT HANDLER ##########

	/**
  * Event handler for the scroll event. It gets the
  * upper border of the content element and calls
  * individual methods depending on the sticky state.
  * To perform better on low end CPUs it checks if
  * scroll events shall be skipped.
  * @private
  */
	var _checkPosition = function _checkPosition(e, d) {

		if (options.cpuOptimization && !d && !_cpuOptimization()) {
			return true;
		}

		if (jse.libs.template.responsive.breakpoint().id > options.breakpoint) {
			_calculateDimensions();
			var scrollPosition = $window.scrollTop(),
			    fit = _fitInView();

			if (fit) {
				_calcPosition(scrollPosition);
			}
		}
	};

	/**
  * Handler for the resize event. On browser
  * resize it is resetting the state to calculate
  * a new position
  * @private
  */
	var _resizeHandler = function _resizeHandler() {
		_resetPosition();
		elementOffset = null;
		skipped = 0;
		initialOffset = $this.offset().top;

		_checkPosition();
	};

	// ########## INITIALIZATION ##########

	/**
  * Init function of the widget
  * @constructor
  */
	module.init = function (done) {
		var sliderHeight = 0,
		    errorBoxHeight = 0,
		    marginTop = 0,
		    marginBottom = 0;

		$outerWrapper = $(options.outerWrapper);
		$header = $(options.header);
		$footer = $(options.footer);

		if ($(options.stage).length > 0) {
			sliderHeight = $(options.stage).outerHeight();
		}

		$(options.errorBox).each(function () {
			marginTop = parseInt($(this).css('margin-top'), 10);
			marginBottom = parseInt($(this).css('margin-bottom'), 10);

			errorBoxHeight += $(this).outerHeight();
			errorBoxHeight += marginTop;
			errorBoxHeight += marginBottom;
		});

		var errorBoxElements = $(options.errorBox).length;

		if (errorBoxElements >= 2) {
			errorBoxHeight = errorBoxHeight - marginTop * (errorBoxElements - 1);
		}

		_fixInitialTopPosition();

		initialOffset = $this.offset().top;
		initialTop = parseFloat($this.css('top'));
		initialHeader = $header.outerHeight() + options.marginTop + sliderHeight + errorBoxHeight;
		initialMarginTop = parseFloat($outerWrapper.css('margin-top').replace(/[^\d]/, ''));
		headerFixed = $header.css('position') === 'fixed';

		if (!jse.core.config.get('mobile')) {
			_checkPosition();

			$window.on('resize', _resizeHandler).on('scroll.stickybox', _checkPosition).on(jse.libs.template.events.REPOSITIONS_STICKYBOX(), _resizeHandler);
		} else {
			$('body').on(jse.libs.template.events.BREAKPOINT(), _fixInitialTopPosition);
		}

		done();
	};

	// Return data to widget engine
	return module;
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndpZGdldHMvc3RpY2t5Ym94LmpzIl0sIm5hbWVzIjpbImdhbWJpbyIsIndpZGdldHMiLCJtb2R1bGUiLCJzb3VyY2UiLCJkYXRhIiwiJHRoaXMiLCIkIiwiJHdpbmRvdyIsIndpbmRvdyIsIiRoZWFkZXIiLCIkZm9vdGVyIiwiJG91dGVyV3JhcHBlciIsImJvdHRvbSIsInRvcCIsImVsZW1lbnRIZWlnaHQiLCJlbGVtZW50V2lkdGgiLCJlbGVtZW50T2Zmc2V0IiwiZml4ZWRUb3BQb3NpdGlvbiIsImRvY3VtZW50SGVpZ2h0IiwiaGVhZGVyRml4ZWQiLCJjc3MiLCJ0aW1lciIsImluaXRpYWxPZmZzZXQiLCJpbml0aWFsVG9wIiwiaW5pdGlhbEhlYWRlciIsImluaXRpYWxNYXJnaW5Ub3AiLCJza2lwcGVkIiwiY2hlY2tGaXQiLCJsYXN0Rml0IiwiZGVmYXVsdHMiLCJicmVha3BvaW50Iiwib3V0ZXJXcmFwcGVyIiwiaGVhZGVyIiwiZm9vdGVyIiwib2Zmc2V0VG9wUmVmZXJlbmNlU2VsZWN0b3IiLCJtYXJnaW5Ub3AiLCJtYXJnaW5Cb3R0b20iLCJ6SW5kZXgiLCJjcHVPcHRpbWl6YXRpb24iLCJzbW9vdGhuZXNzIiwic21vb3RobmVzc0RlbGF5Iiwic3RhZ2UiLCJlcnJvckJveCIsIm9wdGlvbnMiLCJleHRlbmQiLCJfY2FsY3VsYXRlRGltZW5zaW9ucyIsIm91dGVySGVpZ2h0Iiwib2Zmc2V0Iiwib3V0ZXJXaWR0aCIsImRvY3VtZW50IiwiaGVpZ2h0IiwiY3NzVG9wIiwibGVmdCIsIl9maXRJblZpZXciLCJfcmVzZXRQb3NpdGlvbiIsInNldFRpbWVvdXQiLCJNYXRoIiwiYWJzIiwiX2NhbGNQb3NpdGlvbiIsInNjcm9sbFBvc2l0aW9uIiwiZWxlbWVudEJvdHRvbSIsIm92ZXJsYXBwaW5nIiwiY3VycmVudFRvcCIsInBhcnNlRmxvYXQiLCJuZXdUb3AiLCJfY3B1T3B0aW1pemF0aW9uIiwiY2xlYXJUaW1lb3V0IiwidHJpZ2dlciIsIl9maXhJbml0aWFsVG9wUG9zaXRpb24iLCJvZmZzZXRUb3AiLCJ0YXJnZXRPZmZzZXRUb3AiLCJmaXJzdCIsIm9mZnNldERpZmZlcmVuY2UiLCJ0b3BQb3NpdGlvbiIsInJlbW92ZUF0dHIiLCJqc2UiLCJsaWJzIiwidGVtcGxhdGUiLCJyZXNwb25zaXZlIiwibmFtZSIsIl9jaGVja1Bvc2l0aW9uIiwiZSIsImQiLCJpZCIsInNjcm9sbFRvcCIsImZpdCIsIl9yZXNpemVIYW5kbGVyIiwiaW5pdCIsImRvbmUiLCJzbGlkZXJIZWlnaHQiLCJlcnJvckJveEhlaWdodCIsImxlbmd0aCIsImVhY2giLCJwYXJzZUludCIsImVycm9yQm94RWxlbWVudHMiLCJyZXBsYWNlIiwiY29yZSIsImNvbmZpZyIsImdldCIsIm9uIiwiZXZlbnRzIiwiUkVQT1NJVElPTlNfU1RJQ0tZQk9YIiwiQlJFQUtQT0lOVCJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7Ozs7OztBQVVBOzs7QUFHQUEsT0FBT0MsT0FBUCxDQUFlQyxNQUFmLENBQ0MsV0FERCxFQUdDLENBQ0NGLE9BQU9HLE1BQVAsR0FBZ0IsY0FEakIsRUFFQ0gsT0FBT0csTUFBUCxHQUFnQixrQkFGakIsQ0FIRCxFQVFDLFVBQVNDLElBQVQsRUFBZTs7QUFFZDs7QUFFRjs7QUFFRSxLQUFJQyxRQUFRQyxFQUFFLElBQUYsQ0FBWjtBQUFBLEtBQ0NDLFVBQVVELEVBQUVFLE1BQUYsQ0FEWDtBQUFBLEtBRUNDLFVBQVUsSUFGWDtBQUFBLEtBR0NDLFVBQVUsSUFIWDtBQUFBLEtBSUNDLGdCQUFnQixJQUpqQjtBQUFBLEtBS0NDLFNBQVMsSUFMVjtBQUFBLEtBTUNDLE1BQU0sSUFOUDtBQUFBLEtBT0NDLGdCQUFnQixJQVBqQjtBQUFBLEtBUUNDLGVBQWUsSUFSaEI7QUFBQSxLQVNDQyxnQkFBZ0IsSUFUakI7QUFBQSxLQVVDQyxtQkFBbUIsSUFWcEI7QUFBQSxLQVdDQyxpQkFBaUIsSUFYbEI7QUFBQSxLQVlDQyxjQUFjLElBWmY7QUFBQSxLQWFDQyxNQUFNLElBYlA7QUFBQSxL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MkUsT0FBaEMsQ0FBd0MsT0FBeEMsRUFBaUQsRUFBakQsQ0FBWCxDQUFuQjtBQUNBNUUsZ0JBQWNWLFFBQVFXLEdBQVIsQ0FBWSxVQUFaLE1BQTRCLE9BQTFDOztBQUVBLE1BQUksQ0FBQ3VELElBQUlxQixJQUFKLENBQVNDLE1BQVQsQ0FBZ0JDLEdBQWhCLENBQW9CLFFBQXBCLENBQUwsRUFBb0M7QUFDbkNsQjs7QUFFQXpFLFdBQ0U0RixFQURGLENBQ0ssUUFETCxFQUNlYixjQURmLEVBRUVhLEVBRkYsQ0FFSyxrQkFGTCxFQUV5Qm5CLGNBRnpCLEVBR0VtQixFQUhGLENBR0t4QixJQUFJQyxJQUFKLENBQVNDLFFBQVQsQ0FBa0J1QixNQUFsQixDQUF5QkMscUJBQXpCLEVBSEwsRUFHdURmLGNBSHZEO0FBSUEsR0FQRCxNQU9PO0FBQ05oRixLQUFFLE1BQUYsRUFBVTZGLEVBQVYsQ0FBYXhCLElBQUlDLElBQUosQ0FBU0MsUUFBVCxDQUFrQnVCLE1BQWxCLENBQXlCRSxVQUF6QixFQUFiLEVBQW9EbEMsc0JBQXBEO0FBQ0E7O0FBRURvQjtBQUNBLEVBakREOztBQW1EQTtBQUNBLFFBQU90RixNQUFQO0FBQ0EsQ0E5VEYiLCJmaWxlIjoid2lkZ2V0cy9zdGlja3lib3guanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIHN0aWNreWJveC5qcyAyMDE3LTAxLTEyXG4gR2FtYmlvIEdtYkhcbiBodHRwOi8vd3d3LmdhbWJpby5kZVxuIENvcHlyaWdodCAoYykgMjAxNyBHYW1iaW8gR21iSFxuIFJlbGVhc2VkIHVuZGVyIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSAoVmVyc2lvbiAyKVxuIFtodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvZ3BsLTIuMC5odG1sXVxuIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKi9cblxuLyoqXG4gKiBXaWRnZXQgdGhhdCBrZWVwcyBhbiBlbGVtZW50IGJldHdlZW4gdGhlIHR3byBlbGVtZW50cyBpbiB2aWV3XG4gKi9cbmdhbWJpby53aWRnZXRzLm1vZHVsZShcblx0J3N0aWNreWJveCcsXG5cblx0W1xuXHRcdGdhbWJpby5zb3VyY2UgKyAnL2xpYnMvZXZlbnRzJyxcblx0XHRnYW1iaW8uc291cmNlICsgJy9saWJzL3Jlc3BvbnNpdmUnXG5cdF0sXG5cblx0ZnVuY3Rpb24oZGF0YSkge1xuXG5cdFx0J3VzZSBzdHJpY3QnO1xuXG4vLyAjIyMjIyMjIyMjIFZBUklBQkxFIElOSVRJQUxJWkFUSU9OICMjIyMjIyMjIyNcblxuXHRcdHZhciAkdGhpcyA9ICQodGhpcyksXG5cdFx0XHQkd2luZG93ID0gJCh3aW5kb3cpLFxuXHRcdFx0JGhlYWRlciA9IG51bGwsXG5cdFx0XHQkZm9vdGVyID0gbnVsbCxcblx0XHRcdCRvdXRlcldyYXBwZXIgPSBudWxsLFxuXHRcdFx0Ym90dG9tID0gbnVsbCxcblx0XHRcdHRvcCA9IG51bGwsXG5cdFx0XHRlbGVtZW50SGVpZ2h0ID0gbnVsbCxcblx0XHRcdGVsZW1lbnRXaWR0aCA9IG51bGwsXG5cdFx0XHRlbGVtZW50T2Zmc2V0ID0gbnVsbCxcblx0XHRcdGZpeGVkVG9wUG9zaXRpb24gPSBudWxsLFxuXHRcdFx0ZG9jdW1lbnRIZWlnaHQgPSBudWxsLFxuXHRcdFx0aGVhZGVyRml4ZWQgPSBudWxsLFxuXHRcdFx0Y3NzID0gbnVsbCxcblx0XHRcdHRpbWVyID0gbnVsbCxcblx0XHRcdGluaXRpYWxPZmZzZXQgPSBudWxsLFxuXHRcdFx0aW5pdGlhbFRvcCA9IG51bGwsXG5cdFx0XHRpbml0aWFsSGVhZGVyID0gbnVsbCxcblx0XHRcdGluaXRpYWxNYXJnaW5Ub3AgPSBudWxsLFxuXHRcdFx0c2tpcHBlZCA9IDAsXG5cdFx0XHRjaGVja0ZpdCA9IHRydWUsXG5cdFx0XHRsYXN0Rml0ID0gbnVsbCxcblx0XHRcdGRlZmF1bHRzID0ge1xuXHRcdFx0XHRicmVha3BvaW50OiA2MCwgLy8gVGhlIGJyZWFrcG9pbnQsIHNpbmNlIHdoaWNoIHRoaXMgc2NyaXB0IGNhbGN1bGF0ZXMgdGhlIHBvc2l0aW9uXG5cdFx0XHRcdG91dGVyV3JhcHBlcjogJyNvdXRlci13cmFwcGVyJywgLy8gU2VsZWN0b3IgdG8gc2V0IHRoZSBoZWFkZXIncyBtYXJnaW4gdG9wXG5cdFx0XHRcdGhlYWRlcjogJ2hlYWRlcicsIC8vIFNlbGVjdG9yIHRvIHNldCB0aGUgaGVhZGVyIGhlaWdodFxuXHRcdFx0XHRmb290ZXI6ICcucHJvZHVjdC1pbmZvLWxpc3RpbmdzLCBmb290ZXInLCAvLyBTZWxlY3RvciB0byBzZXQgdGhlIGZvb3RlciBoZWlnaHRcblx0XHRcdFx0b2Zmc2V0VG9wUmVmZXJlbmNlU2VsZWN0b3I6ICcjYnJlYWRjcnVtYl9uYXZpLCAucHJvZHVjdC1pbmZvJywgLy8gUmVmZXJlbmNlIHNlbGVjdG9yIHRvIHNldCB0aGUgdG9wIHBvc2l0aW9uIG9mIHRoZSBzdGlja3kgYm94XG5cdFx0XHRcdG1hcmdpblRvcDogMTUsIC8vIEFkZCBhIHNwYWNlIGJldHdlZW4gaGVhZGVyL2Zvb3RlciBhbmQgY29udGVudCBjb250YWluZXJcblx0XHRcdFx0bWFyZ2luQm90dG9tOiAwLCAvLyBBZGQgYSBzcGFjZSBiZXR3ZWVuIGhlYWRlci9mb290ZXIgYW5kIGNvbnRlbnQgY29udGFpbmVyXG5cdFx0XHRcdHpJbmRleDogMTAwMCwgLy8gU2V0cyB0aGUgei1pbmRleCBpbiBmaXhlZCBtb2RlXG5cdFx0XHRcdGNwdU9wdGltaXphdGlvbjogZmFsc2UsIC8vIElmIHNldCB0byB0cnVlLCB0aGUgbnVtYmVyIG9mIGV2ZW50cyBpbiBcInNtb290aG5lc3NcIiBnZXRzIHNraXBwZWRcblx0XHRcdFx0c21vb3RobmVzczogMTAsIC8vIFRoZSBoaWdoZXIgdGhlIHZhbHVlLCB0aGUgbW9yZSBzY3JvbGwgZXZlbnRzIGdldHMgc2tpcHBlZFxuXHRcdFx0XHRzbW9vdGhuZXNzRGVsYXk6IDE1MCwgLy8gVGhlIGRlbGF5IGFmdGVyIHRoZSBsYXN0IHNjcm9sbCBldmVudCB0aGUgY3B1IG9wdGltaXphdGlvbiBmaXJlcyBhbiByZWNhbGN1bGF0ZSBldmVudFxuXHRcdFx0XHRzdGFnZTogJyNzdGFnZScsIC8vIFNlbGVjdG9yIHRvIHNldCB0ZWFzZXIgc2xpZGVyIGhlaWdodFxuXHRcdFx0XHRlcnJvckJveDogJ3RhYmxlLmJveC1lcnJvciwgdGFibGUuYm94LXdhcm5pbmcnIC8vIFNlbGVjdG9yIHRvIHNldCBlcnJvciBib3ggaGVpZ2h0XG5cdFx0XHR9LFxuXHRcdFx0b3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cywgZGF0YSksXG5cdFx0XHRtb2R1bGUgPSB7fTtcblxuLy8gIyMjIyMjIyMjIyBIRUxQRVIgRlVOQ1RJT05TICMjIyMjIyMjIyNcblxuXHRcdC8qKlxuXHRcdCAqIENhbGN1bGF0ZXMgYWxsIG5lY2Vzc2FyeSBwb3NpdGlvbnMsXG5cdFx0ICogb2Zmc2V0cyBhbmQgZGltZW5zaW9uc1xuXHRcdCAqIEBwcml2YXRlXG5cdFx0ICovXG5cdFx0dmFyIF9jYWxjdWxhdGVEaW1lbnNpb25zID0gZnVuY3Rpb24oKSB7XG5cdFx0XHR0b3AgPSAkaGVhZGVyLm91dGVySGVpZ2h0KCk7XG5cdFx0XHRib3R0b20gPSAkZm9vdGVyLm9mZnNldCgpLnRvcDtcblx0XHRcdHRvcCArPSBvcHRpb25zLm1hcmdpblRvcDtcblx0XHRcdGJvdHRvbSAtPSBvcHRpb25zLm1hcmdpbkJvdHRvbTtcblxuXHRcdFx0ZWxlbWVudEhlaWdodCA9ICR0aGlzLm91dGVySGVpZ2h0KCk7XG5cdFx0XHRlbGVtZW50V2lkdGggPSAkdGhpcy5vdXRlcldpZHRoKCk7XG5cdFx0XHRlbGVtZW50T2Zmc2V0ID0gZWxlbWVudE9mZnNldCB8fCAkdGhpcy5vZmZzZXQoKTtcblxuXHRcdFx0ZG9jdW1lbnRIZWlnaHQgPSAkKGRvY3VtZW50KS5oZWlnaHQoKTtcblx0XHRcdFxuXHRcdFx0dmFyIGNzc1RvcCA9IG9wdGlvbnMubWFyZ2luVG9wOyBcblx0XHRcdGlmIChoZWFkZXJGaXhlZCkge1xuXHRcdFx0XHRjc3NUb3AgPSB0b3A7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdGNzcyA9IHtcblx0XHRcdFx0J3Bvc2l0aW9uJzogJ2ZpeGVkJyxcblx0XHRcdFx0J3RvcCc6IGNzc1RvcCArICdweCcsXG5cdFx0XHRcdCdsZWZ0JzogZWxlbWVudE9mZnNldC5sZWZ0ICsgJ3B4Jyxcblx0XHRcdFx0J3otaW5kZXgnOiBvcHRpb25zLnpJbmRleCxcblx0XHRcdFx0J3dpZHRoJzogZWxlbWVudFdpZHRoXG5cdFx0XHR9O1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBDaGVja3MgaWYgdGhlIGF2YWlsYWJsZSBzcGFjZSBiZXR3ZWVuXG5cdFx0ICogdGhlIGhlYWRlciAmIGZvb3RlciBpcyBlbm91Z2ggdG8gc2V0XG5cdFx0ICogdGhlIGNvbnRhaW5lciBzdGlja3lcblx0XHQgKiBAcmV0dXJuICAgICAgICAge2Jvb2xlYW59ICAgICAgICAgICBJZiB0cnVlLCB0aGVyZSBpcyBlbm91Z2ggc3BhY2UgdG8gc2V0IGl0IHN0aWNreVxuXHRcdCAqIEBwcml2YXRlXG5cdFx0ICovXG5cdFx0dmFyIF9maXRJblZpZXcgPSBmdW5jdGlvbigpIHtcblxuXHRcdFx0aWYgKGNoZWNrRml0KSB7XG5cdFx0XHRcdGNoZWNrRml0ID0gZmFsc2U7XG5cblx0XHRcdFx0X3Jlc2V0UG9zaXRpb24oKTtcblxuXHRcdFx0XHR3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRjaGVja0ZpdCA9IHRydWU7XG5cdFx0XHRcdH0sIDEwMCk7XG5cblx0XHRcdFx0bGFzdEZpdCA9IGRvY3VtZW50SGVpZ2h0IC0gTWF0aC5hYnMoYm90dG9tIC0gZG9jdW1lbnRIZWlnaHQpIC0gdG9wO1xuXG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBsYXN0Rml0ID4gZWxlbWVudEhlaWdodDtcblxuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBIZWxwZXIgZnVuY3Rpb24gdGhhdCBnZXRzIGNhbGxlZCBvbiBzY3JvbGwuIEluIGNhc2Vcblx0XHQgKiB0aGUgY29udGVudCBjb3VsZCBiZSBkaXNwbGF5ZWQgd2l0aG91dCBiZWluZyBzdGlja3ksXG5cdFx0ICogdGhlIHN0aWNreS1zdHlsZXMgd2VyZSByZW1vdmVkLCBlbHNlIGEgY2hlY2sgaXNcblx0XHQgKiBwZXJmb3JtZWQgaWYgdGhlIHRvcCBvZiB0aGUgZWxlbWVudCBuZWVkcyB0byBiZVxuXHRcdCAqIGFkanVzdGVkIGluIGNhc2UgdGhhdCBpdCB3b3VsZCBvdmVybGFwIHdpdGggdGhlXG5cdFx0ICogZm9vdGVyIG90aGVyd2lzZS5cblx0XHQgKiBAcGFyYW0gICAgICAge251bWJlcn0gICAgIHNjcm9sbFBvc2l0aW9uICAgICAgQ3VycmVudCBzY3JvbGwgcG9zaXRpb24gb2YgdGhlIHBhZ2Vcblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqL1xuXHRcdHZhciBfY2FsY1Bvc2l0aW9uID0gZnVuY3Rpb24oc2Nyb2xsUG9zaXRpb24pIHtcblx0XHRcdGlmIChoZWFkZXJGaXhlZCkge1xuXHRcdFx0XHR2YXIgZWxlbWVudEJvdHRvbSA9IHNjcm9sbFBvc2l0aW9uICsgdG9wICsgZWxlbWVudEhlaWdodCArIG9wdGlvbnMubWFyZ2luQm90dG9tLFxuXHRcdFx0XHRcdG92ZXJsYXBwaW5nID0gZWxlbWVudEJvdHRvbSAtIGJvdHRvbSxcblx0XHRcdFx0XHRjdXJyZW50VG9wID0gcGFyc2VGbG9hdCgkdGhpcy5jc3MoJ3RvcCcpKSxcblx0XHRcdFx0XHRuZXdUb3AgPSBpbml0aWFsVG9wIC0gKGluaXRpYWxIZWFkZXIgLSB0b3ApICsgc2Nyb2xsUG9zaXRpb247XG5cdFx0XHRcdFxuXHRcdFx0XHRuZXdUb3AgPSAobmV3VG9wIDwgaW5pdGlhbFRvcCkgPyBpbml0aWFsVG9wIDogbmV3VG9wO1xuXHRcdFx0XHRuZXdUb3AgLT0gb3ZlcmxhcHBpbmcgLSB0b3A7XG5cdFx0XHRcdFxuXHRcdFx0XHRpZiAodG9wICsgc2Nyb2xsUG9zaXRpb24gPD0gZWxlbWVudE9mZnNldC50b3ApIHtcblx0XHRcdFx0XHRfcmVzZXRQb3NpdGlvbigpO1xuXHRcdFx0XHR9IGVsc2UgaWYgKG92ZXJsYXBwaW5nID4gMCkge1xuXHRcdFx0XHRcdGlmIChib3R0b20gLSBzY3JvbGxQb3NpdGlvbiA8IGVsZW1lbnRIZWlnaHQgKyBpbml0aWFsSGVhZGVyIC0gaW5pdGlhbFRvcCkge1xuXHRcdFx0XHRcdFx0bmV3VG9wID0gYm90dG9tIC0gZWxlbWVudEhlaWdodCAtIGluaXRpYWxIZWFkZXIgKyBpbml0aWFsVG9wIC0gaW5pdGlhbE1hcmdpblRvcDtcblx0XHRcdFx0XHRcdF9yZXNldFBvc2l0aW9uKCk7XG5cdFx0XHRcdFx0XHQkdGhpcy5jc3Moe3RvcDogbmV3VG9wICsgJ3B4J30pO1xuXHRcdFx0XHRcdH0gZWxzZSBpZiAoTWF0aC5hYnMoY3VycmVudFRvcCAtIG5ld1RvcCkgPj0gMC41KSB7XG5cdFx0XHRcdFx0XHRfcmVzZXRQb3NpdGlvbigpO1xuXHRcdFx0XHRcdFx0JHRoaXMuY3NzKHt0b3A6IG5ld1RvcCArICdweCd9KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gZWxzZSBpZiAoJHRoaXMuY3NzKCdwb3NpdGlvbicpICE9PSAnZml4ZWQnIHx8ICR0aGlzLmNzcygndG9wJykgIT09IGNzcy50b3ApIHtcblx0XHRcdFx0XHQkdGhpcy5jc3MoY3NzKTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aWYgKHNjcm9sbFBvc2l0aW9uIDw9IGVsZW1lbnRPZmZzZXQudG9wIC0gb3B0aW9ucy5tYXJnaW5Ub3ApIHtcblx0XHRcdFx0XHRfcmVzZXRQb3NpdGlvbigpO1xuXHRcdFx0XHR9IGVsc2UgaWYgKGJvdHRvbSAtIHNjcm9sbFBvc2l0aW9uICsgb3B0aW9ucy5tYXJnaW5Ub3AgPCBlbGVtZW50SGVpZ2h0IC0gaW5pdGlhbFRvcCAtIG9wdGlvbnMubWFyZ2luVG9wKSB7XG5cdFx0XHRcdFx0bmV3VG9wID0gYm90dG9tIC0gZWxlbWVudEhlaWdodCAtIGluaXRpYWxIZWFkZXIgKyBpbml0aWFsVG9wIC0gaW5pdGlhbE1hcmdpblRvcDtcblx0XHRcdFx0XHRfcmVzZXRQb3NpdGlvbigpO1xuXHRcdFx0XHRcdCR0aGlzLmNzcyh7dG9wOiBuZXdUb3AgKyAncHgnfSk7XG5cdFx0XHRcdH0gZWxzZSBpZiAoJHRoaXMuY3NzKCdwb3NpdGlvbicpICE9PSAnZml4ZWQnIHx8ICR0aGlzLmNzcygndG9wJykgIT09IGNzcy50b3ApIHtcblx0XHRcdFx0XHQkdGhpcy5jc3MoY3NzKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIEluIGNhc2UgdGhhdCB0aGUgQ1BVIG9wdGltaXphdGlvblxuXHRcdCAqIGlzIGVuYWJsZWQsIHNraXBwIGEgY2VydGFpbiBjb3VudFxuXHRcdCAqIG9mIHNjcm9sbCBldmVudHMgYmVmb3JlIHJlY2FsY3VsYXRpbmdcblx0XHQgKiB0aGUgcG9zaXRpb24uXG5cdFx0ICogQHJldHVybiAgICAge2Jvb2xlYW59ICAgICAgICAgICBUcnVlIGlmIHRoaXMgZXZlbnQgc2hhbGwgYmUgcHJvY2Vzc2VkXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKi9cblx0XHR2YXIgX2NwdU9wdGltaXphdGlvbiA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0c2tpcHBlZCArPSAxO1xuXHRcdFx0Y2xlYXJUaW1lb3V0KHRpbWVyKTtcblx0XHRcdGlmIChza2lwcGVkIDwgb3B0aW9ucy5zbW9vdGhuZXNzKSB7XG5cdFx0XHRcdHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdFx0XHQkd2luZG93LnRyaWdnZXIoJ3Njcm9sbC5zdGlja3lib3gnLCB0cnVlKTtcblx0XHRcdFx0fSwgb3B0aW9ucy5zbW9vdGhuZXNzRGVsYXkpO1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHRza2lwcGVkID0gMDtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH07XG5cdFx0XG5cdFx0LyoqXG5cdFx0ICogU2V0IHRoZSBpbml0aWFsIHRvcCBwb3NpdGlvbiBvZiB0aGUgc3RpY2t5IGJveC4gQSBjb3JyZWN0aW9uIGlzIG5lY2Vzc2FyeSwgaWYgdGhlIGJyZWFkY3J1bWIgaXMgbG9uZ2VyIHRoYW4gXG5cdFx0ICogb25lIGxpbmUuXG5cdFx0ICogXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKi9cblx0XHR2YXIgX2ZpeEluaXRpYWxUb3BQb3NpdGlvbiA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIG9mZnNldFRvcCA9ICR0aGlzLm9mZnNldCgpLnRvcCxcblx0XHRcdFx0dGFyZ2V0T2Zmc2V0VG9wID0gJChvcHRpb25zLm9mZnNldFRvcFJlZmVyZW5jZVNlbGVjdG9yKS5maXJzdCgpLm9mZnNldCgpLnRvcCxcblx0XHRcdFx0b2Zmc2V0RGlmZmVyZW5jZSA9IG9mZnNldFRvcCAtIHRhcmdldE9mZnNldFRvcCxcblx0XHRcdFx0dG9wUG9zaXRpb24gPSBwYXJzZUZsb2F0KCR0aGlzLmNzcygndG9wJykpO1xuXHRcdFx0XG5cdFx0XHRmaXhlZFRvcFBvc2l0aW9uID0gdG9wUG9zaXRpb24gLSBvZmZzZXREaWZmZXJlbmNlO1xuXHRcdFx0XG5cdFx0XHRfcmVzZXRQb3NpdGlvbigpO1x0XG5cdFx0fTtcblx0XHRcblx0XHQvKipcblx0XHQgKiBSZXN0b3JlIGluaXRpYWwgcG9zaXRpb24gb2YgdGhlIHN0aWNreSBib3ggYnkgcmVtb3ZpbmcgaXRzIHN0eWxlIGF0dHJpYnV0ZSBhbmQgc2V0dGluZyB0aGUgZml4ZWQgdG9wIHBvc2l0aW9uLlxuXHRcdCAqIFxuXHRcdCAqIEBwcml2YXRlXG5cdFx0ICovXG5cdFx0dmFyIF9yZXNldFBvc2l0aW9uID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQkdGhpcy5yZW1vdmVBdHRyKCdzdHlsZScpO1xuXHRcdFx0XG5cdFx0XHRpZiAoanNlLmxpYnMudGVtcGxhdGUucmVzcG9uc2l2ZS5icmVha3BvaW50KCkubmFtZSA9PT0gJ21kJ1xuXHRcdFx0XHR8fCBqc2UubGlicy50ZW1wbGF0ZS5yZXNwb25zaXZlLmJyZWFrcG9pbnQoKS5uYW1lID09PSAnbGcnKSB7XG5cdFx0XHRcdCR0aGlzLmNzcygndG9wJywgZml4ZWRUb3BQb3NpdGlvbiArICdweCcpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0JHRoaXMuY3NzKCd0b3AnLCAnJyk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXG4vLyAjIyMjIyMjIyMjIEVWRU5UIEhBTkRMRVIgIyMjIyMjIyMjI1xuXG5cdFx0LyoqXG5cdFx0ICogRXZlbnQgaGFuZGxlciBmb3IgdGhlIHNjcm9sbCBldmVudC4gSXQgZ2V0cyB0aGVcblx0XHQgKiB1cHBlciBib3JkZXIgb2YgdGhlIGNvbnRlbnQgZWxlbWVudCBhbmQgY2FsbHNcblx0XHQgKiBpbmRpdmlkdWFsIG1ldGhvZHMgZGVwZW5kaW5nIG9uIHRoZSBzdGlja3kgc3RhdGUuXG5cdFx0ICogVG8gcGVyZm9ybSBiZXR0ZXIgb24gbG93IGVuZCBDUFVzIGl0IGNoZWNrcyBpZlxuXHRcdCAqIHNjcm9sbCBldmVudHMgc2hhbGwgYmUgc2tpcHBlZC5cblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqL1xuXHRcdHZhciBfY2hlY2tQb3NpdGlvbiA9IGZ1bmN0aW9uKGUsIGQpIHtcblxuXHRcdFx0aWYgKG9wdGlvbnMuY3B1T3B0aW1pemF0aW9uICYmICFkICYmICFfY3B1T3B0aW1pemF0aW9uKCkpIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChqc2UubGlicy50ZW1wbGF0ZS5yZXNwb25zaXZlLmJyZWFrcG9pbnQoKS5pZCA+IG9wdGlvbnMuYnJlYWtwb2ludCkge1xuXHRcdFx0XHRfY2FsY3VsYXRlRGltZW5zaW9ucygpO1xuXHRcdFx0XHR2YXIgc2Nyb2xsUG9zaXRpb24gPSAkd2luZG93LnNjcm9sbFRvcCgpLFxuXHRcdFx0XHRcdGZpdCA9IF9maXRJblZpZXcoKTtcblxuXHRcdFx0XHRpZiAoZml0KSB7XG5cdFx0XHRcdFx0X2NhbGNQb3NpdGlvbihzY3JvbGxQb3NpdGlvbik7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogSGFuZGxlciBmb3IgdGhlIHJlc2l6ZSBldmVudC4gT24gYnJvd3NlclxuXHRcdCAqIHJlc2l6ZSBpdCBpcyByZXNldHRpbmcgdGhlIHN0YXRlIHRvIGNhbGN1bGF0ZVxuXHRcdCAqIGEgbmV3IHBvc2l0aW9uXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKi9cblx0XHR2YXIgX3Jlc2l6ZUhhbmRsZXIgPSBmdW5jdGlvbigpIHtcblx0XHRcdF9yZXNldFBvc2l0aW9uKCk7XG5cdFx0XHRlbGVtZW50T2Zmc2V0ID0gbnVsbDtcblx0XHRcdHNraXBwZWQgPSAwO1xuXHRcdFx0aW5pdGlhbE9mZnNldCA9ICR0aGlzLm9mZnNldCgpLnRvcDtcblxuXHRcdFx0X2NoZWNrUG9zaXRpb24oKTtcblx0XHR9O1xuXG5cbi8vICMjIyMjIyMjIyMgSU5JVElBTElaQVRJT04gIyMjIyMjIyMjI1xuXG5cdFx0LyoqXG5cdFx0ICogSW5pdCBmdW5jdGlvbiBvZiB0aGUgd2lkZ2V0XG5cdFx0ICogQGNvbnN0cnVjdG9yXG5cdFx0ICovXG5cdFx0bW9kdWxlLmluaXQgPSBmdW5jdGlvbihkb25lKSB7XG5cdFx0XHR2YXIgc2xpZGVySGVpZ2h0ID0gMCwgXG5cdFx0XHRcdGVycm9yQm94SGVpZ2h0ID0gMCxcblx0XHRcdFx0bWFyZ2luVG9wID0gMCxcblx0XHRcdFx0bWFyZ2luQm90dG9tID0gMDtcblx0XHRcdFxuXHRcdFx0JG91dGVyV3JhcHBlciA9ICQob3B0aW9ucy5vdXRlcldyYXBwZXIpO1xuXHRcdFx0JGhlYWRlciA9ICQob3B0aW9ucy5oZWFkZXIpO1xuXHRcdFx0JGZvb3RlciA9ICQob3B0aW9ucy5mb290ZXIpO1xuXHRcdFx0XG5cdFx0XHRpZiAoJChvcHRpb25zLnN0YWdlKS5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdHNsaWRlckhlaWdodCA9ICQob3B0aW9ucy5zdGFnZSkub3V0ZXJIZWlnaHQoKTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0JChvcHRpb25zLmVycm9yQm94KS5lYWNoKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRtYXJnaW5Ub3AgICAgPSBwYXJzZUludCgkKHRoaXMpLmNzcygnbWFyZ2luLXRvcCcpLCAxMCk7XG5cdFx0XHRcdG1hcmdpbkJvdHRvbSA9IHBhcnNlSW50KCQodGhpcykuY3NzKCdtYXJnaW4tYm90dG9tJyksIDEwKTtcblx0XHRcdFx0XG5cdFx0XHRcdGVycm9yQm94SGVpZ2h0ICs9ICQodGhpcykub3V0ZXJIZWlnaHQoKTtcblx0XHRcdFx0ZXJyb3JCb3hIZWlnaHQgKz0gbWFyZ2luVG9wO1xuXHRcdFx0XHRlcnJvckJveEhlaWdodCArPSBtYXJnaW5Cb3R0b207XG5cdFx0XHR9KTtcblx0XHRcdFxuXHRcdFx0dmFyIGVycm9yQm94RWxlbWVudHMgPSAkKG9wdGlvbnMuZXJyb3JCb3gpLmxlbmd0aDtcblx0XHRcdFxuXHRcdFx0aWYgKGVycm9yQm94RWxlbWVudHMgPj0gMikge1xuXHRcdFx0XHRlcnJvckJveEhlaWdodCA9IGVycm9yQm94SGVpZ2h0IC0gKG1hcmdpblRvcCAqIChlcnJvckJveEVsZW1lbnRzIC0gMSkpO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHRfZml4SW5pdGlhbFRvcFBvc2l0aW9uKCk7XG5cdFx0XHRcblx0XHRcdGluaXRpYWxPZmZzZXQgPSAkdGhpcy5vZmZzZXQoKS50b3A7XG5cdFx0XHRpbml0aWFsVG9wID0gcGFyc2VGbG9hdCgkdGhpcy5jc3MoJ3RvcCcpKTtcblx0XHRcdGluaXRpYWxIZWFkZXIgPSAkaGVhZGVyLm91dGVySGVpZ2h0KCkgKyBvcHRpb25zLm1hcmdpblRvcCArIHNsaWRlckhlaWdodCArIGVycm9yQm94SGVpZ2h0O1xuXHRcdFx0aW5pdGlhbE1hcmdpblRvcCA9IHBhcnNlRmxvYXQoJG91dGVyV3JhcHBlci5jc3MoJ21hcmdpbi10b3AnKS5yZXBsYWNlKC9bXlxcZF0vLCAnJykpO1xuXHRcdFx0aGVhZGVyRml4ZWQgPSAkaGVhZGVyLmNzcygncG9zaXRpb24nKSA9PT0gJ2ZpeGVkJztcblx0XHRcdFxuXHRcdFx0aWYgKCFqc2UuY29yZS5jb25maWcuZ2V0KCdtb2JpbGUnKSkge1xuXHRcdFx0XHRfY2hlY2tQb3NpdGlvbigpO1xuXHRcdFx0XHRcblx0XHRcdFx0JHdpbmRvd1xuXHRcdFx0XHRcdC5vbigncmVzaXplJywgX3Jlc2l6ZUhhbmRsZXIpXG5cdFx0XHRcdFx0Lm9uKCdzY3JvbGwuc3RpY2t5Ym94JywgX2NoZWNrUG9zaXRpb24pXG5cdFx0XHRcdFx0Lm9uKGpzZS5saWJzLnRlbXBsYXRlLmV2ZW50cy5SRVBPU0lUSU9OU19TVElDS1lCT1goKSwgX3Jlc2l6ZUhhbmRsZXIpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0JCgnYm9keScpLm9uKGpzZS5saWJzLnRlbXBsYXRlLmV2ZW50cy5CUkVBS1BPSU5UKCksIF9maXhJbml0aWFsVG9wUG9zaXRpb24pO1xuXHRcdFx0fVxuXG5cdFx0XHRkb25lKCk7XG5cdFx0fTtcblxuXHRcdC8vIFJldHVybiBkYXRhIHRvIHdpZGdldCBlbmdpbmVcblx0XHRyZXR1cm4gbW9kdWxlO1xuXHR9KTtcbiJdfQ==

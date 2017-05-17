'use strict';

/* --------------------------------------------------------------
 product_min_height_fix.js 2016-05-23
 Gambio GmbH
 http://www.gambio.de
 Copyright (c) 2016 Gambio GmbH
 Released under the GNU General Public License (Version 2)
 [http://www.gnu.org/licenses/gpl-2.0.html]
 --------------------------------------------------------------
 */

/**
 * Widget that fixes min height of product info content element
 */
gambio.widgets.module('product_min_height_fix', [gambio.source + '/libs/events'], function (data) {

	'use strict';

	// ########## VARIABLE INITIALIZATION ##########

	var $this = $(this),
	    $window = $(window),
	    defaults = {
		productInfoContent: '.product-info-content' // Selector to apply min height to
	},
	    options = $.extend(true, {}, defaults, data),
	    module = {};

	// ########## HELPER FUNCTIONS ##########		

	/**
  * Fix for problem that box overlaps content like cross selling products if product content is too short
  *
  * @private
  */
	var _setProductInfoContentMinHeight = function _setProductInfoContentMinHeight() {
		$(options.productInfoContent).css('min-height', $this.outerHeight() + parseFloat($this.css('top')) + 'px');
	};

	// ########## INITIALIZATION ##########

	/**
  * Init function of the widget
  * @constructor
  */
	module.init = function (done) {
		_setProductInfoContentMinHeight();

		$window.on(jse.libs.template.events.STICKYBOX_CONTENT_CHANGE(), _setProductInfoContentMinHeight);

		done();
	};

	// Return data to widget engine
	return module;
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndpZGdldHMvcHJvZHVjdF9taW5faGVpZ2h0X2ZpeC5qcyJdLCJuYW1lcyI6WyJnYW1iaW8iLCJ3aWRnZXRzIiwibW9kdWxlIiwic291cmNlIiwiZGF0YSIsIiR0aGlzIiwiJCIsIiR3aW5kb3ciLCJ3aW5kb3ciLCJkZWZhdWx0cyIsInByb2R1Y3RJbmZvQ29udGVudCIsIm9wdGlvbnMiLCJleHRlbmQiLCJfc2V0UHJvZHVjdEluZm9Db250ZW50TWluSGVpZ2h0IiwiY3NzIiwib3V0ZXJIZWlnaHQiLCJwYXJzZUZsb2F0IiwiaW5pdCIsImRvbmUiLCJvbiIsImpzZSIsImxpYnMiLCJ0ZW1wbGF0ZSIsImV2ZW50cyIsIlNUSUNLWUJPWF9DT05URU5UX0NIQU5HRSJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7Ozs7OztBQVVBOzs7QUFHQUEsT0FBT0MsT0FBUCxDQUFlQyxNQUFmLENBQ0Msd0JBREQsRUFHQyxDQUNDRixPQUFPRyxNQUFQLEdBQWdCLGNBRGpCLENBSEQsRUFPQyxVQUFTQyxJQUFULEVBQWU7O0FBRWQ7O0FBRUE7O0FBRUEsS0FBSUMsUUFBUUMsRUFBRSxJQUFGLENBQVo7QUFBQSxLQUNDQyxVQUFVRCxFQUFFRSxNQUFGLENBRFg7QUFBQSxLQUVDQyxXQUFXO0FBQ1ZDLHNCQUFvQix1QkFEVixDQUNrQztBQURsQyxFQUZaO0FBQUEsS0FLQ0MsVUFBVUwsRUFBRU0sTUFBRixDQUFTLElBQVQsRUFBZSxFQUFmLEVBQW1CSCxRQUFuQixFQUE2QkwsSUFBN0IsQ0FMWDtBQUFBLEtBTUNGLFNBQVMsRUFOVjs7QUFRQTs7QUFFQTs7Ozs7QUFLQSxLQUFJVyxrQ0FBa0MsU0FBbENBLCtCQUFrQyxHQUFXO0FBQ2hEUCxJQUFFSyxRQUFRRCxrQkFBVixFQUE4QkksR0FBOUIsQ0FBa0MsWUFBbEMsRUFBaURULE1BQU1VLFdBQU4sS0FBc0JDLFdBQVdYLE1BQU1TLEdBQU4sQ0FBVSxLQUFWLENBQVgsQ0FBdkIsR0FBdUQsSUFBdkc7QUFDQSxFQUZEOztBQUlBOztBQUVBOzs7O0FBSUFaLFFBQU9lLElBQVAsR0FBYyxVQUFTQyxJQUFULEVBQWU7QUFDNUJMOztBQUVBTixVQUFRWSxFQUFSLENBQVdDLElBQUlDLElBQUosQ0FBU0MsUUFBVCxDQUFrQkMsTUFBbEIsQ0FBeUJDLHdCQUF6QixFQUFYLEVBQWdFWCwrQkFBaEU7O0FBRUFLO0FBQ0EsRUFORDs7QUFRQTtBQUNBLFFBQU9oQixNQUFQO0FBQ0EsQ0FoREYiLCJmaWxlIjoid2lkZ2V0cy9wcm9kdWN0X21pbl9oZWlnaHRfZml4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuIHByb2R1Y3RfbWluX2hlaWdodF9maXguanMgMjAxNi0wNS0yM1xyXG4gR2FtYmlvIEdtYkhcclxuIGh0dHA6Ly93d3cuZ2FtYmlvLmRlXHJcbiBDb3B5cmlnaHQgKGMpIDIwMTYgR2FtYmlvIEdtYkhcclxuIFJlbGVhc2VkIHVuZGVyIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSAoVmVyc2lvbiAyKVxyXG4gW2h0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy9ncGwtMi4wLmh0bWxdXHJcbiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBXaWRnZXQgdGhhdCBmaXhlcyBtaW4gaGVpZ2h0IG9mIHByb2R1Y3QgaW5mbyBjb250ZW50IGVsZW1lbnRcclxuICovXHJcbmdhbWJpby53aWRnZXRzLm1vZHVsZShcclxuXHQncHJvZHVjdF9taW5faGVpZ2h0X2ZpeCcsXHJcblx0XHJcblx0W1xyXG5cdFx0Z2FtYmlvLnNvdXJjZSArICcvbGlicy9ldmVudHMnLFxyXG5cdF0sXHJcblx0XHJcblx0ZnVuY3Rpb24oZGF0YSkge1xyXG5cdFx0XHJcblx0XHQndXNlIHN0cmljdCc7XHJcblx0XHRcclxuXHRcdC8vICMjIyMjIyMjIyMgVkFSSUFCTEUgSU5JVElBTElaQVRJT04gIyMjIyMjIyMjI1xyXG5cdFx0XHJcblx0XHR2YXIgJHRoaXMgPSAkKHRoaXMpLFxyXG5cdFx0XHQkd2luZG93ID0gJCh3aW5kb3cpLFxyXG5cdFx0XHRkZWZhdWx0cyA9IHtcclxuXHRcdFx0XHRwcm9kdWN0SW5mb0NvbnRlbnQ6ICcucHJvZHVjdC1pbmZvLWNvbnRlbnQnIC8vIFNlbGVjdG9yIHRvIGFwcGx5IG1pbiBoZWlnaHQgdG9cclxuXHRcdFx0fSxcclxuXHRcdFx0b3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cywgZGF0YSksXHJcblx0XHRcdG1vZHVsZSA9IHt9O1xyXG5cdFx0XHJcblx0XHQvLyAjIyMjIyMjIyMjIEhFTFBFUiBGVU5DVElPTlMgIyMjIyMjIyMjI1x0XHRcclxuXHRcdFxyXG5cdFx0LyoqXHJcblx0XHQgKiBGaXggZm9yIHByb2JsZW0gdGhhdCBib3ggb3ZlcmxhcHMgY29udGVudCBsaWtlIGNyb3NzIHNlbGxpbmcgcHJvZHVjdHMgaWYgcHJvZHVjdCBjb250ZW50IGlzIHRvbyBzaG9ydFxyXG5cdFx0ICpcclxuXHRcdCAqIEBwcml2YXRlXHJcblx0XHQgKi9cclxuXHRcdHZhciBfc2V0UHJvZHVjdEluZm9Db250ZW50TWluSGVpZ2h0ID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdCQob3B0aW9ucy5wcm9kdWN0SW5mb0NvbnRlbnQpLmNzcygnbWluLWhlaWdodCcsICgkdGhpcy5vdXRlckhlaWdodCgpICsgcGFyc2VGbG9hdCgkdGhpcy5jc3MoJ3RvcCcpKSkgKyAncHgnKTtcclxuXHRcdH07XHJcblx0XHRcclxuXHRcdC8vICMjIyMjIyMjIyMgSU5JVElBTElaQVRJT04gIyMjIyMjIyMjI1xyXG5cdFx0XHJcblx0XHQvKipcclxuXHRcdCAqIEluaXQgZnVuY3Rpb24gb2YgdGhlIHdpZGdldFxyXG5cdFx0ICogQGNvbnN0cnVjdG9yXHJcblx0XHQgKi9cclxuXHRcdG1vZHVsZS5pbml0ID0gZnVuY3Rpb24oZG9uZSkge1xyXG5cdFx0XHRfc2V0UHJvZHVjdEluZm9Db250ZW50TWluSGVpZ2h0KCk7XHJcblx0XHRcdFxyXG5cdFx0XHQkd2luZG93Lm9uKGpzZS5saWJzLnRlbXBsYXRlLmV2ZW50cy5TVElDS1lCT1hfQ09OVEVOVF9DSEFOR0UoKSwgX3NldFByb2R1Y3RJbmZvQ29udGVudE1pbkhlaWdodCk7XHJcblx0XHRcdFxyXG5cdFx0XHRkb25lKCk7XHJcblx0XHR9O1xyXG5cdFx0XHJcblx0XHQvLyBSZXR1cm4gZGF0YSB0byB3aWRnZXQgZW5naW5lXHJcblx0XHRyZXR1cm4gbW9kdWxlO1xyXG5cdH0pO1xyXG4iXX0=

'use strict';

/* --------------------------------------------------------------
 shipping_calculator.js 2016-05-19
 Gambio GmbH
 http://www.gambio.de
 Copyright (c) 2016 Gambio GmbH
 Released under the GNU General Public License (Version 2)
 [http://www.gnu.org/licenses/gpl-2.0.html]
 --------------------------------------------------------------
 */

/**
 * Widget that updates the shipping cost box at the
 * shopping cart page
 */
gambio.widgets.module('shipping_calculator', ['form', 'xhr'], function (data) {

	'use strict';

	// ########## VARIABLE INITIALIZATION ##########

	var $this = $(this),
	    $body = $('body'),
	    defaults = {
		// URL at which the request is send.
		url: 'shop.php?do=CartShippingCosts',
		selectorMapping: {
			gambioUltraCosts: '.cart_shipping_costs_gambio_ultra_dropdown, .order-total-shipping-info-gambioultra-costs',
			shippingWeight: '.shipping-calculator-shipping-weight-unit, .shipping-weight-value',
			shippingCost: '.shipping-calculator-shipping-costs, .order-total-shipping-info, .shipping-cost-value',
			shippingCalculator: '.shipping-calculator-shipping-modules',
			invalidCombinationError: '#cart_shipping_costs_invalid_combination_error'
		}
	},
	    options = $.extend(true, {}, defaults, data),
	    module = {};

	// ########## EVENT HANDLER ##########

	/**
  * Function that requests the given URL and
  * fills the page with the delivered data
  * @private
  */
	var _updateShippingCosts = function _updateShippingCosts() {
		var formdata = jse.libs.form.getData($this);

		jse.libs.xhr.ajax({ url: options.url, data: formdata }).done(function (result) {
			jse.libs.template.helpers.fill(result.content, $body, options.selectorMapping);
		});

		// update modal content source
		var value = $this.find('select[name="cart_shipping_country"]').val();
		$('#shipping-information-layer.hidden select[name="cart_shipping_country"] option').attr('selected', false);
		$('#shipping-information-layer.hidden select[name="cart_shipping_country"] option[value="' + value + '"]').attr('selected', true);
	};

	// ########## INITIALIZATION ##########

	/**
  * Init function of the widget
  * @constructor
  */
	module.init = function (done) {

		$this.on('change update', _updateShippingCosts);

		done();
	};

	// Return data to widget engine
	return module;
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndpZGdldHMvc2hpcHBpbmdfY2FsY3VsYXRvci5qcyJdLCJuYW1lcyI6WyJnYW1iaW8iLCJ3aWRnZXRzIiwibW9kdWxlIiwiZGF0YSIsIiR0aGlzIiwiJCIsIiRib2R5IiwiZGVmYXVsdHMiLCJ1cmwiLCJzZWxlY3Rvck1hcHBpbmciLCJnYW1iaW9VbHRyYUNvc3RzIiwic2hpcHBpbmdXZWlnaHQiLCJzaGlwcGluZ0Nvc3QiLCJzaGlwcGluZ0NhbGN1bGF0b3IiLCJpbnZhbGlkQ29tYmluYXRpb25FcnJvciIsIm9wdGlvbnMiLCJleHRlbmQiLCJfdXBkYXRlU2hpcHBpbmdDb3N0cyIsImZvcm1kYXRhIiwianNlIiwibGlicyIsImZvcm0iLCJnZXREYXRhIiwieGhyIiwiYWpheCIsImRvbmUiLCJyZXN1bHQiLCJ0ZW1wbGF0ZSIsImhlbHBlcnMiLCJmaWxsIiwiY29udGVudCIsInZhbHVlIiwiZmluZCIsInZhbCIsImF0dHIiLCJpbml0Iiwib24iXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7Ozs7QUFVQTs7OztBQUlBQSxPQUFPQyxPQUFQLENBQWVDLE1BQWYsQ0FDQyxxQkFERCxFQUdDLENBQUMsTUFBRCxFQUFTLEtBQVQsQ0FIRCxFQUtDLFVBQVNDLElBQVQsRUFBZTs7QUFFZDs7QUFFRjs7QUFFRSxLQUFJQyxRQUFRQyxFQUFFLElBQUYsQ0FBWjtBQUFBLEtBQ0NDLFFBQVFELEVBQUUsTUFBRixDQURUO0FBQUEsS0FFQ0UsV0FBVztBQUNWO0FBQ0FDLE9BQUssK0JBRks7QUFHVkMsbUJBQWlCO0FBQ2hCQyxxQkFBa0IsMEZBREY7QUFFaEJDLG1CQUFnQixtRUFGQTtBQUdoQkMsaUJBQWMsdUZBSEU7QUFJaEJDLHVCQUFvQix1Q0FKSjtBQUtoQkMsNEJBQXlCO0FBTFQ7QUFIUCxFQUZaO0FBQUEsS0FhQ0MsVUFBVVYsRUFBRVcsTUFBRixDQUFTLElBQVQsRUFBZSxFQUFmLEVBQW1CVCxRQUFuQixFQUE2QkosSUFBN0IsQ0FiWDtBQUFBLEtBY0NELFNBQVMsRUFkVjs7QUFpQkY7O0FBRUU7Ozs7O0FBS0EsS0FBSWUsdUJBQXVCLFNBQXZCQSxvQkFBdUIsR0FBVztBQUNyQyxNQUFJQyxXQUFXQyxJQUFJQyxJQUFKLENBQVNDLElBQVQsQ0FBY0MsT0FBZCxDQUFzQmxCLEtBQXRCLENBQWY7O0FBRUFlLE1BQUlDLElBQUosQ0FBU0csR0FBVCxDQUFhQyxJQUFiLENBQWtCLEVBQUNoQixLQUFLTyxRQUFRUCxHQUFkLEVBQW1CTCxNQUFNZSxRQUF6QixFQUFsQixFQUFzRE8sSUFBdEQsQ0FBMkQsVUFBU0MsTUFBVCxFQUFpQjtBQUMzRVAsT0FBSUMsSUFBSixDQUFTTyxRQUFULENBQWtCQyxPQUFsQixDQUEwQkMsSUFBMUIsQ0FBK0JILE9BQU9JLE9BQXRDLEVBQStDeEIsS0FBL0MsRUFBc0RTLFFBQVFOLGVBQTlEO0FBQ0EsR0FGRDs7QUFJQTtBQUNBLE1BQUlzQixRQUFRM0IsTUFBTTRCLElBQU4sQ0FBVyxzQ0FBWCxFQUFtREMsR0FBbkQsRUFBWjtBQUNBNUIsSUFBRSxnRkFBRixFQUFvRjZCLElBQXBGLENBQXlGLFVBQXpGLEVBQW9HLEtBQXBHO0FBQ0E3QixJQUFFLDJGQUEyRjBCLEtBQTNGLEdBQW1HLElBQXJHLEVBQ0VHLElBREYsQ0FDTyxVQURQLEVBQ2tCLElBRGxCO0FBRUEsRUFaRDs7QUFlRjs7QUFFRTs7OztBQUlBaEMsUUFBT2lDLElBQVAsR0FBYyxVQUFTVixJQUFULEVBQWU7O0FBRTVCckIsUUFBTWdDLEVBQU4sQ0FBUyxlQUFULEVBQTBCbkIsb0JBQTFCOztBQUVBUTtBQUVBLEVBTkQ7O0FBUUE7QUFDQSxRQUFPdkIsTUFBUDtBQUNBLENBbEVGIiwiZmlsZSI6IndpZGdldHMvc2hpcHBpbmdfY2FsY3VsYXRvci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gc2hpcHBpbmdfY2FsY3VsYXRvci5qcyAyMDE2LTA1LTE5XG4gR2FtYmlvIEdtYkhcbiBodHRwOi8vd3d3LmdhbWJpby5kZVxuIENvcHlyaWdodCAoYykgMjAxNiBHYW1iaW8gR21iSFxuIFJlbGVhc2VkIHVuZGVyIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSAoVmVyc2lvbiAyKVxuIFtodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvZ3BsLTIuMC5odG1sXVxuIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKi9cblxuLyoqXG4gKiBXaWRnZXQgdGhhdCB1cGRhdGVzIHRoZSBzaGlwcGluZyBjb3N0IGJveCBhdCB0aGVcbiAqIHNob3BwaW5nIGNhcnQgcGFnZVxuICovXG5nYW1iaW8ud2lkZ2V0cy5tb2R1bGUoXG5cdCdzaGlwcGluZ19jYWxjdWxhdG9yJyxcblxuXHRbJ2Zvcm0nLCAneGhyJ10sXG5cblx0ZnVuY3Rpb24oZGF0YSkge1xuXG5cdFx0J3VzZSBzdHJpY3QnO1xuXG4vLyAjIyMjIyMjIyMjIFZBUklBQkxFIElOSVRJQUxJWkFUSU9OICMjIyMjIyMjIyNcblxuXHRcdHZhciAkdGhpcyA9ICQodGhpcyksXG5cdFx0XHQkYm9keSA9ICQoJ2JvZHknKSxcblx0XHRcdGRlZmF1bHRzID0ge1xuXHRcdFx0XHQvLyBVUkwgYXQgd2hpY2ggdGhlIHJlcXVlc3QgaXMgc2VuZC5cblx0XHRcdFx0dXJsOiAnc2hvcC5waHA/ZG89Q2FydFNoaXBwaW5nQ29zdHMnLFxuXHRcdFx0XHRzZWxlY3Rvck1hcHBpbmc6IHtcblx0XHRcdFx0XHRnYW1iaW9VbHRyYUNvc3RzOiAnLmNhcnRfc2hpcHBpbmdfY29zdHNfZ2FtYmlvX3VsdHJhX2Ryb3Bkb3duLCAub3JkZXItdG90YWwtc2hpcHBpbmctaW5mby1nYW1iaW91bHRyYS1jb3N0cycsXG5cdFx0XHRcdFx0c2hpcHBpbmdXZWlnaHQ6ICcuc2hpcHBpbmctY2FsY3VsYXRvci1zaGlwcGluZy13ZWlnaHQtdW5pdCwgLnNoaXBwaW5nLXdlaWdodC12YWx1ZScsXG5cdFx0XHRcdFx0c2hpcHBpbmdDb3N0OiAnLnNoaXBwaW5nLWNhbGN1bGF0b3Itc2hpcHBpbmctY29zdHMsIC5vcmRlci10b3RhbC1zaGlwcGluZy1pbmZvLCAuc2hpcHBpbmctY29zdC12YWx1ZScsXG5cdFx0XHRcdFx0c2hpcHBpbmdDYWxjdWxhdG9yOiAnLnNoaXBwaW5nLWNhbGN1bGF0b3Itc2hpcHBpbmctbW9kdWxlcycsIFxuXHRcdFx0XHRcdGludmFsaWRDb21iaW5hdGlvbkVycm9yOiAnI2NhcnRfc2hpcHBpbmdfY29zdHNfaW52YWxpZF9jb21iaW5hdGlvbl9lcnJvcidcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdG9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMsIGRhdGEpLFxuXHRcdFx0bW9kdWxlID0ge307XG5cblxuLy8gIyMjIyMjIyMjIyBFVkVOVCBIQU5ETEVSICMjIyMjIyMjIyNcblxuXHRcdC8qKlxuXHRcdCAqIEZ1bmN0aW9uIHRoYXQgcmVxdWVzdHMgdGhlIGdpdmVuIFVSTCBhbmRcblx0XHQgKiBmaWxscyB0aGUgcGFnZSB3aXRoIHRoZSBkZWxpdmVyZWQgZGF0YVxuXHRcdCAqIEBwcml2YXRlXG5cdFx0ICovXG5cdFx0dmFyIF91cGRhdGVTaGlwcGluZ0Nvc3RzID0gZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgZm9ybWRhdGEgPSBqc2UubGlicy5mb3JtLmdldERhdGEoJHRoaXMpO1xuXG5cdFx0XHRqc2UubGlicy54aHIuYWpheCh7dXJsOiBvcHRpb25zLnVybCwgZGF0YTogZm9ybWRhdGF9KS5kb25lKGZ1bmN0aW9uKHJlc3VsdCkge1xuXHRcdFx0XHRqc2UubGlicy50ZW1wbGF0ZS5oZWxwZXJzLmZpbGwocmVzdWx0LmNvbnRlbnQsICRib2R5LCBvcHRpb25zLnNlbGVjdG9yTWFwcGluZyk7XG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gdXBkYXRlIG1vZGFsIGNvbnRlbnQgc291cmNlXG5cdFx0XHR2YXIgdmFsdWUgPSAkdGhpcy5maW5kKCdzZWxlY3RbbmFtZT1cImNhcnRfc2hpcHBpbmdfY291bnRyeVwiXScpLnZhbCgpO1xuXHRcdFx0JCgnI3NoaXBwaW5nLWluZm9ybWF0aW9uLWxheWVyLmhpZGRlbiBzZWxlY3RbbmFtZT1cImNhcnRfc2hpcHBpbmdfY291bnRyeVwiXSBvcHRpb24nKS5hdHRyKCdzZWxlY3RlZCcsZmFsc2UpO1xuXHRcdFx0JCgnI3NoaXBwaW5nLWluZm9ybWF0aW9uLWxheWVyLmhpZGRlbiBzZWxlY3RbbmFtZT1cImNhcnRfc2hpcHBpbmdfY291bnRyeVwiXSBvcHRpb25bdmFsdWU9XCInICsgdmFsdWUgKyAnXCJdJylcblx0XHRcdFx0LmF0dHIoJ3NlbGVjdGVkJyx0cnVlKTtcblx0XHR9O1xuXG5cbi8vICMjIyMjIyMjIyMgSU5JVElBTElaQVRJT04gIyMjIyMjIyMjI1xuXG5cdFx0LyoqXG5cdFx0ICogSW5pdCBmdW5jdGlvbiBvZiB0aGUgd2lkZ2V0XG5cdFx0ICogQGNvbnN0cnVjdG9yXG5cdFx0ICovXG5cdFx0bW9kdWxlLmluaXQgPSBmdW5jdGlvbihkb25lKSB7XG5cblx0XHRcdCR0aGlzLm9uKCdjaGFuZ2UgdXBkYXRlJywgX3VwZGF0ZVNoaXBwaW5nQ29zdHMpO1xuXG5cdFx0XHRkb25lKCk7XG5cblx0XHR9O1xuXG5cdFx0Ly8gUmV0dXJuIGRhdGEgdG8gd2lkZ2V0IGVuZ2luZVxuXHRcdHJldHVybiBtb2R1bGU7XG5cdH0pOyJdfQ==

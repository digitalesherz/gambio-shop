'use strict';

/* --------------------------------------------------------------
 cart_handler.js 2016-06-22
 Gambio GmbH
 http://www.gambio.de
 Copyright (c) 2016 Gambio GmbH
 Released under the GNU General Public License (Version 2)
 [http://www.gnu.org/licenses/gpl-2.0.html]
 --------------------------------------------------------------
 */

/**
 * Component for handling the add to cart and wishlist features
 * at the product details and the category listing pages. It cares
 * for attributes, properties, quantity and all other
 * relevant data for adding an item to the basket or wishlist
 */
gambio.widgets.module('cart_handler', ['form', 'xhr', gambio.source + '/libs/events', gambio.source + '/libs/modal.ext-magnific', gambio.source + '/libs/modal'], function (data) {

	'use strict';

	// ########## VARIABLE INITIALIZATION ##########

	var $this = $(this),
	    $body = $('body'),
	    $window = $(window),
	    busy = false,
	    ajax = null,
	    timeout = 0,
	    defaults = {
		// AJAX "add to cart" URL
		addCartUrl: 'shop.php?do=Cart/BuyProduct',
		// AJAX "add to cart" URL for customizer products
		addCartCustomizerUrl: 'shop.php?do=Cart/Add',
		// AJAX URL to perform a value check
		checkUrl: 'shop.php?do=CheckStatus',
		// AJAX URL to perform the add to wishlist
		wishlistUrl: 'shop.php?do=WishList/Add',
		// Submit URL for price offer button
		priceOfferUrl: 'gm_price_offer.php',
		// Submit method for price offer
		priceOfferMethod: 'get',
		// Selector for the cart dropdown
		dropdown: '#head_shopping_cart',
		// "Add to cart" buttons selectors
		cartButtons: '.js-btn-add-to-cart',
		// "Wishlist" buttons selectors
		wishlistButtons: '.btn-wishlist',
		// "Price offer" buttons selectors
		priceOfferButtons: '.btn-price-offer',
		// Selector for the attribute fields
		attributes: '.js-calculate',
		// Selector for the quantity
		quantity: '.js-calculate-qty',
		// URL where to get the template for the dropdown
		tpl: null,
		// Show attribute images in product images swiper (if possible)
		// -- this feature is not supported yet --
		attributImagesSwiper: false,
		// Trigger the attribute images to this selectors
		triggerAttrImagesTo: '#product_image_swiper, #product_thumbnail_swiper, ' + '#product_thumbnail_swiper_mobile',
		// Class that gets added to the button on processing
		processingClass: 'loading',
		// Duration for that the success or fail class gets added to the button
		processingDuration: 2000,
		// AJAX response content selectors
		selectorMapping: {
			attributeImages: '.attribute-images',
			buttons: '.shopping-cart-button',
			giftContent: '.gift-cart-content-wrapper',
			giftLayer: '.gift-cart-layer',
			shareContent: '.share-cart-content-wrapper',
			shareLayer: '.share-cart-layer',
			hiddenOptions: '#cart_quantity .hidden-options',
			message: '.global-error-messages',
			messageCart: '.cart-error-msg',
			messageHelp: '.help-block',
			modelNumber: '.model-number',
			price: '.current-price-container',
			propertiesForm: '.properties-selection-form',
			quantity: '.products-quantity-value',
			ribbonSpecial: '.ribbon-special',
			shippingInformation: '#shipping-information-layer',
			shippingTime: '.products-shipping-time-value',
			shippingTimeImage: '.img-shipping-time img',
			totals: '#cart_quantity .total-box',
			weight: '.products-details-weight-container span'
		}
	},
	    options = $.extend(true, {}, defaults, data),
	    module = {};

	// ########## HELPER FUNCTIONS ##########

	/**
  * Helper function that updates the button
  * state with an error or success class for
  * a specified duration
  * @param   {object}        $target         jQuery selection of the target button
  * @param   {string}        state           The state string that gets added to the loading class
  * @private
  */
	var _addButtonState = function _addButtonState($target, state) {
		var timer = setTimeout(function () {
			$target.removeClass(options.processingClass + ' ' + options.processingClass + state);
		}, options.processingDuration);

		$target.data('timer', timer).addClass(options.processingClass + state);
	};

	/**
  * Helper function to set the messages and the
  * button state.
  * @param       {object}    data                Result form the ajax request
  * @param       {object}    $form               jQuery selecion of the form
  * @param       {boolean}   disableButtons      If true, the button state gets set to (in)active
  * @param       {boolean}   showNoCombiMesssage If true, the error message for missing property combination selection will be displayed
  * @private
  */
	var _stateManager = function _stateManager(data, $form, disableButtons, showNoCombiSelectedMesssage) {

		// Remove the attribute images from the common content
		// so that it doesn't get rendered anymore. Then trigger
		// an event to the given selectors and deliver the
		// attrImages object
		if (options.attributImagesSwiper && data.attrImages && data.attrImages.length) {
			delete data.content.images;
			$(options.triggerAttrImagesTo).trigger(jse.libs.template.events.SLIDES_UPDATE(), { attributes: data.attrImages });
		}

		// Set the messages given inside the data.content object
		$.each(data.content, function (i, v) {
			var $element = $form.parent().find(options.selectorMapping[v.selector]);

			if ((!showNoCombiSelectedMesssage || v.value === '') && i === 'messageNoCombiSelected') {
				return true;
			}

			switch (v.type) {
				case 'html':
					$element.html(v.value);
					break;
				case 'attribute':
					$element.attr(v.key, v.value);
					break;
				case 'replace':
					if (v.value) {
						$element.replaceWith(v.value);
					} else {
						$element.addClass('hidden').empty();
					}
					break;
				default:
					$element.text(v.value);
					break;
			}
		});

		// Dis- / Enable the buttons
		if (disableButtons) {
			var $buttons = $form.find(options.cartButtons);
			if (data.success) {
				$buttons.removeClass('inactive');
			} else {
				$buttons.addClass('inactive');
			}
		}

		if (data.content.message) {
			var $errorField = $form.find(options.selectorMapping[data.content.message.selector]);
			if (data.content.message.value) {
				$errorField.removeClass('hidden').show();
			} else {
				$errorField.addClass('hidden').hide();

				if (showNoCombiSelectedMesssage && data.content.messageNoCombiSelected !== undefined && data.content.messageNoCombiSelected) {
					if (data.content.messageNoCombiSelected.value) {
						$errorField.removeClass('hidden').show();
					} else {
						$errorField.addClass('hidden').hide();
					}
				}
			}
		}

		$window.trigger(jse.libs.template.events.STICKYBOX_CONTENT_CHANGE());
	};

	/**
  * Helper function to send the ajax
  * On success redirect to a given url, open a layer with
  * a message or add the item to the cart-dropdown directly
  * (by triggering an event to the body)
  * @param       {object}      data      Form data
  * @param       {object}      $form     The form to fill
  * @param       {string}      url       The URL for the AJAX request
  * @private
  */
	var _addToSomewhere = function _addToSomewhere(data, $form, url, $button) {

		if (!busy) {
			// only execute the ajax
			// if there is no pending ajax call
			busy = true;

			jse.libs.xhr.post({ url: url, data: data }, true).done(function (result) {
				try {
					// Fill the page with the result from the ajax
					_stateManager(result, $form, false);

					// If the AJAX was successful execute
					// a custom functionality
					if (result.success) {
						switch (result.type) {
							case 'url':
								if (result.url.substr(0, 4) !== 'http') {
									location.href = jse.core.config.get('appUrl') + '/' + result.url;
								} else {
									location.href = result.url;
								}

								break;
							case 'dropdown':
								$body.trigger(jse.libs.template.events.CART_UPDATE(), [true]);
								break;
							case 'layer':
								jse.libs.template.modal.info({ title: result.title, content: result.msg });
								break;
							default:
								break;
						}
					}
				} catch (ignore) {}
				_addButtonState($button, '-success');
			}).fail(function () {
				_addButtonState($button, '-fail');
			}).always(function () {
				// Reset the busy flag to be able to perform
				// further AJAX requests
				busy = false;
			});
		}
	};

	// ########## EVENT HANDLER ##########

	/**
  * Handler for the submit form / click
  * on "add to cart" & "wishlist" button.
  * It performs a check on the availability
  * of the combination and quantity. If
  * successful it performs the add to cart
  * or wishlist action, if it's not a
  * "check" call
  * @param       {object}    e      jQuery event object
  * @private
  */
	var _submitHandler = function _submitHandler(e) {
		if (e) {
			e.preventDefault();
		}

		var $self = $(this),
		    $form = $self.is('form') ? $self : $self.closest('form'),
		    customizer = $form.hasClass('customizer'),
		    properties = !!$form.find('.properties-selection-form').length,
		    module = properties ? '' : '/Attributes',
		    showNoCombiSelectedMesssage = e && e.data && e.data.target && e.data.target !== 'check';

		if ($form.length) {

			// Show properties overlay
			// to disable user interaction
			// before markup replace
			if (properties) {
				$this.addClass('loading');
			}

			var formdata = jse.libs.form.getData($form, null, true);
			formdata.target = e && e.data && e.data.target ? e.data.target : 'check';

			// Abort previous check ajax if
			// there is one in progress
			if (ajax && e) {
				ajax.abort();
			}

			// Add processing-class to the button
			// and remove old timed events
			if (formdata.target !== 'check') {
				var timer = $self.data('timer');
				if (timer) {
					clearTimeout(timer);
				}

				$self.removeClass(options.processingClass + '-success ' + options.processingClass + '-fail').addClass(options.processingClass);
			}

			ajax = jse.libs.xhr.get({
				url: options.checkUrl + module,
				data: formdata
			}, true).done(function (result) {
				_stateManager(result, $form, true, showNoCombiSelectedMesssage);
				$this.removeClass('loading');

				if (result.success) {
					var event = null,
					    url = null;

					switch (formdata.target) {
						case 'wishlist':
							if (customizer) {
								event = jse.libs.template.events.ADD_CUSTOMIZER_WISHLIST();
							}
							url = options.wishlistUrl;
							break;
						case 'cart':
							if (customizer) {
								event = jse.libs.template.events.ADD_CUSTOMIZER_CART();
								url = options.addCartCustomizerUrl;
							} else {
								url = options.addCartUrl;
							}
							break;
						case 'price_offer':
							$form.attr('action', options.priceOfferUrl).attr('method', options.priceOfferMethod);
							$form.off('submit');
							$form.submit();

							return;
						default:
							setTimeout(function () {
								$window.trigger(jse.libs.template.events.STICKYBOX_CONTENT_CHANGE());
							}, 250);
							break;
					}

					if (event) {
						var deferred = $.Deferred();
						deferred.done(function (customizerRandom) {
							formdata[customizerRandom] = 0;
							_addToSomewhere(formdata, $form, url, $self);
						}).fail(function () {
							_addButtonState($self, '-fail');
						});
						$body.trigger(event, [{ 'deferred': deferred, 'dataset': formdata }]);
					} else if (url) {
						_addToSomewhere(formdata, $form, url, $self);
					}
				}
			}).fail(function () {
				_addButtonState($self, '-fail');
			});
		}
	};

	/**
  * Keyup handler for quantity input field
  * 
  * @param e
  * @private
  */
	var _keyupHandler = function _keyupHandler(e) {
		clearTimeout(timeout);

		timeout = setTimeout(function () {
			_submitHandler.call(this, e);
		}.bind(this), 300);
	};

	// ########## INITIALIZATION ##########

	/**
  * Init function of the widget
  * @constructor
  */
	module.init = function (done) {

		var $forms = $this.find('form');

		$forms.on('submit', { 'target': 'cart' }, _submitHandler).on('click', options.cartButtons + ':not(.inactive)', { 'target': 'cart' }, _submitHandler).on('click', options.wishlistButtons, { 'target': 'wishlist' }, _submitHandler).on('click', options.priceOfferButtons, { 'target': 'price_offer' }, _submitHandler).on('change', options.attributes, { 'target': 'check' }, _submitHandler).on('blur', options.quantity, { 'target': 'check' }, _submitHandler).on('keyup', options.quantity, { 'target': 'check' }, _keyupHandler);

		// Fallback if the backend renders incorrect data
		// on initial page call
		$forms.not('.no-status-check').each(function () {
			_submitHandler.call($(this));
		});

		done();
	};

	// Return data to widget engine
	return module;
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndpZGdldHMvY2FydF9oYW5kbGVyLmpzIl0sIm5hbWVzIjpbImdhbWJpbyIsIndpZGdldHMiLCJtb2R1bGUiLCJzb3VyY2UiLCJkYXRhIiwiJHRoaXMiLCIkIiwiJGJvZHkiLCIkd2luZG93Iiwid2luZG93IiwiYnVzeSIsImFqYXgiLCJ0aW1lb3V0IiwiZGVmYXVsdHMiLCJhZGRDYXJ0VXJsIiwiYWRkQ2FydEN1c3RvbWl6ZXJVcmwiLCJjaGVja1VybCIsIndpc2hsaXN0VXJsIiwicHJpY2VPZmZlclVybCIsInByaWNlT2ZmZXJNZXRob2QiLCJkcm9wZG93biIsImNhcnRCdXR0b25zIiwid2lzaGxpc3RCdXR0b25zIiwicHJpY2VPZmZlckJ1dHRvbnMiLCJhdHRyaWJ1dGVzIiwicXVhbnRpdHkiLCJ0cGwiLCJhdHRyaWJ1dEltYWdlc1N3aXBlciIsInRyaWdnZXJBdHRySW1hZ2VzVG8iLCJwcm9jZXNzaW5nQ2xhc3MiLCJwcm9jZXNzaW5nRHVyYXRpb24iLCJzZWxlY3Rvck1hcHBpbmciLCJhdHRyaWJ1dGVJbWFnZXMiLCJidXR0b25zIiwiZ2lmdENvbnRlbnQiLCJnaWZ0TGF5ZXIiLCJzaGFyZUNvbnRlbnQiLCJzaGFyZUxheWVyIiwiaGlkZGVuT3B0aW9ucyIsIm1lc3NhZ2UiLCJtZXNzYWdlQ2FydCIsIm1lc3NhZ2VIZWxwIiwibW9kZWxOdW1iZXIiLCJwcmljZSIsInByb3BlcnRpZXNGb3JtIiwicmliYm9uU3BlY2lhbCIsInNoaXBwaW5nSW5mb3JtYXRpb24iLCJzaGlwcGluZ1RpbWUiLCJzaGlwcGluZ1RpbWVJbWFnZSIsInRvdGFscyIsIndlaWdodCIsIm9wdGlvbnMiLCJleHRlbmQiLCJfYWRkQnV0dG9uU3RhdGUiLCIkdGFyZ2V0Iiwic3RhdGUiLCJ0aW1lciIsInNldFRpbWVvdXQiLCJyZW1vdmVDbGFzcyIsImFkZENsYXNzIiwiX3N0YXRlTWFuYWdlciIsIiRmb3JtIiwiZGlzYWJsZUJ1dHRvbnMiLCJzaG93Tm9Db21iaVNlbGVjdGVkTWVzc3NhZ2UiLCJhdHRySW1hZ2VzIiwibGVuZ3RoIiwiY29udGVudCIsImltYWdlcyIsInRyaWdnZXIiLCJqc2UiLCJsaWJzIiwidGVtcGxhdGUiLCJldmVudHMiLCJTTElERVNfVVBEQVRFIiwiZWFjaCIsImkiLCJ2IiwiJGVsZW1lbnQiLCJwYXJlbnQiLCJmaW5kIiwic2VsZWN0b3IiLCJ2YWx1ZSIsInR5cGUiLCJodG1sIiwiYXR0ciIsImtleSIsInJlcGxhY2VXaXRoIiwiZW1wdHkiLCJ0ZXh0IiwiJGJ1dHRvbnMiLCJzdWNjZXNzIiwiJGVycm9yRmllbGQiLCJzaG93IiwiaGlkZSIsIm1lc3NhZ2VOb0NvbWJpU2VsZWN0ZWQiLCJ1bmRlZmluZWQiLCJTVElDS1lCT1hfQ09OVEVOVF9DSEFOR0UiLCJfYWRkVG9Tb21ld2hlcmUiLCJ1cmwiLCIkYnV0dG9uIiwieGhyIiwicG9zdCIsImRvbmUiLCJyZXN1bHQiLCJzdWJzdHIiLCJsb2NhdGlvbiIsImhyZWYiLCJjb3JlIiwiY29uZmlnIiwiZ2V0IiwiQ0FSVF9VUERBVEUiLCJtb2RhbCIsImluZm8iLCJ0aXRsZSIsIm1zZyIsImlnbm9yZSIsImZhaWwiLCJhbHdheXMiLCJfc3VibWl0SGFuZGxlciIsImUiLCJwcmV2ZW50RGVmYXVsdCIsIiRzZWxmIiwiaXMiLCJjbG9zZXN0IiwiY3VzdG9taXplciIsImhhc0NsYXNzIiwicHJvcGVydGllcyIsInRhcmdldCIsImZvcm1kYXRhIiwiZm9ybSIsImdldERhdGEiLCJhYm9ydCIsImNsZWFyVGltZW91dCIsImV2ZW50IiwiQUREX0NVU1RPTUlaRVJfV0lTSExJU1QiLCJBRERfQ1VTVE9NSVpFUl9DQVJUIiwib2ZmIiwic3VibWl0IiwiZGVmZXJyZWQiLCJEZWZlcnJlZCIsImN1c3RvbWl6ZXJSYW5kb20iLCJfa2V5dXBIYW5kbGVyIiwiY2FsbCIsImJpbmQiLCJpbml0IiwiJGZvcm1zIiwib24iLCJub3QiXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7Ozs7QUFVQTs7Ozs7O0FBTUFBLE9BQU9DLE9BQVAsQ0FBZUMsTUFBZixDQUNDLGNBREQsRUFHQyxDQUNDLE1BREQsRUFFQyxLQUZELEVBR0NGLE9BQU9HLE1BQVAsR0FBZ0IsY0FIakIsRUFJQ0gsT0FBT0csTUFBUCxHQUFnQiwwQkFKakIsRUFLQ0gsT0FBT0csTUFBUCxHQUFnQixhQUxqQixDQUhELEVBV0MsVUFBU0MsSUFBVCxFQUFlOztBQUVkOztBQUVGOztBQUVFLEtBQUlDLFFBQVFDLEVBQUUsSUFBRixDQUFaO0FBQUEsS0FDQ0MsUUFBUUQsRUFBRSxNQUFGLENBRFQ7QUFBQSxLQUVDRSxVQUFVRixFQUFFRyxNQUFGLENBRlg7QUFBQSxLQUdDQyxPQUFPLEtBSFI7QUFBQSxLQUlDQyxPQUFPLElBSlI7QUFBQSxLQUtDQyxVQUFVLENBTFg7QUFBQSxLQU1DQyxXQUFXO0FBQ1Y7QUFDQUMsY0FBWSw2QkFGRjtBQUdWO0FBQ0FDLHdCQUFzQixzQkFKWjtBQUtWO0FBQ0FDLFlBQVUseUJBTkE7QUFPVjtBQUNBQyxlQUFhLDBCQVJIO0FBU1Y7QUFDQUMsaUJBQWUsb0JBVkw7QUFXVjtBQUNBQyxvQkFBa0IsS0FaUjtBQWFWO0FBQ0FDLFlBQVUscUJBZEE7QUFlVjtBQUNBQyxlQUFhLHFCQWhCSDtBQWlCVjtBQUNBQyxtQkFBaUIsZUFsQlA7QUFtQlY7QUFDQUMscUJBQW1CLGtCQXBCVDtBQXFCVjtBQUNBQyxjQUFZLGVBdEJGO0FBdUJWO0FBQ0FDLFlBQVUsbUJBeEJBO0FBeUJWO0FBQ0FDLE9BQUssSUExQks7QUEyQlY7QUFDQTtBQUNBQyx3QkFBc0IsS0E3Qlo7QUE4QlY7QUFDQUMsdUJBQXFCLHVEQUNuQixrQ0FoQ1E7QUFpQ1Y7QUFDQUMsbUJBQWlCLFNBbENQO0FBbUNWO0FBQ0FDLHNCQUFvQixJQXBDVjtBQXFDVjtBQUNBQyxtQkFBaUI7QUFDaEJDLG9CQUFpQixtQkFERDtBQUVoQkMsWUFBUyx1QkFGTztBQUdoQkMsZ0JBQWEsNEJBSEc7QUFJaEJDLGNBQVcsa0JBSks7QUFLaEJDLGlCQUFhLDZCQUxHO0FBTWhCQyxlQUFZLG1CQU5JO0FBT2hCQyxrQkFBZSxnQ0FQQztBQVFoQkMsWUFBUyx3QkFSTztBQVNoQkMsZ0JBQWEsaUJBVEc7QUFVaEJDLGdCQUFhLGFBVkc7QUFXaEJDLGdCQUFhLGVBWEc7QUFZaEJDLFVBQU8sMEJBWlM7QUFhaEJDLG1CQUFnQiw0QkFiQTtBQWNoQm5CLGFBQVUsMEJBZE07QUFlaEJvQixrQkFBZSxpQkFmQztBQWdCaEJDLHdCQUFxQiw2QkFoQkw7QUFpQmhCQyxpQkFBYywrQkFqQkU7QUFrQmhCQyxzQkFBbUIsd0JBbEJIO0FBbUJoQkMsV0FBUSwyQkFuQlE7QUFvQmhCQyxXQUFRO0FBcEJRO0FBdENQLEVBTlo7QUFBQSxLQW1FQ0MsVUFBVTdDLEVBQUU4QyxNQUFGLENBQVMsSUFBVCxFQUFlLEVBQWYsRUFBbUJ2QyxRQUFuQixFQUE2QlQsSUFBN0IsQ0FuRVg7QUFBQSxLQW9FQ0YsU0FBUyxFQXBFVjs7QUF1RUY7O0FBRUU7Ozs7Ozs7O0FBUUEsS0FBSW1ELGtCQUFrQixTQUFsQkEsZUFBa0IsQ0FBU0MsT0FBVCxFQUFrQkMsS0FBbEIsRUFBeUI7QUFDOUMsTUFBSUMsUUFBUUMsV0FBVyxZQUFXO0FBQ2pDSCxXQUFRSSxXQUFSLENBQW9CUCxRQUFRdEIsZUFBUixHQUEwQixHQUExQixHQUFnQ3NCLFFBQVF0QixlQUF4QyxHQUEwRDBCLEtBQTlFO0FBQ0EsR0FGVyxFQUVUSixRQUFRckIsa0JBRkMsQ0FBWjs7QUFJQXdCLFVBQ0VsRCxJQURGLENBQ08sT0FEUCxFQUNnQm9ELEtBRGhCLEVBRUVHLFFBRkYsQ0FFV1IsUUFBUXRCLGVBQVIsR0FBMEIwQixLQUZyQztBQUdBLEVBUkQ7O0FBVUE7Ozs7Ozs7OztBQVNBLEtBQUlLLGdCQUFnQixTQUFoQkEsYUFBZ0IsQ0FBU3hELElBQVQsRUFBZXlELEtBQWYsRUFBc0JDLGNBQXRCLEVBQXNDQywyQkFBdEMsRUFBbUU7O0FBRXRGO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBSVosUUFBUXhCLG9CQUFSLElBQWdDdkIsS0FBSzRELFVBQXJDLElBQW1ENUQsS0FBSzRELFVBQUwsQ0FBZ0JDLE1BQXZFLEVBQStFO0FBQzlFLFVBQU83RCxLQUFLOEQsT0FBTCxDQUFhQyxNQUFwQjtBQUNBN0QsS0FBRTZDLFFBQVF2QixtQkFBVixFQUNFd0MsT0FERixDQUNVQyxJQUFJQyxJQUFKLENBQVNDLFFBQVQsQ0FBa0JDLE1BQWxCLENBQXlCQyxhQUF6QixFQURWLEVBQ29ELEVBQUNqRCxZQUFZcEIsS0FBSzRELFVBQWxCLEVBRHBEO0FBRUE7O0FBRUQ7QUFDQTFELElBQUVvRSxJQUFGLENBQU90RSxLQUFLOEQsT0FBWixFQUFxQixVQUFTUyxDQUFULEVBQVlDLENBQVosRUFBZTtBQUNuQyxPQUFJQyxXQUFXaEIsTUFBTWlCLE1BQU4sR0FBZUMsSUFBZixDQUFvQjVCLFFBQVFwQixlQUFSLENBQXdCNkMsRUFBRUksUUFBMUIsQ0FBcEIsQ0FBZjs7QUFFQSxPQUFJLENBQUMsQ0FBQ2pCLDJCQUFELElBQWdDYSxFQUFFSyxLQUFGLEtBQVksRUFBN0MsS0FBb0ROLE1BQU0sd0JBQTlELEVBQXdGO0FBQ3ZGLFdBQU8sSUFBUDtBQUNBOztBQUVELFdBQVFDLEVBQUVNLElBQVY7QUFDQyxTQUFLLE1BQUw7QUFDQ0wsY0FBU00sSUFBVCxDQUFjUCxFQUFFSyxLQUFoQjtBQUNBO0FBQ0QsU0FBSyxXQUFMO0FBQ0NKLGNBQVNPLElBQVQsQ0FBY1IsRUFBRVMsR0FBaEIsRUFBcUJULEVBQUVLLEtBQXZCO0FBQ0E7QUFDRCxTQUFLLFNBQUw7QUFDQyxTQUFJTCxFQUFFSyxLQUFOLEVBQWE7QUFDWkosZUFBU1MsV0FBVCxDQUFxQlYsRUFBRUssS0FBdkI7QUFDQSxNQUZELE1BRU87QUFDTkosZUFDRWxCLFFBREYsQ0FDVyxRQURYLEVBRUU0QixLQUZGO0FBR0E7QUFDRDtBQUNEO0FBQ0NWLGNBQVNXLElBQVQsQ0FBY1osRUFBRUssS0FBaEI7QUFDQTtBQWxCRjtBQW9CQSxHQTNCRDs7QUE2QkE7QUFDQSxNQUFJbkIsY0FBSixFQUFvQjtBQUNuQixPQUFJMkIsV0FBVzVCLE1BQU1rQixJQUFOLENBQVc1QixRQUFROUIsV0FBbkIsQ0FBZjtBQUNBLE9BQUlqQixLQUFLc0YsT0FBVCxFQUFrQjtBQUNqQkQsYUFBUy9CLFdBQVQsQ0FBcUIsVUFBckI7QUFDQSxJQUZELE1BRU87QUFDTitCLGFBQVM5QixRQUFULENBQWtCLFVBQWxCO0FBQ0E7QUFDRDs7QUFFRCxNQUFJdkQsS0FBSzhELE9BQUwsQ0FBYTNCLE9BQWpCLEVBQTBCO0FBQ3pCLE9BQUlvRCxjQUFjOUIsTUFBTWtCLElBQU4sQ0FBVzVCLFFBQVFwQixlQUFSLENBQXdCM0IsS0FBSzhELE9BQUwsQ0FBYTNCLE9BQWIsQ0FBcUJ5QyxRQUE3QyxDQUFYLENBQWxCO0FBQ0EsT0FBSTVFLEtBQUs4RCxPQUFMLENBQWEzQixPQUFiLENBQXFCMEMsS0FBekIsRUFBZ0M7QUFDL0JVLGdCQUNFakMsV0FERixDQUNjLFFBRGQsRUFFRWtDLElBRkY7QUFHQSxJQUpELE1BSU87QUFDTkQsZ0JBQ0VoQyxRQURGLENBQ1csUUFEWCxFQUVFa0MsSUFGRjs7QUFJQSxRQUFJOUIsK0JBQ0EzRCxLQUFLOEQsT0FBTCxDQUFhNEIsc0JBQWIsS0FBd0NDLFNBRHhDLElBRUEzRixLQUFLOEQsT0FBTCxDQUFhNEIsc0JBRmpCLEVBRXlDO0FBQ3hDLFNBQUkxRixLQUFLOEQsT0FBTCxDQUFhNEIsc0JBQWIsQ0FBb0NiLEtBQXhDLEVBQStDO0FBQzlDVSxrQkFDRWpDLFdBREYsQ0FDYyxRQURkLEVBRUVrQyxJQUZGO0FBR0EsTUFKRCxNQUlPO0FBQ05ELGtCQUNFaEMsUUFERixDQUNXLFFBRFgsRUFFRWtDLElBRkY7QUFHQTtBQUNEO0FBQ0Q7QUFDRDs7QUFFRHJGLFVBQVE0RCxPQUFSLENBQWdCQyxJQUFJQyxJQUFKLENBQVNDLFFBQVQsQ0FBa0JDLE1BQWxCLENBQXlCd0Isd0JBQXpCLEVBQWhCO0FBQ0EsRUFoRkQ7O0FBa0ZBOzs7Ozs7Ozs7O0FBVUEsS0FBSUMsa0JBQWtCLFNBQWxCQSxlQUFrQixDQUFTN0YsSUFBVCxFQUFleUQsS0FBZixFQUFzQnFDLEdBQXRCLEVBQTJCQyxPQUEzQixFQUFvQzs7QUFFekQsTUFBSSxDQUFDekYsSUFBTCxFQUFXO0FBQ1Y7QUFDQTtBQUNBQSxVQUFPLElBQVA7O0FBRUEyRCxPQUFJQyxJQUFKLENBQVM4QixHQUFULENBQWFDLElBQWIsQ0FBa0IsRUFBQ0gsS0FBS0EsR0FBTixFQUFXOUYsTUFBTUEsSUFBakIsRUFBbEIsRUFBMEMsSUFBMUMsRUFBZ0RrRyxJQUFoRCxDQUFxRCxVQUFTQyxNQUFULEVBQWlCO0FBQ3JFLFFBQUk7QUFDSDtBQUNBM0MsbUJBQWMyQyxNQUFkLEVBQXNCMUMsS0FBdEIsRUFBNkIsS0FBN0I7O0FBRUE7QUFDQTtBQUNBLFNBQUkwQyxPQUFPYixPQUFYLEVBQW9CO0FBQ25CLGNBQVFhLE9BQU9yQixJQUFmO0FBQ0MsWUFBSyxLQUFMO0FBQ0MsWUFBSXFCLE9BQU9MLEdBQVAsQ0FBV00sTUFBWCxDQUFrQixDQUFsQixFQUFxQixDQUFyQixNQUE0QixNQUFoQyxFQUF3QztBQUN2Q0Msa0JBQVNDLElBQVQsR0FBZ0JyQyxJQUFJc0MsSUFBSixDQUFTQyxNQUFULENBQWdCQyxHQUFoQixDQUFvQixRQUFwQixJQUFnQyxHQUFoQyxHQUFzQ04sT0FBT0wsR0FBN0Q7QUFDQSxTQUZELE1BRU87QUFDTk8sa0JBQVNDLElBQVQsR0FBZ0JILE9BQU9MLEdBQXZCO0FBQ0E7O0FBRUQ7QUFDRCxZQUFLLFVBQUw7QUFDQzNGLGNBQU02RCxPQUFOLENBQWNDLElBQUlDLElBQUosQ0FBU0MsUUFBVCxDQUFrQkMsTUFBbEIsQ0FBeUJzQyxXQUF6QixFQUFkLEVBQXNELENBQUMsSUFBRCxDQUF0RDtBQUNBO0FBQ0QsWUFBSyxPQUFMO0FBQ0N6QyxZQUFJQyxJQUFKLENBQVNDLFFBQVQsQ0FBa0J3QyxLQUFsQixDQUF3QkMsSUFBeEIsQ0FBNkIsRUFBQ0MsT0FBT1YsT0FBT1UsS0FBZixFQUFzQi9DLFNBQVNxQyxPQUFPVyxHQUF0QyxFQUE3QjtBQUNBO0FBQ0Q7QUFDQztBQWhCRjtBQWtCQTtBQUNELEtBMUJELENBMEJFLE9BQU9DLE1BQVAsRUFBZSxDQUNoQjtBQUNEOUQsb0JBQWdCOEMsT0FBaEIsRUFBeUIsVUFBekI7QUFDQSxJQTlCRCxFQThCR2lCLElBOUJILENBOEJRLFlBQVc7QUFDbEIvRCxvQkFBZ0I4QyxPQUFoQixFQUF5QixPQUF6QjtBQUNBLElBaENELEVBZ0NHa0IsTUFoQ0gsQ0FnQ1UsWUFBVztBQUNwQjtBQUNBO0FBQ0EzRyxXQUFPLEtBQVA7QUFDQSxJQXBDRDtBQXFDQTtBQUVELEVBOUNEOztBQWlERjs7QUFFRTs7Ozs7Ozs7Ozs7QUFXQSxLQUFJNEcsaUJBQWlCLFNBQWpCQSxjQUFpQixDQUFTQyxDQUFULEVBQVk7QUFDaEMsTUFBSUEsQ0FBSixFQUFPO0FBQ05BLEtBQUVDLGNBQUY7QUFDQTs7QUFFRCxNQUFJQyxRQUFRbkgsRUFBRSxJQUFGLENBQVo7QUFBQSxNQUNDdUQsUUFBUzRELE1BQU1DLEVBQU4sQ0FBUyxNQUFULENBQUQsR0FBcUJELEtBQXJCLEdBQTZCQSxNQUFNRSxPQUFOLENBQWMsTUFBZCxDQUR0QztBQUFBLE1BRUNDLGFBQWEvRCxNQUFNZ0UsUUFBTixDQUFlLFlBQWYsQ0FGZDtBQUFBLE1BR0NDLGFBQWEsQ0FBQyxDQUFDakUsTUFBTWtCLElBQU4sQ0FBVyw0QkFBWCxFQUF5Q2QsTUFIekQ7QUFBQSxNQUlDL0QsU0FBUzRILGFBQWEsRUFBYixHQUFrQixhQUo1QjtBQUFBLE1BS0MvRCw4QkFBOEJ3RCxLQUFLQSxFQUFFbkgsSUFBUCxJQUFlbUgsRUFBRW5ILElBQUYsQ0FBTzJILE1BQXRCLElBQWdDUixFQUFFbkgsSUFBRixDQUFPMkgsTUFBUCxLQUFrQixPQUxqRjs7QUFPQSxNQUFJbEUsTUFBTUksTUFBVixFQUFrQjs7QUFFakI7QUFDQTtBQUNBO0FBQ0EsT0FBSTZELFVBQUosRUFBZ0I7QUFDZnpILFVBQU1zRCxRQUFOLENBQWUsU0FBZjtBQUNBOztBQUVELE9BQUlxRSxXQUFXM0QsSUFBSUMsSUFBSixDQUFTMkQsSUFBVCxDQUFjQyxPQUFkLENBQXNCckUsS0FBdEIsRUFBNkIsSUFBN0IsRUFBbUMsSUFBbkMsQ0FBZjtBQUNBbUUsWUFBU0QsTUFBVCxHQUFtQlIsS0FBS0EsRUFBRW5ILElBQVAsSUFBZW1ILEVBQUVuSCxJQUFGLENBQU8ySCxNQUF2QixHQUFpQ1IsRUFBRW5ILElBQUYsQ0FBTzJILE1BQXhDLEdBQWlELE9BQW5FOztBQUVBO0FBQ0E7QUFDQSxPQUFJcEgsUUFBUTRHLENBQVosRUFBZTtBQUNkNUcsU0FBS3dILEtBQUw7QUFDQTs7QUFFRDtBQUNBO0FBQ0EsT0FBSUgsU0FBU0QsTUFBVCxLQUFvQixPQUF4QixFQUFpQztBQUNoQyxRQUFJdkUsUUFBUWlFLE1BQU1ySCxJQUFOLENBQVcsT0FBWCxDQUFaO0FBQ0EsUUFBSW9ELEtBQUosRUFBVztBQUNWNEUsa0JBQWE1RSxLQUFiO0FBQ0E7O0FBRURpRSxVQUNFL0QsV0FERixDQUNjUCxRQUFRdEIsZUFBUixHQUEwQixXQUExQixHQUF3Q3NCLFFBQVF0QixlQUFoRCxHQUFrRSxPQURoRixFQUVFOEIsUUFGRixDQUVXUixRQUFRdEIsZUFGbkI7QUFHQTs7QUFFRGxCLFVBQU8wRCxJQUFJQyxJQUFKLENBQVM4QixHQUFULENBQWFTLEdBQWIsQ0FBaUI7QUFDQ1gsU0FBSy9DLFFBQVFuQyxRQUFSLEdBQW1CZCxNQUR6QjtBQUVDRSxVQUFNNEg7QUFGUCxJQUFqQixFQUdvQixJQUhwQixFQUcwQjFCLElBSDFCLENBRytCLFVBQVNDLE1BQVQsRUFBaUI7QUFDdEQzQyxrQkFBYzJDLE1BQWQsRUFBc0IxQyxLQUF0QixFQUE2QixJQUE3QixFQUFtQ0UsMkJBQW5DO0FBQ0ExRCxVQUFNcUQsV0FBTixDQUFrQixTQUFsQjs7QUFFQSxRQUFJNkMsT0FBT2IsT0FBWCxFQUFvQjtBQUNuQixTQUFJMkMsUUFBUSxJQUFaO0FBQUEsU0FDQ25DLE1BQU0sSUFEUDs7QUFHQSxhQUFROEIsU0FBU0QsTUFBakI7QUFDQyxXQUFLLFVBQUw7QUFDQyxXQUFJSCxVQUFKLEVBQWdCO0FBQ2ZTLGdCQUFRaEUsSUFBSUMsSUFBSixDQUFTQyxRQUFULENBQWtCQyxNQUFsQixDQUF5QjhELHVCQUF6QixFQUFSO0FBQ0E7QUFDRHBDLGFBQU0vQyxRQUFRbEMsV0FBZDtBQUNBO0FBQ0QsV0FBSyxNQUFMO0FBQ0MsV0FBSTJHLFVBQUosRUFBZ0I7QUFDZlMsZ0JBQVFoRSxJQUFJQyxJQUFKLENBQVNDLFFBQVQsQ0FBa0JDLE1BQWxCLENBQXlCK0QsbUJBQXpCLEVBQVI7QUFDQXJDLGNBQU0vQyxRQUFRcEMsb0JBQWQ7QUFDQSxRQUhELE1BR087QUFDTm1GLGNBQU0vQyxRQUFRckMsVUFBZDtBQUNBO0FBQ0Q7QUFDRCxXQUFLLGFBQUw7QUFDQytDLGFBQU11QixJQUFOLENBQVcsUUFBWCxFQUFxQmpDLFFBQVFqQyxhQUE3QixFQUE0Q2tFLElBQTVDLENBQWlELFFBQWpELEVBQTJEakMsUUFBUWhDLGdCQUFuRTtBQUNBMEMsYUFBTTJFLEdBQU4sQ0FBVSxRQUFWO0FBQ0EzRSxhQUFNNEUsTUFBTjs7QUFFQTtBQUNEO0FBQ0NoRixrQkFBVyxZQUFXO0FBQ3JCakQsZ0JBQVE0RCxPQUFSLENBQWdCQyxJQUFJQyxJQUFKLENBQVNDLFFBQVQsQ0FBa0JDLE1BQWxCLENBQXlCd0Isd0JBQXpCLEVBQWhCO0FBQ0EsUUFGRCxFQUVHLEdBRkg7QUFHQTtBQXpCRjs7QUE0QkEsU0FBSXFDLEtBQUosRUFBVztBQUNWLFVBQUlLLFdBQVdwSSxFQUFFcUksUUFBRixFQUFmO0FBQ0FELGVBQVNwQyxJQUFULENBQWMsVUFBU3NDLGdCQUFULEVBQTJCO0FBQ3hDWixnQkFBU1ksZ0JBQVQsSUFBNkIsQ0FBN0I7QUFDQTNDLHVCQUFnQitCLFFBQWhCLEVBQTBCbkUsS0FBMUIsRUFBaUNxQyxHQUFqQyxFQUFzQ3VCLEtBQXRDO0FBQ0EsT0FIRCxFQUdHTCxJQUhILENBR1EsWUFBVztBQUNsQi9ELHVCQUFnQm9FLEtBQWhCLEVBQXVCLE9BQXZCO0FBQ0EsT0FMRDtBQU1BbEgsWUFBTTZELE9BQU4sQ0FBY2lFLEtBQWQsRUFBcUIsQ0FBQyxFQUFDLFlBQVlLLFFBQWIsRUFBdUIsV0FBV1YsUUFBbEMsRUFBRCxDQUFyQjtBQUNBLE1BVEQsTUFTTyxJQUFJOUIsR0FBSixFQUFTO0FBQ2ZELHNCQUFnQitCLFFBQWhCLEVBQTBCbkUsS0FBMUIsRUFBaUNxQyxHQUFqQyxFQUFzQ3VCLEtBQXRDO0FBQ0E7QUFDRDtBQUVELElBckRNLEVBcURKTCxJQXJESSxDQXFEQyxZQUFXO0FBQ2xCL0Qsb0JBQWdCb0UsS0FBaEIsRUFBdUIsT0FBdkI7QUFDQSxJQXZETSxDQUFQO0FBd0RBO0FBQ0QsRUFwR0Q7O0FBc0dBOzs7Ozs7QUFNQSxLQUFJb0IsZ0JBQWdCLFNBQWhCQSxhQUFnQixDQUFTdEIsQ0FBVCxFQUFZO0FBQy9CYSxlQUFheEgsT0FBYjs7QUFFQUEsWUFBVTZDLFdBQVcsWUFBVztBQUMvQjZELGtCQUFld0IsSUFBZixDQUFvQixJQUFwQixFQUEwQnZCLENBQTFCO0FBQ0EsR0FGb0IsQ0FFbkJ3QixJQUZtQixDQUVkLElBRmMsQ0FBWCxFQUVJLEdBRkosQ0FBVjtBQUdBLEVBTkQ7O0FBU0Y7O0FBRUU7Ozs7QUFJQTdJLFFBQU84SSxJQUFQLEdBQWMsVUFBUzFDLElBQVQsRUFBZTs7QUFFNUIsTUFBSTJDLFNBQVM1SSxNQUFNMEUsSUFBTixDQUFXLE1BQVgsQ0FBYjs7QUFFQWtFLFNBQ0VDLEVBREYsQ0FDSyxRQURMLEVBQ2UsRUFBQyxVQUFVLE1BQVgsRUFEZixFQUNtQzVCLGNBRG5DLEVBRUU0QixFQUZGLENBRUssT0FGTCxFQUVjL0YsUUFBUTlCLFdBQVIsR0FBc0IsaUJBRnBDLEVBRXVELEVBQUMsVUFBVSxNQUFYLEVBRnZELEVBRTJFaUcsY0FGM0UsRUFHRTRCLEVBSEYsQ0FHSyxPQUhMLEVBR2MvRixRQUFRN0IsZUFIdEIsRUFHdUMsRUFBQyxVQUFVLFVBQVgsRUFIdkMsRUFHK0RnRyxjQUgvRCxFQUlFNEIsRUFKRixDQUlLLE9BSkwsRUFJYy9GLFFBQVE1QixpQkFKdEIsRUFJeUMsRUFBQyxVQUFVLGFBQVgsRUFKekMsRUFJb0UrRixjQUpwRSxFQUtFNEIsRUFMRixDQUtLLFFBTEwsRUFLZS9GLFFBQVEzQixVQUx2QixFQUttQyxFQUFDLFVBQVUsT0FBWCxFQUxuQyxFQUt3RDhGLGNBTHhELEVBTUU0QixFQU5GLENBTUssTUFOTCxFQU1hL0YsUUFBUTFCLFFBTnJCLEVBTStCLEVBQUMsVUFBVSxPQUFYLEVBTi9CLEVBTW9ENkYsY0FOcEQsRUFPRTRCLEVBUEYsQ0FPSyxPQVBMLEVBT2MvRixRQUFRMUIsUUFQdEIsRUFPZ0MsRUFBQyxVQUFVLE9BQVgsRUFQaEMsRUFPcURvSCxhQVByRDs7QUFTQTtBQUNBO0FBQ0FJLFNBQU9FLEdBQVAsQ0FBVyxrQkFBWCxFQUErQnpFLElBQS9CLENBQW9DLFlBQVc7QUFDOUM0QyxrQkFBZXdCLElBQWYsQ0FBb0J4SSxFQUFFLElBQUYsQ0FBcEI7QUFDQSxHQUZEOztBQUlBZ0c7QUFDQSxFQXBCRDs7QUFzQkE7QUFDQSxRQUFPcEcsTUFBUDtBQUNBLENBbGFGIiwiZmlsZSI6IndpZGdldHMvY2FydF9oYW5kbGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiBjYXJ0X2hhbmRsZXIuanMgMjAxNi0wNi0yMlxuIEdhbWJpbyBHbWJIXG4gaHR0cDovL3d3dy5nYW1iaW8uZGVcbiBDb3B5cmlnaHQgKGMpIDIwMTYgR2FtYmlvIEdtYkhcbiBSZWxlYXNlZCB1bmRlciB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgKFZlcnNpb24gMilcbiBbaHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzL2dwbC0yLjAuaHRtbF1cbiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICovXG5cbi8qKlxuICogQ29tcG9uZW50IGZvciBoYW5kbGluZyB0aGUgYWRkIHRvIGNhcnQgYW5kIHdpc2hsaXN0IGZlYXR1cmVzXG4gKiBhdCB0aGUgcHJvZHVjdCBkZXRhaWxzIGFuZCB0aGUgY2F0ZWdvcnkgbGlzdGluZyBwYWdlcy4gSXQgY2FyZXNcbiAqIGZvciBhdHRyaWJ1dGVzLCBwcm9wZXJ0aWVzLCBxdWFudGl0eSBhbmQgYWxsIG90aGVyXG4gKiByZWxldmFudCBkYXRhIGZvciBhZGRpbmcgYW4gaXRlbSB0byB0aGUgYmFza2V0IG9yIHdpc2hsaXN0XG4gKi9cbmdhbWJpby53aWRnZXRzLm1vZHVsZShcblx0J2NhcnRfaGFuZGxlcicsXG5cblx0W1xuXHRcdCdmb3JtJyxcblx0XHQneGhyJyxcblx0XHRnYW1iaW8uc291cmNlICsgJy9saWJzL2V2ZW50cycsXG5cdFx0Z2FtYmlvLnNvdXJjZSArICcvbGlicy9tb2RhbC5leHQtbWFnbmlmaWMnLFxuXHRcdGdhbWJpby5zb3VyY2UgKyAnL2xpYnMvbW9kYWwnXG5cdF0sXG5cblx0ZnVuY3Rpb24oZGF0YSkge1xuXG5cdFx0J3VzZSBzdHJpY3QnO1xuXG4vLyAjIyMjIyMjIyMjIFZBUklBQkxFIElOSVRJQUxJWkFUSU9OICMjIyMjIyMjIyNcblxuXHRcdHZhciAkdGhpcyA9ICQodGhpcyksXG5cdFx0XHQkYm9keSA9ICQoJ2JvZHknKSxcblx0XHRcdCR3aW5kb3cgPSAkKHdpbmRvdyksXG5cdFx0XHRidXN5ID0gZmFsc2UsXG5cdFx0XHRhamF4ID0gbnVsbCxcblx0XHRcdHRpbWVvdXQgPSAwLFxuXHRcdFx0ZGVmYXVsdHMgPSB7XG5cdFx0XHRcdC8vIEFKQVggXCJhZGQgdG8gY2FydFwiIFVSTFxuXHRcdFx0XHRhZGRDYXJ0VXJsOiAnc2hvcC5waHA/ZG89Q2FydC9CdXlQcm9kdWN0Jyxcblx0XHRcdFx0Ly8gQUpBWCBcImFkZCB0byBjYXJ0XCIgVVJMIGZvciBjdXN0b21pemVyIHByb2R1Y3RzXG5cdFx0XHRcdGFkZENhcnRDdXN0b21pemVyVXJsOiAnc2hvcC5waHA/ZG89Q2FydC9BZGQnLFxuXHRcdFx0XHQvLyBBSkFYIFVSTCB0byBwZXJmb3JtIGEgdmFsdWUgY2hlY2tcblx0XHRcdFx0Y2hlY2tVcmw6ICdzaG9wLnBocD9kbz1DaGVja1N0YXR1cycsXG5cdFx0XHRcdC8vIEFKQVggVVJMIHRvIHBlcmZvcm0gdGhlIGFkZCB0byB3aXNobGlzdFxuXHRcdFx0XHR3aXNobGlzdFVybDogJ3Nob3AucGhwP2RvPVdpc2hMaXN0L0FkZCcsXG5cdFx0XHRcdC8vIFN1Ym1pdCBVUkwgZm9yIHByaWNlIG9mZmVyIGJ1dHRvblxuXHRcdFx0XHRwcmljZU9mZmVyVXJsOiAnZ21fcHJpY2Vfb2ZmZXIucGhwJyxcblx0XHRcdFx0Ly8gU3VibWl0IG1ldGhvZCBmb3IgcHJpY2Ugb2ZmZXJcblx0XHRcdFx0cHJpY2VPZmZlck1ldGhvZDogJ2dldCcsXG5cdFx0XHRcdC8vIFNlbGVjdG9yIGZvciB0aGUgY2FydCBkcm9wZG93blxuXHRcdFx0XHRkcm9wZG93bjogJyNoZWFkX3Nob3BwaW5nX2NhcnQnLFxuXHRcdFx0XHQvLyBcIkFkZCB0byBjYXJ0XCIgYnV0dG9ucyBzZWxlY3RvcnNcblx0XHRcdFx0Y2FydEJ1dHRvbnM6ICcuanMtYnRuLWFkZC10by1jYXJ0Jyxcblx0XHRcdFx0Ly8gXCJXaXNobGlzdFwiIGJ1dHRvbnMgc2VsZWN0b3JzXG5cdFx0XHRcdHdpc2hsaXN0QnV0dG9uczogJy5idG4td2lzaGxpc3QnLFxuXHRcdFx0XHQvLyBcIlByaWNlIG9mZmVyXCIgYnV0dG9ucyBzZWxlY3RvcnNcblx0XHRcdFx0cHJpY2VPZmZlckJ1dHRvbnM6ICcuYnRuLXByaWNlLW9mZmVyJyxcblx0XHRcdFx0Ly8gU2VsZWN0b3IgZm9yIHRoZSBhdHRyaWJ1dGUgZmllbGRzXG5cdFx0XHRcdGF0dHJpYnV0ZXM6ICcuanMtY2FsY3VsYXRlJyxcblx0XHRcdFx0Ly8gU2VsZWN0b3IgZm9yIHRoZSBxdWFudGl0eVxuXHRcdFx0XHRxdWFudGl0eTogJy5qcy1jYWxjdWxhdGUtcXR5Jyxcblx0XHRcdFx0Ly8gVVJMIHdoZXJlIHRvIGdldCB0aGUgdGVtcGxhdGUgZm9yIHRoZSBkcm9wZG93blxuXHRcdFx0XHR0cGw6IG51bGwsXG5cdFx0XHRcdC8vIFNob3cgYXR0cmlidXRlIGltYWdlcyBpbiBwcm9kdWN0IGltYWdlcyBzd2lwZXIgKGlmIHBvc3NpYmxlKVxuXHRcdFx0XHQvLyAtLSB0aGlzIGZlYXR1cmUgaXMgbm90IHN1cHBvcnRlZCB5ZXQgLS1cblx0XHRcdFx0YXR0cmlidXRJbWFnZXNTd2lwZXI6IGZhbHNlLFxuXHRcdFx0XHQvLyBUcmlnZ2VyIHRoZSBhdHRyaWJ1dGUgaW1hZ2VzIHRvIHRoaXMgc2VsZWN0b3JzXG5cdFx0XHRcdHRyaWdnZXJBdHRySW1hZ2VzVG86ICcjcHJvZHVjdF9pbWFnZV9zd2lwZXIsICNwcm9kdWN0X3RodW1ibmFpbF9zd2lwZXIsICdcblx0XHRcdFx0KyAnI3Byb2R1Y3RfdGh1bWJuYWlsX3N3aXBlcl9tb2JpbGUnLFxuXHRcdFx0XHQvLyBDbGFzcyB0aGF0IGdldHMgYWRkZWQgdG8gdGhlIGJ1dHRvbiBvbiBwcm9jZXNzaW5nXG5cdFx0XHRcdHByb2Nlc3NpbmdDbGFzczogJ2xvYWRpbmcnLFxuXHRcdFx0XHQvLyBEdXJhdGlvbiBmb3IgdGhhdCB0aGUgc3VjY2VzcyBvciBmYWlsIGNsYXNzIGdldHMgYWRkZWQgdG8gdGhlIGJ1dHRvblxuXHRcdFx0XHRwcm9jZXNzaW5nRHVyYXRpb246IDIwMDAsXG5cdFx0XHRcdC8vIEFKQVggcmVzcG9uc2UgY29udGVudCBzZWxlY3RvcnNcblx0XHRcdFx0c2VsZWN0b3JNYXBwaW5nOiB7XG5cdFx0XHRcdFx0YXR0cmlidXRlSW1hZ2VzOiAnLmF0dHJpYnV0ZS1pbWFnZXMnLFxuXHRcdFx0XHRcdGJ1dHRvbnM6ICcuc2hvcHBpbmctY2FydC1idXR0b24nLFxuXHRcdFx0XHRcdGdpZnRDb250ZW50OiAnLmdpZnQtY2FydC1jb250ZW50LXdyYXBwZXInLFxuXHRcdFx0XHRcdGdpZnRMYXllcjogJy5naWZ0LWNhcnQtbGF5ZXInLFxuXHRcdFx0XHRcdHNoYXJlQ29udGVudDonLnNoYXJlLWNhcnQtY29udGVudC13cmFwcGVyJyxcblx0XHRcdFx0XHRzaGFyZUxheWVyOiAnLnNoYXJlLWNhcnQtbGF5ZXInLFxuXHRcdFx0XHRcdGhpZGRlbk9wdGlvbnM6ICcjY2FydF9xdWFudGl0eSAuaGlkZGVuLW9wdGlvbnMnLFxuXHRcdFx0XHRcdG1lc3NhZ2U6ICcuZ2xvYmFsLWVycm9yLW1lc3NhZ2VzJyxcblx0XHRcdFx0XHRtZXNzYWdlQ2FydDogJy5jYXJ0LWVycm9yLW1zZycsXG5cdFx0XHRcdFx0bWVzc2FnZUhlbHA6ICcuaGVscC1ibG9jaycsXG5cdFx0XHRcdFx0bW9kZWxOdW1iZXI6ICcubW9kZWwtbnVtYmVyJyxcblx0XHRcdFx0XHRwcmljZTogJy5jdXJyZW50LXByaWNlLWNvbnRhaW5lcicsXG5cdFx0XHRcdFx0cHJvcGVydGllc0Zvcm06ICcucHJvcGVydGllcy1zZWxlY3Rpb24tZm9ybScsXG5cdFx0XHRcdFx0cXVhbnRpdHk6ICcucHJvZHVjdHMtcXVhbnRpdHktdmFsdWUnLFxuXHRcdFx0XHRcdHJpYmJvblNwZWNpYWw6ICcucmliYm9uLXNwZWNpYWwnLFxuXHRcdFx0XHRcdHNoaXBwaW5nSW5mb3JtYXRpb246ICcjc2hpcHBpbmctaW5mb3JtYXRpb24tbGF5ZXInLFxuXHRcdFx0XHRcdHNoaXBwaW5nVGltZTogJy5wcm9kdWN0cy1zaGlwcGluZy10aW1lLXZhbHVlJyxcblx0XHRcdFx0XHRzaGlwcGluZ1RpbWVJbWFnZTogJy5pbWctc2hpcHBpbmctdGltZSBpbWcnLFxuXHRcdFx0XHRcdHRvdGFsczogJyNjYXJ0X3F1YW50aXR5IC50b3RhbC1ib3gnLFxuXHRcdFx0XHRcdHdlaWdodDogJy5wcm9kdWN0cy1kZXRhaWxzLXdlaWdodC1jb250YWluZXIgc3Bhbidcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdG9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMsIGRhdGEpLFxuXHRcdFx0bW9kdWxlID0ge307XG5cblxuLy8gIyMjIyMjIyMjIyBIRUxQRVIgRlVOQ1RJT05TICMjIyMjIyMjIyNcblxuXHRcdC8qKlxuXHRcdCAqIEhlbHBlciBmdW5jdGlvbiB0aGF0IHVwZGF0ZXMgdGhlIGJ1dHRvblxuXHRcdCAqIHN0YXRlIHdpdGggYW4gZXJyb3Igb3Igc3VjY2VzcyBjbGFzcyBmb3Jcblx0XHQgKiBhIHNwZWNpZmllZCBkdXJhdGlvblxuXHRcdCAqIEBwYXJhbSAgIHtvYmplY3R9ICAgICAgICAkdGFyZ2V0ICAgICAgICAgalF1ZXJ5IHNlbGVjdGlvbiBvZiB0aGUgdGFyZ2V0IGJ1dHRvblxuXHRcdCAqIEBwYXJhbSAgIHtzdHJpbmd9ICAgICAgICBzdGF0ZSAgICAgICAgICAgVGhlIHN0YXRlIHN0cmluZyB0aGF0IGdldHMgYWRkZWQgdG8gdGhlIGxvYWRpbmcgY2xhc3Ncblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqL1xuXHRcdHZhciBfYWRkQnV0dG9uU3RhdGUgPSBmdW5jdGlvbigkdGFyZ2V0LCBzdGF0ZSkge1xuXHRcdFx0dmFyIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdFx0JHRhcmdldC5yZW1vdmVDbGFzcyhvcHRpb25zLnByb2Nlc3NpbmdDbGFzcyArICcgJyArIG9wdGlvbnMucHJvY2Vzc2luZ0NsYXNzICsgc3RhdGUpO1xuXHRcdFx0fSwgb3B0aW9ucy5wcm9jZXNzaW5nRHVyYXRpb24pO1xuXG5cdFx0XHQkdGFyZ2V0XG5cdFx0XHRcdC5kYXRhKCd0aW1lcicsIHRpbWVyKVxuXHRcdFx0XHQuYWRkQ2xhc3Mob3B0aW9ucy5wcm9jZXNzaW5nQ2xhc3MgKyBzdGF0ZSk7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIEhlbHBlciBmdW5jdGlvbiB0byBzZXQgdGhlIG1lc3NhZ2VzIGFuZCB0aGVcblx0XHQgKiBidXR0b24gc3RhdGUuXG5cdFx0ICogQHBhcmFtICAgICAgIHtvYmplY3R9ICAgIGRhdGEgICAgICAgICAgICAgICAgUmVzdWx0IGZvcm0gdGhlIGFqYXggcmVxdWVzdFxuXHRcdCAqIEBwYXJhbSAgICAgICB7b2JqZWN0fSAgICAkZm9ybSAgICAgICAgICAgICAgIGpRdWVyeSBzZWxlY2lvbiBvZiB0aGUgZm9ybVxuXHRcdCAqIEBwYXJhbSAgICAgICB7Ym9vbGVhbn0gICBkaXNhYmxlQnV0dG9ucyAgICAgIElmIHRydWUsIHRoZSBidXR0b24gc3RhdGUgZ2V0cyBzZXQgdG8gKGluKWFjdGl2ZVxuXHRcdCAqIEBwYXJhbSAgICAgICB7Ym9vbGVhbn0gICBzaG93Tm9Db21iaU1lc3NzYWdlIElmIHRydWUsIHRoZSBlcnJvciBtZXNzYWdlIGZvciBtaXNzaW5nIHByb3BlcnR5IGNvbWJpbmF0aW9uIHNlbGVjdGlvbiB3aWxsIGJlIGRpc3BsYXllZFxuXHRcdCAqIEBwcml2YXRlXG5cdFx0ICovXG5cdFx0dmFyIF9zdGF0ZU1hbmFnZXIgPSBmdW5jdGlvbihkYXRhLCAkZm9ybSwgZGlzYWJsZUJ1dHRvbnMsIHNob3dOb0NvbWJpU2VsZWN0ZWRNZXNzc2FnZSkge1xuXG5cdFx0XHQvLyBSZW1vdmUgdGhlIGF0dHJpYnV0ZSBpbWFnZXMgZnJvbSB0aGUgY29tbW9uIGNvbnRlbnRcblx0XHRcdC8vIHNvIHRoYXQgaXQgZG9lc24ndCBnZXQgcmVuZGVyZWQgYW55bW9yZS4gVGhlbiB0cmlnZ2VyXG5cdFx0XHQvLyBhbiBldmVudCB0byB0aGUgZ2l2ZW4gc2VsZWN0b3JzIGFuZCBkZWxpdmVyIHRoZVxuXHRcdFx0Ly8gYXR0ckltYWdlcyBvYmplY3Rcblx0XHRcdGlmIChvcHRpb25zLmF0dHJpYnV0SW1hZ2VzU3dpcGVyICYmIGRhdGEuYXR0ckltYWdlcyAmJiBkYXRhLmF0dHJJbWFnZXMubGVuZ3RoKSB7XG5cdFx0XHRcdGRlbGV0ZSBkYXRhLmNvbnRlbnQuaW1hZ2VzO1xuXHRcdFx0XHQkKG9wdGlvbnMudHJpZ2dlckF0dHJJbWFnZXNUbylcblx0XHRcdFx0XHQudHJpZ2dlcihqc2UubGlicy50ZW1wbGF0ZS5ldmVudHMuU0xJREVTX1VQREFURSgpLCB7YXR0cmlidXRlczogZGF0YS5hdHRySW1hZ2VzfSk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIFNldCB0aGUgbWVzc2FnZXMgZ2l2ZW4gaW5zaWRlIHRoZSBkYXRhLmNvbnRlbnQgb2JqZWN0XG5cdFx0XHQkLmVhY2goZGF0YS5jb250ZW50LCBmdW5jdGlvbihpLCB2KSB7XG5cdFx0XHRcdHZhciAkZWxlbWVudCA9ICRmb3JtLnBhcmVudCgpLmZpbmQob3B0aW9ucy5zZWxlY3Rvck1hcHBpbmdbdi5zZWxlY3Rvcl0pO1xuXG5cdFx0XHRcdGlmICgoIXNob3dOb0NvbWJpU2VsZWN0ZWRNZXNzc2FnZSB8fCB2LnZhbHVlID09PSAnJykgJiYgaSA9PT0gJ21lc3NhZ2VOb0NvbWJpU2VsZWN0ZWQnKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRzd2l0Y2ggKHYudHlwZSkge1xuXHRcdFx0XHRcdGNhc2UgJ2h0bWwnOlxuXHRcdFx0XHRcdFx0JGVsZW1lbnQuaHRtbCh2LnZhbHVlKTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdGNhc2UgJ2F0dHJpYnV0ZSc6XG5cdFx0XHRcdFx0XHQkZWxlbWVudC5hdHRyKHYua2V5LCB2LnZhbHVlKTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdGNhc2UgJ3JlcGxhY2UnOlxuXHRcdFx0XHRcdFx0aWYgKHYudmFsdWUpIHtcblx0XHRcdFx0XHRcdFx0JGVsZW1lbnQucmVwbGFjZVdpdGgodi52YWx1ZSk7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHQkZWxlbWVudFxuXHRcdFx0XHRcdFx0XHRcdC5hZGRDbGFzcygnaGlkZGVuJylcblx0XHRcdFx0XHRcdFx0XHQuZW1wdHkoKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdFx0XHQkZWxlbWVudC50ZXh0KHYudmFsdWUpO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHQvLyBEaXMtIC8gRW5hYmxlIHRoZSBidXR0b25zXG5cdFx0XHRpZiAoZGlzYWJsZUJ1dHRvbnMpIHtcblx0XHRcdFx0dmFyICRidXR0b25zID0gJGZvcm0uZmluZChvcHRpb25zLmNhcnRCdXR0b25zKTtcblx0XHRcdFx0aWYgKGRhdGEuc3VjY2Vzcykge1xuXHRcdFx0XHRcdCRidXR0b25zLnJlbW92ZUNsYXNzKCdpbmFjdGl2ZScpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdCRidXR0b25zLmFkZENsYXNzKCdpbmFjdGl2ZScpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkYXRhLmNvbnRlbnQubWVzc2FnZSkge1xuXHRcdFx0XHR2YXIgJGVycm9yRmllbGQgPSAkZm9ybS5maW5kKG9wdGlvbnMuc2VsZWN0b3JNYXBwaW5nW2RhdGEuY29udGVudC5tZXNzYWdlLnNlbGVjdG9yXSk7XG5cdFx0XHRcdGlmIChkYXRhLmNvbnRlbnQubWVzc2FnZS52YWx1ZSkge1xuXHRcdFx0XHRcdCRlcnJvckZpZWxkXG5cdFx0XHRcdFx0XHQucmVtb3ZlQ2xhc3MoJ2hpZGRlbicpXG5cdFx0XHRcdFx0XHQuc2hvdygpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdCRlcnJvckZpZWxkXG5cdFx0XHRcdFx0XHQuYWRkQ2xhc3MoJ2hpZGRlbicpXG5cdFx0XHRcdFx0XHQuaGlkZSgpO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdGlmIChzaG93Tm9Db21iaVNlbGVjdGVkTWVzc3NhZ2Vcblx0XHRcdFx0XHRcdCYmIGRhdGEuY29udGVudC5tZXNzYWdlTm9Db21iaVNlbGVjdGVkICE9PSB1bmRlZmluZWRcblx0XHRcdFx0XHRcdCYmIGRhdGEuY29udGVudC5tZXNzYWdlTm9Db21iaVNlbGVjdGVkKSB7XG5cdFx0XHRcdFx0XHRpZiAoZGF0YS5jb250ZW50Lm1lc3NhZ2VOb0NvbWJpU2VsZWN0ZWQudmFsdWUpIHtcblx0XHRcdFx0XHRcdFx0JGVycm9yRmllbGRcblx0XHRcdFx0XHRcdFx0XHQucmVtb3ZlQ2xhc3MoJ2hpZGRlbicpXG5cdFx0XHRcdFx0XHRcdFx0LnNob3coKTtcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdCRlcnJvckZpZWxkXG5cdFx0XHRcdFx0XHRcdFx0LmFkZENsYXNzKCdoaWRkZW4nKVxuXHRcdFx0XHRcdFx0XHRcdC5oaWRlKCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdCR3aW5kb3cudHJpZ2dlcihqc2UubGlicy50ZW1wbGF0ZS5ldmVudHMuU1RJQ0tZQk9YX0NPTlRFTlRfQ0hBTkdFKCkpO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBIZWxwZXIgZnVuY3Rpb24gdG8gc2VuZCB0aGUgYWpheFxuXHRcdCAqIE9uIHN1Y2Nlc3MgcmVkaXJlY3QgdG8gYSBnaXZlbiB1cmwsIG9wZW4gYSBsYXllciB3aXRoXG5cdFx0ICogYSBtZXNzYWdlIG9yIGFkZCB0aGUgaXRlbSB0byB0aGUgY2FydC1kcm9wZG93biBkaXJlY3RseVxuXHRcdCAqIChieSB0cmlnZ2VyaW5nIGFuIGV2ZW50IHRvIHRoZSBib2R5KVxuXHRcdCAqIEBwYXJhbSAgICAgICB7b2JqZWN0fSAgICAgIGRhdGEgICAgICBGb3JtIGRhdGFcblx0XHQgKiBAcGFyYW0gICAgICAge29iamVjdH0gICAgICAkZm9ybSAgICAgVGhlIGZvcm0gdG8gZmlsbFxuXHRcdCAqIEBwYXJhbSAgICAgICB7c3RyaW5nfSAgICAgIHVybCAgICAgICBUaGUgVVJMIGZvciB0aGUgQUpBWCByZXF1ZXN0XG5cdFx0ICogQHByaXZhdGVcblx0XHQgKi9cblx0XHR2YXIgX2FkZFRvU29tZXdoZXJlID0gZnVuY3Rpb24oZGF0YSwgJGZvcm0sIHVybCwgJGJ1dHRvbikge1xuXG5cdFx0XHRpZiAoIWJ1c3kpIHtcblx0XHRcdFx0Ly8gb25seSBleGVjdXRlIHRoZSBhamF4XG5cdFx0XHRcdC8vIGlmIHRoZXJlIGlzIG5vIHBlbmRpbmcgYWpheCBjYWxsXG5cdFx0XHRcdGJ1c3kgPSB0cnVlO1xuXG5cdFx0XHRcdGpzZS5saWJzLnhoci5wb3N0KHt1cmw6IHVybCwgZGF0YTogZGF0YX0sIHRydWUpLmRvbmUoZnVuY3Rpb24ocmVzdWx0KSB7XG5cdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdC8vIEZpbGwgdGhlIHBhZ2Ugd2l0aCB0aGUgcmVzdWx0IGZyb20gdGhlIGFqYXhcblx0XHRcdFx0XHRcdF9zdGF0ZU1hbmFnZXIocmVzdWx0LCAkZm9ybSwgZmFsc2UpO1xuXG5cdFx0XHRcdFx0XHQvLyBJZiB0aGUgQUpBWCB3YXMgc3VjY2Vzc2Z1bCBleGVjdXRlXG5cdFx0XHRcdFx0XHQvLyBhIGN1c3RvbSBmdW5jdGlvbmFsaXR5XG5cdFx0XHRcdFx0XHRpZiAocmVzdWx0LnN1Y2Nlc3MpIHtcblx0XHRcdFx0XHRcdFx0c3dpdGNoIChyZXN1bHQudHlwZSkge1xuXHRcdFx0XHRcdFx0XHRcdGNhc2UgJ3VybCc6XG5cdFx0XHRcdFx0XHRcdFx0XHRpZiAocmVzdWx0LnVybC5zdWJzdHIoMCwgNCkgIT09ICdodHRwJykge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRsb2NhdGlvbi5ocmVmID0ganNlLmNvcmUuY29uZmlnLmdldCgnYXBwVXJsJykgKyAnLycgKyByZXN1bHQudXJsO1xuXHRcdFx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0bG9jYXRpb24uaHJlZiA9IHJlc3VsdC51cmw7XG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0XHRcdGNhc2UgJ2Ryb3Bkb3duJzpcblx0XHRcdFx0XHRcdFx0XHRcdCRib2R5LnRyaWdnZXIoanNlLmxpYnMudGVtcGxhdGUuZXZlbnRzLkNBUlRfVVBEQVRFKCksIFt0cnVlXSk7XG5cdFx0XHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdFx0XHRjYXNlICdsYXllcic6XG5cdFx0XHRcdFx0XHRcdFx0XHRqc2UubGlicy50ZW1wbGF0ZS5tb2RhbC5pbmZvKHt0aXRsZTogcmVzdWx0LnRpdGxlLCBjb250ZW50OiByZXN1bHQubXNnfSk7XG5cdFx0XHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9IGNhdGNoIChpZ25vcmUpIHtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0X2FkZEJ1dHRvblN0YXRlKCRidXR0b24sICctc3VjY2VzcycpO1xuXHRcdFx0XHR9KS5mYWlsKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdF9hZGRCdXR0b25TdGF0ZSgkYnV0dG9uLCAnLWZhaWwnKTtcblx0XHRcdFx0fSkuYWx3YXlzKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdC8vIFJlc2V0IHRoZSBidXN5IGZsYWcgdG8gYmUgYWJsZSB0byBwZXJmb3JtXG5cdFx0XHRcdFx0Ly8gZnVydGhlciBBSkFYIHJlcXVlc3RzXG5cdFx0XHRcdFx0YnVzeSA9IGZhbHNlO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblxuXHRcdH07XG5cblxuLy8gIyMjIyMjIyMjIyBFVkVOVCBIQU5ETEVSICMjIyMjIyMjIyNcblxuXHRcdC8qKlxuXHRcdCAqIEhhbmRsZXIgZm9yIHRoZSBzdWJtaXQgZm9ybSAvIGNsaWNrXG5cdFx0ICogb24gXCJhZGQgdG8gY2FydFwiICYgXCJ3aXNobGlzdFwiIGJ1dHRvbi5cblx0XHQgKiBJdCBwZXJmb3JtcyBhIGNoZWNrIG9uIHRoZSBhdmFpbGFiaWxpdHlcblx0XHQgKiBvZiB0aGUgY29tYmluYXRpb24gYW5kIHF1YW50aXR5LiBJZlxuXHRcdCAqIHN1Y2Nlc3NmdWwgaXQgcGVyZm9ybXMgdGhlIGFkZCB0byBjYXJ0XG5cdFx0ICogb3Igd2lzaGxpc3QgYWN0aW9uLCBpZiBpdCdzIG5vdCBhXG5cdFx0ICogXCJjaGVja1wiIGNhbGxcblx0XHQgKiBAcGFyYW0gICAgICAge29iamVjdH0gICAgZSAgICAgIGpRdWVyeSBldmVudCBvYmplY3Rcblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqL1xuXHRcdHZhciBfc3VibWl0SGFuZGxlciA9IGZ1bmN0aW9uKGUpIHtcblx0XHRcdGlmIChlKSB7XG5cdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdH1cblxuXHRcdFx0dmFyICRzZWxmID0gJCh0aGlzKSxcblx0XHRcdFx0JGZvcm0gPSAoJHNlbGYuaXMoJ2Zvcm0nKSkgPyAkc2VsZiA6ICRzZWxmLmNsb3Nlc3QoJ2Zvcm0nKSxcblx0XHRcdFx0Y3VzdG9taXplciA9ICRmb3JtLmhhc0NsYXNzKCdjdXN0b21pemVyJyksXG5cdFx0XHRcdHByb3BlcnRpZXMgPSAhISRmb3JtLmZpbmQoJy5wcm9wZXJ0aWVzLXNlbGVjdGlvbi1mb3JtJykubGVuZ3RoLFxuXHRcdFx0XHRtb2R1bGUgPSBwcm9wZXJ0aWVzID8gJycgOiAnL0F0dHJpYnV0ZXMnLFxuXHRcdFx0XHRzaG93Tm9Db21iaVNlbGVjdGVkTWVzc3NhZ2UgPSBlICYmIGUuZGF0YSAmJiBlLmRhdGEudGFyZ2V0ICYmIGUuZGF0YS50YXJnZXQgIT09ICdjaGVjayc7XG5cblx0XHRcdGlmICgkZm9ybS5sZW5ndGgpIHtcblxuXHRcdFx0XHQvLyBTaG93IHByb3BlcnRpZXMgb3ZlcmxheVxuXHRcdFx0XHQvLyB0byBkaXNhYmxlIHVzZXIgaW50ZXJhY3Rpb25cblx0XHRcdFx0Ly8gYmVmb3JlIG1hcmt1cCByZXBsYWNlXG5cdFx0XHRcdGlmIChwcm9wZXJ0aWVzKSB7XG5cdFx0XHRcdFx0JHRoaXMuYWRkQ2xhc3MoJ2xvYWRpbmcnKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHZhciBmb3JtZGF0YSA9IGpzZS5saWJzLmZvcm0uZ2V0RGF0YSgkZm9ybSwgbnVsbCwgdHJ1ZSk7XG5cdFx0XHRcdGZvcm1kYXRhLnRhcmdldCA9IChlICYmIGUuZGF0YSAmJiBlLmRhdGEudGFyZ2V0KSA/IGUuZGF0YS50YXJnZXQgOiAnY2hlY2snO1xuXG5cdFx0XHRcdC8vIEFib3J0IHByZXZpb3VzIGNoZWNrIGFqYXggaWZcblx0XHRcdFx0Ly8gdGhlcmUgaXMgb25lIGluIHByb2dyZXNzXG5cdFx0XHRcdGlmIChhamF4ICYmIGUpIHtcblx0XHRcdFx0XHRhamF4LmFib3J0KCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBBZGQgcHJvY2Vzc2luZy1jbGFzcyB0byB0aGUgYnV0dG9uXG5cdFx0XHRcdC8vIGFuZCByZW1vdmUgb2xkIHRpbWVkIGV2ZW50c1xuXHRcdFx0XHRpZiAoZm9ybWRhdGEudGFyZ2V0ICE9PSAnY2hlY2snKSB7XG5cdFx0XHRcdFx0dmFyIHRpbWVyID0gJHNlbGYuZGF0YSgndGltZXInKTtcblx0XHRcdFx0XHRpZiAodGltZXIpIHtcblx0XHRcdFx0XHRcdGNsZWFyVGltZW91dCh0aW1lcik7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0JHNlbGZcblx0XHRcdFx0XHRcdC5yZW1vdmVDbGFzcyhvcHRpb25zLnByb2Nlc3NpbmdDbGFzcyArICctc3VjY2VzcyAnICsgb3B0aW9ucy5wcm9jZXNzaW5nQ2xhc3MgKyAnLWZhaWwnKVxuXHRcdFx0XHRcdFx0LmFkZENsYXNzKG9wdGlvbnMucHJvY2Vzc2luZ0NsYXNzKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGFqYXggPSBqc2UubGlicy54aHIuZ2V0KHtcblx0XHRcdFx0XHQgICAgICAgICAgICAgICAgICAgICAgICB1cmw6IG9wdGlvbnMuY2hlY2tVcmwgKyBtb2R1bGUsXG5cdFx0XHRcdFx0ICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogZm9ybWRhdGFcblx0XHRcdFx0ICAgICAgICAgICAgICAgICAgICAgICAgfSwgdHJ1ZSkuZG9uZShmdW5jdGlvbihyZXN1bHQpIHtcblx0XHRcdFx0XHRfc3RhdGVNYW5hZ2VyKHJlc3VsdCwgJGZvcm0sIHRydWUsIHNob3dOb0NvbWJpU2VsZWN0ZWRNZXNzc2FnZSk7XG5cdFx0XHRcdFx0JHRoaXMucmVtb3ZlQ2xhc3MoJ2xvYWRpbmcnKTtcblxuXHRcdFx0XHRcdGlmIChyZXN1bHQuc3VjY2Vzcykge1xuXHRcdFx0XHRcdFx0dmFyIGV2ZW50ID0gbnVsbCxcblx0XHRcdFx0XHRcdFx0dXJsID0gbnVsbDtcblxuXHRcdFx0XHRcdFx0c3dpdGNoIChmb3JtZGF0YS50YXJnZXQpIHtcblx0XHRcdFx0XHRcdFx0Y2FzZSAnd2lzaGxpc3QnOlxuXHRcdFx0XHRcdFx0XHRcdGlmIChjdXN0b21pemVyKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRldmVudCA9IGpzZS5saWJzLnRlbXBsYXRlLmV2ZW50cy5BRERfQ1VTVE9NSVpFUl9XSVNITElTVCgpO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHR1cmwgPSBvcHRpb25zLndpc2hsaXN0VXJsO1xuXHRcdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0XHRjYXNlICdjYXJ0Jzpcblx0XHRcdFx0XHRcdFx0XHRpZiAoY3VzdG9taXplcikge1xuXHRcdFx0XHRcdFx0XHRcdFx0ZXZlbnQgPSBqc2UubGlicy50ZW1wbGF0ZS5ldmVudHMuQUREX0NVU1RPTUlaRVJfQ0FSVCgpO1xuXHRcdFx0XHRcdFx0XHRcdFx0dXJsID0gb3B0aW9ucy5hZGRDYXJ0Q3VzdG9taXplclVybDtcblx0XHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdFx0dXJsID0gb3B0aW9ucy5hZGRDYXJ0VXJsO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdFx0Y2FzZSAncHJpY2Vfb2ZmZXInOlxuXHRcdFx0XHRcdFx0XHRcdCRmb3JtLmF0dHIoJ2FjdGlvbicsIG9wdGlvbnMucHJpY2VPZmZlclVybCkuYXR0cignbWV0aG9kJywgb3B0aW9ucy5wcmljZU9mZmVyTWV0aG9kKTtcblx0XHRcdFx0XHRcdFx0XHQkZm9ybS5vZmYoJ3N1Ym1pdCcpO1xuXHRcdFx0XHRcdFx0XHRcdCRmb3JtLnN1Ym1pdCgpO1xuXHRcdFx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0XHRcdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0JHdpbmRvdy50cmlnZ2VyKGpzZS5saWJzLnRlbXBsYXRlLmV2ZW50cy5TVElDS1lCT1hfQ09OVEVOVF9DSEFOR0UoKSk7XG5cdFx0XHRcdFx0XHRcdFx0fSwgMjUwKTtcblx0XHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0aWYgKGV2ZW50KSB7XG5cdFx0XHRcdFx0XHRcdHZhciBkZWZlcnJlZCA9ICQuRGVmZXJyZWQoKTtcblx0XHRcdFx0XHRcdFx0ZGVmZXJyZWQuZG9uZShmdW5jdGlvbihjdXN0b21pemVyUmFuZG9tKSB7XG5cdFx0XHRcdFx0XHRcdFx0Zm9ybWRhdGFbY3VzdG9taXplclJhbmRvbV0gPSAwO1xuXHRcdFx0XHRcdFx0XHRcdF9hZGRUb1NvbWV3aGVyZShmb3JtZGF0YSwgJGZvcm0sIHVybCwgJHNlbGYpO1xuXHRcdFx0XHRcdFx0XHR9KS5mYWlsKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0XHRcdF9hZGRCdXR0b25TdGF0ZSgkc2VsZiwgJy1mYWlsJyk7XG5cdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHQkYm9keS50cmlnZ2VyKGV2ZW50LCBbeydkZWZlcnJlZCc6IGRlZmVycmVkLCAnZGF0YXNldCc6IGZvcm1kYXRhfV0pO1xuXHRcdFx0XHRcdFx0fSBlbHNlIGlmICh1cmwpIHtcblx0XHRcdFx0XHRcdFx0X2FkZFRvU29tZXdoZXJlKGZvcm1kYXRhLCAkZm9ybSwgdXJsLCAkc2VsZik7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdH0pLmZhaWwoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0X2FkZEJ1dHRvblN0YXRlKCRzZWxmLCAnLWZhaWwnKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fTtcblx0XHRcblx0XHQvKipcblx0XHQgKiBLZXl1cCBoYW5kbGVyIGZvciBxdWFudGl0eSBpbnB1dCBmaWVsZFxuXHRcdCAqIFxuXHRcdCAqIEBwYXJhbSBlXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKi9cblx0XHR2YXIgX2tleXVwSGFuZGxlciA9IGZ1bmN0aW9uKGUpIHtcblx0XHRcdGNsZWFyVGltZW91dCh0aW1lb3V0KTtcblx0XHRcdFxuXHRcdFx0dGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdF9zdWJtaXRIYW5kbGVyLmNhbGwodGhpcywgZSlcblx0XHRcdH0uYmluZCh0aGlzKSwgMzAwKTtcblx0XHR9O1xuXG5cbi8vICMjIyMjIyMjIyMgSU5JVElBTElaQVRJT04gIyMjIyMjIyMjI1xuXG5cdFx0LyoqXG5cdFx0ICogSW5pdCBmdW5jdGlvbiBvZiB0aGUgd2lkZ2V0XG5cdFx0ICogQGNvbnN0cnVjdG9yXG5cdFx0ICovXG5cdFx0bW9kdWxlLmluaXQgPSBmdW5jdGlvbihkb25lKSB7XG5cblx0XHRcdHZhciAkZm9ybXMgPSAkdGhpcy5maW5kKCdmb3JtJyk7XG5cblx0XHRcdCRmb3Jtc1xuXHRcdFx0XHQub24oJ3N1Ym1pdCcsIHsndGFyZ2V0JzogJ2NhcnQnfSwgX3N1Ym1pdEhhbmRsZXIpXG5cdFx0XHRcdC5vbignY2xpY2snLCBvcHRpb25zLmNhcnRCdXR0b25zICsgJzpub3QoLmluYWN0aXZlKScsIHsndGFyZ2V0JzogJ2NhcnQnfSwgX3N1Ym1pdEhhbmRsZXIpXG5cdFx0XHRcdC5vbignY2xpY2snLCBvcHRpb25zLndpc2hsaXN0QnV0dG9ucywgeyd0YXJnZXQnOiAnd2lzaGxpc3QnfSwgX3N1Ym1pdEhhbmRsZXIpXG5cdFx0XHRcdC5vbignY2xpY2snLCBvcHRpb25zLnByaWNlT2ZmZXJCdXR0b25zLCB7J3RhcmdldCc6ICdwcmljZV9vZmZlcid9LCBfc3VibWl0SGFuZGxlcilcblx0XHRcdFx0Lm9uKCdjaGFuZ2UnLCBvcHRpb25zLmF0dHJpYnV0ZXMsIHsndGFyZ2V0JzogJ2NoZWNrJ30sIF9zdWJtaXRIYW5kbGVyKVxuXHRcdFx0XHQub24oJ2JsdXInLCBvcHRpb25zLnF1YW50aXR5LCB7J3RhcmdldCc6ICdjaGVjayd9LCBfc3VibWl0SGFuZGxlcilcblx0XHRcdFx0Lm9uKCdrZXl1cCcsIG9wdGlvbnMucXVhbnRpdHksIHsndGFyZ2V0JzogJ2NoZWNrJ30sIF9rZXl1cEhhbmRsZXIpO1xuXG5cdFx0XHQvLyBGYWxsYmFjayBpZiB0aGUgYmFja2VuZCByZW5kZXJzIGluY29ycmVjdCBkYXRhXG5cdFx0XHQvLyBvbiBpbml0aWFsIHBhZ2UgY2FsbFxuXHRcdFx0JGZvcm1zLm5vdCgnLm5vLXN0YXR1cy1jaGVjaycpLmVhY2goZnVuY3Rpb24oKSB7XG5cdFx0XHRcdF9zdWJtaXRIYW5kbGVyLmNhbGwoJCh0aGlzKSk7XG5cdFx0XHR9KTtcblxuXHRcdFx0ZG9uZSgpO1xuXHRcdH07XG5cblx0XHQvLyBSZXR1cm4gZGF0YSB0byB3aWRnZXQgZW5naW5lXG5cdFx0cmV0dXJuIG1vZHVsZTtcblx0fSk7XG4iXX0=

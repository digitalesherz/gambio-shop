'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/* --------------------------------------------------------------
 filter.js 2016-11-18
 Gambio GmbH
 http://www.gambio.de
 Copyright (c) 2016 Gambio GmbH
 Released under the GNU General Public License (Version 2)
 [http://www.gnu.org/licenses/gpl-2.0.html]
 --------------------------------------------------------------
 */

gambio.widgets.module('filter', ['form', 'xhr'], function (data) {

	'use strict';

	// ########## VARIABLE INITIALIZATION ##########

	var $this = $(this),
	    $body = $('body'),
	    $preloader = null,
	    $contentWrapper = null,
	    errorTimer = null,
	    updateTimer = null,
	    filterAjax = null,
	    productsAjax = null,
	    historyAvailable = false,
	    reset = false,
	    historyPopstateEventBinded = false,
	    defaults = {
		// The url the ajax request execute against
		requestUrl: 'shop.php?do=Filter',
		// If autoUpdate is false, and this is true the product listing filter will be set to default 
		// on page reload
		resetProductlistingFilter: false,
		// If true, the product list gets updated dynamically
		autoUpdate: true,
		// The delay after a change event before an ajax gets executed
		updateDelay: 200,
		// The maximum number of retries after failures
		retries: 2,
		// After which delay the nex try will be done
		retryDelay: 500,

		selectorMapping: {
			filterForm: '.filter-box-form-wrapper',
			productsContainer: '.product-filter-target',
			filterSelectionContainer: '.filter-selection-container',
			listingPagination: '.productlisting-filter-container .panel-pagination',
			filterHiddenContainer: '.productlisting-filter-container .productlisting-filter-hiddens',
			paginationInfo: '.pagination-info'
		}
	},
	    options = $.extend(true, {}, defaults, data),
	    module = {};

	/*
  var v_selected_values_group = new Array();
  $("#menubox_body_shadow").find("span").live("click", function()
  {		
  $("#menubox_body_shadow").removeClass("error").html("");
 	 get_selected_values();
  get_available_values(0);
  });
 	 $("#menubox_filter .filter_features_link.link_list").live("click", function(){
  var t_feature_value_id = $(this).attr("rel");
  $( "#"+t_feature_value_id ).trigger("click");
  return false;
  */

	// ########## HELPER FUNCTIONS ##########

	/**
  * Helper function that updates the product list
  * and the pagination for the filter.
  * @param filterResult
  * @private
  */
	var _updateProducts = function _updateProducts(historyChange) {
		var resetParam = '';

		if (productsAjax) {
			productsAjax.abort();
		}

		if (reset) {
			resetParam = '&reset=true';
		}

		// Call the request ajax and fill the page with the delivered data
		productsAjax = $.ajax({
			url: options.requestUrl + '/GetListing&' + $this.serialize() + resetParam,
			method: 'GET',
			dataType: 'json'
		}).done(function (result) {

			// redirect if filter has been reset              	
			if (typeof result.redirect !== 'undefined') {
				location.href = result.redirect;
				return;
			}

			// bind _historyHandler function on popstate event not earlier than first paged content change to 
			// prevent endless popstate event triggering bug on mobile devices
			if (!historyPopstateEventBinded && options.autoUpdate) {
				$(window).on('popstate', _historyHandler);
				historyPopstateEventBinded = true;
			}

			jse.libs.template.helpers.fill(result.content, $contentWrapper, options.selectorMapping);

			var $productsContainer = $(options.selectorMapping.productsContainer);

			$productsContainer.attr('data-gambio-widget', 'cart_handler');
			gambio.widgets.init($productsContainer);

			var $productsContainerWrapper = $(options.selectorMapping.productsContainer).parent('div');

			$productsContainerWrapper.attr('data-gambio-widget', 'product_hover');
			$productsContainerWrapper.attr('data-product_hover-scope', '.productlist-viewmode-grid');
			gambio.widgets.init($productsContainerWrapper);

			if (historyAvailable && historyChange) {
				var urlParameter = decodeURIComponent($this.serialize());

				history.pushState({}, 'filter', location.origin + location.pathname + '?' + urlParameter + location.hash);
				$this.trigger('pushstate', []);
			} else {
				$this.trigger('pushstate_no_history', []);
			}
		});
	};

	/**
  * Helper function that transforms the filter
  * settings to a format that is readable by
  * the backend
  * @param       {object}        dataset             The formdata that contains the filter settings
  * @return     {*}                                 The transformed form data
  * @private
  */
	var _transform = function _transform(dataset, join) {
		var result = [];
		$.each(dataset.filter_fv_id, function (key, value) {
			if (value !== undefined && value !== false) {

				if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object') {
					var valid = [];
					$.each(value, function (k, v) {
						if (v !== false) {
							valid.push(v);
						}
					});
					if (join) {
						result.push(key + ':' + valid.join('|'));
					} else {
						result[key] = result[key] || [];
						result[key] = valid;
					}
				} else {
					result.push(key + ':' + value);
				}
			}
		});

		dataset.filter_fv_id = join ? result.join('&') : result;

		return dataset;
	};

	/**
  * Helper function that calls the update
  * ajax and replaces the filter box with
  * the new form
  * @param       {integer}       tryCount        The count how often the ajax has failed
  * @param       {object}        formdata        The ready to use data from the form
  * @param       {boolean}       historyChange   If true, the history will be updted after the list update (if possible)
  * @private
  */
	var _update = function _update(tryCount, formdata, historyChange) {

		$preloader.removeClass('error').show();

		if (filterAjax) {
			filterAjax.abort();
		}

		filterAjax = jse.libs.xhr.ajax({
			url: options.requestUrl,
			data: formdata
		}, true).done(function (result) {
			// Update the filterbox and check if the products need to be updated automatically.
			// The elements will need to be converted again to checkbox widgets, so we will first
			// store them in a hidden div, convert them and then append them to the filter box 
			// (dirty fix because it is not otherwise possible without major refactoring ...)
			var checkboxes = $(result.content.filter.selector).find('input:checkbox').length,
			    $targets = $(result.content.filter.selector);

			if (checkboxes) {

				var $hiddenContainer = $('<div/>').appendTo('body').hide();
				// Copy the elements but leave a clone to the filter box element.
				$this.children().appendTo($hiddenContainer).clone().appendTo($this);

				jse.libs.template.helpers.fill(result.content, $hiddenContainer, options.selectorMapping);
				gambio.widgets.init($hiddenContainer);

				var intv = setInterval(function () {
					if ($hiddenContainer.find('.single-checkbox').length > 0) {
						$this.children().remove();
						$hiddenContainer.children().appendTo($this);
						$hiddenContainer.remove();

						$preloader.hide();
						if (options.autoUpdate) {
							_updateProducts(historyChange);
						}

						clearInterval(intv);
					}
				}, 300);
			} else {
				jse.libs.template.helpers.fill(result.content, $body, options.selectorMapping);
				gambio.widgets.init($targets);
				$preloader.hide();

				if (options.autoUpdate) {
					_updateProducts(historyChange);
				}
			}

			// reinitialize widgets in updated DOM
			window.gambio.widgets.init($this);
		}).fail(function () {
			if (tryCount < options.retries) {
				// Restart the update process if the
				// tryCount hasn't reached the maximum
				errorTimer = setTimeout(function () {
					_update(tryCount + 1, formdata, historyChange);
				}, options.retryDelay);
			} else {
				$preloader.addClass('error');
			}
		});
	};

	/**
  * Helper function that starts the filter
  * and page update process
  * @private
  */
	var _updateStart = function _updateStart(historyChange) {
		var dataset = jse.libs.form.getData($this);

		historyChange = historyChange !== undefined ? !!historyChange : true;

		_update(0, _transform(dataset, true), historyChange);
	};

	// ########## EVENT HANDLER #########

	/**
  * The submit event gets aborted
  * if the live update is set to true. Else
  * if the productlisiting filter shall be
  * kept, get the parameters from it and store
  * them in hidden input fields before submit
  * @param       {object}        e           jQuery event object
  * @private
  */
	var _submitHandler = function _submitHandler(e) {
		reset = false;

		if (options.autoUpdate) {
			e.preventDefault();
			e.stopPropagation();
		} else if (!options.resetProductlistingFilter) {
			jse.libs.form.addHiddenByUrl($this);
		}
	};

	/**
  * Event handler that gets triggered
  * on every change of an input field
  * inside the filter box. It starts the
  * update process after a short delay
  * @param       {object}        e           jQuery event object
  * @private
  */
	var _changeHandler = function _changeHandler(e) {
		e.preventDefault();
		e.stopPropagation();

		clearTimeout(updateTimer);
		clearTimeout(errorTimer);

		updateTimer = setTimeout(_updateStart, options.updateDelay);
	};

	/**
  * Event handler that reacts on the reset
  * button / event. Depending on the autoUpdate
  * setting the page gets reloaded or the form
  * / products gets updated
  * @param       {object}        e           jQuery event object
  * @private
  */
	var _resetHandler = function _resetHandler(e) {
		e.preventDefault();
		e.stopPropagation();

		jse.libs.form.reset($this);
		jse.libs.form.addHiddenByUrl($this);

		reset = true;

		if (options.autoUpdate) {
			_updateStart();
		} else {
			location.href = location.pathname + '?' + $this.serialize();
		}
	};

	/**
  * Handler that listens on the popstate event.
  * In a case of a popstate, the filter will change
  * to it's previous state and will update the page
  * @private
  */
	var _historyHandler = function _historyHandler() {
		jse.libs.form.reset($this);
		jse.libs.form.prefillForm($this, jse.libs.template.helpers.getUrlParams());
		_updateStart(false);
	};

	/**
  * Handler that listens on the click event
  * of a "more" button to show all filter options
  * @private
  */
	var _clickHandler = function _clickHandler() {
		$(this).parent().removeClass('collapsed');
		$(this).hide();
	};

	/**
  * Handler that listens on the click event
  * of a filter option link to trigger the
  * change event of the belonging hidden checkbox
  * 
  * @param e
  * @private
  */
	var _filterClickHandler = function _filterClickHandler(e) {
		var id = $(this).attr('rel');

		e.preventDefault();
		e.stopPropagation();

		$('#' + id).prop('checked', true).trigger('change');
	};

	// ########## INITIALIZATION ##########


	/**
  * Init function of the widget
  * @constructor
  */
	module.init = function (done) {
		$preloader = $this.find('.preloader, .preloader-message');
		$contentWrapper = $('.main-inside');
		historyAvailable = jse.core.config.get('history');

		// no auto update on start page
		if ($(options.selectorMapping.productsContainer).length === 0) {
			options.autoUpdate = false;
		}

		$this.on('change', 'select, input[type="checkbox"], input[type="text"]', _changeHandler).on('click', '.btn-link', _filterClickHandler).on('reset', _resetHandler).on('submit', _submitHandler).on('click', '.show-more', _clickHandler);

		$body.addClass('filterbox-enabled');

		done();
	};

	// Return data to widget engine
	return module;
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndpZGdldHMvZmlsdGVyLmpzIl0sIm5hbWVzIjpbImdhbWJpbyIsIndpZGdldHMiLCJtb2R1bGUiLCJkYXRhIiwiJHRoaXMiLCIkIiwiJGJvZHkiLCIkcHJlbG9hZGVyIiwiJGNvbnRlbnRXcmFwcGVyIiwiZXJyb3JUaW1lciIsInVwZGF0ZVRpbWVyIiwiZmlsdGVyQWpheCIsInByb2R1Y3RzQWpheCIsImhpc3RvcnlBdmFpbGFibGUiLCJyZXNldCIsImhpc3RvcnlQb3BzdGF0ZUV2ZW50QmluZGVkIiwiZGVmYXVsdHMiLCJyZXF1ZXN0VXJsIiwicmVzZXRQcm9kdWN0bGlzdGluZ0ZpbHRlciIsImF1dG9VcGRhdGUiLCJ1cGRhdGVEZWxheSIsInJldHJpZXMiLCJyZXRyeURlbGF5Iiwic2VsZWN0b3JNYXBwaW5nIiwiZmlsdGVyRm9ybSIsInByb2R1Y3RzQ29udGFpbmVyIiwiZmlsdGVyU2VsZWN0aW9uQ29udGFpbmVyIiwibGlzdGluZ1BhZ2luYXRpb24iLCJmaWx0ZXJIaWRkZW5Db250YWluZXIiLCJwYWdpbmF0aW9uSW5mbyIsIm9wdGlvbnMiLCJleHRlbmQiLCJfdXBkYXRlUHJvZHVjdHMiLCJoaXN0b3J5Q2hhbmdlIiwicmVzZXRQYXJhbSIsImFib3J0IiwiYWpheCIsInVybCIsInNlcmlhbGl6ZSIsIm1ldGhvZCIsImRhdGFUeXBlIiwiZG9uZSIsInJlc3VsdCIsInJlZGlyZWN0IiwibG9jYXRpb24iLCJocmVmIiwid2luZG93Iiwib24iLCJfaGlzdG9yeUhhbmRsZXIiLCJqc2UiLCJsaWJzIiwidGVtcGxhdGUiLCJoZWxwZXJzIiwiZmlsbCIsImNvbnRlbnQiLCIkcHJvZHVjdHNDb250YWluZXIiLCJhdHRyIiwiaW5pdCIsIiRwcm9kdWN0c0NvbnRhaW5lcldyYXBwZXIiLCJwYXJlbnQiLCJ1cmxQYXJhbWV0ZXIiLCJkZWNvZGVVUklDb21wb25lbnQiLCJoaXN0b3J5IiwicHVzaFN0YXRlIiwib3JpZ2luIiwicGF0aG5hbWUiLCJoYXNoIiwidHJpZ2dlciIsIl90cmFuc2Zvcm0iLCJkYXRhc2V0Iiwiam9pbiIsImVhY2giLCJmaWx0ZXJfZnZfaWQiLCJrZXkiLCJ2YWx1ZSIsInVuZGVmaW5lZCIsInZhbGlkIiwiayIsInYiLCJwdXNoIiwiX3VwZGF0ZSIsInRyeUNvdW50IiwiZm9ybWRhdGEiLCJyZW1vdmVDbGFzcyIsInNob3ciLCJ4aHIiLCJjaGVja2JveGVzIiwiZmlsdGVyIiwic2VsZWN0b3IiLCJmaW5kIiwibGVuZ3RoIiwiJHRhcmdldHMiLCIkaGlkZGVuQ29udGFpbmVyIiwiYXBwZW5kVG8iLCJoaWRlIiwiY2hpbGRyZW4iLCJjbG9uZSIsImludHYiLCJzZXRJbnRlcnZhbCIsInJlbW92ZSIsImNsZWFySW50ZXJ2YWwiLCJmYWlsIiwic2V0VGltZW91dCIsImFkZENsYXNzIiwiX3VwZGF0ZVN0YXJ0IiwiZm9ybSIsImdldERhdGEiLCJfc3VibWl0SGFuZGxlciIsImUiLCJwcmV2ZW50RGVmYXVsdCIsInN0b3BQcm9wYWdhdGlvbiIsImFkZEhpZGRlbkJ5VXJsIiwiX2NoYW5nZUhhbmRsZXIiLCJjbGVhclRpbWVvdXQiLCJfcmVzZXRIYW5kbGVyIiwicHJlZmlsbEZvcm0iLCJnZXRVcmxQYXJhbXMiLCJfY2xpY2tIYW5kbGVyIiwiX2ZpbHRlckNsaWNrSGFuZGxlciIsImlkIiwicHJvcCIsImNvcmUiLCJjb25maWciLCJnZXQiXSwibWFwcGluZ3MiOiI7Ozs7QUFBQTs7Ozs7Ozs7OztBQVVBQSxPQUFPQyxPQUFQLENBQWVDLE1BQWYsQ0FDQyxRQURELEVBR0MsQ0FBQyxNQUFELEVBQVMsS0FBVCxDQUhELEVBS0MsVUFBU0MsSUFBVCxFQUFlOztBQUVkOztBQUVGOztBQUVFLEtBQUlDLFFBQVFDLEVBQUUsSUFBRixDQUFaO0FBQUEsS0FDQ0MsUUFBUUQsRUFBRSxNQUFGLENBRFQ7QUFBQSxLQUVDRSxhQUFhLElBRmQ7QUFBQSxLQUdDQyxrQkFBa0IsSUFIbkI7QUFBQSxLQUlDQyxhQUFhLElBSmQ7QUFBQSxLQUtDQyxjQUFjLElBTGY7QUFB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LElBQVQsRUFBZTtBQUM1QmxDLGVBQWFILE1BQU1xRixJQUFOLENBQVcsZ0NBQVgsQ0FBYjtBQUNBakYsb0JBQWtCSCxFQUFFLGNBQUYsQ0FBbEI7QUFDQVEscUJBQW1Cb0MsSUFBSXdFLElBQUosQ0FBU0MsTUFBVCxDQUFnQkMsR0FBaEIsQ0FBb0IsU0FBcEIsQ0FBbkI7O0FBRUE7QUFDQSxNQUFHdEgsRUFBRXlCLFFBQVFQLGVBQVIsQ0FBd0JFLGlCQUExQixFQUE2Q2lFLE1BQTdDLEtBQXdELENBQTNELEVBQThEO0FBQzdENUQsV0FBUVgsVUFBUixHQUFxQixLQUFyQjtBQUNBOztBQUVEZixRQUNFMkMsRUFERixDQUNLLFFBREwsRUFDZSxvREFEZixFQUNxRWlFLGNBRHJFLEVBRUVqRSxFQUZGLENBRUssT0FGTCxFQUVjLFdBRmQsRUFFMkJ1RSxtQkFGM0IsRUFHRXZFLEVBSEYsQ0FHSyxPQUhMLEVBR2NtRSxhQUhkLEVBSUVuRSxFQUpGLENBSUssUUFKTCxFQUllNEQsY0FKZixFQUtFNUQsRUFMRixDQUtLLE9BTEwsRUFLYyxZQUxkLEVBSzRCc0UsYUFMNUI7O0FBT0EvRyxRQUFNaUcsUUFBTixDQUFlLG1CQUFmOztBQUVBOUQ7QUFDQSxFQXBCRDs7QUFzQkE7QUFDQSxRQUFPdkMsTUFBUDtBQUNBLENBL1lGIiwiZmlsZSI6IndpZGdldHMvZmlsdGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiBmaWx0ZXIuanMgMjAxNi0xMS0xOFxuIEdhbWJpbyBHbWJIXG4gaHR0cDovL3d3dy5nYW1iaW8uZGVcbiBDb3B5cmlnaHQgKGMpIDIwMTYgR2FtYmlvIEdtYkhcbiBSZWxlYXNlZCB1bmRlciB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgKFZlcnNpb24gMilcbiBbaHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzL2dwbC0yLjAuaHRtbF1cbiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICovXG5cbmdhbWJpby53aWRnZXRzLm1vZHVsZShcblx0J2ZpbHRlcicsXG5cblx0Wydmb3JtJywgJ3hociddLFxuXG5cdGZ1bmN0aW9uKGRhdGEpIHtcblxuXHRcdCd1c2Ugc3RyaWN0JztcblxuLy8gIyMjIyMjIyMjIyBWQVJJQUJMRSBJTklUSUFMSVpBVElPTiAjIyMjIyMjIyMjXG5cblx0XHR2YXIgJHRoaXMgPSAkKHRoaXMpLFxuXHRcdFx0JGJvZHkgPSAkKCdib2R5JyksXG5cdFx0XHQkcHJlbG9hZGVyID0gbnVsbCxcblx0XHRcdCRjb250ZW50V3JhcHBlciA9IG51bGwsXG5cdFx0XHRlcnJvclRpbWVyID0gbnVsbCxcblx0XHRcdHVwZGF0ZVRpbWVyID0gbnVsbCxcblx0XHRcdGZpbHRlckFqYXggPSBudWxsLFxuXHRcdFx0cHJvZHVjdHNBamF4ID0gbnVsbCxcblx0XHRcdGhpc3RvcnlBdmFpbGFibGUgPSBmYWxzZSxcblx0XHRcdHJlc2V0ID0gZmFsc2UsXG5cdFx0XHRoaXN0b3J5UG9wc3RhdGVFdmVudEJpbmRlZCA9IGZhbHNlLFxuXHRcdFx0ZGVmYXVsdHMgPSB7XG5cdFx0XHRcdC8vIFRoZSB1cmwgdGhlIGFqYXggcmVxdWVzdCBleGVjdXRlIGFnYWluc3Rcblx0XHRcdFx0cmVxdWVzdFVybDogJ3Nob3AucGhwP2RvPUZpbHRlcicsXG5cdFx0XHRcdC8vIElmIGF1dG9VcGRhdGUgaXMgZmFsc2UsIGFuZCB0aGlzIGlzIHRydWUgdGhlIHByb2R1Y3QgbGlzdGluZyBmaWx0ZXIgd2lsbCBiZSBzZXQgdG8gZGVmYXVsdCBcblx0XHRcdFx0Ly8gb24gcGFnZSByZWxvYWRcblx0XHRcdFx0cmVzZXRQcm9kdWN0bGlzdGluZ0ZpbHRlcjogZmFsc2UsXG5cdFx0XHRcdC8vIElmIHRydWUsIHRoZSBwcm9kdWN0IGxpc3QgZ2V0cyB1cGRhdGVkIGR5bmFtaWNhbGx5XG5cdFx0XHRcdGF1dG9VcGRhdGU6IHRydWUsXG5cdFx0XHRcdC8vIFRoZSBkZWxheSBhZnRlciBhIGNoYW5nZSBldmVudCBiZWZvcmUgYW4gYWpheCBnZXRzIGV4ZWN1dGVkXG5cdFx0XHRcdHVwZGF0ZURlbGF5OiAyMDAsXG5cdFx0XHRcdC8vIFRoZSBtYXhpbXVtIG51bWJlciBvZiByZXRyaWVzIGFmdGVyIGZhaWx1cmVzXG5cdFx0XHRcdHJldHJpZXM6IDIsXG5cdFx0XHRcdC8vIEFmdGVyIHdoaWNoIGRlbGF5IHRoZSBuZXggdHJ5IHdpbGwgYmUgZG9uZVxuXHRcdFx0XHRyZXRyeURlbGF5OiA1MDAsXG5cdFx0XHRcdFxuXHRcdFx0XHRzZWxlY3Rvck1hcHBpbmc6IHtcblx0XHRcdFx0XHRmaWx0ZXJGb3JtOiAnLmZpbHRlci1ib3gtZm9ybS13cmFwcGVyJyxcblx0XHRcdFx0XHRwcm9kdWN0c0NvbnRhaW5lcjogJy5wcm9kdWN0LWZpbHRlci10YXJnZXQnLFxuXHRcdFx0XHRcdGZpbHRlclNlbGVjdGlvbkNvbnRhaW5lcjogJy5maWx0ZXItc2VsZWN0aW9uLWNvbnRhaW5lcicsXG5cdFx0XHRcdFx0bGlzdGluZ1BhZ2luYXRpb246ICcucHJvZHVjdGxpc3RpbmctZmlsdGVyLWNvbnRhaW5lciAucGFuZWwtcGFnaW5hdGlvbicsXG5cdFx0XHRcdFx0ZmlsdGVySGlkZGVuQ29udGFpbmVyOiAnLnByb2R1Y3RsaXN0aW5nLWZpbHRlci1jb250YWluZXIgLnByb2R1Y3RsaXN0aW5nLWZpbHRlci1oaWRkZW5zJyxcblx0XHRcdFx0XHRwYWdpbmF0aW9uSW5mbzogJy5wYWdpbmF0aW9uLWluZm8nXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzLCBkYXRhKSxcblx0XHRcdG1vZHVsZSA9IHt9O1xuXG5cblx0XHQvKlxuXHRcdCB2YXIgdl9zZWxlY3RlZF92YWx1ZXNfZ3JvdXAgPSBuZXcgQXJyYXkoKTtcblx0XHQgJChcIiNtZW51Ym94X2JvZHlfc2hhZG93XCIpLmZpbmQoXCJzcGFuXCIpLmxpdmUoXCJjbGlja1wiLCBmdW5jdGlvbigpXG5cdFx0IHtcdFx0XG5cdFx0ICQoXCIjbWVudWJveF9ib2R5X3NoYWRvd1wiKS5yZW1vdmVDbGFzcyhcImVycm9yXCIpLmh0bWwoXCJcIik7XG5cblx0XHQgZ2V0X3NlbGVjdGVkX3ZhbHVlcygpO1xuXHRcdCBnZXRfYXZhaWxhYmxlX3ZhbHVlcygwKTtcblx0XHQgfSk7XG5cblx0XHQgJChcIiNtZW51Ym94X2ZpbHRlciAuZmlsdGVyX2ZlYXR1cmVzX2xpbmsubGlua19saXN0XCIpLmxpdmUoXCJjbGlja1wiLCBmdW5jdGlvbigpe1xuXHRcdCB2YXIgdF9mZWF0dXJlX3ZhbHVlX2lkID0gJCh0aGlzKS5hdHRyKFwicmVsXCIpO1xuXHRcdCAkKCBcIiNcIit0X2ZlYXR1cmVfdmFsdWVfaWQgKS50cmlnZ2VyKFwiY2xpY2tcIik7XG5cdFx0IHJldHVybiBmYWxzZTtcblx0XHQgKi9cblxuLy8gIyMjIyMjIyMjIyBIRUxQRVIgRlVOQ1RJT05TICMjIyMjIyMjIyNcblxuXHRcdC8qKlxuXHRcdCAqIEhlbHBlciBmdW5jdGlvbiB0aGF0IHVwZGF0ZXMgdGhlIHByb2R1Y3QgbGlzdFxuXHRcdCAqIGFuZCB0aGUgcGFnaW5hdGlvbiBmb3IgdGhlIGZpbHRlci5cblx0XHQgKiBAcGFyYW0gZmlsdGVyUmVzdWx0XG5cdFx0ICogQHByaXZhdGVcblx0XHQgKi9cblx0XHR2YXIgX3VwZGF0ZVByb2R1Y3RzID0gZnVuY3Rpb24oaGlzdG9yeUNoYW5nZSkge1xuXHRcdFx0dmFyIHJlc2V0UGFyYW0gPSAnJztcblx0XHRcdFxuXHRcdFx0aWYgKHByb2R1Y3RzQWpheCkge1xuXHRcdFx0XHRwcm9kdWN0c0FqYXguYWJvcnQoKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHJlc2V0KSB7XG5cdFx0XHRcdHJlc2V0UGFyYW0gPSAnJnJlc2V0PXRydWUnO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHQvLyBDYWxsIHRoZSByZXF1ZXN0IGFqYXggYW5kIGZpbGwgdGhlIHBhZ2Ugd2l0aCB0aGUgZGVsaXZlcmVkIGRhdGFcblx0XHRcdHByb2R1Y3RzQWpheCA9ICQuYWpheCh7XG5cdFx0XHRcdCAgICAgICAgICAgICAgICAgICAgICB1cmw6IG9wdGlvbnMucmVxdWVzdFVybCArICcvR2V0TGlzdGluZyYnICsgJHRoaXMuc2VyaWFsaXplKCkgKyByZXNldFBhcmFtLFxuXHRcdFx0XHQgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcblx0XHRcdFx0ICAgICAgICAgICAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbidcblx0XHRcdCAgICAgICAgICAgICAgICAgICAgICB9KS5kb25lKGZ1bmN0aW9uKHJlc3VsdCkge1xuXHRcdFx0XHRcblx0XHRcdCAgICAvLyByZWRpcmVjdCBpZiBmaWx0ZXIgaGFzIGJlZW4gcmVzZXQgICAgICAgICAgICAgIFx0XG5cdFx0XHRcdGlmICh0eXBlb2YgcmVzdWx0LnJlZGlyZWN0ICE9PSAndW5kZWZpbmVkJykge1xuXHRcdFx0XHRcdGxvY2F0aW9uLmhyZWYgPSByZXN1bHQucmVkaXJlY3Q7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cdFx0XHRcdFxuXHRcdFx0XHQvLyBiaW5kIF9oaXN0b3J5SGFuZGxlciBmdW5jdGlvbiBvbiBwb3BzdGF0ZSBldmVudCBub3QgZWFybGllciB0aGFuIGZpcnN0IHBhZ2VkIGNvbnRlbnQgY2hhbmdlIHRvIFxuXHRcdFx0XHQvLyBwcmV2ZW50IGVuZGxlc3MgcG9wc3RhdGUgZXZlbnQgdHJpZ2dlcmluZyBidWcgb24gbW9iaWxlIGRldmljZXNcblx0XHRcdFx0aWYgKCFoaXN0b3J5UG9wc3RhdGVFdmVudEJpbmRlZCAmJiBvcHRpb25zLmF1dG9VcGRhdGUpIHtcblx0XHRcdFx0XHQkKHdpbmRvdykub24oJ3BvcHN0YXRlJywgX2hpc3RvcnlIYW5kbGVyKTtcblx0XHRcdFx0XHRoaXN0b3J5UG9wc3RhdGVFdmVudEJpbmRlZCA9IHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHRcdGpzZS5saWJzLnRlbXBsYXRlLmhlbHBlcnMuZmlsbChyZXN1bHQuY29udGVudCwgJGNvbnRlbnRXcmFwcGVyLCBvcHRpb25zLnNlbGVjdG9yTWFwcGluZyk7XG5cdFx0XHRcdFxuXHRcdFx0XHR2YXIgJHByb2R1Y3RzQ29udGFpbmVyID0gJChvcHRpb25zLnNlbGVjdG9yTWFwcGluZy5wcm9kdWN0c0NvbnRhaW5lcik7XG5cdFx0XHRcdFxuXHRcdFx0XHQkcHJvZHVjdHNDb250YWluZXIuYXR0cignZGF0YS1nYW1iaW8td2lkZ2V0JywgJ2NhcnRfaGFuZGxlcicpO1xuXHRcdFx0XHRnYW1iaW8ud2lkZ2V0cy5pbml0KCRwcm9kdWN0c0NvbnRhaW5lcik7XG5cdFx0XHRcdFxuXHRcdFx0XHR2YXIgJHByb2R1Y3RzQ29udGFpbmVyV3JhcHBlciA9ICQob3B0aW9ucy5zZWxlY3Rvck1hcHBpbmcucHJvZHVjdHNDb250YWluZXIpLnBhcmVudCgnZGl2Jyk7XG5cdFx0XHRcdFxuXHRcdFx0XHQkcHJvZHVjdHNDb250YWluZXJXcmFwcGVyLmF0dHIoJ2RhdGEtZ2FtYmlvLXdpZGdldCcsICdwcm9kdWN0X2hvdmVyJyk7XG5cdFx0XHRcdCRwcm9kdWN0c0NvbnRhaW5lcldyYXBwZXIuYXR0cignZGF0YS1wcm9kdWN0X2hvdmVyLXNjb3BlJywgJy5wcm9kdWN0bGlzdC12aWV3bW9kZS1ncmlkJyk7XG5cdFx0XHRcdGdhbWJpby53aWRnZXRzLmluaXQoJHByb2R1Y3RzQ29udGFpbmVyV3JhcHBlcik7XG5cdFx0XHRcdFxuXHRcdFx0XHRpZiAoaGlzdG9yeUF2YWlsYWJsZSAmJiBoaXN0b3J5Q2hhbmdlKSB7XG5cdFx0XHRcdFx0dmFyIHVybFBhcmFtZXRlciA9IGRlY29kZVVSSUNvbXBvbmVudCgkdGhpcy5zZXJpYWxpemUoKSk7XG5cblx0XHRcdFx0XHRoaXN0b3J5LnB1c2hTdGF0ZSh7fSwgJ2ZpbHRlcicsIGxvY2F0aW9uLm9yaWdpbiArIGxvY2F0aW9uLnBhdGhuYW1lICsgJz8nICsgdXJsUGFyYW1ldGVyXG5cdFx0XHRcdFx0ICAgICAgICAgICAgICAgICAgKyBsb2NhdGlvbi5oYXNoKTtcblx0XHRcdFx0XHQkdGhpcy50cmlnZ2VyKCdwdXNoc3RhdGUnLCBbXSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0JHRoaXMudHJpZ2dlcigncHVzaHN0YXRlX25vX2hpc3RvcnknLCBbXSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBIZWxwZXIgZnVuY3Rpb24gdGhhdCB0cmFuc2Zvcm1zIHRoZSBmaWx0ZXJcblx0XHQgKiBzZXR0aW5ncyB0byBhIGZvcm1hdCB0aGF0IGlzIHJlYWRhYmxlIGJ5XG5cdFx0ICogdGhlIGJhY2tlbmRcblx0XHQgKiBAcGFyYW0gICAgICAge29iamVjdH0gICAgICAgIGRhdGFzZXQgICAgICAgICAgICAgVGhlIGZvcm1kYXRhIHRoYXQgY29udGFpbnMgdGhlIGZpbHRlciBzZXR0aW5nc1xuXHRcdCAqIEByZXR1cm4gICAgIHsqfSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRoZSB0cmFuc2Zvcm1lZCBmb3JtIGRhdGFcblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqL1xuXHRcdHZhciBfdHJhbnNmb3JtID0gZnVuY3Rpb24oZGF0YXNldCwgam9pbikge1xuXHRcdFx0dmFyIHJlc3VsdCA9IFtdO1xuXHRcdFx0JC5lYWNoKGRhdGFzZXQuZmlsdGVyX2Z2X2lkLCBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG5cdFx0XHRcdGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBmYWxzZSkge1xuXG5cdFx0XHRcdFx0aWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpIHtcblx0XHRcdFx0XHRcdHZhciB2YWxpZCA9IFtdO1xuXHRcdFx0XHRcdFx0JC5lYWNoKHZhbHVlLCBmdW5jdGlvbihrLCB2KSB7XG5cdFx0XHRcdFx0XHRcdGlmICh2ICE9PSBmYWxzZSkge1xuXHRcdFx0XHRcdFx0XHRcdHZhbGlkLnB1c2godik7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0aWYgKGpvaW4pIHtcblx0XHRcdFx0XHRcdFx0cmVzdWx0LnB1c2goa2V5ICsgJzonICsgdmFsaWQuam9pbignfCcpKTtcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdHJlc3VsdFtrZXldID0gcmVzdWx0W2tleV0gfHwgW107XG5cdFx0XHRcdFx0XHRcdHJlc3VsdFtrZXldID0gdmFsaWQ7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHJlc3VsdC5wdXNoKGtleSArICc6JyArIHZhbHVlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHRkYXRhc2V0LmZpbHRlcl9mdl9pZCA9IChqb2luKSA/IHJlc3VsdC5qb2luKCcmJykgOiByZXN1bHQ7XG5cblx0XHRcdHJldHVybiBkYXRhc2V0O1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBIZWxwZXIgZnVuY3Rpb24gdGhhdCBjYWxscyB0aGUgdXBkYXRlXG5cdFx0ICogYWpheCBhbmQgcmVwbGFjZXMgdGhlIGZpbHRlciBib3ggd2l0aFxuXHRcdCAqIHRoZSBuZXcgZm9ybVxuXHRcdCAqIEBwYXJhbSAgICAgICB7aW50ZWdlcn0gICAgICAgdHJ5Q291bnQgICAgICAgIFRoZSBjb3VudCBob3cgb2Z0ZW4gdGhlIGFqYXggaGFzIGZhaWxlZFxuXHRcdCAqIEBwYXJhbSAgICAgICB7b2JqZWN0fSAgICAgICAgZm9ybWRhdGEgICAgICAgIFRoZSByZWFkeSB0byB1c2UgZGF0YSBmcm9tIHRoZSBmb3JtXG5cdFx0ICogQHBhcmFtICAgICAgIHtib29sZWFufSAgICAgICBoaXN0b3J5Q2hhbmdlICAgSWYgdHJ1ZSwgdGhlIGhpc3Rvcnkgd2lsbCBiZSB1cGR0ZWQgYWZ0ZXIgdGhlIGxpc3QgdXBkYXRlIChpZiBwb3NzaWJsZSlcblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqL1xuXHRcdHZhciBfdXBkYXRlID0gZnVuY3Rpb24odHJ5Q291bnQsIGZvcm1kYXRhLCBoaXN0b3J5Q2hhbmdlKSB7XG5cblx0XHRcdCRwcmVsb2FkZXJcblx0XHRcdFx0LnJlbW92ZUNsYXNzKCdlcnJvcicpXG5cdFx0XHRcdC5zaG93KCk7XG5cblx0XHRcdGlmIChmaWx0ZXJBamF4KSB7XG5cdFx0XHRcdGZpbHRlckFqYXguYWJvcnQoKTtcblx0XHRcdH1cblxuXHRcdFx0ZmlsdGVyQWpheCA9IGpzZS5saWJzLnhoci5hamF4KHtcblx0XHRcdFx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVybDogb3B0aW9ucy5yZXF1ZXN0VXJsLFxuXHRcdFx0XHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogZm9ybWRhdGFcblx0XHRcdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCB0cnVlKS5kb25lKGZ1bmN0aW9uKHJlc3VsdCkge1xuXHRcdFx0XHQvLyBVcGRhdGUgdGhlIGZpbHRlcmJveCBhbmQgY2hlY2sgaWYgdGhlIHByb2R1Y3RzIG5lZWQgdG8gYmUgdXBkYXRlZCBhdXRvbWF0aWNhbGx5LlxuXHRcdFx0XHQvLyBUaGUgZWxlbWVudHMgd2lsbCBuZWVkIHRvIGJlIGNvbnZlcnRlZCBhZ2FpbiB0byBjaGVja2JveCB3aWRnZXRzLCBzbyB3ZSB3aWxsIGZpcnN0XG5cdFx0XHRcdC8vIHN0b3JlIHRoZW0gaW4gYSBoaWRkZW4gZGl2LCBjb252ZXJ0IHRoZW0gYW5kIHRoZW4gYXBwZW5kIHRoZW0gdG8gdGhlIGZpbHRlciBib3ggXG5cdFx0XHRcdC8vIChkaXJ0eSBmaXggYmVjYXVzZSBpdCBpcyBub3Qgb3RoZXJ3aXNlIHBvc3NpYmxlIHdpdGhvdXQgbWFqb3IgcmVmYWN0b3JpbmcgLi4uKVxuXHRcdFx0XHR2YXIgY2hlY2tib3hlcyA9ICQocmVzdWx0LmNvbnRlbnQuZmlsdGVyLnNlbGVjdG9yKVxuXHRcdFx0XHRcdC5maW5kKCdpbnB1dDpjaGVja2JveCcpXG5cdFx0XHRcdFx0XHQubGVuZ3RoLFxuXHRcdFx0XHRcdCR0YXJnZXRzID0gJChyZXN1bHQuY29udGVudC5maWx0ZXIuc2VsZWN0b3IpO1xuXG5cdFx0XHRcdGlmIChjaGVja2JveGVzKSB7XG5cblx0XHRcdFx0XHR2YXIgJGhpZGRlbkNvbnRhaW5lciA9ICQoJzxkaXYvPicpLmFwcGVuZFRvKCdib2R5JykuaGlkZSgpO1xuXHRcdFx0XHRcdC8vIENvcHkgdGhlIGVsZW1lbnRzIGJ1dCBsZWF2ZSBhIGNsb25lIHRvIHRoZSBmaWx0ZXIgYm94IGVsZW1lbnQuXG5cdFx0XHRcdFx0JHRoaXMuY2hpbGRyZW4oKS5hcHBlbmRUbygkaGlkZGVuQ29udGFpbmVyKS5jbG9uZSgpLmFwcGVuZFRvKCR0aGlzKTtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHRqc2UubGlicy50ZW1wbGF0ZS5oZWxwZXJzLmZpbGwocmVzdWx0LmNvbnRlbnQsICRoaWRkZW5Db250YWluZXIsIG9wdGlvbnMuc2VsZWN0b3JNYXBwaW5nKTtcblx0XHRcdFx0XHRnYW1iaW8ud2lkZ2V0cy5pbml0KCRoaWRkZW5Db250YWluZXIpO1xuXG5cdFx0XHRcdFx0dmFyIGludHYgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdGlmICgkaGlkZGVuQ29udGFpbmVyLmZpbmQoJy5zaW5nbGUtY2hlY2tib3gnKS5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdFx0XHRcdCR0aGlzLmNoaWxkcmVuKCkucmVtb3ZlKCk7XG5cdFx0XHRcdFx0XHRcdCRoaWRkZW5Db250YWluZXIuY2hpbGRyZW4oKS5hcHBlbmRUbygkdGhpcyk7XG5cdFx0XHRcdFx0XHRcdCRoaWRkZW5Db250YWluZXIucmVtb3ZlKCk7XG5cblx0XHRcdFx0XHRcdFx0JHByZWxvYWRlci5oaWRlKCk7XG5cdFx0XHRcdFx0XHRcdGlmIChvcHRpb25zLmF1dG9VcGRhdGUpIHtcblx0XHRcdFx0XHRcdFx0XHRfdXBkYXRlUHJvZHVjdHMoaGlzdG9yeUNoYW5nZSk7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRjbGVhckludGVydmFsKGludHYpO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0fSwgMzAwKTtcblxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGpzZS5saWJzLnRlbXBsYXRlLmhlbHBlcnMuZmlsbChyZXN1bHQuY29udGVudCwgJGJvZHksIG9wdGlvbnMuc2VsZWN0b3JNYXBwaW5nKTtcblx0XHRcdFx0XHRnYW1iaW8ud2lkZ2V0cy5pbml0KCR0YXJnZXRzKTtcblx0XHRcdFx0XHQkcHJlbG9hZGVyLmhpZGUoKTtcblxuXHRcdFx0XHRcdGlmIChvcHRpb25zLmF1dG9VcGRhdGUpIHtcblx0XHRcdFx0XHRcdF91cGRhdGVQcm9kdWN0cyhoaXN0b3J5Q2hhbmdlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHRcdC8vIHJlaW5pdGlhbGl6ZSB3aWRnZXRzIGluIHVwZGF0ZWQgRE9NXG5cdFx0XHRcdHdpbmRvdy5nYW1iaW8ud2lkZ2V0cy5pbml0KCR0aGlzKTtcblx0XHRcdFx0XG5cdFx0XHR9KS5mYWlsKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRpZiAodHJ5Q291bnQgPCBvcHRpb25zLnJldHJpZXMpIHtcblx0XHRcdFx0XHQvLyBSZXN0YXJ0IHRoZSB1cGRhdGUgcHJvY2VzcyBpZiB0aGVcblx0XHRcdFx0XHQvLyB0cnlDb3VudCBoYXNuJ3QgcmVhY2hlZCB0aGUgbWF4aW11bVxuXHRcdFx0XHRcdGVycm9yVGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0X3VwZGF0ZSh0cnlDb3VudCArIDEsIGZvcm1kYXRhLCBoaXN0b3J5Q2hhbmdlKTtcblx0XHRcdFx0XHR9LCBvcHRpb25zLnJldHJ5RGVsYXkpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdCRwcmVsb2FkZXIuYWRkQ2xhc3MoJ2Vycm9yJyk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIEhlbHBlciBmdW5jdGlvbiB0aGF0IHN0YXJ0cyB0aGUgZmlsdGVyXG5cdFx0ICogYW5kIHBhZ2UgdXBkYXRlIHByb2Nlc3Ncblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqL1xuXHRcdHZhciBfdXBkYXRlU3RhcnQgPSBmdW5jdGlvbihoaXN0b3J5Q2hhbmdlKSB7XG5cdFx0XHR2YXIgZGF0YXNldCA9IGpzZS5saWJzLmZvcm0uZ2V0RGF0YSgkdGhpcyk7XG5cblx0XHRcdGhpc3RvcnlDaGFuZ2UgPSAoaGlzdG9yeUNoYW5nZSAhPT0gdW5kZWZpbmVkKSA/ICEhaGlzdG9yeUNoYW5nZSA6IHRydWU7XG5cblx0XHRcdF91cGRhdGUoMCwgX3RyYW5zZm9ybShkYXRhc2V0LCB0cnVlKSwgaGlzdG9yeUNoYW5nZSk7XG5cdFx0fTtcblxuXG4vLyAjIyMjIyMjIyMjIEVWRU5UIEhBTkRMRVIgIyMjIyMjIyMjXG5cblx0XHQvKipcblx0XHQgKiBUaGUgc3VibWl0IGV2ZW50IGdldHMgYWJvcnRlZFxuXHRcdCAqIGlmIHRoZSBsaXZlIHVwZGF0ZSBpcyBzZXQgdG8gdHJ1ZS4gRWxzZVxuXHRcdCAqIGlmIHRoZSBwcm9kdWN0bGlzaXRpbmcgZmlsdGVyIHNoYWxsIGJlXG5cdFx0ICoga2VwdCwgZ2V0IHRoZSBwYXJhbWV0ZXJzIGZyb20gaXQgYW5kIHN0b3JlXG5cdFx0ICogdGhlbSBpbiBoaWRkZW4gaW5wdXQgZmllbGRzIGJlZm9yZSBzdWJtaXRcblx0XHQgKiBAcGFyYW0gICAgICAge29iamVjdH0gICAgICAgIGUgICAgICAgICAgIGpRdWVyeSBldmVudCBvYmplY3Rcblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqL1xuXHRcdHZhciBfc3VibWl0SGFuZGxlciA9IGZ1bmN0aW9uKGUpIHtcblx0XHRcdHJlc2V0ID0gZmFsc2U7XG5cdFx0XHRcblx0XHRcdGlmIChvcHRpb25zLmF1dG9VcGRhdGUpIHtcblx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdFx0fSBlbHNlIGlmICghb3B0aW9ucy5yZXNldFByb2R1Y3RsaXN0aW5nRmlsdGVyKSB7XG5cdFx0XHRcdGpzZS5saWJzLmZvcm0uYWRkSGlkZGVuQnlVcmwoJHRoaXMpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBFdmVudCBoYW5kbGVyIHRoYXQgZ2V0cyB0cmlnZ2VyZWRcblx0XHQgKiBvbiBldmVyeSBjaGFuZ2Ugb2YgYW4gaW5wdXQgZmllbGRcblx0XHQgKiBpbnNpZGUgdGhlIGZpbHRlciBib3guIEl0IHN0YXJ0cyB0aGVcblx0XHQgKiB1cGRhdGUgcHJvY2VzcyBhZnRlciBhIHNob3J0IGRlbGF5XG5cdFx0ICogQHBhcmFtICAgICAgIHtvYmplY3R9ICAgICAgICBlICAgICAgICAgICBqUXVlcnkgZXZlbnQgb2JqZWN0XG5cdFx0ICogQHByaXZhdGVcblx0XHQgKi9cblx0XHR2YXIgX2NoYW5nZUhhbmRsZXIgPSBmdW5jdGlvbihlKSB7XG5cdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXG5cdFx0XHRjbGVhclRpbWVvdXQodXBkYXRlVGltZXIpO1xuXHRcdFx0Y2xlYXJUaW1lb3V0KGVycm9yVGltZXIpO1xuXG5cdFx0XHR1cGRhdGVUaW1lciA9IHNldFRpbWVvdXQoX3VwZGF0ZVN0YXJ0LCBvcHRpb25zLnVwZGF0ZURlbGF5KTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogRXZlbnQgaGFuZGxlciB0aGF0IHJlYWN0cyBvbiB0aGUgcmVzZXRcblx0XHQgKiBidXR0b24gLyBldmVudC4gRGVwZW5kaW5nIG9uIHRoZSBhdXRvVXBkYXRlXG5cdFx0ICogc2V0dGluZyB0aGUgcGFnZSBnZXRzIHJlbG9hZGVkIG9yIHRoZSBmb3JtXG5cdFx0ICogLyBwcm9kdWN0cyBnZXRzIHVwZGF0ZWRcblx0XHQgKiBAcGFyYW0gICAgICAge29iamVjdH0gICAgICAgIGUgICAgICAgICAgIGpRdWVyeSBldmVudCBvYmplY3Rcblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqL1xuXHRcdHZhciBfcmVzZXRIYW5kbGVyID0gZnVuY3Rpb24oZSkge1xuXHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblxuXHRcdFx0anNlLmxpYnMuZm9ybS5yZXNldCgkdGhpcyk7XG5cdFx0XHRqc2UubGlicy5mb3JtLmFkZEhpZGRlbkJ5VXJsKCR0aGlzKTtcblxuXHRcdFx0cmVzZXQgPSB0cnVlO1xuXHRcdFx0XG5cdFx0XHRpZiAob3B0aW9ucy5hdXRvVXBkYXRlKSB7XG5cdFx0XHRcdF91cGRhdGVTdGFydCgpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0bG9jYXRpb24uaHJlZiA9IGxvY2F0aW9uLnBhdGhuYW1lICsgJz8nICsgJHRoaXMuc2VyaWFsaXplKCk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIEhhbmRsZXIgdGhhdCBsaXN0ZW5zIG9uIHRoZSBwb3BzdGF0ZSBldmVudC5cblx0XHQgKiBJbiBhIGNhc2Ugb2YgYSBwb3BzdGF0ZSwgdGhlIGZpbHRlciB3aWxsIGNoYW5nZVxuXHRcdCAqIHRvIGl0J3MgcHJldmlvdXMgc3RhdGUgYW5kIHdpbGwgdXBkYXRlIHRoZSBwYWdlXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKi9cblx0XHR2YXIgX2hpc3RvcnlIYW5kbGVyID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRqc2UubGlicy5mb3JtLnJlc2V0KCR0aGlzKTtcblx0XHRcdGpzZS5saWJzLmZvcm0ucHJlZmlsbEZvcm0oJHRoaXMsIGpzZS5saWJzLnRlbXBsYXRlLmhlbHBlcnMuZ2V0VXJsUGFyYW1zKCkpO1xuXHRcdFx0X3VwZGF0ZVN0YXJ0KGZhbHNlKTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogSGFuZGxlciB0aGF0IGxpc3RlbnMgb24gdGhlIGNsaWNrIGV2ZW50XG5cdFx0ICogb2YgYSBcIm1vcmVcIiBidXR0b24gdG8gc2hvdyBhbGwgZmlsdGVyIG9wdGlvbnNcblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqL1xuXHRcdHZhciBfY2xpY2tIYW5kbGVyID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQkKHRoaXMpLnBhcmVudCgpLnJlbW92ZUNsYXNzKCdjb2xsYXBzZWQnKTtcblx0XHRcdCQodGhpcykuaGlkZSgpO1xuXHRcdH07XG5cdFx0XG5cdFx0LyoqXG5cdFx0ICogSGFuZGxlciB0aGF0IGxpc3RlbnMgb24gdGhlIGNsaWNrIGV2ZW50XG5cdFx0ICogb2YgYSBmaWx0ZXIgb3B0aW9uIGxpbmsgdG8gdHJpZ2dlciB0aGVcblx0XHQgKiBjaGFuZ2UgZXZlbnQgb2YgdGhlIGJlbG9uZ2luZyBoaWRkZW4gY2hlY2tib3hcblx0XHQgKiBcblx0XHQgKiBAcGFyYW0gZVxuXHRcdCAqIEBwcml2YXRlXG5cdFx0ICovXG5cdFx0dmFyIF9maWx0ZXJDbGlja0hhbmRsZXIgPSBmdW5jdGlvbihlKSB7XG5cdFx0XHR2YXIgaWQgPSAkKHRoaXMpLmF0dHIoJ3JlbCcpO1xuXHRcdFx0XG5cdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdFx0XG5cdFx0XHQkKCcjJyArIGlkKS5wcm9wKCdjaGVja2VkJywgdHJ1ZSkudHJpZ2dlcignY2hhbmdlJyk7XG5cdFx0fTtcblxuLy8gIyMjIyMjIyMjIyBJTklUSUFMSVpBVElPTiAjIyMjIyMjIyMjXG5cblxuXHRcdC8qKlxuXHRcdCAqIEluaXQgZnVuY3Rpb24gb2YgdGhlIHdpZGdldFxuXHRcdCAqIEBjb25zdHJ1Y3RvclxuXHRcdCAqL1xuXHRcdG1vZHVsZS5pbml0ID0gZnVuY3Rpb24oZG9uZSkge1xuXHRcdFx0JHByZWxvYWRlciA9ICR0aGlzLmZpbmQoJy5wcmVsb2FkZXIsIC5wcmVsb2FkZXItbWVzc2FnZScpO1xuXHRcdFx0JGNvbnRlbnRXcmFwcGVyID0gJCgnLm1haW4taW5zaWRlJyk7XG5cdFx0XHRoaXN0b3J5QXZhaWxhYmxlID0ganNlLmNvcmUuY29uZmlnLmdldCgnaGlzdG9yeScpO1xuXG5cdFx0XHQvLyBubyBhdXRvIHVwZGF0ZSBvbiBzdGFydCBwYWdlXG5cdFx0XHRpZigkKG9wdGlvbnMuc2VsZWN0b3JNYXBwaW5nLnByb2R1Y3RzQ29udGFpbmVyKS5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0b3B0aW9ucy5hdXRvVXBkYXRlID0gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdCR0aGlzXG5cdFx0XHRcdC5vbignY2hhbmdlJywgJ3NlbGVjdCwgaW5wdXRbdHlwZT1cImNoZWNrYm94XCJdLCBpbnB1dFt0eXBlPVwidGV4dFwiXScsIF9jaGFuZ2VIYW5kbGVyKVxuXHRcdFx0XHQub24oJ2NsaWNrJywgJy5idG4tbGluaycsIF9maWx0ZXJDbGlja0hhbmRsZXIpXG5cdFx0XHRcdC5vbigncmVzZXQnLCBfcmVzZXRIYW5kbGVyKVxuXHRcdFx0XHQub24oJ3N1Ym1pdCcsIF9zdWJtaXRIYW5kbGVyKVxuXHRcdFx0XHQub24oJ2NsaWNrJywgJy5zaG93LW1vcmUnLCBfY2xpY2tIYW5kbGVyKTtcblxuXHRcdFx0JGJvZHkuYWRkQ2xhc3MoJ2ZpbHRlcmJveC1lbmFibGVkJyk7XG5cblx0XHRcdGRvbmUoKTtcblx0XHR9O1xuXG5cdFx0Ly8gUmV0dXJuIGRhdGEgdG8gd2lkZ2V0IGVuZ2luZVxuXHRcdHJldHVybiBtb2R1bGU7XG5cdH0pOyJdfQ==

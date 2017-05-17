'use strict';

/* --------------------------------------------------------------
 product_question.js 2016-11-09
 Gambio GmbH
 http://www.gambio.de
 Copyright (c) 2016 Gambio GmbH
 Released under the GNU General Public License (Version 2)
 [http://www.gnu.org/licenses/gpl-2.0.html]
 --------------------------------------------------------------
 */

/**
 * Widget that updates that opens a lightbox for asking product questions. Sends an e-mail to the shop administrator
 * with the asked question
 */
gambio.widgets.module('product_question', ['xhr', gambio.source + '/libs/modal.ext-magnific', gambio.source + '/libs/modal'], function (data) {

	'use strict';

	// ########## VARIABLE INITIALIZATION ##########

	var $this = $(this),
	    $body = $('body'),
	    defaults = {
		btnOpen: '.btn-product-question',
		btnClose: '.btn-close-question-window',
		btnSend: '.btn-send-question',
		url: 'shop.php?do=ProductQuestion',
		sendUrl: 'shop.php?do=ProductQuestion/Send',
		productId: 0,
		formSelector: '#product-question-form',
		productFormSelector: '.js-product-form'
	},
	    options = $.extend(true, {}, defaults, data),
	    module = {};

	// ########## EVENT HANDLER ##########

	var _validateForm = function _validateForm() {
		try {
			var $privacyCheckbox = $('#privacy_accepted'),
			    error = false;

			$this.find('.form-group.mandatory, .checkbox-inline').removeClass('has-error');

			// Validate required fields. 
			$this.find('.form-group.mandatory').each(function () {
				var $formControl = $(this).find('.form-control');

				if ($formControl.val() === '') {
					$(this).addClass('has-error');
					error = true;
				}
			});

			if ($privacyCheckbox.length && !$privacyCheckbox.prop('checked')) {
				$privacyCheckbox.closest('.checkbox-inline').addClass('has-error');
				error = true;
			}

			if (error) {
				throw new Error();
			}

			return true;
		} catch (exception) {
			return false;
		}
	};

	var _openModal = function _openModal() {
		var formData = $(options.productFormSelector).serialize();

		jse.libs.xhr.get({ url: options.url + '&' + formData + '&productId=' + options.productId }, true).done(function (response) {
			_closeModal();
			$body.append(response.content);
			gambio.widgets.init($('.mfp-wrap'));
			_activateGoogleRecaptcha();
		});
	};

	var _closeModal = function _closeModal() {
		$('.mfp-bg, .mfp-wrap').remove();
		$(options.btnSend).off('click', _sendForm);
		$(options.btnClose).off('click', _closeModal);
	};

	var _sendForm = function _sendForm() {
		if (!_validateForm()) {
			return;
		}

		var formData = $(options.productFormSelector).serialize();
		var url = options.sendUrl + '&' + formData + '&productId=' + options.productId,
		    data = $(options.formSelector).serialize() + '&productLink=' + location.href;

		$.ajax({
			url: url,
			data: data,
			type: 'POST',
			dataType: 'json'
		}).done(function (response) {
			_closeModal();
			$body.append(response.content);
			gambio.widgets.init($('.mfp-wrap'));

			if (!response.success) {
				_activateGoogleRecaptcha();
			}
		});
	};

	var _activateGoogleRecaptcha = function _activateGoogleRecaptcha() {
		if (typeof window.showRecaptcha === 'function') {
			setTimeout(function () {
				window.showRecaptcha('captcha_wrapper');
			}, 500);
		}
	};

	// ########## INITIALIZATION ##########

	/**
  * Init function of the widget
  */
	module.init = function (done) {
		if (options.modalMode === undefined) {
			$(options.btnOpen).on('click', _openModal);
		}
		$(options.btnSend).on('click', _sendForm);
		$(options.btnClose).on('click', _closeModal);

		done();
	};

	// Return data to widget engine
	return module;
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndpZGdldHMvcHJvZHVjdF9xdWVzdGlvbi5qcyJdLCJuYW1lcyI6WyJnYW1iaW8iLCJ3aWRnZXRzIiwibW9kdWxlIiwic291cmNlIiwiZGF0YSIsIiR0aGlzIiwiJCIsIiRib2R5IiwiZGVmYXVsdHMiLCJidG5PcGVuIiwiYnRuQ2xvc2UiLCJidG5TZW5kIiwidXJsIiwic2VuZFVybCIsInByb2R1Y3RJZCIsImZvcm1TZWxlY3RvciIsInByb2R1Y3RGb3JtU2VsZWN0b3IiLCJvcHRpb25zIiwiZXh0ZW5kIiwiX3ZhbGlkYXRlRm9ybSIsIiRwcml2YWN5Q2hlY2tib3giLCJlcnJvciIsImZpbmQiLCJyZW1vdmVDbGFzcyIsImVhY2giLCIkZm9ybUNvbnRyb2wiLCJ2YWwiLCJhZGRDbGFzcyIsImxlbmd0aCIsInByb3AiLCJjbG9zZXN0IiwiRXJyb3IiLCJleGNlcHRpb24iLCJfb3Blbk1vZGFsIiwiZm9ybURhdGEiLCJzZXJpYWxpemUiLCJqc2UiLCJsaWJzIiwieGhyIiwiZ2V0IiwiZG9uZSIsInJlc3BvbnNlIiwiX2Nsb3NlTW9kYWwiLCJhcHBlbmQiLCJjb250ZW50IiwiaW5pdCIsIl9hY3RpdmF0ZUdvb2dsZVJlY2FwdGNoYSIsInJlbW92ZSIsIm9mZiIsIl9zZW5kRm9ybSIsImxvY2F0aW9uIiwiaHJlZiIsImFqYXgiLCJ0eXBlIiwiZGF0YVR5cGUiLCJzdWNjZXNzIiwid2luZG93Iiwic2hvd1JlY2FwdGNoYSIsInNldFRpbWVvdXQiLCJtb2RhbE1vZGUiLCJ1bmRlZmluZWQiLCJvbiJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7Ozs7OztBQVVBOzs7O0FBSUFBLE9BQU9DLE9BQVAsQ0FBZUMsTUFBZixDQUNDLGtCQURELEVBR0MsQ0FBQyxLQUFELEVBQVFGLE9BQU9HLE1BQVAsR0FBZ0IsMEJBQXhCLEVBQW9ESCxPQUFPRyxNQUFQLEdBQWdCLGFBQXBFLENBSEQsRUFLQyxVQUFTQyxJQUFULEVBQWU7O0FBRWQ7O0FBRUE7O0FBRUEsS0FBSUMsUUFB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LCJmaWxlIjoid2lkZ2V0cy9wcm9kdWN0X3F1ZXN0aW9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiBwcm9kdWN0X3F1ZXN0aW9uLmpzIDIwMTYtMTEtMDlcbiBHYW1iaW8gR21iSFxuIGh0dHA6Ly93d3cuZ2FtYmlvLmRlXG4gQ29weXJpZ2h0IChjKSAyMDE2IEdhbWJpbyBHbWJIXG4gUmVsZWFzZWQgdW5kZXIgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIChWZXJzaW9uIDIpXG4gW2h0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy9ncGwtMi4wLmh0bWxdXG4gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqL1xuXG4vKipcbiAqIFdpZGdldCB0aGF0IHVwZGF0ZXMgdGhhdCBvcGVucyBhIGxpZ2h0Ym94IGZvciBhc2tpbmcgcHJvZHVjdCBxdWVzdGlvbnMuIFNlbmRzIGFuIGUtbWFpbCB0byB0aGUgc2hvcCBhZG1pbmlzdHJhdG9yXG4gKiB3aXRoIHRoZSBhc2tlZCBxdWVzdGlvblxuICovXG5nYW1iaW8ud2lkZ2V0cy5tb2R1bGUoXG5cdCdwcm9kdWN0X3F1ZXN0aW9uJyxcblx0XG5cdFsneGhyJywgZ2FtYmlvLnNvdXJjZSArICcvbGlicy9tb2RhbC5leHQtbWFnbmlmaWMnLCBnYW1iaW8uc291cmNlICsgJy9saWJzL21vZGFsJ10sXG5cdFxuXHRmdW5jdGlvbihkYXRhKSB7XG5cdFx0XG5cdFx0J3VzZSBzdHJpY3QnO1xuXHRcdFxuXHRcdC8vICMjIyMjIyMjIyMgVkFSSUFCTEUgSU5JVElBTElaQVRJT04gIyMjIyMjIyMjI1xuXHRcdFxuXHRcdHZhciAkdGhpcyA9ICQodGhpcyksXG5cdFx0XHQkYm9keSA9ICQoJ2JvZHknKSxcblx0XHRcdGRlZmF1bHRzID0ge1xuXHRcdFx0XHRidG5PcGVuOiAnLmJ0bi1wcm9kdWN0LXF1ZXN0aW9uJyxcblx0XHRcdFx0YnRuQ2xvc2U6ICcuYnRuLWNsb3NlLXF1ZXN0aW9uLXdpbmRvdycsXG5cdFx0XHRcdGJ0blNlbmQ6ICcuYnRuLXNlbmQtcXVlc3Rpb24nLFxuXHRcdFx0XHR1cmw6ICdzaG9wLnBocD9kbz1Qcm9kdWN0UXVlc3Rpb24nLFxuXHRcdFx0XHRzZW5kVXJsOiAnc2hvcC5waHA/ZG89UHJvZHVjdFF1ZXN0aW9uL1NlbmQnLFxuXHRcdFx0XHRwcm9kdWN0SWQ6IDAsXG5cdFx0XHRcdGZvcm1TZWxlY3RvcjogJyNwcm9kdWN0LXF1ZXN0aW9uLWZvcm0nLFxuXHRcdFx0XHRwcm9kdWN0Rm9ybVNlbGVjdG9yOiAnLmpzLXByb2R1Y3QtZm9ybSdcblx0XHRcdH0sXG5cdFx0XHRvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzLCBkYXRhKSxcblx0XHRcdG1vZHVsZSA9IHt9O1xuXHRcdFxuXHRcdFxuXHRcdC8vICMjIyMjIyMjIyMgRVZFTlQgSEFORExFUiAjIyMjIyMjIyMjXG5cdFx0XG5cdFx0dmFyIF92YWxpZGF0ZUZvcm0gPSBmdW5jdGlvbigpIHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdHZhciAkcHJpdmFjeUNoZWNrYm94ID0gJCgnI3ByaXZhY3lfYWNjZXB0ZWQnKSwgXG5cdFx0XHRcdFx0ZXJyb3IgPSBmYWxzZTtcblx0XHRcdFx0XG5cdFx0XHRcdCR0aGlzLmZpbmQoJy5mb3JtLWdyb3VwLm1hbmRhdG9yeSwgLmNoZWNrYm94LWlubGluZScpLnJlbW92ZUNsYXNzKCdoYXMtZXJyb3InKTsgXG5cdFx0XHRcdFxuXHRcdFx0XHQvLyBWYWxpZGF0ZSByZXF1aXJlZCBmaWVsZHMuIFxuXHRcdFx0XHQkdGhpcy5maW5kKCcuZm9ybS1ncm91cC5tYW5kYXRvcnknKS5lYWNoKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHZhciAkZm9ybUNvbnRyb2wgPSAkKHRoaXMpLmZpbmQoJy5mb3JtLWNvbnRyb2wnKTsgXG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0aWYgKCRmb3JtQ29udHJvbC52YWwoKSA9PT0gJycpIHtcblx0XHRcdFx0XHRcdCQodGhpcykuYWRkQ2xhc3MoJ2hhcy1lcnJvcicpO1xuXHRcdFx0XHRcdFx0ZXJyb3IgPSB0cnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHRcdFxuXHRcdFx0XHRpZiAoJHByaXZhY3lDaGVja2JveC5sZW5ndGggJiYgISRwcml2YWN5Q2hlY2tib3gucHJvcCgnY2hlY2tlZCcpKSB7XG5cdFx0XHRcdFx0JHByaXZhY3lDaGVja2JveC5jbG9zZXN0KCcuY2hlY2tib3gtaW5saW5lJykuYWRkQ2xhc3MoJ2hhcy1lcnJvcicpO1xuXHRcdFx0XHRcdGVycm9yID0gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdFx0aWYgKGVycm9yKSB7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fSBjYXRjaChleGNlcHRpb24pIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXHRcdH07XG5cdFx0XG5cdFx0dmFyIF9vcGVuTW9kYWwgPSBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBmb3JtRGF0YSA9ICQob3B0aW9ucy5wcm9kdWN0Rm9ybVNlbGVjdG9yKS5zZXJpYWxpemUoKTtcblx0XHRcdFxuXHRcdFx0anNlLmxpYnMueGhyLmdldCh7IHVybDogb3B0aW9ucy51cmwgKyAnJicgKyBmb3JtRGF0YSArICcmcHJvZHVjdElkPScgKyBvcHRpb25zLnByb2R1Y3RJZCB9LCB0cnVlKVxuXHRcdFx0XHQuZG9uZShmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdF9jbG9zZU1vZGFsKCk7XG5cdFx0XHRcdFx0JGJvZHkuYXBwZW5kKHJlc3BvbnNlLmNvbnRlbnQpO1xuXHRcdFx0XHRcdGdhbWJpby53aWRnZXRzLmluaXQoJCgnLm1mcC13cmFwJykpO1xuXHRcdFx0XHRcdF9hY3RpdmF0ZUdvb2dsZVJlY2FwdGNoYSgpO1xuXHRcdFx0XHR9KTtcblx0XHR9O1xuXHRcdFxuXHRcdHZhciBfY2xvc2VNb2RhbCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0JCgnLm1mcC1iZywgLm1mcC13cmFwJykucmVtb3ZlKCk7XG5cdFx0XHQkKG9wdGlvbnMuYnRuU2VuZCkub2ZmKCdjbGljaycsIF9zZW5kRm9ybSk7XG5cdFx0XHQkKG9wdGlvbnMuYnRuQ2xvc2UpLm9mZignY2xpY2snLCBfY2xvc2VNb2RhbCk7XG5cdFx0fTtcblx0XHRcblx0XHR2YXIgX3NlbmRGb3JtID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAoIV92YWxpZGF0ZUZvcm0oKSkge1xuXHRcdFx0XHRyZXR1cm47IFxuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHR2YXIgZm9ybURhdGEgPSAkKG9wdGlvbnMucHJvZHVjdEZvcm1TZWxlY3Rvcikuc2VyaWFsaXplKCk7XG5cdFx0XHR2YXIgdXJsID0gb3B0aW9ucy5zZW5kVXJsICsgJyYnICsgZm9ybURhdGEgKyAnJnByb2R1Y3RJZD0nICsgb3B0aW9ucy5wcm9kdWN0SWQsXG5cdFx0XHRcdGRhdGEgPSAkKG9wdGlvbnMuZm9ybVNlbGVjdG9yKS5zZXJpYWxpemUoKSArICcmcHJvZHVjdExpbms9JyArIGxvY2F0aW9uLmhyZWY7XG5cdFx0XHRcblx0XHRcdCQuYWpheCh7XG5cdFx0XHRcdHVybDogdXJsLCAgXG5cdFx0XHRcdGRhdGE6IGRhdGEsICBcblx0XHRcdFx0dHlwZTogJ1BPU1QnLCBcblx0XHRcdFx0ZGF0YVR5cGU6ICdqc29uJ1xuXHRcdFx0fSkuZG9uZShmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRfY2xvc2VNb2RhbCgpO1xuXHRcdFx0XHQkYm9keS5hcHBlbmQocmVzcG9uc2UuY29udGVudCk7XG5cdFx0XHRcdGdhbWJpby53aWRnZXRzLmluaXQoJCgnLm1mcC13cmFwJykpO1xuXHRcdFx0XHRcblx0XHRcdFx0aWYgKCFyZXNwb25zZS5zdWNjZXNzKSB7XG5cdFx0XHRcdFx0X2FjdGl2YXRlR29vZ2xlUmVjYXB0Y2hhKCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH07XG5cdFx0XG5cdFx0dmFyIF9hY3RpdmF0ZUdvb2dsZVJlY2FwdGNoYSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKHR5cGVvZih3aW5kb3cuc2hvd1JlY2FwdGNoYSkgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0c2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdFx0XHR3aW5kb3cuc2hvd1JlY2FwdGNoYSgnY2FwdGNoYV93cmFwcGVyJyk7XG5cdFx0XHRcdH0sIDUwMCk7XG5cdFx0XHR9XG5cdFx0fTtcblx0XHRcblx0XHQvLyAjIyMjIyMjIyMjIElOSVRJQUxJWkFUSU9OICMjIyMjIyMjIyNcblx0XHRcblx0XHQvKipcblx0XHQgKiBJbml0IGZ1bmN0aW9uIG9mIHRoZSB3aWRnZXRcblx0XHQgKi9cblx0XHRtb2R1bGUuaW5pdCA9IGZ1bmN0aW9uKGRvbmUpIHtcblx0XHRcdGlmIChvcHRpb25zLm1vZGFsTW9kZSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdCQob3B0aW9ucy5idG5PcGVuKS5vbignY2xpY2snLCBfb3Blbk1vZGFsKTtcblx0XHRcdH1cblx0XHRcdCQob3B0aW9ucy5idG5TZW5kKS5vbignY2xpY2snLCBfc2VuZEZvcm0pO1xuXHRcdFx0JChvcHRpb25zLmJ0bkNsb3NlKS5vbignY2xpY2snLCBfY2xvc2VNb2RhbCk7XG5cdFx0XHRcblx0XHRcdGRvbmUoKTtcblx0XHR9O1xuXHRcdFxuXHRcdC8vIFJldHVybiBkYXRhIHRvIHdpZGdldCBlbmdpbmVcblx0XHRyZXR1cm4gbW9kdWxlO1xuXHR9KTsiXX0=

'use strict';

/* --------------------------------------------------------------
 callback_service.js 2016-02-01 gm
 Gambio GmbH
 http://www.gambio.de
 Copyright (c) 2016 Gambio GmbH
 Released under the GNU General Public License (Version 2)
 [http://www.gnu.org/licenses/gpl-2.0.html]
 --------------------------------------------------------------
 */

/**
 * Checks the input values of the callback form and shows messages on error or success.
 */
gambio.widgets.module('callback_service', [], function (data) {

	'use strict';

	// ########## VARIABLE INITIALIZATION ##########

	var $this = $(this),
	    defaults = {
		'successSelector': '#callback-service .alert-success',
		'errorSelector': '#callback-service .alert-danger',
		'vvCodeSelector': '#callback-service #vvcode',
		'vvCodeImageSelector': '#callback-service #vvcode_image'
	},
	    options = $.extend(true, {}, defaults, data),
	    module = {};

	// ########## EVENT HANDLER ##########

	/**
  * Validates the form data. If an error occurs it will show the error message, otherwise the messages will be hidden.
  * 
  * @return {boolean}
  * @private
  */
	var _onSubmit = function _onSubmit() {

		var deferred = new $.Deferred();
		$(options.successSelector).addClass('hidden');
		$(options.errorSelector).addClass('hidden');

		$.ajax({
			data: $this.serialize(),
			url: 'request_port.php?module=CallbackService&action=check',
			type: 'GET',
			dataType: 'html',
			success: function success(error_message) {
				if (error_message.length > 0) {
					$(options.errorSelector).html(error_message).removeClass('hidden');

					try {
						Recaptcha.reload();
					} catch (e) {
						$(options.vvCodeSelector).val('');
						$(options.vvCodeImageSelector).attr('src', 'request_port.php?rand=' + Math.random() + '&module=CreateVVCode');
					}

					deferred.reject();
				} else {
					deferred.resolve();
				}
			}
		});
		deferred.done(_submitForm);
		return false;
	};

	/**
  * Submits the form data and shows a success message on success.
  * 
  * @private
  */
	var _submitForm = function _submitForm() {

		$.ajax({
			data: $this.serialize(),
			url: 'request_port.php?module=CallbackService&action=send',
			type: 'POST',
			dataType: 'html',
			success: function success(message) {
				if (message.length > 0) {
					$(options.successSelector).html(message).removeClass('hidden');

					try {
						Recaptcha.reload();
					} catch (e) {
						$(options.vvCodeSelector).val('');
						$(options.vvCodeImageSelector).attr('src', 'request_port.php?rand=' + Math.random() + '&module=CreateVVCode');
					}
				}
			}
		});
	};

	// ########## INITIALIZATION ##########

	/**
  * Init function of the widget
  * @constructor
  */
	module.init = function (done) {

		$this.on('submit', _onSubmit);

		done();
	};

	// Return data to widget engine
	return module;
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndpZGdldHMvY2FsbGJhY2tfc2VydmljZS5qcyJdLCJuYW1lcyI6WyJnYW1iaW8iLCJ3aWRnZXRzIiwibW9kdWxlIiwiZGF0YSIsIiR0aGlzIiwiJCIsImRlZmF1bHRzIiwib3B0aW9ucyIsImV4dGVuZCIsIl9vblN1Ym1pdCIsImRlZmVycmVkIiwiRGVmZXJyZWQiLCJzdWNjZXNzU2VsZWN0b3IiLCJhZGRDbGFzcyIsImVycm9yU2VsZWN0b3IiLCJhamF4Iiwic2VyaWFsaXplIiwidXJsIiwidHlwZSIsImRhdGFUeXBlIiwic3VjY2VzcyIsImVycm9yX21lc3NhZ2UiLCJsZW5ndGgiLCJodG1sIiwicmVtb3ZlQ2xhc3MiLCJSZWNhcHRjaGEiLCJyZWxvYWQiLCJlIiwidnZDb2RlU2VsZWN0b3IiLCJ2YWwiLCJ2dkNvZGVJbWFnZVNlbGVjdG9yIiwiYXR0ciIsIk1hdGgiLCJyYW5kb20iLCJyZWplY3QiLCJyZXNvbHZlIiwiZG9uZSIsIl9zdWJtaXRGb3JtIiwibWVzc2FnZSIsImluaXQiLCJvbiJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7Ozs7OztBQVdBOzs7QUFHQUEsT0FBT0MsT0FBUCxDQUFlQyxNQUFmLENBQ0Msa0JBREQsRUFHQyxFQUhELEVBS0MsVUFBU0MsSUFBVCxFQUFlOztBQUVkOztBQUVBOztBQUVBLEtBQUlDLFFBQVFDLEVBQUUsSUFBRixDQUFaO0FBQUEsS0FDQ0MsV0FBVztBQUNWLHFCQUFtQixrQ0FEVDtBQUVWLG1CQUFpQixpQ0FGUDtBQUdWLG9CQUFrQiwyQkFIUjtBQUlWLHlCQUF1QjtBQUpiLEVBRFo7QUFBQSxLQU9DQyxVQUFVRixFQUFFRyxNQUFGLENBQVMsSUFBVCxFQUFlLEVBQWYsRUFBbUJGLFFBQW5CLEVBQTZCSCxJQUE3QixDQVBYO0FBQUEsS0FRQ0QsU0FBUyxFQVJWOztBQVdBOztBQUVBOzs7Ozs7QUFNQSxLQUFJTyxZQUFZLFNBQVpBLFNBQVksR0FBWTs7QUFFM0IsTUFBSUMsV0FBVyxJQUFJTCxFQUFFTSxRQUFOLEVBQWY7QUFDQU4sSUFBRUUsUUFBUUssZUFBVixFQUEyQkMsUUFBM0IsQ0FBb0MsUUFBcEM7QUFDQVIsSUFBRUUsUUFBUU8sYUFBVixFQUF5QkQsUUFBekIsQ0FBa0MsUUFBbEM7O0FBRUFSLElBQUVVLElBQUYsQ0FBTztBQUNOWixTQUFRQyxNQUFNWSxTQUFOLEVBREY7QUFFTkMsUUFBTyxzREFGRDtBQUdOQyxTQUFRLEtBSEY7QUFJTkMsYUFBVyxNQUpMO0FBS05DLFlBQVUsaUJBQVNDLGFBQVQsRUFDVjtBQUNDLFFBQUdBLGNBQWNDLE1BQWQsR0FBdUIsQ0FBMUIsRUFBNkI7QUFDNUJqQixPQUFFRSxRQUFRTyxhQUFWLEVBQXlCUyxJQUF6QixDQUE4QkYsYUFBOUIsRUFBNkNHLFdBQTdDLENBQXlELFFBQXpEOztBQUVBLFNBQUk7QUFDSEMsZ0JBQVVDLE1BQVY7QUFDQSxNQUZELENBRUUsT0FBT0MsQ0FBUCxFQUFVO0FBQ1h0QixRQUFFRSxRQUFRcUIsY0FBVixFQUEwQkMsR0FBMUIsQ0FBOEIsRUFBOUI7QUFDQXhCLFFBQUVFLFFBQVF1QixtQkFBVixFQUErQkMsSUFBL0IsQ0FBb0MsS0FBcEMsRUFBMkMsMkJBQTJCQyxLQUFLQyxNQUFMLEVBQTNCLEdBQTJDLHNCQUF0RjtBQUNBOztBQUVEdkIsY0FBU3dCLE1BQVQ7QUFFQSxLQVpELE1BWU87QUFDTnhCLGNBQVN5QixPQUFUO0FBQ0E7QUFDRDtBQXRCSyxHQUFQO0FBd0JBekIsV0FBUzBCLElBQVQsQ0FBY0MsV0FBZDtBQUNBLFNBQU8sS0FBUDtBQUNBLEVBaENEOztBQW1DQTs7Ozs7QUFLQSxLQUFJQSxjQUFjLFNBQWRBLFdBQWMsR0FBWTs7QUFFN0JoQyxJQUFFVSxJQUFGLENBQU87QUFDTlosU0FBUUMsTUFBTVksU0FBTixFQURGO0FBRU5DLFFBQU8scURBRkQ7QUFHTkMsU0FBUSxNQUhGO0FBSU5DLGFBQVcsTUFKTDtBQUtOQyxZQUFVLGlCQUFTa0IsT0FBVCxFQUNWO0FBQ0MsUUFBR0EsUUFBUWhCLE1BQVIsR0FBaUIsQ0FBcEIsRUFBdUI7QUFDdEJqQixPQUFFRSxRQUFRSyxlQUFWLEVBQTJCVyxJQUEzQixDQUFnQ2UsT0FBaEMsRUFBeUNkLFdBQXpDLENBQXFELFFBQXJEOztBQUVBLFNBQUk7QUFDSEMsZ0JBQVVDLE1BQVY7QUFDQSxNQUZELENBRUUsT0FBT0MsQ0FBUCxFQUFVO0FBQ1h0QixRQUFFRSxRQUFRcUIsY0FBVixFQUEwQkMsR0FBMUIsQ0FBOEIsRUFBOUI7QUFDQXhCLFFBQUVFLFFBQVF1QixtQkFBVixFQUErQkMsSUFBL0IsQ0FBb0MsS0FBcEMsRUFBMkMsMkJBQTJCQyxLQUFLQyxNQUFMLEVBQTNCLEdBQTJDLHNCQUF0RjtBQUNBO0FBQ0Q7QUFDRDtBQWpCSyxHQUFQO0FBbUJBLEVBckJEOztBQXVCQTs7QUFFQTs7OztBQUlBL0IsUUFBT3FDLElBQVAsR0FBYyxVQUFTSCxJQUFULEVBQWU7O0FBRTVCaEMsUUFBTW9DLEVBQU4sQ0FBUyxRQUFULEVBQW1CL0IsU0FBbkI7O0FBRUEyQjtBQUNBLEVBTEQ7O0FBT0E7QUFDQSxRQUFPbEMsTUFBUDtBQUNBLENBNUdGIiwiZmlsZSI6IndpZGdldHMvY2FsbGJhY2tfc2VydmljZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gY2FsbGJhY2tfc2VydmljZS5qcyAyMDE2LTAyLTAxIGdtXG4gR2FtYmlvIEdtYkhcbiBodHRwOi8vd3d3LmdhbWJpby5kZVxuIENvcHlyaWdodCAoYykgMjAxNiBHYW1iaW8gR21iSFxuIFJlbGVhc2VkIHVuZGVyIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSAoVmVyc2lvbiAyKVxuIFtodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvZ3BsLTIuMC5odG1sXVxuIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKi9cblxuXG4vKipcbiAqIENoZWNrcyB0aGUgaW5wdXQgdmFsdWVzIG9mIHRoZSBjYWxsYmFjayBmb3JtIGFuZCBzaG93cyBtZXNzYWdlcyBvbiBlcnJvciBvciBzdWNjZXNzLlxuICovXG5nYW1iaW8ud2lkZ2V0cy5tb2R1bGUoXG5cdCdjYWxsYmFja19zZXJ2aWNlJyxcblx0XG5cdFtdLFxuXHRcblx0ZnVuY3Rpb24oZGF0YSkge1xuXHRcdFxuXHRcdCd1c2Ugc3RyaWN0Jztcblx0XHRcblx0XHQvLyAjIyMjIyMjIyMjIFZBUklBQkxFIElOSVRJQUxJWkFUSU9OICMjIyMjIyMjIyNcblx0XHRcblx0XHR2YXIgJHRoaXMgPSAkKHRoaXMpLFxuXHRcdFx0ZGVmYXVsdHMgPSB7XG5cdFx0XHRcdCdzdWNjZXNzU2VsZWN0b3InOiAnI2NhbGxiYWNrLXNlcnZpY2UgLmFsZXJ0LXN1Y2Nlc3MnLFxuXHRcdFx0XHQnZXJyb3JTZWxlY3Rvcic6ICcjY2FsbGJhY2stc2VydmljZSAuYWxlcnQtZGFuZ2VyJyxcblx0XHRcdFx0J3Z2Q29kZVNlbGVjdG9yJzogJyNjYWxsYmFjay1zZXJ2aWNlICN2dmNvZGUnLFxuXHRcdFx0XHQndnZDb2RlSW1hZ2VTZWxlY3Rvcic6ICcjY2FsbGJhY2stc2VydmljZSAjdnZjb2RlX2ltYWdlJ1xuXHRcdFx0fSxcblx0XHRcdG9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMsIGRhdGEpLFxuXHRcdFx0bW9kdWxlID0ge307XG5cdFx0XG5cdFx0XG5cdFx0Ly8gIyMjIyMjIyMjIyBFVkVOVCBIQU5ETEVSICMjIyMjIyMjIyNcblx0XHRcblx0XHQvKipcblx0XHQgKiBWYWxpZGF0ZXMgdGhlIGZvcm0gZGF0YS4gSWYgYW4gZXJyb3Igb2NjdXJzIGl0IHdpbGwgc2hvdyB0aGUgZXJyb3IgbWVzc2FnZSwgb3RoZXJ3aXNlIHRoZSBtZXNzYWdlcyB3aWxsIGJlIGhpZGRlbi5cblx0XHQgKiBcblx0XHQgKiBAcmV0dXJuIHtib29sZWFufVxuXHRcdCAqIEBwcml2YXRlXG5cdFx0ICovXG5cdFx0dmFyIF9vblN1Ym1pdCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFxuXHRcdFx0dmFyIGRlZmVycmVkID0gbmV3ICQuRGVmZXJyZWQoKTtcblx0XHRcdCQob3B0aW9ucy5zdWNjZXNzU2VsZWN0b3IpLmFkZENsYXNzKCdoaWRkZW4nKTtcblx0XHRcdCQob3B0aW9ucy5lcnJvclNlbGVjdG9yKS5hZGRDbGFzcygnaGlkZGVuJyk7XG5cdFx0XHRcblx0XHRcdCQuYWpheCh7XG5cdFx0XHRcdGRhdGE6IFx0XHQkdGhpcy5zZXJpYWxpemUoKSxcblx0XHRcdFx0dXJsOiBcdFx0J3JlcXVlc3RfcG9ydC5waHA/bW9kdWxlPUNhbGxiYWNrU2VydmljZSZhY3Rpb249Y2hlY2snLFxuXHRcdFx0XHR0eXBlOiBcdFx0J0dFVCcsXG5cdFx0XHRcdGRhdGFUeXBlOiBcdCdodG1sJyxcblx0XHRcdFx0c3VjY2VzczogXHRmdW5jdGlvbihlcnJvcl9tZXNzYWdlKVxuXHRcdFx0XHR7XHRcdFx0XHRcdFxuXHRcdFx0XHRcdGlmKGVycm9yX21lc3NhZ2UubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRcdFx0JChvcHRpb25zLmVycm9yU2VsZWN0b3IpLmh0bWwoZXJyb3JfbWVzc2FnZSkucmVtb3ZlQ2xhc3MoJ2hpZGRlbicpO1xuXHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdFx0XHRSZWNhcHRjaGEucmVsb2FkKCk7XG5cdFx0XHRcdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdFx0XHRcdCQob3B0aW9ucy52dkNvZGVTZWxlY3RvcikudmFsKCcnKTtcblx0XHRcdFx0XHRcdFx0JChvcHRpb25zLnZ2Q29kZUltYWdlU2VsZWN0b3IpLmF0dHIoJ3NyYycsICdyZXF1ZXN0X3BvcnQucGhwP3JhbmQ9JyArIE1hdGgucmFuZG9tKCkgKyAnJm1vZHVsZT1DcmVhdGVWVkNvZGUnKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0ZGVmZXJyZWQucmVqZWN0KCk7XG5cdFx0XHRcdFx0XHRcblx0XHRcdFx0XHR9IGVsc2Uge1x0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0ZGVmZXJyZWQucmVzb2x2ZSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHRkZWZlcnJlZC5kb25lKF9zdWJtaXRGb3JtKTtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9O1xuXHRcdFxuXHRcdFxuXHRcdC8qKlxuXHRcdCAqIFN1Ym1pdHMgdGhlIGZvcm0gZGF0YSBhbmQgc2hvd3MgYSBzdWNjZXNzIG1lc3NhZ2Ugb24gc3VjY2Vzcy5cblx0XHQgKiBcblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqL1xuXHRcdHZhciBfc3VibWl0Rm9ybSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFxuXHRcdFx0JC5hamF4KHtcblx0XHRcdFx0ZGF0YTogXHRcdCR0aGlzLnNlcmlhbGl6ZSgpLFxuXHRcdFx0XHR1cmw6IFx0XHQncmVxdWVzdF9wb3J0LnBocD9tb2R1bGU9Q2FsbGJhY2tTZXJ2aWNlJmFjdGlvbj1zZW5kJyxcblx0XHRcdFx0dHlwZTogXHRcdCdQT1NUJyxcblx0XHRcdFx0ZGF0YVR5cGU6IFx0J2h0bWwnLFxuXHRcdFx0XHRzdWNjZXNzOiBcdGZ1bmN0aW9uKG1lc3NhZ2UpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRpZihtZXNzYWdlLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0XHRcdCQob3B0aW9ucy5zdWNjZXNzU2VsZWN0b3IpLmh0bWwobWVzc2FnZSkucmVtb3ZlQ2xhc3MoJ2hpZGRlbicpO1xuXHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHR0cnlcdHtcblx0XHRcdFx0XHRcdFx0UmVjYXB0Y2hhLnJlbG9hZCgpO1xuXHRcdFx0XHRcdFx0fSBjYXRjaCAoZSlcdHtcblx0XHRcdFx0XHRcdFx0JChvcHRpb25zLnZ2Q29kZVNlbGVjdG9yKS52YWwoJycpO1xuXHRcdFx0XHRcdFx0XHQkKG9wdGlvbnMudnZDb2RlSW1hZ2VTZWxlY3RvcikuYXR0cignc3JjJywgJ3JlcXVlc3RfcG9ydC5waHA/cmFuZD0nICsgTWF0aC5yYW5kb20oKSArICcmbW9kdWxlPUNyZWF0ZVZWQ29kZScpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fTtcblx0XHRcblx0XHQvLyAjIyMjIyMjIyMjIElOSVRJQUxJWkFUSU9OICMjIyMjIyMjIyNcblx0XHRcblx0XHQvKipcblx0XHQgKiBJbml0IGZ1bmN0aW9uIG9mIHRoZSB3aWRnZXRcblx0XHQgKiBAY29uc3RydWN0b3Jcblx0XHQgKi9cblx0XHRtb2R1bGUuaW5pdCA9IGZ1bmN0aW9uKGRvbmUpIHtcblx0XHRcdFxuXHRcdFx0JHRoaXMub24oJ3N1Ym1pdCcsIF9vblN1Ym1pdCk7XG5cdFx0XHRcblx0XHRcdGRvbmUoKTtcblx0XHR9O1xuXHRcdFxuXHRcdC8vIFJldHVybiBkYXRhIHRvIHdpZGdldCBlbmdpbmVcblx0XHRyZXR1cm4gbW9kdWxlO1xuXHR9KTsiXX0=

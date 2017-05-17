'use strict';

/* --------------------------------------------------------------
 modal.js 2016-07-07
 Gambio GmbH
 http://www.gambio.de
 Copyright (c) 2016 Gambio GmbH
 Released under the GNU General Public License (Version 2)
 [http://www.gnu.org/licenses/gpl-2.0.html]
 --------------------------------------------------------------
 */

jse.libs.template.modal = jse.libs.template.modal || {};

/**
 * ## Honeygrid Modal Dialogs Library
 *
 * Library-function to open default modal layer.  This function depends on jQuery & jQuery UI.
 *
 * @module Honeygrid/Libs/modal
 * @exports jse.libs.template.modal
 * @ignore
 */
(function (exports) {
	'use strict';

	var $body = $('body'),
	    tplStore = [],
	    extension = null,

	// Object for default buttons
	buttons = {
		yes: {
			name: jse.core.lang.translate('yes', 'buttons'),
			type: 'success',
			class: 'btn-success'
		},
		no: {
			name: jse.core.lang.translate('no', 'buttons'),
			type: 'fail',
			class: 'btn-default'
		},
		abort: {
			name: jse.core.lang.translate('abort', 'buttons'),
			type: 'fail',
			class: 'btn-default'
		},
		ok: {
			name: jse.core.lang.translate('ok', 'buttons'),
			type: 'success',
			class: 'btn-success'
		},
		close: {
			name: jse.core.lang.translate('close', 'buttons'),
			type: 'fail',
			class: 'btn-default'
		}
	};

	/**
  *    Function to get all form data stored inside
  *    the layer
  *
  *    @param        {object}    $self        jQuery selection of the layer
  *    @return    {json}                    Returns a JSON with all form data
  */
	var _getFormData = function _getFormData($self, checkform) {
		var $forms = $self.filter('form').add($self.find('form')),
		    formdata = {},
		    valid = true,
		    promises = [];

		if ($forms.length) {
			$forms.each(function () {
				var $form = $(this);

				if (checkform) {
					var localDeferred = $.Deferred();
					promises.push(localDeferred);
					$form.trigger('validator.validate', { deferred: localDeferred });
				}

				formdata[$form.attr('name') || $form.attr('id') || 'form_' + new Date().getTime() * Math.random()] = jse.libs.form.getData($form);
			});
		}

		return $.when.apply(undefined, promises).then(function () {
			return formdata;
		}, function () {
			return formdata;
		}).promise();
	};

	/**
  *    Function to transform the custom buttons object (which is
  *    incompatible with jQuery UI) to a jQuery UI compatible format
  *
  *    @param        {object}    dataset        Custom buttons object for the dialog
  *    @param        {promise}    deferred    deferred-object to resolve / reject on close
  *    @return    {array}                    Returns a jQuery UI dialog compatible buttons array
  */
	var _genButtons = function _genButtons(options, extensionDeferred) {

		// Check if buttons are available
		if (options.buttons) {

			var rejectHandler = extension.getRejectHandler,
			    resolveHandler = extension.getResolveHandler;

			$.each(options.buttons, function (k, v) {

				// Setup click handler
				options.buttons[k].event = function () {
					var $self = $(this);

					// If a callback is given, execute it with
					// the current scope
					if (typeof v.callback === 'function') {
						if (!v.callback.apply($self, [])) {
							return false;
						}
					}

					// Add the default behaviour
					// for the close  functionality
					// On fail, reject the deferred
					// object, else resolve it
					switch (v.type) {
						case 'fail':
							rejectHandler($self, extensionDeferred, _getFormData);
							break;
						case 'success':
							resolveHandler($self, extensionDeferred, _getFormData);
							break;
						case 'link':
							location.href = v.value;
							break;
						default:
							break;
					}
				};
			});
		}
	};

	var _finalizeLayer = function _finalizeLayer($container, options) {
		// Prevent submit on enter in inner forms
		var $forms = $container.find('form');
		if ($forms.length) {
			$forms.on('submit', function (e) {
				e.preventDefault();
			});
		}

		if (window.gambio && window.gambio.widgets && window.gambio.widgets.init) {
			window.gambio.widgets.init($container);
		}
	};

	var _setLayer = function _setLayer(name) {
		if (jse.libs.template.modal[name]) {
			extension = jse.libs.template.modal[name];
		} else {
			jse.core.debug.error('[MODAL] Can\'t set modal: "' + name + '". Extension doesn\'t exist');
		}
	};

	var _transferOptions = function _transferOptions(options) {
		var mapper = extension.getMapper(),
		    result = {};

		$.each(options, function (k, v) {

			if (mapper[k] === false) {
				return true;
			} else if (mapper[k] === undefined) {
				result[k] = v;
			} else if (typeof mapper[k] === 'function') {
				var mapperResult = mapper[k](k, v);
				result[mapperResult[0]] = mapperResult[1];
			} else {
				result[mapper[k]] = v;
			}
		});

		return result;
	};

	var _getTemplate = function _getTemplate(options, iframe) {

		var $selection = [],
		    deferred = $.Deferred();

		if (options.noTemplate) {
			deferred.resolve('');
		} else if (iframe) {
			deferred.resolve('<iframe width="100%" height="100%" frameborder="0" src="' + options.template + '" />');
		} else {
			if (options.storeTemplate && tplStore[options.template]) {
				deferred.resolve(tplStore[options.template]);
			} else {

				try {
					$selection = $(options.template);
				} catch (err) {}

				if ($selection.length) {
					deferred.resolve($selection.html());
				} else {
					jse.libs.xhr.ajax({ url: options.template, dataType: 'html' }).done(function (result) {
						if (options.sectionSelector) {
							result = $(result).find(options.sectionSelector).html();
						}

						if (options.storeTemplate) {
							tplStore[options.template] = result;
						}
						deferred.resolve(result);
					}).fail(function () {
						deferred.reject();
					});
				}
			}
		}

		return deferred;
	};

	var _createLayer = function _createLayer(options, title, className, defbuttons, template) {
		// Setup defaults & deferred objects
		var deferred = $.Deferred(),
		    promise = deferred.promise(),
		    iframe = template === 'iframe',
		    defaults = {
			title: title,
			dialogClass: className,
			modal: true,
			buttons: defbuttons || [],
			closeOnEscape: true,
			template: template || null,
			storeTemplate: false,
			closeX: true,
			closeOnOuter: true
		},
		    instance = null,
		    $forms = null,
		    extensionDeferred = $.Deferred();

		// Merge custom settings with default settings
		options = options || {};
		options = $.extend({}, defaults, options);

		var tplRequest = _getTemplate(options, iframe).done(function (result) {

			extensionDeferred.done(function (result) {
				deferred.resolve(result);
			}).fail(function (result) {
				deferred.reject(result);
			});

			// Generate template
			options.template = $(Mustache.render(result, options));
			jse.libs.template.helpers.setupWidgetAttr(options.template);
			options.template = $('<div>').append(options.template.clone()).html();

			// Generate default button object
			_genButtons(options, extensionDeferred);

			// Transfer options object to extension option object
			var originalOptions = $.extend({}, options);
			options = _transferOptions(options);

			// Call extension
			extension.openLayer(options, extensionDeferred, _getFormData, originalOptions);

			// Passthrough of the close method of the layer
			// to the layer caller
			promise.close = function (success) {
				extensionDeferred.close(success);
			};
		}).fail(function () {
			deferred.reject({ error: 'Template not found' });
		});

		// Temporary close handler if the upper
		// deferred isn't finished now. It will be
		// overwritten after the layer opens
		if (!promise.close) {
			promise.close = function () {
				tplRequest.reject('Closed after opening');
			};
		}

		return promise;
	};

	/**
  *    Shortcut function for an alert-layer
  *    @param        {object}    options Options that are passed to the modal layer
  *    @return    {promise}            Returns a promise
  */
	var _alert = function _alert(options) {
		return _createLayer(options, jse.core.lang.translate('hint', 'labels'), '', [buttons.close], '#modal_alert');
	};

	/**
  *    Shortcut function for an confirm-layer
  *    @param        {object}    options Options that are passed to the modal layer
  *    @return    {promise}            Returns a promise
  */
	var _confirm = function _confirm(options) {
		return _createLayer(options, jse.core.lang.translate('confirm', 'labels'), 'confirm_dialog', [buttons.yes, buttons.no], '#modal_alert');
	};

	/**
  *    Shortcut function for a prompt-layer
  *    @param        {object}    options Options that are passed to the modal layer
  *    @return    {promise}            Returns a promise
  */
	var _prompt = function _prompt(options) {
		return _createLayer(options, jse.core.lang.translate('prompt', 'labels'), 'prompt_dialog', [buttons.ok, buttons.abort], '#modal_prompt');
	};

	/**
  *    Shortcut function for an success-layer
  *    @param        {object}    options Options that are passed to the modal layer
  *    @return    {promise}            Returns a promise
  */
	var _success = function _success(options) {
		return _createLayer(options, jse.core.lang.translate('success', 'labels'), 'success_dialog', [], '#modal_alert');
	};

	/**
  *    Shortcut function for an error-layer
  *    @param        {object}    options Options that are passed to the modal layer
  *    @return    {promise}            Returns a promise
  */
	var _error = function _error(options) {
		return _createLayer(options, jse.core.lang.translate('errors', 'labels'), 'error_dialog', [], '#modal_alert');
	};

	/**
  *    Shortcut function for a warning-layer
  *    @param        {object}    options Options that are passed to the modal layer
  *    @return    {promise}            Returns a promise
  */
	var _warn = function _warn(options) {
		return _createLayer(options, jse.core.lang.translate('warning', 'labels'), 'warn_dialog', [], '#modal_alert');
	};

	/**
  *    Shortcut function for an info-layer
  *    @param        {object}    options Options that are passed to the modal layer
  *    @return    {promise}            Returns a promise
  */
	var _info = function _info(options) {
		return _createLayer(options, jse.core.lang.translate('info', 'labels'), 'info_dialog', [], '#modal_alert');
	};

	/**
  *    Shortcut function for an iframe-layer
  *    @param        {object}    options Options that are passed to the modal layer
  *    @return    {promise}            Returns a promise
  */
	var _iframe = function _iframe(options) {
		if (options.convertModal) {
			jse.libs.template.modal[options.convertModal](options, jse.core.lang.translate('info', 'labels'), options.convertModal + '_dialog', [], '#modal_alert');
			return;
		}

		return _createLayer(options, jse.core.lang.translate('info', 'labels'), 'iframe_layer', [], 'iframe');
	};

	// ########## VARIABLE EXPORT ##########

	exports.error = _error;
	exports.warn = _warn;
	exports.info = _info;
	exports.success = _success;
	exports.alert = _alert;
	exports.prompt = _prompt;
	exports.confirm = _confirm;
	exports.iframe = _iframe;
	exports.custom = _createLayer;
	exports.setLayer = _setLayer;
	exports.finalizeLayer = _finalizeLayer;

	// Set default layer.
	var currentTimestamp = Date.now,
	    lifetime = 10000; // 10 sec

	extension = jse.core.registry.get('mainModalLayer');

	var intv = setInterval(function () {
		if (jse.libs.template.modal[extension] !== undefined) {
			_setLayer(extension);
			clearInterval(intv);
		}

		if (Date.now - currentTimestamp > lifetime) {
			throw new Error('Modal extension was not loaded: ' + extension);
		}
	}, 300);
})(jse.libs.template.modal);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYnMvbW9kYWwuanMiXSwibmFtZXMiOlsianNlIiwibGlicyIsInRlbXBsYXRlIiwibW9kYWwiLCJleHBvcnRzIiwiJGJvZHkiLCIkIiwidHBsU3RvcmUiLCJleHRlbnNpb24iLCJidXR0b25zIiwieWVzIiwibmFtZSIsImNvcmUiLCJsYW5nIiwidHJhbnNsYXRlIiwidHlwZSIsImNsYXNzIiwibm8iLCJhYm9ydCIsIm9rIiwiY2xvc2UiLCJfZ2V0Rm9ybURhdGEiLCIkc2VsZiIsImNoZWNrZm9ybSIsIiRmb3JtcyIsImZpbHRlciIsImFkZCIsImZpbmQiLCJmb3JtZGF0YSIsInZhbGlkIiwicHJvbWlzZXMiLCJsZW5ndGgiLCJlYWNoIiwiJGZvcm0iLCJsb2NhbERlZmVycmVkIiwiRGVmZXJyZWQiLCJwdXNoIiwidHJpZ2dlciIsImRlZmVycmVkIiwiYXR0ciIsIkRhdGUiLCJnZXRUaW1lIiwiTWF0aCIsInJhbmRvbSIsImZvcm0iLCJnZXREYXRhIiwid2hlbiIsImFwcGx5IiwidW5kZWZpbmVkIiwidGhlbiIsInByb21pc2UiLCJfZ2VuQnV0dG9ucyIsIm9wdGlvbnMiLCJleHRlbnNpb25EZWZlcnJlZCIsInJlamVjdEhhbmRsZXIiLCJnZXRSZWplY3RIYW5kbGVyIiwicmVzb2x2ZUhhbmRsZXIiLCJnZXRSZXNvbHZlSGFuZGxlciIsImsiLCJ2IiwiZXZlbnQiLCJjYWxsYmFjayIsImxvY2F0aW9uIiwiaHJlZiIsInZhbHVlIiwiX2ZpbmFsaXplTGF5ZXIiLCIkY29udGFpbmVyIiwib24iLCJlIiwicHJldmVudERlZmF1bHQiLCJ3aW5kb3ciLCJnYW1iaW8iLCJ3aWRnZXRzIiwiaW5pdCIsIl9zZXRMYXllciIsImRlYnVnIiwiZXJyb3IiLCJfdHJhbnNmZXJPcHRpb25zIiwibWFwcGVyIiwiZ2V0TWFwcGVyIiwicmVzdWx0IiwibWFwcGVyUmVzdWx0IiwiX2dldFRlbXBsYXRlIiwiaWZyYW1lIiwiJHNlbGVjdGlvbiIsIm5vVGVtcGxhdGUiLCJyZXNvbHZlIiwic3RvcmVUZW1wbGF0ZSIsImVyciIsImh0bWwiLCJ4aHIiLCJhamF4IiwidXJsIiwiZGF0YVR5cGUiLCJkb25lIiwic2VjdGlvblNlbGVjdG9yIiwiZmFpbCIsInJlamVjdCIsIl9jcmVhdGVMYXllciIsInRpdGxlIiwiY2xhc3NOYW1lIiwiZGVmYnV0dG9ucyIsImRlZmF1bHRzIiwiZGlhbG9nQ2xhc3MiLCJjbG9zZU9uRXNjYXBlIiwiY2xvc2VYIiwiY2xvc2VPbk91dGVyIiwiaW5zdGFuY2UiLCJleHRlbmQiLCJ0cGxSZXF1ZXN0IiwiTXVzdGFjaGUiLCJyZW5kZXIiLCJoZWxwZXJzIiwic2V0dXBXaWRnZXRBdHRyIiwiYXBwZW5kIiwiY2xvbmUiLCJvcmlnaW5hbE9wdGlvbnMiLCJvcGVuTGF5ZXIiLCJzdWNjZXNzIiwiX2FsZXJ0IiwiX2NvbmZpcm0iLCJfcHJvbXB0IiwiX3N1Y2Nlc3MiLCJfZXJyb3IiLCJfd2FybiIsIl9pbmZvIiwiX2lmcmFtZSIsImNvbnZlcnRNb2RhbCIsIndhcm4iLCJpbmZvIiwiYWxlcnQiLCJwcm9tcHQiLCJjb25maXJtIiwiY3VzdG9tIiwic2V0TGF5ZXIiLCJmaW5hbGl6ZUxheWVyIiwiY3VycmVudFRpbWVzdGFtcCIsIm5vdyIsImxpZmV0aW1lIiwicmVnaXN0cnkiLCJnZXQiLCJpbnR2Iiwic2V0SW50ZXJ2YWwiLCJjbGVhckludGVydmFsIiwiRXJyb3IiXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7Ozs7QUFVQUEsSUFBSUMsSUFBSixDQUFTQyxRQUFULENBQWtCQyxLQUFsQixHQUEwQkgsSUFBSUMsSUFBSixDQUFTQyxRQUFULENBQWtCQyxLQUFsQixJQUEyQixFQUFyRDs7QUFFQTs7Ozs7Ozs7O0FBU0MsV0FBU0MsT0FBVCxFQUFrQjtBQUNsQjs7QUFFQSxLQUFJQyxRQUFRQyxFQUFFLE1BQUYsQ0FBWjtBQUFBLEtBQ0NDLFdBQVcsRUFEWjtBQUFBLEtBRUNDLFlBQVksSUFGYjs7QUFHQTtBQUNDQyxXQUFVO0FBQ1RDLE9BQUs7QUFDSkMsU0FBTVgsSUFBSVksSUFBSixDQUFTQyxJQUFULENBQWNDLFNBQWQsQ0FBd0IsS0FBeEIsRUFBK0IsU0FBL0IsQ0FERjtBQUVKQyxTQUFNLFNBRkY7QUFHSkMsVUFBTztBQUhILEdBREk7QUFNVEMsTUFBSTtBQUNITixTQUFNWCxJQUFJWSxJQUFKLENBQVNDLElBQVQsQ0FBY0MsU0FBZCxDQUF3QixJQUF4QixFQUE4QixTQUE5QixDQURIO0FBRUhDLFNBQU0sTUFGSDtBQUdIQyxVQUFPO0FBSEosR0FOSztBQVdURSxTQUFPO0FBQ05QLFNBQU1YLElBQUlZLElBQUosQ0FBU0MsSUFBVCxDQUFjQyxTQUFkLENBQXdCLE9BQXhCLEVBQWlDLFNBQWpDLENBREE7QUFFTkMsU0FBTSxNQUZBO0FBR05DLFVBQU87QUFIRCxHQVhFO0FBZ0JURyxNQUFJO0FBQ0hSLFNBQU1YLElBQUlZLElBQUosQ0FBU0MsSUFBVCxDQUFjQyxTQUFkLENBQXdCLElBQXhCLEVBQThCLFNBQTlCLENBREg7QUFFSEMsU0FBTSxTQUZIO0FBR0hDLFVBQU87QUFISixHQWhCSztBQXFCVEksU0FBTztBQUNOVCxTQUFNWCxJQUFJWSxJQUFKLENBQVNDLElBQVQsQ0FBY0MsU0FBZCxDQUF3QixPQUF4QixFQUFpQyxTQUFqQyxDQURBO0FBRU5DLFNBQU0sTUFGQTtBQUdOQyxVQUFPO0FBSEQ7QUFyQkUsRUFKWDs7QUFnQ0E7Ozs7Ozs7QUFPQSxLQUFJSyxlQUFlLFNBQWZBLFlBQWUsQ0FBU0MsS0FBVCxFQUFnQkMsU0FBaEIsRUFBMkI7QUFDN0MsTUFBSUMsU0FBU0YsTUFDWEcsTUFEVyxDQUNKLE1BREksRUFFWEMsR0FGVyxDQUVQSixNQUFNSyxJQUFOLENBQVcsTUFBWCxDQUZPLENBQWI7QUFBQSxNQUdDQyxXQUFXLEVBSFo7QUFBQSxNQUlDQyxRQUFRLElBSlQ7QUFBQSxNQUtDQyxXQUFXLEVBTFo7O0FBT0EsTUFBSU4sT0FBT08sTUFBWCxFQUFtQjtBQUNsQlAsVUFBT1EsSUFBUCxDQUFZLFlBQVc7QUFDdEIsUUFBSUMsUUFBUTNCLEVBQUUsSUFBRixDQUFaOztBQUVBLFFBQUlpQixTQUFKLEVBQWU7QUFDZCxTQUFJVyxnQkFBZ0I1QixFQUFFNkIsUUFBRixFQUFwQjtBQUNBTCxjQUFTTSxJQUFULENBQWNGLGFBQWQ7QUFDQUQsV0FBTUksT0FBTixDQUFjLG9CQUFkLEVBQW9DLEVBQUNDLFVBQVVKLGFBQVgsRUFBcEM7QUFDQTs7QUFFRE4sYUFBU0ssTUFBTU0sSUFBTixDQUFXLE1BQVgsS0FBc0JOLE1BQU1NLElBQU4sQ0FBVyxJQUFYLENBQXRCLElBQTJDLFVBQVUsSUFBSUMsSUFBSixHQUFXQyxPQUFYLEtBQXVCQyxLQUFLQyxNQUFMLEVBQXJGLElBQ0czQyxJQUFJQyxJQUFKLENBQVMyQyxJQUFULENBQWNDLE9BQWQsQ0FBc0JaLEtBQXRCLENBREg7QUFFQSxJQVhEO0FBWUE7O0FBRUQsU0FBTzNCLEVBQUV3QyxJQUFGLENBQ0VDLEtBREYsQ0FDUUMsU0FEUixFQUNtQmxCLFFBRG5CLEVBRUVtQixJQUZGLENBRU8sWUFBVztBQUNoQixVQUFPckIsUUFBUDtBQUNBLEdBSkYsRUFJSSxZQUFXO0FBQ2IsVUFBT0EsUUFBUDtBQUNBLEdBTkYsRUFPRXNCLE9BUEYsRUFBUDtBQVFBLEVBL0JEOztBQWlDQTs7Ozs7Ozs7QUFRQSxLQUFJQyxjQUFjLFNBQWRBLFdBQWMsQ0FBU0MsT0FBVCxFQUFrQkMsaUJBQWxCLEVBQXFDOztBQUV0RDtBQUNBLE1BQUlELFFBQVEzQyxPQUFaLEVBQXFCOztBQUVwQixPQUFJNkMsZ0JBQWdCOUMsVUFBVStDLGdCQUE5QjtBQUFBLE9BQ0NDLGlCQUFpQmhELFVBQVVpRCxpQkFENUI7O0FBR0FuRCxLQUFFMEIsSUFBRixDQUFPb0IsUUFBUTNDLE9BQWYsRUFBd0IsVUFBU2lELENBQVQsRUFBWUMsQ0FBWixFQUFlOztBQUV0QztBQUNBUCxZQUFRM0MsT0FBUixDQUFnQmlELENBQWhCLEVBQW1CRSxLQUFuQixHQUEyQixZQUFXO0FBQ3JDLFNBQUl0QyxRQUFRaEIsRUFBRSxJQUFGLENBQVo7O0FBRUE7QUFDQTtBQUNBLFNBQUksT0FBT3FELEVBQUVFLFFBQVQsS0FBc0IsVUFBMUIsRUFBc0M7QUFDckMsVUFBSSxDQUFDRixFQUFFRSxRQUFGLENBQVdkLEtBQVgsQ0FBaUJ6QixLQUFqQixFQUF3QixFQUF4QixDQUFMLEVBQWtDO0FBQ2pDLGNBQU8sS0FBUDtBQUNBO0FBQ0Q7O0FBRUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFRcUMsRUFBRTVDLElBQVY7QUFDQyxXQUFLLE1BQUw7QUFDQ3VDLHFCQUFjaEMsS0FBZCxFQUFxQitCLGlCQUFyQixFQUF3Q2hDLFlBQXhDO0FBQ0E7QUFDRCxXQUFLLFNBQUw7QUFDQ21DLHNCQUFlbEMsS0FBZixFQUFzQitCLGlCQUF0QixFQUF5Q2hDLFlBQXpDO0FBQ0E7QUFDRCxXQUFLLE1BQUw7QUFDQ3lDLGdCQUFTQyxJQUFULEdBQWdCSixFQUFFSyxLQUFsQjtBQUNBO0FBQ0Q7QUFDQztBQVhGO0FBYUEsS0E1QkQ7QUE4QkEsSUFqQ0Q7QUFtQ0E7QUFFRCxFQTdDRDs7QUFnREEsS0FBSUMsaUJBQWlCLFNBQWpCQSxjQUFpQixDQUFTQyxVQUFULEVBQXFCZCxPQUFyQixFQUE4QjtBQUNsRDtBQUNBLE1BQUk1QixTQUFTMEMsV0FBV3ZDLElBQVgsQ0FBZ0IsTUFBaEIsQ0FBYjtBQUNBLE1BQUlILE9BQU9PLE1BQVgsRUFBbUI7QUFDbEJQLFVBQU8yQyxFQUFQLENBQVUsUUFBVixFQUFvQixVQUFTQyxDQUFULEVBQVk7QUFDL0JBLE1BQUVDLGNBQUY7QUFDQSxJQUZEO0FBR0E7O0FBRUQsTUFBSUMsT0FBT0MsTUFBUCxJQUFpQkQsT0FBT0MsTUFBUCxDQUFjQyxPQUEvQixJQUEwQ0YsT0FBT0MsTUFBUCxDQUFjQyxPQUFkLENBQXNCQyxJQUFwRSxFQUEwRTtBQUN6RUgsVUFBT0MsTUFBUCxDQUFjQyxPQUFkLENBQXNCQyxJQUF0QixDQUEyQlAsVUFBM0I7QUFDQTtBQUNELEVBWkQ7O0FBY0EsS0FBSVEsWUFBWSxTQUFaQSxTQUFZLENBQVMvRCxJQUFULEVBQWU7QUFDOUIsTUFBSVgsSUFBSUMsSUFBSixDQUFTQyxRQUFULENBQWtCQyxLQUFsQixDQUF3QlEsSUFBeEIsQ0FBSixFQUFtQztBQUNsQ0gsZUFBWVIsSUFBSUMsSUFBSixDQUFTQyxRQUFULENBQWtCQyxLQUFsQixDQUF3QlEsSUFBeEIsQ0FBWjtBQUNBLEdBRkQsTUFFTztBQUNOWCxPQUFJWSxJQUFKLENBQVMrRCxLQUFULENBQWVDLEtBQWYsQ0FBcUIsZ0NBQWdDakUsSUFBaEMsR0FBdUMsNkJBQTVEO0FBQ0E7QUFDRCxFQU5EOztBQVFBLEtBQUlrRSxtQkFBbUIsU0FBbkJBLGdCQUFtQixDQUFTekIsT0FBVCxFQUFrQjtBQUN4QyxNQUFJMEIsU0FBU3RFLFVBQVV1RSxTQUFWLEVBQWI7QUFBQSxNQUNDQyxTQUFTLEVBRFY7O0FBR0ExRSxJQUFFMEIsSUFBRixDQUFPb0IsT0FBUCxFQUFnQixVQUFTTSxDQUFULEVBQVlDLENBQVosRUFBZTs7QUFFOUIsT0FBSW1CLE9BQU9wQixDQUFQLE1BQWMsS0FBbEIsRUFBeUI7QUFDeEIsV0FBTyxJQUFQO0FBQ0EsSUFGRCxNQUVPLElBQUlvQixPQUFPcEIsQ0FBUCxNQUFjVixTQUFsQixFQUE2QjtBQUNuQ2dDLFdBQU90QixDQUFQLElBQVlDLENBQVo7QUFDQSxJQUZNLE1BRUEsSUFBSSxPQUFPbUIsT0FBT3BCLENBQVAsQ0FBUCxLQUFxQixVQUF6QixFQUFxQztBQUMzQyxRQUFJdUIsZUFBZUgsT0FBT3BCLENBQVAsRUFBVUEsQ0FBVixFQUFhQyxDQUFiLENBQW5CO0FBQ0FxQixXQUFPQyxhQUFhLENBQWIsQ0FBUCxJQUEwQkEsYUFBYSxDQUFiLENBQTFCO0FBQ0EsSUFITSxNQUdBO0FBQ05ELFdBQU9GLE9BQU9wQixDQUFQLENBQVAsSUFBb0JDLENBQXBCO0FBQ0E7QUFFRCxHQWJEOztBQWVBLFNBQU9xQixNQUFQO0FBRUEsRUFyQkQ7O0FBdUJBLEtBQUlFLGVBQWUsU0FBZkEsWUFBZSxDQUFTOUIsT0FBVCxFQUFrQitCLE1BQWxCLEVBQTBCOztBQUU1QyxNQUFJQyxhQUFhLEVBQWpCO0FBQUEsTUFDQzlDLFdBQVdoQyxFQUFFNkIsUUFBRixFQURaOztBQUdBLE1BQUlpQixRQUFRaUMsVUFBWixFQUF3QjtBQUN2Qi9DLFlBQVNnRCxPQUFULENBQWlCLEVBQWpCO0FBQ0EsR0FGRCxNQUVPLElBQUlILE1BQUosRUFBWTtBQUNsQjdDLFlBQVNnRCxPQUFULENBQWlCLDZEQUE2RGxDLFFBQVFsRCxRQUFyRSxHQUFnRixNQUFqRztBQUNBLEdBRk0sTUFFQTtBQUNOLE9BQUlrRCxRQUFRbUMsYUFBUixJQUF5QmhGLFNBQVM2QyxRQUFRbEQsUUFBakIsQ0FBN0IsRUFBeUQ7QUFDeERvQyxhQUFTZ0QsT0FBVCxDQUFpQi9FLFNBQVM2QyxRQUFRbEQsUUFBakIsQ0FBakI7QUFDQSxJQUZELE1BRU87O0FBRU4sUUFBSTtBQUNIa0Ysa0JBQWE5RSxFQUFFOEMsUUFBUWxELFFBQVYsQ0FBYjtBQUNBLEtBRkQsQ0FFRSxPQUFPc0YsR0FBUCxFQUFZLENBQ2I7O0FBRUQsUUFBSUosV0FBV3JELE1BQWYsRUFBdUI7QUFDdEJPLGNBQVNnRCxPQUFULENBQWlCRixXQUFXSyxJQUFYLEVBQWpCO0FBQ0EsS0FGRCxNQUVPO0FBQ056RixTQUFJQyxJQUFKLENBQVN5RixHQUFULENBQWFDLElBQWIsQ0FBa0IsRUFBQ0MsS0FBS3hDLFFBQVFsRCxRQUFkLEVBQXdCMkYsVUFBVSxNQUFsQyxFQUFsQixFQUE2REMsSUFBN0QsQ0FBa0UsVUFBU2QsTUFBVCxFQUFpQjtBQUNsRixVQUFJNUIsUUFBUTJDLGVBQVosRUFBNkI7QUFDNUJmLGdCQUFTMUUsRUFBRTBFLE1BQUYsRUFBVXJELElBQVYsQ0FBZXlCLFFBQVEyQyxlQUF2QixFQUF3Q04sSUFBeEMsRUFBVDtBQUNBOztBQUVELFVBQUlyQyxRQUFRbUMsYUFBWixFQUEyQjtBQUMxQmhGLGdCQUFTNkMsUUFBUWxELFFBQWpCLElBQTZCOEUsTUFBN0I7QUFDQTtBQUNEMUMsZUFBU2dELE9BQVQsQ0FBaUJOLE1BQWpCO0FBQ0EsTUFURCxFQVNHZ0IsSUFUSCxDQVNRLFlBQVc7QUFDbEIxRCxlQUFTMkQsTUFBVDtBQUNBLE1BWEQ7QUFZQTtBQUNEO0FBQ0Q7O0FBRUQsU0FBTzNELFFBQVA7QUFDQSxFQXZDRDs7QUF5Q0EsS0FBSTRELGVBQWUsU0FBZkEsWUFBZSxDQUFTOUMsT0FBVCxFQUFrQitDLEtBQWxCLEVBQXlCQyxTQUF6QixFQUFvQ0MsVUFBcEMsRUFBZ0RuRyxRQUFoRCxFQUEwRDtBQUM1RTtBQUNBLE1BQUlvQyxXQUFXaEMsRUFBRTZCLFFBQUYsRUFBZjtBQUFBLE1BQ0NlLFVBQVVaLFNBQVNZLE9BQVQsRUFEWDtBQUFBLE1BRUNpQyxTQUFVakYsYUFBYSxRQUZ4QjtBQUFBLE1BR0NvRyxXQUFXO0FBQ1ZILFVBQU9BLEtBREc7QUFFVkksZ0JBQWFILFNBRkg7QUFHVmpHLFVBQU8sSUFIRztBQUlWTSxZQUFTNEYsY0FBYyxFQUpiO0FBS1ZHLGtCQUFlLElBTEw7QUFNVnRHLGFBQVVBLFlBQVksSUFOWjtBQU9WcUYsa0JBQWUsS0FQTDtBQVFWa0IsV0FBUSxJQVJFO0FBU1ZDLGlCQUFjO0FBVEosR0FIWjtBQUFBLE1BY0NDLFdBQVcsSUFkWjtBQUFBLE1BZUNuRixTQUFTLElBZlY7QUFBQSxNQWdCQzZCLG9CQUFvQi9DLEVBQUU2QixRQUFGLEVBaEJyQjs7QUFrQkE7QUFDQWlCLFlBQVVBLFdBQVcsRUFBckI7QUFDQUEsWUFBVTlDLEVBQUVzRyxNQUFGLENBQVMsRUFBVCxFQUFhTixRQUFiLEVBQXVCbEQsT0FBdkIsQ0FBVjs7QUFFQSxNQUFJeUQsYUFBYTNCLGFBQWE5QixPQUFiLEVBQXNCK0IsTUFBdEIsRUFBOEJXLElBQTlCLENBQW1DLFVBQVNkLE1BQVQsRUFBaUI7O0FBRXBFM0IscUJBQWtCeUMsSUFBbEIsQ0FBdUIsVUFBU2QsTUFBVCxFQUFpQjtBQUN2QzFDLGFBQVNnRCxPQUFULENBQWlCTixNQUFqQjtBQUNBLElBRkQsRUFFR2dCLElBRkgsQ0FFUSxVQUFTaEIsTUFBVCxFQUFpQjtBQUN4QjFDLGFBQVMyRCxNQUFULENBQWdCakIsTUFBaEI7QUFDQSxJQUpEOztBQU1BO0FBQ0E1QixXQUFRbEQsUUFBUixHQUFtQkksRUFBRXdHLFNBQVNDLE1BQVQsQ0FBZ0IvQixNQUFoQixFQUF3QjVCLE9BQXhCLENBQUYsQ0FBbkI7QUFDQXBELE9BQUlDLElBQUosQ0FBU0MsUUFBVCxDQUFrQjhHLE9BQWxCLENBQTBCQyxlQUExQixDQUEwQzdELFFBQVFsRCxRQUFsRDtBQUNBa0QsV0FBUWxELFFBQVIsR0FBbUJJLEVBQUUsT0FBRixFQUFXNEcsTUFBWCxDQUFrQjlELFFBQVFsRCxRQUFSLENBQWlCaUgsS0FBakIsRUFBbEIsRUFBNEMxQixJQUE1QyxFQUFuQjs7QUFFQTtBQUNBdEMsZUFBWUMsT0FBWixFQUFxQkMsaUJBQXJCOztBQUVBO0FBQ0EsT0FBSStELGtCQUFrQjlHLEVBQUVzRyxNQUFGLENBQVMsRUFBVCxFQUFheEQsT0FBYixDQUF0QjtBQUNBQSxhQUFVeUIsaUJBQWlCekIsT0FBakIsQ0FBVjs7QUFFQTtBQUNBNUMsYUFBVTZHLFNBQVYsQ0FBb0JqRSxPQUFwQixFQUE2QkMsaUJBQTdCLEVBQWdEaEMsWUFBaEQsRUFBOEQrRixlQUE5RDs7QUFFQTtBQUNBO0FBQ0FsRSxXQUFROUIsS0FBUixHQUFnQixVQUFTa0csT0FBVCxFQUFrQjtBQUNqQ2pFLHNCQUFrQmpDLEtBQWxCLENBQXdCa0csT0FBeEI7QUFDQSxJQUZEO0FBSUEsR0E3QmdCLEVBNkJkdEIsSUE3QmMsQ0E2QlQsWUFBVztBQUNsQjFELFlBQVMyRCxNQUFULENBQWdCLEVBQUNyQixPQUFPLG9CQUFSLEVBQWhCO0FBQ0EsR0EvQmdCLENBQWpCOztBQWlDQTtBQUNBO0FBQ0E7QUFDQSxNQUFJLENBQUMxQixRQUFROUIsS0FBYixFQUFvQjtBQUNuQjhCLFdBQVE5QixLQUFSLEdBQWdCLFlBQVc7QUFDMUJ5RixlQUFXWixNQUFYLENBQWtCLHNCQUFsQjtBQUNBLElBRkQ7QUFHQTs7QUFFRCxTQUFPL0MsT0FBUDtBQUNBLEVBbkVEOztBQXNFQTs7Ozs7QUFLQSxLQUFJcUUsU0FBUyxTQUFUQSxNQUFTLENBQVNuRSxPQUFULEVBQWtCO0FBQzlCLFNBQU84QyxhQUFhOUMsT0FBYixFQUFzQnBELElBQUlZLElBQUosQ0FBU0MsSUFBVCxDQUFjQyxTQUFkLENBQXdCLE1BQXhCLEVBQWdDLFFBQWhDLENBQXRCLEVBQWlFLEVBQWpFLEVBQXFFLENBQUNMLFFBQVFXLEtBQVQsQ0FBckUsRUFBc0YsY0FBdEYsQ0FBUDtBQUNBLEVBRkQ7O0FBSUE7Ozs7O0FBS0EsS0FBSW9HLFdBQVcsU0FBWEEsUUFBVyxDQUFTcEUsT0FBVCxFQUFrQjtBQUNoQyxTQUFPOEMsYUFBYTlDLE9BQWIsRUFBc0JwRCxJQUFJWSxJQUFKLENBQVNDLElBQVQsQ0FBY0MsU0FBZCxDQUF3QixTQUF4QixFQUFtQyxRQUFuQyxDQUF0QixFQUFvRSxnQkFBcEUsRUFBc0YsQ0FDNUZMLFFBQVFDLEdBRG9GLEVBRTVGRCxRQUFRUSxFQUZvRixDQUF0RixFQUdKLGNBSEksQ0FBUDtBQUlBLEVBTEQ7O0FBT0E7Ozs7O0FBS0EsS0FBSXdHLFVBQVUsU0FBVkEsT0FBVSxDQUFTckUsT0FBVCxFQUFrQjtBQUMvQixTQUFPOEMsYUFBYTlDLE9BQWIsRUFBc0JwRCxJQUFJWSxJQUFKLENBQVNDLElBQVQsQ0FBY0MsU0FBZCxDQUF3QixRQUF4QixFQUFrQyxRQUFsQyxDQUF0QixFQUFtRSxlQUFuRSxFQUFvRixDQUMxRkwsUUFBUVUsRUFEa0YsRUFFMUZWLFFBQVFTLEtBRmtGLENBQXBGLEVBR0osZUFISSxDQUFQO0FBSUEsRUFMRDs7QUFPQTs7Ozs7QUFLQSxLQUFJd0csV0FBVyxTQUFYQSxRQUFXLENBQVN0RSxPQUFULEVBQWtCO0FBQ2hDLFNBQU84QyxhQUFhOUMsT0FBYixFQUFzQnBELElBQUlZLElBQUosQ0FBU0MsSUFBVCxDQUFjQyxTQUFkLENBQXdCLFNBQXhCLEVBQW1DLFFBQW5DLENBQXRCLEVBQW9FLGdCQUFwRSxFQUFzRixFQUF0RixFQUEwRixjQUExRixDQUFQO0FBQ0EsRUFGRDs7QUFJQTs7Ozs7QUFLQSxLQUFJNkcsU0FBUyxTQUFUQSxNQUFTLENBQVN2RSxPQUFULEVBQWtCO0FBQzlCLFNBQU84QyxhQUFhOUMsT0FBYixFQUFzQnBELElBQUlZLElBQUosQ0FBU0MsSUFBVCxDQUFjQyxTQUFkLENBQXdCLFFBQXhCLEVBQWtDLFFBQWxDLENBQXRCLEVBQW1FLGNBQW5FLEVBQW1GLEVBQW5GLEVBQXVGLGNBQXZGLENBQVA7QUFDQSxFQUZEOztBQUlBOzs7OztBQUtBLEtBQUk4RyxRQUFRLFNBQVJBLEtBQVEsQ0FBU3hFLE9BQVQsRUFBa0I7QUFDN0IsU0FBTzhDLGFBQWE5QyxPQUFiLEVBQXNCcEQsSUFBSVksSUFBSixDQUFTQyxJQUFULENBQWNDLFNBQWQsQ0FBd0IsU0FBeEIsRUFBbUMsUUFBbkMsQ0FBdEIsRUFBb0UsYUFBcEUsRUFBbUYsRUFBbkYsRUFBdUYsY0FBdkYsQ0FBUDtBQUNBLEVBRkQ7O0FBSUE7Ozs7O0FBS0EsS0FBSStHLFFBQVEsU0FBUkEsS0FBUSxDQUFTekUsT0FBVCxFQUFrQjtBQUM3QixTQUFPOEMsYUFBYTlDLE9BQWIsRUFBc0JwRCxJQUFJWSxJQUFKLENBQVNDLElBQVQsQ0FBY0MsU0FBZCxDQUF3QixNQUF4QixFQUFnQyxRQUFoQyxDQUF0QixFQUFpRSxhQUFqRSxFQUFnRixFQUFoRixFQUFvRixjQUFwRixDQUFQO0FBQ0EsRUFGRDs7QUFJQTs7Ozs7QUFLQSxLQUFJZ0gsVUFBVSxTQUFWQSxPQUFVLENBQVMxRSxPQUFULEVBQWtCO0FBQy9CLE1BQUlBLFFBQVEyRSxZQUFaLEVBQTBCO0FBQ3pCL0gsT0FBSUMsSUFBSixDQUFTQyxRQUFULENBQWtCQyxLQUFsQixDQUF3QmlELFFBQVEyRSxZQUFoQyxFQUE4QzNFLE9BQTlDLEVBQXVEcEQsSUFBSVksSUFBSixDQUFTQyxJQUFULENBQWNDLFNBQWQsQ0FBd0IsTUFBeEIsRUFBZ0MsUUFBaEMsQ0FBdkQsRUFDOENzQyxRQUFRMkUsWUFBUixHQUF1QixTQURyRSxFQUNnRixFQURoRixFQUNvRixjQURwRjtBQUVBO0FBQ0E7O0FBRUQsU0FBTzdCLGFBQWE5QyxPQUFiLEVBQXNCcEQsSUFBSVksSUFBSixDQUFTQyxJQUFULENBQWNDLFNBQWQsQ0FBd0IsTUFBeEIsRUFBZ0MsUUFBaEMsQ0FBdEIsRUFBaUUsY0FBakUsRUFBaUYsRUFBakYsRUFBcUYsUUFBckYsQ0FBUDtBQUNBLEVBUkQ7O0FBVUQ7O0FBRUNWLFNBQVF3RSxLQUFSLEdBQWdCK0MsTUFBaEI7QUFDQXZILFNBQVE0SCxJQUFSLEdBQWVKLEtBQWY7QUFDQXhILFNBQVE2SCxJQUFSLEdBQWVKLEtBQWY7QUFDQXpILFNBQVFrSCxPQUFSLEdBQWtCSSxRQUFsQjtBQUNBdEgsU0FBUThILEtBQVIsR0FBZ0JYLE1BQWhCO0FBQ0FuSCxTQUFRK0gsTUFBUixHQUFpQlYsT0FBakI7QUFDQXJILFNBQVFnSSxPQUFSLEdBQWtCWixRQUFsQjtBQUNBcEgsU0FBUStFLE1BQVIsR0FBaUIyQyxPQUFqQjtBQUNBMUgsU0FBUWlJLE1BQVIsR0FBaUJuQyxZQUFqQjtBQUNBOUYsU0FBUWtJLFFBQVIsR0FBbUI1RCxTQUFuQjtBQUNBdEUsU0FBUW1JLGFBQVIsR0FBd0J0RSxjQUF4Qjs7QUFFQTtBQUNBLEtBQUl1RSxtQkFBbUJoRyxLQUFLaUcsR0FBNUI7QUFBQSxLQUNDQyxXQUFXLEtBRFosQ0FsWWtCLENBbVlDOztBQUVuQmxJLGFBQVlSLElBQUlZLElBQUosQ0FBUytILFFBQVQsQ0FBa0JDLEdBQWxCLENBQXNCLGdCQUF0QixDQUFaOztBQUVBLEtBQUlDLE9BQU9DLFlBQVksWUFBVztBQUNqQyxNQUFJOUksSUFBSUMsSUFBSixDQUFTQyxRQUFULENBQWtCQyxLQUFsQixDQUF3QkssU0FBeEIsTUFBdUN3QyxTQUEzQyxFQUFzRDtBQUNyRDBCLGFBQVVsRSxTQUFWO0FBQ0F1SSxpQkFBY0YsSUFBZDtBQUNBOztBQUVELE1BQUlyRyxLQUFLaUcsR0FBTCxHQUFXRCxnQkFBWCxHQUE4QkUsUUFBbEMsRUFBNEM7QUFDM0MsU0FBTSxJQUFJTSxLQUFKLENBQVUscUNBQXFDeEksU0FBL0MsQ0FBTjtBQUNBO0FBQ0QsRUFUVSxFQVNSLEdBVFEsQ0FBWDtBQVlBLENBblpBLEVBbVpDUixJQUFJQyxJQUFKLENBQVNDLFFBQVQsQ0FBa0JDLEtBblpuQixDQUFEIiwiZmlsZSI6ImxpYnMvbW9kYWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIG1vZGFsLmpzIDIwMTYtMDctMDdcbiBHYW1iaW8gR21iSFxuIGh0dHA6Ly93d3cuZ2FtYmlvLmRlXG4gQ29weXJpZ2h0IChjKSAyMDE2IEdhbWJpbyBHbWJIXG4gUmVsZWFzZWQgdW5kZXIgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIChWZXJzaW9uIDIpXG4gW2h0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy9ncGwtMi4wLmh0bWxdXG4gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqL1xuXG5qc2UubGlicy50ZW1wbGF0ZS5tb2RhbCA9IGpzZS5saWJzLnRlbXBsYXRlLm1vZGFsIHx8IHt9O1xuXG4vKipcbiAqICMjIEhvbmV5Z3JpZCBNb2RhbCBEaWFsb2dzIExpYnJhcnlcbiAqXG4gKiBMaWJyYXJ5LWZ1bmN0aW9uIHRvIG9wZW4gZGVmYXVsdCBtb2RhbCBsYXllci4gIFRoaXMgZnVuY3Rpb24gZGVwZW5kcyBvbiBqUXVlcnkgJiBqUXVlcnkgVUkuXG4gKlxuICogQG1vZHVsZSBIb25leWdyaWQvTGlicy9tb2RhbFxuICogQGV4cG9ydHMganNlLmxpYnMudGVtcGxhdGUubW9kYWxcbiAqIEBpZ25vcmVcbiAqL1xuKGZ1bmN0aW9uKGV4cG9ydHMpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciAkYm9keSA9ICQoJ2JvZHknKSxcblx0XHR0cGxTdG9yZSA9IFtdLFxuXHRcdGV4dGVuc2lvbiA9IG51bGwsXG5cdC8vIE9iamVjdCBmb3IgZGVmYXVsdCBidXR0b25zXG5cdFx0YnV0dG9ucyA9IHtcblx0XHRcdHllczoge1xuXHRcdFx0XHRuYW1lOiBqc2UuY29yZS5sYW5nLnRyYW5zbGF0ZSgneWVzJywgJ2J1dHRvbnMnKSxcblx0XHRcdFx0dHlwZTogJ3N1Y2Nlc3MnLFxuXHRcdFx0XHRjbGFzczogJ2J0bi1zdWNjZXNzJ1xuXHRcdFx0fSxcblx0XHRcdG5vOiB7XG5cdFx0XHRcdG5hbWU6IGpzZS5jb3JlLmxhbmcudHJhbnNsYXRlKCdubycsICdidXR0b25zJyksXG5cdFx0XHRcdHR5cGU6ICdmYWlsJyxcblx0XHRcdFx0Y2xhc3M6ICdidG4tZGVmYXVsdCdcblx0XHRcdH0sXG5cdFx0XHRhYm9ydDoge1xuXHRcdFx0XHRuYW1lOiBqc2UuY29yZS5sYW5nLnRyYW5zbGF0ZSgnYWJvcnQnLCAnYnV0dG9ucycpLFxuXHRcdFx0XHR0eXBlOiAnZmFpbCcsXG5cdFx0XHRcdGNsYXNzOiAnYnRuLWRlZmF1bHQnXG5cdFx0XHR9LFxuXHRcdFx0b2s6IHtcblx0XHRcdFx0bmFtZToganNlLmNvcmUubGFuZy50cmFuc2xhdGUoJ29rJywgJ2J1dHRvbnMnKSxcblx0XHRcdFx0dHlwZTogJ3N1Y2Nlc3MnLFxuXHRcdFx0XHRjbGFzczogJ2J0bi1zdWNjZXNzJ1xuXHRcdFx0fSxcblx0XHRcdGNsb3NlOiB7XG5cdFx0XHRcdG5hbWU6IGpzZS5jb3JlLmxhbmcudHJhbnNsYXRlKCdjbG9zZScsICdidXR0b25zJyksXG5cdFx0XHRcdHR5cGU6ICdmYWlsJyxcblx0XHRcdFx0Y2xhc3M6ICdidG4tZGVmYXVsdCdcblx0XHRcdH1cblx0XHR9O1xuXG5cdC8qKlxuXHQgKiAgICBGdW5jdGlvbiB0byBnZXQgYWxsIGZvcm0gZGF0YSBzdG9yZWQgaW5zaWRlXG5cdCAqICAgIHRoZSBsYXllclxuXHQgKlxuXHQgKiAgICBAcGFyYW0gICAgICAgIHtvYmplY3R9ICAgICRzZWxmICAgICAgICBqUXVlcnkgc2VsZWN0aW9uIG9mIHRoZSBsYXllclxuXHQgKiAgICBAcmV0dXJuICAgIHtqc29ufSAgICAgICAgICAgICAgICAgICAgUmV0dXJucyBhIEpTT04gd2l0aCBhbGwgZm9ybSBkYXRhXG5cdCAqL1xuXHR2YXIgX2dldEZvcm1EYXRhID0gZnVuY3Rpb24oJHNlbGYsIGNoZWNrZm9ybSkge1xuXHRcdHZhciAkZm9ybXMgPSAkc2VsZlxuXHRcdFx0LmZpbHRlcignZm9ybScpXG5cdFx0XHQuYWRkKCRzZWxmLmZpbmQoJ2Zvcm0nKSksXG5cdFx0XHRmb3JtZGF0YSA9IHt9LFxuXHRcdFx0dmFsaWQgPSB0cnVlLFxuXHRcdFx0cHJvbWlzZXMgPSBbXTtcblxuXHRcdGlmICgkZm9ybXMubGVuZ3RoKSB7XG5cdFx0XHQkZm9ybXMuZWFjaChmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyICRmb3JtID0gJCh0aGlzKTtcblxuXHRcdFx0XHRpZiAoY2hlY2tmb3JtKSB7XG5cdFx0XHRcdFx0dmFyIGxvY2FsRGVmZXJyZWQgPSAkLkRlZmVycmVkKCk7XG5cdFx0XHRcdFx0cHJvbWlzZXMucHVzaChsb2NhbERlZmVycmVkKTtcblx0XHRcdFx0XHQkZm9ybS50cmlnZ2VyKCd2YWxpZGF0b3IudmFsaWRhdGUnLCB7ZGVmZXJyZWQ6IGxvY2FsRGVmZXJyZWR9KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGZvcm1kYXRhWyRmb3JtLmF0dHIoJ25hbWUnKSB8fCAkZm9ybS5hdHRyKCdpZCcpIHx8ICgnZm9ybV8nICsgbmV3IERhdGUoKS5nZXRUaW1lKCkgKiBNYXRoLnJhbmRvbSgpKV1cblx0XHRcdFx0XHQ9IGpzZS5saWJzLmZvcm0uZ2V0RGF0YSgkZm9ybSk7XG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gJC53aGVuXG5cdFx0ICAgICAgICAuYXBwbHkodW5kZWZpbmVkLCBwcm9taXNlcylcblx0XHQgICAgICAgIC50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0ICAgICAgICByZXR1cm4gZm9ybWRhdGE7XG5cdFx0ICAgICAgICB9LCBmdW5jdGlvbigpIHtcblx0XHRcdCAgICAgICAgcmV0dXJuIGZvcm1kYXRhO1xuXHRcdCAgICAgICAgfSlcblx0XHQgICAgICAgIC5wcm9taXNlKCk7XG5cdH07XG5cblx0LyoqXG5cdCAqICAgIEZ1bmN0aW9uIHRvIHRyYW5zZm9ybSB0aGUgY3VzdG9tIGJ1dHRvbnMgb2JqZWN0ICh3aGljaCBpc1xuXHQgKiAgICBpbmNvbXBhdGlibGUgd2l0aCBqUXVlcnkgVUkpIHRvIGEgalF1ZXJ5IFVJIGNvbXBhdGlibGUgZm9ybWF0XG5cdCAqXG5cdCAqICAgIEBwYXJhbSAgICAgICAge29iamVjdH0gICAgZGF0YXNldCAgICAgICAgQ3VzdG9tIGJ1dHRvbnMgb2JqZWN0IGZvciB0aGUgZGlhbG9nXG5cdCAqICAgIEBwYXJhbSAgICAgICAge3Byb21pc2V9ICAgIGRlZmVycmVkICAgIGRlZmVycmVkLW9iamVjdCB0byByZXNvbHZlIC8gcmVqZWN0IG9uIGNsb3NlXG5cdCAqICAgIEByZXR1cm4gICAge2FycmF5fSAgICAgICAgICAgICAgICAgICAgUmV0dXJucyBhIGpRdWVyeSBVSSBkaWFsb2cgY29tcGF0aWJsZSBidXR0b25zIGFycmF5XG5cdCAqL1xuXHR2YXIgX2dlbkJ1dHRvbnMgPSBmdW5jdGlvbihvcHRpb25zLCBleHRlbnNpb25EZWZlcnJlZCkge1xuXG5cdFx0Ly8gQ2hlY2sgaWYgYnV0dG9ucyBhcmUgYXZhaWxhYmxlXG5cdFx0aWYgKG9wdGlvbnMuYnV0dG9ucykge1xuXG5cdFx0XHR2YXIgcmVqZWN0SGFuZGxlciA9IGV4dGVuc2lvbi5nZXRSZWplY3RIYW5kbGVyLFxuXHRcdFx0XHRyZXNvbHZlSGFuZGxlciA9IGV4dGVuc2lvbi5nZXRSZXNvbHZlSGFuZGxlcjtcblxuXHRcdFx0JC5lYWNoKG9wdGlvbnMuYnV0dG9ucywgZnVuY3Rpb24oaywgdikge1xuXG5cdFx0XHRcdC8vIFNldHVwIGNsaWNrIGhhbmRsZXJcblx0XHRcdFx0b3B0aW9ucy5idXR0b25zW2tdLmV2ZW50ID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0dmFyICRzZWxmID0gJCh0aGlzKTtcblxuXHRcdFx0XHRcdC8vIElmIGEgY2FsbGJhY2sgaXMgZ2l2ZW4sIGV4ZWN1dGUgaXQgd2l0aFxuXHRcdFx0XHRcdC8vIHRoZSBjdXJyZW50IHNjb3BlXG5cdFx0XHRcdFx0aWYgKHR5cGVvZiB2LmNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0XHRpZiAoIXYuY2FsbGJhY2suYXBwbHkoJHNlbGYsIFtdKSkge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8gQWRkIHRoZSBkZWZhdWx0IGJlaGF2aW91clxuXHRcdFx0XHRcdC8vIGZvciB0aGUgY2xvc2UgIGZ1bmN0aW9uYWxpdHlcblx0XHRcdFx0XHQvLyBPbiBmYWlsLCByZWplY3QgdGhlIGRlZmVycmVkXG5cdFx0XHRcdFx0Ly8gb2JqZWN0LCBlbHNlIHJlc29sdmUgaXRcblx0XHRcdFx0XHRzd2l0Y2ggKHYudHlwZSkge1xuXHRcdFx0XHRcdFx0Y2FzZSAnZmFpbCc6XG5cdFx0XHRcdFx0XHRcdHJlamVjdEhhbmRsZXIoJHNlbGYsIGV4dGVuc2lvbkRlZmVycmVkLCBfZ2V0Rm9ybURhdGEpO1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdGNhc2UgJ3N1Y2Nlc3MnOlxuXHRcdFx0XHRcdFx0XHRyZXNvbHZlSGFuZGxlcigkc2VsZiwgZXh0ZW5zaW9uRGVmZXJyZWQsIF9nZXRGb3JtRGF0YSk7XG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0Y2FzZSAnbGluayc6XG5cdFx0XHRcdFx0XHRcdGxvY2F0aW9uLmhyZWYgPSB2LnZhbHVlO1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fTtcblxuXHRcdFx0fSk7XG5cblx0XHR9XG5cblx0fTtcblxuXG5cdHZhciBfZmluYWxpemVMYXllciA9IGZ1bmN0aW9uKCRjb250YWluZXIsIG9wdGlvbnMpIHtcblx0XHQvLyBQcmV2ZW50IHN1Ym1pdCBvbiBlbnRlciBpbiBpbm5lciBmb3Jtc1xuXHRcdHZhciAkZm9ybXMgPSAkY29udGFpbmVyLmZpbmQoJ2Zvcm0nKTtcblx0XHRpZiAoJGZvcm1zLmxlbmd0aCkge1xuXHRcdFx0JGZvcm1zLm9uKCdzdWJtaXQnLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGlmICh3aW5kb3cuZ2FtYmlvICYmIHdpbmRvdy5nYW1iaW8ud2lkZ2V0cyAmJiB3aW5kb3cuZ2FtYmlvLndpZGdldHMuaW5pdCkge1xuXHRcdFx0d2luZG93LmdhbWJpby53aWRnZXRzLmluaXQoJGNvbnRhaW5lcik7XG5cdFx0fVxuXHR9O1xuXG5cdHZhciBfc2V0TGF5ZXIgPSBmdW5jdGlvbihuYW1lKSB7XG5cdFx0aWYgKGpzZS5saWJzLnRlbXBsYXRlLm1vZGFsW25hbWVdKSB7XG5cdFx0XHRleHRlbnNpb24gPSBqc2UubGlicy50ZW1wbGF0ZS5tb2RhbFtuYW1lXTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0anNlLmNvcmUuZGVidWcuZXJyb3IoJ1tNT0RBTF0gQ2FuXFwndCBzZXQgbW9kYWw6IFwiJyArIG5hbWUgKyAnXCIuIEV4dGVuc2lvbiBkb2VzblxcJ3QgZXhpc3QnKTtcblx0XHR9XG5cdH07XG5cblx0dmFyIF90cmFuc2Zlck9wdGlvbnMgPSBmdW5jdGlvbihvcHRpb25zKSB7XG5cdFx0dmFyIG1hcHBlciA9IGV4dGVuc2lvbi5nZXRNYXBwZXIoKSxcblx0XHRcdHJlc3VsdCA9IHt9O1xuXG5cdFx0JC5lYWNoKG9wdGlvbnMsIGZ1bmN0aW9uKGssIHYpIHtcblxuXHRcdFx0aWYgKG1hcHBlcltrXSA9PT0gZmFsc2UpIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9IGVsc2UgaWYgKG1hcHBlcltrXSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdHJlc3VsdFtrXSA9IHY7XG5cdFx0XHR9IGVsc2UgaWYgKHR5cGVvZiBtYXBwZXJba10gPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0dmFyIG1hcHBlclJlc3VsdCA9IG1hcHBlcltrXShrLCB2KTtcblx0XHRcdFx0cmVzdWx0W21hcHBlclJlc3VsdFswXV0gPSBtYXBwZXJSZXN1bHRbMV07XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXN1bHRbbWFwcGVyW2tdXSA9IHY7XG5cdFx0XHR9XG5cblx0XHR9KTtcblxuXHRcdHJldHVybiByZXN1bHQ7XG5cblx0fTtcblxuXHR2YXIgX2dldFRlbXBsYXRlID0gZnVuY3Rpb24ob3B0aW9ucywgaWZyYW1lKSB7XG5cblx0XHR2YXIgJHNlbGVjdGlvbiA9IFtdLFxuXHRcdFx0ZGVmZXJyZWQgPSAkLkRlZmVycmVkKCk7XG5cblx0XHRpZiAob3B0aW9ucy5ub1RlbXBsYXRlKSB7XG5cdFx0XHRkZWZlcnJlZC5yZXNvbHZlKCcnKTtcblx0XHR9IGVsc2UgaWYgKGlmcmFtZSkge1xuXHRcdFx0ZGVmZXJyZWQucmVzb2x2ZSgnPGlmcmFtZSB3aWR0aD1cIjEwMCVcIiBoZWlnaHQ9XCIxMDAlXCIgZnJhbWVib3JkZXI9XCIwXCIgc3JjPVwiJyArIG9wdGlvbnMudGVtcGxhdGUgKyAnXCIgLz4nKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYgKG9wdGlvbnMuc3RvcmVUZW1wbGF0ZSAmJiB0cGxTdG9yZVtvcHRpb25zLnRlbXBsYXRlXSkge1xuXHRcdFx0XHRkZWZlcnJlZC5yZXNvbHZlKHRwbFN0b3JlW29wdGlvbnMudGVtcGxhdGVdKTtcblx0XHRcdH0gZWxzZSB7XG5cblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHQkc2VsZWN0aW9uID0gJChvcHRpb25zLnRlbXBsYXRlKTtcblx0XHRcdFx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoJHNlbGVjdGlvbi5sZW5ndGgpIHtcblx0XHRcdFx0XHRkZWZlcnJlZC5yZXNvbHZlKCRzZWxlY3Rpb24uaHRtbCgpKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRqc2UubGlicy54aHIuYWpheCh7dXJsOiBvcHRpb25zLnRlbXBsYXRlLCBkYXRhVHlwZTogJ2h0bWwnfSkuZG9uZShmdW5jdGlvbihyZXN1bHQpIHtcblx0XHRcdFx0XHRcdGlmIChvcHRpb25zLnNlY3Rpb25TZWxlY3Rvcikge1xuXHRcdFx0XHRcdFx0XHRyZXN1bHQgPSAkKHJlc3VsdCkuZmluZChvcHRpb25zLnNlY3Rpb25TZWxlY3RvcikuaHRtbCgpO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRpZiAob3B0aW9ucy5zdG9yZVRlbXBsYXRlKSB7XG5cdFx0XHRcdFx0XHRcdHRwbFN0b3JlW29wdGlvbnMudGVtcGxhdGVdID0gcmVzdWx0O1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0ZGVmZXJyZWQucmVzb2x2ZShyZXN1bHQpO1xuXHRcdFx0XHRcdH0pLmZhaWwoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRkZWZlcnJlZC5yZWplY3QoKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBkZWZlcnJlZDtcblx0fTtcblxuXHR2YXIgX2NyZWF0ZUxheWVyID0gZnVuY3Rpb24ob3B0aW9ucywgdGl0bGUsIGNsYXNzTmFtZSwgZGVmYnV0dG9ucywgdGVtcGxhdGUpIHtcblx0XHQvLyBTZXR1cCBkZWZhdWx0cyAmIGRlZmVycmVkIG9iamVjdHNcblx0XHR2YXIgZGVmZXJyZWQgPSAkLkRlZmVycmVkKCksXG5cdFx0XHRwcm9taXNlID0gZGVmZXJyZWQucHJvbWlzZSgpLFxuXHRcdFx0aWZyYW1lID0gKHRlbXBsYXRlID09PSAnaWZyYW1lJyksXG5cdFx0XHRkZWZhdWx0cyA9IHtcblx0XHRcdFx0dGl0bGU6IHRpdGxlLFxuXHRcdFx0XHRkaWFsb2dDbGFzczogY2xhc3NOYW1lLFxuXHRcdFx0XHRtb2RhbDogdHJ1ZSxcblx0XHRcdFx0YnV0dG9uczogZGVmYnV0dG9ucyB8fCBbXSxcblx0XHRcdFx0Y2xvc2VPbkVzY2FwZTogdHJ1ZSxcblx0XHRcdFx0dGVtcGxhdGU6IHRlbXBsYXRlIHx8IG51bGwsXG5cdFx0XHRcdHN0b3JlVGVtcGxhdGU6IGZhbHNlLFxuXHRcdFx0XHRjbG9zZVg6IHRydWUsXG5cdFx0XHRcdGNsb3NlT25PdXRlcjogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdGluc3RhbmNlID0gbnVsbCxcblx0XHRcdCRmb3JtcyA9IG51bGwsXG5cdFx0XHRleHRlbnNpb25EZWZlcnJlZCA9ICQuRGVmZXJyZWQoKTtcblxuXHRcdC8vIE1lcmdlIGN1c3RvbSBzZXR0aW5ncyB3aXRoIGRlZmF1bHQgc2V0dGluZ3Ncblx0XHRvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblx0XHRvcHRpb25zID0gJC5leHRlbmQoe30sIGRlZmF1bHRzLCBvcHRpb25zKTtcblxuXHRcdHZhciB0cGxSZXF1ZXN0ID0gX2dldFRlbXBsYXRlKG9wdGlvbnMsIGlmcmFtZSkuZG9uZShmdW5jdGlvbihyZXN1bHQpIHtcblxuXHRcdFx0ZXh0ZW5zaW9uRGVmZXJyZWQuZG9uZShmdW5jdGlvbihyZXN1bHQpIHtcblx0XHRcdFx0ZGVmZXJyZWQucmVzb2x2ZShyZXN1bHQpO1xuXHRcdFx0fSkuZmFpbChmdW5jdGlvbihyZXN1bHQpIHtcblx0XHRcdFx0ZGVmZXJyZWQucmVqZWN0KHJlc3VsdCk7XG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gR2VuZXJhdGUgdGVtcGxhdGVcblx0XHRcdG9wdGlvbnMudGVtcGxhdGUgPSAkKE11c3RhY2hlLnJlbmRlcihyZXN1bHQsIG9wdGlvbnMpKTtcblx0XHRcdGpzZS5saWJzLnRlbXBsYXRlLmhlbHBlcnMuc2V0dXBXaWRnZXRBdHRyKG9wdGlvbnMudGVtcGxhdGUpO1xuXHRcdFx0b3B0aW9ucy50ZW1wbGF0ZSA9ICQoJzxkaXY+JykuYXBwZW5kKG9wdGlvbnMudGVtcGxhdGUuY2xvbmUoKSkuaHRtbCgpO1xuXG5cdFx0XHQvLyBHZW5lcmF0ZSBkZWZhdWx0IGJ1dHRvbiBvYmplY3Rcblx0XHRcdF9nZW5CdXR0b25zKG9wdGlvbnMsIGV4dGVuc2lvbkRlZmVycmVkKTtcblxuXHRcdFx0Ly8gVHJhbnNmZXIgb3B0aW9ucyBvYmplY3QgdG8gZXh0ZW5zaW9uIG9wdGlvbiBvYmplY3Rcblx0XHRcdHZhciBvcmlnaW5hbE9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgb3B0aW9ucyk7XG5cdFx0XHRvcHRpb25zID0gX3RyYW5zZmVyT3B0aW9ucyhvcHRpb25zKTtcblxuXHRcdFx0Ly8gQ2FsbCBleHRlbnNpb25cblx0XHRcdGV4dGVuc2lvbi5vcGVuTGF5ZXIob3B0aW9ucywgZXh0ZW5zaW9uRGVmZXJyZWQsIF9nZXRGb3JtRGF0YSwgb3JpZ2luYWxPcHRpb25zKTtcblxuXHRcdFx0Ly8gUGFzc3Rocm91Z2ggb2YgdGhlIGNsb3NlIG1ldGhvZCBvZiB0aGUgbGF5ZXJcblx0XHRcdC8vIHRvIHRoZSBsYXllciBjYWxsZXJcblx0XHRcdHByb21pc2UuY2xvc2UgPSBmdW5jdGlvbihzdWNjZXNzKSB7XG5cdFx0XHRcdGV4dGVuc2lvbkRlZmVycmVkLmNsb3NlKHN1Y2Nlc3MpO1xuXHRcdFx0fTtcblxuXHRcdH0pLmZhaWwoZnVuY3Rpb24oKSB7XG5cdFx0XHRkZWZlcnJlZC5yZWplY3Qoe2Vycm9yOiAnVGVtcGxhdGUgbm90IGZvdW5kJ30pO1xuXHRcdH0pO1xuXG5cdFx0Ly8gVGVtcG9yYXJ5IGNsb3NlIGhhbmRsZXIgaWYgdGhlIHVwcGVyXG5cdFx0Ly8gZGVmZXJyZWQgaXNuJ3QgZmluaXNoZWQgbm93LiBJdCB3aWxsIGJlXG5cdFx0Ly8gb3ZlcndyaXR0ZW4gYWZ0ZXIgdGhlIGxheWVyIG9wZW5zXG5cdFx0aWYgKCFwcm9taXNlLmNsb3NlKSB7XG5cdFx0XHRwcm9taXNlLmNsb3NlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHRwbFJlcXVlc3QucmVqZWN0KCdDbG9zZWQgYWZ0ZXIgb3BlbmluZycpO1xuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRyZXR1cm4gcHJvbWlzZTtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiAgICBTaG9ydGN1dCBmdW5jdGlvbiBmb3IgYW4gYWxlcnQtbGF5ZXJcblx0ICogICAgQHBhcmFtICAgICAgICB7b2JqZWN0fSAgICBvcHRpb25zIE9wdGlvbnMgdGhhdCBhcmUgcGFzc2VkIHRvIHRoZSBtb2RhbCBsYXllclxuXHQgKiAgICBAcmV0dXJuICAgIHtwcm9taXNlfSAgICAgICAgICAgIFJldHVybnMgYSBwcm9taXNlXG5cdCAqL1xuXHR2YXIgX2FsZXJ0ID0gZnVuY3Rpb24ob3B0aW9ucykge1xuXHRcdHJldHVybiBfY3JlYXRlTGF5ZXIob3B0aW9ucywganNlLmNvcmUubGFuZy50cmFuc2xhdGUoJ2hpbnQnLCAnbGFiZWxzJyksICcnLCBbYnV0dG9ucy5jbG9zZV0sICcjbW9kYWxfYWxlcnQnKTtcblx0fTtcblxuXHQvKipcblx0ICogICAgU2hvcnRjdXQgZnVuY3Rpb24gZm9yIGFuIGNvbmZpcm0tbGF5ZXJcblx0ICogICAgQHBhcmFtICAgICAgICB7b2JqZWN0fSAgICBvcHRpb25zIE9wdGlvbnMgdGhhdCBhcmUgcGFzc2VkIHRvIHRoZSBtb2RhbCBsYXllclxuXHQgKiAgICBAcmV0dXJuICAgIHtwcm9taXNlfSAgICAgICAgICAgIFJldHVybnMgYSBwcm9taXNlXG5cdCAqL1xuXHR2YXIgX2NvbmZpcm0gPSBmdW5jdGlvbihvcHRpb25zKSB7XG5cdFx0cmV0dXJuIF9jcmVhdGVMYXllcihvcHRpb25zLCBqc2UuY29yZS5sYW5nLnRyYW5zbGF0ZSgnY29uZmlybScsICdsYWJlbHMnKSwgJ2NvbmZpcm1fZGlhbG9nJywgW1xuXHRcdFx0YnV0dG9ucy55ZXMsXG5cdFx0XHRidXR0b25zLm5vXG5cdFx0XSwgJyNtb2RhbF9hbGVydCcpO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiAgICBTaG9ydGN1dCBmdW5jdGlvbiBmb3IgYSBwcm9tcHQtbGF5ZXJcblx0ICogICAgQHBhcmFtICAgICAgICB7b2JqZWN0fSAgICBvcHRpb25zIE9wdGlvbnMgdGhhdCBhcmUgcGFzc2VkIHRvIHRoZSBtb2RhbCBsYXllclxuXHQgKiAgICBAcmV0dXJuICAgIHtwcm9taXNlfSAgICAgICAgICAgIFJldHVybnMgYSBwcm9taXNlXG5cdCAqL1xuXHR2YXIgX3Byb21wdCA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblx0XHRyZXR1cm4gX2NyZWF0ZUxheWVyKG9wdGlvbnMsIGpzZS5jb3JlLmxhbmcudHJhbnNsYXRlKCdwcm9tcHQnLCAnbGFiZWxzJyksICdwcm9tcHRfZGlhbG9nJywgW1xuXHRcdFx0YnV0dG9ucy5vayxcblx0XHRcdGJ1dHRvbnMuYWJvcnRcblx0XHRdLCAnI21vZGFsX3Byb21wdCcpO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiAgICBTaG9ydGN1dCBmdW5jdGlvbiBmb3IgYW4gc3VjY2Vzcy1sYXllclxuXHQgKiAgICBAcGFyYW0gICAgICAgIHtvYmplY3R9ICAgIG9wdGlvbnMgT3B0aW9ucyB0aGF0IGFyZSBwYXNzZWQgdG8gdGhlIG1vZGFsIGxheWVyXG5cdCAqICAgIEByZXR1cm4gICAge3Byb21pc2V9ICAgICAgICAgICAgUmV0dXJucyBhIHByb21pc2Vcblx0ICovXG5cdHZhciBfc3VjY2VzcyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblx0XHRyZXR1cm4gX2NyZWF0ZUxheWVyKG9wdGlvbnMsIGpzZS5jb3JlLmxhbmcudHJhbnNsYXRlKCdzdWNjZXNzJywgJ2xhYmVscycpLCAnc3VjY2Vzc19kaWFsb2cnLCBbXSwgJyNtb2RhbF9hbGVydCcpO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiAgICBTaG9ydGN1dCBmdW5jdGlvbiBmb3IgYW4gZXJyb3ItbGF5ZXJcblx0ICogICAgQHBhcmFtICAgICAgICB7b2JqZWN0fSAgICBvcHRpb25zIE9wdGlvbnMgdGhhdCBhcmUgcGFzc2VkIHRvIHRoZSBtb2RhbCBsYXllclxuXHQgKiAgICBAcmV0dXJuICAgIHtwcm9taXNlfSAgICAgICAgICAgIFJldHVybnMgYSBwcm9taXNlXG5cdCAqL1xuXHR2YXIgX2Vycm9yID0gZnVuY3Rpb24ob3B0aW9ucykge1xuXHRcdHJldHVybiBfY3JlYXRlTGF5ZXIob3B0aW9ucywganNlLmNvcmUubGFuZy50cmFuc2xhdGUoJ2Vycm9ycycsICdsYWJlbHMnKSwgJ2Vycm9yX2RpYWxvZycsIFtdLCAnI21vZGFsX2FsZXJ0Jyk7XG5cdH07XG5cblx0LyoqXG5cdCAqICAgIFNob3J0Y3V0IGZ1bmN0aW9uIGZvciBhIHdhcm5pbmctbGF5ZXJcblx0ICogICAgQHBhcmFtICAgICAgICB7b2JqZWN0fSAgICBvcHRpb25zIE9wdGlvbnMgdGhhdCBhcmUgcGFzc2VkIHRvIHRoZSBtb2RhbCBsYXllclxuXHQgKiAgICBAcmV0dXJuICAgIHtwcm9taXNlfSAgICAgICAgICAgIFJldHVybnMgYSBwcm9taXNlXG5cdCAqL1xuXHR2YXIgX3dhcm4gPSBmdW5jdGlvbihvcHRpb25zKSB7XG5cdFx0cmV0dXJuIF9jcmVhdGVMYXllcihvcHRpb25zLCBqc2UuY29yZS5sYW5nLnRyYW5zbGF0ZSgnd2FybmluZycsICdsYWJlbHMnKSwgJ3dhcm5fZGlhbG9nJywgW10sICcjbW9kYWxfYWxlcnQnKTtcblx0fTtcblxuXHQvKipcblx0ICogICAgU2hvcnRjdXQgZnVuY3Rpb24gZm9yIGFuIGluZm8tbGF5ZXJcblx0ICogICAgQHBhcmFtICAgICAgICB7b2JqZWN0fSAgICBvcHRpb25zIE9wdGlvbnMgdGhhdCBhcmUgcGFzc2VkIHRvIHRoZSBtb2RhbCBsYXllclxuXHQgKiAgICBAcmV0dXJuICAgIHtwcm9taXNlfSAgICAgICAgICAgIFJldHVybnMgYSBwcm9taXNlXG5cdCAqL1xuXHR2YXIgX2luZm8gPSBmdW5jdGlvbihvcHRpb25zKSB7XG5cdFx0cmV0dXJuIF9jcmVhdGVMYXllcihvcHRpb25zLCBqc2UuY29yZS5sYW5nLnRyYW5zbGF0ZSgnaW5mbycsICdsYWJlbHMnKSwgJ2luZm9fZGlhbG9nJywgW10sICcjbW9kYWxfYWxlcnQnKTtcblx0fTtcblxuXHQvKipcblx0ICogICAgU2hvcnRjdXQgZnVuY3Rpb24gZm9yIGFuIGlmcmFtZS1sYXllclxuXHQgKiAgICBAcGFyYW0gICAgICAgIHtvYmplY3R9ICAgIG9wdGlvbnMgT3B0aW9ucyB0aGF0IGFyZSBwYXNzZWQgdG8gdGhlIG1vZGFsIGxheWVyXG5cdCAqICAgIEByZXR1cm4gICAge3Byb21pc2V9ICAgICAgICAgICAgUmV0dXJucyBhIHByb21pc2Vcblx0ICovXG5cdHZhciBfaWZyYW1lID0gZnVuY3Rpb24ob3B0aW9ucykge1xuXHRcdGlmIChvcHRpb25zLmNvbnZlcnRNb2RhbCkge1xuXHRcdFx0anNlLmxpYnMudGVtcGxhdGUubW9kYWxbb3B0aW9ucy5jb252ZXJ0TW9kYWxdKG9wdGlvbnMsIGpzZS5jb3JlLmxhbmcudHJhbnNsYXRlKCdpbmZvJywgJ2xhYmVscycpLFxuXHRcdFx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuY29udmVydE1vZGFsICsgJ19kaWFsb2cnLCBbXSwgJyNtb2RhbF9hbGVydCcpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHJldHVybiBfY3JlYXRlTGF5ZXIob3B0aW9ucywganNlLmNvcmUubGFuZy50cmFuc2xhdGUoJ2luZm8nLCAnbGFiZWxzJyksICdpZnJhbWVfbGF5ZXInLCBbXSwgJ2lmcmFtZScpO1xuXHR9O1xuXG4vLyAjIyMjIyMjIyMjIFZBUklBQkxFIEVYUE9SVCAjIyMjIyMjIyMjXG5cblx0ZXhwb3J0cy5lcnJvciA9IF9lcnJvcjtcblx0ZXhwb3J0cy53YXJuID0gX3dhcm47XG5cdGV4cG9ydHMuaW5mbyA9IF9pbmZvO1xuXHRleHBvcnRzLnN1Y2Nlc3MgPSBfc3VjY2Vzcztcblx0ZXhwb3J0cy5hbGVydCA9IF9hbGVydDtcblx0ZXhwb3J0cy5wcm9tcHQgPSBfcHJvbXB0O1xuXHRleHBvcnRzLmNvbmZpcm0gPSBfY29uZmlybTtcblx0ZXhwb3J0cy5pZnJhbWUgPSBfaWZyYW1lO1xuXHRleHBvcnRzLmN1c3RvbSA9IF9jcmVhdGVMYXllcjtcblx0ZXhwb3J0cy5zZXRMYXllciA9IF9zZXRMYXllcjtcblx0ZXhwb3J0cy5maW5hbGl6ZUxheWVyID0gX2ZpbmFsaXplTGF5ZXI7XG5cblx0Ly8gU2V0IGRlZmF1bHQgbGF5ZXIuXG5cdHZhciBjdXJyZW50VGltZXN0YW1wID0gRGF0ZS5ub3csXG5cdFx0bGlmZXRpbWUgPSAxMDAwMDsgLy8gMTAgc2VjXG5cblx0ZXh0ZW5zaW9uID0ganNlLmNvcmUucmVnaXN0cnkuZ2V0KCdtYWluTW9kYWxMYXllcicpO1xuXG5cdHZhciBpbnR2ID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG5cdFx0aWYgKGpzZS5saWJzLnRlbXBsYXRlLm1vZGFsW2V4dGVuc2lvbl0gIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0X3NldExheWVyKGV4dGVuc2lvbik7XG5cdFx0XHRjbGVhckludGVydmFsKGludHYpO1xuXHRcdH1cblxuXHRcdGlmIChEYXRlLm5vdyAtIGN1cnJlbnRUaW1lc3RhbXAgPiBsaWZldGltZSkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdNb2RhbCBleHRlbnNpb24gd2FzIG5vdCBsb2FkZWQ6ICcgKyBleHRlbnNpb24pO1xuXHRcdH1cblx0fSwgMzAwKTtcblxuXG59KGpzZS5saWJzLnRlbXBsYXRlLm1vZGFsKSk7Il19

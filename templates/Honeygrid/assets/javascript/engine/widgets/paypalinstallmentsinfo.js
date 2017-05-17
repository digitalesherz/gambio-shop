'use strict';

/* --------------------------------------------------------------
	paypalinstallmentsinfo.js 2017-01-13
	Gambio GmbH
	http://www.gambio.de
	Copyright (c) 2016 Gambio GmbH
	Released under the GNU General Public License (Version 2)
	[http://www.gnu.org/licenses/gpl-2.0.html]
	--------------------------------------------------------------
*/

gambio.widgets.module('paypalinstallmentsinfo', [], function (data) {
	'use strict';

	// ########## VARIABLE INITIALIZATION ##########

	var $this = $(this),
	    defaults = {
		thirdPartyPaymentsBlock: []
	},
	    options = $.extend(true, {}, defaults, data),
	    module = {};

	module.init = function (done) {
		var addCloseHandler = function addCloseHandler() {
			$('div.pp_cs_popup, div.pp_cs_popup button.mfp-close').on('click', function (e) {
				$(e.target).closest('div.pp_cs_popup').remove();
			});
		};

		$('div.popup_installments_info', $this).on('click', function (e) {
			var $popup = $('.pp_cs_popup', $this),
			    $newpopup = void 0,
			    amount = $(e.target).data('amount');

			if (amount === 'dynamic') {
				var priceText = $('#attributes-calc-price div.current-price-container').text(),
				    dynamount;
				dynamount = priceText.replace(/(.*?[\d.,]+\s\S+)?.*?([.,\d]+)\s\S+(.+%)?$/, '$2');
				dynamount = dynamount.replace(/[,.](\d{3})/g, '$1').replace(/(\d+)[.,](\d\d)/, '$1.$2');
				amount = dynamount;
			}

			$('body > div.pp_cs_popup').remove();
			$popup.clone().appendTo('body');
			addCloseHandler();
			$('body > div.pp_cs_popup').show();

			if ($('body > div.pp_cs_popup > div.pp_cs_popup_inner').length === 0) {
				var contentUrl = jse.core.config.get('appUrl') + '/shop.php?do=PayPal/InstallmentOptions';
				$('body > div.pp_cs_popup').load(contentUrl, { 'amount': amount }, function () {
					$('div.pp_cs_popup button.mfp-close').on('click', addCloseHandler);
				});
			}
		});
		done();
	};

	return module;
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndpZGdldHMvcGF5cGFsaW5zdGFsbG1lbnRzaW5mby5qcyJdLCJuYW1lcyI6WyJnYW1iaW8iLCJ3aWRnZXRzIiwibW9kdWxlIiwiZGF0YSIsIiR0aGlzIiwiJCIsImRlZmF1bHRzIiwidGhpcmRQYXJ0eVBheW1lbnRzQmxvY2siLCJvcHRpb25zIiwiZXh0ZW5kIiwiaW5pdCIsImRvbmUiLCJhZGRDbG9zZUhhbmRsZXIiLCJvbiIsImUiLCJ0YXJnZXQiLCJjbG9zZXN0IiwicmVtb3ZlIiwiJHBvcHVwIiwiJG5ld3BvcHVwIiwiYW1vdW50IiwicHJpY2VUZXh0IiwidGV4dCIsImR5bmFtb3VudCIsInJlcGxhY2UiLCJjbG9uZSIsImFwcGVuZFRvIiwic2hvdyIsImxlbmd0aCIsImNvbnRlbnRVcmwiLCJqc2UiLCJjb3JlIiwiY29uZmlnIiwiZ2V0IiwibG9hZCJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7Ozs7OztBQVVBQSxPQUFPQyxPQUFQLENBQWVDLE1BQWYsQ0FDQyx3QkFERCxFQUVDLEVBRkQsRUFHQyxVQUFTQyxJQUFULEVBQ0E7QUFDQzs7QUFFQTs7QUFDQSxLQUFJQyxRQUFRQyxFQUFFLElBQUYsQ0FBWjtBQUFBLEtBQ0NDLFdBQVc7QUFDVkMsMkJBQXlCO0FBRGYsRUFEWjtBQUFBLEtBSUNDLFVBQVVILEVBQUVJLE1BQUYsQ0FBUyxJQUFULEVBQWUsRUFBZixFQUFtQkgsUUFBbkIsRUFBNkJILElBQTdCLENBSlg7QUFBQSxLQUtDRCxTQUFTLEVBTFY7O0FBT0NBLFFBQU9RLElBQVAsR0FBYyxVQUFTQyxJQUFULEVBQWU7QUFDNUIsTUFBSUMsa0JBQWtCLFNBQWxCQSxlQUFrQixHQUFXO0FBQ2hDUCxLQUFFLG1EQUFGLEVBQXVEUSxFQUF2RCxDQUEwRCxPQUExRCxFQUFtRSxVQUFTQyxDQUFULEVBQVk7QUFDOUVULE1BQUVTLEVBQUVDLE1BQUosRUFBWUMsT0FBWixDQUFvQixpQkFBcEIsRUFBdUNDLE1BQXZDO0FBQ0EsSUFGRDtBQUdBLEdBSkQ7O0FBTUFaLElBQUUsNkJBQUYsRUFBaUNELEtBQWpDLEVBQXdDUyxFQUF4QyxDQUEyQyxPQUEzQyxFQUFvRCxVQUFTQyxDQUFULEVBQVk7QUFDL0QsT0FBSUksU0FBU2IsRUFBRSxjQUFGLEVBQWtCRCxLQUFsQixDQUFiO0FBQUEsT0FBdUNlLGtCQUF2QztBQUFBLE9BQ0lDLFNBQVNmLEVBQUVTLEVBQUVDLE1BQUosRUFBWVosSUFBWixDQUFpQixRQUFqQixDQURiOztBQUdBLE9BQUdpQixXQUFXLFNBQWQsRUFDQTtBQUNDLFFBQUlDLFlBQVloQixFQUFFLG9EQUFGLEVBQXdEaUIsSUFBeEQsRUFBaEI7QUFBQSxRQUNDQyxTQUREO0FBRUFBLGdCQUFZRixVQUFVRyxPQUFWLENBQWtCLDRDQUFsQixFQUFnRSxJQUFoRSxDQUFaO0FBQ0FELGdCQUFZQSxVQUFVQyxPQUFWLENBQWtCLGNBQWxCLEVBQWtDLElBQWxDLEVBQXdDQSxPQUF4QyxDQUFnRCxpQkFBaEQsRUFBbUUsT0FBbkUsQ0FBWjtBQUNBSixhQUFTRyxTQUFUO0FBQ0E7O0FBRURsQixLQUFFLHdCQUFGLEVBQTRCWSxNQUE1QjtBQUNBQyxVQUFPTyxLQUFQLEdBQWVDLFFBQWYsQ0FBd0IsTUFBeEI7QUFDQWQ7QUFDQVAsS0FBRSx3QkFBRixFQUE0QnNCLElBQTVCOztBQUVBLE9BQUd0QixFQUFFLGdEQUFGLEVBQW9EdUIsTUFBcEQsS0FBK0QsQ0FBbEUsRUFDQTtBQUNDLFFBQUlDLGFBQWFDLElBQUlDLElBQUosQ0FBU0MsTUFBVCxDQUFnQkMsR0FBaEIsQ0FBb0IsUUFBcEIsSUFBZ0Msd0NBQWpEO0FBQ0E1QixNQUFFLHdCQUFGLEVBQTRCNkIsSUFBNUIsQ0FBaUNMLFVBQWpDLEVBQTZDLEVBQUUsVUFBVVQsTUFBWixFQUE3QyxFQUFtRSxZQUFXO0FBQzdFZixPQUFFLGtDQUFGLEVBQXNDUSxFQUF0QyxDQUF5QyxPQUF6QyxFQUFrREQsZUFBbEQ7QUFDQSxLQUZEO0FBR0E7QUFDRCxHQXpCRDtBQTBCQUQ7QUFDQSxFQWxDRDs7QUFvQ0QsUUFBT1QsTUFBUDtBQUNBLENBcERGIiwiZmlsZSI6IndpZGdldHMvcGF5cGFsaW5zdGFsbG1lbnRzaW5mby5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdHBheXBhbGluc3RhbGxtZW50c2luZm8uanMgMjAxNy0wMS0xM1xuXHRHYW1iaW8gR21iSFxuXHRodHRwOi8vd3d3LmdhbWJpby5kZVxuXHRDb3B5cmlnaHQgKGMpIDIwMTYgR2FtYmlvIEdtYkhcblx0UmVsZWFzZWQgdW5kZXIgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIChWZXJzaW9uIDIpXG5cdFtodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvZ3BsLTIuMC5odG1sXVxuXHQtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuKi9cblxuZ2FtYmlvLndpZGdldHMubW9kdWxlKFxuXHQncGF5cGFsaW5zdGFsbG1lbnRzaW5mbycsXG5cdFtdLFxuXHRmdW5jdGlvbihkYXRhKVxuXHR7XG5cdFx0J3VzZSBzdHJpY3QnO1xuXG5cdFx0Ly8gIyMjIyMjIyMjIyBWQVJJQUJMRSBJTklUSUFMSVpBVElPTiAjIyMjIyMjIyMjXG5cdFx0dmFyICR0aGlzID0gJCh0aGlzKSxcblx0XHRcdGRlZmF1bHRzID0ge1xuXHRcdFx0XHR0aGlyZFBhcnR5UGF5bWVudHNCbG9jazogW11cblx0XHRcdH0sXG5cdFx0XHRvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzLCBkYXRhKSxcblx0XHRcdG1vZHVsZSA9IHt9O1xuXG5cdFx0XHRtb2R1bGUuaW5pdCA9IGZ1bmN0aW9uKGRvbmUpIHtcblx0XHRcdFx0bGV0IGFkZENsb3NlSGFuZGxlciA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdCQoJ2Rpdi5wcF9jc19wb3B1cCwgZGl2LnBwX2NzX3BvcHVwIGJ1dHRvbi5tZnAtY2xvc2UnKS5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRcdFx0XHQkKGUudGFyZ2V0KS5jbG9zZXN0KCdkaXYucHBfY3NfcG9wdXAnKS5yZW1vdmUoKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdCQoJ2Rpdi5wb3B1cF9pbnN0YWxsbWVudHNfaW5mbycsICR0aGlzKS5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRcdFx0bGV0ICRwb3B1cCA9ICQoJy5wcF9jc19wb3B1cCcsICR0aGlzKSwgJG5ld3BvcHVwLFxuXHRcdFx0XHRcdCAgICBhbW91bnQgPSAkKGUudGFyZ2V0KS5kYXRhKCdhbW91bnQnKTtcblxuXHRcdFx0XHRcdGlmKGFtb3VudCA9PT0gJ2R5bmFtaWMnKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHZhciBwcmljZVRleHQgPSAkKCcjYXR0cmlidXRlcy1jYWxjLXByaWNlIGRpdi5jdXJyZW50LXByaWNlLWNvbnRhaW5lcicpLnRleHQoKSxcblx0XHRcdFx0XHRcdFx0ZHluYW1vdW50O1xuXHRcdFx0XHRcdFx0ZHluYW1vdW50ID0gcHJpY2VUZXh0LnJlcGxhY2UoLyguKj9bXFxkLixdK1xcc1xcUyspPy4qPyhbLixcXGRdKylcXHNcXFMrKC4rJSk/JC8sICckMicpO1xuXHRcdFx0XHRcdFx0ZHluYW1vdW50ID0gZHluYW1vdW50LnJlcGxhY2UoL1ssLl0oXFxkezN9KS9nLCAnJDEnKS5yZXBsYWNlKC8oXFxkKylbLixdKFxcZFxcZCkvLCAnJDEuJDInKTtcblx0XHRcdFx0XHRcdGFtb3VudCA9IGR5bmFtb3VudDtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHQkKCdib2R5ID4gZGl2LnBwX2NzX3BvcHVwJykucmVtb3ZlKCk7XG5cdFx0XHRcdFx0JHBvcHVwLmNsb25lKCkuYXBwZW5kVG8oJ2JvZHknKTtcblx0XHRcdFx0XHRhZGRDbG9zZUhhbmRsZXIoKTtcblx0XHRcdFx0XHQkKCdib2R5ID4gZGl2LnBwX2NzX3BvcHVwJykuc2hvdygpO1xuXG5cdFx0XHRcdFx0aWYoJCgnYm9keSA+IGRpdi5wcF9jc19wb3B1cCA+IGRpdi5wcF9jc19wb3B1cF9pbm5lcicpLmxlbmd0aCA9PT0gMClcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRsZXQgY29udGVudFVybCA9IGpzZS5jb3JlLmNvbmZpZy5nZXQoJ2FwcFVybCcpICsgJy9zaG9wLnBocD9kbz1QYXlQYWwvSW5zdGFsbG1lbnRPcHRpb25zJztcblx0XHRcdFx0XHRcdCQoJ2JvZHkgPiBkaXYucHBfY3NfcG9wdXAnKS5sb2FkKGNvbnRlbnRVcmwsIHsgJ2Ftb3VudCc6IGFtb3VudCB9LCBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdFx0JCgnZGl2LnBwX2NzX3BvcHVwIGJ1dHRvbi5tZnAtY2xvc2UnKS5vbignY2xpY2snLCBhZGRDbG9zZUhhbmRsZXIpO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdFx0ZG9uZSgpO1xuXHRcdFx0fTtcblxuXHRcdHJldHVybiBtb2R1bGU7XG5cdH1cbik7Il19

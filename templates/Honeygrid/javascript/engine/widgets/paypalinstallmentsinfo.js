/* --------------------------------------------------------------
	paypalinstallmentsinfo.js 2017-01-13
	Gambio GmbH
	http://www.gambio.de
	Copyright (c) 2016 Gambio GmbH
	Released under the GNU General Public License (Version 2)
	[http://www.gnu.org/licenses/gpl-2.0.html]
	--------------------------------------------------------------
*/

gambio.widgets.module(
	'paypalinstallmentsinfo',
	[],
	function(data)
	{
		'use strict';

		// ########## VARIABLE INITIALIZATION ##########
		var $this = $(this),
			defaults = {
				thirdPartyPaymentsBlock: []
			},
			options = $.extend(true, {}, defaults, data),
			module = {};

			module.init = function(done) {
				let addCloseHandler = function() {
					$('div.pp_cs_popup, div.pp_cs_popup button.mfp-close').on('click', function(e) {
						$(e.target).closest('div.pp_cs_popup').remove();
					});
				}

				$('div.popup_installments_info', $this).on('click', function(e) {
					let $popup = $('.pp_cs_popup', $this), $newpopup,
					    amount = $(e.target).data('amount');

					if(amount === 'dynamic')
					{
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

					if($('body > div.pp_cs_popup > div.pp_cs_popup_inner').length === 0)
					{
						let contentUrl = jse.core.config.get('appUrl') + '/shop.php?do=PayPal/InstallmentOptions';
						$('body > div.pp_cs_popup').load(contentUrl, { 'amount': amount }, function() {
							$('div.pp_cs_popup button.mfp-close').on('click', addCloseHandler);
						});
					}
				});
				done();
			};

		return module;
	}
);
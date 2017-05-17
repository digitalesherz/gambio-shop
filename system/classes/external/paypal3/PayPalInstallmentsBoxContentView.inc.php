<?php
/* --------------------------------------------------------------
   PayPalInstallmentsBoxContentView.inc.php 2016-10-11
   Gambio GmbH
   http://www.gambio.de
   Copyright (c) 2016 Gambio GmbH
   Released under the GNU General Public License (Version 2)
   [http://www.gnu.org/licenses/gpl-2.0.html]
   --------------------------------------------------------------
*/

class PayPalInstallmentsBoxContentView extends ContentView
{
	public function __construct()
	{
		parent::__construct();
		$this->set_content_template('boxes/box_paypalinstallments.html');
	}

	public function prepare_data()
	{
		$this->build_html = false;

		$t_query = 'SELECT
						configuration_value
					FROM
						`configuration`
					WHERE
						configuration_value = "true" AND
						configuration_key = "MODULE_PAYMENT_PAYPAL3_INSTALLMENTS_STATUS"';

		$t_result = xtc_db_query($t_query);
		if(xtc_db_num_rows($t_result) > 0 || $_SESSION['style_edit_mode'] == 'edit')
		{
			$this->build_html= true;
		}
	}
}

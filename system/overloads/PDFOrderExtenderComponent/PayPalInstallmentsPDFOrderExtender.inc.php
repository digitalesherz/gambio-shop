<?php
/* --------------------------------------------------------------
	PayPalInstallmentsPDFOrderExtender.inc.php 2016-10-11
	Gambio GmbH
	http://www.gambio.de
	Copyright (c) 2016 Gambio GmbH
	Released under the GNU General Public License (Version 2)
	[http://www.gnu.org/licenses/gpl-2.0.html]
	--------------------------------------------------------------
*/

$languageTextManager = MainFactory::create_object('LanguageTextManager', array(), true);
$languageTextManager->init_from_lang_file('ot_paypal3_instfee_module', $_SESSION['languages_id']);

class PayPalInstallmentsPDFOrderExtender extends PayPalInstallmentsPDFOrderExtender_parent
{
	public function __construct()
	{
		if(is_callable('parent::__construct'))
		{
			parent::__construct();
		}
	}

	public function extendOrderTotal($order_total)
	{
		$order_total = parent::extendOrderTotal($order_total);
		if($this->v_data_array['order']->info['payment_method'] === 'paypal3_installments')
		{
			$order_total_new = [];
			foreach($order_total as $ot_entry)
			{
				if(strpos($ot_entry['TITLE'], MODULE_ORDER_TOTAL_PAYPAL3_INSTFEE_FEE_TITLE . ':') !== false)
				{
					$order_total_new[] = ['TITLE' => '', 'TEXT' => ''];
				}
				$order_total_new[] = $ot_entry;
			}
			$order_total = $order_total_new;
		}
		return $order_total;
	}

	public function extendOrderInfo($order_info)
	{
		$order_info = parent::extendOrderInfo($order_info);
		if($this->v_data_array['order']->info['payment_method'] === 'paypal3_installments')
		{
			$order_info['PAYMENT_METHOD'][1] = MODULE_ORDER_TOTAL_PAYPAL3_INSTFEE_FEE_PAYMENT_METHOD_TITLE;
		}
		return $order_info;
	}


}
<?php
/* --------------------------------------------------------------
	PayPalInstallmentSpecificUpstreamPresentmentContentView.inc.php 2016-10-27
	Gambio GmbH
	http://www.gambio.de
	Copyright (c) 2016 Gambio GmbH
	Released under the GNU General Public License (Version 2)
	[http://www.gnu.org/licenses/gpl-2.0.html]
	--------------------------------------------------------------
*/

class PayPalInstallmentSpecificUpstreamPresentmentContentView extends ContentView
{
	protected $lender;
	protected $cashPurchasePrice;
	protected $numberOfInstallments;
	protected $borrowingRate;
	protected $annualPercentageRate;
	protected $installmentAmount;
	protected $totalAmount;
	protected $currency;
	protected $representativeFinancingCode;

	protected $qualifyingOptions;
	protected $nonQualifyingOptions;

	protected $requiredData = [];

	public function __construct()
	{
		parent::__construct();

		$this->set_content_template('module/paypalinstallmentspecific.html');
		$this->set_flat_assigns(true);
		$this->set_caching_enabled(false);
		$this->requiredData = ['lender', 'cashPurchasePrice', 'currency', 'numberOfInstallments', 'borrowingRate', 'annualPercentageRate', 'installmentAmount', 'totalAmount',
			'qualifyingOptions', 'nonQualifyingOptions', 'representativeFinancingCode' ];
	}

	public function __set($name, $value)
	{
		if(property_exists($this, $name))
		{
			switch($name)
			{
				case 'cashPurchasePrice':
				case 'installmentAmount':
				case 'totalAmount':
					$value = sprintf('%s&nbsp;%s', number_format($value, 2, ',', ''), $this->currency);
					break;
				case 'borrowingRate':
				case 'annualPercentageRate':
					$value = number_format($value, 2, ',', '');
					break;
				default:
			}
			$this->{$name} = $value;
		}
	}

	public function prepare_data()
	{
		foreach($this->requiredData as $propertyName)
		{
			if($this->{$propertyName} === null)
			{
				throw new Exception('Required data missing: ' . $propertyName);
			}
			else
			{
				$this->set_content_data($propertyName, $this->{$propertyName});
			}
		}

		$installmentOptionsContentView = MainFactory::create('ContentView');
		$installmentOptionsContentView->set_content_template('module/paypalinstallmentoptions.html');
		$installmentOptionsContentView->set_flat_assigns(true);
		$installmentOptionsContentView->set_caching_enabled(false);
		$installmentOptionsContentView->set_content_data('lender',                      $this->lender);
		$installmentOptionsContentView->set_content_data('cashPurchasePrice',           $this->cashPurchasePrice);
		$installmentOptionsContentView->set_content_data('currency',                    $this->currency);
		$installmentOptionsContentView->set_content_data('qualifyingOptions',           $this->qualifyingOptions);
		// $installmentOptionsContentView->set_content_data('nonQualifyingOptions',        $this->nonQualifyingOptions);
		$installmentOptionsContentView->set_content_data('representativeFinancingCode', $this->representativeFinancingCode);
		$this->set_content_data('installmentOptions', $installmentOptionsContentView->get_html());
	}

}
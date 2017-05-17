<?php
/* --------------------------------------------------------------
	PayPalInstallments.inc.php 2016-12-09
	Gambio GmbH
	http://www.gambio.de
	Copyright (c) 2016 Gambio GmbH
	Released under the GNU General Public License (Version 2)
	[http://www.gnu.org/licenses/gpl-2.0.html]
	--------------------------------------------------------------
*/

class PayPalInstallments
{
	public function getInstallmentInfo($amount = 0, $currency = 'EUR', $country = STORE_COUNTRY)
	{
		$financingOptions = json_encode([
				'financing_country_code' => $country,
				'transaction_amount' => [
					'value'         => $amount,
					'currency_code' => $currency,
				],
			]);
		$request      = MainFactory::create('PayPalRestRequest', 'POST', '/v1/credit/calculated-financing-options', $financingOptions, 'inst');
		$service      = MainFactory::create('PayPalRestService');
		$response     = $service->performRequest($request);
		$responseBody = $response->getResponseObject();
		return $responseBody;
	}

	/** takes an array of financing options and returns the one with the highest APR and lowest monthly payment */
	public function getRepresentativeOption($financingOptions)
	{
		$representativeOption = false;
		$highestAPR = 0;
		$lowestMonthly = 999999;
		foreach($financingOptions as $financingOption)
		{
			if($financingOption->credit_financing->apr >= $highestAPR)
			{
				$highestAPR = $financingOption->credit_financing->apr;
				if($financingOption->monthly_payment->value <= $lowestMonthly)
				{
					$representativeOption = $financingOption;
					$lowestMonthly = $financingOption->monthly_payment->value;
				}
			}
		}
		return $representativeOption;
	}

	public function getFinancingByCode($financingCode)
	{
		$request      = MainFactory::create('PayPalRestRequest', 'GET', '/v1/credit/credit-financing/' . $financingCode, 'inst');
		$service      = MainFactory::create('PayPalRestService');
		$response     = $service->performRequest($request);
		$responseBody = $response->getResponseObject();
		return $responseBody;
	}

	/**
	 * return an array with keys 'amount' and 'currency' representing the minimum amount for which installments are available
	 *
	 * @return array keys: 'amount' (double), 'currency' (3-letter currency symbol)
	 */
	public function getMinimumAmount()
	{
		return ['amount' => 99.00, 'currency' => 'EUR'];
	}

	/**
	 * return an array with keys 'amount' and 'currency' representing the maximum amount for which installments are available
	 *
	 * @return array keys: 'amount' (double), 'currency' (3-letter currency symbol)
	 */
	public function getMaximumAmount()
	{
		return ['amount' => 5000.00, 'currency' => 'EUR'];
	}
}

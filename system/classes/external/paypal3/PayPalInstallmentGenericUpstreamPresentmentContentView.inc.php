<?php
/* --------------------------------------------------------------
	PayPalInstallmentGenericUpstreamPresentmentContentView.inc.php 2016-09-19
	Gambio GmbH
	http://www.gambio.de
	Copyright (c) 2016 Gambio GmbH
	Released under the GNU General Public License (Version 2)
	[http://www.gnu.org/licenses/gpl-2.0.html]
	--------------------------------------------------------------
*/

class PayPalInstallmentGenericUpstreamPresentmentContentView extends ContentView
{
	public function __construct()
	{
		die(__CLASS__);
		parent::__construct();

		$this->set_content_template('module/paypalinstallmentgeneric.html');
		$this->set_flat_assigns(true);
		$this->set_caching_enabled(false);
	}
}

<?php
/* --------------------------------------------------------------
  paypalinstallments.php 2016-10-11
  Gambio GmbH
  http://www.gambio.de
  Copyright (c) 2016 Gambio GmbH
  Released under the GNU General Public License (Version 2)
  [http://www.gnu.org/licenses/gpl-2.0.html]
  --------------------------------------------------------------
*/


$coo_paypal = MainFactory::create_object('PayPalInstallmentsBoxContentView');
$t_box_html = $coo_paypal->get_html();

$gm_box_pos = $GLOBALS['coo_template_control']->get_menubox_position('paypalinstallments');
$this->set_content_data($gm_box_pos, $t_box_html);

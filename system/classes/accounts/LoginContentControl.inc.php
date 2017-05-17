<?php
/* --------------------------------------------------------------
   LoginContentControl 2017-01-19
   Gambio GmbH
   http://www.gambio.de
   Copyright (c) 2017 Gambio GmbH
   Released under the GNU General Public License (Version 2)
   [http://www.gnu.org/licenses/gpl-2.0.html]
   --------------------------------------------------------------


   based on:
   (c) 2000-2001 The Exchange Project  (earlier name of osCommerce)
   (c) 2002-2003 osCommerce(login.php,v 1.79 2003/05/19); www.oscommerce.com
   (c) 2003      nextcommerce (login.php,v 1.13 2003/08/17); www.nextcommerce.org
   (c) 2003 XT-Commerce - community made shopping http://www.xt-commerce.com ($Id: login.php 1143 2005-08-11 11:58:59Z gwinger $)

   Released under the GNU General Public License
   -----------------------------------------------------------------------------------------
   Third Party contribution:

   guest account idea by Ingo T. <xIngox@web.de>
   ---------------------------------------------------------------------------------------*/

// include needed functions
require_once (DIR_FS_INC . 'xtc_array_to_string.inc.php');
require_once(DIR_FS_INC . 'xtc_write_user_info.inc.php');

MainFactory::load_class('DataProcessing');

class LoginContentControl extends DataProcessing
{
	public function proceed()
	{
		$gm_log = MainFactory::create_object('GMTracker');
		$gm_log->gm_delete();
		$info_message = '';
		
		if($gm_log->gm_ban() == false)
		{
			if(isset($this->v_data_array['GET']['action']) && ($this->v_data_array['GET']['action'] == 'process'))
			{
				$loginSuccess = false;
				
				if(!empty($this->v_data_array['POST']['email_address']))
				{
					/** @var AuthService $authService */
					$authService = StaticGXCoreLoader::getService('Auth');
					$credentials = MainFactory::create('UsernamePasswordCredentials',
					                                   new NonEmptyStringType(trim($this->v_data_array['POST']['email_address'])),
					                                   new StringType(xtc_db_prepare_input($this->v_data_array['POST']['password'])));
					
					$loginSuccess = $authService->authUser($credentials);
				}
				
				if(!$loginSuccess)
				{
					$this->v_data_array['GET']['login'] = 'fail';
					$info_message                       = TEXT_LOGIN_ERROR;
					$gm_log->gm_track();
				}
				else
				{
					$email_address = xtc_db_prepare_input($this->v_data_array['POST']['email_address']);
					
					// Check if email exists
					$check_customer_query = xtc_db_query("SELECT 
														customers_id, 
														customers_password 
													FROM 
														" . TABLE_CUSTOMERS . " 
													WHERE 
														customers_email_address = '" . xtc_db_input($email_address) . "' 
														AND account_type = '0'");
					
					$check_customer = xtc_db_fetch_array($check_customer_query);
					
					// Check if the password needs to be rehashed. 
					$hash = $authService->getRehashedPassword(new StringType(xtc_db_prepare_input($this->v_data_array['POST']['password'])),
					                                          new NonEmptyStringType($check_customer['customers_password']));
					
					if($hash !== $check_customer['customers_password']
					   && gm_get_conf('GM_PASSWORD_REENCRYPT') === 'true'
					)
					{
						$db = StaticGXCoreLoader::getDatabaseQueryBuilder();
						
						$db->update('customers', ['customers_password' => $hash],
						            ['customers_email_address' => $email_address]);
					}
					
					$gm_log->gm_delete(true);
					
					$this->loginAfterSuccessfulAuthorization($check_customer['customers_id']);
					
					if($_SESSION['cart']->count_contents() > 0)
					{
						if(isset($this->v_data_array['GET']['checkout_started'])
						   && $this->v_data_array['GET']['checkout_started'] == 1
						)
						{
							$this->set_redirect_url(xtc_href_link(FILENAME_CHECKOUT_SHIPPING, '', 'SSL'));
						}
						else
						{
							$this->set_redirect_url(xtc_href_link(FILENAME_ACCOUNT, '', 'SSL'));
						}
					}
					else
					{
						$this->set_redirect_url(xtc_href_link(FILENAME_DEFAULT));
					}
				}
			}
		}
		else
		{
			// delete banned ips
			$info_message = GM_LOGIN_ERROR;
		}
		
		if($this->v_data_array['GET']['info_message'])
		{
			$info_message = htmlentities_wrapper($this->v_data_array['GET']['info_message']);
		}
		elseif(isset($_SESSION['gm_info_message']))
		{
			$info_message = htmlentities_wrapper(urldecode($_SESSION['gm_info_message']));
			unset($_SESSION['gm_info_message']);
		}
		
		$t_checkout_started_get_param = '';
		if(isset($this->v_data_array['GET']['checkout_started']) && $this->v_data_array['GET']['checkout_started'] == 1)
		{
			$t_checkout_started_get_param = 'checkout_started=1';
		}
		
		$t_input_mail_value = '';
		if(isset($this->v_data_array['POST']['email_address']))
		{
			$t_input_mail_value = htmlentities_wrapper(gm_prepare_string($this->v_data_array['POST']['email_address'],
			                                                             true));
		}
		
		$coo_login_view = MainFactory::create_object('LoginContentView');
		$coo_login_view->set_('info_message', $info_message);
		$coo_login_view->set_('checkout_started_get_param', $t_checkout_started_get_param);
		$coo_login_view->set_('input_mail_value', $t_input_mail_value);
		$coo_login_view->set_('cart_contents_count', $_SESSION['cart']->count_contents());
		
		$this->v_output_buffer = $coo_login_view->get_html();
		
		return true;
	}
	
	
	/**
	 * @param int $customerId
	 */
	public function loginAfterSuccessfulAuthorization($customerId)
	{
		$result = xtc_db_query("SELECT 
									customers_id, 
									customers_vat_id, 
									customers_firstname, 
									customers_lastname, 
									customers_gender, 
									customers_email_address, 
									customers_default_address_id 
								FROM 
									" . TABLE_CUSTOMERS . " 
								WHERE 
									customers_id = " . (int)$customerId);
		
		$customerData = xtc_db_fetch_array($result);
		
		if(SESSION_RECREATE === 'True')
		{
			xtc_session_recreate();
		}
		
		$query  = xtc_db_query("SELECT 
									entry_country_id, 
									entry_zone_id,
									customer_b2b_status
								FROM 
									" . TABLE_ADDRESS_BOOK . " 
								WHERE 
									customers_id = '" . (int)$customerData['customers_id'] . "' AND 
									address_book_id = '" . $customerData['customers_default_address_id'] . "'");
		$result = xtc_db_fetch_array($query);
		
		$_SESSION['customer_gender']             = $customerData['customers_gender'];
		$_SESSION['customer_first_name']         = $customerData['customers_firstname'];
		$_SESSION['customer_last_name']          = $customerData['customers_lastname'];
		$_SESSION['customer_id']                 = $customerData['customers_id'];
		$_SESSION['customer_vat_id']             = $customerData['customers_vat_id'];
		$_SESSION['customer_default_address_id'] = $customerData['customers_default_address_id'];
		$_SESSION['customer_country_id']         = $result['entry_country_id'];
		$_SESSION['customer_zone_id']            = $result['entry_zone_id'];
		update_customer_b2b_status($result['customer_b2b_status']);
		
		// write customers status in session
		require DIR_FS_CATALOG . 'includes/write_customers_status.php';
		
		$t_customers_info_array = array(
			'customers_info_date_of_last_logon' => 'now()',
			'customers_info_number_of_logons'   => 'customers_info_number_of_logons + 1'
		);
		$this->wrapped_db_perform(__FUNCTION__, TABLE_CUSTOMERS_INFO, $t_customers_info_array, 'update',
		                          'customers_info_id = ' . (int)$_SESSION['customer_id'], 'db_link', false);
		
		xtc_write_user_info((int)$_SESSION['customer_id']);
		// restore cart contents
		$_SESSION['cart']->restore_contents();
		$_SESSION['wishList']->restore_contents();
		
		$loginExtender = MainFactory::create_object('LoginExtenderComponent');
		$loginExtender->set_data('customers_id', (int)$_SESSION['customer_id']);
		$loginExtender->proceed();
	}
}

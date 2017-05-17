<?php

/* --------------------------------------------------------------
   PostInstallationUpdateShopTopExtender.inc.php 2016-12-30
   Gambio GmbH
   http://www.gambio.de
   Copyright (c) 2016 Gambio GmbH
   Released under the GNU General Public License (Version 2)
   [http://www.gnu.org/licenses/gpl-2.0.html]
   --------------------------------------------------------------
*/

/**
 * Class PostInstallationUpdateShopTopExtender
 * 
 * Hook the PostInstallationShopExtender and PostUpdateShopExtender execution in application top. 
 */
class PostInstallationUpdateShopTopExtender extends PostInstallationUpdateShopTopExtender_parent
{
	public function proceed()
	{
		parent::proceed();
		
		// Execute the post installation extenders. 
		if (file_exists(DIR_FS_CATALOG . 'cache/execute_post_installation_shop_extenders')) {
			$coo_post_installation_shop_component = MainFactory::create_object('PostInstallationShopExtenderComponent');
			$coo_post_installation_shop_component->set_data('GET', $_GET);
			$coo_post_installation_shop_component->set_data('POST', $_POST);
			$coo_post_installation_shop_component->proceed();
			@unlink(DIR_FS_CATALOG . 'cache/execute_post_installation_shop_extenders');
		}
		
		// Execute the post update extenders. 
		if (file_exists(DIR_FS_CATALOG . 'cache/execute_post_update_shop_extenders')) {
			$coo_post_update_shop_component = MainFactory::create_object('PostUpdateShopExtenderComponent');
			$coo_post_update_shop_component->set_data('GET', $_GET);
			$coo_post_update_shop_component->set_data('POST', $_POST);
			$coo_post_update_shop_component->proceed();
			@unlink(DIR_FS_CATALOG . 'cache/execute_post_update_shop_extenders');
		}
	}
}
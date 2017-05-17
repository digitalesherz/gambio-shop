<?php
/* --------------------------------------------------------------
   ArticleTabs_JSSectionExtender.inc.php 2016-09-08
   Gambio GmbH
   http://www.gambio.de
   Copyright (c) 2016 Gambio GmbH
   Released under the GNU General Public License (Version 2)
   [http://www.gnu.org/licenses/gpl-2.0.html]
   --------------------------------------------------------------
*/

class ArticleTabs_JSSectionExtender extends ArticleTabs_JSSectionExtender_parent
{
	protected function article_tabs_add()
	{
		include_once(get_usermod(DIR_FS_CATALOG . 'admin/html/assets/javascript/engine/libs/editor_instances.min.js'));
		include_once(get_usermod(DIR_FS_CATALOG . 'admin/html/assets/javascript/engine/libs/editor_values.min.js'));
		include_once(get_usermod(DIR_FS_CATALOG . 'admin/html/assets/javascript/legacy/article_tabs/article_tabs_add.js'));
	}

	protected function article_tabs_edit()
	{
		include_once(get_usermod(DIR_FS_CATALOG . 'admin/html/assets/javascript/engine/libs/editor_instances.min.js'));
		include_once(get_usermod(DIR_FS_CATALOG . 'admin/html/assets/javascript/engine/libs/editor_values.min.js'));
		include_once(get_usermod(DIR_FS_CATALOG . 'admin/html/assets/javascript/legacy/article_tabs/article_tabs_edit.js'));
	}

	protected function article_tabs_delete()
	{
		include_once(get_usermod(DIR_FS_CATALOG . 'admin/html/assets/javascript/legacy/article_tabs/article_tabs_delete.js'));
	}
}

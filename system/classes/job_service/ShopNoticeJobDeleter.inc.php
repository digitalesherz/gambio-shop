<?php
/* --------------------------------------------------------------
   ShopNoticeJobDeleter.inc.php 2016-09-07
   Gambio GmbH
   http://www.gambio.de
   Copyright (c) 2016 Gambio GmbH
   Released under the GNU General Public License (Version 2)
   [http://www.gnu.org/licenses/gpl-2.0.html]
   --------------------------------------------------------------
*/


class ShopNoticeJobDeleter
{
	public function delete(ShopNoticeJob $noticeJob)
	{
		$shopNoticeJobId = $noticeJob->getShopNoticeJobId();
		$this->deleteById($shopNoticeJobId);
	}


	public function deleteById($p_shopNoticeJobId)
	{
		$c_shopNoticeJobId = (int)$p_shopNoticeJobId;
		if($c_shopNoticeJobId == 0)
		{
			throw new Exception('No Id to delete');
		}

		$this->delete_from_shop_notice_jobs($c_shopNoticeJobId);
		$this->delete_from_shop_notice_job_content($c_shopNoticeJobId);
	}
	
	public function deleteEditorPreferencesById($p_shopNoticeJobId)
	{
		$t_offlineMsgEditorIdentifier = 'editor-shop-online-offline-' . $p_shopNoticeJobId . '-offline_msg'; 
		$t_topbarMsgEditorIdentifier = 'editor-shop-online-offline-' . $p_shopNoticeJobId . '-topbar_msg'; 
		$t_popupMsgEditorIdentifier = 'editor-shop-online-offline-' . $p_shopNoticeJobId . '-popup_msg';
		
		$sql = '
			DELETE FROM user_configuration
			WHERE
				configuration_key = "' . $t_offlineMsgEditorIdentifier . '" OR
				configuration_key = "' . $t_topbarMsgEditorIdentifier . '" OR
				configuration_key = "' . $t_popupMsgEditorIdentifier . '"
		';
		xtc_db_query($sql);
	}


	protected function delete_from_shop_notice_jobs($p_shopNoticeJobId)
	{
		$sql = '
			DELETE FROM shop_notice_jobs
			WHERE
				shop_notice_job_id = "'.(int)$p_shopNoticeJobId.'"
		';
		xtc_db_query($sql);
	}


	protected function delete_from_shop_notice_job_content($p_shopNoticeJobId)
	{
		$sql = '
			DELETE FROM shop_notice_job_contents
			WHERE
				shop_notice_job_id = "'.(int)$p_shopNoticeJobId.'"
		';
		xtc_db_query($sql);
	}
}
<?php
/* --------------------------------------------------------------
  OrderAdminAjaxHandler.inc.php 2016-10-17
  Gambio GmbH
  http://www.gambio.de
  Copyright (c) 2016 Gambio GmbH
  Released under the GNU General Public License (Version 2)
  [http://www.gnu.org/licenses/gpl-2.0.html]
  --------------------------------------------------------------
 */

require_once(DIR_FS_CATALOG . 'gm/classes/JSON.php');
require_once DIR_FS_CATALOG . 'inc/get_payment_title.inc.php';

class OrderAdminAjaxHandler extends AjaxHandler
{
	protected $languageTextManager;
	
	
	function __construct()
	{
		$this->languageTextManager = MainFactory::create_object('LanguageTextManager', array('orders'));
	}
	
	
	function get_permission_status($p_customers_id = null)
	{
		if($_SESSION['customers_status']['customers_status_id'] === '0')
		{
			return true; // Admins only
		}
		
		return false;
	}
	
	
	function proceed()
	{
		$response = array();
		$action   = $this->v_data_array['GET']['action'];
		
		$funcName = '_action' . ucfirst($action);
		
		if(method_exists($this, $funcName))
		{
			$response = call_user_func(array($this, $funcName));
		}
		
		/** @noinspection PhpUndefinedClassInspection */
		$json       = new Services_JSON(SERVICES_JSON_LOOSE_TYPE);
		$outputJson = $json->encode($response);
		
		$this->v_output_buffer = $outputJson;
		
		return true;
	}
	
	
	protected function _actionDownloadPdf()
	{
		$fileArray = $this->_getFileArray();
		
		if($fileArray['type'] !== '' && $fileArray['filename'] !== ''
		   && file_exists(DIR_FS_CATALOG . 'export/' . $fileArray['type'] . '/' . $fileArray['filename'])
		)
		{
			header('Content-Type: application/force-download');
			header('Content-Type: application/octet-stream');
			header('Content-Disposition: attachment; filename="' . addslashes($fileArray['outputFilename']) . '.pdf"');
			header('Content-Transfer-Encoding: binary');
			header('Expires: 0');
			header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
			header('Pragma: public');
			readfile(DIR_FS_CATALOG . 'export/' . $fileArray['type'] . '/' . $fileArray['filename']);
		}
		else
		{
			echo 'File does not exist.';
		}
		
		xtc_db_close();
		exit(0);
	}
	
	
	protected function _actionShowPdf()
	{
		$fileArray = $this->_getFileArray();
		
		if($fileArray['type'] !== '' && $fileArray['filename'] !== ''
		   && file_exists(DIR_FS_CATALOG . 'export/' . $fileArray['type'] . '/' . $fileArray['filename'])
		)
		{
			header('Content-type: application/pdf');
			header('Content-disposition: inline; filename="' . addslashes($fileArray['outputFilename']) . '.pdf"');
			echo file_get_contents(DIR_FS_CATALOG . 'export/' . $fileArray['type'] . '/' . $fileArray['filename']);
		}
		else
		{
			echo 'File does not exist.';
		}
		
		xtc_db_close();
		exit(0);
	}
	
	
	protected function _getFileArray()
	{
		/** @var InvoiceArchiveReadService $invoiceReader */
		$invoiceReader = StaticGXCoreLoader::getService('InvoiceArchiveRead');
		$file          = '';
		
		if(array_key_exists('invoice_id', $_GET))
		{
			$invoices = $invoiceReader->getInvoiceListByConditions(['invoice_id' => (int)$_GET['invoice_id']]);
			
			if(!$invoices->isEmpty())
			{
				/** @var InvoiceListItem $invoice */
				$invoice        = $invoices->getItem(0);
				$file           = basename($invoice->getInvoiceFilename());
				$outputFilename = ucfirst($_GET['type']) . '-' . $invoice->getInvoiceNumber() . '-'
				                  . $invoice->getInvoiceDate()->format('d_m_Y');
			}
		}
		elseif(array_key_exists('invoice_number', $_GET) && array_key_exists('order_id', $_GET))
		{
			$conditions = [
				'invoice_number' => $_GET['invoice_number'],
				'order_id'       => (int)$_GET['order_id']
			];
			
			$invoices = $invoiceReader->getInvoiceListByConditions($conditions);
			
			if(!$invoices->isEmpty())
			{
				/** @var InvoiceListItem $invoice */
				$invoice        = $invoices->getItem(0);
				$file           = basename($invoice->getInvoiceFilename());
				$outputFilename = ucfirst($_GET['type']) . '-' . $invoice->getInvoiceNumber() . '-'
				                  . $invoice->getInvoiceDate()->format('d_m_Y');
			}
		}
		else
		{
			$file = trim(basename($_GET['file']));
			$type = trim((string)$_GET['type']);
			
			if($type == 'invoice')
			{
				$invoices = $invoiceReader->getInvoiceListByConditions(['invoice_file' => $file]);
				
				if(!$invoices->isEmpty())
				{
					/** @var InvoiceListItem $invoice */
					$invoice        = $invoices->getItem(0);
					$outputFilename = ucfirst($type) . '-' . $invoice->getInvoiceNumber() . '-'
					                  . $invoice->getInvoiceDate()->format('d_m_Y');
				}
				else
				{
					$outputFilename = ucfirst($type);
				}
			}
			elseif($type == 'packingslip')
			{
				$query  = 'SELECT `number`, `date` FROM packing_slips WHERE `filename` = "' . xtc_db_input($file) . '"';
				$result = xtc_db_query($query);
				if(xtc_db_num_rows($result))
				{
					$row            = xtc_db_fetch_array($result);
					$outputFilename = 'Packing-Slip-' . $row['number'] . '-' . date('d_m_Y', strtotime($row['date']));
				}
				else
				{
					$outputFilename = 'Packing-Slip';
				}
			}
		}
		
		$type = trim(basename($_GET['type']));
		
		$fileArray = [
			'type'           => basename($type),
			'filename'       => basename($file),
			'outputFilename' => basename($outputFilename)
		];
		
		return $fileArray;
	}
	
	
	protected function _actionDeletePdf()
	{
		$gmFormat = new GMOrderFormat();
		
		$_SESSION['coo_page_token']->is_valid($this->v_data_array['POST']['page_token']);
		
		$response = array('status' => 'error');
		
		$t_type = trim(basename($_POST['type']));
		
		if($t_type === 'packingslip')
		{
			$t_file = trim(basename($_POST['file']));
			if($t_file !== '' && file_exists(DIR_FS_CATALOG . 'export/' . $t_type . '/' . $t_file))
			{
				@unlink(DIR_FS_CATALOG . 'export/' . $t_type . '/' . $t_file);
			}
			
			$gmFormat->delete_id('packing_slip', $_POST['number']);
			xtc_db_query('DELETE FROM `packing_slips` WHERE `packing_slip_id` = "' . (int)$_POST['id'] . '"');
			
			$response['status'] = 'success';
		}
		else
		{
			/** @var InvoiceArchiveReadService $invoiceArchiveReader */
			$invoiceArchiveReader = StaticGXCoreLoader::getService('InvoiceArchiveRead');
			$invoiceListItem      = $invoiceArchiveReader->getInvoiceListItemById(new IdType((int)$_POST['id']));
			
			/** @var InvoiceArchiveWriteService $invoiceArchiveWriteService */
			$invoiceArchiveWriteService = StaticGXCoreLoader::getService('InvoiceArchiveWrite');
			$invoiceArchiveWriteService->deleteInvoiceById(new IdType((int)$_POST['id']));
			
			$gmFormat->delete_id('invoice', $invoiceListItem->getInvoiceNumber());
			
			$response['status'] = 'success';
		}
		
		$response['page_token'] = $_SESSION['coo_page_token']->generate_token();
		
		return $response;
	}
}
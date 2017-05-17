<?php
/* --------------------------------------------------------------
  InvoicePDFOrderExtender.inc.php 2016-10-12
  Gambio GmbH
  http://www.gambio.de
  Copyright (c) 2016 Gambio GmbH
  Released under the GNU General Public License (Version 2)
  [http://www.gnu.org/licenses/gpl-2.0.html]
  --------------------------------------------------------------
 */

class InvoicePDFOrderExtender extends InvoicePDFOrderExtender_parent
{
	function proceed()
	{
		ob_end_clean();
		$t_order_id = (int)$_GET['oID'];
		
		/** @var InvoiceArchiveReadService $invoiceArchiveReadService */
		$invoiceArchiveReadService = StaticGXCoreLoader::getService('InvoiceArchiveRead');
		$invoices = $invoiceArchiveReadService->getInvoiceListByConditions(['order_id' => $t_order_id]);
		
		?>
		<div class="invoice-packingslip hidden">
			<table border="0" width="100%" cellspacing="0" cellpadding="0">
				<thead>
					<tr>
						<th>
							<?php echo INVOICE_CREATED; ?>
						</th>
						<th>
							<?php echo PACKINGSLIP_CREATED; ?>
						</th>
					</tr>
				</thead>
				<tbody>
					<tr class="table-container">
						<td class="invoice-container" valign="top">
							<table border="0" width="100%" cellspacing="0" cellpadding="2" class="dataTableRow invoice" 
								   data-gx-controller="orders/orders_pdf_delete"
								   data-orders_pdf_delete-type="invoice"
								   data-gx-extension="visibility_switcher"
								   data-visibility_switcher-selections=".action-icons">
								<thead>
									<tr>
										<th><?php echo TITLE_ORDERS_BILLING_CODE; ?></th>
										<th><?php echo TEXT_DATE; ?></th>
										<th></th>
									</tr>
								</thead>
								<tbody>
								<?php
								
								if(!$invoices->isEmpty())
								{
									/** @var InvoiceListItem $invoiceListItem */
									foreach($invoices as $invoiceListItem)
									{
										$t_file = $invoiceListItem->getInvoiceFilename();
										?>
										<tr class="invoice visibility_switcher">
											<td>
												<?php echo $invoiceListItem->getInvoiceNumber(); ?>
											</td>
											<td>
												<?php echo xtc_datetime_short($invoiceListItem->getInvoiceDate()->format('Y-m-d H:i:s')); ?>
											</td>
											<td>
												<div class="action-icons">
													<a href="request_port.php?module=OrderAdmin&action=showPdf&type=invoice&file=<?php echo rawurlencode(basename($t_file)); ?>" target="_blank" class="icon-container"><i class="fa fa-eye"></i></a>
													<a href="request_port.php?module=OrderAdmin&action=downloadPdf&type=invoice&file=<?php echo rawurlencode(basename($t_file)); ?>" target="_blank" class="icon-container"><i class="fa fa-download"></i></a>
													
													<?php
													if(gm_pdf_is_installed() && !$invoiceListItem->isCancellationInvoice() && $invoiceListItem->getPaymentAddress()->getCountry() !== '')
													{
													?>
														<a href="gm_pdf_order.php?oID=<?php echo $t_order_id; ?>&type=invoice&cancel_invoice_id=<?php echo $invoiceListItem->getInvoiceId(); ?>" target="_blank" class="icon-container cancel-invoice" data-invoice-number="<?php echo $invoiceListItem->getInvoiceNumber(); ?>"><i class="fa fa-ban"></i></a>
													<?php
													}
													?>
													<a href="#" rel="<?php echo rawurlencode(basename($t_file)); ?>" class="delete_pdf icon-container" data-invoice-id="<?php echo $invoiceListItem->getInvoiceId(); ?>"><i class="fa fa-trash-o"></i></a>
												</div>
											</td>
										</tr>
										<?php
									}
									?>
									<tr style="display: none;" class="invoice">
										<td>
											<?php echo NO_INVOICE_CREATED; ?>
										</td>
									</tr>
									<?php
								}
								else
								{
									?>
									<tr class="invoice">
										<td>
											&mdash;
										</td>
									</tr>
									<?php
								}
								?>
								</tbody>
							</table>
						</td>
						<td class="packingslip-container" valign="top">
							<table border="0" width="100%" cellspacing="0" cellpadding="2" class="dataTableRow packingslip"
								   data-gx-controller="orders/orders_pdf_delete"
								   data-orders_pdf_delete-type="packingslip"
								   data-gx-extension="visibility_switcher"
								   data-visibility_switcher-selections=".action-icons">
								<thead>
									<tr>
										<th><?php echo TITLE_PACKINGS_BILLING_CODE; ?></th>
										<th><?php echo TEXT_DATE; ?></th>
										<th></th>
									</tr>
								</thead>
								<tbody>
								<?php
								$query = 'SELECT 
												`packing_slip_id`, 
												`number`, 
												`date`, 
												`filename` 
											FROM `packing_slips` 
											WHERE `order_id` = ' . $t_order_id;
								$result = xtc_db_query($query);
								
								if(xtc_db_num_rows($result))
								{
									while($row = xtc_db_fetch_array($result))
									{
										?>
										<tr class="packingslip visibility_switcher">
											<td>
												<?php echo $row['number'] ?>
											</td>
											<td>
												<?php echo xtc_datetime_short($row['date']); ?>
											</td>
											<td>
												<div class="action-icons">
													<a href="request_port.php?module=OrderAdmin&action=showPdf&type=packingslip&file=<?php echo rawurlencode(basename($row['filename'])); ?>" target="_blank" class="icon-container"><i class="fa fa-eye"></i></a>
													<a href="request_port.php?module=OrderAdmin&action=downloadPdf&type=packingslip&file=<?php echo rawurlencode(basename($row['filename'])); ?>" target="_blank" class="icon-container"><i class="fa fa-download"></i></a>
													<a href="#" rel="<?php echo rawurlencode(basename($row['filename'])); ?>" class="delete_pdf icon-container" data-packing-slip-number="<?php echo $row['number']; ?>" data-packing-slip-id="<?php echo $row['packing_slip_id']; ?>"><i class="fa fa-trash-o"></i></a>
												</div>
											</td>
										</tr>
										<?php
									}
									?>
									<tr style="display: none;" class="packingslip">
										<td>
											<?PHP echo NO_PACKINGSLIP_CREATED; ?>
										</td>
									</tr>
									<?php
								}
								else
								{
									?>
									<tr class="packingslip">
										<td>
											&mdash;
										</td>
									</tr>
									<?php
								}
								?>
								</tbody>
							</table>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
		<?php
		ob_start();
		$this->addContent();
		parent::proceed();
	}
}
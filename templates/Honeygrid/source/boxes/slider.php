<?php
/* --------------------------------------------------------------
  slider.php 2016-11-09
  Gambio GmbH
  http://www.gambio.de
  Copyright (c) 2016 Gambio GmbH
  Released under the GNU General Public License (Version 2)
  [http://www.gnu.org/licenses/gpl-2.0.html]
  --------------------------------------------------------------
 */

/**
 * @var SliderContentControl $sliderContentControl
 */
$sliderContentControl = MainFactory::create('SliderContentControl', $this->category_id, $this->coo_product->pID);
$sliderContentControl->proceed();

$this->set_content_data('IMGSLIDER', $sliderContentControl->get_response());

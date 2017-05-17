<?php
/* --------------------------------------------------------------
   SliderContentControl.inc.php 2016-11-09
   Gambio GmbH
   http://www.gambio.de
   Copyright (c) 2016 Gambio GmbH
   Released under the GNU General Public License (Version 2)
   [http://www.gnu.org/licenses/gpl-2.0.html]
   --------------------------------------------------------------
*/

MainFactory::load_class('DataProcessing');

/**
 * Class SliderContentControl
 */
class SliderContentControl extends DataProcessing
{
	/**
	 * @var int
	 */
	protected $sliderId = 0;
	
	/**
	 * @var int
	 */
	protected $categoryId;
	
	/**
	 * @var int
	 */
	protected $productId;
	
	/**
	 * @var SliderReadService
	 */
	protected $sliderReadService;
	
	
	public function __construct($categoryId = 0, $productId = 0)
	{
		parent::__construct();
		
		$this->categoryId = (int)$categoryId;
		$this->productId  = (int)$productId;
		
		$this->sliderReadService = StaticGXCoreLoader::getService('SliderRead');
	}
	
	
	/**
	 * @return bool
	 */
	public function proceed()
	{
		switch($this->_getPage())
		{
			case 'startpage':
				$this->_setStartPageSliderId();
				break;
			case 'category':
				$this->_setCategorySliderId();
				break;
			case 'product':
				$this->_setProductSliderId();
				break;
			case 'content':
				$this->_setContentSliderId();
				break;
		}
		
		$this->v_output_buffer = $this->_getHtml();
		
		return true;
	}
	
	
	/**
	 * @return int
	 */
	public function getSliderId()
	{
		return $this->sliderId;
	}
	
	
	/**
	 * @return string
	 */
	protected function _getPage()
	{
		if(isset($_GET['manufacturers_id']))
		{
			return '';
		}
		
		// on index.php? (home or category)
		if(strpos(strtolower(gm_get_env_info("PHP_SELF")), FILENAME_DEFAULT) !== false)
		{
			if($this->categoryId === 0 && isset($_GET['filter_fv_id']) == false
			   && isset($_GET['filter_price_min']) == false
			   && isset($_GET['filter_price_max']) == false
			)
			{
				return 'startpage';
			}
			
			return 'category';
		}
		
		// slider for productinfo
		if(strpos(strtolower(gm_get_env_info("PHP_SELF")), FILENAME_PRODUCT_INFO) !== false && $this->productId !== 0)
		{
			return 'product';
		}
		
		// slider for content
		if(strpos(strtolower(gm_get_env_info("PHP_SELF")), FILENAME_CONTENT) !== false && !empty($_GET['coID']))
		{
			return 'content';
		}
		
		return '';
	}
	
	
	/**
	 * @return string
	 */
	protected function _getHtml()
	{
		$html = '';
		
		// slider available?
		if((int)$this->sliderId !== 0)
		{
			$sliderContentView = MainFactory::create_object('ImageSliderContentView');
			
			$sliderContentView->set_('slider_set_id', $this->sliderId);
			$sliderContentView->set_('language_id', (int)$_SESSION['languages_id']);
			$html = $sliderContentView->get_html();
		}
		
		return $html;
	}
	
	
	protected function _setStartPageSliderId()
	{
		$startPageSlider = $this->sliderReadService->getStartPageSlider();
		
		if($startPageSlider)
		{
			$this->sliderId = $startPageSlider->getId();
		}
	}
	
	
	protected function _setCategorySliderId()
	{
		$this->sliderId = (int)$this->sliderReadService->findAssignedSliderIdForCategoryId(new IdType($this->categoryId));
	}
	
	
	protected function _setProductSliderId()
	{
		$this->sliderId = (int)$this->sliderReadService->findAssignedSliderIdForProductId(new IdType($this->productId));
	}
	
	
	protected function _setContentSliderId()
	{
		$this->sliderId = (int)$this->sliderReadService->findAssignedSliderIdForContentId(new IdType((int)$_GET['coID']));
	}
}
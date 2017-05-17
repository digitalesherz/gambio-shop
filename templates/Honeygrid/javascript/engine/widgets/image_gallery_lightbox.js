/* --------------------------------------------------------------
 image_gallery.js 2016-03-09
 Gambio GmbH
 http://www.gambio.de
 Copyright (c) 2015 Gambio GmbH
 Released under the GNU General Public License (Version 2)
 [http://www.gnu.org/licenses/gpl-2.0.html]
 --------------------------------------------------------------
 */

/**
 * Widget that opens the gallery modal layer (which is
 * used for the article pictures)
 */
gambio.widgets.module(
	'image_gallery_lightbox',

	[],

	function(data) {

		'use strict';

// ########## VARIABLE INITIALIZATION ##########

		var $this = $(this),
			$template = null,
			module = {};

// ########## EVENT HANDLER ##########

// ########## INITIALIZATION ##########

		/**
		 * Init function of the widget
		 *
		 * @constructor
		 */
		module.init = function(done) {
			
			// Delegate lightbox links with Magnific Popup
			// http://dimsemenov.com/plugins/magnific-popup/
			$this.magnificPopup({
				delegate: 'a',
				type: 'image',gallery: {
      				enabled: true
    			}
			});

			done();
		};

		// Return data to widget engine
		return module;
	});

'use strict';

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
gambio.widgets.module('image_gallery_lightbox', [], function (data) {

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
	module.init = function (done) {

		// Delegate lightbox links with Magnific Popup
		// http://dimsemenov.com/plugins/magnific-popup/
		$this.magnificPopup({
			delegate: 'a',
			type: 'image', gallery: {
				enabled: true
			}
		});

		done();
	};

	// Return data to widget engine
	return module;
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndpZGdldHMvaW1hZ2VfZ2FsbGVyeV9saWdodGJveC5qcyJdLCJuYW1lcyI6WyJnYW1iaW8iLCJ3aWRnZXRzIiwibW9kdWxlIiwiZGF0YSIsIiR0aGlzIiwiJCIsIiR0ZW1wbGF0ZSIsImluaXQiLCJkb25lIiwibWFnbmlmaWNQb3B1cCIsImRlbGVnYXRlIiwidHlwZSIsImdhbGxlcnkiLCJlbmFibGVkIl0sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7Ozs7O0FBVUE7Ozs7QUFJQUEsT0FBT0MsT0FBUCxDQUFlQyxNQUFmLENBQ0Msd0JBREQsRUFHQyxFQUhELEVBS0MsVUFBU0MsSUFBVCxFQUFlOztBQUVkOztBQUVGOztBQUVFLEtBQUlDLFFBQVFDLEVBQUUsSUFBRixDQUFaO0FBQUEsS0FDQ0MsWUFBWSxJQURiO0FBQUEsS0FFQ0osU0FBUyxFQUZWOztBQUlGOztBQUVBOztBQUVFOzs7OztBQUtBQSxRQUFPSyxJQUFQLEdBQWMsVUFBU0MsSUFBVCxFQUFlOztBQUU1QjtBQUNBO0FBQ0FKLFFBQU1LLGFBQU4sQ0FBb0I7QUFDbkJDLGFBQVUsR0FEUztBQUVuQkMsU0FBTSxPQUZhLEVBRUxDLFNBQVM7QUFDakJDLGFBQVM7QUFEUTtBQUZKLEdBQXBCOztBQU9BTDtBQUNBLEVBWkQ7O0FBY0E7QUFDQSxRQUFPTixNQUFQO0FBQ0EsQ0F4Q0YiLCJmaWxlIjoid2lkZ2V0cy9pbWFnZV9nYWxsZXJ5X2xpZ2h0Ym94LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiBpbWFnZV9nYWxsZXJ5LmpzIDIwMTYtMDMtMDlcbiBHYW1iaW8gR21iSFxuIGh0dHA6Ly93d3cuZ2FtYmlvLmRlXG4gQ29weXJpZ2h0IChjKSAyMDE1IEdhbWJpbyBHbWJIXG4gUmVsZWFzZWQgdW5kZXIgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIChWZXJzaW9uIDIpXG4gW2h0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy9ncGwtMi4wLmh0bWxdXG4gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqL1xuXG4vKipcbiAqIFdpZGdldCB0aGF0IG9wZW5zIHRoZSBnYWxsZXJ5IG1vZGFsIGxheWVyICh3aGljaCBpc1xuICogdXNlZCBmb3IgdGhlIGFydGljbGUgcGljdHVyZXMpXG4gKi9cbmdhbWJpby53aWRnZXRzLm1vZHVsZShcblx0J2ltYWdlX2dhbGxlcnlfbGlnaHRib3gnLFxuXG5cdFtdLFxuXG5cdGZ1bmN0aW9uKGRhdGEpIHtcblxuXHRcdCd1c2Ugc3RyaWN0JztcblxuLy8gIyMjIyMjIyMjIyBWQVJJQUJMRSBJTklUSUFMSVpBVElPTiAjIyMjIyMjIyMjXG5cblx0XHR2YXIgJHRoaXMgPSAkKHRoaXMpLFxuXHRcdFx0JHRlbXBsYXRlID0gbnVsbCxcblx0XHRcdG1vZHVsZSA9IHt9O1xuXG4vLyAjIyMjIyMjIyMjIEVWRU5UIEhBTkRMRVIgIyMjIyMjIyMjI1xuXG4vLyAjIyMjIyMjIyMjIElOSVRJQUxJWkFUSU9OICMjIyMjIyMjIyNcblxuXHRcdC8qKlxuXHRcdCAqIEluaXQgZnVuY3Rpb24gb2YgdGhlIHdpZGdldFxuXHRcdCAqXG5cdFx0ICogQGNvbnN0cnVjdG9yXG5cdFx0ICovXG5cdFx0bW9kdWxlLmluaXQgPSBmdW5jdGlvbihkb25lKSB7XG5cdFx0XHRcblx0XHRcdC8vIERlbGVnYXRlIGxpZ2h0Ym94IGxpbmtzIHdpdGggTWFnbmlmaWMgUG9wdXBcblx0XHRcdC8vIGh0dHA6Ly9kaW1zZW1lbm92LmNvbS9wbHVnaW5zL21hZ25pZmljLXBvcHVwL1xuXHRcdFx0JHRoaXMubWFnbmlmaWNQb3B1cCh7XG5cdFx0XHRcdGRlbGVnYXRlOiAnYScsXG5cdFx0XHRcdHR5cGU6ICdpbWFnZScsZ2FsbGVyeToge1xuICAgICAgXHRcdFx0XHRlbmFibGVkOiB0cnVlXG4gICAgXHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdGRvbmUoKTtcblx0XHR9O1xuXG5cdFx0Ly8gUmV0dXJuIGRhdGEgdG8gd2lkZ2V0IGVuZ2luZVxuXHRcdHJldHVybiBtb2R1bGU7XG5cdH0pO1xuIl19

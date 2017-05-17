'use strict';

/* --------------------------------------------------------------
 slider_flyover.js 2016-02-04 gm
 Gambio GmbH
 http://www.gambio.de
 Copyright (c) 2016 Gambio GmbH
 Released under the GNU General Public License (Version 2)
 [http://www.gnu.org/licenses/gpl-2.0.html]
 --------------------------------------------------------------
 */

/**
 * Gets the size of the biggest image from the applied element and puts the previous and next buttons to the right
 * position, if the screen-width is bigger than 1920px.
 */
gambio.widgets.module('slider_flyover', [], function (data) {

	'use strict';

	// ########## VARIABLE INITIALIZATION ##########

	var $this = $(this),
	    defaults = {},
	    options = $.extend(true, {}, defaults, data),
	    module = {},
	    flyover_container = '#slider_flyover_container',
	    mouse_pos_x,
	    mouse_pos_y,
	    actual_area_id,
	    request;

	// ########## PRIVATE FUNCTIONS ##########

	var _remove_flyover = function _remove_flyover() {
		if (actual_area_id == 0) {
			if (request) {
				request.abort();
			}
			$(flyover_container).remove();
		}
	};

	var _create_container = function _create_container() {
		if ($(flyover_container).length == 0) {
			$('body').append('<div id="slider_flyover_container"></div>');
		}
	};

	var _box_position = function _box_position(self) {
		self.off("mousemove");

		self.on("mousemove", function (e) {
			mouse_pos_x = e.pageX;
			mouse_pos_y = e.pageY;
		});
	};

	var _show_flyover = function _show_flyover(self, response) {
		var id = self.attr("id").split("_");
		if (id[1] == actual_area_id && $.trim(response) != "" && $.trim(response.replace(/<br \/>/g, "")) != "") {
			$(flyover_container).addClass(actual_area_id);
			$(flyover_container).html(response);
			$(flyover_container).css("left", mouse_pos_x + 5);
			$(flyover_container).css("top", mouse_pos_y);
			if (mouse_pos_x - $(document).scrollLeft() + $(flyover_container).width() + 30 >= $(window).width()) {

				$(flyover_container).css("left", mouse_pos_x - $(flyover_container).width() - 25);
			}
			if (mouse_pos_y - $(document).scrollTop() + $(flyover_container).height() + 30 >= $(window).height()) {
				$(flyover_container).css("top", mouse_pos_y - $(flyover_container).height() - 25);
			}
			$(flyover_container).show();
		}
	};

	var _get_flyover_info = function _get_flyover_info(self) {
		var id = self.attr("id").split("_");
		actual_area_id = id[1];

		if (actual_area_id != $(flyover_container).attr("class")) {
			if (request) {
				request.abort();
			}

			request = $.ajax({
				type: "POST",
				url: "request_port.php?module=Slider",
				async: true,
				data: { "action": "get_flyover_content", "slider_image_area_id": actual_area_id },
				success: function success(response) {
					_show_flyover(self, response);
				}
			});
		}
	};

	// ########## INITIALIZATION ##########

	/**
  * Init function of the widget
  * @constructor
  */
	module.init = function (done) {
		var sliderAreaSelectorString = '.swiper-slide area';

		// @TODO Implement flyover content.
		done();
		return;

		$this.on('mouseenter', sliderAreaSelectorString, function () {
			_create_container();
			_box_position($(this));
			_get_flyover_info($(this));
		}).on('mouseleave', sliderAreaSelectorString, function () {
			actual_area_id = 0;
			_remove_flyover();
		});

		done();
	};

	// Return data to widget engine
	return module;
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndpZGdldHMvc2xpZGVyX2ZseW92ZXIuanMiXSwibmFtZXMiOlsiZ2FtYmlvIiwid2lkZ2V0cyIsIm1vZHVsZSIsImRhdGEiLCIkdGhpcyIsIiQiLCJkZWZhdWx0cyIsIm9wdGlvbnMiLCJleHRlbmQiLCJmbHlvdmVyX2NvbnRhaW5lciIsIm1vdXNlX3Bvc194IiwibW91c2VfcG9zX3kiLCJhY3R1YWxfYXJlYV9pZCIsInJlcXVlc3QiLCJfcmVtb3ZlX2ZseW92ZXIiLCJhYm9ydCIsInJlbW92ZSIsIl9jcmVhdGVfY29udGFpbmVyIiwibGVuZ3RoIiwiYXBwZW5kIiwiX2JveF9wb3NpdGlvbiIsInNlbGYiLCJvZmYiLCJvbiIsImUiLCJwYWdlWCIsInBhZ2VZIiwiX3Nob3dfZmx5b3ZlciIsInJlc3BvbnNlIiwiaWQiLCJhdHRyIiwic3BsaXQiLCJ0cmltIiwicmVwbGFjZSIsImFkZENsYXNzIiwiaHRtbCIsImNzcyIsImRvY3VtZW50Iiwic2Nyb2xsTGVmdCIsIndpZHRoIiwid2luZG93Iiwic2Nyb2xsVG9wIiwiaGVpZ2h0Iiwic2hvdyIsIl9nZXRfZmx5b3Zlcl9pbmZvIiwiYWpheCIsInR5cGUiLCJ1cmwiLCJhc3luYyIsInN1Y2Nlc3MiLCJpbml0IiwiZG9uZSIsInNsaWRlckFyZWFTZWxlY3RvclN0cmluZyJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7Ozs7OztBQVVBOzs7O0FBSUFBLE9BQU9DLE9BQVAsQ0FBZUMsTUFBZixDQUNDLGdCQURELEVBR0MsRUFIRCxFQUtDLFVBQVNDLElBQVQsRUFBZTs7QUFFZDs7QUFFQTs7QUFFQSxLQUFJQyxRQUFRQyxFQUFFLElBQUYsQ0FBWjtBQUFBLEtBQ0NDLFdBQVcsRUFEWjtBQUFBLEtBRUNDLFVBQVVGLEVBQUVHLE1BQUYsQ0FBUyxJQUFULEVBQWUsRUFBZixFQUFtQkYsUUFBbkIsRUFBNkJILElBQTdCLENBRlg7QUFBQSxLQUdDRCxTQUFTLEVBSFY7QUFBQSxLQUtDTyxvQkFBb0IsMkJBTHJCO0FBQUEs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QUEwQixPQUExQixDQUF0QixFQUEwRDtBQUN6RCxPQUFJakIsT0FBSixFQUFhO0FBQ1pBLFlBQVFFLEtBQVI7QUFDQTs7QUFFREYsYUFBVVIsRUFBRXdDLElBQUYsQ0FBTztBQUNoQkMsVUFBTSxNQURVO0FBRWhCQyxTQUFLLGdDQUZXO0FBR2hCQyxXQUFPLElBSFM7QUFJaEI3QyxVQUFNLEVBQUMsVUFBVSxxQkFBWCxFQUFrQyx3QkFBd0JTLGNBQTFELEVBSlU7QUFLaEJxQyxhQUFTLGlCQUFTckIsUUFBVCxFQUFtQjtBQUMzQkQsbUJBQWNOLElBQWQsRUFBb0JPLFFBQXBCO0FBQ0E7QUFQZSxJQUFQLENBQVY7QUFTQTtBQUNELEVBbkJEOztBQXFCQTs7QUFFQTs7OztBQUlBMUIsUUFBT2dELElBQVAsR0FBYyxVQUFTQyxJQUFULEVBQWU7QUFDNUIsTUFBSUMsMkJBQTJCLG9CQUEvQjs7QUFFQTtBQUNBRDtBQUNBOztBQUVBL0MsUUFDRW1CLEVBREYsQ0FDSyxZQURMLEVBQ21CNkIsd0JBRG5CLEVBQzZDLFlBQVc7QUFDdERuQztBQUNBRyxpQkFBY2YsRUFBRSxJQUFGLENBQWQ7QUFDQXVDLHFCQUFrQnZDLEVBQUUsSUFBRixDQUFsQjtBQUNBLEdBTEYsRUFNRWtCLEVBTkYsQ0FNSyxZQU5MLEVBTW1CNkIsd0JBTm5CLEVBTTZDLFlBQVc7QUFDdER4QyxvQkFBaUIsQ0FBakI7QUFDQUU7QUFDQSxHQVRGOztBQVdBcUM7QUFDQSxFQW5CRDs7QUFxQkE7QUFDQSxRQUFPakQsTUFBUDtBQUNBLENBMUhGIiwiZmlsZSI6IndpZGdldHMvc2xpZGVyX2ZseW92ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIHNsaWRlcl9mbHlvdmVyLmpzIDIwMTYtMDItMDQgZ21cbiBHYW1iaW8gR21iSFxuIGh0dHA6Ly93d3cuZ2FtYmlvLmRlXG4gQ29weXJpZ2h0IChjKSAyMDE2IEdhbWJpbyBHbWJIXG4gUmVsZWFzZWQgdW5kZXIgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIChWZXJzaW9uIDIpXG4gW2h0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy9ncGwtMi4wLmh0bWxdXG4gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqL1xuXG4vKipcbiAqIEdldHMgdGhlIHNpemUgb2YgdGhlIGJpZ2dlc3QgaW1hZ2UgZnJvbSB0aGUgYXBwbGllZCBlbGVtZW50IGFuZCBwdXRzIHRoZSBwcmV2aW91cyBhbmQgbmV4dCBidXR0b25zIHRvIHRoZSByaWdodFxuICogcG9zaXRpb24sIGlmIHRoZSBzY3JlZW4td2lkdGggaXMgYmlnZ2VyIHRoYW4gMTkyMHB4LlxuICovXG5nYW1iaW8ud2lkZ2V0cy5tb2R1bGUoXG5cdCdzbGlkZXJfZmx5b3ZlcicsXG5cdFxuXHRbXSxcblx0XG5cdGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcblx0XHQndXNlIHN0cmljdCc7XG5cdFx0XG5cdFx0Ly8gIyMjIyMjIyMjIyBWQVJJQUJMRSBJTklUSUFMSVpBVElPTiAjIyMjIyMjIyMjXG5cdFx0XG5cdFx0dmFyICR0aGlzID0gJCh0aGlzKSxcblx0XHRcdGRlZmF1bHRzID0ge30sXG5cdFx0XHRvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzLCBkYXRhKSxcblx0XHRcdG1vZHVsZSA9IHt9LFxuXHRcdFx0XG5cdFx0XHRmbHlvdmVyX2NvbnRhaW5lciA9ICcjc2xpZGVyX2ZseW92ZXJfY29udGFpbmVyJyxcblx0XHRcdG1vdXNlX3Bvc194LFxuXHRcdFx0bW91c2VfcG9zX3ksXG5cdFx0XHRhY3R1YWxfYXJlYV9pZCxcblx0XHRcdHJlcXVlc3Q7XG5cdFx0XG5cdFx0XG5cdFx0Ly8gIyMjIyMjIyMjIyBQUklWQVRFIEZVTkNUSU9OUyAjIyMjIyMjIyMjXG5cdFx0XG5cdFx0dmFyIF9yZW1vdmVfZmx5b3ZlciA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKGFjdHVhbF9hcmVhX2lkID09IDApIHtcblx0XHRcdFx0aWYgKHJlcXVlc3QpIHtcblx0XHRcdFx0XHRyZXF1ZXN0LmFib3J0KCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0JChmbHlvdmVyX2NvbnRhaW5lcikucmVtb3ZlKCk7XG5cdFx0XHR9XG5cdFx0fTtcblx0XHRcblx0XHR2YXIgX2NyZWF0ZV9jb250YWluZXIgPSBmdW5jdGlvbigpIHtcblx0XHRcdGlmICgkKGZseW92ZXJfY29udGFpbmVyKS5sZW5ndGggPT0gMCkge1xuXHRcdFx0XHQkKCdib2R5JykuYXBwZW5kKCc8ZGl2IGlkPVwic2xpZGVyX2ZseW92ZXJfY29udGFpbmVyXCI+PC9kaXY+Jyk7XG5cdFx0XHR9XG5cdFx0fTtcblx0XHRcblx0XHR2YXIgX2JveF9wb3NpdGlvbiA9IGZ1bmN0aW9uKHNlbGYpIHtcblx0XHRcdHNlbGYub2ZmKFwibW91c2Vtb3ZlXCIpO1xuXHRcdFx0XG5cdFx0XHRzZWxmLm9uKFwibW91c2Vtb3ZlXCIsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdFx0bW91c2VfcG9zX3ggPSBlLnBhZ2VYO1xuXHRcdFx0XHRtb3VzZV9wb3NfeSA9IGUucGFnZVk7XG5cdFx0XHR9KTtcblx0XHR9O1xuXHRcdFxuXHRcdHZhciBfc2hvd19mbHlvdmVyID0gZnVuY3Rpb24oc2VsZiwgcmVzcG9uc2UpIHtcblx0XHRcdHZhciBpZCA9IHNlbGYuYXR0cihcImlkXCIpLnNwbGl0KFwiX1wiKTtcblx0XHRcdGlmIChpZFsxXSA9PSBhY3R1YWxfYXJlYV9pZCAmJiAkLnRyaW0ocmVzcG9uc2UpICE9IFwiXCJcblx0XHRcdFx0JiYgJC50cmltKHJlc3BvbnNlLnJlcGxhY2UoLzxiciBcXC8+L2csIFwiXCIpKSAhPSBcIlwiKSB7XG5cdFx0XHRcdCQoZmx5b3Zlcl9jb250YWluZXIpLmFkZENsYXNzKGFjdHVhbF9hcmVhX2lkKTtcblx0XHRcdFx0JChmbHlvdmVyX2NvbnRhaW5lcikuaHRtbChyZXNwb25zZSk7XG5cdFx0XHRcdCQoZmx5b3Zlcl9jb250YWluZXIpLmNzcyhcImxlZnRcIiwgbW91c2VfcG9zX3ggKyA1KTtcblx0XHRcdFx0JChmbHlvdmVyX2NvbnRhaW5lcikuY3NzKFwidG9wXCIsIG1vdXNlX3Bvc195KTtcblx0XHRcdFx0aWYgKChtb3VzZV9wb3NfeCAtICQoZG9jdW1lbnQpLnNjcm9sbExlZnQoKSArICQoZmx5b3Zlcl9jb250YWluZXIpLndpZHRoKClcblx0XHRcdFx0XHQrIDMwKSA+PSAkKHdpbmRvdykud2lkdGgoKSkge1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdCQoZmx5b3Zlcl9jb250YWluZXIpXG5cdFx0XHRcdFx0XHQuY3NzKFwibGVmdFwiLCBtb3VzZV9wb3NfeCAtICQoZmx5b3Zlcl9jb250YWluZXIpLndpZHRoKCkgLSAyNSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKChtb3VzZV9wb3NfeSAtICQoZG9jdW1lbnQpLnNjcm9sbFRvcCgpICsgJChmbHlvdmVyX2NvbnRhaW5lcikuaGVpZ2h0KClcblx0XHRcdFx0XHQrIDMwKSA+PSAkKHdpbmRvdykuaGVpZ2h0KCkpIHtcblx0XHRcdFx0XHQkKGZseW92ZXJfY29udGFpbmVyKVxuXHRcdFx0XHRcdFx0LmNzcyhcInRvcFwiLCBtb3VzZV9wb3NfeSAtICQoZmx5b3Zlcl9jb250YWluZXIpLmhlaWdodCgpIC0gMjUpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdCQoZmx5b3Zlcl9jb250YWluZXIpLnNob3coKTtcblx0XHRcdH1cblx0XHR9O1xuXHRcdFxuXHRcdHZhciBfZ2V0X2ZseW92ZXJfaW5mbyA9IGZ1bmN0aW9uKHNlbGYpIHtcblx0XHRcdHZhciBpZCA9IHNlbGYuYXR0cihcImlkXCIpLnNwbGl0KFwiX1wiKTtcblx0XHRcdGFjdHVhbF9hcmVhX2lkID0gaWRbMV07XG5cdFx0XHRcblx0XHRcdGlmIChhY3R1YWxfYXJlYV9pZCAhPSAkKGZseW92ZXJfY29udGFpbmVyKS5hdHRyKFwiY2xhc3NcIikpIHtcblx0XHRcdFx0aWYgKHJlcXVlc3QpIHtcblx0XHRcdFx0XHRyZXF1ZXN0LmFib3J0KCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHRcdHJlcXVlc3QgPSAkLmFqYXgoe1xuXHRcdFx0XHRcdHR5cGU6IFwiUE9TVFwiLFxuXHRcdFx0XHRcdHVybDogXCJyZXF1ZXN0X3BvcnQucGhwP21vZHVsZT1TbGlkZXJcIixcblx0XHRcdFx0XHRhc3luYzogdHJ1ZSxcblx0XHRcdFx0XHRkYXRhOiB7XCJhY3Rpb25cIjogXCJnZXRfZmx5b3Zlcl9jb250ZW50XCIsIFwic2xpZGVyX2ltYWdlX2FyZWFfaWRcIjogYWN0dWFsX2FyZWFfaWR9LFxuXHRcdFx0XHRcdHN1Y2Nlc3M6IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRfc2hvd19mbHlvdmVyKHNlbGYsIHJlc3BvbnNlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH07XG5cdFx0XG5cdFx0Ly8gIyMjIyMjIyMjIyBJTklUSUFMSVpBVElPTiAjIyMjIyMjIyMjXG5cdFx0XG5cdFx0LyoqXG5cdFx0ICogSW5pdCBmdW5jdGlvbiBvZiB0aGUgd2lkZ2V0XG5cdFx0ICogQGNvbnN0cnVjdG9yXG5cdFx0ICovXG5cdFx0bW9kdWxlLmluaXQgPSBmdW5jdGlvbihkb25lKSB7XG5cdFx0XHR2YXIgc2xpZGVyQXJlYVNlbGVjdG9yU3RyaW5nID0gJy5zd2lwZXItc2xpZGUgYXJlYSc7XG5cdFx0XHRcblx0XHRcdC8vIEBUT0RPIEltcGxlbWVudCBmbHlvdmVyIGNvbnRlbnQuXG5cdFx0XHRkb25lKCk7XG5cdFx0XHRyZXR1cm47XG5cblx0XHRcdCR0aGlzXG5cdFx0XHRcdC5vbignbW91c2VlbnRlcicsIHNsaWRlckFyZWFTZWxlY3RvclN0cmluZywgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0X2NyZWF0ZV9jb250YWluZXIoKTtcblx0XHRcdFx0XHRfYm94X3Bvc2l0aW9uKCQodGhpcykpO1xuXHRcdFx0XHRcdF9nZXRfZmx5b3Zlcl9pbmZvKCQodGhpcykpO1xuXHRcdFx0XHR9KVxuXHRcdFx0XHQub24oJ21vdXNlbGVhdmUnLCBzbGlkZXJBcmVhU2VsZWN0b3JTdHJpbmcsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdGFjdHVhbF9hcmVhX2lkID0gMDtcblx0XHRcdFx0XHRfcmVtb3ZlX2ZseW92ZXIoKTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdGRvbmUoKTtcblx0XHR9O1xuXHRcdFxuXHRcdC8vIFJldHVybiBkYXRhIHRvIHdpZGdldCBlbmdpbmVcblx0XHRyZXR1cm4gbW9kdWxlO1xuXHR9KTsiXX0=

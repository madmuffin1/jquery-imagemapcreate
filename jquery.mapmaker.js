/*
 * jQuery MapMaker - a tool to create imagemaps using jQuery
 *
 * Developed by Patrick Brueckner
 * 
 */



(function( $ ) {
	$.fn.mapmaker = function (method) {

		var methods = {
			init : function( options ) { 
							
				var $this = $(this);
				var data = $this.data('mapmaker');
											
				if(typeof data  == "undefined") {
					$this.data('mapmaker', {
						x: 0,
						y: 0,
						polyXarray : new Array(),
						polyYarray: new Array(),
						registered: null
					});
					data = $this.data('mapmaker');
				}
							
				var settings = $.extend( {
					'update'		: null,
					'rectLink'		: null,
					'polyLink'		: null,
					'deleLink'		: null,
					'type'			: 'tag'
				}, options);
							
				$(settings.polyLink).click({
					mapimage: $(this)
					}, register_polygon);
				$(settings.rectLink).click({
					mapimage: $(this)
					}, register_rectangle);
				$(settings.deleLink).click({
					mapimage: $(this)
					}, delete_imagemap);
				
				data.type = settings.type;			
				data.update = settings.update;
							
				save_image_location($this);
				var img = $($this).children('img')
				var img_url = img.attr('src');
				var img_height = img.height();
				var img_width = img.width();
				img.hide();

				$($this).css('background','url('+img_url+')');
				$($this).css('width',img_width);
				$($this).css('height',img_height);

				// prevent dragging image (would break imagemap dragndrop)
				$($this).bind('dragstart',function() {
					return false;
				});

				register_rectangle($this);
			}
						
		};
					
		// Method calling logic
		if ( methods[method] ) {
			return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || ! method ) {
			return methods.init.apply( this, arguments );
		} else {
			$.error( 'Method ' +  method + ' does not exist in jQuery.mapmaker' );
		}    
					
					
					
	};
				
	// private functions
				
	function unregister(element) {
		var data = $(element).data('mapmaker');
		if(data.registered != undefined) {
			switch(data.registered) {
				case "rect":
					unregister_rectangle(element);
					break;
				case "poly":
					unregister_polygon(element);
					break;
			}
						
		}
				
	}
			
	function delete_imagemap(e) {
		var element = $(e.data.mapimage);
		var data = $(element).data('mapmaker');
				
		if($(element).svg('get') != undefined) {
			data.polyXarray = new Array();
			data.polyYarray = new Array();
			$('#poly',$(element).svg('get').root()).attr('points','');
					
			im_polygon_update(element);
		}
				
		$(element).children("#current").remove();
		$(element).children('#old').remove();
				
		if(typeof data.update == "function" ) {
			data.update("");
		}
		
		return false;
				
	}
			
	function register_polygon(element) {
				
		if(element.data.mapimage) {
			element = $(element.data.mapimage);
		}
				
				
		var data = $(element).data('mapmaker');
		if(data.registered != 'poly') {
			unregister(element);
			data.registered = 'poly';
					
					
			if($(element).children('svg').length == 0) {
				//console.log("create new svg area");
				$(element).svg(function(svg) { 
					svg.polygon([[]],{
						fill: '#FF00FF', 
						stroke: '#FF00FF', 
						id: 'poly'
					});
				});
			}
					
			data.polyXarray = new Array();
			data.polyYarray = new Array();
					
			// register rectangle events
			$(element).bind('mousedown.poly',im_polygon_mousedown);
		//					$(element).bind('mousemove.poly',im_polygon_mousemove);
		//					$(element).bind('mouseup.poly',im_polygon_mouseup);
		//$(element).bind('mouseup.poly',im_polygon_mouseup);
		
		return false;
		}
	}

	function register_rectangle(element) {
			
		if(element.data.mapimage) {
			element = $(element.data.mapimage);
		}
			
		var data = $(element).data('mapmaker');
		if( data.registered != 'rect') {
			unregister($(element));
			//$(element).children('img').show();
			data.registered = 'rect';
			// register rectangle events
			$(element).bind('mousedown.rect',im_rectangle_mousedown);
			$(element).bind('mousemove.rect',im_rectangle_mousemove);
			$(element).bind('mouseup.rect',im_rectangle_mouseup);
		}
		
		return false;
	}
			
	function unregister_rectangle(element) {
		$(element).unbind('.rect');
	}
			
	function unregister_polygon(element) {
		$(element).svg('destroy');
		$(element).unbind('.poly');
	}
	
	function im_polygon_mousedown(e) {
				
		var element = $(this);
		var data = $(this).data('mapmaker');
				
		$(this).children('#old').remove();
				
		var clickX = Math.round(e.pageX-data.x_img);
		var clickY = Math.round(e.pageY-data.y_img);
				
		var polygon = $('#poly',$(element).svg('get').root());
				
		var points;
		if(undefined == polygon.attr('points')) {
			points = '';
		} else {
			points = polygon.attr('points');
		}
				
		data.polyXarray.push(clickX);
		data.polyYarray.push(clickY);
				
		polygon.attr('points',points + " " + clickX + "," + clickY);
		im_polygon_update(element);

	}
			
	function im_polygon_update(element) {
				
		var data = $(element).data('mapmaker');
		var area;
		
		if (data.type == 'tag') {
			area = "<area title='map' shape='poly' coords='";
		} else if (data.type == 'array') {
			area = new Array();
			area.push('poly');
		}
		
		var coords='';
		for(i = 0; i< data.polyXarray.length-1; i++) {
			coords+=data.polyXarray[i]+','+data.polyYarray[i]+",";
		}
				
		coords+=data.polyXarray[data.polyXarray.length-1]+","+data.polyYarray[data.polyYarray.length-1];
		
		if (data.type == 'tag') {
			area = area+coords + "'>";
		} else if (data.type=='array') {
			area.push(coords);
		}
		
		if(typeof data.update == "function" ) {
			data.update(area);
		}
				
	}
	
	function im_rectangle_mouseup(e) {

		var data = $(this).data('mapmaker');

		if($(this).children('#current').length > 0 ) {

			var map_x2 = Math.floor(e.pageX - data.x_img);
			var map_y2 = Math.floor(e.pageY - data.y_img);

			var coords = data.x+","+data.y+","+map_x2+","+map_y2;
			var area;
			if (data.type == 'tag') {
				area = "<area title='map' shape='rect' coords='"+coords+"'>";
			} else if (data.type=='array') {
				area=Array();
				area.push('rect');
				area.push(coords);
			}
					
						
					
			if(typeof data.update == "function" ) {
				data.update(area);
			}
		}

		$(this).children("#current").attr({
			id: 'old'
		})
	}
	
	function im_rectangle_mousedown(e) {
		$(this).children("#current").remove();
		$(this).children('#old').remove();
				
		var data = $(this).data('mapmaker');
				
		box = $('<div style="border:1px #FF00FF solid;background-color:#FF00FF;position:relative;width:1px;height:1px;">').hide();
				
		$(this).append(box);

		data.x = Math.floor(e.pageX - data.x_img);
		data.y = Math.floor(e.pageY - data.y_img);
				
		box.attr({
			id: 'current'
		}).css({
			top: data.y , //offsets
			left: data.x //offsets
		}).fadeIn();
	}
			
	function im_rectangle_mousemove(e) {
				
				
		var data = $(this).data('mapmaker');
				
				
		if(e.pageX < (data.x+data.x_img) || e.pageY < (data.y+data.y_img)) {
		// currently only one direction is supported!
		} 
		else {
			$("#current").css({
				width: Math.abs(e.pageX - data.x - data.x_img),
				height: Math.abs(e.pageY - data.y - data.y_img)

			}).fadeIn();
		}
	}
			
	function save_image_location(element) {
		var offset = $(element).offset();
		var data = $(element).data('mapmaker');
		data.y_img=Math.round(offset['top']); 
		data.x_img=Math.round(offset['left']); 
	}
				
				
})(jQuery);

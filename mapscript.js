/*
Map with Labels. Developed by Nicholas Ang, 29 December 2016, based off template from 
https://openlayers.org/en/latest/examples/earthquake-clusters.html
*/

$(document).ready(function(){
	var styleCache = {};

	//1. This function defines the style of the circle marker based on the data fed from the KML file.
	var styleFunction = function(feature) {
		// 2012_Earthquakes_Mag5.kml stores the fill codes in a
		// standards-violating <fillcode> tag in each Placemark.  
		// We extract it from the Placemark's name instead.

		var name = feature.get('name'); //name of the location	

		var fillcode = parseFloat(name.substr(2)); //extract fillcode from the name of the object.
		//console.log(name);
		//Color codes are as follows:
		if(fillcode == 0){
			var color = ['rgba(255, 153, 0, 0.4)', 'rgba(255, 204, 0, 0.2)'];
		}else{
			var color = ['rgba(255, 0, 0, 0.4)', 'rgba(255, 0, 0, 0.2)'];
		}

		var radius = 10;	
		var style = styleCache[radius]; 

		style = new ol.style.Style({
			image: new ol.style.Circle({
				radius: radius,
				fill: new ol.style.Fill({
					color: color[0]
				}),
				stroke: new ol.style.Stroke({
					color: color[1],
					width: 2
				})
			})
		});
		styleCache[radius] = style;
		return style; //creates the style based on the colors specified 
	};

	//2. This is the "vector" layer of the map where the circle markers are going to be displayed.
	var vector = new ol.layer.Vector({
		source: new ol.source.Vector({
			url: 'http://potatoesareawesome.x10host.com/map/places2.kml',
			format: new ol.format.KML({
				extractStyles: false
			})
		}),
		style: styleFunction
	});

	//3. This is the "raster" layer of the map which is the "map" part of the map.
	var raster = new ol.layer.Tile({
		source: new ol.source.OSM()
	});

	//4. Map object with the aforementioned layers: raster and vector.
	var map = new ol.Map({
		layers: [raster, vector],
		target: 'map',
		view: new ol.View({
			center: [11557246.937839996, 149893.0886866448], //Centred at Syonan Jinja, Singapore
			zoom: 11 //For development purposes, please change to 11 when releasing!!
		}),
		controls: ol.control.defaults().extend([
			new ol.control.FullScreen() //Add the fullscreen feature!
		]),
	});

	/*
	*
	* PART 5: Mouse events; Trail Drawing. - should i add in graham's scan ehreR?????
	*
	*/
	
	//5.1 Drawing trail function

	var activeTrail = []; //This is the current list of coordinates that defines the trail, a global.
	var layerLines; //This is the layer object that contains the trail.

	function drawLine(){
		if (layerLines){
			map.removeLayer(layerLines);
		}
		var trnsStr = new ol.geom.LineString(activeTrail); //Change it to be a global.
		trnsStr.transform('EPSG:4326', 'EPSG:3857');

		layerLines = new ol.layer.Vector({
			source: new ol.source.Vector({
				features: [new ol.Feature({
					geometry: trnsStr,
					name: 'Line'
				})]
			}),
		});
		map.addLayer(layerLines);
	}

	drawLine([[18.65, -12.65], [150.65, 12.65]]); // Test the Feature


	//5.2 This next part of the code deals with the information popping up when mousing over the circle markers.
	var info = $('#info');
	info.tooltip({
		animation: false,
		trigger: 'manual'
	});

	//5.3 Mouseover the circle marker!
	var displayFeatureInfo = function(pixel) {
		info.css({
			left: pixel[0] + 'px',
			top: (pixel[1] - 15) + 'px'
		});
		var feature = map.forEachFeatureAtPixel(pixel, function(feature) {
			return feature;
		});
		if (feature) {
			info.tooltip('hide')
			.attr('data-original-title', feature.get('name').slice(10))
			.tooltip('fixTitle')
			.tooltip('show');

		} else {
			info.tooltip('hide');
		}
	};
	
	var currentInfo = 10000;
	//5.4 Click the circle marker!
	var gotoFeatureLink = function(pixel) {
		var feature = map.forEachFeatureAtPixel(pixel, function(feature) {
			return feature;
		});
		if (feature) {	

			id = feature.get('name').slice(4, 8);
			//console.log(id);
			
			
			if (currentInfo == 10000){
				var showInfo = "." + String(id);	
				var hideInfo = ".default";
			}else{
				var showInfo = "." + String(id);	
				var hideInfo = "." + String(currentInfo);
			}
			
			//console.log(showInfo);
			//console.log(hideInfo);
				
			$(hideInfo).hide();
			$(showInfo).show();
			currentInfo = id;
			
		}

	}

	//5.5 Bind the onclick and onpointermove events to functions 5a and 5b
	map.on('pointermove', function(evt) {
		if (evt.dragging) {
			info.tooltip('hide');
			return;
		}
		displayFeatureInfo(map.getEventPixel(evt.originalEvent));
	});

	//6. More Buttons!


	var isDrawing = false;

	var clear = $('#clear');
	var undo = $('#undo');
	var start = $('#start');
	var stop = $('#stop');
	var route = $('#route');
	var showpoints = $('#showpoints');
	var currentLong = $('#currentlong');
	var currentLat = $('#currentlat');
	var eastD = $('#easting');
	var northD = $('#northing');
	

	//7. Define the onclick events to a function, bind onclick to function 5a
	map.on('click', function(evt) {
		
		gotoFeatureLink(evt.pixel);
		k = ol.proj.transform(evt.coordinate, "EPSG:3857", "EPSG:4326");	

		var long = k[0];
		var lat = k[1];
		
		command = $('.command').val();
		p = map.getLayers().H;		

		currentLong.text(long);
		currentLat.text(lat);
		
		easting = 5 * Math.round((11143.9470923771*long - 1154313.21445949000000000000)/5);
		northing = 5 * Math.round((11087.0631752153*lat - 11278.16524889950000000000)/5);
		eastD.text(easting);
		northD.text(northing);
		/*
	
		y = 11,143.94709237710000000000x - 1,154,313.21445949000000000000			
		y = 11,087.06317521530000000000x - 11,278.16524889950000000000			
		
		*/
		

		if(isDrawing){
			//console.log("asdfnawee");
			activeTrail.push(k);
			drawLine(activeTrail);
		}
	});

	//8. Route downloader

	function download(filename, text) {
		var element = document.createElement('a');
		element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
		element.setAttribute('download', filename);

		element.style.display = 'none';
		document.body.appendChild(element);

		element.click();

		document.body.removeChild(element);
	}



	//Button Click Functions
	start.on('click', function(evt) {
		//console.log("sdfasfw");
		isDrawing = true;
	});

	stop.on('click', function(evt) {
		isDrawing = false;
	});

	undo.on('click', function(evt) {
		activeTrail.pop();
		drawLine(activeTrail);
	});

	clear.on('click', function(evt){
		activeTrail = [];
		drawLine(activeTrail);
		route.text("");
	});

	showpoints.on('click', function(evt){
		var currentstring = "";
		for(let i=0; i<activeTrail.length; i++){
			//console.log(activeTrail[i]);
			currentstring = currentstring + activeTrail[i].toString() + "\n";
		}
		download('route.txt', currentstring);
	});
	
	
	$(window).resize(function(){
		$('.map').height("720px");
	});
	



});
//that's about it!
//zy, sqrt(-25) < 15u !!!
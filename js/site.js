//Connect charts to their appropriate selectors:

function provincesMapShow(){
    $('#map2').hide(); // hide municipalities map
    $('#map').show();  // show provinces map
    map2_chart.filterAll();
    dc.redrawAll();
}

function municipalitiesMapShow(){
    $('#map').hide();  // hide provinces map
    $('#map2').show(); // show municipalities map
}

//Function to retrieve only unique entries in an array:
function deduplicate(data) {
    if (data.length > 0) {
        var result = [];

        data.forEach(function (elem) {
            if (result.indexOf(elem) === -1) {
                result.push(elem);
            }
        });

        return result;
    }
}

// Fill in title and last updated values from the configfile
$('#page_header_title').html(config_Title + '<br />PRC 3W Dashboard');
$('#page_header_subtitle').html('<strong>Explore What PRC does Where for ' + config_Title + '.</strong><br />Last update: ' + config_LastUpdate);
$('#page_footer_text').html('Created by ' + config_author + ' - ' + config_email + ' - Skype: ' + config_skype);

//Allow gradual build-up of dashboard:
// /$('#dashboard').hide(); //Removed to have a smoother start-up.
$('#map').hide();
//$('#services').hide();
// /$('#services').show();

var map_chart = dc.geoChoroplethChart("#map");
var map2_chart = dc.geoChoroplethChart("#map2");
var sector_chart = dc.rowChart("#sectors");
var service_chart = dc.rowChart("#services");
var organisation_chart = dc.rowChart("#organisations");
var datatable = $('#dc-table-graph');

//---------------------------------------------------------------------------


d3.dsv(';')("data/3W_Data.csv", function(csv_data) {

	//Extract header titles of each column. In total there will be 11 columns for these type of dashboards:
	//ID, Organisation, Sector, Subsector, Service provided, Province_CODE, Municipality_CODE, Barangay, Status, Beneficiaries, Beneficiary type.

	var csv_headers = d3.keys(csv_data[0]);

	var xf = crossfilter(csv_data);

	//The dimension function is applied to the re-named column headers. Their titles are as in the html table:
	xf.id = xf.dimension(function(d) {return d[csv_headers[0]]; }); //ID
  xf.organisation = xf.dimension(function(d) { return d[csv_headers[1]]; }); //Organisation
	xf.sector = xf.dimension(function(d) { return d[csv_headers[2]]; });
  xf.service = xf.dimension(function(d) { return d[csv_headers[4]]; }); //Service provided
  xf.pcode = xf.dimension(function(d) { return d[csv_headers[5]]; }); //Province_CODE
  xf.mcode = xf.dimension(function(d) { return d[csv_headers[6]]; }); //Municipality_CODE

  var sector = xf.sector.group();
  var service = xf.service.group().reduceSum(function(d) {return d[csv_headers[9]];}); //Service
  var pcode = xf.pcode.group();
  var organisation = xf.organisation.group();
  var mcode = xf.mcode.group();
  var all = xf.groupAll();


	sector_chart.width(config_sector_chart_width).height(config_sector_chart_height)
        .dimension(xf.sector)
        .group(sector)
        .elasticX(true)
        .data(function(group) {
            return group.top(6);
        })
        .colors(['#BF002D'])
        .colorDomain([0,0])
        .colorAccessor(function(d, i){return 1;})
				//.on('filtered',function(chart,filters){
				//	if (chart.filters().length > 0) { $('#services').show();}
				//	else {$('#services').hide();}
				//})
				.xAxis().ticks(5) // added
				;

 	service_chart.width(config_service_chart_width).height(config_service_chart_height)
        .dimension(xf.service)
        .group(service)
        .elasticX(true)
        .data(function(group) {
            return group.top(10).filter( function (d) { return d.value !== 0; } );
        })
        .colors(['#BF002D'])
        .colorDomain([0,0])
        .colorAccessor(function(d, i){return 1;})
				.xAxis().ticks(5)
				;

	organisation_chart.width(config_organisation_chart_width).height(config_organisation_chart_height)
        .dimension(xf.organisation)
        .group(organisation)
        .elasticX(true)
        .data(function(group) {
            return group.top(10).filter( function (d) { return d.value !== 0; } );
        })
        .colors(['#BF002D'])
        .colorDomain([0,0])
        .colorAccessor(function(d, i){return 1;})
				.xAxis().ticks(5)
				;



	//Determine dimension of table for the search functionality.
	//Removed the function .toLowerCase().
	var tableDimension = xf.dimension(function (d) { return
          d[csv_headers[1]] + ' ' +
					d[csv_headers[2]] + ' ' +
					d[csv_headers[3]] + ' ' +
					d[csv_headers[4]] + ' ' +
					pcode2prov[d[csv_headers[5]]] + ' ' +
					mcode2mun[d[csv_headers[6]]] + ' ' +
					d[csv_headers[7]] + ' ' +
					d[csv_headers[8]] + ' ' +
					d[csv_headers[9]] + ' ' +
					d[csv_headers[10]];});


	//Set options and columns for datatable:
	var dataTableOptions = {
    "bSort": true,
		"pageLength": 25,
		"lengthMenu": [ [10, 25, 50, -1], [10, 25, 50, "All"] ],
		"bFilter": true,
		"dom": '<"top"if>rt<"bottom"lp><"clear">', //The Dynamic Object Model properties are used to insert table items: i(nformation), f(ilter), p(agination).
												   //The filter item represents the search text-box, which will only work if the "bFilter" flag is set to true.
												   //Upon clicking the Reset button: search text-box entry is emptied and all entries in the table are displayed.
												   //Function used in Reset button: datatable.dataTable().fnFilter('');
		columnDefs: [
			{
				targets: 0,
				data: function (d) { return d[csv_headers[1]]; }, //Organisation
				defaultContent: ''
			},
			{
				targets: 1,
				data: function (d) { return d[csv_headers[2]]; }, //Sector
				defaultContent: ''
			},
			{
				targets: 2,
				data: function (d) { return d[csv_headers[3]]; }, //Subsector
				defaultContent: ''
			},
			{
				width: '100%',
				targets: 3,
				data: function (d) { return d[csv_headers[4]];}, //Service provided
				defaultContent: ''

			},
			{
				targets: 4,
				data: function (d) {return pcode2prov[d[csv_headers[5]]];}, //Province
				defaultContent: ''
			},
			{
				targets: 5,
				data: function (d) {return mcode2mun[d[csv_headers[6]]];}, //Municipality
				defaultContent: ''
			},
			{
				targets: 6,
				data: function (d) {return d[csv_headers[7]];}, //Barangay
				defaultContent: ''
			},
			{
				targets: 7,
				data: function (d) {return d[csv_headers[8]];}, //Status
				defaultContent: ''
			},
			{
				targets: 8,
				data: function (d) {return d[csv_headers[9]];}, //Beneficiaries
				defaultContent: ''
			},
			{
				targets: 9,
				data: function (d) {return d[csv_headers[10]];}, //Beneficiary type
				defaultContent: ''
			}

		]
	};

	//Initialize datatable:
	datatable.dataTable(dataTableOptions);

	//Update counter info at the top of the page:
	dc.dataCount("#count-info")
		.dimension(xf)
		.group(all);

	//Loading geojson file for the provinces:
	d3.json("data/Phil_provinces.geojson", function (provincesJSON) {

	var json = JSON.stringify(provincesJSON); //Stringify the data
	var js = JSON.parse(json); //Turn into JSON object with array entries.

	//Extract only province names from total data set:
	var data_prov = csv_data.map(function(d) {return d[csv_headers[5]]});

	//Extract only municipality names from total data set:
	var data_mun = csv_data.map(function(d) {return d[csv_headers[6]]});

	var count = js.features.length; //number of entries in js object.

	var unique_data_prov = deduplicate(data_prov); //extract only unique entries for the provinces:

	for (j = 0; j < count; j++) { //search in js object

				//Check if a P_Str entry of the js object is also included in the csv's "province code" column. If it is, do nothing. Otherwise delete the entire entry
				//from the js object.
				if ((unique_data_prov.indexOf(js.features[j].properties.P_Str)) > 0) {//P_Str entry is part of the csv's "province code" column.
				//console.log('Also in list: ',j, js.features[j].properties.P_Str);
				}

				if ((unique_data_prov.indexOf(js.features[j].properties.P_Str)) < 0) {//P_Str entry is not part of the csv's "province code" column, so delete
																					  //key-value pairs from object js.
					//console.log('Index, pos and P_Str: ',j,unique_data_prov.indexOf(js.features[j].properties.P_Str),js.features[j].properties.P_Str);
					delete js.features[j].type;
					delete js.features[j].properties.NAME_0;
					delete js.features[j].properties.NAME_1;
					delete js.features[j].properties.P_Int;
					delete js.features[j].properties.P_Str;
					delete js.features[j].properties.P_4;
					delete js.features[j].properties;
					delete js.features[j].geometry;
					delete js.features[j].coordinates;
				}

	}

	js = JSON.stringify(js); //Stringify object in order to do several search/replace actions using regex functionality.

	//Use regex functionality to match a string of curly braces with a comma and replace it with an empty string.
	//Flags /gm: global search (g) and including line transitioning (m).

	var m = js.replace(/(\{\}),/gm,' ');

	//Use last occurrence of any remaining standalone curly braces (i.e. without any leading commas) in the last entry of the object.
	//If there are curly braces, replace them with an empty string.

	if (m.lastIndexOf('{}') >= 0) { //curly braces found.
		var n = m.replace('{}',' '); //replace with an empty string
	}
	else {
		var n = m; //nothing to replace, assign string to another variable.
	}

	// Check if there is any 'floating comma' in the last row entry of the object:
	if (n.lastIndexOf(',') >= 0) {
		var ind = n.lastIndexOf(','); //determine position of the comma in the object.
		var p = n.substr(0,ind) + ']}'; //transform the object to a valid object by joining items up to the comma, and after the comma.
	}
	else {
		var p = n.substr(0,n.length); //there is no floating comma, so use the full object as is.
	}


	var obj_provincesJSON = JSON.parse(p); //transform back to an object, as this will be used for the mapping function later on.

	/*
	if ((unique_data_prov.length) != (obj_provincesJSON.features.length)) {
		alert('Number of entries in obj_provincesJSON: ' + '(' + obj_provincesJSON.features.length + ')' + ' is not equal to\nthe number of unique entries for provinces in csv file: ' + '(' + unique_data_prov.length + ')');
	}
	*/

	//Determine initial settings for the projection:
    var center = d3.geo.centroid(obj_provincesJSON)
	  var scale  = 150;
	  var width = config_map_width;
    var height  = config_map_height;
    var offset = [width/2, height/2];
    var projection = d3.geo.mercator().scale(scale).center(center).translate(offset);

      //Create the path:
    var path = d3.geo.path().projection(projection);

      //Using the path, determine the bounds of the current map and use
      //these to determine more suitable values for the scale and translation

	  var bounds  = path.bounds(obj_provincesJSON); //determine the outer bounds based on rectangular coordinates of the filtered provinces.
    var hscale  = scale*width  / (bounds[1][0] - bounds[0][0]); //horizontal scale of the outer box based on x-coordinates.
    var vscale  = scale*height / (bounds[1][1] - bounds[0][1]); //vertical scale of the outer box based on y-coordinates.
    var scale   = (hscale < vscale) ? hscale : vscale; //use the smallest of the horizontal and vertical scale, to enable fitting the map in the html map box.
    var offset  = [width - (bounds[0][0] + bounds[1][0])/2,
                  height - (bounds[0][1] + bounds[1][1])/2];


    //New projection
    projection = d3.geo.mercator().center(center).scale(scale).translate(offset);

    path = path.projection(projection);

	//Define the map settings for the provinces:
	map_chart.width(config_map_width).height(config_map_height)
  	.dimension(xf.pcode)
  	.group(pcode)
  	.colors(d3.scale.quantile()
  	.domain([1,50])
  	.range(['#E5CF00','#DDA509','#D57C12','#CE521B','#C62924','#BF002D']))
  	.colorCalculator(function (d) { return d ? map_chart.colors()(d) : '#dddddd'; })
    .overlayGeoJson(provincesJSON.features, "Province", function (d) { //use provincesJSON to reveal several provinces around the target area
                        return d.properties.P_Str;
                    })
              //Set the values for the center, scale and offset:
		.projection(d3.geo.mercator()
		.center(center) 	//determine center of the selected provinces in the trimmed json object.
		.scale(scale) 		//determine the zooming factor to make the map with provinces fit inside the 660 x 800 pixels frame.
		.translate(offset) 	//determine the translation that will move the center of the selected provinces to the center of the 660 x 800 pixels frame.
		)

    .title(function (d) { //when user hovers mouse over a province, indicate the province name and number of activities.
					if (d.value === 1) { //province selected has no activities:
						return "Province: " + pcode2prov[d.key] + " - " + d.value + ' activity';
					}
					else { //province selected with 1 or more activities:
						return "Province: " + pcode2prov[d.key] + " - " + d.value + ' activities';
					}

	});

		//Loading geojson file for the municipalities:
	d3.json("data/Phil_municipalities.geojson", function (municJSON){

	var munic_json = JSON.stringify(municJSON); //stringify the data
	var mjs = JSON.parse(munic_json); //turn into JSON object for removing key entries
	var data_mun = csv_data.map(function(d) {return d[csv_headers[6]]});

	var m_count = mjs.features.length; //number of entries in mjs object.

	var unique_data_munic = deduplicate(data_mun); //extract only unique entries for the municipalities:


	for (k = 0; k < m_count; k++) { //search in mjs object
				//Check if a MUN_P_Str entry of the mjs object is also included in the csv's "municipality code" column. If it is, do nothing. Otherwise delete the entire entry
				//from the mjs object.
				if ((unique_data_munic.indexOf(mjs.features[k].properties.MUN_P_STR)) > 0) {//MUN_P_Str entry is part of the csv's "municipality code" column.
				//console.log('Also in list: ',j, js.features[j].properties.MUN_P_STR);
				}

				if ((unique_data_munic.indexOf(mjs.features[k].properties.MUN_P_STR)) < 0) {//MUN_P_Str entry is not part of the csv's "municipality code" column, so delete entire
																							//entry from the mjs object.
					//console.log('Index, pos and P_Str: ',j,unique_data_prov.indexOf(js.features[j].properties.P_Str),js.features[j].properties.P_Str);
					delete mjs.features[k].type;
					delete mjs.features[k].properties.NAME_0;
					delete mjs.features[k].properties.NAME_1;
					delete mjs.features[k].properties.NAME_2;
					delete mjs.features[k].properties.MUN_P_Int;
					delete mjs.features[k].properties.MUN_P_STR;
					delete mjs.features[k].properties.MUN_P_6;
					delete mjs.features[k].properties;
					delete mjs.features[k].geometry;
					delete mjs.features[k].coordinates;
				}

	}

	mjs = JSON.stringify(mjs);	//Stringify object in order to do several search/replace actions using regex functionality.

	//Use regex functionality to match a string of curly braces with a comma and replace it with an empty string.
	//Flags /gm: global search (g) and including line transitioning (m)

	var s = mjs.replace(/(\{\}),/gm,' ');

	//Use last occurrence of any remaining standalone curly braces (i.e. without any leading commas) in the last entry of the object.
	//If there are curly braces, replace them with an empty string.

	if (s.lastIndexOf('{}') >= 0) { //curly braces found.
		var t = s.replace('{}',' ');//replace with an empty string
	}
	else {
		var t = s;
	}

	// Check if there is any 'floating comma' in the last row entry of the object:
	if (t.lastIndexOf(',') >= 0) {
		var ind = t.lastIndexOf(','); //determine position of the comma in the object.
		var u = t.substr(0,ind) + ']}'; //transform the object to a valid object by joining items previous to the comma, and after the comma.
	}
	else {
		var u = t.substr(0,t.length); //there is no floating comma, so use the full object as is.
	}


	var obj_municJSON = JSON.parse(u);

	/*
	if ((unique_data_munic.length) != (obj_municJSON.features.length)) {
		alert('Number of entries in obj_municJSON: ' + '(' + obj_municJSON.features.length + ')' + ' is not equal to\nthe number of unique entries for municipalities in csv file: ' + '(' + unique_data_munic.length + ')');
	}
	*/

  //Determine initial settings for the projection.
  //Ideally the dimensions of the provinces map are the target:
    var center = d3.geo.centroid(obj_provincesJSON)
    var scale  = 150;
	  var width = config_map_width;
	  var height = config_map_height;
    var offset = [width/2, height/2];
    var projection = d3.geo.mercator().scale(scale).center(center)
        .translate(offset);

      // create the path
    var path = d3.geo.path().projection(projection);

      //Using the path, determine the bounds of the current map.
      //Use these to determine more suitable values for the scale and translation
    var bounds  = path.bounds(obj_provincesJSON); // determine bound for municipality map based on bounds of the provinces map.
    var hscale  = scale*width  / (bounds[1][0] - bounds[0][0]);
    var vscale  = scale*height / (bounds[1][1] - bounds[0][1]);
    var scale   = (hscale < vscale) ? hscale : vscale;
    var offset  = [width - (bounds[0][0] + bounds[1][0])/2,
                  height - (bounds[0][1] + bounds[1][1])/2];

    // new projection
    projection = d3.geo.mercator().center(center)
    .scale(scale).translate(offset);
    path = path.projection(projection);


	//Define the map settings for the provinces:
	map2_chart.width(config_map_width).height(config_map_height)
    .dimension(xf.mcode)
    .group(mcode)
  	.colors(d3.scale.quantile()
  	.domain([1,12])
  	.range(['#E5CF00','#DDA509','#D57C12','#CE521B','#C62924','#BF002D']))
  	.colorCalculator(function (d) { return d ? map2_chart.colors()(d) : '#dddddd'; })
    .overlayGeoJson(municJSON.features, "Municipalities", function (d) { //Use municJSON data to reveal municipality details around the target municipalities.
                        return d.properties.MUN_P_STR;
                    })

		.projection(d3.geo.mercator()
		.center(center)		//determine center of the selected provinces in the trimmed json object.
		.scale(scale)		//determine the zooming factor to make the map with municipalities fit inside the 660 x 800 pixels frame.
		.translate(offset)	//determine the translation that will move the center of the selected municipalities to the center of the 660 x 800 pixels frame.
		)

    .title(function (d) { //when user hovers mouse over a municipality, indicate the municipality name and number of activities.
			   if (d.value === 1) { //municipality has no activities:
					return "Municipality: " + mcode2mun[d.key] + " - " + d.value + ' activity';
			   }
			   else //municipality selected has 1 or more activities:
			   {
				   return "Municipality: " + mcode2mun[d.key] + " - " + d.value + ' activities';
			   }

			});

			$('#loading').hide();
                $('#dashboard').show();

			dc.renderAll();

    });


	function RefreshTable() {
            dc.events.trigger(function () {
                alldata = tableDimension.top(Infinity);
                datatable.fnClearTable();
                datatable.fnAddData(alldata);
                datatable.fnDraw();
            });
        }


	for (var i = 0; i < dc.chartRegistry.list().length; i++) {
		var chartI = dc.chartRegistry.list()[i];
		chartI.on("filtered", RefreshTable);
	}


	RefreshTable();

});

});

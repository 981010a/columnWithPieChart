namespace("leesa.visual")["columnWithPieChart"] = (function (leesa, _, d3) {
	var leesaUtil = leesa.util;
	var leesaModel = leesa.model;
	var getPrecision = leesaUtil.getPrecision;
	var bindingModel = leesaModel.binding;
	var createInclusionCondition = bindingModel.createInclusionCondition;

	var magicalChart = {
		extend: function (quadrant) { },
		render: function (quadrant, callback) {
			var content = quadrant.htmlJContent();
			content.html("");
			var visual = quadrant.visual();
			var data = quadrant.data();
			console.log("Data :"+ JSON.stringify(data));
			var parameters = visual.parameters || {};
			var uniqueID = leesaUtil.uniqueId();
			var jContainer = $(`<div class = 'columnPie-chart' id=${uniqueID}></div>`);
			jContainer.appendTo(content);
			var categoryPath = parameters.categoryPath;
			var valuePath = parameters.valuePath;
			var categoryPiePath = parameters.categoryPiePath;
			var colors = parameters.colors;
			console.log("Parameters :"+ JSON.stringify(parameters));

				if (!categoryPath || !valuePath || !categoryPiePath) {
					data = getSampleData();
					valuePath = "Population";
					categoryPath = "Country"
					categoryPiePath = "State"
		  }
	
		  if (categoryPath && valuePath && categoryPiePath) {
	
			var categoryLabel = categoryPath.substring(categoryPath.indexOf(".") + 1);
			var valueLabel = valuePath.substring(valuePath.indexOf(".") + 1);		  
			
			//Filter duplicate [columne and pie]
			var filteredData=[];
			data.forEach(function(o) {
					var existing = filteredData.filter(function(i) { return i[categoryPath] === o[categoryPath] && i[categoryPiePath]===o[categoryPiePath]})[0];

					if (!existing)
							filteredData.push(o);
					else
							existing[valuePath] += o[valuePath];
			});
			
			//Sum all the value of children into a new node
		  function sumChildren(node) {
				if (node.value) {
					node.values = node.value;
					delete node.value;          
				}
				node[valuePath] = node.values.reduce(function(r, v) {
					return r + (v.value? sumChildren(v) : v[valuePath]);
				},0);
				return node[valuePath];
				}

			//Make the filtered data into Amchart data stucture
		  var newData = d3.nest()
			.key(function(d) { return d[categoryPath]; })
			.rollup(function(children) {
				return children.map(function(v) {return {
				  [categoryPiePath]: v[categoryPiePath], 
				  [valuePath]: v[valuePath]
				}});
			  })  
			.entries(filteredData);
	
			//Add the new node and rename the node
		  newData.forEach(function (node) {
			sumChildren(node); 
			node[categoryPath] = node.key;
			node.Pie = node.values;
			delete node.key;
			delete node.values;
			});
			
			console.log(newData);
			//----------------------Chart implementation START-----------------------------			
			am4core.useTheme(am4themes_animated);

			var chart = am4core.create(uniqueID, am4charts.XYChart);
		  chart.hiddenState.properties.opacity = 0; // this creates initial fade-in
		  
			chart.data = newData;
			
		  var categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
			categoryAxis.dataFields.category = categoryPath;
			categoryAxis.title.text = categoryLabel;
			categoryAxis.title.fontSize =15;
			categoryAxis.title.fontWeight ="bold";
			categoryAxis.renderer.grid.template.location = 0;
			categoryAxis.renderer.grid.template.strokeOpacity = 0;
			categoryAxis.renderer.labels.template.fontSize = 15;
			if (newData.length > 10) {
				categoryAxis.renderer.labels.template.fontSize = 10;
			}
			categoryAxis.renderer.labels.template.fontWeight = 500;
			categoryAxis.renderer.minGridDistance = 10;
		  
		  var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
			valueAxis.title.text = valueLabel;
			valueAxis.title.fontSize =15;
			valueAxis.title.fontWeight ="bold";
		  valueAxis.min = 0;
			valueAxis.renderer.baseGrid.disabled = true;
			valueAxis.renderer.labels.template.fontSize=15;
			valueAxis.renderer.grid.template.location = 0;
			valueAxis.renderer.grid.template.strokeOpacity = 0.07;
		  
		  var series = chart.series.push(new am4charts.ColumnSeries());
		  series.dataFields.valueY = valuePath;
			series.dataFields.categoryX = categoryPath;
			series.tooltip.label.interactionsEnabled = true;
			series.clustered = false;
			series.tooltip.pointerOrientation = "vertical";
			series.tooltip.fontSize=15; 
			
			var columnTemplate = series.columns.template;
			columnTemplate.column.tooltipHTML = categoryLabel + " : " + `{categoryX}` + "<br>" + valueLabel + " : " + `{valueY}`;
			columnTemplate.column.tooltipY = 10;
		  columnTemplate.column.cornerRadiusTopLeft = 20;
		  columnTemplate.column.cornerRadiusTopRight = 20;
		  columnTemplate.strokeOpacity = 0;
		  columnTemplate.adapter.add("fill", function (fill, target) {
          return (target.dataItem.index >= 0) ? colors[target.dataItem.index % colors.length] : fill;
        });
		  
		  var pieChart = series.columns.template.createChild(am4charts.PieChart);
		  pieChart.width = am4core.percent(80);
		  pieChart.height = am4core.percent(80);
		  pieChart.align = "center";
		  pieChart.valign = "middle";
		  pieChart.dataFields.data = "Pie";
		  
		  var pieSeries = pieChart.series.push(new am4charts.PieSeries());
		  pieSeries.dataFields.value = valuePath;
			pieSeries.dataFields.category = categoryPiePath;
			pieSeries.clustered = false;
		  pieSeries.labels.template.disabled = true;
		  pieSeries.ticks.template.disabled = true;
		  pieSeries.slices.template.stroke = am4core.color("black");
		  pieSeries.slices.template.strokeWidth = 1;
			pieSeries.slices.template.strokeOpacity = 0;
			pieSeries.tooltip.fontSize=15;
		  
		  pieSeries.slices.template.adapter.add("fill", (fill, target)=>{
			return am4core.color("#ffffff")
		  });
		  
		  pieSeries.slices.template.adapter.add("fillOpacity", (fillOpacity, target)=>{
			return (target.dataItem.index + 1) * 0.2;
		  });
		  
		  pieSeries.hiddenState.properties.startAngle = -90;
			pieSeries.hiddenState.properties.endAngle = 270;
			//----------------------Chart implementation END--------------------------------	
		}
	  },
			configuration: {},
		}
		return magicalChart;
	
		function getSampleData() {
			return [{"Country":"Malaysia","State":"Perak","Population":345.00}, 
					{"Country":"Malaysia","State":"Selangor","Population":220.11},
					{"Country":"Malaysia","State":"Terrenganu","Population":120.11},
					{"Country":"Singapore","State":"Shinese","Population":405.00},
					{"Country":"Singapore","State":"Kagashi","Population":120.00},
					{"Country":"Philipines","State":"Jungle","Population":340.10},
					{"Country":"Philipines","State":"Mountain","Population":440.80},
					{"Country":"Thailand","State":"Hatyai","Population":550.00},
					{"Country":"Thailand","State":"Bangkok","Population":144.00}
			];
		}
	})(leesa, _, d3)
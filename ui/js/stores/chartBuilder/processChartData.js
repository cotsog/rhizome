var _      = require('lodash');
var d3     = require('d3');
var colors    = require('colors');
var moment = require('moment');
var api = require('data/api');
var Vue = require('vue'); //for tooltip display

function melt(data,indicatorArray) {
	var dataset = data.objects;
	var baseIndicators = _.map(indicatorArray,function(indicator){
		return {indicator:indicator+'',value:0};
	});
	var o = _(dataset)
		.map(function (d) {
			var base = _.omit(d, 'indicators');
			var indicatorFullList = _.assign(_.cloneDeep(baseIndicators),d.indicators);
			return _.map(indicatorFullList, function (indicator) {
				return _.assign({}, base, indicator);
			});
		})
		.flatten()
		.value();
	return o;
}
function _groupBySeries(data, groups,groupBy) {
	return _(data)
		.groupBy(groupBy)
		.map(function (d, ind) {
			return seriesObject(
				_.sortBy(d, _.method('campaign.start_date.getTime')),
				ind,
				null,
				groups
			);
		})
		.value();
}

function seriesObject(d, ind, collection, groups) {
	return {
		name   : groups[ind].name,
		values : d
	};
}

function value(datapoint) {
	if (datapoint && datapoint.hasOwnProperty('value')) {
		return datapoint.value;
	}
	return null;
}

var tooltipDiv = document.createElement('div'); //Vue needs a el to bind to to hold tooltips outside the svg, seems like the least messy solution
document.body.appendChild(tooltipDiv);
var tooltipVue = new Vue({
	el: tooltipDiv,
	components: {'vue-tooltip': require('component/tooltip') },
	ready:function(){

	},
	template: "<vue-tooltip></vue-tooltip>"
});
function nullValuesToZero(values){
  _.each(values,function(value){
  	if(_.isNull(value.value))
  	{
  	  value.value = 0;
  	}
  });
	
}
function _columnData(data, groups, groupBy) {

	var columnData = _(data)
		.groupBy(groupBy)
		.map(_.partialRight(seriesObject, groups))
		.value();
	var baseCampaigns = [];
	_.each(columnData,function(series){ 
	   _.each(series.values,function(value){ //build the base campaign array that includes all campaigns present in any datapoint, used to fill in missing values so the stacked chart doesn't have gaps
	   	 if(!_.find(baseCampaigns,function(campaign){return campaign.id==value.campaign.id}));
	   	 {
	   	   baseCampaigns.push(value.campaign)
	   	 }
	   });
	   _.each(series.values,function(val){ //replace all null values with 0, caused d3 rect rendering errors in the chart
	   	if(_.isNull(val.value))
	   	{
	   	  val.value = 0;
	   	}
	   });
	}); 
	var baseCampaigns = _.sortBy(baseCampaigns,_.method('campaign.start_date.getTime'));
	_.each(columnData,function(series){
	   _.each(baseCampaigns,function(baseCampaign,index){
	   	   if(!_.find(series.values,function(value){return value.campaign.id == baseCampaign.id}))
	   	   {
	   	     series.values.splice(index,0,{campaign:baseCampaign,region:series.values[0].region,indicator:series.values[0].indicator,value:0});
	   	   }
	   });
	   series.values =  _.sortBy(series.values,_.method('campaign.start_date.getTime'));
	});    
	var stack = d3.layout.stack()
		.order('default')
		.offset('zero')
		.values(function (d) { return d.values; })
		.x(function (d) { return d.campaign.start_date; })
		.y(function (d) { return d.value; });

	return stack(columnData);
}

module.exports = {
	init:function(dataPromise,chartType,indicators,regions,lower,upper,groups,groupBy,xAxis,yAxis){
		var indicatorArray = _.map(indicators,_.property('id'));
		var meltPromise = dataPromise.then(function(data){
		 							return melt(data,indicatorArray);
		 							});
		if(chartType=="LineChart"){
		 return	this.processLineChart(meltPromise,lower,upper,groups,groupBy);
		} else if (chartType=="PieChart") {
		 return	this.processPieChart(meltPromise);	
		} else if (chartType=="ChoroplethMap") {
		 return	this.processChoroplethMap(meltPromise,regions);	
		} else if (chartType=="ColumnChart") {
		 return	this.processColumnChart(meltPromise,lower,upper,groups,groupBy);	
		} else if (chartType=="ScatterChart") {
		 return	this.processScatterChart(dataPromise,regions,indicators,xAxis,yAxis);	
		}
	},
	processLineChart:function(dataPromise,lower,upper,groups,groupBy){
		return dataPromise.then(function(data){
			if(!lower) //set the lower bound from the lowest datapoint value
			{
			  var sortedDates = _.sortBy(data, _.method('campaign.start_date.getTime'));
			  lower = moment(_.first(sortedDates).campaign.start_date);
			}
			var chartOptions = {
					domain  : _.constant([lower.toDate(), upper.toDate()]),
					aspect : 2.664831804,
					values  : _.property('values'),
					x       : _.property('campaign.start_date'),
					y       : _.property('value'),
					yFormat : d3.format('%')
				}
			var chartData =  _groupBySeries(data, groups,groupBy);
		    return {options:chartOptions,data:chartData};
		}); 	
	},
	processPieChart:function(dataPromise){
		return dataPromise.then(function(data){
			var total = _(data).map(function(n){ return n.value;}).sum();
			var chartOptions = {
					domain  : _.constant([0, total])
				};
			return {options:chartOptions,data:data}; 
		});
	},
	processChoroplethMap:function(dataPromise,regions){
		var regionsIndex = _.indexBy(regions, 'id');
		
		return Promise.all([dataPromise,api.geo({ region__in :_.map(regions,function(region){return region.id}) })])
		.then(_.spread(function(data, border){	
			var index = _.indexBy(data,'region');
			var chartOptions = {
							aspect: 1,
							domain: _.constant([0, 0.1]),
							border: border.objects.features,
							onMouseOver: function (d, el) {
							    if (regionsIndex.hasOwnProperty(d.properties.region_id)) {
									var evt = d3.event;
									tooltipVue.$emit('tooltip-show', {
										el       : el,
										position : {
											x : evt.pageX,
											y : evt.pageY
										},
										data : {
											text     : regionsIndex[d.properties.region_id].name,
											template : 'tooltip-default'
										}
									});
								}
							},
							onMouseOut: function (d, el) {
								tooltipVue.$emit('tooltip-hide', { el : el });
							}
							};
		    var chartData = _.map(border.objects.features, function (feature) {
										var region = _.get(index, feature.properties.region_id);
										return _.merge({}, feature, {
												properties : { value : _.get(region, 'value') }
											});
									});
			return {options:chartOptions,data:chartData}; 
		}));
	},
	processColumnChart: function(dataPromise,lower,upper,groups,groupBy){
		return dataPromise.then(function(data){
		    if(!lower) //set the lower bound from the lowest datapoint value
		    {
		      var sortedDates = _.sortBy(data, _.method('campaign.start_date.getTime'));
		      lower = moment(_.first(sortedDates).campaign.start_date);
		    }
			var columnScale = _.map(d3.time.scale()
			  		.domain([lower.valueOf(), upper.valueOf()])
			  		.ticks(d3.time.month, 1),
			  	_.method('getTime')
			  );
			  var chartData = _columnData(data,groups,groupBy);	
			
			var chartOptions = {
				aspect : 2.664831804,
				values  : _.property('values'),
				yFormat : d3.format('%'),
				domain : _.constant(columnScale),
				color  : _.flow(
					_.property('name'),
					d3.scale.ordinal().range(colors)),
				x      : function (d) { 
				              var start = d.campaign.start_date
				              return moment(start).startOf('month').toDate().getTime(); 
				              },
				xFormat: function (d) { return moment(d).format('MMM YYYY')}
			};  		
			return {options:chartOptions,data:chartData}; 
			
		});
	},
	processScatterChart: function(dataPromise,regions,indicators,xAxis,yAxis){
		var indicatorsIndex = _.indexBy(indicators, 'id');//;
		var regionsIndex = _.indexBy(regions, 'id');
		
		return dataPromise.then(function(data){
			var domain = d3.extent(_(data.objects)
				.pluck('indicators')
				.flatten()
				.filter(function (d) { return d.indicator == indicators[xAxis].id; })
				.pluck('value')
				.value()
			);
			var range = d3.extent(_(data.objects)
				.pluck('indicators')
				.flatten()
				.filter(function (d) { return d.indicator == indicators[yAxis].id;})
				.pluck('value')
				.value()
			);	
			
			var chartData = _(data.objects)
				.map(function (d) {
					var index = _.indexBy(d.indicators, 'indicator');

					return {
						id   : d.region,
						name : regionsIndex[d.region].name,
						x    : value(index[indicators[xAxis].id]),
						y    : value(index[indicators[yAxis].id])
					};
				})
				.filter(function (d) {
					return _.isFinite(d.x) && _.isFinite(d.y);
				})
				.value();
				var showTooltip = function (d, i, el) {
					var evt = d3.event;

					tooltipVue.$emit('tooltip-show', {
						el       : el,
						position : {
							x : evt.pageX,
							y : evt.pageY
						},
						data : {
							// Have to make sure we use the default tooltip, otherwise if a
							// different template was used, this shows the old template
							template : 'tooltip-default',
							text     : d.name,
							delay    : 0
						}
					});
				};

				var hideTooltip = function (d, i, el) {
					tooltipVue.$emit('tooltip-hide', { el : el });
				};
			var chartOptions = {
				aspect      : 1.7,
				domain      : _.constant(domain),
				onMouseOut  : hideTooltip,
				onMouseOver : showTooltip,
				range       : _.constant(range),
				xFormat     : d3.format('%'),
				xLabel      : 'Caregiver Awareness',
				yFormat     : d3.format('%'),
				yLabel      : 'Missed Children'
			};		
			return {options:chartOptions,data:chartData}; 
		});
	}
};











   
  

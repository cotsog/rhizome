'use strict';

var _      = require('lodash');
var moment = require('moment');

var api    = require('data/api');

/**
 * Utility for generating the tickValues array for a year-to-date chart.
 *
 * Ticks will be Jan, Dec, and the current month. If the current month is either
 * Jan or Dec, then only Jan and Dec are used.
 */
function ytdTicks(month) {
	return function (domain) {
		var lower = domain[0];
		var upper = domain[domain.length - 1];

		// If the current month is between March and October, the ticks should be
		// January, current month, December.
		if (month > lower + 1 && month < upper - 1) {
			return [lower, month, upper];
		}

		// If the current month is January, or February, the ticks are just the
		// current month and December.
		if (month <= lower + 1) {
			return [month, upper];
		}

		// Otherwise the ticks are January and the current month
		return [1, month];
	};
}

function timeTicks(domain) {
	var lower = moment(domain[0]);
	var upper = moment(domain[domain.length - 1]);
	var current = moment(upper).startOf('year');
	var ticks = [lower.toDate().getTime()];

	while (current.isAfter(lower)) {
		ticks.push(current.toDate().getTime());
		current = moment(current).subtract(1, 'year');
	}

	ticks.push(upper.toDate().getTime());

	return ticks;
}

module.exports = {

	template: require('./management.html'),

	data: function () {
		return {
			region     : null,
			regionName : '',
			campaign   : null,
			campaigns  : [],
			capacity   : [178,228,179,184,180,185,230,226,239],
			polio      : [236,192,193,191],
			supply     : [194,219,173,172],
			resources  : [169,233],
			microplans : [],
			cases      : null,
			newCases   : null
		};
	},

	computed: {
		campaignName: function () {
			return moment(this.campaign.start_date).format('MMM YYYY');
		}
	},

	watch: {
		'campaign': function () {
			var start = moment(this.campaign.end, 'YYYY-MM-DD').startOf('year');
			var q     = {
				indicator__in  : 168,
				region__in     : [this.region],
				campaign_start : start.format('YYYY-MM-DD'),
				campaign_end   : this.campaign.end
			};

			var self = this;

			api.datapoints(q)
				.then(function (data) {
					var cases = data.objects.map(function (obj) {
							var datapoint  = _.pick(obj, 'campaign', 'region');
							var indicators = _.indexBy(obj.indicators, 'indicator');

							datapoint.value = indicators['168'].value;

							return datapoint;
						});

					var campaigns = _.indexBy(cases, function (c) {
						return moment(c.campaign.start_date).format('YYYYMMDD');
					});

					if (campaigns.hasOwnProperty(self.campaign.date)) {
						self.newCases = campaigns[self.campaign.date].value;
					} else {
						self.newCases = null;
					}

					self.cases = _.reduce(cases, function (sum, c) {
						return sum + c.value;
					}, 0);
				});
		},
	}
};

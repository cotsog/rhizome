import _ from 'lodash'
import uuid from 'uuid'
import moment from 'moment'
import Reflux from 'reflux'
import StateMixin from 'reflux-state-mixin'

import DashboardActions from 'actions/DashboardActions'
import ChartActions from 'actions/ChartActions'
import DashboardPageActions from 'actions/DashboardPageActions'
import DatapointActions from 'actions/DatapointActions'
import DatapointStore from 'stores/DatapointStore'
import CampaignStore from 'stores/CampaignStore'
import LocationStore from 'stores/LocationStore'
import IndicatorStore from 'stores/IndicatorStore'

import palettes from 'utilities/palettes'

class ChartState {
  constructor () {
    this.uuid = null
    this.type = 'RawData'
    this.title = ''
    this.data = null
    this.datapoints = null
    this.data_format = 'pct'
    this.groupBy = 'indicator'
    this.palette = 'traffic_light'
    this.location_index = null
    this.indicator_index = null
    this.selected_campaigns = []
    this.selected_indicators = []
    this.selected_locations = []
    this.end_date = moment().format('YYYY-MM-DD')
    this.start_date = moment().subtract(1, 'y').format('YYYY-MM-DD')
    this.features = []
    this.loading = false
    this.linkedCampaigns = false
    this.selectTypeMode = true
    this.editMode = true
    this.saving = false
  }
}

var DashboardPageStore = Reflux.createStore({
  mixins: [StateMixin.store],

  listenables: DashboardPageActions,

  dashboard: {
    title: '',
    charts: {}
  },

  init () {
    this.listenTo(DatapointStore, this.onDatapointStore)
    this.listenTo(DashboardActions.postDashboard.completed, this.onPostDashboardCompleted)
    this.listenTo(ChartActions.postChart.completed, this.onPostChartCompleted)
    this.joinTrailing(LocationStore, IndicatorStore, CampaignStore, this.onGetInintialStores)
  },

  getInitialState: function () {
    return this.dashboard
  },

  // =========================================================================== //
  //                            REGULAR ACTION HANDLERS                          //
  // =========================================================================== //
  // ===============================  Dashboard  =============================== //
  onSetDashboardTitle: function (title) {
    this.dashboard.title = title
    this.trigger(this.dashboard)
  },
  onSaveDashboard: function (dashboard_id = null) {
    if (!this.dashboard.title || this.dashboard.title === 'Untitled Dashboard') {
      return window.alert('Please add a Title to your dashboard')
    }
    let allChartsSaved = true
    _.toArray(this.dashboard.charts).forEach(chart => {
      if (!chart.title || chart.title === 'Untitled Chart') {
        allChartsSaved = false
        return
      }
      DashboardPageActions.saveChart(chart.uuid)
    })
    if (!allChartsSaved) {
      return window.alert('Please title all of your charts')
    }
    this.dashboard.saving = true
    this.trigger(this.dashboard)
    const query = {
      id: dashboard_id,
      title: this.dashboard.title,
      chart_uuids: _.toArray(this.dashboard.charts).map(chart => chart.uuid)
    }
    DashboardActions.postDashboard(query)
  },

  // =================================  Layout  ================================ //
  onToggleEditMode: function (uuid) {
    const chart = this.dashboard.charts[uuid]
    chart.editMode = !chart.editMode
    this.trigger(this.dashboard)
  },

  onToggleSelectTypeMode: function (uuid) {
    const chart = this.dashboard.charts[uuid]
    chart.selectTypeMode = !chart.selectTypeMode
    this.trigger(this.dashboard)
  },

  // =================================  Charts  ================================ //
  onAddChart: function () {
    const new_chart = new ChartState()
    new_chart.uuid = uuid.v4()
    this.dashboard.charts[new_chart.uuid] = new_chart
    DashboardPageActions.setCampaigns(this.campaigns.raw[0], new_chart.uuid)
    this.trigger(this.dashboard)
  },
  onSelectChart: function (chart, uuid) {
    this.trigger(this.dashboard)
    const new_chart = this.meltChart(chart)
    this.dashboard.charts[new_chart.uuid] = new_chart
    delete this.dashboard.charts[uuid]
    DashboardPageActions.setType(new_chart.type, new_chart.uuid)
    this.trigger(this.dashboard)
    this._hideSelectChartMenu()
  },
  _hideSelectChartMenu: function () {
    let menus = document.getElementsByClassName('menu')
    for (let menu of menus) { menu.parentNode.removeChild(menu) }
  },
  onDuplicateChart: function (chart_uuid) {
    const chart = this.dashboard.charts[chart_uuid]
    const new_chart = Object.assign(new ChartState(), chart)
    new_chart.uuid = uuid.v4()
    new_chart.selected_indicators = chart.selected_indicators.slice(0)
    new_chart.selected_campaigns = chart.selected_campaigns.slice(0)
    new_chart.selected_locations = chart.selected_locations.slice(0)
    this.dashboard.charts[new_chart.uuid] = new_chart
    this.trigger(this.dashboard)
  },
  onRemoveChart: function (uuid) {
    if (confirm('Are you sure you want to remove this chart?')) {
      delete this.dashboard.charts[uuid]
      this.trigger(this.dashboard)
    }
  },
  onSaveChart: function (uuid) {
    const chart = this.dashboard.charts[uuid]
    if (!chart.title) {
      return window.alert('Please add a Title to your chart')
    }
    this.dashboard.charts[uuid].saving = true
    this.trigger(this.dashboard)
    ChartActions.postChart({
      id: chart.id,
      title: chart.title,
      uuid: chart.uuid,
      chart_json: JSON.stringify({
        type: chart.type,
        start_date: chart.start_date,
        end_date: chart.end_date,
        campaign_ids: chart.selected_campaigns.map(campaign => campaign.id),
        location_ids: chart.selected_locations.map(location => location.id),
        indicator_ids: chart.selected_indicators.map(indicator => indicator.id)
      })
    })
  },

  // =============================  Indicators  ============================ //
  onSetIndicators: function (indicators, uuid) {
    this.toggleLoading(uuid)
    if (_.isNull(indicators)) {
      this.dashboard.charts[uuid].selected_indicators = []
    } else if (_.isArray(indicators)) {
      this.dashboard.charts[uuid].selected_indicators = indicators.map(ind => this.couldBeId(ind) ? this.indicators.index[ind] : ind)
    } else {
      this.dashboard.charts[uuid].selected_indicators = this.couldBeId(indicators) ? [this.indicators.index[indicators]] : [indicators]
    }
    this.updateChart(uuid)
  },
  onSelectIndicator: function (id, uuid) {
    this.toggleLoading(uuid)
    this.dashboard.charts[uuid].selected_indicators.push(this.indicators.index[id])
    this.updateChart(uuid)
  },
  onDeselectIndicator: function (id, uuid) {
    this.toggleLoading(uuid)
    _.remove(this.dashboard.charts[uuid].selected_indicators, {id: id})
    this.updateChart(uuid)
  },
  onReorderIndicator: function (selected_indicators, uuid) {
    this.toggleLoading(uuid)
    this.dashboard.charts[uuid].selected_indicators = selected_indicators
    this.updateChart(uuid)
  },
  onClearSelectedIndicators: function (uuid) {
    this.toggleLoading(uuid)
    this.dashboard.charts[uuid].selected_indicators = []
    this.updateChart(uuid)
  },

  // =============================  Locations  ============================ //
  onSetLocations: function (locations, uuid) {
    this.toggleLoading(uuid)
    if (_.isNull(locations)) {
      this.dashboard.charts[uuid].selected_locations = []
    } else if (_.isArray(locations)) {
      this.dashboard.charts[uuid].selected_locations = locations.map(location => this.couldBeId(location) ? this.locations.index[location] : location)
    } else {
      this.dashboard.charts[uuid].selected_locations = this.couldBeId(locations) ? [this.locations.index[locations]] : [locations]
    }
    this.updateChart(uuid)
  },
  onSelectLocation: function (id, uuid) {
    this.toggleLoading(uuid)
    if (typeof id === 'string' && id.indexOf('lpd') > -1) {
      return this.addLocationsByLpdStatus(id, uuid)
    }
    this.dashboard.charts[uuid].selected_locations.push(this.locations.index[id])
    this.updateChart(uuid)
  },
  addLocationsByLpdStatus: function (id, uuid) {
    let locations_to_add = this.locations.lpd_statuses.find(lpd_status => lpd_status.value === id)
    locations_to_add.location_ids.forEach(location_id => {
      if (this.dashboard.charts[uuid].selected_locations.map(item => item.id).indexOf(location_id) >= 0) {
        return
      }
      this.dashboard.charts[uuid].selected_locations.push(this.locations.index[location_id])
    })
    this.updateChart(uuid)
  },
  onDeselectLocation: function (id, uuid) {
    this.toggleLoading(uuid)
    _.remove(this.dashboard.charts[uuid].selected_locations, {id: id})
    this.updateChart(uuid)
  },
  onClearSelectedLocations: function (uuid) {
    this.toggleLoading(uuid)
    this.dashboard.charts[uuid].selected_locations = []
    this.updateChart(uuid)
  },

  // =============================  Campaigns  ============================ //
  onSetCampaigns: function (campaigns, uuid) {
    this.toggleLoading(uuid)
    if (this.dashboard.charts[uuid].linkedCampaigns) {
      _.toArray(this.dashboard.charts).forEach(chart => {
        if (chart.linkedCampaigns) {
          this.assignCampaigns(campaigns, chart.uuid)
        }
        this.updateChart(chart.uuid)
      })
    } else {
      this.assignCampaigns(campaigns, uuid)
      this.updateChart(uuid)
    }
  },
  onSelectCampaign: function (id, uuid) {
    this.toggleLoading(uuid)
    this.dashboard.charts[uuid].selected_campaigns.push(this.campaigns.index[id])
    this.updateChart(uuid)
  },
  onDeselectCampaign: function (id, uuid) {
    this.toggleLoading(uuid)
    _.remove(this.dashboard.charts[uuid].selected_campaigns, {id: id})
    this.updateChart(uuid)
  },
  onClearSelectedCampaigns: function (uuid) {
    this.toggleLoading(uuid)
    this.dashboard.charts[uuid].selected_campaigns = []
    this.updateChart(uuid)
  },
  onToggleCampaignLink: function (uuid) {
    this.toggleLoading(uuid)
    const current_chart = this.dashboard.charts[uuid]
    if (current_chart.linkedCampaigns) {
      current_chart.linkedCampaigns = false
      return this.trigger(this.dashboard)
    }
    _.toArray(this.dashboard.charts).forEach(chart => chart.linkedCampaigns = true)
    _.toArray(this.dashboard.charts).forEach(chart => DashboardPageActions.setCampaigns(current_chart.selected_campaigns, chart.uuid))
  },
  assignCampaigns: function (campaigns, uuid) {
    if (_.isArray(campaigns)) {
      this.dashboard.charts[uuid].selected_campaigns = campaigns.map(campaign => this.couldBeId(campaign) ? this.campaigns.index[campaign] : campaign)
    } else {
      this.dashboard.charts[uuid].selected_campaigns = this.couldBeId(campaigns) ? [this.campaigns.index[campaigns]] : [campaigns]
    }
    this.dashboard.charts[uuid].start_date = this.dashboard.charts[uuid].selected_campaigns[0].start_date
    this.dashboard.charts[uuid].end_date = this.dashboard.charts[uuid].selected_campaigns[0].end_date
    if (this.dashboard.charts[uuid].start_date === this.dashboard.charts[uuid].end_date) {
      this.dashboard.charts[uuid].start_date = moment(this.dashboard.charts[uuid].start_date).subtract(1, 'M').format('YYYY-MM-DD')
      this.dashboard.charts[uuid].end_date = moment(this.dashboard.charts[uuid].start_date).add(1, 'M').format('YYYY-MM-DD')
    }
  },

  // ============================  Chart Properties =========================== //
  onSetDateRange: function (key, value, uuid) {
    this.toggleLoading(uuid)
    const full_key = key + '_date'
    this.dashboard.charts[uuid][full_key] = value
    this.updateChart(uuid)
  },
  onSetType: function (type, uuid) {
    this.toggleLoading(uuid)
    this.dashboard.charts[uuid].type = type
    this.dashboard.charts[uuid].selectTypeMode = false
    this.updateChart(uuid)
  },
  onSetPalette: function (palette, uuid) {
    this.dashboard.charts[uuid].palette = palette
    this.dashboard.charts[uuid].colors = palettes[palette]
    this.trigger(this.dashboard)
  },
  onSetGroupBy: function (grouping, uuid) {
    this.toggleLoading(uuid)
    this.dashboard.charts[uuid].groupBy = grouping
    const first_indicator = this.dashboard.charts[uuid].selected_indicators[0]
    const first_location = this.dashboard.charts[uuid].selected_locations[0]
    this.dashboard.charts[uuid].selected_indicators = first_indicator ? [first_indicator] : []
    this.dashboard.charts[uuid].selected_locations = first_location ? [first_location] : []
    this.updateChart(uuid)
  },
  onSetChartTitle: function (title, uuid) {
    this.dashboard.charts[uuid].title = title
    this.trigger(this.dashboard)
  },

  // =========================================================================== //
  //                               API CALL HANDLERS                             //
  // =========================================================================== //
  // =============================  Fetch Dashboard  =========================== //
  onFetchDashboard: function (uuid) {
    this.trigger(this.dashboard)
  },
  onFetchDashboardCompleted: function (response) {
    this.dashboard.title = response.title
    response.charts.forEach(chart => {
      const new_chart = this.meltChart(chart)
      this.dashboard.charts[chart.uuid] = new_chart
      DashboardPageActions.setType(new_chart.type, new_chart.uuid)
    })
    this.trigger(this.dashboard)
  },
  onFetchDashboardFailed: function (error) {
    this.setState({ error: error })
  },

  // =============================  Fetch Chart  =========================== //
  onFetchChart: function (id) {
    this.trigger(this.dashboard)
  },
  onFetchChartCompleted: function (chart) {
    const new_chart = this.meltChart(chart)
    this.dashboard.charts[chart.uuid] = new_chart
    DashboardPageActions.setType(new_chart.type, new_chart.uuid)
    this.trigger(this.dashboard)
  },
  onFetchChartFailed: function (error) {
    this.setState({ error: error })
  },

  // ============================  Fetch Map Features  ========================= //
  onFetchMapFeatures: function (uuid) {
    this.dashboard.charts[uuid].loading = true
    this.trigger(this.dashboard)
  },
  onFetchMapFeaturesCompleted: function (response) {
    const currently_fetching_charts = _.toArray(this.dashboard.charts).filter(chart => chart.fetching_map)
    const uuid = currently_fetching_charts[0].uuid
    this.dashboard.charts[uuid].features = response.objects.features
    this.dashboard.charts[uuid].loading = true
    this.dashboard.charts[uuid].fetching_map = false
    this.fetchDatapoints(uuid)
  },
  onFetchMapFeaturesFailed: function (error) {
    this.setState({ error: error })
  },

  // =========================================================================== //
  //                            OTHER STORE DEPENDECIES                          //
  // =========================================================================== //
  onGetInintialStores: function (locations, indicators, campaigns) {
    this.indicators = indicators[0]
    this.locations = locations[0]
    this.campaigns = campaigns[0]
  },

  onDatapointStore: function (datapoints) {
    const uuid = datapoints.meta.chart_uuid
    if (_.isEmpty(datapoints.raw)) {
      this.dashboard.charts[uuid].data = []
      return this.trigger(this.dashboard)
    }
    const chart_datapoints = Object.assign({}, datapoints)
    this.dashboard.charts[uuid].datapoints = chart_datapoints
    this.dashboard.charts[uuid].data = chart_datapoints.raw
    this.dashboard.charts[uuid].parent_location_map = _.indexBy(chart_datapoints.meta.parent_location_map, 'name')
    this.dashboard.charts[uuid].default_sort_order = chart_datapoints.meta.default_sort_order
    this.dashboard.charts[uuid].loading = false
    this.dashboard.charts[uuid].locations_index = this.locations.index
    this.dashboard.charts[uuid].indicators_index = this.indicators.index
    this.trigger(this.dashboard)
  },

  onPostDashboardCompleted: function (response) {
    this.dashboard.saving = false
    this.trigger(this.dashboard)
  },

  onPostChartCompleted: function (response) {
    const uuid = response.objects.uuid
    this.dashboard.charts[uuid].saving = false
    this.trigger(this.dashboard)
  },

  // =========================================================================== //
  //                                   UTILITIES                                 //
  // =========================================================================== //
  updateChart: function (uuid) {
    if (this.dashboard.charts[uuid].data !== null) {
      DatapointActions.clearDatapoints()
      this.dashboard.charts[uuid].data = null
      this.trigger(this.dashboard)
    }
    if (this.chartParamsAreReady(uuid)) {
      if (this.dashboard.charts[uuid].type === 'ChoroplethMap' || this.dashboard.charts[uuid].type === 'MapChart') {
        this.dashboard.charts[uuid].fetching_map = true
        return DashboardPageActions.fetchMapFeatures(this.dashboard.charts[uuid].selected_locations.map(location => location.id))
      }
      this.fetchDatapoints(uuid)
    } else {
      this.dashboard.charts[uuid].loading = false
      this.trigger(this.dashboard)
    }
  },

  meltChart: function (chart) {
    const new_chart = new ChartState()
    new_chart.id = chart.id
    new_chart.uuid = chart.uuid
    new_chart.title = chart.title
    new_chart.type = chart.chart_json.type
    new_chart.start_date = chart.chart_json.start_date
    new_chart.end_date = chart.chart_json.end_date
    new_chart.selected_indicators = chart.chart_json.indicator_ids.map(id => this.indicators.index[id])
    new_chart.selected_locations = chart.chart_json.location_ids.map(id => this.locations.index[id])
    new_chart.selected_campaigns = chart.chart_json.campaign_ids.map(id => this.campaigns.index[id])
    new_chart.selectTypeMode = false
    new_chart.editMode = false
    return new_chart
  },

  fetchDatapoints: function (uuid) {
    DatapointActions.fetchDatapoints({
      indicator_ids: this.dashboard.charts[uuid].selected_indicators.map(indicator => indicator.id),
      location_ids: this.dashboard.charts[uuid].selected_locations.map(location => location.id),
      start_date: this.dashboard.charts[uuid].start_date,
      end_date: this.dashboard.charts[uuid].end_date,
      type: this.dashboard.charts[uuid].type,
      uuid: uuid
    })
  },

  chartParamsAreReady: function (uuid) {
    const campaignsReady = !_.isEmpty(this.dashboard.charts[uuid].selected_campaigns)
    const selectedLocationsReady = !_.isEmpty(this.dashboard.charts[uuid].selected_locations)
    const selectedIndicatorsReady = !_.isEmpty(this.dashboard.charts[uuid].selected_indicators)
    const startDateReady = !_.isEmpty(this.dashboard.charts[uuid].start_date)
    const endDateReady = !_.isEmpty(this.dashboard.charts[uuid].end_date)
    return selectedLocationsReady && selectedIndicatorsReady && startDateReady && endDateReady && campaignsReady
  },

  toggleLoading: function (uuid) {
    this.dashboard.charts[uuid].loading = true
    this.trigger(this.dashboard)
  },

  couldBeId: function (value) {
    return _.isNumber(value) || _.isString(value)
  }
})

export default DashboardPageStore

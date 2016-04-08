import React from 'react'
import Reflux from 'reflux'
import RefluxPromise from 'reflux-promise'
import AdminApp from 'components/pages/AdminApp'

Reflux.use(RefluxPromise(window.Promise))

React.render(React.createElement(require('components/molecules/DashboardNav')), document.getElementById('dashboards-nav'))

export default {
  EntryForm: function (el) {
    React.render(React.createElement(require('components/pages/EntryForm')), el)
  },
  SourceData: function (el) {
    React.render(React.createElement(require('components/pages/SourceData')), el)
  },
  UserAccount: function (el, userId) {
    React.render(React.createElement(require('components/pages/UserAccount'), {userId: userId}), el)
  },
  Dashboards: function (el) {
    React.render(React.createElement(require('components/pages/DashboardsPage')), el)
  },
  Dashboard: function (el, dashboard_id) {
    React.render(React.createElement(require('components/pages/DashboardPage'), { dashboard_id: dashboard_id }), el)
  },
  Charts: function (el) {
    React.render(React.createElement(require('components/pages/ChartsPage')), el)
  },
  ChartPage: function (el, chart_id) {
    React.render(React.createElement(require('components/pages/ChartPage'), { chart_id: chart_id }), el)
  },
  CampaignsPage: function (el, campaignId) {
    React.render(React.createElement(require('components/pages/CampaignsPage'), {campaignId: campaignId}), el)
  },
  UFAdmin: function (el) {
    AdminApp.render(document.getElementById('main'))
  }
}

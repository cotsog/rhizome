import Reflux from 'reflux'
import api from 'data/api'

const DatapointActions = Reflux.createActions({
  'fetchDatapoints': { children: ['completed', 'failed'], asyncResult: true }
})

// API CALLS
// ---------------------------------------------------------------------------
DatapointActions.fetchDatapoints.listen(params => {
  const query = _prepDatapointsQuery(params)
  DatapointActions.fetchDatapoints.promise(api.datapoints(query))
})

// ACTION HELPERS
// ---------------------------------------------------------------------------
const _prepDatapointsQuery = (params) => {
  let query = {
    indicator__in: params.indicator_ids,
    campaign_start: params.startDate,
    campaign_end: params.endDate,
    chart_type: params.type
  }

  if (params.type === 'ChoroplethMap') {
    query['parent_location_id__in'] = params.location_ids
  } else {
    query['location_id__in'] = params.location_ids
  }
  return query
}

export default DatapointActions

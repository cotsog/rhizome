import React from 'react'

import List from 'components/molecules/list/List.jsx'
import DropdownMenu from 'components/molecules/menus/DropdownMenu.jsx'
import RadioGroup from 'components/molecules/RadioGroup.jsx'

import ChartWizardActions from 'actions/ChartWizardActions'
import builderDefinitions from 'components/molecules/charts_d3/utils/builderDefinitions'

export default class PieOptions extends React.Component {
  constructor (props) {
    super(props)
  }

  static propTypes = {
    indicatorList: React.PropTypes.array,
    indicatorSelected: React.PropTypes.array,
    groupByValue: React.PropTypes.number,
    locationLevelValue: React.PropTypes.number,
    yFormatValue: React.PropTypes.number
  }

  static defaultProps = {
    indicatorList: [],
    indicatorSelected: [],
    groupByValue: 0,
    locationLevelValue: 0,
    yFormatValue: 0
  }

  render () {
    let [firstIndicator, ...otherIndicator] = this.props.indicatorSelected
    return (
      <div className='chart-wizard__options chart-wizard__options--general'>
        <h4>First Indicator</h4>
        <ul className='list'>
          <li>{firstIndicator && firstIndicator.name}</li>
        </ul>
        <p className='chart-wizard__para'>You may choose additional indicators now.</p>
        <DropdownMenu
          items={this.props.indicatorList}
          sendValue={ChartWizardActions.addIndicator}
          item_plural_name='Indicators'
          text='Add Indicators'
          icon='fa-plus'/>
        <List items={otherIndicator} removeItem={ChartWizardActions.removeIndicator} />

        <p className='chart-wizard__para'>You may also change additional chart settings.</p>
        <RadioGroup name='location-level' title='Location Level: '
          value={this.props.locationLevelValue}
          values={builderDefinitions.locationLevels}
          onChange={ChartWizardActions.changeLocationLevelRadio} />
        <RadioGroup name='format' title='Format: '
          value={this.props.yFormatValue}
          values={builderDefinitions.formats}
          onChange={ChartWizardActions.changeYFormatRadio} />
      </div>
    )
  }
}

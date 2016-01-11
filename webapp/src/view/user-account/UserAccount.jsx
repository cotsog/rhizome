import React from 'react'
import Reflux from 'reflux'

import UserGroup from 'component/UserGroup.jsx'
import LocationDropdownMenu from 'component/LocationDropdownMenu.jsx'

import UserAccountStore from 'stores/UserAccountStore'
import UserAccountActions from 'actions/UserAccountActions'

let UserAccount = React.createClass({
  mixins: [Reflux.connect(UserAccountStore)],

  propTypes: {
    userId: React.PropTypes.number
  },

  componentWillMount: function () {
    UserAccountActions.getLocations(this.props.userId)
  },

  _setLocation: function (locationId) {
    UserAccountActions.setLocationAccess(this.props.userId, locationId)
  },

  render: function () {
    let selectRole = (
      <div className='row' style={{marginBottom: '15px'}}>
        <div className='columns small-4 left-box'>
          <h4>Roles</h4>
          <div className='label-box'>
          Roles determine what functions this user can perform and which indicators for which they can enter data. All users can consume data (see dashboards and explore with data browser), as long as they have locational permission to do so
          </div>
        </div>
        <UserGroup userId={this.props.userId}/>
      </div>
    )

    let selectLocation = (
      <div className='row'>
         <div className='columns small-4 left-box'>
           <h4>Responsible For Location: </h4>
         </div>
         <div className='columns small-8 right-box'>
           <LocationDropdownMenu
             locations={this.state.locations}
             text={this.state.locationSelected[0] && this.state.locationSelected[0].name || 'Select Location'}
             sendValue={this._setLocation} />
         </div>
      </div>
    )

    return (
      <div>
        {selectRole}
        {selectLocation}
      </div>
    )
  }
})

export default UserAccount
import _ from 'lodash'
import React from 'react'
import Reflux from 'reflux'
import moment from 'moment'

import ButtonMenu from 'component/ButtonMenu.jsx'
import MenuItem from 'component/MenuItem.jsx'
import Dropzone from 'react-dropzone'
import ReactJson from 'react-json'

import DocFormActions from 'actions/DocFormActions'
import DocFormStore from 'stores/DocFormStore'

var DocForm = React.createClass({
  mixins: [
    Reflux.connect(DocFormStore)
  ],

  propTypes: {
    location: React.PropTypes.object.isRequired,
    campaign: React.PropTypes.object,
    reviewTable: React.PropTypes.element,
    doc_title: React.PropTypes.string
  },

  getInitialState: function () {
    return {
      data_uri: null,
      config_options: [],
      uq_id_column: null,
      location_column: null,
      campaign_column: null,
      created_doc_id: null,
      doc_detail_meta: null,
      doc_is_refreshed: false,
      new_doc_title: null,
      is_odk_config_form: false
    }
  },

  onDrop: function (files) {
    this.handleFile(files[0])
  },

  // prevent form from submitting; we are going to capture the file contents
  handleSubmit: function (e) {
    e.preventDefault()
  },

  // when a file is passed to the input field, retrieve the contents as a
  // base64-encoded data URI and save it to the component's state
  handleFile: function (file) {
    var reader = new window.FileReader()

    reader.onload = function (upload) {
      DocFormActions.getData(file, upload)
    }
    reader.readAsDataURL(file)
  },

  setDocConfig: function (configType, configValue) {
    var docDetailMeta = this.state.doc_detail_meta
    var docDetailType = docDetailMeta[configType]
    var docDetailTypeId = docDetailType['id']

    DocFormActions.setDocConfig({
      document_id: this.state.created_doc_id,
      doc_detail_type_id: docDetailTypeId,
      doc_detail_value: configValue
    }, configType)
  },

  syncDocData: function () {
    DocFormActions.transformUpload({document_id: this.state.created_doc_id})
  },

  setOdkConfig: function () {
    this.setState({is_odk_config_form: true})
  },

  processOdkForm: function (e) {
    var data = this.refs.form_data.getValue()
    DocFormActions.setOdkFormName(data)
  },

  buildHeaderList: function (configType) {
    var stateHeader = this.state.config_options

    return MenuItem.fromArray(
      _.map(stateHeader, d => {
        return {
          title: d.replace('"', ''),
          value: d.replace('"', '')
        }
      }),
      this.setDocConfig.bind('config_type', configType))
  },

  // return the structure to display and bind the onChange, onSubmit handlers
  render: function () {
    var uqHeaderList = this.buildHeaderList('uq_id_column')
    var rgHeaderList = this.buildHeaderList('location_column')
    var cpHeaderList = this.buildHeaderList('campaign_column')
    var location = _.get(this.props.location, 'location', this.props.location.name)
    var campaign = _.get(this.props.campaign, 'campaign', moment(this.props.campaign.start_date, 'YYYY-MM-DD').format('YYYY/MM'))

    var fileConfigForm = ''
    var uploadButton = <span className='cd-button refresh__button--margin' onClick={this.syncDocData}>Next</span>

    if (this.state.created_doc_id) {
      fileConfigForm = (
        <ul>
          <li>
            <div className='large-8 medium-8 small-12 columns csv-upload__file--message'>
              Unique ID: (To be selected) {this.state.uq_id_column}
            </div>
            <ButtonMenu text={this.state.uq_id_column}
              style='large-4 medium-4 small-12 columns csv-upload__button-style'>
              {uqHeaderList}
            </ButtonMenu>
          </li>
          <li>
            <div className='large-8 medium-8 small-12 columns csv-upload__file--message'>
              location: (To be selected) {this.state.location_column}
            </div>
            <ButtonMenu text={this.state.location_column}
              style='large-4 medium-4 small-12 columns csv-upload__button-style'>
              {rgHeaderList}
            </ButtonMenu>
          </li>
          <li>
            <div className='large-8 medium-8 small-12 columns csv-upload__file--message'>
              Date Column: (To be selected) {this.state.campaign_column}
            </div>
            <ButtonMenu text={this.state.campaign_column}
              style='large-4 medium-4 small-12 columns csv-upload__button-style'>
              {cpHeaderList}
            </ButtonMenu>
          </li>
        </ul>
      )

      if (this.state.uq_id_column && this.state.location_column && this.state.campaign_column) {
        let nextLink = '/datapoints/source-data/' + [location, campaign].join('/') + '/viewraw/' + this.state.created_doc_id
        let [docName, docRevision] = this.props.doc_title.split('-')
        uploadButton = this.state.doc_is_refreshed
          ? <a href={nextLink} className='cd-button refresh__button--margin'>Review</a>
          : <span className='cd-button refresh__button--margin' onClick={this.syncDocData}>Next</span>

        fileConfigForm = this.state.doc_is_refreshed
          ? (
            <div>
              <div className='csv-upload__tags'>
                <span>File Name: </span>{docName}
              </div>
              <div className='csv-upload__tags'>
                <span>Revision: </span>{docRevision}
              </div>
            </div>
          )
          : fileConfigForm
      }
    }

    var stepMessage = this.state.created_doc_id
      ? (
        <div>
          <span>STEP 2 </span>Please choose which columns in your uploaded data are ID, Location and Campaign.
        </div>
      )
      : (
        <div>
          <span>STEP 1 </span>Click the button upload a CSV file, or please drag and drop the file into the
            <br></br>
            <div className='medium-12 columns upload__csv--step'>
            or <a href='#' onClick={this.setOdkConfig}><b> click here to configure an ODK form.</b></a>
            </div>
          </div>
      )

    if (this.state.is_odk_config_form) {
      stepMessage = (
        <div>
          <span>Please Enter the form_id of the ODK form you would like to configure..</span>
        </div>
      )
    }

    var divZoneStyle = {
      border: '3px solid #426281'
    }

    var dropZoneStyle = {
      padding: '4rem 0',
      display: 'flex',
      justifyContent: 'center'
    }

    var uploadButtonStyle = {
      backgroundColor: '#344B61',
      color: '#FEFEFE',
      textTransform: 'uppercase',
      padding: '15px',
      cursor: 'pointer',
      minWidth: 200,
      fontFamily: 'adelle',
      fontSize: '1rem'
    }

    let uploadStyle = {
      padding: '0 30px'
    }

    let tableMarginStyle = {
      marginTop: '50px'
    }

    let dropZone = (
      <div>
        <div style={uploadStyle}>
          <div style={divZoneStyle} className='medium-12 columns'>
            <Dropzone onDrop={this.onDrop} style={dropZoneStyle}>
              <div style={uploadButtonStyle}>Choose to upload</div>
            </Dropzone>
          </div>
        </div>
        <div className='medium-12 columns' style={tableMarginStyle}>
          {this.props.reviewTable}
        </div>
      </div>
    )

    let fileChoose = (
      <div className='large-6 medium-8 small-12 columns upload__csv--file-choose'>
        {fileConfigForm}
        <div className='large-12 medium-12 small-12 columns refresh__button'>
          {uploadButton}
        </div>
      </div>
    )

    let odkForm = (
        <div className='row'>
          <ReactJson value={{'odk_form_id': ''}} settings={{'form': true, fields: {'odk_form_id': {type: 'string'}}}} ref='form_data'/>
          <br/>
          <button className='tiny' style={{ textAlign: 'right' }} onClick={ this.processOdkForm}>Process ODK Form</button>
        </div>
    )

    // if this is an odk_config form, render ODK form, else, render dropZone
    let baseFileForm = this.state.is_odk_config_form ? odkForm : dropZone
    let formComponent = this.state.created_doc_id ? fileChoose : baseFileForm

    return (
      <div>
        <div className='medium-12 columns upload__csv--step'>
          {stepMessage}
        </div>
        {formComponent}
      </div>
    )
  }
})

export default DocForm

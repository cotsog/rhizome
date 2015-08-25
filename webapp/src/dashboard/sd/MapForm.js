var _ = require('lodash');
var React = require('react');
var api = require('data/api');
var RegionTitleMenu     = require('component/RegionTitleMenu.jsx');
var IndicatorDropdownMenu = require('component/IndicatorDropdownMenu.jsx');
var CampaignDropdownMenu = require('component/CampaignDropdownMenu.jsx');
var DashboardStore    	= require('stores/DashboardStore');
var Modal = require('react-modal');

var appElement = document.getElementById('main');
Modal.setAppElement(appElement);
Modal.injectCSS();

const {
	Datascope, LocalDatascope,
	SimpleDataTable, SimpleDataTableColumn,
	ClearQueryLink,
	Paginator,
	SearchBar,
	FilterPanel, FilterDateRange, FilterInputRadio
	} = require('react-datascope');


var MapForm = React.createClass({
	propTypes: {
	  source_object_map_id 	: React.PropTypes.number.isRequired,
    },

	getInitialState: function() {
		return { modalIsOpen: false }
	},

  openModal: function() {
    this.setState({ modalIsOpen: true });

    api.get_source_object_map({id: this.props.source_object_map_id})
		.then(response => this.setState({
				source_object_code: response.objects[0].source_object_code,
				content_type: response.objects[0].content_type
		}));
  },

  closeModal: function() {
    this.setState({modalIsOpen: false});

  },

postMetaMap : function(source_object_map_id) {
  console.log('posting')
  console.log(source_object_map_id)
},

renderDropDown : function(content_type) {
  var defaultSelected = {'name':'please map..'}

  if (content_type == 'region') {
    return <h2> REEEEGIon </h2>;
   }
   else if (content_type == 'indicator') {
     return <h2> indICATOR </h2>;
   }
   else if (content_type == 'campaign') {
      return <h2> CAMPAIIIIGGGNNN </h2>;
   }
   else {
     return <h2> error </h2>;
   }
},


render : function(){

  var source_object_map_id = this.props.source_object_map_id
  var modalStyle = {width:400, height:300, marginLeft:400}; // rendered as "height:10px"f

  return <div><button className="tiny" onClick={this.openModal}> map! </button>
          <Modal
            style={modalStyle}
            isOpen={this.state.modalIsOpen}
            onRequestClose={this.closeModal}
          >
              <h1> Source Map Id: {source_object_map_id} </h1>
              <form>
              <h2> Content Type: {this.state.content_type} </h2>
              <h2> Source Code: {this.state.source_object_code} </h2>
              <h2> {this.renderDropDown(this.state.content_type)} </h2>
              </form>
          </Modal></div>

},
});

module.exports = MapForm;

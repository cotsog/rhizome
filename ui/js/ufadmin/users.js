var React = require('react/addons');
var _ = require('lodash');

var {
	Datascope, LocalDatascope,
	SimpleDataTable, SimpleDataTableColumn,
	SearchBar,
	FilterPanel, FilterInputCheckbox
} = require('react-datascope');

var API = require('../data/api');
var mockData = require('./utils/mockdata');
var parseSchema = require('./utils/parseSchema');

var UsersAdmin = React.createClass({
	getInitialState: function() {
		return {
			query: {}
		};
	},
	componentDidMount: function() {
		API.admin.usersMetadata().done(response => {
			var schema = parseSchema(response);
			console.log('schema', schema);
			// todo handle error
			//this.setState({schema: schema});
			this.setState({schema: mockData.schemas.users});
		});
		API.admin.users().done(response => {
			//var {meta, objects} = response.body;
			//var {limit, offset, total_count} = meta;
			//this.setState({users: objects, limit, offset, count: total_count});

			//var users = response.body;
			this.setState({users: response.objects});
		});
	},
	onChangeQuery: function(query) {
		this.setState({query});
	},

	render: function() {
		var isLoaded = _.isArray(this.state.users) && this.state.schema && this.state.schema.items;
		if(!isLoaded) return this.renderLoading();

		var propSchemas = this.state.schema.items.properties,
			searchableFieldNames = propSchemas ?
				_(propSchemas).keys().filter(k => propSchemas[k].searchable).value() : [];
		console.log('state', this.state);

		//<SearchBar
		//	id="search-all"
		//	fields={searchableFieldNames}
		//	placeholder="Search users"
		//	/>

		return (
			<div>
				<h1>Users Admin Page</h1>
					<LocalDatascope
						data={this.state.users}
						schema={this.state.schema}
						>
						<Datascope>
							<SimpleDataTable>
							</SimpleDataTable>
						</Datascope>
					</LocalDatascope>
			</div>
		)
	},
	renderLoading() {
		return <div className='admin-loading'>Loading...</div>
	}
});


module.exports = UsersAdmin;

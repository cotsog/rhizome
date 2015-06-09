'use strict';

var _     = require('lodash');
var React = require('react');
var Layer = require('react-layer');

var Menu = require('component/Menu.jsx');
var dom  = require('util/dom');

var MenuControl = {
	getDefaultProps : function () {
		return {
			onSearch : _.noop
		};
	},

	getInitialState : function () {
		return {
			open : false
		};
	},

	componentDidUpdate : function () {
		if (this.state.open) {
			var items  = this.props.children;
			var offset = dom.documentOffset(React.findDOMNode(this));
			var props  = _.omit(this.props, 'text', 'icon', 'size');

			var x = (offset.right + offset.left) / 2

			this.menu = (
				<Menu x={x} y={offset.bottom} {...props} onBlur={this.onBlur}>
					{items}
				</Menu>
			);

			if (!this.layer) {
				var self = this;
				this.layer = new Layer(document.body, function () {
					return self.menu;
				});
				window.addEventListener('keyup', this);
			}

			this.layer.render();
		} else if (this.layer) {
			this.layer.destroy();
			this.layer = null;
			this.menu = null;

			// Clear out the search patterns that the parent component is necessarily
			// using to provide filtered menu items.
			this.props.onSearch('');
			window.removeEventListener('keyup', this);
		}
	},

	_toggleMenu : function () {
		this.setState({open : !this.state.open });
	},

	handleEvent : function (evt) {
		switch (evt.type) {
			case 'keyup':
				if (evt.keyCode === 27) {
					this.close();
				}
				break;
			default:
				break;
		}
	},

	onBlur : function () {
		window.setTimeout(this.close, 150);
	},

	close : function () {
		this.setState({ open : false });
	}
};

module.exports = MenuControl;

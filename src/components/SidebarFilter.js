import React, { Component } from 'react'

export default class SidebarFilter extends Component {
	render() {
		const {
			contrary, slug, name, type, value,
			onFilterHeaderClick
		} = this.props

		const headerClassName = this.getHeaderClassName()
		const contentContainerId = slug + '-content'
		const filterContent = this.getFilterContent()

		return (
			<li>
				<a
				  onClick={ (e) => {
					  e.preventDefault()
					  onFilterHeaderClick()
				  } }
				  className={headerClassName}
				  href="#"
				>
				  {name}
				</a>

				<div
				  id={contentContainerId}
				  className="filter-content"
				>
				  {filterContent}
				</div>
			</li>
		)
	}

	getHeaderClassName() {
		const { type, value } = this.props

		let classNames = []

		switch ( type ) {
			case 'toggle' :
			case 'dropdown' :
				if ( value ) {
					classNames.push( 'toggle-enabled' )
				}
			break

			default: break;
		}

		return classNames.join( ' ' )
	}

	getFilterContent() {
		const {
			slug, type, value, options,
			onFilterChange
		} = this.props

		let optionElements = []
		if ( 'dropdown' != type || 'undefined' == typeof ( options ) || ! options.length ) {
			return optionElements
		}

		options.unshift( {
			name: ' - ',
			value: ''
		} );

		let option = {}
		for ( var i = 0; i < options.length; i++ ) {
			option = options[ i ]
			optionElements.push(
				<option
				  value={option.value}
				  key={slug + '-' + i}
				>
				  {option.name}
				</option>
			)
		}

		const filterName = 'filter-' + slug

		return (
			<select
			  name={filterName}
			  value={value}
			  onChange={onFilterChange}
			>
				{optionElements}
			</select>
		)
	}
}

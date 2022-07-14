setTimeout(() => {


GAME_SYSTEM
.define(({ data }, { connection_index }) =>
'component_data', GAME => GAME.data.define('component', {
	add: {
		check({ id }){
			if (id && this.data[id])
				return `Component with this ID already exists`
		},
		atom({ id, pos = {x:0,y:0}, properties = {}, component: componentName }) {
			id = this.id(id)

			const component = {
				id,
				component: componentName,
				pos: new ObservableProxy(pos),
				properties: new ObservableProxy(properties),
			}
			this.data[id] = component

			return {
				action: 'remove',
				args: { id }
			}
		},
	},
	remove: {
		check({ id }){
			if (!this.data[id])
				return `Component does not exist on field`

			for (const type in GAME.connection_index) {
				if (!GAME.connection_index[type].forward[id])
					return `Component is not indexed in the ${type} connections`
				if (!GAME.connection_index[type].inverse[id])
					return `Component is not indexed in the inverse ${type} connections`
			}
		},
		atom({ id }) {
			const { component, pos, properties } = this.data[id]
			delete this.data[id]

			return {
				action: 'add',
				args: {
					id,
					component,
					pos: {...pos},
					properties: {...properties}
				}
			}
		},
		compound({ id }) {
			Object.entries(GAME.connection_index).forEach(([ type, typeConnections ]) => {
				Object.values(typeConnections.forward[id]).forEach(connectionId => {
					this.Do.connection.remove({ id: connectionId })
				})
				Object.values(typeConnections.inverse[id]).forEach(connectionId => {
					this.Do.connection.remove({ id: connectionId })
				})
			});

			const { component, element, group, properties } = this.data[id]

			if (group)
				this.Do.group.removeComponent({ componentId: id, id: group })

			this.Do.component.setProperties({ id, initial: {...properties}, new: {} })
		},
	},
	setProperties: {
		check({ id, new: newProps }) {
			if (!this.data[id])
				return `Component does not exist on field`
			if (!newProps)
				return `Component.setProperties must be called with new properties`
		},
		atom({ id, initial, new: newProps }) {
			const component = this.data[id]

			if (!initial) initial = {...component.properties}

			Object.assign(component.properties, newProps)

			return {
				action: 'setProperties',
				args: {
					id,
					new: {...initial},
					initial: {...component.properties}
				}
			}
		},
		// compound(){},
	},
	setPosition: {
		check({ id, end }){
			if (!this.data[id])
				return `Component does not exist on field`
			if (!end)
				return `Component.setPosition must be called with an end position`
		},
		atom({ id, start, end }) {
			const component = this.data[id]

			if (!start) start = {...component.pos}

			Object.assign(component.pos, end)

			return {
				action: 'setPosition',
				args: {
					id,
					start: {...component.pos},
					end: {...start}
				}
			}
		},
		// compound(){},
	},
}, {
	add(component) {
		return this.component.add(component)
	},
	del(id) {
		return this.component.remove({ id })
	},
	properties: {
		position(id, value) {
			return this.component.setPosition({ id, end: value })
		},
		properties(id, value) {
			return this.component.setProperties({ id, new: value })

		},
		group(id, value, currentValue) {
			let ret
			if (currentValue)
				ret = this.group.removeComponent({ componentId: id, id: currentValue })
			if (value)
				ret = this.group.addComponent({ componentId: id, id: value })

			return ret
		}
	}
}))


}, LOAD_DELAY)


// initialise
// destructor
// properties
//
//
// constructor
// delete
// create
// props
// removal
// options
//
// coordinate
// position

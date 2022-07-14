setTimeout(() => {


GAME_SYSTEM
.define(({ data, component_definitions }, { connection_index }) =>
'connection_data', GAME => GAME.data.define('connection', {
	add: {
		check({ id, originId, targetId, type }){

			if (id && this.data[id])
				return `Connection with this ID already exists`

			if (originId === targetId)
				return `Origin is same as target`

			if (Object.values(this.data).some(other =>
				other.type === type &&
				other.originId === originId &&
				other.targetId === targetId)
			) return `Connection already exists`


			const connectionList = GAME.connection_index[type].forward[originId]
			const originComponent = this.get('component', originId)
			if (connectionList && originComponent) {
				if (connectionList[targetId])
					return `Connection already exists`

				const limit = `${type}MaxOutputs`
				const componentDefinition = GAME.component_definitions[originComponent.component]

				if (limit in componentDefinition
				&& Object.keys(connectionList).length >= componentDefinition[limit])
					return `Output has maximum connections`
			}

			const reverseConnectionList = GAME.connection_index[type].inverse[targetId]
			const targetComponent = this.get('component', targetId)
			if (reverseConnectionList && targetComponent) {
				if (reverseConnectionList[originId])
					return `Connection already exists (and is broken?)`

				const limit = `${type}MaxInputs`
				const componentDefinition = GAME.component_definitions[targetComponent.component]

				if (limit in componentDefinition
				&& Object.keys(reverseConnectionList).length >= componentDefinition[limit])
					return `Input has maximum connections`
			}

			//
			// const connectionList = GAME.connection_index[type].forward[targetId]
			// if (connectionList && fieldComponents[originId]) {
			// 	if (connectionList[targetId])
			// 		return `Connection already exists`
			//
			// 	const limit = `${type}MaxOutputs`
			// 	const component = this.get('component', originId)
			// 	const componentDefinition = GAME.component_definitions[component.component]
			//
			// 	if (limit in componentDefinition
			// 	&& Object.keys(connectionList).length >= componentDefinition[limit])
			// 		return `Output has maximum connections`
			// }

			// const limit = `${type}MaxOutputs`
			// if (limit in originComponentDefinition
			// && Object.keys(connectionList).length >= originComponentDefinition[limit])
			// 	return `Output has maximum connections`
			//
			// const targetComponent = this.get('component', targetId)
			// const targetComponentDefinition = GAME.component_definitions[targetComponent.component]
			//
			// const limit2 = `${type}MaxInputs`
			// if (limit2 in targetComponentDefinition
			// && Object.keys(reverseConnectionList).length >= targetComponentDefinition[limit])
			// 	return `Input has maximum connections`

			// const connectionList = GAME.connection_index[type].forward[originId]
			// if (connectionList && fieldComponents[originId]) {
			// 	if (connectionList[targetId])
			// 		return `Connection already exists`
			//
			// 	const limit = `${type}MaxOutputs`
			// 	if (limit in fieldComponents[originId].component
			// 	&& Object.keys(connectionList).length >= fieldComponents[originId].component[limit])
			// 		return `Output has maximum connections`
			// }
			//
			// const reverseConnectionList = connections[type].inverse[targetId]
			// if (reverseConnectionList && fieldComponents[targetId]) {
			// 	if (reverseConnectionList[originId])
			// 		return `Connection already exists (and is broken?)`
			//
			// 	const limit = `${type}MaxInputs`
			// 	if (limit in fieldComponents[targetId].component
			// 	&& Object.keys(reverseConnectionList).length >= fieldComponents[targetId].component[limit])
			// 		return `Input has maximum connections`
			// }
		},
		atom({ id, originId, targetId, type }) {
			id = this.id(id)

			this.data[id] = { id, originId, targetId, type }

			return {
				action: 'remove',
				args: { id }
			}
		},
		// compound(){},
	},
	remove: {
		check({ id }){
			if (!id)
				return `Connection.remove must be passed the id of the connection`
			if (!this.data[id])
				return `The connection does not exist on the field`
		},
		atom({ id }) {
			const connection = this.data[id]

			delete this.data[id];

			return {
				action: 'add',
				args: { ...connection }
			}
		},
		// compound(){},
	},
}, {
	add(connection) {
		return this.connection.add(connection)
	},
	del(id) {
		return this.connection.remove({ id })
	},
}))
.define(({ component_data, connection_data }) =>
'connection_index', GAME => {

	const connectionIndex = {}

	GAME.component_data.watch('create', ({ value: { id } }) => {
		Object.values(connectionIndex).forEach(typeConnections => {
			typeConnections.forward[id] = {}
			typeConnections.inverse[id] = {}
		})
	})
	GAME.component_data.watch('delete', ({ value: { id } }) => {
		Object.values(connectionIndex).forEach(typeConnections => {
			delete typeConnections.forward[id]
			delete typeConnections.inverse[id]
		})
	})

	GAME.connection_data.watch('create', ({ value: { type, originId, targetId, id } }) => {
		connectionIndex[type].forward[originId][targetId] = id
		connectionIndex[type].inverse[targetId][originId] = id
	})
	GAME.connection_data.watch('delete', ({ value: { type, originId, targetId, id } }) => {
		delete connectionIndex[type].forward[originId][targetId]
		delete connectionIndex[type].inverse[targetId][originId]
	})

	return connectionIndex
})
.define(({ connection_index }) =>
'connection_types', GAME => {
	const addConnectionType = type => {
		GAME.connection_index[type] = {
			forward: {},
			inverse: {},
		}
	}
	addConnectionType('signal')
	addConnectionType('target')
})


}, LOAD_DELAY)

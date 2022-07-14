setTimeout(() => {



GAME_SYSTEM
.define(({
	component_definitions, connection_index,
	data, component_data, connection_data, group_data,
	bulkOperations, selection
}) =>
'data_operations', GAME => {
	const serializeComponent = ({ component, element, properties }) => {
		const { x, y } = element.getBoundingClientRect()
		const componentDefinition = GAME.component_definitions[component]
		return {
			c: component,
			x, y,
			p: {...properties},
		}
	}

	GAME.bulkOperations.serialize = selection => {

		const groupMap = selection.groups.map(ids => ids.map(id => selection.components.indexOf(id)))

		const absoluteComponents = selection.components
			.map(id => serializeComponent(GAME.component_data.get[id]))

		const minPosition = {
			x: Math.min(...absoluteComponents.map(comp => comp.x)),
			y: Math.min(...absoluteComponents.map(comp => comp.y))
		}
		const relativeComponents = absoluteComponents.map(({ x, y, ...rest }) => ({
			x: x-minPosition.x,
			y: y-minPosition.y,
			...rest
		}))

		const conns = [].concat(...Object.entries(GAME.connection_index)
			.map(([ type, typeConnections ]) =>
				[].concat(...Object.entries(typeConnections.forward)
					.filter(([ id ]) => selection.components.includes(id))
					.map(([ id, cons ]) =>
						Object.keys(cons)
							.filter(otherId => selection.components.includes(otherId))
							.map(otherId => [
								selection.components.indexOf(id),
								selection.components.indexOf(otherId),
								type
							])
					)
				)
			)
		)

		return {
			groups: groupMap,
			components: relativeComponents,
			connections: conns,
		}
	}

	const add = (mode, data, position) => {
		const newComponentIds = data.components.map(({ x, y, c, p }) => {
			const componentDefinition = GAME.component_definitions[c]
			const pos = {
				x: x + position.x,
				y: y + position.y
			}
			const { id } = GAME.component_data[mode]({
				component: c,
				pos,
				properties: {
					...(componentDefinition.defaultProperties || {}),
					...(p || {}),
				}
			})
			return id
		})

		data.connections.forEach(([ from, to, type ]) => {
			GAME.connection_data[mode]({
				originId: newComponentIds[from],
				targetId: newComponentIds[to],
				type
			})
		})
		data.groups.forEach((ids) => {
			const { id } = GAME.group_data[mode]()
			ids.forEach(i => {
				GAME.component_data[mode][newComponentIds[i]].group = id
			})
		})
	}

	GAME.bulkOperations.add = (data, position = { x: 0, y: 0 }) =>
		add('rec', data, position)

	const clearCurrentData = () => {
		const originalData = getCurrentData()
		Object.keys(GAME.component_data.get).forEach(id => {
			delete GAME.component_data.set[id]
		})
		GAME.data.commit()

		Object.keys(GAME.group_data.get).forEach(id => {
			delete GAME.group_data.set[id]
		})
		GAME.data.commit()
		return originalData
	}

	let currentType = 'level'
	let currentData = {}
	const setCurrentData = ({ type, data }, position = { x: 0, y: 0 }) => {
		const originalData = clearCurrentData()
		currentType = type
		currentData = data
		if (type === 'level') {
			add('set', data, position)
		} else if (type === 'combination') {
			add('set', data.structure, {x:200,y:200})
		}

		return originalData
	}

	const getCurrentData = () => {
		if (currentType === 'level')
			return {
				type: 'level',
				data: {
					fileversion: '0.0.1',
					...GAME.bulkOperations.serialize(GAME.selection.allData)
				}
			}
		else {
			return {
				type: 'combination',
				data: {
					...currentData,
					fileversion: '0.0.1',
					structure: {
						...GAME.bulkOperations.serialize(GAME.selection.allData)
					}
				}
			}
		}
	}

	GAME.bulkOperations.current_data = getCurrentData
	GAME.bulkOperations.load_data = setCurrentData
	GAME.bulkOperations.clear_data = clearCurrentData
})


}, LOAD_DELAY)

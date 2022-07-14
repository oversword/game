setTimeout(() => {


GAME_SYSTEM
.define(({ container_element, interaction, bind, unbind }) =>
'drag_interaction', GAME => GAME.interaction.define("drag", {
	start(config) {
		const {
			id,
			start = {x:0,y:0},
			initiator,
			ignores = [],
			targets = [],
			step = () => {},
			cancelOnWrongDrop = false
		} = config
		const endInteraction = () => {
			GAME.interaction.stop(id)
		}

		const callbacks = {
			mouseup: event => {
				const dropOn = hitsElement(event.x, event.y, GAME.container_element, ignores).closest('field')
				// TODO: make this smarter
				const success = targets.includes(dropOn)

				if (cancelOnWrongDrop) {
					if (success && config.success)
						config.success(config)
					endInteraction()
				} else {
					if (success)
						endInteraction()
				}
			},
			mousemove: event => {
				const dy = event.y - start.y
				const dx = event.x - start.x

				step({ x: dx, y: dy })
			}
		}

		GAME.bind(GAME.container_element, callbacks)
		return () => {
			GAME.unbind(GAME.container_element, callbacks)
		}
	}
}))

GAME_SYSTEM
.define(({ container_element, interaction, bind, unbind, component_data, group_data }) =>
'dragComponents_interaction', GAME => GAME.interaction.define("dragComponents", {
	start(config) {
		const {
			id,
			componentIds = [],
			initiator,
			start,
			targets = [],
			cancelOnWrongDrop = false
		} = config
		const endInteraction = () => {
			GAME.interaction.stop(id)
		}

		const componentPositions = componentIds.map(id =>
			({...GAME.component_data.get[id].pos}))

		const componentElements = componentIds.map(id => GAME.component_data.get[id].element)

		const callbacks = {
			mouseup: event => {
				const ignores = [ initiator, ...componentElements ]

				if (initiator && GAME.component_data.get[initiator].group)
					ignores.push(GAME.group_data.get[GAME.component_data.get[initiator].group].element)

				const dropOn = hitsElement(event.x, event.y, GAME.container_element, ignores).closest('field')
				const success = targets.includes(dropOn)

				if (cancelOnWrongDrop) {
					if (success && config.success)
						config.success(config)
					endInteraction()
				} else {
					if (success)
						endInteraction()
				}
			},
			mousemove: event => {
				const dy = event.y - start.y
				const dx = event.x - start.x

				componentPositions.forEach((pos, i) => {
					GAME.component_data.set[componentIds[i]].position = {
						y: pos.y + dy,
						x: pos.x + dx
					}
				})
			}
		}

		GAME.bind(GAME.container_element, callbacks)
		return () => {
			// TODO: update all component elements that keep their position
			GAME.unbind(GAME.container_element, callbacks)
		}
	}
}))

.define(({
	on, dragComponents_interaction,
	group_data, component_data,
	field_element
}) =>
'drag_group', GAME => {
	GAME.on('field > group', {
		mousedown: function (event) {
			GAME.dragComponents_interaction.start(config => {
				const componentIds = Object.keys(GAME.group_data.get[this.group_id].components)
				const starts = componentIds.map(id => ({...GAME.component_data.get[id].pos}))

				Object.assign(config, {
					targets: [GAME.field_element],
					componentIds,
					start: {
						x: event.x,
						y: event.y
					}
				})
				return config => {
					const ends = config.componentIds.map(id => ({...GAME.component_data.get[id].pos}))
					config.componentIds.forEach((component_id, i) => {
						GAME.component_data.set[component_id].position = starts[i]
						GAME.component_data.rec[component_id].position = ends[i]
					})
				}
			})
		}
	})
})

.define(({
	on, selection, dragComponents_interaction,
	component_data,
	field_element
}) =>
'drag_component', GAME => {
	GAME.on('field > field-component', {
		mousedown: function (event) {
			GAME.dragComponents_interaction.start(config => {
				const id = this.component_id
				const componentIds = GAME.selection.components
				if (!componentIds.includes(id))
					componentIds.push(id)

				Object.assign(config, {
					initiator: id,
					targets: [GAME.field_element],
					componentIds,
					start: {
						x: event.x,
						y: event.y
					}
				})
				const starts = componentIds.map(id => ({...GAME.component_data.get[id].pos}))

				return (config) => {
					const ends = componentIds.map(id => ({...GAME.component_data.get[id].pos}))
					componentIds.forEach((component_id, i) => {
						GAME.component_data.set[component_id].position = starts[i]
						GAME.component_data.rec[component_id].position = ends[i]
					})
				}
			})
		}
	})
})


}, LOAD_DELAY)

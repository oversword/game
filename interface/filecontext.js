

INTERFACE_SYSTEM
.define(({
	tabs,
	store,
}) =>
'filecontext', FACE => {
	let _context_id = 1
	const contexts = {
		level: {
			make: () => new Promise((resolve, reject) => {
				const context_id = `${_context_id++}`
				const canvas = document.createElement('canvas')

				GAME_SYSTEM.define(({  }) =>
				`dom_${context_id}`, GAME => {
					GAME.dom = new CanvasDocument(canvas)
				})
				.create(({
					[`dom_${context_id}`]: dom,
					setup,
					component_definitions,
					data,
					component_data,
					connection_data,
					group_data,
					connection_index,
					connection_types,
					connection_render,
					events,
					field_element,
					field_state,
					group_view,
					group_operation,
					interaction,
					keybindings,
					fieldinputs,
					palette_view,
					play_interaction,
					play_interaction_rules,
					remove_operation,
					component_selection,
					group_selection,
					logic_components,
					physics_components,
					DOM_events,
					undo_redo,
					buttons,
					component_view,
					connection_view,
					connection_component_decorations,
					connect_interaction,
					drag_interaction,
					dragComponents_interaction,
					drag_group,
					resize_interaction,
					rotate_interaction,
					edit_interaction,
					edit_component,
					field_state_view,
					palette_interface,
					play_interface,
					select_interaction,
					selection,
					drawing_component,
					input_components,
					components,
					combination,
					drag_component,
					field_opacity,
					group_interface,
					remove_interface,
					container_element,
					edit_interaction_rules,
					// test_data,
					data_operations,
					// data_normalisers,
					// store,
				}, { bulkOperations }) =>
				`edit_level_${context_id}`, GAME => {
					resolve({
						id: context_id,
						canvas,
						app: GAME
					})
				})
			})
		},
		combination: {
			make: () => new Promise((resolve, reject) => {

				const context_id = `${_context_id++}`
				const canvas = document.createElement('canvas')

				GAME_SYSTEM.define(({  }) =>
				`dom_${context_id}`, GAME => {
					GAME.dom = new CanvasDocument(canvas)
				})
				/*
				.after('data_operations')
				.define(({ container_element, buttons, pausefieldinputs, pausekeybindings, bulkOperations, component_data, group_data }) =>
				`edit_combination_${edit_id}`, SUB_GAME => {

					SUB_GAME.buttons.save = {
						icon(context) {
							const { y, x, width: w, height: h } = this.getBoundingClientRect()

							context.beginPath()
							context.moveTo(x+(2*w/16),y+(7*h/16))
							context.lineTo( x+(0*w/16), y+(11*h/16) )
							context.lineTo( x+(9*w/16), y+(16*h/16) )
							context.lineTo( x+(16*w/16), y+(3*h/16) )
							context.lineTo( x+(12*w/16), y+(0*h/16) )
							context.lineTo( x+(7*w/16), y+(10*h/16) )
							context.closePath()
							context.stroke()
						},
						events: {
							click (event) {
								const combination = SUB_GAME.bulkOperations.serialize({
									components: Object.keys(SUB_GAME.component_data.get),
									groups: Object.values(SUB_GAME.group_data.get).map(({ components }) => Object.keys(components))
								})
								GAME.component_definitions[componentDefinition.name].structure = combination
								rerender()
								SUB_GAME.container_element.remove()
								SUB_GAME.pausefieldinputs()
								SUB_GAME.pausekeybindings()
								GAME.resumefieldinputs()
								GAME.resumekeybindings()
							}
						},
						// abovePlayField: true
					}
				})
				*/
				.create(({
					[`dom_${context_id}`]: dom,
					setup,
					component_definitions,
					data,
					component_data,
					connection_data,
					group_data,
					connection_index,
					connection_types,
					connection_render,
					data_operations,
					events,
					field_element,
					field_state,
					group_view,
					group_operation,
					interaction,
					keybindings,
					fieldinputs,
					palette_view,
					// play_interaction,
					// play_interaction_rules,
					// play_interface,
					remove_operation,
					component_selection,
					group_selection,
					logic_components,
					physics_components,
					DOM_events,
					undo_redo,
					buttons,
					component_view,
					connection_view,
					connection_component_decorations,
					connect_interaction,
					drag_interaction,
					dragComponents_interaction,
					drag_group,
					resize_interaction,
					rotate_interaction,
					edit_interaction,
					edit_component,
					field_state_view,
					palette_interface,
					select_interaction,
					selection,
					drawing_component,
					input_components,
					components,
					// combination,
					drag_component,
					field_opacity,
					group_interface,
					remove_interface,
					edit_interaction_rules,
					container_element,

					// [`edit_combination_interface_${edit_id}`]: edit_combination_interface,
					combination_system_components,
				}, { bulkOperations }) =>
				`edit_combination_${context_id}`, GAME => {
					resolve({
						id: context_id,
						canvas,
						app: GAME
					})
				})
			})
		}
	}

	FACE.tabs.canclose = (index, tab) => {
		// TODO: Check for unsaved changes?
		console.log(index,tab)
		return true//false
	}

	const activeContexts = {}

	return {
		get activeContext() {
			return activeContexts[FACE.tabs.selected.id]
		},
		set activeContext(id) {
			FACE.tabs.selected = id
		},
		async add({ path }) {
			const pathParts = path.split('/')
			const name = pathParts.slice(-1)[0]
			const parDir = pathParts.slice(0, -1).join('/')

			let context = Object.values(activeContexts).find(context =>
				context.path === parDir && context.name === name)
			if (!context) {
				const data = FACE.store.get({ path })
				context = {
					...(await contexts[data.type].make()),
					name,
					path: parDir,
					type: data.type,
				}
				context.app.bulkOperations.load_data({
					type: data.type,
					data: data.data
				})
				FACE.tabs.add({
					id: context.id,
					label: name,
					domContent: context.canvas,
					icon: `icon-${data.type}`
				})

				activeContexts[context.id] = context
			}
			return context.id
		}
	}

})

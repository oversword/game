const INTERFACE_SYSTEM = new FeatureSystem()

INTERFACE_SYSTEM
.define(({ }) => 'app_setup', FACE => {
	FACE.dom = document
	FACE.container_element = document.body
})

.define(({
	filecontext
}) =>
'level_context', FACE => {
	FACE.filecontext.register('level', (context, done) => {

		GAME_SYSTEM.define(({  }) =>
		`dom_${context.id}`, GAME => {
			GAME.dom = new CanvasDocument(context.canvas)
		})
		.create(({
			[`dom_${context.id}`]: dom,
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
		`edit_level_${context.id}`, done)
	})
})
.define(({
	filecontext
}) =>
'combination_context', FACE => {
	FACE.filecontext.register('combination', (context, done) => {
		GAME_SYSTEM.define(({  }) =>
		`dom_${context.id}`, GAME => {
			GAME.dom = new CanvasDocument(context.canvas)
		})
		.create(({
			[`dom_${context.id}`]: dom,
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

			combination_system_components,
		}, { bulkOperations }) =>
		`edit_combination_${context.id}`, done)
	})
})
.create(({
	htma,
	filecontext,
	tabs,
	test_data,
	data_normalisers,
	store,
	system_data,
	keybindings,
	events,
	app_setup,
	context_operations,
	level_context,
	combination_context
}) => 'interface', FACE => {
	Promise.all([
		FACE.filecontext.add({ path: '/levels/examples/true plat' }),
		FACE.filecontext.add({ path: '/levels/examples/test-bed' }),
		FACE.filecontext.add({ path: '/combinations/examples/Platform Combination' })
	]).then(results => {
		FACE.filecontext.activeContext = results[0]
	})
})

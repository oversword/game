setTimeout(() => {


GAME_SYSTEM
.define(({ dom, container_element }) =>
'field_element', GAME => {

	const field = GAME.dom.createElement("field")
	applyStyles(field, style.field)
	GAME.container_element.appendChild(field)

	return field
})

GAME_SYSTEM
.define(({
	component_definitions, component_data,
	connection_index, connection_data
}) =>
'field_state', GAME => {
	const fieldState = new FieldState(GAME.component_definitions, new Proxy(GAME.component_data.get, {
		get(target, prop) {
			if (!target[prop]) return undefined;
			return target[prop].component;
		},
		set(){
			return false
		}
	}), GAME.connection_index.signal)
	GAME.component_data.watch(['initialdata','afterupdate'], ({ events }) => {
		events.forEach(event => {
			({
				create(id, component) {
					const componentDefinition = GAME.component_definitions[component.component]
					if (!componentDefinition.combination) {
						fieldState[id] = undefined
						return;
					}


					const system_components = ['combination_signal_input','combination_target_input','combination_target_output']//,'combination_signal_output']

					const componentDefinitions = Object.fromEntries(Object.entries(
						GAME.component_definitions).filter(([ name, def ]) => {
							return componentDefinition.structure.components.some(({ c }) => c === name)
						}).map(([ name, { logic = () => false, logicEnables = false }]) => [ name, { logic, logicEnables } ])
					)
					componentDefinitions.combination_signal_output = { logic: a => a.some(a=>a) }
					// componentDefinitions.combination_target_output = { logic: a => a.some(a=>a) }

					const components = Object.fromEntries(componentDefinition.structure.components
							.map(({ c }, i) => [ i, c ])
							.filter(([, c ]) => !system_components.includes(c)))

					const connections = componentDefinition.structure.connections
							.filter(([ origin, target, type]) => {
								if (type !== 'signal')
									return;

								if (system_components.includes(componentDefinition.structure.components[origin].c))
									return;

								if (system_components.includes(componentDefinition.structure.components[target].c))
									return;

								return true
							})
							.reduce((ret, [ origin, target ]) => {
								ret.forward[origin][target] = true
								ret.inverse[target][origin] = true
								return ret
							}, {
								forward: Object.fromEntries(Object.keys(components).map(id => [ id, {} ])),
								inverse: Object.fromEntries(Object.keys(components).map(id => [ id, {} ])),
							})

					const state = new FieldState(
						componentDefinitions,
						components,
						connections
					)
					Object.keys(components).forEach(id => {
						state[id] = undefined
					})

					component.fieldState = {
						state,
						components,
						componentDefinitions,
						connections,
					}
					fieldState[id] = undefined
				},
				update(id, component) {},
				delete(id, component) {
					delete fieldState[id]
				}
			})[event.type](event.key, event.value)
		})
	})
	GAME.connection_data.watch(['initialdata','afterupdate'], ({ events }) => {
		events.forEach(event => {
			({
				create(id, connection) {
					if (connection.originId in fieldState)
						fieldState[connection.originId] = undefined

					const originComponent = GAME.component_data.get[connection.originId]
					const targetComponent = GAME.component_data.get[connection.targetId]
					const originComponentDefinition = GAME.component_definitions[originComponent.component]
					const targetComponentDefinition = GAME.component_definitions[targetComponent.component]
					if (!(originComponentDefinition.combination || targetComponentDefinition.combination)) return;

					if (targetComponentDefinition.combination) {
						const cid = `_INTERNAL_CONNECTION_INPUT_${originComponent.id}`
						if (! (cid in targetComponent.fieldState.components)) {
							targetComponent.fieldState.componentDefinitions[cid] = {
								logic: () => fieldState[connection.originId],
								logicEnables: false
							}
							targetComponent.fieldState.components[cid] = cid
						}

						targetComponentDefinition.structure.connections
							.filter(([ origin, target, type ]) => {
								if (type !== 'signal') return;
								return targetComponentDefinition.structure.components[origin].c === 'combination_signal_input'
							})
							.forEach(([ origin, target ]) => {
								if (! (cid in targetComponent.fieldState.connections.forward))
									targetComponent.fieldState.connections.forward[cid] = {}
								if (! (cid in targetComponent.fieldState.connections.inverse))
									targetComponent.fieldState.connections.inverse[cid] = {}

								targetComponent.fieldState.connections.forward[cid][target] = true
								targetComponent.fieldState.connections.inverse[target][cid] = true
							})

						targetComponent.fieldState.state[cid] = undefined
					}

				},
				update(id, connection) {},
				delete(id, connection) {
					if (connection.targetId in fieldState)
						fieldState[connection.targetId] = undefined
					// delete fieldState[id]
				}
			})[event.type](event.key, event.value)
		})
	})
	return fieldState
})
.after('component_view')
.define(({
	field_state,
	component_data, connection_index, connection_data,
}) =>
'field_state_view', GAME => {
	GAME.field_state(['initialdata','afterupdate'], ({ events }) => {
		events.forEach(({ key: id, value: active }) => {
			const component = GAME.component_data.get[id]
			if (!component) return;
			if (component.element instanceof CanvasElement)
				applyStyles(component.element, active ? style.active : style.notActive)
			Object.values(GAME.connection_index.signal.forward[id]).concat(Object.values(GAME.connection_index.target.forward[id])).forEach(connectionId => {
				const connectionElement = GAME.connection_data.get[connectionId].element
				if (connectionElement instanceof CanvasElement)
					applyStyles(connectionElement, active ? style.active : style.notActive)
			})
		})
	})
})

GAME_SYSTEM
.define(({
	field_element, selection, render, buttons
}) =>
'field_opacity', GAME => {

	let fieldOpacity = 1
	const setFieldOpacity = (newVal, button) =>  {
		fieldOpacity = Math.max(0.1, Math.min(1, (isNaN(Number(newVal)) ? 1 : Number(newVal)) ))

		GAME.field_opacity = fieldOpacity

		button.style.opacity = fieldOpacity

		GAME.field_element.childNodes.forEach(child => {
			if (! GAME.selection.includesElement(child))
				child.style.opacity = fieldOpacity
		})
	}

	const on_fadebutton = {}
	on_fadebutton.click = function () {
		if (fieldOpacity < 0.6)
			setFieldOpacity(1, this)
		else setFieldOpacity(0.1, this)
	}
	on_fadebutton.wheel = function (event) {
		setFieldOpacity(fieldOpacity - (Math.sign(event.deltaY) * 0.02), this)
	}

	GAME.render.fadeButton = function (context) {
		const { y, x, width: w, height: h } = this.getBoundingClientRect()

		context.fillStyle = context.strokeStyle
		context.beginPath()
		context.arc(x+(w/2), y+(h/2), w/2, 0, Math.PI*2)
		context.fill()
	}

	GAME.buttons.fade = {
		icon: GAME.render.fadeButton,
		events: on_fadebutton,
		abovePlayField: true
	}

	return fieldOpacity

})


}, LOAD_DELAY)

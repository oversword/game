setTimeout(() => {


GAME_SYSTEM.define(({ container_element, interaction, bind, unbind }) =>
'resize_interaction', GAME => GAME.interaction.define("resize", {
	start(config) {
		const {
			id,
			element,
			proportional = false
		} = config
		const endInteraction = () => {
			GAME.interaction.stop(id)
		}
		const callbacks = {
			mouseup: event => {
				endInteraction()
			},
			mousemove: event => {
				const { y, x } = element.getBoundingClientRect()
				const w = Math.max(0, event.x - x)
				const h = Math.max(0, event.y - y)
				const newSize = {
					width: proportional ? Math.max(20, Math.min(w,h)) : w,
					height: proportional ? Math.max(20, Math.min(w,h)) : h
				}
				// applyStyles(element, newSize)
				if (config.step)
					config.step({...newSize})
			}
		}
		GAME.bind(GAME.container_element, callbacks)
		return () => {
			GAME.unbind(GAME.container_element, callbacks)
		}
	}
}))

GAME_SYSTEM.define(({ container_element, interaction, bind, unbind }) =>
'rotate_interaction', GAME => GAME.interaction.define("rotate", {
	start(config) {
		const {
			id,
			element,
			start = 0,
			limited = false
		} = config
		const endInteraction = () => {
			GAME.interaction.stop(id)
		}
		const callbacks = {
			mouseup: event => {
				endInteraction()
			},
			mousemove: event => {
				const { y, x, width: w, height: h } = element.getBoundingClientRect()
				const centerX = x + (w / 2)
				const centerY = y + (h / 2)
				const angle = Math.atan2(event.y - centerY, event.x - centerX) + (Math.PI/4) + start

				if (config.step)
					config.step(
						limited
							? Math.round(angle / (Math.PI/8)) * (Math.PI/8)
							: angle
					)
			}
		}

		GAME.bind(GAME.container_element, callbacks)
		return () => {
			GAME.unbind(GAME.container_element, callbacks)
		}
	}
}))

GAME_SYSTEM.define(({
	dom,
	interaction, bind, unbind,
	resize_interaction, rotate_interaction,
	component_data,
}) =>
'edit_interaction', GAME => {
	const render = {
		resize(context) {
			const { y, x, width: w, height: h } = this.getBoundingClientRect()

			context.beginPath()
			context.moveTo(x+w, y)
			context.lineTo(x+w, y+h)
			context.lineTo(x, y+h)

			context.stroke()
		},
		rotater(context) {
			const { y, x, width: w, height: h } = this.getBoundingClientRect()
			context.beginPath()

			const l = w/15

			context.arc(x,y+h,w,-Math.PI/2,0)
			context.moveTo(x+(3*l), y+(5*l))
			context.lineTo(x, y)
			context.lineTo(x+(5*l), y-(3*l))
			context.moveTo(x+w+(3*l), y+h-(5*l))
			context.lineTo(x+w, y+h)
			context.lineTo(x+w-(5*l), y+h-(3*l))
			context.stroke()


			// context.moveTo(x, y)
			// context.arcTo(x+w, y, x+w, y+h, w)
			// context.moveTo(x+w, y)
			// context.lineTo(x+w, y+h)
			// context.lineTo(x, y+h)
		},
	}
	return GAME.interaction.define("edit", {
	start(config) {
		const cleanups = []
		const initialProps = {...GAME.component_data.get[config.scope.component_id].properties}

		if (config.component.rotatable) {
			const rotate = GAME.dom.createElement("rotater")
			applyStyles(rotate, style.rotateNE)
			GAME.bind(rotate, {
				mousedown (event) {
					GAME.rotate_interaction.start({
						element: config.scope,
						start: GAME.component_data.get[config.scope.component_id].properties.angle || 0,
						limited: true,
						step: newValue => {
							GAME.component_data.set[config.scope.component_id].properties = { angle: newValue }
						}
					})
				}
			})
			rotate.render = render.rotater
			config.scope.appendChild(rotate)

			cleanups.push(() => {
				rotate.remove()
				GAME.rotate_interaction.stop({
					element: config.scope
				})
			})
		}

		if (config.component.resizable) {
			const resize = GAME.dom.createElement("resizer")
			applyStyles(resize, style.resizeSE)
			GAME.bind(resize, {
				mousedown (event) {
					GAME.resize_interaction.start({
						element: config.scope,
						...(config.component.resizable === "proportional"
							? { proportional: true }
							: {}),
						step: newSize => {
							if (!(config.component.setSize instanceof Function)) return;
							config.component.setSize(GAME.component_data.set[config.scope.component_id], newSize)
						}
					})
				}
			})
			resize.render = render.resize
			config.scope.appendChild(resize)

			cleanups.push(() => {
				resize.remove()
				GAME.resize_interaction.stop({
					element: config.scope
				})
			})
		}

		if (config.component.edit)
			cleanups.push(config.component.edit.call(config.scope))

		return () => {
			cleanups
			.filter(truthy)
			.forEach(cleanup => {
				cleanup()
			})
			const props = {...GAME.component_data.get[config.scope.component_id].properties}

			GAME.component_data.set[config.scope.component_id].properties = initialProps
			GAME.component_data.rec[config.scope.component_id].properties = props
		}
	}
	})
})


GAME_SYSTEM
.after('edit_interaction')
.beforeSettled
.define(({ interaction }) =>
'edit_interaction_rules', (GAME, thisName, definedFeatures) => {

	const exclusions = ["rotate", "resize", "dragComponents", "drag", "select"]
	const availableExclusions = exclusions.filter(name => definedFeatures.includes(`${name}_interaction`))

	GAME.interaction.notPrevents("edit", [...availableExclusions])
	GAME.interaction.notStops([...availableExclusions], "edit")
})

GAME_SYSTEM
.define(({
	on, edit_interaction,
	component_data, component_definitions,
}) =>
'edit_component', GAME => {
	GAME.on('field > field-component', {
		dblclick: function (event) {
			const currentlyActive = GAME.edit_interaction.isActive({
				scope: this
			})
			GAME.edit_interaction.stop()

			const componentDefinition = GAME.component_definitions[GAME.component_data.get[this.component_id].component]
			const editable = componentDefinition.edit instanceof Function
				|| componentDefinition.resizable
				|| componentDefinition.rotatable
				// || this.component.targets
			if (!currentlyActive && editable) {
				GAME.edit_interaction.start({
					scope: this,
					component: componentDefinition,
				})
			}
		}
	})
})

}, LOAD_DELAY)

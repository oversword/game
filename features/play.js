setTimeout(() => {

GAME_SYSTEM
.define(({
	dom,
	interaction, bind, unbind,
	connection_index, container_element,
	component_data, component_definitions
}) =>
'play_interaction', GAME => GAME.interaction.define("play", {
	start(config) {
		const physics = {}
		const isphysics = {}
		const clocks = {}
		const renders = {}
		const collides = {}

		// Fade out drawings to lowest
		const playField = GAME.dom.createElement("play-field")
		applyStyles(playField, style.playField)

		// Create new instance of update structure
		// Copy abstract structure by ID

		const fieldComponentsClone = {}
		const connectionsClone = {forward:{},inverse:{}}
		const targetsClone = {forward:{},inverse:{}}

		const fieldInputsClone = {}


		const addConnections = (id, componentData) => {
			const { component, properties, pos } = componentData

			const componentDefinition = GAME.component_definitions[component]
			// const system_components = ['combination_signal_input','combination_target_input','combination_target_output','combination_signal_output']

			if (componentDefinition.combination) {
				// connectionsClone.forward[`_COMBINATION_OUTPUT_${id}`] = {}
				// connectionsClone.inverse[`_COMBINATION_OUTPUT_${id}`] = {}

				// Object.keys(GAME.connection_index.signal.forward[id]).filter(oid => !GAME.component_definitions[GAME.component_data.get[oid].component].combination).forEach(oid => connectionsClone.forward[id][oid] = true)
				// Object.keys(GAME.connection_index.signal.inverse[id])
				// 	.forEach(oid => {
				// 		const cons = structure.connections.filter(([ origin ]) => structure.components[origin].c === 'combination_signal_input')
				// 		cons.forEach(([, target ]) => {
				// 			const i = `_COMBINATION_${id}_${target}`
				// 			connectionsClone.inverse[i][oid] = true
				// 			connectionsClone.forward[oid][i] = true
				// 		})
				// 	})
				// Object.keys(GAME.connection_index.signal.forward[id])
				// 	.forEach(oid => {
				// 		const i2 = `_COMBINATION_OUTPUT_${id}`
				// 		connectionsClone.forward[i2][oid] = true
				// 		connectionsClone.inverse[oid][i2] = true
				//
				// 		const cons = structure.connections.filter(([, target ]) => structure.components[target].c === 'combination_signal_output')
				// 		cons.forEach(([ origin ]) => {
				// 			const i = `_COMBINATION_${id}_${origin}`
				// 			connectionsClone.forward[i][i2] = true
				// 			connectionsClone.inverse[i2][i] = true
				// 		})
				// 	})

				// Object.keys(GAME.connection_index.target.forward[id]).filter(oid => !GAME.component_definitions[GAME.component_data.get[oid].component].combination).forEach(oid => targetsClone.forward[id][oid] = true)
				// Object.keys(GAME.connection_index.target.inverse[id]).filter(oid => !GAME.component_definitions[GAME.component_data.get[oid].component].combination).forEach(oid => targetsClone.inverse[id][oid] = true)
				return;
			}

			connectionsClone.forward[id] = {}
			connectionsClone.inverse[id] = {}
			targetsClone.forward[id] = {}
			targetsClone.inverse[id] = {}
			return true

		}
		const addComponent = (id, componentData, parentData) => {
			const { component, properties, pos } = componentData


			const componentDefinition = GAME.component_definitions[component]
			const system_components = ['combination_signal_input','combination_target_input','combination_target_output','combination_signal_output']

			if (componentDefinition.combination) {
				const { structure } = componentDefinition
				structure.components.forEach((def, i) => {
					if (def.c === 'combination_signal_output') {
						addComponent(`_COMBINATION_OUTPUT_${id}`, {
							component: 'or gate',
							properties: {...def.p},
							pos: { x: def.x, y: def.y }
						})
						return
					}
					if (system_components.includes(def.c)) return;
					// console.log(def.c)
					const cid = `_COMBINATION_${id}_${i}`
					addComponent(cid, {
						component: def.c,
						properties: {...def.p},
						pos: { x: def.x, y: def.y }
					}, componentData)
					connectionsClone.forward[cid] = {}
					connectionsClone.inverse[cid] = {}
					targetsClone.forward[cid] = {}
					targetsClone.inverse[cid] = {}
				})
				connectionsClone.forward[`_COMBINATION_OUTPUT_${id}`] = {}
				connectionsClone.inverse[`_COMBINATION_OUTPUT_${id}`] = {}

				// Object.keys(GAME.connection_index.signal.forward[id]).filter(oid => !GAME.component_definitions[GAME.component_data.get[oid].component].combination).forEach(oid => connectionsClone.forward[id][oid] = true)
				Object.keys(GAME.connection_index.signal.inverse[id])
					.forEach(oid => {
						const cons = structure.connections.filter(([ origin,, type ]) => type === 'signal' && structure.components[origin].c === 'combination_signal_input')
						cons.forEach(([, target ]) => {
							const i = `_COMBINATION_${id}_${target}`
							connectionsClone.inverse[i][oid] = true
							connectionsClone.forward[oid][i] = true
						})
					})
				Object.keys(GAME.connection_index.target.inverse[id])
					.forEach(oid => {
						const cons = structure.connections.filter(([ origin,, type ]) => type === 'target' && structure.components[origin].c === 'combination_target_input')
						cons.forEach(([, target ]) => {
							const i = `_COMBINATION_${id}_${target}`
							targetsClone.inverse[i][oid] = true
							targetsClone.forward[oid][i] = true
						})
					})
				Object.keys(GAME.connection_index.target.forward[id])
					.forEach(oid => {
						const cons = structure.connections.filter(([, target, type ]) => type === 'target' && structure.components[target].c === 'combination_target_output')
						cons.forEach(([ origin ]) => {
							const i = `_COMBINATION_${id}_${origin}`
							targetsClone.forward[i][oid] = true
							targetsClone.inverse[oid][i] = true
						})
					})
				Object.keys(GAME.connection_index.signal.forward[id])
					.forEach(oid => {
						const i2 = `_COMBINATION_OUTPUT_${id}`
						connectionsClone.forward[i2][oid] = true
						connectionsClone.inverse[oid][i2] = true

						const cons = structure.connections.filter(([, target, type ]) => type === 'signal' && structure.components[target].c === 'combination_signal_output')
						cons.forEach(([ origin ]) => {
							const i = `_COMBINATION_${id}_${origin}`
							connectionsClone.forward[i][i2] = true
							connectionsClone.inverse[i2][i] = true
						})
					})
				structure.connections.forEach(([ origin, target, type ]) => {
					if (system_components.includes(structure.components[origin].c) || system_components.includes(structure.components[target].c))
						return;

					const i = `_COMBINATION_${id}_${origin}`
					const i2 = `_COMBINATION_${id}_${target}`
					if (type === 'signal') {
						connectionsClone.forward[i][i2] = true
						connectionsClone.inverse[i2][i] = true
					} else if (type === 'target') {
						targetsClone.forward[i][i2] = true
						targetsClone.inverse[i2][i] = true
					}
				})

				// Object.keys(GAME.connection_index.target.forward[id]).filter(oid => !GAME.component_definitions[GAME.component_data.get[oid].component].combination).forEach(oid => targetsClone.forward[id][oid] = true)
				// Object.keys(GAME.connection_index.target.inverse[id]).filter(oid => !GAME.component_definitions[GAME.component_data.get[oid].component].combination).forEach(oid => targetsClone.inverse[id][oid] = true)
				return;
			}


			if (parentData) {

				const parentComponentDefinition = GAME.component_definitions[parentData.component]
				const renderable = parentComponentDefinition.structure.components.filter(component => GAME.component_definitions[component.c] && GAME.component_definitions[component.c].renders)
				const minX = Math.min(...renderable.map(component => component.x))
				const minY = Math.min(...renderable.map(component => component.y))
				const maxX = Math.max(...renderable.map(component => component.x+component.p.w))
				const maxY = Math.max(...renderable.map(component => component.y+component.p.h))
				const width = maxX - minX
				const height = maxY - minY
				const wScale = parentData.properties.w / width
				const hScale = parentData.properties.h / height

				const ps = (componentDefinition.getSize || getDefaultSize)({properties: {...properties}})
				fieldComponentsClone[id] = {
					component,
					properties: {...properties},
					pos: {
						x: parentData.pos.x + ((pos.x - minX) * wScale),
						y: parentData.pos.y + ((pos.y - minY) * hScale),
					},
					size: {
						width: ps.width * wScale,
						height: ps.height * hScale
					}
				}
			} else {
				fieldComponentsClone[id] = {
					component,
					properties: {...properties},
					pos: {...pos}
				}
			}
			if (componentDefinition.physics) {
				isphysics[id] = true
			}
			if (componentDefinition.hasPhysics) {
				// TODO: combination positioning
				if (parentData) {

					const parentComponentDefinition = GAME.component_definitions[parentData.component]
					const renderable = parentComponentDefinition.structure.components.filter(component => GAME.component_definitions[component.c] && GAME.component_definitions[component.c].renders)
					const minX = Math.min(...renderable.map(component => component.x))
					const minY = Math.min(...renderable.map(component => component.y))
					const maxX = Math.max(...renderable.map(component => component.x+component.p.w))
					const maxY = Math.max(...renderable.map(component => component.y+component.p.h))
					const width = maxX - minX
					const height = maxY - minY
					const wScale = parentData.properties.w / width
					const hScale = parentData.properties.h / height

					const { width: w, height: h } = componentDefinition.getSize(componentData, 1)
					physics[id] = {
						position: {
							x: parentData.pos.x + ((pos.x - minX) * wScale),
							y: parentData.pos.y + ((pos.y - minY) * hScale),
						},
						size: { x: w * wScale, y: h * hScale },
						velocity: { x: 0, y: 0 },
						acceleration: { x: 0, y: 0 },
					}
				} else {
					const { width: w, height: h } = componentDefinition.getSize(componentData, 1)
					physics[id] = {
						position: { ...pos },
						size: { x: w, y: h },
						velocity: { x: 0, y: 0 },
						acceleration: { x: 0, y: 0 },
					}
				}
			}
			if (componentDefinition.collision) {
				collides[id] = {}
			}
			if (componentDefinition.timing) {
				clocks[id] = {
					duration: properties.size,
					taken: 0
				}
			}
			if (componentDefinition.input){
				const ident = `${properties.source}: ${properties.which}`
				fieldInputsClone[ident] = fieldInputsClone[ident] || []
				fieldInputsClone[ident].push(id)
				// fieldInputsClone[id] = {
				// 	id,
				// 	properties
				// }
			}
			// Copy visual elements
			if (componentDefinition.renders) {

				// parentData


				const drawing = GAME.dom.createElement("play-drawing")

				renders[id] = {}

				if (parentData) {

					const parentComponentDefinition = GAME.component_definitions[parentData.component]
					const renderable = parentComponentDefinition.structure.components.filter(component => GAME.component_definitions[component.c] && GAME.component_definitions[component.c].renders)
					const minX = Math.min(...renderable.map(component => component.x))
					const minY = Math.min(...renderable.map(component => component.y))
					const maxX = Math.max(...renderable.map(component => component.x+component.p.w))
					const maxY = Math.max(...renderable.map(component => component.y+component.p.h))
					const width = maxX - minX
					const height = maxY - minY

					const { width: w, height: h } = componentDefinition.getSize(componentData, 1)
					const wScale = parentData.properties.w / width
					const hScale = parentData.properties.h / height
					applyStyles(drawing, {
						left: parentData.pos.x + ((pos.x - minX) * wScale),
						top: parentData.pos.y + ((pos.y - minY) * hScale),
						width:  w * wScale,
						height: h * hScale,
					})
					drawing.renderHelpers.lines = [...properties.lines]
					drawing.renderHelpers.component_id  = id

					drawing.render = function (context) {
						const { y, x, width: w, height: h } = this.getBoundingClientRect()
						// window.FS =  fieldSnapshot
						const { lines, component_id } = this.renderHelpers
						if (fieldSnapshot[component_id]) {
							context.beginPath()
							lines.forEach(line => {
								context.moveTo((line.s[0]*wScale)+x, (line.s[1]*hScale)+y)
								if (line.c2)
									context.bezierCurveTo(line.c1[0]+x, line.c1[1]+y, line.c2[0]+x, line.c2[1]+y, line.e[0]+x, line.e[1]+y)
								else if (line.c1)
									context.quadraticCurveTo(line.c1[0]+x, line.c1[1]+y, line.e[0]+x, line.e[1]+y)
								else if (line.e)
									context.lineTo((line.e[0]*wScale)+x, (line.e[1]*hScale)+y)
							})
							context.stroke()
						} else {
							return;
							context.beginPath()
							context.moveTo(x,y)
							context.lineTo(x+w,y+h)
							context.moveTo(x+w,y)
							context.lineTo(x,y+h)
							context.stroke()
						}
					}
					// const render_combination = combination => function (context) {
					// 	const { y, x, width: w, height: h } = this.getBoundingClientRect()
					// 	// console.log(this,context,combination)
					// 	const renderable = combination.structure.components.filter(component => GAME.component_definitions[component.c] && GAME.component_definitions[component.c].renders)
					// 	const minX = Math.min(...renderable.map(component => component.x))
					// 	const minY = Math.min(...renderable.map(component => component.y))
					// 	const maxX = Math.max(...renderable.map(component => component.x+component.p.w))
					// 	const maxY = Math.max(...renderable.map(component => component.y+component.p.h))
					// 	const width = maxX - minX
					// 	const height = maxY - minY
					// 	renderable.forEach(component => {
					// 		GAME.component_definitions[component.c].icon.call({
					// 			getBoundingClientRect() {
					// 				return {
					// 					x:  (component.x-minX),
					// 					y:  (component.y-minY),
					// 					width: w * component.p.w / width,
					// 					height: h * component.p.h / height,
					// 				}
					// 			},
					// 			renderHelpers: GAME.component_definitions[component.c].getRenderHelpers({properties:component.p}),
					// 		}, context)
					// 	})
					// }
				} else {
					const { width: w, height: h } = componentDefinition.getSize(componentData, 1)
					applyStyles(drawing, {
						left: pos.x,
						top: pos.y,
						width: w,
						height: h,
					})
					drawing.renderHelpers.lines = [...properties.lines]
					drawing.renderHelpers.component_id  = id

					drawing.render = function (context) {
						const { y, x, width: w, height: h } = this.getBoundingClientRect()
						// window.FS =  fieldSnapshot
						const { lines, component_id } = this.renderHelpers
						if (fieldSnapshot[component_id]) {
							context.beginPath()
							lines.forEach(line => {
								context.moveTo(line.s[0]+x, line.s[1]+y)
								if (line.c2)
									context.bezierCurveTo(line.c1[0]+x, line.c1[1]+y, line.c2[0]+x, line.c2[1]+y, line.e[0]+x, line.e[1]+y)
								else if (line.c1)
									context.quadraticCurveTo(line.c1[0]+x, line.c1[1]+y, line.e[0]+x, line.e[1]+y)
								else if (line.e)
									context.lineTo(line.e[0]+x, line.e[1]+y)
							})
							context.stroke()
						} else {
							return;
							context.beginPath()
							context.moveTo(x,y)
							context.lineTo(x+w,y+h)
							context.moveTo(x+w,y)
							context.lineTo(x,y+h)
							context.stroke()
						}
					}
				}
				fieldComponentsClone[id].drawing = drawing

				playField.appendChild(drawing)
			}

			// connectionsClone.forward[id] = {}
			// connectionsClone.inverse[id] = {}
			// targetsClone.forward[id] = {}
			// targetsClone.inverse[id] = {}
			return true
		}
		Object.keys(GAME.component_data.get).forEach(id => {
			const isPlain = addConnections(id, GAME.component_data.get[id])

			if (isPlain) {
				Object.keys(GAME.connection_index.signal.forward[id]).filter(oid => !GAME.component_definitions[GAME.component_data.get[oid].component].combination).forEach(oid => connectionsClone.forward[id][oid] = true)
				Object.keys(GAME.connection_index.signal.inverse[id]).filter(oid => !GAME.component_definitions[GAME.component_data.get[oid].component].combination).forEach(oid => connectionsClone.inverse[id][oid] = true)

				Object.keys(GAME.connection_index.target.forward[id]).filter(oid => !GAME.component_definitions[GAME.component_data.get[oid].component].combination).forEach(oid => targetsClone.forward[id][oid] = true)
				Object.keys(GAME.connection_index.target.inverse[id]).filter(oid => !GAME.component_definitions[GAME.component_data.get[oid].component].combination).forEach(oid => targetsClone.inverse[id][oid] = true)
			}
		})
		Object.keys(GAME.component_data.get).forEach(id => {
			const isPlain = addComponent(id, GAME.component_data.get[id])

			// if (isPlain) {
			// 	Object.keys(GAME.connection_index.signal.forward[id]).filter(oid => !GAME.component_definitions[GAME.component_data.get[oid].component].combination).forEach(oid => connectionsClone.forward[id][oid] = true)
			// 	Object.keys(GAME.connection_index.signal.inverse[id]).filter(oid => !GAME.component_definitions[GAME.component_data.get[oid].component].combination).forEach(oid => connectionsClone.inverse[id][oid] = true)
			//
			// 	Object.keys(GAME.connection_index.target.forward[id]).filter(oid => !GAME.component_definitions[GAME.component_data.get[oid].component].combination).forEach(oid => targetsClone.forward[id][oid] = true)
			// 	Object.keys(GAME.connection_index.target.inverse[id]).filter(oid => !GAME.component_definitions[GAME.component_data.get[oid].component].combination).forEach(oid => targetsClone.inverse[id][oid] = true)
			// }
		})

		console.log(fieldComponentsClone, connectionsClone, Object.fromEntries(Object.entries(GAME.component_definitions)
			.filter(([, { combination } ]) => !combination)
			.map(([ name, { logic = () => false, logicEnables = false }]) =>
				[ name, { logic, logicEnables } ])))

		const fieldSnapshot = new FieldState(
			Object.fromEntries(Object.entries(GAME.component_definitions)
				.filter(([, { combination } ]) => !combination)
				.map(([ name, { logic = () => false, logicEnables = false }]) =>
					[ name, { logic, logicEnables } ])),
			Object.fromEntries(Object.entries(fieldComponentsClone)
				.map(([ id, { component }]) => [ id, component ])),
			connectionsClone
		)

		fieldSnapshot("end", event => {
			// console.log('end')
			const updates = Object.entries(event.updates)
			const physicsUpdates = []
			const renderUpdates = []
			updates.forEach(([ id, { end } ]) => {
				if (end && isphysics[id])
					physicsUpdates.push(id)
				if (renders[id])
					renderUpdates.push(id)
			})
			if (renderUpdates.length)
				playField.render = () => {}

			physicsUpdates.forEach(id => {
				const { properties, component, pos } = fieldComponentsClone[id]
				const targets = Object.keys(targetsClone.forward[id])

				const filteredTargets = targets
					.filter(tid => physics[tid])
				if (filteredTargets.length === 0) return;

				filteredTargets.forEach(tid => {
					const obj = physics[tid]
					const positionUpdate = GAME.component_definitions[component].physics(obj, fieldComponentsClone[id])
					if (positionUpdate)
						positionUpdates[tid] = true
				})
			})
		})

		Object.keys(fieldComponentsClone).forEach(id => {
			fieldSnapshot[id] = undefined
		})
		const callbacks = {
			keydown: event => {
				const ident = `keyboard: ${event.code}`
				const ids = fieldInputsClone[ident]
				if (!ids) return;
				ids.forEach(id => {
					fieldSnapshot[id] = true
				})
			},
			keyup: event => {
				const ident = `keyboard: ${event.code}`
				const ids = fieldInputsClone[ident]
				if (!ids) return;
				ids.forEach(id => {
					fieldSnapshot[id] = false
				})
			}
		}

		const collide = (obj, oobj) => {
			// if (!fieldSnapshot[oid]) return; // TODO: test if enabled to avoid unneeded logic
			if (obj.position.x > (oobj.position.x + oobj.size.x))
				return;
			if (obj.position.y > (oobj.position.y + oobj.size.y))
				return;
			if (oobj.position.x > (obj.position.x + obj.size.x))
				return;
			if (oobj.position.y > (obj.position.y + obj.size.y))
				return;
			return true
		}

		let positionUpdates = {}
		const gameTick = () => {
			// console.log('tick')
			// TODO: need to be smarter for other clock variations
			Object.entries(clocks).forEach(([ id, timer ])=> {
				timer.taken += 1
				if (timer.taken > timer.duration){
					timer.taken = 0
					fieldSnapshot[id] = !fieldSnapshot[id]
				}
			})
			Object.entries(physics).forEach(([ id, phys ]) => {
				if (phys.acceleration.x)
					phys.velocity.x += phys.acceleration.x
				if (phys.acceleration.y)
					phys.velocity.y += phys.acceleration.y
				if (phys.velocity.x) {
					phys.position.x += phys.velocity.x
					positionUpdates[id] = true
				}
				if (phys.velocity.y) {
					phys.position.y += phys.velocity.y
					positionUpdates[id] = true
				}
			})
			Object.keys(positionUpdates).forEach(id => {
				const obj = fieldComponentsClone[id]
				if (obj.drawing) {
					obj.drawing.style.left = physics[id].position.x
					obj.drawing.style.top = physics[id].position.y
				}
				if (collides[id]) {
					const targets = Object.keys(targetsClone.forward[id])
					const reverseTargets = Object.keys(targetsClone.inverse[id])

					// if (!fieldSnapshot[id]) return; // TODO: test if enabled to avoid unneeded logic
					fieldSnapshot[id] = reverseTargets.some(oid => physics[oid] && collide(physics[id], physics[oid]))

					targets.forEach(oid => {
						if (!physics[oid]) return;
						fieldSnapshot[oid] = Object.keys(targetsClone.inverse[oid])
							.some(ooid => physics[ooid] && collide(physics[oid], physics[ooid]))
					})
				}
			})
			positionUpdates = {}
		}

		GAME.bind(GAME.dom, callbacks)
		GAME.container_element.appendChild(playField)
		const gameInterval = setInterval(gameTick, 1000/30)
		return () => {
			GAME.unbind(GAME.dom, callbacks)
			playField.remove()
			clearInterval(gameInterval)
		}
	}
}))
.define(({ interaction }) =>
'play_interaction_rules', GAME => {
	GAME.interaction.notPrevents(InteractionState.ALL, "play")
	GAME.interaction.stops("play", InteractionState.STOPS_ALL)
})
.define(({ render, buttons, play_interaction }) =>
'play_interface', GAME => {

	GAME.render.playButton = function (context) {
		const { y, x, width: w, height: h } = this.getBoundingClientRect()

		context.beginPath()
		context.moveTo(x+(w/16),y)
		context.lineTo(x+(15*w/16),y+(h/2))
		context.lineTo(x+(w/16),y+h)
		context.closePath()
		context.stroke()
	}

	GAME.buttons.play = {
		icon: GAME.render.playButton,
		events: {
			click (event) {
				if (GAME.play_interaction.isActive())
					GAME.play_interaction.stop()
				else GAME.play_interaction.start()
			}
		},
		abovePlayField: true
	}
})


}, LOAD_DELAY)

setTimeout(() => {


const GAME_connection_updateConnectionStyle = (GAME, id) => {
	const connection = GAME.connection_data.get[id]
	const originComponent = GAME.component_data.get[connection.originId]
	const targetComponent = GAME.component_data.get[connection.targetId]
	const connectionElement = connection.element

	const {
		y: originY,
		x: originX,
	} = originComponent.pos
	const {
		y: targetY,
		x: targetX,
	} = targetComponent.pos

	const { width: targetW, height: targetH } = (GAME.component_definitions[targetComponent.component].getSize || getDefaultSize)(targetComponent)
	const { width: originW, height: originH } = (GAME.component_definitions[originComponent.component].getSize || getDefaultSize)(originComponent)

	// TODO: configurable
	const normalBox = connection.type === 'target'
		? normalizeBox({
			x: originX+(originW/2),
			y: originY
		}, {
			x: targetX+(targetW/2),
			y: targetY+targetH
		})
		: normalizeBox({
			x: originX+originW,
			y: originY+(originH/2)
		}, {
			x: targetX,
			y: targetY+(targetH/2)
		})

	applyStyles(connectionElement, {
		left: normalBox.x,
		top: normalBox.y,
		width: normalBox.w,
		height: normalBox.h,
	})

	connectionElement.renderHelpers.xd = normalBox.xd
	connectionElement.renderHelpers.yd = normalBox.yd
}


GAME_SYSTEM
.define(({ render }) =>
'connection_render', GAME => {
	GAME.render.connection = function (context) {
		const { y, x, width: w, height: h } = this.getBoundingClientRect()
		const { originId, xd, yd } = this.renderHelpers

		// console.log({...this.renderHelpers})

		const bxd = Boolean(xd+1)
		const byd = Boolean(yd+1)
		const bo = Boolean(originId)

		const startX = bxd === bo ? x : x+w
		const startY = byd === bo ? y : y+h
		const endX = bxd === !bo ? x : x+w
		const endY = byd === !bo ? y : y+h

		context.beginPath()
		context.moveTo(startX, startY)
		context.lineTo(endX, endY)
		context.stroke()

		const midX = (startX + endX) / 2
		const midY = (startY + endY) / 2
		const angle = Math.atan2(endY - startY, endX - startX)
		const d = 10
		const a1 = angle - 2.5
		const a2 = angle + 2.5
		context.beginPath()
		context.moveTo(midX+(d*Math.cos(a1)), midY+(d*Math.sin(a1)))
		context.lineTo(midX, midY)
		context.lineTo(midX+(d*Math.cos(a2)), midY+(d*Math.sin(a2)))
		context.stroke()

	}
	GAME.render.connectionNode = function (context) {
		const { y, x, width: w, height: h } = this.getBoundingClientRect()

		const r = w/2
		context.beginPath()
		context.arc(
			x + r, y + r,
			r,
			0, Math.PI*2,
		)

		context.stroke()
	}
	GAME.render.targetsNode = function (context) {
		const { y, x, width: w, height: h } = this.getBoundingClientRect()

		context.beginPath()
		context.arc(x+(w/2), y+(h/2), w/2, 0, Math.PI*2)
		context.stroke()
		context.beginPath()
		context.moveTo(x, y+(h/2))
		context.lineTo(x+(w/4), y+(h/2))
		context.moveTo(x+w, y+(h/2))
		context.lineTo(x+(3*w/4), y+(h/2))
		context.moveTo(x+(w/2), y)
		context.lineTo(x+(w/2), y+(h/4))
		context.moveTo(x+(w/2), y+h)
		context.lineTo(x+(w/2), y+(3*h/4))
		context.stroke()
	}
	GAME.render.targetedNode = function (context) {
		const { y, x, width: w, height: h } = this.getBoundingClientRect()

		context.beginPath()
		context.arc(x+(w/2), y+(h/2), w/2, 0, Math.PI*2)
		context.stroke()
		context.beginPath()
		context.moveTo(x, y+(h/2))
		context.lineTo(x+(w/4), y+(h/2))
		context.moveTo(x+w, y+(h/2))
		context.lineTo(x+(3*w/4), y+(h/2))
		context.moveTo(x+(w/2), y)
		context.lineTo(x+(w/2), y+(h/4))
		context.moveTo(x+(w/2), y+h)
		context.lineTo(x+(w/2), y+(3*h/4))
		context.stroke()
	}
	GAME.render.target = function (context) {
		const { y, x, width: w, height: h } = this.getBoundingClientRect()

		context.beginPath()
		context.arc(x+(w/2), y+(h/2), w/2, 0, Math.PI*2)
		context.stroke()
		context.beginPath()
		context.moveTo(x, y+(h/2))
		context.lineTo(x+(w/4), y+(h/2))
		context.moveTo(x+w, y+(h/2))
		context.lineTo(x+(3*w/4), y+(h/2))
		context.moveTo(x+(w/2), y)
		context.lineTo(x+(w/2), y+(h/4))
		context.moveTo(x+(w/2), y+h)
		context.lineTo(x+(w/2), y+(3*h/4))
		context.stroke()
	}
})
.define(({
	dom,
	connection_data, component_data, component_definitions,
	render, field_element,
}) =>
'connection_view', GAME => {
	GAME.connection_data.watch(['initialdata','afterupdate'], ({ events }) => {
		events.forEach(event => {
			({
				create(id, connection) {
					const fieldConnection = GAME.dom.createElement("field-connection")

					connection.element = fieldConnection
					fieldConnection.id = `field-connection_${id}`
					fieldConnection.connection_id = id

					fieldConnection.renderHelpers.originId = connection.originId
					fieldConnection.renderHelpers.targetId = connection.targetId

					applyStyles(fieldConnection, style.connection)

					fieldConnection.render = GAME.render.connection
					GAME_connection_updateConnectionStyle(GAME, id)
					GAME.field_element.appendChild(fieldConnection)
				},
				update(id, connection) {},
				delete(id, connection) {
					connection.element.remove()
				}
			})[event.type](event.key, event.value)
		})
	})

})

.after('component_view')
.define(({
	dom,
	component_definitions, connection_index,
	component_data, connection_data,
	render,
}) =>
'connection_component_decorations', GAME => {
	GAME.component_data.watch(['initialdata','afterupdate'], ({ events }) => {
		events.forEach(event => {
			({
				create(id, component) {
					const fieldComponent = component.element

					const componentDefinition = GAME.component_definitions[component.component]
					if (componentDefinition.signalMaxInputs !== 0) {
						const inputNode = GAME.dom.createElement("input-node")
						inputNode.component_id = id
						applyStyles(inputNode, style.node)
						applyStyles(inputNode, style.inputNode)
						inputNode.render = GAME.render.connectionNode
						fieldComponent.appendChild(inputNode)
					}
					if (componentDefinition.signalMaxOutputs !== 0) {
						const outputNode = GAME.dom.createElement("output-node")
						outputNode.component_id = id
						applyStyles(outputNode, style.node)
						applyStyles(outputNode, style.outputNode)
						outputNode.render = GAME.render.connectionNode
						fieldComponent.appendChild(outputNode)
					}
					if (componentDefinition.targets) {
						const targetsNode = GAME.dom.createElement("targets-node")
						targetsNode.component_id = id
						applyStyles(targetsNode, style.node)
						applyStyles(targetsNode, style.targetsNode)
						targetsNode.render = GAME.render.targetsNode
						fieldComponent.appendChild(targetsNode)
					}
					if (componentDefinition.targetable) {
						const targetedNode = GAME.dom.createElement("targeted-node")
						targetedNode.component_id = id
						applyStyles(targetedNode, style.node)
						applyStyles(targetedNode, style.targetedNode)
						targetedNode.render = GAME.render.targetedNode
						fieldComponent.appendChild(targetedNode)
					}

					const updateConnectionStyles = () => {
						Object.values(GAME.connection_index).forEach(typeConnections => {
							Object.values(typeConnections.forward[component.id])
								.concat(Object.values(typeConnections.inverse[component.id]))
								.forEach(id => GAME_connection_updateConnectionStyle(GAME, id))
						})
					}
					component.pos('update', updateConnectionStyles)
					component.properties('update', updateConnectionStyles)
				},
				update(id, component) {},
				delete(id, component) {}
			})[event.type](event.key, event.value)
		})
	})
})
.define(({
	dom,
	on, interaction,
	field_element, render, container_element,
	component_definitions, component_data,
	connection_data, connection_index
}, { combination_connection_nodes }) =>
'connect_interaction', GAME => {
	GAME.on('field-component input-node', {
		click(event) {
			const id = this.component_id
			const component = GAME.component_data.get[id]
			const componentDefinition = GAME.component_definitions[component.component]

			if (!GAME.connect_interaction.isActive())
				event.cancelBubble = true

			if ("signalMaxInputs" in componentDefinition
			&& Object.keys(GAME.connection_index.signal.inverse[id]) >= componentDefinition.signalMaxInputs)
				return

			const { y, x, width: w, height: h } = this.getBoundingClientRect()

			GAME.connect_interaction.start({
				targetId: id,
				type: 'signal',
				components: [
					...(GAME.combination_connection_nodes || []),
					...GAME.field_element.getElementsByTagName("field-component")
				],
				start: {
					x: x+(w/2),
					y: y+(h/2),
				},
			})
		}
	})
	GAME.on('field-component output-node', {
		click(event) {
			const id = this.component_id
			const component = GAME.component_data.get[id]
			const componentDefinition = GAME.component_definitions[component.component]


			if (!GAME.connect_interaction.isActive())
				event.cancelBubble = true

			if ("signalMaxOutputs" in componentDefinition
			&& Object.keys(GAME.connection_index.signal.forward[id]) >= componentDefinition.signalMaxOutputs)
				return

			const { y, x, width: w, height: h } = this.getBoundingClientRect()

			GAME.connect_interaction.start({
				originId: id,
				type: 'signal',
				components: [
					...(GAME.combination_connection_nodes || []),
					...GAME.field_element.getElementsByTagName("field-component")
				],
				start: {
					x: x+(w/2),
					y: y+(h/2),
				},
			})
		}
	})
	GAME.on('field-component targets-node', {
		click(event) {

			const id = this.component_id
			const component = GAME.component_data.get[id]
			const componentDefinition = GAME.component_definitions[component.component]


			if (!GAME.connect_interaction.isActive())
				event.cancelBubble = true

			if ("targetMaxOutputs" in componentDefinition
			&& Object.keys(GAME.connection_index.target.forward[id]) >= componentDefinition.targetMaxOutputs)
				return

			const { y, x, width: w, height: h } = this.getBoundingClientRect()

			GAME.connect_interaction.start({
				originId: id,
				type: 'target',
				components: [
					...(GAME.combination_connection_nodes || []),
					...GAME.field_element.getElementsByTagName("field-component")
				],
				start: {
					x: x+(w/2),
					y: y+(h/2),
				},
			})
		}
	})
	GAME.on('field-component targeted-node', {
		click(event) {

			const id = this.component_id
			const component = GAME.component_data.get[id]
			const componentDefinition = GAME.component_definitions[component.component]

			if (!GAME.connect_interaction.isActive())
				event.cancelBubble = true

			if ("targetMaxInputs" in componentDefinition
			&& Object.keys(GAME.connection_index.target.inverse[id]) >= componentDefinition.targetMaxInputs)
				return

			const { y, x, width: w, height: h } = this.getBoundingClientRect()

			GAME.connect_interaction.start({
				targetId: id,
				type: 'target',
				components: [
					...(GAME.combination_connection_nodes || []),
					...GAME.field_element.getElementsByTagName("field-component")
				],
				start: {
					x: x+(w/2),
					y: y+(h/2),
				}
			})
		}
	})

	GAME.component_data.watch('delete', ({ key: id }) => {
		if (!GAME.connect_interaction.isActive()) return;
		if (!(
			GAME.connect_interaction.isActive({ originId: id }) || GAME.connect_interaction.isActive({ targetId: id })
		))return;

		GAME.connect_interaction.stop()
	})

	return GAME.interaction.define("connect", {
		start(config) {
			const {
				originId,
				targetId,
				type,
				start,
				id,
				components = []
			} = config
			const endInteraction = () => {
				GAME.interaction.stop(id)
			}

			const mousemove = (event) => {
				const normalBox = normalizeBox(start, event)

				applyStyles(connection, {
					left: normalBox.x,
					top: normalBox.y,
					width: normalBox.w,
					height: normalBox.h,
				})

				connection.renderHelpers.xd = normalBox.xd
				connection.renderHelpers.yd = normalBox.yd
			}

			const connect = function (event) {
				const targetId = config.targetId || this.component_id
				const originId = config.originId || this.component_id

				GAME.connection_data.rec({
					originId,
					targetId,
					type
				})

				endInteraction()
			}

			const connection = GAME.dom.createElement("field-connection")
			GAME.field_element.appendChild(connection)

			applyStyles(connection, style.connection)
			applyStyles(connection, {
				left: event.x,
				top: event.y
			})

			if (originId)
				connection.renderHelpers.originId = originId
			if (targetId)
				connection.renderHelpers.targetId = targetId

			connection.render = GAME.render.connection

			GAME.container_element.addEventListener("mousemove", mousemove)
			setTimeout(() => {
				components.forEach(component => {
					component.addEventListener("click", connect)
				})
			})
			return (config) => {
				connection.remove()
				GAME.container_element.removeEventListener("mousemove", mousemove)
				components.forEach(component => {
					component.removeEventListener("click", connect)
				})
			}
		}
	})
})


}, LOAD_DELAY)

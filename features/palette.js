setTimeout(() => {


GAME_SYSTEM
.define(({ dom, container_element, render, component_definitions }) =>
'palette_view', GAME => {
	GAME.render.paletteSeparator = function (context) {
		const { y, x, width: w, height: h } = this.getBoundingClientRect()

		context.beginPath()
		context.moveTo(x, y)
		context.lineTo(x+w, y)

		context.stroke()
	}

	const addPaletteComponent = (component, i) => {
		const y = i * (size + spacing)
		if (i !== 0) {
			const seperatorElement = GAME.dom.createElement('separator')

			applyStyles(seperatorElement, style.separator)
			seperatorElement.style.top = y

			seperatorElement.render = GAME.render.paletteSeparator
			palette.appendChild(seperatorElement)
		}
		const componentElement = GAME.dom.createElement('component')
		componentElement.component = component

		componentElement.style.top = y+(spacing/2)
		applyStyles(componentElement, style.paletteComponent)

		componentElement.render = component.icon
		palette.appendChild(componentElement)
	}

	const palette = GAME.dom.createElement("palette")
	applyStyles(palette, style.palette)
	GAME.container_element.appendChild(palette)

	let componentCount = 0
	GAME.component_definitions(['initialdata','afterupdate'], ({ events }) => {
		const createEvents = events.filter(({ type }) => type === 'create')
		createEvents.map(({ value }) => value)
			.forEach((component, i) => {
				addPaletteComponent(component, componentCount+i)
			})
		componentCount += createEvents.length
		palette.style.height = (size+spacing)*componentCount
	})
})

.define(({
	dom,
	on, component_data, component_definitions,
	drag_interaction, container_element, field_element,
	pausefieldinputs, pausekeybindings, resumefieldinputs, resumekeybindings,
}) =>
'palette_interface', GAME => {
	let edits = 1
	GAME.on('palette component', {
		dblclick: function (event) {
			if (!this.component.combination) return;

			const edit_id = `${edits++}`

			console.log(event,this,this.component)
			//*

			const componentDefinition = this.component

			const rerender = () => {
				this.render = this.component.icon
			}
		},
		mousedown: function (event) {
			GAME.drag_interaction.start(config => {
				let helperAdded = false

				const helper = GAME.dom.createElement("component")

				helper.component = this.component
				helper.render = this.component.icon
				const { x, y } = event.target.getBoundingClientRect()

				applyStyles(helper, {
					left: x,
					top: y,
					width: size,
					height: size
				})
				applyStyles(helper, style.dragHelper)

				Object.assign(config, {
					initiator: this,
					targets: [GAME.field_element],
					ignores:[helper],
					cancelOnWrongDrop: true,
					step: movement => {
						if (((movement.x**2)+(movement.y**2))**0.5 > 10 && !helperAdded) {
							GAME.container_element.appendChild(helper)
							helperAdded = true
						}
						if (helperAdded)
							applyStyles(helper, {
								left: x + movement.x,
								top: y + movement.y,
							})
					},
					success: config => {
						const { id } = GAME.component_data.rec({
							component: this.component.name,
							pos: {
								x: helper.offsetLeft,
								y: helper.offsetTop,
							},
							properties: {
								...(this.component.defaultProperties || {}),
							}
						})
					},
					start: {
						x: event.x,
						y: event.y
					}
				})
				return config => {
					helper.remove()
				}
			})
		}
	})
})




}, LOAD_DELAY)

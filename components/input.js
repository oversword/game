setTimeout(() => {


GAME_SYSTEM
.after('logic_components','physics_components','drawing_component')
.define(({ component_definitions, render, component_data, edit_interaction }) =>
'input_components', GAME => {

	const logic_or = inputs => inputs.some(truthy)

	GAME.render.component_button = function (context) {
		const { y, x, width: w, height: h } = this.getBoundingClientRect()

		const radius = 1/4

		context.beginPath()
		context.moveTo(
			x+(w*radius), y
		)
		context.quadraticCurveTo(
			x, y,
			x, y+(h*radius)
		)
		context.lineTo(
			x, y+(h*(1-radius))
		)
		context.quadraticCurveTo(
			x, y+h,
			x+(w*radius), y+h
		)
		context.lineTo(
			x+(w*(1-radius)), y+h
		)
		context.quadraticCurveTo(
			x+w, y+h,
			x+w, y+(h*(1-radius))
		)
		context.lineTo(
			x+w, y+(h*radius)
		)
		context.quadraticCurveTo(
			x+w, y,
			x+(w*(1-radius)), y
		)
		context.closePath()
		context.stroke()

		context.fillStyle = "#000000"
		context.font = "12px sans-serif"
		context.textAlign = "center"
		context.textBaseline = "middle"

		const { source, which } = this.renderHelpers
		if (source) {
			if (source === "keyboard")
				context.fillText(which, x+(w/2), y+(h/2))
			else
			if (source === "mouse")
				context.fillText(`M${which}`, x+(w/2), y+(h/2))
		}
	}

	const components = [
		{
			name: "button press",
			icon: GAME.render.component_button,

			signalMaxInputs: 0,

			logic: () => false,

			input: true,

			defaultProperties: {
				which: false,
				source: false
			},

			getRenderHelpers(component) {
				return {
					which: component.properties.which,
					source: component.properties.source,
				}
			},

			edit() {
				const content = GAME.dom.createElement("div")
				const info = GAME.dom.createElement("div")
				const choice = GAME.dom.createElement("div")

				info.style.height = 40
				info.style.borderBottom = "1px solid #999999"
				choice.style.height = 30
				choice.style.textAlign = "center"
				choice.style.fontSize = "20px"
				choice.style.paddingTop = 5

				const properties = {...GAME.component_data.get[this.component_id].properties}
				if (properties.source === "mouse")
					choice.innerHTML = `Mouse Button: ${properties.which}`
				else
				if (properties.source === "keyboard")
					choice.innerHTML = `Keboard Key: ${properties.which}`

				content.appendChild(info)
				content.appendChild(choice)

				info.innerHTML = "Press a keyboard or mouse button to assign an input"
				content.onmousedown = event => {
					choice.innerHTML = `Mouse Button: ${event.which}`
					properties.source = "mouse"
					properties.which = event.which
				}
				content.onwheel = event => {
					if (Math.abs(event.deltaX) < Math.abs(event.deltaY)){
						if (event.deltaY < 0) {
							choice.innerHTML = `Mouse Button: 4`
							properties.source = "mouse"
							properties.which = 4
						} else
						if (event.deltaY > 0) {
							choice.innerHTML = `Mouse Button: 5`
							properties.source = "mouse"
							properties.which = 5
						}
					} else {
						if (event.deltaX < 0) {
							choice.innerHTML = `Mouse Button: 6`
							properties.source = "mouse"
							properties.which = 6
						} else
						if (event.deltaX > 0) {
							choice.innerHTML = `Mouse Button: 7`
							properties.source = "mouse"
							properties.which = 7
						}
					}
				}
				const keyEvent = event => {
					choice.innerHTML = `Keboard Key: ${event.code}`
					properties.source = "keyboard"
					properties.which = event.code
				}
				GAME.dom.addEventListener("keydown", keyEvent)
				popup({ title: "Button Press" }, content)
				.close((...a) => {
					GAME.dom.removeEventListener("keydown", keyEvent)
					GAME.edit_interaction.stop({
						scope: this
					})
				})
				.accept((...a) => {
					GAME.component_data.rec[this.component_id].properties = properties
				})
			},
		},
	]

	components.forEach(component => {
		GAME.component_definitions[component.name] = component
	})

})
.define(() => 'components')


}, LOAD_DELAY)

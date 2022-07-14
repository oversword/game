setTimeout(() => {


GAME_SYSTEM
.define(({ dom, container_element, bind }) =>
'buttons', GAME => {

	const addButton = ({ icon, events, abovePlayField = false }, i) => {
		const button = GAME.dom.createElement("control-button")

		applyStyles(button, style.button)
		button.style.right = 10+(40*i)
		if (abovePlayField)
			applyStyles(button, style.buttonAbovePlayfield)

		GAME.bind(button, events)

		button.render = icon
		GAME.container_element.appendChild(button)
	}

	const buttonOrder = []
	const buttonProxy = new Proxy({}, {
		set: (target, prop, value, self) => {
			if (target[prop]) return false;

			addButton(value, buttonOrder.length)
			buttonOrder.push(prop)
			target[prop] = value
			return true
		}
	})

	return buttonProxy
})


}, LOAD_DELAY)

setTimeout(() => {


const MODULE = GAME => {
	GAME.onkey = {}

	GAME.modifierKeys = new ObservableProxy({
		Shift: false,
		Control: false
	}, true)

	const domCallbacks = {
		keydown: event => {
			if (event.key in GAME.modifierKeys)
				GAME.modifierKeys[event.key] = true

			if (GAME.modifierKeys.Control) {
				const key = 'Control'+event.key.toUpperCase()
				if (key in GAME.onkey) {
					event.preventDefault()
					GAME.onkey[key](event)
					return false
				}
			} else {
				const key = event.key
				const KEY = key.toUpperCase()
				if (KEY in GAME.onkey)
					GAME.onkey[KEY](event)
				else if(key in GAME.onkey)
					GAME.onkey[key](event)
			}
		},
		keyup: event => {
			if (GAME.modifierKeys[event.key] !== true) return;

			GAME.modifierKeys[event.key] = false
		}
	}
	let paused = false
	GAME.bind(GAME.dom, domCallbacks)
	GAME.pausekeybindings = () => {
		if (paused) return;
		paused = true
		GAME.unbind(GAME.dom, domCallbacks)
	}
	GAME.resumekeybindings = () => {
		if (!paused) return;
		paused = false
		GAME.bind(GAME.dom, domCallbacks)
	}
}

INTERFACE_SYSTEM
.define(({ dom, bind, unbind }) =>
'keybindings', MODULE)

GAME_SYSTEM
.define(({ dom, bind, unbind }) =>
'keybindings', MODULE)
.define(({
	dom,
	component_data, component_definitions,
	bind, unbind, field_state
}) =>
'fieldinputs', GAME => {
	const fieldInputs = {}

	GAME.component_data.watch(['initialdata','afterupdate'], ({ events }) => {
		events.forEach(event => {
			({
				create(id, component) {
					const componentDefinition = GAME.component_definitions[component.component]
					if (componentDefinition.input) {
						fieldInputs[id] = true
					}
				},
				update(id, component) {},
				delete(id, component) {
					delete fieldInputs[id]
				}
			})[event.type](event.key, event.value)
		})
	})


	const domCallbacks = {
		keydown: event => {
			if (event.defaultPrevented) return;
			Object.keys(fieldInputs).forEach(id => {
				const component = GAME.component_data.get[id]
				const element = component.element
				const properties = {...component.properties}
				if (properties.source !== "keyboard")
					return
				if (properties.which !== event.code)
					return
				GAME.field_state[id] = true
			})
		},
		keyup: event => {
			if (event.defaultPrevented) return;
			Object.keys(fieldInputs).forEach(id => {
				const component = GAME.component_data.get[id]
				const element = component.element
				const properties = {...component.properties}
				if (properties.source !== "keyboard")
					return
				if (properties.which !== event.code)
					return
				GAME.field_state[id] = false
			})
		}
	}

	let paused = false
	GAME.bind(GAME.dom, domCallbacks)
	GAME.pausefieldinputs = () => {
		if (paused) return;
		paused = true
		GAME.unbind(GAME.dom, domCallbacks)
	}
	GAME.resumefieldinputs = () => {
		if (!paused) return;
		paused = false
		GAME.bind(GAME.dom, domCallbacks)
	}
})


}, LOAD_DELAY)

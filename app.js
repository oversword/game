const GAME_SYSTEM = new FeatureSystem()

const LOAD_DELAY = 100

setTimeout(() => {

// GAME_SYSTEM.
GAME_SYSTEM.define(() => 'setup', GAME => {
	GAME.bulkOperations = {}
	GAME.render = {}
})
GAME_SYSTEM.define(() => 'component_definitions', GAME => {
	return new ObservableProxy({})
})
GAME_SYSTEM.define(() => 'data', GAME => {
	return new DataStore()
})
GAME_SYSTEM.define(({ dom }) => 'container_element', GAME => {
	const app = GAME.dom.createElement('app')
	applyStyles(app, {
		width: '100%',
		height: '100%',
		top: 0,
		left: 0
	})
	GAME.dom.body.appendChild(app)
	return app
})
GAME_SYSTEM.define(({ on }) => 'DOM_events', GAME => {
	GAME.on(document, {
		contextmenu: event => {
			event.preventDefault()
		}
	})
})

GAME_SYSTEM.define(({ onkey, data }) => 'undo_redo', GAME => {
	GAME.onkey.ControlZ = () => {
		GAME.data.undoit()
	}
	GAME.onkey.ControlY = () => {
		GAME.data.redoit()
	}
})


}, LOAD_DELAY)

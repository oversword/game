
INTERFACE_SYSTEM
.define(({
	filecontext,
	onkey,
	on,
	container_element
}) =>
'context_operations', FACE => {
	const mousePosition = {
		x: 0,
		y: 0
	}

	FACE.on(FACE.container_element, {
		mousemove: event => {
			mousePosition.x = event.x
			mousePosition.y = event.y
		}
	})

	let copyData = false
	FACE.onkey.ControlC = () => {
		const { app } = FACE.filecontext.activeContext
		copyData = app.bulkOperations.serialize(app.selection.currentSelection)
		console.log('Copy', copyData)
	}
	FACE.onkey.ControlV = () => {
		if (!copyData) return;

		const { app, canvas } = FACE.filecontext.activeContext

		const parentPos = canvas.getBoundingClientRect()
		app.bulkOperations.add(copyData, {
			x: mousePosition.x - parentPos.x,
			y: mousePosition.y - parentPos.y
		})
	}
	FACE.onkey.ControlX = () => {
		const { app } = FACE.filecontext.activeContext
		const selection = app.selection.currentSelection
		copyData = app.bulkOperations.serialize(selection)
		app.bulkOperations.remove(selection)
	}


	FACE.onkey.ControlO = event => {
		const { path, type } = FACE.filecontext.activeContext

		const browser = FACE.store.selectFile({ path: path || `${type}s` })
		browser.then(selection => {
			const fileName = selection[0]
			browser.close()
			return FACE.filecontext.add({ path: fileName })
		})
		.then(id => {
			FACE.filecontext.activeContext = id
		})
		return false
	}
	FACE.onkey.ControlS = event => {
		const { path, type, name, app } = FACE.filecontext.activeContext

		const data = app.bulkOperations.current_data()
		const browser = FACE.store.saveFile({
			path: path || `${type}s`,
			selection: name
		})
		browser.then(selection => {
			const fileName = selection[0]
			FACE.store.save({
				path: fileName,
				data: data.data,
				type: `game-${data.type}`
			})
			browser.close()
		})
		return false
	}
})

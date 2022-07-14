setTimeout(() => {


GAME_SYSTEM
.define(({ bulkOperations, component_data }) =>
'remove_operation', GAME => {
	GAME.bulkOperations.remove = selection => {
		selection.components.forEach(id => {
			delete GAME.component_data.rec[id]
		})
	}
})
.define(({ bulkOperations, selection, onkey, render, buttons }) =>
'remove_interface', GAME => {
	const removeSelection = () =>
		GAME.bulkOperations.remove(GAME.selection.currentSelection)

	GAME.onkey.Delete = removeSelection

	GAME.render.deleteButton = function (context) {
		const { y, x, width: w, height: h } = this.getBoundingClientRect()

		context.beginPath()
		context.moveTo(x, y)
		context.lineTo(x+w, y+h)
		context.moveTo(x+w, y)
		context.lineTo(x, y+h)
		context.stroke()
	}


	GAME.buttons.delete = {
		icon: GAME.render.deleteButton,
		events: { click: removeSelection }
	}
})


}, LOAD_DELAY)

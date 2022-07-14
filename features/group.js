setTimeout(() => {


GAME_SYSTEM
.define(({
	dom,
	component_data, component_definitions, group_data,
	field_element
}) =>
'group_view', GAME => {
	const boundingBox = components => {
		let minX = Infinity
		let minY = Infinity
		let maxX = -Infinity
		let maxY = -Infinity

		components.forEach(id => {
			const component = GAME.component_data.get[id]
			const  { x, y } = component.pos
			const { width: w, height: h } = (GAME.component_definitions[component.component].getSize || getDefaultSize)(component)

			minX = Math.min(x, minX)
			minY = Math.min(y, minY)
			maxX = Math.max(x+w, maxX)
			maxY = Math.max(y+h, maxY)
		})

		return {
			x: minX,
			y: minY,
			w: maxX - minX,
			h: maxY - minY
		}
	}
	const updateGroupSize = id => {
		const group = GAME.group_data.get[id]
		if (!group) return;
		const box = boundingBox(Object.keys(group.components))

		applyStyles(group.element, {
			left: box.x-10,
			top: box.y-10,
			width: box.w+20,
			height: box.h+20,
		})
	}

	GAME.group_data.watch(['initialdata','afterupdate'], ({ events }) => {
		events.forEach(event => {
			({
				create(id, group) {

					const element = GAME.dom.createElement("group")
					element.id = `group_${id}`
					element.group_id = id

					group.element = element

					applyStyles(element, style.group)
					GAME.field_element.appendChild(element)

					updateGroupSize(id)
					group.components(['create','delete'], () => {
						updateGroupSize(id)
					})
				},
				update(id, group) {},
				delete(id, group) {
					group.element.remove()
				}
			})[event.type](event.key, event.value)
		})
	})

	GAME.component_data.watch(['initialdata','afterupdate'], ({ events }) => {
		events.forEach(event => {
			({
				create(id, component) {
					component.pos('update', () => {
						if (component.group) {
							updateGroupSize(component.group)
						}
					})
				},
				update(id, component) {},
				delete(id, component) {}
			})[event.type](event.key, event.value)
		})
	})
})

GAME_SYSTEM
.define(({
	component_data, group_data,
	 bulkOperations
 }) =>
'group_operation', GAME => {
	GAME.bulkOperations.group = selection => {

		const selectedElements = selection.components.map(id => GAME.component_data.get[id])
		const existingGroup = selectedElements.find(element => element.group)
		if (existingGroup) {
			const groupId = existingGroup.group
			const allSameGroup = selectedElements.every(element => element.group === groupId)
			if (allSameGroup) {
				selectedElements.forEach(({ id }) => {
					GAME.component_data.rec[id].group = null
				})
				return
			}
			selectedElements.forEach(({ id }) => {
				GAME.component_data.rec[id].group = groupId
			})
			return
		}

		const { id: groupId } = GAME.group_data.rec()
		selectedElements.forEach(({ id }) => {
			GAME.component_data.rec[id].group = groupId
		})
	}
})
.define(({
	onkey,
	render, buttons, bulkOperations, selection
}) =>
'group_interface', GAME => {

	const groupSelection = () => {
		GAME.bulkOperations.group(GAME.selection.currentSelection)
	}

	GAME.onkey.ControlG = groupSelection

	GAME.render.groupButton = function (context) {
		const { y, x, width: w, height: h } = this.getBoundingClientRect()

		context.beginPath()
		context.arc(x+(w/2), y+(h/2), w/2, 0, Math.PI*2)
		context.stroke()
		context.beginPath()
		context.arc(x+(w/2), y+(h/4), w/8, 0, Math.PI*2)
		context.stroke()
		context.beginPath()
		context.arc(x+(w/4), y+(2.5*h/4), w/8, 0, Math.PI*2)
		context.stroke()
		context.beginPath()
		context.arc(x+(3*w/4), y+(2.5*h/4), w/8, 0, Math.PI*2)
		context.stroke()
	}

	GAME.buttons.group = {
		icon: GAME.render.groupButton,
		events: {
			click: groupSelection
		}
	}

})


}, LOAD_DELAY)

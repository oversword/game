setTimeout(() => {


GAME_SYSTEM
.define(({
	dom,
	on, bind, unbind,
	component_data,
	interaction, modifierKeys,
	component_selection, container_element,
	group_selection
}) =>
'select_interaction', GAME => GAME.interaction.define("select", {
	start(config) {
		const {
			id,
			start
		} = config

		const combineSelection = ( mode, activeSelection ) => {
			const combinedSelection = { ...GAME.component_selection }
			Object.entries(activeSelection).forEach(([ id, selected ]) => {
				if (mode === "reverse") {
					if (selected) combinedSelection[id] = !combinedSelection[id]
				} else
				if (mode === "add") {
					if (selected) combinedSelection[id] = true
				} else
				if (mode === "remove") {
					if (selected) combinedSelection[id] = false
				} else
				if (mode === "fresh") {
					combinedSelection[id] = selected
				}
			})
			return combinedSelection
		}

		const endInteraction = () => {
			GAME.interaction.stop(id)
		}
		const activeSelection = {}

		Object.keys(GAME.group_selection).forEach(id => {
			GAME.group_selection[id] = false
		})
		const updateSelection = () => {
			Object.entries(combineSelection(config.mode, activeSelection))
				.forEach(([id, selected]) => {
					applyStyles(GAME.component_data.get[id].element,
						selected ? style.selected : style.notSelected)
				})
		}
		const updateMode = () => {
			if (GAME.modifierKeys.Shift && GAME.modifierKeys.Control)
				config.mode = "reverse"
			else
			if (GAME.modifierKeys.Shift)
				config.mode = "add"
			else
			if (GAME.modifierKeys.Control)
				config.mode = "remove"
			else
				config.mode = "fresh"
			updateSelection()
		}

		Object.keys(GAME.component_data.get)
			.forEach(component_id => {
				activeSelection[component_id] = false
			})

		updateMode()

		const callbacks = {
			mouseup: event => {
				endInteraction()
			},
			mousemove: event => {
				const normalBox = normalizeBox(start, event)

				applyStyles(selectionEl, {
					left: normalBox.x,
					top: normalBox.y,
					width: normalBox.w,
					height: normalBox.h,
				})

				Object.values(GAME.component_data.get)
					.forEach(({ id, element }) => {
						const selected = elementsOverlap(
							element,
							selectionEl,
							0.5
						)
						activeSelection[id] = selected
					})

				updateSelection()
			},
		}

		const selectionEl = GAME.dom.createElement("selection")
		applyStyles(selectionEl, style.selection)
		applyStyles(selectionEl, {
			top: config.start.x,
			left: config.start.y
		})

		GAME.container_element.appendChild(selectionEl)
		GAME.bind(GAME.container_element, callbacks)
		GAME.modifierKeys("update", updateMode)
		return () => {
			Object.entries(combineSelection(config.mode, activeSelection))
				.forEach(([id, selected]) => {
					GAME.component_selection[id] = selected
				})
			selectionEl.remove()
			GAME.unbind(GAME.container_element, callbacks)
			GAME.modifierKeys("unbind", "update", updateMode)
		}
	}
}))

GAME_SYSTEM
.define(({
	on, modifierKeys,
	component_data, connection_data, group_data,
	connection_index,
}, { field_opacity, group_selection }) =>
'component_selection', GAME => {
	const selection = new ObservableProxy({})
	selection("set", ({ success, key: id, value: selected }) => {
		if (!success) return

		const component = GAME.component_data.get[id]
		const el = component.element

		applyStyles(el,
			selected ? style.selected : style.notSelected)

		if (selected || (component.group && GAME.group_selection[component.group]))
			el.style.opacity = 1
		else
			el.style.opacity = GAME.field_opacity
	})
	selection("afterupdate", () => {
		const selectedGroups = Object.entries(GAME.group_selection)
			.filter(([ , selected ]) => selected)
			.map(([ id ]) => id)
			.map(id => Object.keys(GAME.group_data.get[id].components))
		const selectedComponentIds = Object.entries(selection)
			.filter(([ , selected ]) => selected)
			.map(([ id ]) => id)

		const allComponentIds = selectedComponentIds
			.concat(...selectedGroups)
			.filter(unique)

		Object.entries(GAME.connection_index.signal.forward).concat(Object.entries(GAME.connection_index.target.forward))
			.forEach(([ id, cons ]) => {
				Object.entries(cons)
					.forEach(([ otherId, connectionId ]) => {
						// console.log(connectionId)
						const el = GAME.connection_data.get[connectionId].element
						if (allComponentIds.includes(id) && allComponentIds.includes(otherId))
							el.style.opacity = 1
						else el.style.opacity = GAME.field_opacity
					})
			})
	})

	GAME.component_data.watch('delete', ({ key: id }) => {
		delete selection[id]
	})

	GAME.on('field > field-component', {
		mousedown: function (event) {
			if (selection[this.component_id]) return;
			if (GAME.modifierKeys.Shift)
				selection[this.component_id] = true
			else if (GAME.modifierKeys.Control)
				selection[this.component_id] = false
			else {
				Object.keys(selection).forEach(id => {
					selection[id] = false
				})
				selection[this.component_id] = true
			}
		},
		click: function (event) {
			if (GAME.modifierKeys.Shift)
				selection[this.component_id] = true
			else if (GAME.modifierKeys.Control)
				selection[this.component_id] = false
			else {
				Object.keys(selection).forEach(id => {
					selection[id] = false
				})
				selection[this.component_id] = true
			}
		}
	})

	return selection
})

GAME_SYSTEM
.define(({
	on, modifierKeys,
	component_data, connection_data, group_data,
	connection_index
}, { field_opacity, component_selection }) =>
'group_selection', GAME => {


	const groupSelection = new ObservableProxy({})
	groupSelection("set", ({ success, key: id, value: selected }) => {
		if (!success) return

		const group = GAME.group_data.get[id]
		applyStyles(group.element,
			selected ? style.selected : style.notSelected)

		if (selected) {
			group.element.style.opacity = 1
			Object.keys(group.components).forEach(componentId => {
				GAME.component_data.get[componentId].element.style.opacity = 1
			})
		} else {
			group.element.style.opacity = GAME.field_opacity
			Object.keys(group.components).forEach(componentId => {
				if (!GAME.component_selection[componentId])
					GAME.component_data.get[componentId].element.style.opacity = GAME.field_opacity
			})
		}
	})
	groupSelection("afterupdate", () => {
		const selectedGroups = Object.entries(groupSelection)
			.filter(([ , selected ]) => selected)
			.map(([ id ]) => id)
			.map(id => Object.keys(GAME.group_data.get[id].components))
		const selectedComponentIds = Object.entries(GAME.component_selection)
			.filter(([ , selected ]) => selected)
			.map(([ id ]) => id)

		const allComponentIds = selectedComponentIds
			.concat(...selectedGroups)
			.filter(unique)

		Object.entries(GAME.connection_index.signal.forward).concat(Object.entries(GAME.connection_index.target.forward))
			.forEach(([ id, cons ]) => {
				Object.entries(cons)
					.forEach(([ otherId, connectionId ]) => {
						const connectionElement = GAME.connection_data.get[connectionId].element
						if (allComponentIds.includes(id) && allComponentIds.includes(otherId))
							connectionElement.style.opacity = 1
						else connectionElement.style.opacity = GAME.field_opacity
					})
			})
	})


	GAME.on('field > group', {
		click: function (event) {
			if (GAME.modifierKeys.Shift)
				groupSelection[this.group_id] = true
			else if (GAME.modifierKeys.Control)
				groupSelection[this.group_id] = false
			else {
				Object.keys(groupSelection).forEach(id => {
					groupSelection[id] = false
				})
				groupSelection[this.group_id] = true
			}
		}
	})


	GAME.group_data.watch('delete', ({ key: id }) => {
		delete groupSelection[id]
	})

	return groupSelection
})

GAME_SYSTEM
.define(({
	on, select_interaction,
	group_selection, component_selection, container_element,
	component_data, connection_data, group_data,
	field_element,
}) =>
'selection', GAME => {

	GAME.on(GAME.container_element, {
		mousedown: event => {
			if (event.target !== GAME.field_element) return;

			GAME.select_interaction.start(config => {
				Object.assign(config, {
					start: {
						x: event.x,
						y: event.y,
					},
				})
			})
		}
	})

	return {
		get allData() {
			return {
				components: Object.keys(GAME.component_data.get),
				groups: Object.values(GAME.group_data.get)
					.map(({ components }) => Object.keys(components))
			}
		},
		get currentSelection() {
			const selectedGroups = this.groupComponents
			const selectedComponentIds = this.components

			const allComponentIds = selectedComponentIds
				.concat(...selectedGroups)
				.filter(unique)

			return {
				groups: selectedGroups,
				components: allComponentIds
			}
		},
		get components() {
			return Object.entries(GAME.component_selection)
				.filter(([ , selected ]) => selected)
				.map(([ id ]) => id)
		},
		get groups() {
			return Object.entries(GAME.group_selection)
				.filter(([ , selected ]) => selected)
				.map(([ id ]) => id)
		},
		get groupComponents() {
			return this.groups.map(id =>
				Object.keys(GAME.group_data.get[id].components))
		},
		includes(id) {
			if (!id) return false
			const groupId = GAME.component_data.get[id].group
			return GAME.component_selection[id] || GAME.selection.includesGroup(groupId)
		},
		includesComponent(id) {
			if (!id) return false
			if (GAME.component_selection[id]) return true
			const groupId = GAME.component_data.get[id].group
			return this.includesGroup(groupId)
		},
		includesGroup(groupId) {
			return groupId && GAME.group_selection[groupId]
		},
		includesConnection(connectionId) {
			const connection = GAME.connection_data.get[connectionId]
			return this.includesComponent(connection.originId) && this.includesComponent(connection.targetId)
		},
		includesElement(element) {
			switch (element.tagName) {
				case "GROUP":
					return this.includesGroup(element.group_id)
				case "FIELD-COMPONENT":
					return this.includesComponent(element.component_id)
				case "FIELD-CONNECTION":
					return this.includesConnection(element.connection_id)
				default:
					return false
			}
		}
	}
})


}, LOAD_DELAY)

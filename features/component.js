setTimeout(() => {


GAME_SYSTEM
.define(({
	dom,
	component_data, component_definitions,
	field_element
 }) =>
'component_view', GAME => {
	GAME.component_data.watch(['initialdata','afterupdate'], ({ events }) => {
		events.forEach(event => {
			({
				create(id, component) {
					const fieldComponent = GAME.dom.createElement("field-component")

					fieldComponent.id = `field-component_${id}`
					fieldComponent.component_id = id
					applyStyles(fieldComponent, style.fieldComponent)
					GAME.field_element.appendChild(fieldComponent)

					const componentDefinition = GAME.component_definitions[component.component]

					applyStyles(fieldComponent, {
						left: component.pos.x,
						top: component.pos.y
					})
					component.pos('update', () => {
						applyStyles(fieldComponent, {
							left: component.pos.x,
							top: component.pos.y
						})
					})
					if (componentDefinition.getSize instanceof Function) {
						Object.assign(fieldComponent.style, componentDefinition.getSize(component))
						component.properties('update', () => {
							Object.assign(fieldComponent.style, componentDefinition.getSize(component))
						})
					}
					if (componentDefinition.getRenderHelpers instanceof Function) {
						Object.assign(fieldComponent.renderHelpers, componentDefinition.getRenderHelpers(component))
						component.properties('update', () => {
							Object.assign(fieldComponent.renderHelpers, componentDefinition.getRenderHelpers(component))
						})
					}
					component.element = fieldComponent
					fieldComponent.render = componentDefinition.icon
				},
				update(id, component) {},
				delete(id, component) {
					component.element.remove()
				}
			})[event.type](event.key, event.value)
		})
	})
})


}, LOAD_DELAY)

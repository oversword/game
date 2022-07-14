setTimeout(() => {


GAME_SYSTEM
.define(({ data }) =>
'group_data', GAME => GAME.data.define('group', {
	add: {
		check({ id }){
			if (id && this.data[id])
				return `Group with this ID already exists`
		},
		atom({ id }) {
			id = this.id(id)

			this.data[id] = {
				id,
				components: new ObservableProxy({})
			}
			return {
				action: 'remove',
				args: { id }
			}
		},
		// compound(){},
	},
	remove: {
		// check(){},
		atom({ id }) {
			const group = this.data[id]
			delete this.data[id]

			return {
				action: 'add',
				args: { id }
			}
		},
		compound({ id }) {
			const group = this.data[id]

			Object.keys(group.components)
				.forEach(componentId => {
					this.Do.group.removeComponent({ id, componentId }, true)
				})
		},
	},
	addComponent: {
		check({ componentId, id }){
			if (!this.data[id])
				return `This group does not exist on the field`
			if (!this.get('component', componentId))
				return `The component to be added to the group does not exist`
		},
		atom({ id, componentId }) {
			const group = this.data[id]
			group.components[componentId] = true

			const component = this.get('component', componentId)
			component.group = id

			return {
				action: 'removeComponent',
				args: { componentId, id }
			}
		},
		// compound(){},
	},
	removeComponent: {
		check({ id, componentId }){
			if (!this.data[id])
				return `This group does not exist on the field`
			if (!this.get('component', componentId))
				return `The component to be added to the group does not exist`
		},
		atom({ id, componentId }) {
			delete this.data[id].components[componentId]

			const component = this.get('component', componentId)
			delete component.group

			return {
				action: 'addComponent',
				args: { id, componentId }
			}
		},
		compound({ id, componentId }) {
			this.Do.group.removeComponent({ id, componentId }, true)
			if (Object.keys(this.data[id].components).length === 1)
				this.Do.group.remove({ id }, true)
		},
	},
}, {
	add(group = {}) {
		return this.group.add(group)
	},
	del(id) {
		return this.group.remove({ id })
	},
}))


}, LOAD_DELAY)




INTERFACE_SYSTEM
.define(({
	tabs,
	store,
	dom,
}) =>
'filecontext', FACE => {
	let _context_id = 1
	const contexts = {}

	FACE.tabs.canclose = (index, tab) => {
		// TODO: Check for unsaved changes?
		console.log(index,tab)
		return true//false
	}

	const activeContexts = {}

	return {
		get activeContext() {
			return activeContexts[FACE.tabs.selected.id]
		},
		set activeContext(id) {
			FACE.tabs.selected = id
		},
		async add({ path }) {
			const pathParts = path.split('/')
			const name = pathParts.slice(-1)[0]
			const parDir = pathParts.slice(0, -1).join('/')

			let context = Object.values(activeContexts).find(context =>
				context.path === parDir && context.name === name)
			if (!context) {
				const data = FACE.store.get({ path })
				const constructor = contexts[data.type]
				if (!constructor)
					throw new Error(`No context for '${data.type}' is registered`)
				context = {
					...(await constructor()),
					name,
					path: parDir,
					type: data.type,
				}
				context.app.bulkOperations.load_data({
					type: data.type,
					data: data.data
				})
				FACE.tabs.add({
					id: context.id,
					label: name,
					domContent: context.canvas,
					icon: `icon-${data.type}`
				})

				activeContexts[context.id] = context
			}
			return context.id
		},
		register(type, call) {
			if (type in contexts)
				throw new Error(`Context for '${type}' already registered`)

			contexts[type] = () => new Promise((resolve, reject) => {
				const context_id = `${_context_id++}`
				const canvas = FACE.dom.createElement('canvas')
				const context = {
					id: context_id,
					canvas,
				}
				call(context, app => resolve({
					...context,
					app
				}))
			})

			return contexts[type]
		}
	}

})

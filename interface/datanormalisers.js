
INTERFACE_SYSTEM
.define(({  }) =>
'data_normalisers', GAME => {

	const level_normalisers = {
		'0': data => {
			const component_indexes = Object.keys(data.components)

			const connections = [].concat(...Object.entries(data.connections)
				.map(([ origin, targets ]) => targets.map(target => [
					component_indexes.indexOf(origin.toString()),
					component_indexes.indexOf(target.toString()),
					'signal'
				])))
				.concat(...Object.values(data.components).map((component, i) =>
					((component.p || {}).targets || []).map(target =>
						[ i, component_indexes.indexOf(target.toString()), 'target' ])))

			const groups = Object.values(data.groups).map(group =>
				group.map(id => component_indexes.indexOf(id.toString())))


			return {
				components: Object.values(data.components).map(component => {
					const { targets, x, y, ...p } = (component.p || {})
					return {
						...component,
						...((component.p && ('x' in component.p)) ? {x,y} : {}),
						p
					}
				}),
				connections,
				groups,
			}
		},
		'test.1': data => {
			const component_indexes = Object.keys(data.components)

			const connections = [].concat(...Object.entries(data.connections).map(([ type, cons ]) => {
				return [].concat(...Object.entries(cons).map(([ id, oids ]) => oids.map(oid => [
					component_indexes.indexOf(id.toString()),
					component_indexes.indexOf(oid.toString()),
					type
				])))
			}))

			const groups = Object.values(data.groups).map(group =>
				group.map(id => component_indexes.indexOf(id.toString())))

			return {
				components: Object.values(data.components).map(component => {
					const { targets, x, y, ...p } = (component.p || {})
					return {
						...component,
						...((component.p && ('x' in component.p)) ? {x,y} : {}),
						p
					}
				}),
				connections,
				groups,
			}
		},
		'0.0.1': data => data
	}

	const combination_normalisers = {
		'0.0.1': data => data
	}

	const component_normalisers = {
		'0.0.1': data => data
	}


	return {
		level: data => {
			const normaliser = level_normalisers[data.fileversion || '0']

			if (! normaliser)
				throw new Error(`Game level file version not supported: '${data.fileversion}'`)

			return normaliser(data)
		},
		combination: data => {
			const normaliser = combination_normalisers[data.fileversion || '0.0.1']

			if (! normaliser)
				throw new Error(`Game combination file version not supported: '${data.fileversion}'`)

			return normaliser(data)
		},
		component: data => {
			const normaliser = component_normalisers[data.fileversion || '0.0.1']

			if (! normaliser)
				throw new Error(`Game component file version not supported: '${data.fileversion}'`)

			return normaliser(data)
		},
	}
})

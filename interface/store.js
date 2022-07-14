setTimeout(() => {


INTERFACE_SYSTEM
// .after('components', 'data_operations')
.define(({ data_normalisers }) =>
'store', FACE => {

	const file_system = window.fs

	file_system.save({ path: 'levels' })
	file_system.save({ path: 'combinations' })

	file_system.register({ name: 'game-level', constructor: data => ({
		type: 'level',
		data: FACE.data_normalisers.level(data)
	})})
	file_system.register({ name: 'game-combination', constructor: data => ({
		type: 'combination',
		data: FACE.data_normalisers.combination(data)
	})})
	file_system.register({ name: 'game-component', constructor: data => ({
		type: 'component',
		data: FACE.data_normalisers.component(data)
	})})

	return file_system
})


}, LOAD_DELAY)

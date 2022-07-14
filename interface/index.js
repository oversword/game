const INTERFACE_SYSTEM = new FeatureSystem()

INTERFACE_SYSTEM
.define(({ }) => 'app_setup', FACE => {
	FACE.dom = document
	FACE.container_element = document.body
})
.create(({
	htma,
	filecontext,
	tabs,
	test_data,
	data_normalisers,
	store,
	system_data,
	keybindings,
	events,
	app_setup,
	context_operations
}) => 'interface', FACE => {
	Promise.all([
		FACE.filecontext.add({ path: '/levels/examples/true plat' }),
		FACE.filecontext.add({ path: '/levels/examples/test-bed' }),
		FACE.filecontext.add({ path: '/combinations/examples/Platform Combination' })
	]).then(results => {
		FACE.filecontext.activeContext = results[0]
	})
})

setTimeout(() => {


GAME_SYSTEM.define(() => 'interaction', GAME => {
	const interaction = new InteractionState()
	interaction.prevents(InteractionState.ALL, InteractionState.PREVENTS_ALL)
	return interaction
})


}, LOAD_DELAY)

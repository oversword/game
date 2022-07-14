setTimeout(() => {


GAME_SYSTEM
.define(({ component_definitions, render }) =>
'logic_components', GAME => {

	GAME.render.component_on = function (context) {
		const { y, x, width: w, height: h } = this.getBoundingClientRect()

		context.beginPath()
		context.arc(x+(w/4), y+(h/2), h/4, 0, Math.PI*2)
		context.stroke()
		context.beginPath()
		context.moveTo(x+(w/2), y+(h/2))
		context.lineTo(x+w, y+(h/2))
		context.stroke()
	}
	GAME.render.component_gate = {
		not(context) {
			const { y, x, width: w, height: h } = this.getBoundingClientRect()

			context.beginPath()
			context.moveTo(x+(3*w/4), y+(h/2))
			context.lineTo(x, y+h)
			context.lineTo(x, y)
			context.arc(x+(7*w/8), y+(h/2), w/8, Math.PI, 3*Math.PI)
			context.stroke()
		},
		and(context) {
			const { y, x, width: w, height: h } = this.getBoundingClientRect()

			context.beginPath()
			context.moveTo(x, y)
			context.lineTo(x, y+h)
			context.lineTo(x+(w/2), y+h)
			context.arc(x+(w/2), y+(h/2), h/2, Math.PI/2,3*Math.PI/2, true)
			context.closePath()
			context.stroke()
		},
		or(context) {
			const { y, x, width: w, height: h } = this.getBoundingClientRect()

			context.beginPath()
			context.moveTo(x, y)
			context.quadraticCurveTo(
				x+(w/4), y+(h/2),
				x, y+h
			)
			context.lineTo(
				x+(w/4), y+h
			)
			context.quadraticCurveTo(
				x+(3*w/4), y+h,
				x+w, y+(h/2)
			)
			context.quadraticCurveTo(
				x+(3*w/4), y,
				x+(w/4), y
			)
			context.closePath()
			context.stroke()
		},
		xor(context) {
			const { y, x, width: w, height: h } = this.getBoundingClientRect()

			context.beginPath()
			context.moveTo(x+(3*w/40), y)
			context.quadraticCurveTo(
				x+(13*w/40), y+(h/2),
				x+(3*w/40), y+h
			)
			context.lineTo(
				x+(w/4), y+h
			)
			context.quadraticCurveTo(
				x+(3*w/4), y+h,
				x+w, y+(h/2)
			)
			context.quadraticCurveTo(
				x+(3*w/4), y,
				x+(w/4), y
			)
			context.closePath()
			context.moveTo(x, y)
			context.quadraticCurveTo(
				x+(w/4), y+(h/2),
				x, y+h
			)
			// context.moveTo(x, y+5)
			// context.quadraticCurveTo(x+6, y+(size/2), x, y+35)
			context.stroke()
		}
	}


	const logic = {
		and: inputs => Boolean(inputs.length) && inputs.every(truthy),
		or: inputs => inputs.some(truthy),
		xor: inputs => {
			const i = inputs.findIndex(truthy)
			if (i === -1) return false
			return !inputs.slice(i+1).some(truthy)
		},
		not: inputs => !inputs[0],
		on: () => true
	}

	const iconRender = lines => function (context) {

		const { y, x, width: w, height: h } = this.getBoundingClientRect()

		const renderXScale = w / 100
		const renderYScale = h / 100

		context.beginPath()
		lines.forEach(line => {
			if (line.c && line.r) {
				context.stroke()
				context.beginPath()
				context.arc(
					x + (line.c[0] * renderXScale),
					y + (line.c[1] * renderYScale),
					line.r * Math.max(renderYScale, renderXScale),
					0,
					Math.PI*2
				)
				context.stroke()
				context.beginPath()
				return;
			}
			context.moveTo(
				x + (line.s[0] * renderXScale),
				y + (line.s[1] * renderYScale)
			)
			if (line.r) {
				context.arcTo(
					x + (line.c1[0] * renderXScale),
					y + (line.c1[1] * renderYScale),
					x + (line.e [0] * renderXScale),
					y + (line.e [1] * renderYScale),
					line.r * Math.max(renderYScale, renderXScale),
				)
			}
			else if (line.c2)
				context.bezierCurveTo(
					x + (line.c1[0] * renderXScale),
					y + (line.c1[1] * renderYScale),
					x + (line.c2[0] * renderXScale),
					y + (line.c2[1] * renderYScale),
					x + (line.e [0] * renderXScale),
					y + (line.e [1] * renderYScale)
				)
			else if (line.c1)
				context.quadraticCurveTo(
					x + (line.c1[0] * renderXScale),
					y + (line.c1[1] * renderYScale),
					x + (line.e [0] * renderXScale),
					y + (line.e [1] * renderYScale)
				)
			else if (line.e)
				context.lineTo(
					x + (line.e[0] * renderXScale),
					y + (line.e[1] * renderYScale)
				)
		})
		context.stroke()
	}

	const logicExec = code =>
		new Function('inputs', code)

	const components = [
		{
			name: "on",
			icon: [
				{c:[25,50],r:25},
				{s:[50,50],e:[100,50]}
			],

			signalMaxInputs: 0,

			logic: "return true",
		},
		{
			name: "not gate",
			icon: [
				{s:[75,50],e:[0,100]},
				{s:[0,100],e:[0,0]},
				{s:[0,0],e:[75,50]},
				{c:[85,50],r:13},
			],

			signalMaxInputs: 1,

			logic: "return !inputs[0]",
		},
		{
			name: "and gate",
			icon: [
				{s:[0,0],e:[0,100]},
				{s:[0,100],e:[50,100]},
				{s:[50,100],e:[50,0],c1:[9999,50],r:50},
				{s:[50,0],e:[0,0]},
			],

			logic: "return Boolean(inputs.length) && inputs.every(a=>Boolean(a))",
		},
		{
			name: "or gate",
			icon: [
				{s:[0,0],e:[0,100],c1:[25,50]},
				{s:[0,100],e:[25,100]},
				{s:[25,100],e:[100,50],c1:[75,100]},
				{s:[100,50],e:[25,0],c1:[75,0]},
				{s:[25,0],e:[0,0]},
			],

			logic: "return inputs.some(a=>Boolean(a))",
		},
		{
			name: "xor gate",
			icon: [
				{s:[8,0],e:[8,100],c1:[33,50]},
				{s:[8,100],e:[25,100]},
				{s:[25,100],e:[100,50],c1:[75,100]},
				{s:[100,50],e:[25,0],c1:[75,0]},
				{s:[25,0],e:[8,0]},
				{s:[0,0],e:[0,100],c1:[25,50]},
			],

			logic: `
				const i = inputs.findIndex(a=>Boolean(a))
				if (i === -1) return false
				return !inputs.slice(i+1).some(a=>Boolean(a))`,
		},
	]
	components.forEach(component => {

		GAME.component_definitions[component.name] = {
			...component,
			logic: logicExec(component.logic),
			icon: component.icon instanceof Function
				? component.icon
				: iconRender(component.icon)
		}
	})



	// components.forEach(component => {
	// 	GAME.component_definitions[component.name] = component
	// })


})


}, LOAD_DELAY)

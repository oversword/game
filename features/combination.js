setTimeout(() => {


GAME_SYSTEM
.after('components')
.define(({
	component_definitions,
	component_data,
	container_element,
	field_state
 }) =>
'combination', GAME => {


	const render_combination = combination => function (context) {
		const { y, x, width: w, height: h } = this.getBoundingClientRect()
		// console.log(this,context,combination)
		const renderable = combination.structure.components.filter(component => GAME.component_definitions[component.c] && GAME.component_definitions[component.c].renders)
		const minX = Math.min(...renderable.map(component => component.x))
		const minY = Math.min(...renderable.map(component => component.y))
		const maxX = Math.max(...renderable.map(component => component.x+component.p.w))
		const maxY = Math.max(...renderable.map(component => component.y+component.p.h))
		const width = maxX - minX
		const height = maxY - minY
		const wScale = w / width
		const hScale = h / height
		renderable.forEach(component => {
			GAME.component_definitions[component.c].icon.call({
				getBoundingClientRect() {
					return {
						x: x + ((component.x-minX) * wScale),
						y: y + ((component.y-minY) * hScale),
						width: component.p.w * wScale,
						height: component.p.h * hScale,
					}
				},
				renderHelpers: GAME.component_definitions[component.c].getRenderHelpers({properties:component.p}),
			}, context)
		})
	}

	const combinations = [
		{
			name: 'rendit',
			component: {
				resizable: true,

				defaultProperties: {
					w: 40,
					h: 40,
				},

				getSize(component, scale = 1) {
					return {
						width: scale * component.properties.w,
						height: scale * component.properties.h
					}
				},
				setSize(component, newSize, scale = 1) {
					component.properties = {
						w: newSize.width / scale,
						h: newSize.height / scale
					}
				},
			},
			structure: {"groups":[],"components":[{"x":24,"y":120,"c":"on","p":{}},{"x":0,"y":113.921875,"c":"drawing","p":{"w":100.12169248365109,"h":197.13163791036234,"lines":[{"s":[0,5.066544777851647],"e":[0,197.13163791036234]},{"s":[0,197.13163791036234],"e":[100.12169248365109,197.13163791036234]},{"s":[100.12169248365109,197.13163791036234],"e":[100.12169248365109,0]},{"s":[100.12169248365109,0],"e":[0,5.066544777851647]}]}},{"x":4,"y":0,"c":"drawing","p":{"w":236.1457105297784,"h":61.29437168288783,"lines":[{"s":[0,0],"e":[0,61.29437168288783]},{"s":[0,61.29437168288783],"e":[236.1457105297784,61.29437168288783]},{"s":[236.1457105297784,61.29437168288783],"e":[236.1457105297784,2.9998178938659805]},{"s":[236.1457105297784,2.9998178938659805],"e":[0,0]}]}},{"x":192,"y":171,"c":"drawing","p":{"w":142,"h":121,"lines":[{"s":[47,0],"e":[0,103]},{"s":[0,103],"e":[100,121]},{"s":[100,121],"e":[142,90]},{"s":[142,90],"e":[139,48]},{"s":[139,48],"e":[116,26]},{"s":[116,26],"e":[73,14]},{"s":[73,14],"e":[47,0]}]}}],"connections":[[0,1,"signal"],[0,2,"signal"],[0,3,"signal"]]}
		},
		{
			name: 'gee tee',
			component:{

			},
			structure: {"groups":[],"components":[
				{"x":0,"y":40,"c":"combination_signal_input","p":{}},
				{"x":266,"y":59,"c":"combination_signal_output","p":{}},
				{"x":78,"y":93,"c":"xor gate","p":{}},
				{"x":83,"y":0,"c":"or gate","p":{}},
				{"x":156,"y":49,"c":"xor gate","p":{}},
				{"x":214,"y":184,"c":"drawing","p":{"w":83,"h":89,"lines":[{"s":[38,0],"e":[39,37]},{"s":[39,37],"e":[0,38]},{"s":[0,38],"e":[1,55]},{"s":[1,55],"e":[39,54]},{"s":[39,54],"e":[38,89]},{"s":[38,89],"e":[58,88]},{"s":[58,88],"e":[52,56]},{"s":[52,56],"e":[83,57]},{"s":[83,57],"e":[82,33]},{"s":[82,33],"e":[52,31]},{"s":[52,31],"e":[52,0]},{"s":[52,0],"e":[38,0]}]}},
			],"connections":[
				[0,2,"signal"],
				[0,3,"signal"],
				[2,4,"signal"],
				[3,4,"signal"],
				[4,1,"signal"],
			]},
		},


		{
			component: {
				targets: ["drawing","hitbox"],
				targetable: true,
				resizable: true,
				renders: true,

				defaultProperties: {
					w: 40,
					h: 40,
				},


				getSize(component, scale = 1) {
					return {
						width: scale * component.properties.w,
						height: scale * component.properties.h
					}
				},
				setSize(component, newSize, scale = 1) {
					component.properties = {
						w: newSize.width / scale,
						h: newSize.height / scale
					}
				},
				getRenderHelpers(component) {
					const renderHelpers = {}
					return renderHelpers
				},
			},
			"name":"platform",
			structure: {
				"groups":[
					[0,1,2,3,4,5,6,7,8]
				],
				"components":[
					{"x":223.890625,"y":252.984375,"c":"drawing","p":{"w":304.125,"h":44.046875,"lines":[{"s":[1.1049208977816534,4.011971854243143],"e":[1.1049208977816534,44.061940643244725]},{"s":[1.1049208977816534,44.061940643244725],"e":[304.1319861035021,44.061940643244725]},{"s":[304.1319861035021,44.061940643244725],"e":[304.1319861035021,5.684341886080802e-14]},{"s":[304.1319861035021,5.684341886080802e-14],"e":[0,0]},{"s":[0,0],"e":[1.1049208977816534,4.011971854243143]}],"x":221.890625,"y":362.984375}},
					{"x":233,"y":249,"c":"hitbox","p":{"w":285,"h":25,"x":233,"y":360}},
					{"x":232,"y":282,"c":"hitbox","p":{"w":287,"h":20,"x":231,"y":391}},
					{"x":220,"y":254,"c":"hitbox","p":{"w":11,"h":41,"x":218,"y":364}},
					{"x":521,"y":257,"c":"hitbox","p":{"w":11,"h":37,"x":520,"y":366}},
					{"x":393,"y":214,"c":"physics rule","p":{"angle":1.5707963267948966,"order":-1,"size":2,"x":380,"y":323}},
					{"x":432,"y":297,"c":"physics rule","p":{"angle":4.71238898038469,"order":-1,"size":2,"x":391,"y":408}},
					{"x":531,"y":256,"c":"physics rule","p":{"angle":3.141592653589793,"order":-1,"size":2,"x":525,"y":367}},
					{"x":184,"y":255,"c":"physics rule","p":{"angle":0,"order":-1,"size":2,"x":183,"y":364}},
					{"x":693,"y":146,"c":"or gate","p":{}},
					{"x":792,"y":214,"c":"physics rule","p":{"angle":1.5707963267948966,"order":-2,"size":0,"x":938,"y":318}},
					{"x":843,"y":214,"c":"physics rule","p":{"angle":1.5707963267948966,"order":-3,"size":0,"x":989,"y":317}},
					{"x":0,"y":273,"c":"combination_signal_input","p":{}},
					{"x":858,"y":321,"c":"combination_signal_output","p":{}},
					{"x":257,"y":0,"c":"combination_target_output","p":{}},
					{"x":174,"y":542,"c":"combination_target_input","p":{}},
					{"x":92,"y":266,"c":"not gate","p":{}}
				],
				"connections":[
					[1,5,"signal"],[1,9,"signal"],[2,6,"signal"],[2,10,"signal"],[3,8,"signal"],[4,7,"signal"],[9,10,"signal"],[9,11,"signal"],[9,13,"signal"],[12,16,"signal"],[16,0,"signal"],[16,1,"signal"],[16,2,"signal"],[16,3,"signal"],[16,4,"signal"],[5,14,"target"],[6,14,"target"],[7,14,"target"],[8,14,"target"],[10,14,"target"],[11,14,"target"],[15,1,"target"],[15,2,"target"],[15,3,"target"],[15,4,"target"]
				]
				// "groups":[[0,1,2,3,4,6,7,8,9,10],[5,11,12,13,14]],
				// "components":[
				// 	{"x":121.890625,"y":124.984375,"c":"drawing","p":{"x":221.890625,"y":362.984375,"w":304.125,"h":44.046875,"lines":[{"s":[1.1049208977816534,4.011971854243143],"e":[1.1049208977816534,44.061940643244725]},{"s":[1.1049208977816534,44.061940643244725],"e":[304.1319861035021,44.061940643244725]},{"s":[304.1319861035021,44.061940643244725],"e":[304.1319861035021,5.684341886080802e-14]},{"s":[304.1319861035021,5.684341886080802e-14],"e":[0,0]},{"s":[0,0],"e":[1.1049208977816534,4.011971854243143]}]}},
				// 	{"x":133,"y":122,"c":"hitbox","p":{"x":233,"y":360,"w":285,"h":25}},
				// 	{"x":131,"y":153,"c":"hitbox","p":{"x":231,"y":391,"w":287,"h":20}},
				// 	{"x":118,"y":126,"c":"hitbox","p":{"x":218,"y":364,"w":11,"h":41}},
				// 	{"x":420,"y":128,"c":"hitbox","p":{"x":520,"y":366,"w":11,"h":37}},
				// 	{"x":888,"y":13,"c":"physics rule","p":{"x":988,"y":251,"size":2,"angle":1.5707963267948966,"order":3}},
				// 	{"x":280,"y":85,"c":"physics rule","p":{"x":380,"y":323,"size":2,"angle":1.5707963267948966,"order":-1}},
				// 	{"x":0,"y":130,"c":"on"},
				// 	{"x":291,"y":170,"c":"physics rule","p":{"x":391,"y":408,"size":2,"angle":4.71238898038469,"order":-1}},
				// 	{"x":425,"y":129,"c":"physics rule","p":{"x":525,"y":367,"size":2,"angle":3.141592653589793,"order":-1}},
				// 	{"x":83,"y":126,"c":"physics rule","p":{"x":183,"y":364,"size":2,"angle":0,"order":-1}},
				// 	{"x":819,"y":0,"c":"not gate"},
				// 	{"x":739,"y":11,"c":"or gate"},
				// 	{"x":838,"y":80,"c":"physics rule","p":{"x":938,"y":318,"size":0,"angle":1.5707963267948966,"order":-2}},
				// 	{"x":889,"y":79,"c":"physics rule","p":{"x":989,"y":317,"size":0,"angle":1.5707963267948966,"order":-3}},
				// 	{x:-100,y:200,c:'combination_signal_input',p:{}},
				// 	{x:600,y:200,c:'combination_signal_output',p:{}},
				// 	{x:200,y:-100,c:'combination_target_input',p:{}},
				// 	{x:200,y:600,c:'combination_target_output',p:{}},
				// ],
				// "connections":[
				// 	[1,6,"signal"],[1,12,"signal"],[2,8,"signal"],[2,13,"signal"],[4,9,"signal"],[7,0,"signal"],[7,1,"signal"],[7,2,"signal"],[7,3,"signal"],[7,4,"signal"],[11,5,"signal"],[12,11,"signal"],[12,13,"signal"],[12,14,"signal"]
				// ]
			}
		}
	]

	combinations.forEach((combination) => {
		const connection_cache = {}
		const result_cache = {}
		const ret = {
			...combination.component,
			structure: combination.structure,
			name: combination.name,
			combination: true,

			complexLogic(id, connections) {
				if (
					connection_cache[id] &&
					Object.keys(connection_cache[id]).length === Object.keys(connections).length &&
					Object.keys(connections).every(oid => connections[oid] === connection_cache[id][oid])
				) return result_cache[id] || false

				connection_cache[id] = {...connections}
				const component = GAME.component_data.get[id]

				if (!(id in result_cache)) {
					result_cache[id] = false
					component.fieldState.state('end', ({ updates }) => {
						const endComp = Object.entries(component.fieldState.components)
							.find(([, type ]) => type === 'combination_signal_output')
						if (!endComp) return;
						const endId = endComp[0]

						if (!(endId in updates)) return;
						if (updates[endId].end === result_cache[id]) return;

						result_cache[id] = updates[endId].end
						GAME.field_state[id] = undefined
					})
				}

				Object.entries(connections).forEach(([ origin, value ]) => {
					const cid = `_INTERNAL_CONNECTION_INPUT_${origin}`
					component.fieldState.state[cid] = undefined
				})

				return result_cache[id] || false
			},
		}
		ret.icon = render_combination(ret)
		GAME.component_definitions[combination.name] = ret
	})
})


GAME_SYSTEM
.define(({ dom }) => 'sub_container_element', SUB_GAME => {
	const subEnv = SUB_GAME.dom.createElement("edit-overlay")
	applyStyles(subEnv, style.editOverlay)
	SUB_GAME.dom.body.appendChild(subEnv)
	SUB_GAME.container_element = subEnv
})
GAME_SYSTEM
.define(({ component_definitions }) => 'combination_system_components', GAME => {
	// GAME.container_element = subEnv
	GAME.component_definitions.combination_signal_input = {
		name: "combination_signal_input",
		icon: function (context) {
			const { y, x, width: w, height: h } = this.getBoundingClientRect()

			const cx = x + (w / 2)
			const cy = y + (h / 2)

			context.beginPath()
			context.arc(cx, cy, w/2, 0, Math.PI*2)
			context.stroke()
		},

		signalMaxInputs: 0,

		logic: () => false,
	}
	GAME.component_definitions.combination_signal_output = {
		name: "combination_signal_output",
		icon: function (context) {
			const { y, x, width: w, height: h } = this.getBoundingClientRect()

			const cx = x + (w / 2)
			const cy = y + (h / 2)

			context.beginPath()
			context.arc(cx, cy, w/2, 0, Math.PI*2)
			context.stroke()
		},

		signalMaxOutputs: 0,

		logic: () => false,
	}
	GAME.component_definitions.combination_target_input = {
		name: "combination_target_input",
		icon: function (context) {
			const { y, x, width: w, height: h } = this.getBoundingClientRect()

			const cx = x + (w / 2)
			const cy = y + (h / 2)

			context.beginPath()
			context.arc(cx, cy, w/2, 0, Math.PI*2)
			context.stroke()
		},

		targets: true,

		signalMaxInputs: 0,
		signalMaxOutputs: 0,

		logic: () => false,
	}
	GAME.component_definitions.combination_target_output = {
		name: "combination_target_output",
		icon: function (context) {
			const { y, x, width: w, height: h } = this.getBoundingClientRect()

			const cx = x + (w / 2)
			const cy = y + (h / 2)

			context.beginPath()
			context.arc(cx, cy, w/2, 0, Math.PI*2)
			context.stroke()
		},


		targetable: true,

		signalMaxInputs: 0,
		signalMaxOutputs: 0,

		logic: () => false,
	}
})

}, 0)//LOAD_DELAY)

setTimeout(() => {


INTERFACE_SYSTEM
.define(({ store }) =>
'system_data', FACE => {


	FACE.store.save({ path: 'components' })

const component_attributes = {
	no_inputs: {signalMaxInputs: 0},
	one_input: {signalMaxInputs: 1},
	logic_on:  {logic: "return true"},
	logic_or:  {logic: "return inputs.some(a=>Boolean(a))"},
	logic_and: {logic: "return Boolean(inputs.length) && inputs.every(a=>Boolean(a))"},
	resizable_both: {
		defaultProperties: {
			w: 40,
			h: 40,
		},
		resizable: true,
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
	}
}


const logic_components = [
	{
		name: "on",
		icon: [
			{c:[25,50],r:25},
			{s:[50,50],e:[100,50]}
		],

		attributes: ['logic_on','no_inputs'],
	},
	{
		name: "not gate",
		icon: [
			{s:[75,50],e:[0,100]},
			{s:[0,100],e:[0,0]},
			{s:[0,0],e:[75,50]},
			{c:[85,50],r:13},
		],
		logic: "return !inputs[0]",

		attributes: ['one_input'],
	},
	{
		name: "and gate",
		icon: [
			{s:[0,0],e:[0,100]},
			{s:[0,100],e:[50,100]},
			{s:[50,100],e:[50,0],c1:[9999,50],r:50},
			{s:[50,0],e:[0,0]},
		],

		attributes: ['logic_and'],
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

		attributes: ['logic_or']
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
/*
const physics_components = [
	{
		name: "hitbox",
		icon: GAME.render.component_hitbox,

		logicEnables: true,

		targets: ["drawing","hitbox"],
		targetable: true,

		hasPhysics: true,
		collision: true,

		attributes: ['logic_or','resizable_both']
	},
	{
		name: "physics rule",
		icon: GAME.render.component_physics,

		signalMaxOutputs: 0,

		logic: logic_or,

		resizable: "proportional",
		rotatable: true,
		targets: ["drawing","hitbox"],

		physics(obj, component) {
			const { angle, order, size } = component.properties
			const xmag = Math.cos(angle) * size
			const ymag = Math.sin(angle) * size
			switch (order) {
				case 3:
					// change acceleration
					obj.acceleration.x += xmag
					obj.acceleration.y += ymag
					break
				case 2:
					// change velocity
					obj.velocity.x += xmag
					obj.velocity.y += ymag
					break
				case 1:
					// change position
					obj.position.x += xmag
					obj.position.y += ymag
					return true
				case 0:
					// set position
					obj.position.x = component.pos.x
					obj.position.y = component.pos.y
					return true
				case -1:
					const { x, y } = component.pos
					const { width, height } = this.getSize(component)
					// console.log('phys', order, angle, {x,y}, size)
					// set position directional
					const r = height / 2
					const xmag2 = Math.cos(angle)
					const ymag2 = Math.sin(angle)

					if (Math.abs(ymag2) > 0.00001) {
						const xy = xmag2 / ymag2
						const hw = obj.size.x / 2
						const hh = obj.size.y / 2
						const t  = (
							(y + r + (ymag2 * r))
							- (obj.position.y + hh)
							+ ((x + r + (xmag2 * r)) * xy)
							- ((obj.position.x + hw) * xy)
						) / (ymag2 + xmag2 * xy)

						obj.position.x = obj.position.x + (xmag2 * (t - hw))
						obj.position.y = obj.position.y + (ymag2 * (t - hh))
						// MATH
							// oc.x + (xmag * t1) = lc.x - (ymag * t2)
							// oc.y + (ymag * t1) = lc.y + (xmag * t2)


							// (xmag * t1) + (ymag * t2) = lc.x - oc.x
							// (ymag * t2) = lc.x - oc.x - (xmag * t1)
							// t2 = (lc.x - oc.x - (xmag * t1)) / ymag



							// (ymag * t1) - (xmag * t2) = lc.y - oc.y

							// t1 = ((xmag * t2) + lc.y - oc.y) / ymag


							// t1 = ((xmag * (lc.x - oc.x - (xmag * t1)) / ymag) + lc.y - oc.y) / ymag


							// (ymag * t1) - (xmag / ymag * (lc.x - oc.x - (xmag * t1)) ) = lc.y - oc.y
							// (ymag * t1) + (xmag * t1) * xmag / ymag = lc.y - oc.y + (lc.x * xmag / ymag) - (oc.x * xmag / ymag)
					} else {
						if (Math.abs(angle%(Math.PI*2)) < 0.00001)
							obj.position.x = component.pos.x + height - obj.size.x
						else obj.position.x = component.pos.x
					}
					return true
				case -2:
					// set velocity
					obj.velocity.x = xmag
					obj.velocity.y = ymag
					break
				case -3:
					// set acceleration
					obj.acceleration.x = xmag
					obj.acceleration.y = ymag
					break
			}
		},

		defaultProperties: {
			angle: Math.PI/2,
			order: 3,
			size: 2,
		},

		setSize(component, newSize, scale = 1) {
			component.properties = {
				size: (newSize.width - 20) / 10
			}
		},
		getSize(component, scale = 1) {
			if (component.size)
				return component.size

			const size = (component.properties.size*10) + 20
			return {
				width: scale * size,
				height: scale * size
			}
		},
		getRenderHelpers(component) {
			const { properties } = component
			const renderHelpers = {}
			if ('angle' in properties)
				renderHelpers.angle = properties.angle - (Math.PI/2)
			if ('order' in properties)
				renderHelpers.order = properties.order
			return renderHelpers
		},

		edit() {
			const id = this.component_id

			let orderFull = 1000*(GAME.component_data.get[id].properties.order+3)/6
			const onwheel = function(event) {
				orderFull = Math.min(Math.max(0, orderFull - event.deltaY), 1000)
				GAME.component_data.set[id].properties = { order: Math.max(-3, Math.round(6*orderFull/1000)-3) }
			}
			this.addEventListener("wheel", onwheel)
			return () => {
				this.removeEventListener("wheel", onwheel)
			}
		},
	},
	{
		name: "clock",
		icon: GAME.render.component_clock,

		logic: logic_or,
		logicEnables: true,

		resizable: "proportional",

		timing: true,

		defaultProperties: {
			size: 20
		},

		setSize(component, newSize, scale = 1) {
			component.properties = {
				size: newSize.width - 20
			}
		},
		getSize(component, scale = 1) {
			const size = component.properties.size + 20
			return {
				width: scale * size,
				height: scale * size
			}
		},
	}
	//TODO: delay, random
]
*/


logic_components.forEach(component => {
	FACE.store.save({
		path: `data://components/${component.name}`,
		type: 'game-component',
		data: component
	})
})
// physics_components.forEach(component => {
// 	FACE.store.save({
// 		path: `data://components/${component.name}`,
// 		type: 'game-component',
// 		data: component
// 	})
// })


})


}, LOAD_DELAY)

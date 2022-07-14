setTimeout(() => {


GAME_SYSTEM
.after('logic_components')
.define(({ component_definitions, render, component_data }) =>
'physics_components', GAME => {

	GAME.render.component_hitbox = function (context) {
		const { y, x, width: w, height: h } = this.getBoundingClientRect()

		context.fillStyle = "rgba(255,128,128,0.5)"
		context.fillRect(x, y, w, h)
		context.strokeRect(x, y, w, h)
	}
	GAME.render.component_physics = function (context) {
		const { y: oy, x: ox, width: w, height: h } = this.getBoundingClientRect()
		const { angle } = this.renderHelpers

		const x = angle ? -w/2 : ox
		const y = angle ? -h/2 : oy

		if (angle) {
			const centerX = ox + (w / 2)
			const centerY = oy + (h / 2)
			context.translate(centerX, centerY)
			context.rotate(angle)
		}

		const r = 0.7

		const order = "order" in this.renderHelpers ? this.renderHelpers.order : 3

		const unadj = -(3-order) / 12
		if (order <= -3) {
			context.beginPath()
			context.moveTo(x+(w/4), y+(11.5*h/8)+(unadj*h))
			context.lineTo(x+(3*w/4), y+(11.5*h/8)+(unadj*h))
			context.stroke()
		}
		if (order <= -2) {
			context.beginPath()
			context.moveTo(x+(w/4), y+(10.25*h/8)+(unadj*h))
			context.lineTo(x+(3*w/4), y+(10.25*h/8)+(unadj*h))
			context.stroke()
		}
		if (order <= -1) {
			context.beginPath()
			context.moveTo(x+(w/4), y+(9*h/8)+(unadj*h))
			context.lineTo(x+(3*w/4), y+(9*h/8)+(unadj*h))
			context.stroke()
		}
		if (order >= 1){
			context.beginPath()
			context.arc(x+(w/2), y+(5.5*h/8)+(unadj*h), h/3, Math.PI+r, -r)
			context.stroke()
		}
		if (order >= 2){
			context.beginPath()
			context.arc(x+(w/2), y+(4.25*h/8)+(unadj*h), h/3, Math.PI+r, -r)
			context.stroke()
		}
		if (order >= 3){
			context.beginPath()
			context.arc(x+(w/2), y+(3*h/8)+(unadj*h), h/3, Math.PI+r, -r)
			context.stroke()
		}
		context.beginPath()
		context.arc(x+(w/2), y+(3*h/4)+(unadj*h), h/4, 0, Math.PI*2)
		context.stroke()

		if (angle) {
			context.resetTransform()
		}
	}
	GAME.render.component_clock = function (context) {
		const { y, x, width: w, height: h } = this.getBoundingClientRect()

		context.beginPath()
		context.arc(x+(w/2), y+(h/2), w/2, 0, Math.PI * 2)
		context.stroke()
		context.beginPath()
		context.moveTo(x+(w/2)+(w*0.05), y+(h/2)-(h*0.4))
		context.lineTo(x+(w/2), y+(h/2))
		context.lineTo(x+(w/2)+(w*0.3), y+(h/2)-(h*0.05))
		context.stroke()
	}


const logic_or = inputs => inputs.some(truthy)

const components = [
	{
		name: "hitbox",
		icon: GAME.render.component_hitbox,

		logic: logic_or,
		logicEnables: true,

		resizable: true,
		targets: ["drawing","hitbox"],
		targetable: true,

		hasPhysics: true,
		collision: true,

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

components.forEach(component => {
	GAME.component_definitions[component.name] = component
})


})


}, LOAD_DELAY)

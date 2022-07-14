setTimeout(() => {


GAME_SYSTEM
.after('logic_components','physics_components')
.define(({
	component_definitions, component_data, container_element,
	render, edit_interaction,
	modifierKeys, bind
}) =>
'drawing_component', GAME => {
	GAME.render.component_drawing = function (context) {
		const { y, x, width: w, height: h } = this.getBoundingClientRect()

		const { lines } = this.renderHelpers
		if (! lines || lines.length === 0) {
			context.beginPath()
			context.moveTo(x, y+(h/4))
			context.lineTo(x+(w/3), y)
			context.lineTo(x+(w/16), y+(h/2))
			context.lineTo(x+(3*w/4), y+(h/16))
			context.lineTo(x, y+h)
			context.lineTo(x+w, y+(h/4))
			context.lineTo(x+(w/2), y+(7*h/8))
			context.lineTo(x+w, y+(3*h/4))
			context.stroke()
			return
		}

		const renderXScale = w / this.renderHelpers.w
		const renderYScale = h / this.renderHelpers.h

		context.beginPath()
		lines.forEach(line => {
			context.moveTo(
				x + (line.s[0] * renderXScale),
				y + (line.s[1] * renderYScale)
			)
			if (line.c2)
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

	const render = {
		saveButton(context) {
			const { y, x, width: w, height: h } = this.getBoundingClientRect()

			context.beginPath()
			context.moveTo(x+(2*w/16),y+(7*h/16))
			context.lineTo( x+(0*w/16), y+(11*h/16) )
			context.lineTo( x+(9*w/16), y+(16*h/16) )
			context.lineTo( x+(16*w/16), y+(3*h/16) )
			context.lineTo( x+(12*w/16), y+(0*h/16) )
			context.lineTo( x+(7*w/16), y+(10*h/16) )
			context.closePath()
			context.stroke()
		},
	}
	const component = {
		name: "drawing",
		icon: GAME.render.component_drawing,

		signalMaxOutputs: 0,

		logic: inputs => inputs.some(truthy),

		renders: true,
		hasPhysics: true,
		targetable: true,

		get defaultProperties (){
			return {
				w: 40,
				h: 40,
				lines: []
			}
		},

		getSize(component, scale = 1) {
			return {
				width: scale * component.properties.w,
				height: scale * component.properties.h
			}
		},
		getRenderHelpers(component) {
			const renderHelpers = {}
			if ('lines' in component.properties) {
				const lines = [...component.properties.lines]
				renderHelpers.lines = lines
				renderHelpers.w = lines.reduce((ret, line) => Math.max(ret, line.s[0], line.e[0]), 0)
				renderHelpers.h = lines.reduce((ret, line) => Math.max(ret, line.s[1], line.e[1]), 0)
			}
			return renderHelpers
		},


		edit() {
			const drawingSurface = GAME.dom.createElement("drawing-surface")
			applyStyles(drawingSurface, style.editOverlay)
			GAME.container_element.appendChild(drawingSurface)
			drawingSurface.render = function (context) {
				const { drawing } = this.renderHelpers
				// console.log('a', drawing)
				// drawing.forEach(({ method, args }) => {
				// 	context[method](...args)
				// })
				context.beginPath()
				drawing.lines.forEach(line => {
					context.moveTo(...drawing.getPoint(line.s))
					if (line.c2)
						context.bezierCurveTo(...drawing.getPoint(line.c1), ...drawing.getPoint(line.c2), ...drawing.getPoint(line.e))
					else if (line.c1)
						context.quadraticCurveTo(...drawing.getPoint(line.c1), ...drawing.getPoint(line.e))
					else if (line.e)
						context.lineTo(...drawing.getPoint(line.e))
				})
				context.strokeStyle = "#000000"
				context.stroke()
				context.beginPath()
				if (drawing.hoverPoint) {
					context.arc(...drawing.getPoint(drawing.hoverPoint), 2, 0, Math.PI*2)
				}
				context.strokeStyle = "#000000"
				context.stroke()
				context.stroke()
			}
			const saveButton = GAME.dom.createElement("save-button")
			applyStyles(saveButton, {
				bottom: 10,
				right: 10,
				width: 40,
				height: 40,
			})
			saveButton.render = render.saveButton
			drawingSurface.appendChild(saveButton)
			saveButton.addEventListener("click", (event) => {
				GAME.edit_interaction.stop({ scope: this })
				const xs = Object.values(drawing.points).map(point => point[0])
				const ys = Object.values(drawing.points).map(point => point[1])
				const bx = Math.min(...xs)
				const by = Math.min(...ys)
				const mx = Math.max(...xs) - bx
				const my = Math.max(...ys) - by
				const fixPoint = p => [p[0]-bx,p[1]-by]
				const lines = drawing.lines
					.filter(line => Object.values(line).indexOf("cursor") === -1)
					.map(line => ({
						s: fixPoint(drawing.getPoint(line.s)),
						e: fixPoint(drawing.getPoint(line.e))
					}))

				const component = GAME.component_data.get[this.component_id]

				GAME.component_data.rec[this.component_id].position = {
					x: bx, y: by,
				}
				GAME.component_data.rec[this.component_id].properties = {
					w: mx, h: my,
					lines
				}
			})




			// shift to lock to 8-path
			// ctrl to add curve point
			// click line to select
			// click point to select connected lines
			// dblclick point to select all in shape?
			// delete line
			// delete point
			// delete point and join

			// draw mode, delete mode, select mode


			// mousedown
			const pointSnap = 10
			const lineSnap = 10
			const thag = (a,b={x:0,y:0}) => ((a.x - b.x)**2 + (a.y - b.y)**2)**0.5
			const perp = (line, point) => {
				const {
					start, end
				} = line
				const d = {
					x: end.x - start.x,
					y: end.y - start.y,
				}
				const r = thag(d)
				const {
					xgrad = d.x / r,
					ygrad = d.y / r
				} = line

				if (Math.abs(ygrad) < 0.0000001) {
					// if line is parallel to Y, cheat to avoid infinities
					return {
						y: start.y,
						x: point.x
					}
				}
				const xy = xgrad / ygrad
				const t1 = (point.y + xy * (point.x - start.x) - start.y) / (ygrad+xgrad*xy)
				return {
					x: start.x + xgrad*t1,
					y: start.y + ygrad*t1
				}

				/* MATH
					p.x - ym*t2 = s.x + xm*t1
					p.y + xm*t2 = s.y + ym*t1


					p.x - ym*t2 = s.x + xm*t1
					p.x - s.x - xm*t1 = ym*t2
					(p.x - s.x - xm*t1) / ym = t2


					p.y + xm*t2 = s.y + ym*t1
					(p.y + xm*t2 - s.y) / ym =  t1


					(p.x - s.x - xm*((p.y + xm*t2 - s.y) / ym)) / ym = t2
					(p.x - s.x - p.y*xm/ym - xm*t2*xm/ym + s.y*xm/ym) / ym = t2
					p.x/ym - s.x/ym - p.y*xm/ym/ym - xm*t2*xm/ym/ym + s.y*xm/ym/ym = t2
					p.x/ym - s.x/ym - p.y*xm/ym/ym + s.y*xm/ym/ym = t2+xm*t2*xm/ym/ym
					p.x/ym - s.x/ym - p.y*xm/ym/ym + s.y*xm/ym/ym = t2*(1+xm*xm/ym/ym)
					(p.x/ym - s.x/ym - p.y*xm/ym/ym + s.y*xm/ym/ym)/(1+xm*xm/ym/ym) = t2



					(p.y + xm*((p.x - s.x - xm*t1) / ym) - s.y) / ym =  t1

					(p.y + (p.x*xm/ym - s.x*xm/ym - xm*t1*xm/ym) - s.y) / ym =  t1
					p.y/ym  + p.x*xm/ym/ym  - s.x*xm/ym/ym  - xm*t1*xm/ym/ym  - s.y/ym  =  t1
					p.y/ym  + p.x*xm/ym/ym  - s.x*xm/ym/ym  - s.y/ym  =  t1+xm*t1*xm/ym/ym
					p.y/ym  + p.x*xm/ym/ym  - s.x*xm/ym/ym  - s.y/ym  =  t1*(1+xm*xm/ym/ym)
					(p.y/ym  + p.x*xm/ym/ym  - s.x*xm/ym/ym  - s.y/ym) / (1+xm*xm/ym/ym)  =  t1
				*/
			}
			let down = false
			const drawing = {
				points: {},
				lines: [],
				cursorPoint: false,
				hoverPoint: false,
				getPoint(id) {
					if (id === "cursor")
						return this.cursorPoint
					return this.points[id]
				}
			}

			let _pid = 1
			const pid = () => (_pid++).toString()
			const component = GAME.component_data.get[this.component_id]
			const props = {...component.properties}
			props.lines.forEach(line => {
				const nl = {}
				Object.entries(line).forEach(([k,up]) => {
					const p = [up[0]+props.x,up[1]+props.y]
					const ep = Object.entries(drawing.points)
						.find(([id,op]) => thag({x:p[0],y:p[1]},{x:op[0],y:op[1]}) < 0.000001)
					if (ep)
						nl[k] = ep[0]
					else {
						const id = pid()
						drawing.points[id] = [...p]
						nl[k] = id
					}
				})
				drawing.lines.push(nl)
			})
			window.DRAW = drawing
			const findExistingPoint = point => Object.entries(drawing.points)
						.find(([ id, [ x, y ]]) => thag(point, { x, y }) < pointSnap)
			const findExistingLine = (point, ignores = []) =>
				drawing.lines.find(line => {
					if (ignores.includes(line)) return
					const sa = drawing.getPoint(line.s)
					const s = {
						x: sa[0],
						y: sa[1]
					}
					const ea = drawing.getPoint(line.e)
					const e = {
						x: ea[0],
						y: ea[1]
					}
					const p = perp({
						start: s, end: e
					}, point)
					if (p.x < Math.min(s.x, e.x))
						return
					if (p.x > Math.max(s.x, e.x))
						return
					if (p.y < Math.min(s.y, e.y))
						return
					if (p.y > Math.max(s.y, e.y))
						return
					if (thag(point, p) > lineSnap)
						return
					return true
					// console.log()
					context.beginPath()
					// context.moveTo(s.x, s.y)
					// context.lineTo(s.x + xm*50, s.y + ym*50)

					context.moveTo(point.x, point.y)
					// context.lineTo(point.x - ym*50, point.y + xm*50)
					context.lineTo(p.x, p.y)
					context.strokeStyle = "#ff0000"
					context.stroke()
				})
			const findMatchingLine = ({ s, e }, ignores = []) =>
				drawing.lines.find(line => {
					if (ignores.includes(line)) return
					return (line.s === s && line.e === e) ||
							(line.s === e && line.e === s)
				})
			let currentLine;
			// console.log(drawing)
			const on_drawingSurface = {
				mousedown(event) {
					if (event.target.closest('save-button')) return
					// down = true
					const existingPoint = findExistingPoint(event)
					if (existingPoint) {
						const p = existingPoint[0]
						if (currentLine) {
							if (currentLine.s === p) {
								array_remove(drawing.lines, currentLine)
								currentLine = false
							} else
							if (!findMatchingLine({
								...currentLine,
								e: p
							}, [currentLine])) {
								currentLine.e = p
								currentLine = false
							} else {
								array_remove(drawing.lines, currentLine)
								currentLine = false
							}
						}
						else {
							currentLine = { s: p }
							drawing.lines.push(currentLine)
						}
					}
					else {
						// TODO: snap to line?
						// const existingLine = findExistingLine(event, [currentLine])

						const p = pid()
						if (drawing.cursorPoint)
							drawing.points[p] = [...drawing.cursorPoint]
						else drawing.points[p] = [ event.x, event.y ]
						if (currentLine)
							currentLine.e = p
						currentLine = { s: p }
						drawing.lines.push(currentLine)
					}
					drawingSurface.renderHelpers.drawing = drawing
				},
				mouseup(event) {
					// down = false
				},
				mousemove(event) {
					if (event.target.closest('save-button')) return
					const existingPoint = findExistingPoint(event)
					if (existingPoint)
						drawing.hoverPoint = existingPoint[0]
					else drawing.hoverPoint =  false

					if (currentLine) {
						if (existingPoint)
							drawing.cursorPoint = existingPoint[1]
						else {
							if (GAME.modifierKeys.Shift) {
								const s = drawing.getPoint(currentLine.s)
								const a = Math.atan2(event.y - s[1], event.x - s[0])
								const r = thag(event, {x:s[0],y:s[1]})
								const stp = Math.PI/8
								const an = Math.round(a/stp)*stp

								drawing.cursorPoint = [ s[0]+Math.cos(an)*r, s[1]+Math.sin(an)*r ]
							} else {
								drawing.cursorPoint = [ event.x, event.y ]
							}
						}
						currentLine.e = "cursor"

					}
					drawingSurface.renderHelpers.drawing = drawing
				},
				click(event) {
				}
			}
			drawingSurface.renderHelpers.drawing = drawing
			GAME.bind(drawingSurface, on_drawingSurface)

			return () => {
				drawingSurface.remove()
			}
		},
	}
	GAME.component_definitions.drawing = component
})


}, LOAD_DELAY)

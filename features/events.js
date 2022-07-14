setTimeout(() => {

const MODULE = GAME => {
	const eventBinds = {}
	const newBindProxy = target => {
		const eventCallbacks = []
		return new Proxy(() => {}, {
			set: (_f, prop, value, self) => {
				if (!target[prop]) target[prop] = []
				_f[prop] = true
				target[prop].push(value)
				eventCallbacks.forEach(callback => {
					callback({ [prop]: value })
				})
				return true
			},
			enumerate: () => {
				return Object.keys(target);
			},
			ownKeys: () => {
				return Object.keys(target);
			},
			has: (_f, prop) => {
				return prop in target
			},
			deleteProperty: (_f, prop) => {
				delete _f[prop]
				return true
			},
			get: (_f, prop) => {
				return target[prop]
			},
			apply: (_f, scope, args) => {
				eventCallbacks.push(...args)
			}
		})
	}
	const bindProxies = {}
	const eventBindProxy = new Proxy(eventBinds, {
		get: (target, prop, self) => {
			if (!target[prop]) target[prop] = {}
			if (!bindProxies[prop])
				bindProxies[prop] = newBindProxy(target[prop])
			return bindProxies[prop]
		},
		set: (target, prop, value, self) => {
			if (!target[prop]) target[prop] = {}
			if (!bindProxies[prop])
				bindProxies[prop] = newBindProxy(target[prop])
			Object.assign(bindProxies[prop], value)
			return true
		}
	})

	const bindEvents = (element, events) => {
		const bind = events =>
			Object.entries(events).forEach(([ eventName, callbacks ]) => {
				if (Array.isArray(callbacks))
					callbacks.forEach(callback => {
						element.addEventListener(eventName, callback)
					})
				else element.addEventListener(eventName, callbacks)
			})

		if (typeof events === 'function')
			events(bind)
		bind(events)
	}
	const unbindEvents = (element, events) => {
		Object.entries(events).forEach(args => {
			element.removeEventListener(...args)
		})
	}

	GAME.bind = bindEvents
	GAME.unbind = unbindEvents


	let updateInterval = false
	const doUpdate = () => {
		updateInterval = false
		Object.keys(sheet).forEach(bindSheetEvents)
	}
	const wantUpdate = () => {
		if (updateInterval) return;
		updateInterval = setTimeout(doUpdate)
	}
	GAME.dom.addEventListener('DOMSubtreeModified', wantUpdate)

	const sheet = {}
	const eventRegister = {}

	const bindElementEvents = (eventKeys, element) => {
		if (!element._on_events)
			element._on_events = {}
		eventKeys.forEach(id => {
			if (element._on_events[id]) return;
			const event = eventRegister[id]
			element.addEventListener(...event)
			element._on_events[id] = true
		})
		return eventKeys
	}
	const bindSheetEvents = selector => {
		const elements = [...GAME.container_element.querySelectorAll(selector)]
		const events = sheet[selector]
		const eventKeys = Object.keys(events)
		elements.reduce(bindElementEvents, eventKeys)
	}
	let _id = 1

	const cascadingEventSheet = function (selector, events) {
		const selectorIsElement = typeof selector !== 'string'
		if (selectorIsElement && typeof selector.addEventListener !== 'function')
			throw new TypeError(`Cannot bind events to this element`);

		if (!selectorIsElement && !(selector in sheet))
			sheet[selector] = {}

		const selectorEvents = selectorIsElement ? {} : sheet[selector]

		Object.entries(events).forEach(([ event, callbacks ]) => {
			if (!Array.isArray(callbacks))
				callbacks = [callbacks]
			callbacks.forEach(callback => {
				const id = _id++
				eventRegister[id] = [ event, callback ]
				selectorEvents[id] = true
			})
		})
		if (selectorIsElement)
			bindElementEvents(Object.keys(selectorEvents), selector)
		else wantUpdate()
	}


	GAME.on = cascadingEventSheet
}

GAME_SYSTEM.define(({ dom, container_element }) =>
'events', MODULE)

INTERFACE_SYSTEM.define(({ dom, container_element }) =>
'events', MODULE)


}, LOAD_DELAY)

const array_remove = (array, item) => {
	const index = array.indexOf(item)
	if (index !== -1) array.splice(index, 1)
	return index
}

class Events {
	#callbacks = {}

	constructor(allowedEvents = []) {
		allowedEvents.forEach(allowedEvent => {
			this.#callbacks[allowedEvent] = []
		})
	}
	dispatch(event) {
		if (!(event.type in this.#callbacks))
			throw new Error(`Event type must be one of: ${Object.keys(this.#callbacks).join(", ")}.`)
		this.#callbacks[event.type].forEach(f => {
			f(event)
		})
	}
	bind(...args) {
		if (args[0] instanceof Function) {
			Object.keys(this.#callbacks).forEach(key => {
				this.#callbacks[key].push(args[0])
			})
		} else
		if (!(args[1] instanceof Function))
			throw new Error(`Second argument to ObservableProxy call must be a Function.`)
		else
		if (Array.isArray(args[0])) {
			for (const arg of args[0]) {
				if (!(arg in this.#callbacks))
					throw new Error(`Event type must be one of: ${Object.keys(this.#callbacks).join(", ")}.`)
				else this.#callbacks[arg].push(args[1])
			}
		} else if (!(args[0] in this.#callbacks))
			throw new Error(`Event type must be one of: ${Object.keys(this.#callbacks).join(", ")}.`)
		else this.#callbacks[args[0]].push(args[1])
	}
	unbind(...args) {
		if (args[0] instanceof Function) {
			Object.keys(this.#callbacks).forEach(key => {
				array_remove(this.#callbacks[key], args[0])
			})
		} else
		if (!(args[0] in this.#callbacks))
			throw new Error(`Event type must be one of: ${Object.keys(this.#callbacks).join(", ")}.`)
		else array_remove(this.#callbacks[args[0]], args[1])
	}
	hasEvent(eventName) {
		return eventName in this.#callbacks
	}
}

function FieldState(componentIndex, fieldComponents, connections) {

	let fieldStateUpdates = {}
	let fieldStateDirty = false
	let originalState = false
	let allUpdates = {}

	const markFieldStateForUpdate = () => {
		if (fieldStateDirty) return;
		if (originalState === false) {
			originalState = {}
			allUpdates = {}
			events.dispatch({
				type: "start",
			})
		}
		fieldStateDirty = true
		window.setTimeout(updateFieldState)
	}
	const getFieldState = id => {
		if (componentIndex[fieldComponents[id]].logicEnables) {
			return enables[id] && fieldState[id]
		} else return fieldState[id]
	}
	const calcValue = id => {
		const componentDefinition = componentIndex[fieldComponents[id]]
		if (componentDefinition.logic)
			return componentIndex[fieldComponents[id]].logic(
				Object.keys(connections.inverse[id])
				.map(getFieldState)
			)
		else if (componentDefinition.complexLogic)
			return componentIndex[fieldComponents[id]].complexLogic(
				id,
				Object.fromEntries(Object.keys(connections.inverse[id])
				.map(id => [ id, getFieldState(id) ]))
			)
		return false
	}
	const updateFieldState = () => {
		const updates = Object.keys(fieldStateUpdates)
		fieldStateUpdates = {}
		fieldStateDirty = false

		events.dispatch({
			type: "step",
		})
		const toUpdate = updates.reduce((acc, uid) => ({
			...acc,
			...connections.forward[uid]
		}), {})
		Object.keys(toUpdate).forEach(id => {
			const active = calcValue(id)
			if (componentIndex[fieldComponents[id]].logicEnables)
				enables[id] = active
			else fieldState[id] = active
		})
		if (fieldStateDirty === false) {
			events.dispatch({
				type: "end",
				updates: Object.fromEntries(Object.entries(allUpdates)
					.filter(([ , updated ]) => updated)
					.map(([ id ]) => [id, {
						start: originalState[id],
						end: fieldState[id]
					}])),
			})
			originalState = false
		}
	}

	const events = new Events(["start", "step", "end", "enable", "disable"])
	const enables = new ObservableProxy({}, /[1-9]+[0-9]*/)
	const fieldState = new ObservableProxy({}, /[1-9]+[0-9]*/)

	fieldState("create", ({ key: id }) => {
		if (fieldComponents[id] && componentIndex[fieldComponents[id]].logicEnables)
			enables[id] = false
	})
	fieldState("set", ({ key: id, value: active, success }) => {
		if (!success) return;
		if (active === undefined && fieldComponents[id]) {
			if (componentIndex[fieldComponents[id]].logicEnables) {
				enables[id] = calcValue(id)
				fieldState[id] = false
			} else fieldState[id] = calcValue(id)
		}
	})

	fieldState("update", ({ key }) => {
		fieldStateUpdates[key] = true
		markFieldStateForUpdate()
	})

	fieldState("update", ({ key, value, startValue }) => {
		if (!(key in originalState))
			originalState[key] = startValue

		allUpdates[key] = value !== originalState[key]
	})
	enables("update", event => {
		if (event.value) {
			events.dispatch({
				type: "enable",
				key: event.key,
				originator: event
			})
		} else {
			events.dispatch({
				type: "disable",
				key: event.key,
				originator: event
			})
		}
	})

	return new Proxy(fieldState, {
		apply (_fieldState, _n, args) {
			const unbind = args[0] === "unbind"
			const eventName = unbind ? args[1] : args[0]
			const isFunc = eventName instanceof Function
			const thisEvent = (!isFunc) && events.hasEvent(eventName)
			if (isFunc || thisEvent) {
				if (unbind)
					events.unbind(...args.slice(1))
				else events.bind(...args)
			}
			if (isFunc || !thisEvent)
				fieldState(...args)
		}
	})
}

class InteractionState {

	#activeStates = []
	#stateCleanups = {}

	#definedStates = {}

	#overrideRelationships = {}
	#defaultRelationships = {}
	#defaultRelationship = false
	// #stops = {}
	// #preventedBy = {}

	// #allStops = {}
	// #allStoppedBy = {}

	// #allPrevents = {}
	// #allPreventedBy = {}

	// #allStopsAll = false
	// #allPreventsAll = false

	// #notStops = {}
	// #notPreventedBy = {}
	// #allNotStops = []
	// #allNotPreventedBy = []

	#_uid = 1
	#uid = () => this.#_uid++

	constructor(states = {}) {
		Object.entries(states).forEach(([ stateType, config ]) => {
			this.define(stateType, config)
		})
	}

	start(stateType, config = {}) {
		if (typeof stateType !== "string")
			throw new TypeError(`Interaction state name must be a string, '${typeof stateType} given.`)
		if (!(config instanceof Object))
			throw new TypeError(`Interaction state config must be an object, '${typeof config} given.`)
		if (!this.#definedStates[stateType])
			throw new ReferenceError(`Interaction state '${stateType}' is not defined.`)

		// if prevented, exit
		const prevented = this.isPrevented(stateType)
		if (prevented)
			return false

		this.#activeStates.forEach(activeState => {
			if (this.#overrideRelationships[stateType][activeState.name] === this.STOP)
				this.stop(activeState.id)
		})

		const id = this.#uid()
		const confObj = config instanceof Function ? {} : config
		const cleanups = []
		if(config instanceof Function)
			cleanups.push(config(confObj))
		const activeState = {
			...confObj,
			id, name: stateType
		}
		this.#activeStates.push(activeState)
		if (this.#definedStates[stateType].start instanceof Function)
			cleanups.push(this.#definedStates[stateType].start(activeState))
		this.#stateCleanups[id] = cleanups.filter(cleanup => cleanup instanceof Function)
		// console.log("start", activeState)
		return id
	}
	stop(configMatch) {
		const stops = this.findActive(configMatch)
		stops.forEach(config => {
			const i = this.#activeStates.indexOf(config)
			this.#activeStates.splice(i, 1)
			if (this.#definedStates[config.name].stop instanceof Function)
				this.#definedStates[config.name].stop(config)
			this.#stateCleanups[config.id].forEach(cleanup => {
				cleanup(config)
			})
			delete this.#stateCleanups[config.id]
		})
		return Boolean(stops.length)
	}
	define(stateType, config = {}) {
		if (typeof stateType !== "string")
			throw new TypeError(`Interaction state name must be a string, '${typeof stateType} given.`)
		if (!(config instanceof Object))
			throw new TypeError(`Interaction state config must be an object, '${typeof config} given.`)
		if (this.#definedStates[stateType])
			throw new Error(`Interaction state '${stateType}' is already defined.`)
		this.#definedStates[stateType] = {
			// multiple: false,
			...config
		}
		this.#defaultRelationships[stateType] = this.#defaultRelationship
		this.#overrideRelationships[stateType] = {}
		Object.keys(this.#definedStates).forEach(key => {
			// if (key === stateType) return;
			this.#overrideRelationships[stateType][key] = this.#defaultRelationships[stateType]
			this.#overrideRelationships[key][stateType] = this.#defaultRelationships[key]
		})

		// this.#stops[stateType] = {}
		// this.#preventedBy[stateType] = {}

		// this.#allStops[stateType] = this.#allStopsAll
		// this.#allStoppedBy[stateType] = this.#allStopsAll

		// this.#allPrevents[stateType] = this.#allPreventsAll
		// this.#allPreventedBy[stateType] = this.#allPreventsAll
		return {
			start: (...args) => this.start(stateType, ...args),
			stop: (...args) => this.stop({ name: stateType, ...args[0]}),
			isActive: (...args) => this.isActive(stateType, ...args),
		}
	}
	findActive(configMatch) {
		if (configMatch instanceof Object) {
			return this.#activeStates
				.filter((config) =>
					!Object.entries(configMatch)
						.some(([key, value]) => config[key] !== value)
				)
		}
		if (configMatch in this.#definedStates)
			return this.findActive({ name: configMatch })
		return this.findActive({ id: configMatch })
	}
	isActive(configMatch) {
		return Boolean(this.findActive(configMatch).length)
	}
	isPrevented(stateType) {
		return this.#activeStates.some(({ name }) => this.#overrideRelationships[name][stateType] === this.PREVENT)
	}

	stops(A, B) { // A stops B
		let Alist = A instanceof Array ? A : [A]
		let Blist = B instanceof Array ? B : [B]

		if (Alist === InteractionState.ALL && Blist === InteractionState.ALL) {
			this.#defaultRelationship = this.STOP
			Object.keys(this.#definedStates).forEach(key => {
				this.#defaultRelationships[key] = this.STOP
			})
			Alist = Object.keys(this.#definedStates)
			Blist = Object.keys(this.#definedStates)
		}
		if (Alist === InteractionState.ALL) {
			Alist = Object.keys(this.#definedStates)
		}
		if (Blist === InteractionState.ALL) {
			Alist.forEach(key => {
				this.#defaultRelationships[key] = this.STOP
			})
			Blist = Object.keys(this.#definedStates)
		}

		Alist.forEach(Aitem => {
			Blist.forEach(Bitem => {
				// if (Aitem === Bitem) return;
				this.#overrideRelationships[Aitem][Bitem] = this.STOP
			})
		})


		/*
		IF A HAPPENS WHILE B IS HAPPENING
		A prevented by B
		A can stop B
		Neither, both are active


		IF B HAPPENS WHILE A IS HAPPENING
		A can prevent B
		B can stop A
		Neither
		*/


		// if (Alist === InteractionState.ALL) {
		// 	if (Blist === InteractionState.ALL)
		// 		this.#allStopsAll = true
		// 		Object.keys(this.#allStops).forEach(key => {
		// 			this.#allStops[key] = true
		// 		})
		// 		Object.keys(this.#allStoppedBy).forEach(key => {
		// 			this.#allStoppedBy[key] = true
		// 		})
		// 		Object.keys(this.#stops).forEach(a => {
		// 			Object.keys(this.#stops[a]).forEach(b => {
		// 				this.#stops[a][b] = true
		// 			})
		// 		})
		// 	else
		// 	if (Blist === this.EXCLUDES_NONE) {
		// 		this.#allStopsAll = false
		// 		Object.keys(this.#allStops).forEach(key => {
		// 			this.#allStops[key] = false
		// 		})
		// 		// Object.keys(this.#allStoppedBy).forEach(key => {
		// 		// 	this.#allStoppedBy[key] = false
		// 		// })
		// 		Object.keys(this.#stops).forEach(a => {
		// 			Object.keys(this.#stops[a]).forEach(b => {
		// 				this.#stops[a][b] = false
		// 			})
		// 		})
		// 	} else {
		// 		Blist.forEach(Bitem => {
		// 			this.#allStops[Bitem] = true

		// 			Object.keys(this.#stops).forEach(a => {
		// 				Object.keys(this.#stops[a]).forEach(b => {
		// 					this.#stops[a][b] = false
		// 				})
		// 			})
		// 		})
		// 	}
		// } else
		// if (Alist === this.EXCLUDES_NONE) {
		// 	if (Blist === InteractionState.ALL) {
		// 		this.#allStopsAll = false
		// 		// Object.keys(this.#allStops).forEach(key => {
		// 		// 	this.#allStops[key] = false
		// 		// })
		// 		Object.keys(this.#allStoppedBy).forEach(key => {
		// 			this.#allStoppedBy[key] = false
		// 		})
		// 		Object.keys(this.#stops).forEach(a => {
		// 			Object.keys(this.#stops[a]).forEach(b => {
		// 				this.#stops[a][b] = false
		// 			})
		// 		})
		// 	} else
		// 	if (Blist === this.EXCLUDES_NONE) {
		// 		throw new Error(`No action, don't do this`)
		// 	} else {
		// 		Blist.forEach(Bitem => {
		// 			this.#allStops[Bitem] = false
		// 		})
		// 	}
		// } else {
		// 	Alist.forEach(Aitem => {
		// 		if (Blist === InteractionState.ALL) {
		// 			this.#allStopsAll = true
		// 		} else
		// 		if (Blist === this.EXCLUDES_NONE) {
		// 			this.#allStopsAll = false
		// 			Object.keys(this.#allStops).forEach(key => {
		// 				delete this.#allStops[key]
		// 			})
		// 			Object.keys(this.#allStoppedBy).forEach(key => {
		// 				delete this.#allStoppedBy[key]
		// 			})
		// 		} else {
		// 			Blist.forEach(Bitem => {
		// 				this.#allStops[Bitem] = true
		// 			})
		// 		}
		// 	})
		// }

		// // All stops B
		// if (Alist === InteractionState.ALL) {
		// 	if (Blist === InteractionState.ALL)
		// 		this.#allStops.push(InteractionState.ALL)
		// 	else
		// 	if (Blist === this.EXCLUDES_NONE)
		// 		this.notStops(InteractionState.ALL, InteractionState.ALL)
		// 	else {
		// 		Blist.forEach(Bitem => {
		// 			this.#allStops.push(Bitem)
		// 		})
		// 	}
		// }
		// // None stops B = All not stops B
		// if (Alist === this.EXCLUDES_NONE)
		// 	return this.notStops(InteractionState.ALL, Blist)

		// Alist.forEach(Aitem => {
		// 	// A stops All
		// 	if (Blist === InteractionState.ALL)
		// 		this.#stops[Aitem] = InteractionState.ALL
		// 	else
		// 	// A stops None = A not stops All
		// 	if (Blist === this.EXCLUDES_NONE)
		// 		this.notStops(Alist, InteractionState.ALL)
		// 	else
		// 	if (this.#stops[Aitem] === InteractionState.ALL)
		// 		return
		// 	if (this.#stops[Aitem] === this.EXCLUDES_NONE)
		// 	Blist.forEach(Bitem => {
		// 		if ()
		// 	})
		// })
	}
	notStops(A, B) { // A does not stop B
		let Alist = A instanceof Array ? A : [A]
		let Blist = B instanceof Array ? B : [B]

		if (Alist === InteractionState.ALL && Blist === InteractionState.ALL) {
			this.#defaultRelationship = this.STOP
			Object.keys(this.#definedStates).forEach(key => {
				if (this.#defaultRelationships[key] === this.STOP)
					this.#defaultRelationships[key] = false
			})
			Alist = Object.keys(this.#definedStates)
			Blist = Object.keys(this.#definedStates)
		}
		if (Alist === InteractionState.ALL) {
			Alist = Object.keys(this.#definedStates)
		}
		if (Blist === InteractionState.ALL) {
			Alist.forEach(key => {
				if (this.#defaultRelationships[key] === this.STOP)
					this.#defaultRelationships[key] = false
			})
			Blist = Object.keys(this.#definedStates)
		}

		Alist.forEach(Aitem => {
			Blist.forEach(Bitem => {
				// if (Aitem === Bitem) return;
				if (this.#overrideRelationships[Aitem][Bitem] === this.STOP)
					this.#overrideRelationships[Aitem][Bitem] = false
			})
		})
	}

	prevents(A, B) { // A prevents B
		let Alist = A instanceof Array ? A : [A]
		let Blist = B instanceof Array ? B : [B]

		if (Alist === InteractionState.ALL && Blist === InteractionState.ALL) {
			this.#defaultRelationship = this.PREVENT
			Object.keys(this.#definedStates).forEach(key => {
				this.#defaultRelationships[key] = this.PREVENT
			})
			Alist = Object.keys(this.#definedStates)
			Blist = Object.keys(this.#definedStates)
		}
		if (Alist === InteractionState.ALL) {
			Alist = Object.keys(this.#definedStates)
		}
		if (Blist === InteractionState.ALL) {
			Alist.forEach(key => {
				this.#defaultRelationships[key] = this.PREVENT
			})
			Blist = Object.keys(this.#definedStates)
		}

		Alist.forEach(Aitem => {
			Blist.forEach(Bitem => {
				// if (Aitem === Bitem) return;
				this.#overrideRelationships[Aitem][Bitem] = this.PREVENT
			})
		})
	}
	notPrevents(A, B) { // A does not prevent B
		let Alist = A instanceof Array ? A : [A]
		let Blist = B instanceof Array ? B : [B]

		if (Alist === InteractionState.ALL && Blist === InteractionState.ALL) {
			this.#defaultRelationship = this.PREVENT
			Object.keys(this.#definedStates).forEach(key => {
				if (this.#defaultRelationships[key] === this.PREVENT)
					this.#defaultRelationships[key] = false
			})
			Alist = Object.keys(this.#definedStates)
			Blist = Object.keys(this.#definedStates)
		}
		if (Alist === InteractionState.ALL) {
			Alist = Object.keys(this.#definedStates)
		}
		if (Blist === InteractionState.ALL) {
			Alist.forEach(key => {
				if (this.#defaultRelationships[key] === this.PREVENT)
					this.#defaultRelationships[key] = false
			})
			Blist = Object.keys(this.#definedStates)
		}

		Alist.forEach(Aitem => {
			Blist.forEach(Bitem => {
				// if (Aitem === Bitem) return;
				if (this.#overrideRelationships[Aitem][Bitem] === this.PREVENT)
					this.#overrideRelationships[Aitem][Bitem] = false
			})
		})
	}
	get ALL() {
		throw new Error(`Do not access ALL from an InteractionState instance, access it statically from the class. E.g: InteractionState.ALL`)
		return false
	}
	get PREVENTS_ALL() {
		throw new Error(`Do not access PREVENTS_ALL from an InteractionState instance, access it statically from the class. E.g: InteractionState.PREVENTS_ALL`)
		return false
	}
	get STOPS_ALL() {
		throw new Error(`Do not access STOPS_ALL from an InteractionState instance, access it statically from the class. E.g: InteractionState.STOPS_ALL`)
		return false
	}

	static ALL = ["all"]
	// static EXCLUDES_NONE = []
	static PREVENTS_ALL = InteractionState.ALL
	// static PREVENTS_NONE = this.EXCLUDES_NONE
	static STOPS_ALL = InteractionState.ALL
	// static STOPS_NONE = this.EXCLUDES_NONE
	static STOP = ["stop"]
	static PREVENT = ["prevent"]
}

function ObservableProxy(target, allowedKeys = false) {
	/* AllowedKeys:
		false	= allow any
		true	= only allow existing keys
		Array	= allow any in array
		RegExp	= allow keys matching pattern
		Function= return value allows if truthy: (key: string) => boolean
	*/
	if (allowedKeys === true)
		allowedKeys = Object.keys(target)
	if (allowedKeys instanceof Array)
		allowedKeys = allowedKeys.map(String)

	const currentInitialKeys = Object.keys(target)
	const initialDataEvents = () =>
		currentInitialKeys.map(key => ({
			type: "create",
			key,
			value: target[key],
			startValue: undefined,
			success: true
		}))

	const events = new Events(["get","set","delete","create","update","afterupdate"])
	const _f = () => {}
	Object.keys(target).forEach(key => {
		_f[key] = _f[key] || undefined
	})

	const isKeyAllowed = key => {
		if (allowedKeys === false) return true

		if (allowedKeys instanceof Function) {
			if (! allowedKeys(key))
				return false
		}
		if (allowedKeys instanceof Array) {
			if (! allowedKeys.includes(key))
				return false
		} else
		if (allowedKeys instanceof RegExp) {
			if (! key.match(allowedKeys))
				return false
		}

		return true
	}

	let firedEvents = []
	events.bind(['delete','create','update'], event => {
		firedEvents.push(event);
	})
	let updateTimeout = false
	const multiUpdate = () => {
		firedEvents.forEach(({ type, key }) => {
			if (type === 'create')
				currentInitialKeys.push(key)
			else if (type === 'delete')
				currentInitialKeys.splice(currentInitialKeys.indexOf(key), 1)
		})
		events.dispatch({
			type: "afterupdate",
			events: firedEvents
		})
		firedEvents = []
		updateTimeout = false
	}

	return new Proxy(_f, {
		deleteProperty (_f, key) {
			const event = {
				type: "delete",
				key,
				value: target[key],
				success: false
			}
			if (!(key in target)) {
				events.dispatch(event)
				return false
			}
			const deleted = delete target[key]
			if (deleted) {
				event.success = true
				delete _f[key]
			}
			events.dispatch(event)
			if (!updateTimeout)
				updateTimeout = setTimeout(multiUpdate)
			return deleted
		},
		enumerate () {
			return Object.keys(target);
		},
		ownKeys () {
			return Object.keys(target);
		},
		has (_f, key) {
			return key in target
		},
		set (_f, key, value) {
			const event = {
				type: "set",
				key,
				value,
				startValue: target[key],
				success: false
			}
			if (! isKeyAllowed(key)) {
				events.dispatch(event)
				return false
			}

			const existed = key in target
			const updated = value !== target[key]
			target[key] = value
			_f[key] = _f[key] || undefined
			event.success = true
			if (! existed)
				events.dispatch({
					...event,
					type: "create"
				})
			else
			if (updated)
				events.dispatch({
					...event,
					type: "update"
				})
			events.dispatch(event)
			if (!updateTimeout)
				updateTimeout = setTimeout(multiUpdate)
			return true
		},
		get (_f, key) {
			const value = target[key]
			const event = {
				type: "get",
				key,
				value,
				success: false
			}
			if (! isKeyAllowed(key)) {
				events.dispatch(event)
				return undefined
			}
			event.success = true
			events.dispatch(event)
			return value
		},
		apply (_f, _n, args) {
			if (args[0] === "unbind")
				return events.unbind(...args.slice(1))
			if (args[0] instanceof Function) {
				args[0]({ type: 'initialdata', events: initialDataEvents() })
			} else if (args[1] instanceof Function) {
				if (args[0] === 'initialdata') {
					args[1]({ type: 'initialdata', events: initialDataEvents() })
					return;
				}
				if (Array.isArray(args[0]) && args[0].includes('initialdata')) {
					args[1]({ type: 'initialdata', events: initialDataEvents() })
					return events.bind(args[0].filter(e => e!=='initialdata'), args[1])
				}
			}
			return events.bind(...args)
		},
		// defineProperty: function (_f, ...a) {
			// TODO: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty
			// when ?
			// console.log("define",a)
			// if (oDesc && 'value' in oDesc) { oTarget.setItem(sKey, oDesc.value); }
			// return oTarget;
		// },
		// construct (...a) {
		// 	clone?
		// 	console.log("contruct", a)
		// },
	})
}

function DataStore() {
	// TODO: make this less magic
	const objEq = (a,b) => {
		for (const ak in a) {
			if (a[ak] !== b[ak])
				return false
		}
		for (const bk in b) {
			if (a[bk] !== b[bk])
				return false
		}
		return true
	}
	const actionContexts = {}
	const observers = {}
	const _id = {}

	const symbols = {}


	const newArgGetter = (path = [], getter) => {
		let provided
		return new Proxy(function(){}, {
			apply(target, thisArg, [args]) {
				if (path.length === 0)
					provided = args
				else return getter(path)
			},
			get(target, prop, reciever) {
				const ret = newArgGetter([...path, prop], getter || ((path) => {
					if (provided === undefined) {
						const symbol = Symbol(Math.random())
						symbols[symbol] = ret
						return symbol
					}
					return path.reduce((a,p) => a[p], provided)
				}))
				return ret
			},
		})
	}
	let toDo = []
	let timeoutDo = 0
	const newDo = (record = false, path = [], root = false) =>
		new Proxy(function(){}, {
			apply(target, thisArg, [args]) {
				if (path.length === 0) {
					let records = []
					let undos = []
					let errors

					for (const action of toDo) {
						const parsed = Object.fromEntries(Object.entries(action.args || {}).map(([k,v]) => {
							if (typeof v === 'symbol')
								v = symbols[v] || v
							if (v instanceof Function)
								return [k,v()]
							return [k,v]
						}))

						const atoms = reduceCompounds([{
							action: action.path,
							args: parsed
						}]).filter(uniqueActions)

						const failure = checkActionAtoms(atoms)
						if (failure) {
							undos.reverse()
							performActionAtoms(undos)
							errors = failure
							break
						}
						const performed = performActionAtoms(atoms)
						undos = undos.concat(performed)
						if (action.record)
							records = records.concat(performed)

						action.provider(performed[performed.length-1].args)
					}

					if (errors) {
						console.error(errors)
					} else if (records.length) {
						actionHistory.push(records.reverse())
						actionFuture = []
					}

					if (timeoutDo)
						clearTimeout(timeoutDo)
					timeoutDo = 0
					toDo = []
				} else {
					const provider = newArgGetter()
					toDo.push({ path: path.join('.'), args, provider, record })
					if (!timeoutDo)
						timeoutDo = setTimeout(root)
					return provider
				}
			},
			get(target, prop, reciever) {
				return newDo(record, [...path, prop], root || reciever)
			},
		})

	let toSubDo = []
	const newSubDo = (path = []) =>
		new Proxy(function(){}, {
			apply(target, thisArg, [args, atom = false]) {
				if (path.length === 0) {
					const ret = toSubDo
					toSubDo = []
					return ret
				} else {
					// TODO: is a provider possible / needed in this context?
					// const provider = newArgGetter()
					toSubDo.push({ action: path.join('.'), args, atom })
				}
			},
			get(target, prop, reciever) {
				return newSubDo([...path, prop])
			},
		})

	const SubDo = newSubDo()

	const actionAtoms1D = {}
	const actionCompounds1D = {}
	const actionChecks1D = {}

	const uniqueActions = ({ action, args }, i, l) =>
		l.findIndex(other => other.action === action && objEq(args, other.args)) === i
	const uniqueActionsLast = ({ action, args }, i, l) =>
		l.findLastIndex(other => other.action === action && objEq(args, other.args)) === i
	const reduceCompounds = compounds =>
		[].concat(...compounds.map(({ action, args, atom }) => {
			if (!actionCompounds1D[action])
				return [{ action, args }]
			if (atom)
				return [{ action, args }]

			const name = action.split('.')[0]
			actionCompounds1D[action].call(actionContexts[name], args)

			const result = SubDo()

			if (!(result && result.length))
				return [{ action, args }]

			const subReduced = reduceCompounds(result)
			if (subReduced.find((atom) => atom.action === action))
				return subReduced
			return subReduced.concat([{ action, args }])
		}))

	const checkActionAtoms = atoms => {
		// check all
		const checks = atoms.map(({ action, args }) =>
			({ action, args, error: actionChecks1D[action] && actionChecks1D[action].call(actionContexts[action.split('.')[0]], args) }))
		const failedChecks = checks.filter(({ error }) => error)
		if (failedChecks.length)
			return failedChecks.map(({ error, action, args }) =>
					`Could not ${action.split('.')[1]} ${action.split('.')[0]}: ${error}`)
	}
	const performActionAtoms = atoms => {
		const undos = atoms.map(({ action, args }) => {
			const name = action.split('.')[0]
			const result = actionAtoms1D[action].call(actionContexts[name], args)
			return { args: result.args, action: `${name}.${result.action}`}
		})
		return undos
	}

	const actionHistory = []
	let actionFuture = []
	const Do = newDo(true)
	const SysDo = newDo(false)
	return {
		redoit: () => {
			if (actionFuture.length === 0) return
			const actionDefs = actionFuture.pop()
			const undos = performActionAtoms(actionDefs)
			undos.reverse()
			actionHistory.push(undos)
		},
		undoit: () => {
			if (actionHistory.length === 0) return
			const actionDefs = actionHistory.pop()
			const redos = performActionAtoms(actionDefs)
			redos.reverse()
			actionFuture.push(redos)
		},
		commit: () => SysDo(),
		define: (name, actions, interface) => {
			_id[name] = 1
			const target = {}
			const getter = new Proxy(target, {
				get(target, key) {
					return target[key]
				},
				set(target, key) {
					throw new Error('Data is read-only')
					return false
				}
			})
			const setter = new Proxy(()=>{}, {
				enumerate: () => {
					return Object.keys(target)
				},
				ownKeys: () => {
					return Object.keys(target)
				},
				has: (_f, prop) => {
					return prop in target
				},
				deleteProperty: (_f, prop) => {
					interface.del.call(SysDo, prop)
					return true
				},
				set: (_f, prop, value) => {
					if (prop in target) {
						// TODO: implement?
						console.log('OVERWRITE', prop, value)
						return false
					} else {
						value.id = prop
						interface.add.call(SysDo, value)
						return true
					}
					return false
				},
				get: (_f, prop) => {
					return new Proxy({}, {
						set: (_o, key, value) => {
							if (key in interface.properties) {
								interface.properties[key].call(SysDo, prop, value, (prop in target) ? target[prop][key] : undefined)
								return true
							}
							target[prop][key] = value
							return true
						}
					})
				},
				apply: (_f, scope, args) => {
					return interface.add.apply(SysDo, args)
				}
			})
			const recorder = new Proxy(()=>{}, {
				enumerate: () => {
					return Object.keys(target)
				},
				ownKeys: () => {
					return Object.keys(target)
				},
				has: (_f, prop) => {
					return prop in target
				},
				deleteProperty: (_f, prop) => {
					interface.del.call(Do, prop)
					return true
				},
				set: (_f, prop, value) => {
					if (prop in target) {
						// TODO: implement?
						console.log('OVERWRITE', prop, value)
						return false
					} else {
						value.id = prop
						interface.add.call(Do, value)
						return true
					}
					return false
				},
				get: (_f, prop) => {
					return new Proxy({}, {
						set: (_o, key, value) => {
							if (key in interface.properties) {
								interface.properties[key].call(Do, prop, value, (prop in target) ? target[prop][key] : undefined)
								return true
							}
							target[prop][key] = value
							return true
						}
					})
				},
				apply: (_f, scope, args) => {
					return interface.add.apply(Do, args)
				}
			})
			observers[name] = new ObservableProxy(target)
			const observerWatcher = (...args) => observers[name](...args)
			actionContexts[name] = {
				id: (existing_id) =>  {
					if (existing_id) {
						const num = Number(existing_id)
						if (!isNaN(num))
							_id[name] = Math.max(_id[name], Number(existing_id))+1
						return `${existing_id}`
					}
					return (_id[name]++).toString()
				},
				get data() {return observers[name]},
				Do: SubDo,
				get(otherName, otherId) {
					if (!observers[otherName])return;
					return observers[otherName][otherId]
				}
			}
			Object.entries(actions).forEach(([ action, methods ]) => {
				const path = `${name}.${action}`
				if (methods.compound)
					actionCompounds1D[path] = methods.compound
				if (methods.atom)
					actionAtoms1D[path] = methods.atom
				if (methods.check)
					actionChecks1D[path] = methods.check
			})
			return {
				get: getter,
				set: setter,
				rec: recorder,
				watch: observerWatcher,
				// Do
			}
		},
	}
}

function FeatureSystem() {
	 function ArgumentSupplyGetter () {
		const list = []
		return new Proxy(()=>{}, {
			get(target, key) {
				list.push(key)
			},
			set: () => false,
			apply: () => [...list],
		})
	}

	const dependenciesSatisfied = feature =>
		feature.dependencies.every(dependency =>
			dependency === '_SYSTEM_BEFORE_SETTLED' ||
			dependency === '_SYSTEM_BEFORE_COMPLETE' ||
			registeredFeatures.some(({ name }) => name === feature.name))

	const cascadeDependenciesInner = dependency => {
		const feature = registeredFeatures.find(({ name }) => name === dependency) ||
			beforeSettledFeatures.find(({ name }) => name === dependency) ||
			beforeCompleteFeatures.find(({ name }) => name === dependency)
		if (!feature) return []
		return cascadeDependencies(feature.dependencies)
	}
	const cascadeDependencies = dependencies =>
		dependencies.concat(...dependencies.map(cascadeDependenciesInner)).filter(unique)


	const addedApps = {}
	const startAppProcess = app => {
		if (addedApps[app.name]) return;

		const allFeatures = registeredFeatures
			.concat(beforeSettledFeatures)
			.concat(beforeCompleteFeatures)

		const satisfied = app.dependencies
			.every(name => allFeatures.some(feature => feature.name === name))

		// console.log(`${app.name} not satisfied: ${app.dependencies}`)
		if (!satisfied) return;

		console.groupCollapsed(`Executing App: ${app.name}`)

		const appFeatures = registeredFeatures.filter(({ name }) => app.features.includes(name))

		const dependenciesSatisfied = feature =>
			feature.dependencies.every(dependency =>
				dependency === '_SYSTEM_BEFORE_SETTLED' ||
				dependency === '_SYSTEM_BEFORE_COMPLETE' ||
				context[dependency] || addedFeatures[dependency])

		const _this = this
		const context = {}
		const addedFeatures = {}
		const executionContexts = {}
		const getExecutionContext = feature => {
			if (!executionContexts[feature.name]) {
				executionContexts[feature.name] = (() => {

					let featureInitialised = false
					const { name, requirements = [], dependencies = [] } = feature

					const selfDefined = {}
					const featureContext = new Proxy(context, {
						get(target, key) {
							if (!(key in selfDefined)) {
								if (!requirements.includes(key))
									throw new ReferenceError(`Property '${key}' is not defined in the dependencies or requirements.`)
								if (!(featureInitialised || dependencies.includes(key)))
									throw new ReferenceError(`Property '${key}' is defined in the requirements, but is being used before the feature is initialised.`)
							}
							return context[key]
						},
						set(target, key, value) {
							if ((key !== name/* && !(key in selfDefined)*/) && key in target)
								throw new ReferenceError(`Property '${key}' already exists, and cannot be redefined by another feature.`)
							selfDefined[key] = true
							target[key] = value
						}
					});

					return {
						get context() {
							return featureContext
						},
						set initialised(value) {
							if (featureInitialised && !Boolean(value))
								throw new Error(`Cannot de-initialise a context after it is initialised`)
							featureInitialised = true
						},
						set selfDefined(value) {
							selfDefined[name] = Boolean(value)
						}
					}
				})()
			}
			return executionContexts[feature.name]
		}
		const executeFeature = feature => {
			console.log(`Execute Feature: ${feature.name}`)

			const { name, call } = feature

			const featureContext = getExecutionContext(feature)

			const result = call.call(_this, featureContext.context, name, Object.keys(addedFeatures))
			if (result) {
				context[name] = result
				featureContext.selfDefined = true
			}
			featureContext.initialised = true

			return result
		}
		const addFeature = feature => {
			const { name, call, requirements = [], dependencies = [] } = feature

			const result = executeFeature(feature)

			addedFeatures[name] = { ...feature, result }
		}

		let runs = 0
		let currentFeatures = appFeatures
		while (runs < appFeatures.length && currentFeatures.length) {
			runs ++
			currentFeatures = currentFeatures.reduce((features, feature) => {
				if (dependenciesSatisfied(feature))
					addFeature(feature)
				else features.push(feature)

				return features
			}, [])

			beforeSettledFeatures.forEach(feature => {
				if (dependenciesSatisfied(feature))
					executeFeature(feature)
			})
		}
		beforeCompleteFeatures.forEach(feature => {
			if (dependenciesSatisfied(feature))
				executeFeature(feature)
		})


		const appContext = getExecutionContext(app)
		appContext.initialised = true

		const result = app.call.call(_this, appContext.context, app.name, Object.keys(addedFeatures))
		if (result) {
			console.error(`IDK what to do here, you tell me...`)
			// context[name] = result
			// appContext.selfDefined = true
		}

		addedApps[app.name] = { ...app, result }

		console.log(`Completed in ${runs} runs.`)
		if (currentFeatures.length)
			console.log(`${currentFeatures.length} features unloaded:`, currentFeatures)
		console.groupEnd()
	}



	const featureFailed = (feature, reason) => {
		console.error(`Feature Failed: ${feature.name}. ${reason}`)
	}
	let registeredFeatures = []
	let beforeSettledFeatures = []
	let beforeCompleteFeatures = []
	const registerFeature = feature => {
		if (feature.dependencies.includes(feature.name)) {
			featureFailed(feature, `A feature cannot depend on itself.`)
			return;
		}

		if (registeredApps[feature.name]) {
			featureFailed(feature, `An app is already registered with this name.`)
			return;
		}

		if (
			registeredFeatures.some(({ name }) => name === feature.name) ||
			beforeSettledFeatures.some(({ name }) => name === feature.name) ||
			beforeCompleteFeatures.some(({ name }) => name === feature.name)
		) {
			featureFailed(feature, `A feature named '${feature.name}' already exists.`)
			return;
		}

		if (cascadeDependencies(feature.dependencies).includes(feature.name)){
			featureFailed(feature, `A feature cannot depend on itself (deep).`)
			return;
		}

		console.log(`Register ${feature.name}`)
		if (feature.dependencies.includes('_SYSTEM_BEFORE_SETTLED'))
			beforeSettledFeatures.push(feature)
		else if (feature.dependencies.includes('_SYSTEM_BEFORE_COMPLETE'))
			beforeCompleteFeatures.push(feature)
		else registeredFeatures.push(feature)

		if (Object.keys(registeredApps).length)
			updateApps()
	}
	const defineFeature = (dependencies, requirements, passedDefinition) => {
		const requirementDefiner = new ArgumentSupplyGetter()
		const supplyDefiner = new ArgumentSupplyGetter()

		const requirementsResult = requirements(requirementDefiner, supplyDefiner)

		const requiredDefinitions = requirementDefiner()
		const supplyDefinitions = supplyDefiner()

		const definition = passedDefinition || (typeof requirementsResult === 'function' && requirementsResult) || (() => {})
		const nameObject = requirementsResult || passedDefinition
		const name = typeof nameObject === 'string' ? nameObject : nameObject.name
		return {
			name,
			call: definition,
			requirements: requiredDefinitions.concat(supplyDefinitions).filter(unique),
			dependencies: dependencies.concat(requiredDefinitions).filter(unique)
		}
	}


	let appTimeout = false
	const updateApps = () => {
		if (appTimeout)
			clearTimeout(appTimeout)
		appTimeout = setTimeout(() =>
			Object.values(registeredApps).forEach(startAppProcess), 10)
	}
	const registeredApps = {}
	const registerApp = app => {
		console.log(`App ${app.name}`)
		if (registeredApps[app.name])
			throw new Error(`App already exists`)
		registeredApps[app.name] = app
		startAppProcess(app)
	}
	const defineApp = (dependencies, requirements, passedDefinition) => {
		const requirementDefiner = new ArgumentSupplyGetter()
		const supplyDefiner = new ArgumentSupplyGetter()

		const requirementsResult = requirements(requirementDefiner, supplyDefiner)

		const requiredDefinitions = requirementDefiner()
		const supplyDefinitions = supplyDefiner()

		const definition = passedDefinition || (typeof requirementsResult === 'function' && requirementsResult) || (() => {})
		const nameObject = requirementsResult || passedDefinition
		const name = typeof nameObject === 'string' ? nameObject : nameObject.name
		return {
			name,
			call: definition,
			features: requiredDefinitions,
			requirements: supplyDefinitions.concat(requiredDefinitions).filter(unique),
			dependencies: dependencies.concat(requiredDefinitions).filter(unique)
		}
	}


	const newEndpoint = dependencies => ({
		get beforeComplete() {
			return newEndpoint(dependencies.concat(['_SYSTEM_BEFORE_COMPLETE']))
		},
		get beforeSettled() {
			return newEndpoint(dependencies.concat(['_SYSTEM_BEFORE_SETTLED']))
		},
		after(...moreDependencies) {
			return newEndpoint(dependencies.concat(...moreDependencies.map(dependency => {
				if (Array.isArray(dependency))
					return dependency
				return [dependency]
			})).filter(unique))
		},
		define(...args) {
			const feature = defineFeature(dependencies, ...args)
			registerFeature(feature)
			return newEndpoint([ feature.name ])
		},
		create(...args) {
			const app = defineApp(dependencies, ...args)
			registerApp(app)
			return newEndpoint([ app.name ])
		}
	})
	return newEndpoint([])
}

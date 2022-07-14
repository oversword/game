
const calcable = [ "left", "right", "width", "top", "bottom", "height", "opacity" ]
const vertical = [ "top", "bottom", "height", ]

const whiteSpace = /\s/gmi
const calcStart = /^calc/gmi
const calcProp = /(\d+\.\d+|\.\d+|\d+)(%|px)?/i
const calcStyle = (calcString, propName) => {
	const prop = calcString.match(calcProp)
	if (! prop) return undefined
	const value = parseFloat(prop[1])
	const unit = prop[2]
	if (unit === "px") return value
	const direction = vertical.includes(propName) ? "offsetHeight" : "offsetWidth"
	return parent => {
		if (unit === "%")
			return parent[direction] * value / 100
		return 0
	}
	// const cleanString = calcString
	// 	.replace(whiteSpace, "")
	// 	.replace(calcStart, "")

	// return () => {
	// 	return 0
	// }
}
const calcValue = (value, parent) => {
	if (value instanceof Function)
		return value(parent)
	return value
}
const calculateOpacity = el =>
	(el.style.opacity || 1) *
	(el.parentElement ? calculateOpacity(el.parentElement) : 1)

const parseColor = value => {
	 if (value[0] === "#") {
		if (value.length > 6) {
			const parsedVal = value
				.slice(1,9)
				.toUpperCase()
				.match(/[0-9A-F]{2}/g)
				.map(h => parseInt(h, 16))
			parsedVal[3] = (3 in parsedVal) ? (parsedVal[3] / 255) : 1
			return parsedVal
		} else if (value.length > 3) {
			const parsedVal = value
				.slice(1,5)
				.toUpperCase()
				.split("")
				.map(h => parseInt(h+h, 16))
			parsedVal[3] = (3 in parsedVal) ? (parsedVal[3] / 255) : 1
			return parsedVal
		}
	} else if (value.slice(0, 5) === "rgba(") {
		return value.slice(5, -1)
			.split(",")
			.map(v => parseFloat(v))
			.slice(0,4)
	} else if (value.slice(0, 4) === "rgb(") {
		return value.slice(4, -1)
			.split(",")
			.map(v => parseFloat(v))
			.slice(0,3)
			.concat([1])
	}
}

class CanvasEventTarget {
	// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget
	#events = {}

	// EventTarget.addEventListener()
	// Registers an event handler of a specific event type on the EventTarget.
	addEventListener(eventName, callback) {
		if (!(callback instanceof Function)) return;

		if (!this.#events[eventName])
			this.#events[eventName] = []
		this.#events[eventName].push(callback)
	}

	// EventTarget.removeEventListener()
	// Removes an event listener from the EventTarget.
	removeEventListener(eventName, callback) {
		if (!(callback instanceof Function)) return;

		const eventList = this.#events[eventName]
		if (!eventList) return;

		if (!eventList.includes(callback)) return;

		this.#events[eventName] = eventList
			.filter(existingCallback => existingCallback !== callback)
	}

	// EventTarget.dispatchEvent()
	// Dispatches an event to this EventTarget.
	dispatchEvent(event) {
		if (!this.#events[event.type])
			return true
		this.#events[event.type]
		.forEach(callback => {
			callback.call(this, event)
		})
		return !event.defaultPrevented;
	}
}

class COMTokenList {
	constructor(source = []) {
		return new Proxy(this, {
			get(target, key) {
				if (key === "length")
					return source.length
				if (key === "value")
					return source.join(" ")
				if (key === Symbol.iterator)
					return function* () {
						for (const value of source) {
							yield value
						}
					}
				if (!isNaN(key))
					return source[key]
				if (key in target)
					return target[key](source)
			}
		})
	}
	item(source) {
		return index => source[index]
	}
	contains(source) {
		return token => source.includes(token.toString())
	}
	add(source) {
		return (...tokens) => {
			tokens.forEach(token => {
				const tokenString = token.toString()
				if (source.includes(tokenString))
					return;
				source.push(tokenString)
			})
		}
	}
	remove(source) {
		return (...tokens) => {
			tokens.forEach(token => {
				const tokenString = token.toString()
				const index = source.indexOf(tokenString)
				if (index === -1)
					return;
				source.splice(index, 1)
			})
		}
	}
	replace(source) {
		return (oldToken, newToken) => {
			const index = source.indexOf(oldToken.toString())
			if (index === -1)
				return;
			source.splice(index, 1, newToken.toString())
		}
	}
	supports(source) {
		return (token) => {
			throw new Error(`Failed to execute 'supports' on 'COMTokenList': COMTokenList has no supported tokens.`)
		}
	}
	toggle(source) {
		return (token, force) => {
			const tokenString = token.toString()
			if (source.includes(tokenString)) {
				if (force !== true) {
					const index = source.indexOf(tokenString)
					source.splice(index, 1)
					return false
				}
				return true
			}
			if (force !== false) {
				source.push(tokenString)
				return true
			}
			return false
		}
	}
	entries(source) {
		return () => ({
			[Symbol.iterator]: function* () {
				for (const index in source) {
					yield [parseInt(index), source[index]]
				}
			}
		})
	}
	keys(source) {
		return () => ({
			[Symbol.iterator]: function* () {
				for (const index in source) {
					yield parseInt(index)
				}
			}
		})
	}
	values(source) {
		return () => ({
			[Symbol.iterator]: function* () {
				for (const value of source) {
					yield value
				}
			}
		})
	}
	forEach(source) {
		return callback => source.forEach(callback)
	}
}

class CanvasNodeList {
	constructor(source = []) {
		return new Proxy(this, {
			get(target, key) {
				if (key === "length")
					return source.length
				if (key === Symbol.iterator)
					return function* () {
						for (const value of source) {
							yield value
						}
					}
				if (!isNaN(key))
					return source[key]
				if (key in target)
					return target[key](source)
			}
		})
	}
	item(source) {
		return index => source[index]
	}
	entries(source) {
		return () => ({
			[Symbol.iterator]: function* () {
				for (const index in source) {
					yield [parseInt(index), source[index]]
				}
			}
		})
	}
	keys(source) {
		return () => ({
			[Symbol.iterator]: function* () {
				for (const index in source) {
					yield parseInt(index)
				}
			}
		})
	}
	values(source) {
		return () => ({
			[Symbol.iterator]: function* () {
				for (const value of source) {
					yield value
				}
			}
		})
	}
	forEach(source) {
		return callback => source.forEach(callback)
	}
}

class CanvasHTMLCollection {
	constructor(source) {
		const isCanvasElement = node => node instanceof CanvasElement
		const getElements = source instanceof Function
			? () => [...source()].filter(isCanvasElement)
			: () =>
				[...source].filter(isCanvasElement)
		const item = index =>
			getElements()[index]
		const namedItem = name =>
			getElements().find(element => element.id === name)

		return new Proxy(this, {
			get(target, key) {
				if (key === "length")
					return getElements().length
				if (key === Symbol.iterator)
					return function* () {
						for (const value of getElements()) {
							yield value
						}
					}
				if (key === "item")
					return item
				if (key === "namedItem")
					return namedItem
				if (key === Symbol.isConcatSpreadable)
					return true
				if (!isNaN(key))
					return getElements()[key]
			}
		})
	}
}


class CanvasNode extends CanvasEventTarget {
	// https://developer.mozilla.org/en-US/docs/Web/API/Node

	#system = null
	constructor(com, nodeName, systemSetter) {
		super(com)
		this.#document = com
		this.#nodeName = nodeName
		this.#system = systemSetter(this, {
			parentNode: (node) => {
				// console.log('set parent', this, node)
				this.#parentNode = node
			}
		})
	}
	// Node.baseURI (Read only)
	// Returns a DOMString representing the base URL of the document containing the Node.
	get baseURI() {
		// TODO: implemenet this
		console.warn("baseURI not yet implemented")
		return ""
	}

	// Node.childNodes (Read only)
	// Returns a live NodeList containing all the children of this node (including elements, text and comments). NodeList being live means that if the children of the Node change, the NodeList object is automatically updated.
	#childNodes = []
	#childNodeList = new CanvasNodeList(this.#childNodes)
	get childNodes() {
		return this.#childNodeList
	}

	// Node.firstChild (Read only)
	// Returns a Node representing the first direct child node of the node, or null if the node has no child.
	get firstChild() {
		if (this.#childNodes.length === 0)
			return null
		return this.#childNodes[0]
	}

	// Node.isConnected (Read only)
	// A boolean indicating whether or not the Node is connected (directly or indirectly) to the context object, e.g. the Document object in the case of the normal DOM, or the ShadowRoot in the case of a shadow DOM.
	get isConnected() {
		if (this.parentNode)
			return this.parentNode.isConnected
		// TODO: Check if this is top node (body), then check if the canvas is connected
		if (this.nodeType === 9)
			return true
		return false
	}

	// Node.lastChild (Read only)
	// Returns a Node representing the last direct child node of the node, or null if the node has no child.
	get lastChild() {
		if (this.#childNodes.length === 0)
			return null
		return this.#childNodes[this.#childNodes.length-1]
	}

	// Node.nextSibling (Read only)
	// Returns a Node representing the next node in the tree, or null if there isn't such node.
	get nextSibling() {
		if (!this.parentNode)
			return null
		const siblings = [...this.parentNode.childNodes]
		const index = siblings.indexOf(this)
		if (index === -1)
			return null // TODO: this shouldn't happen, throw error?
		const nextIndex = index+1
		if (nextIndex >= siblings.length)
			return null
		return siblings[nextIndex]
	}

	// Node.previousSibling (Read only)
	// Returns a Node representing the previous node in the tree, or null if there isn't such node.
	get previousSibling() {
		if (!this.parentNode)
			return null
		const siblings = [...this.parentNode.childNodes]
		const index = siblings.indexOf(this)
		if (index === -1)
			return null // TODO: this shouldn't happen, throw error?
		const prevIndex = index-1
		if (prevIndex < 0)
			return null
		return siblings[prevIndex]
	}

	// Node.nodeName (Read only)
	// Returns a DOMString containing the name of the Node. The structure of the name will differ with the node type. E.g. An HTMLElement will contain the name of the corresponding tag, like 'audio' for an HTMLAudioElement, a Text node will have the '#text' string, or a Document node will have the '#document' string.
	#nodeName = ""
	get nodeName() {
		return this.#nodeName
	}

	// Node.nodeType (Read only)
	// Returns an unsigned short representing the type of the node. Possible values are:
	//Value Name
	// ----|-----
	// 1	ELEMENT_NODE
	// 2	ATTRIBUTE_NODE
	// 3	TEXT_NODE
	// 4	CDATA_SECTION_NODE
	// 5	ENTITY_REFERENCE_NODE
	// 6	ENTITY_NODE
	// 7	PROCESSING_INSTRUCTION_NODE
	// 8	COMMENT_NODE
	// 9	DOCUMENT_NODE
	// 10	DOCUMENT_TYPE_NODE
	// 11	DOCUMENT_FRAGMENT_NODE
	// 12	NOTATION_NODE
	get nodeType() {
		// TODO: return properly for document node
		// TODO: other node types?  text?
		return 1
	}

	// Node.nodeValue
	// Returns / Sets the value of the current node.
	get nodeValue() {
		// TODO: get / set text for text node
		return null
	}

	// Node.ownerDocument (Read only)
	// Returns the Document that this node belongs to. If the node is itself a document, returns null.
	#document = null
	get ownerDocument() {
		if (this === this.#document)
			return null
		return this.#document
	}

	// Node.parentNode (Read only)
	// Returns a Node that is the parent of this node. If there is no such node, like if this node is the top of the tree or if doesn't participate in a tree, this property returns null.
	#parentNode = null
	get parentNode() {
		return this.#parentNode
	}

	// Node.parentElement (Read only)
	// Returns an Element that is the parent of this node. If the node has no parent, or if that parent is not an Element, this property returns null.
	get parentElement() {
		if (this.#parentNode instanceof CanvasElement)
			return this.#parentNode
		return null
	}

	// Node.textContent
	// Returns / Sets the textual content of an element and all its descendants.
	get textContent() {
		// TODO: implemenet something for this?
		console.warn("textContent not yet implemented")
		return ""
	}


	// Node.appendChild(childNode)
	// Adds the specified childNode argument as the last child to the current node.
	// If the argument referenced an existing node on the DOM tree, the node will be detached from its current position and attached at the new position.
	appendChild(childNode) {
		if (!(childNode instanceof CanvasNode))
			throw new Error(`Failed to execute 'appendChild' on 'CanvasNode': parameter 1 is not of type 'CanvasNode'.`)
		if (childNode.parentNode)
			childNode.parentNode.removeChild(childNode)
		this.#childNodes.push(childNode)
		this.#system(childNode, 'parentNode', this)
		return childNode
	}

	// Node.cloneNode()
	// Clone a Node, and optionally, all of its contents. By default, it clones the content of the node.
	cloneNode(deep) {
		// TODO: implemenet this
		console.warn("cloneNode not yet implemented")
		return new CanvasNode()
	}

	// Node.compareDocumentPosition()
	// Compares the position of the current node against another node in any other document.
	compareDocumentPosition(otherNode) {
		// TODO: implemenet this
		console.warn("compareDocumentPosition not yet implemented")
		return 0
	}

	// Node.contains()
	// Returns a Boolean value indicating whether or not a node is a descendant of the calling node.
	contains(otherNode) {
		if (this.#childNodes.includes(otherNode))
			return true
		return this.#childNodes.some(childNode => childNode.contains(otherNode))
	}

	// Node.getBoxQuads()
	// Returns a list of the node's CSS boxes relative to another node.
	getBoxQuads() {
		// TODO: experimental: implemenet this
		console.warn("getBoxQuads not yet implemented")
	}

	// Node.getRootNode()
	// Returns the context object's root which optionally includes the shadow root if it is available.
	getRootNode() {
		if (this.#parentNode)
			return this.#parentNode.getRootNode()
		return this
	}

	// Node.hasChildNodes()
	// Returns a Boolean indicating whether or not the element has any child nodes.
	hasChildNodes() {
		return this.#childNodes.length !== 0
	}

	// Node.insertBefore()
	// Inserts a Node before the reference node as a child of a specified parent node.
	insertBefore(newChild, existingChild) {
		if (!(newChild instanceof CanvasNode))
			throw new Error(`Failed to execute 'insertBefore' on 'CanvasNode': parameter 1 is not of type 'CanvasNode'.`)
		if (existingChild.parentNode !== this)
			throw new Error(`Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node.`)
		const existingIndex = this.#childNodes.indexOf(existingChild)
		if (existingIndex === -1)
			throw new Error(`Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node.`)
		if (newChild.parentNode)
			newChild.parentNode.removeChild(newChild)
		this.#childNodes.splice(existingIndex, 0, newChild)
		return newChild
	}

	// Node.isDefaultNamespace()
	// Accepts a namespace URI as an argument and returns a Boolean with a value of true if the namespace is the default namespace on the given node or false if not.
	isDefaultNamespace() {
		// TODO: implemenet this
		console.warn("isDefaultNamespace not yet implemented")
		return false
	}

	// Node.isEqualNode()
	// Returns a Boolean which indicates whether or not two nodes are of the same type and all their defining data points match.
	isEqualNode() {
		// TODO: implemenet this
		console.warn("isEqualNode not yet implemented")
		return false
	}

	// Node.isSameNode()
	// Returns a Boolean value indicating whether or not the two nodes are the same (that is, they reference the same object).
	isSameNode(otherNode) {
		return this === otherNode
	}

	// Node.lookupPrefix()
	// Returns a DOMString containing the prefix for a given namespace URI, if present, and null if not. When multiple prefixes are possible, the result is implementation-dependent.
	lookupPrefix() {
		// TODO: implemenet this
		console.warn("lookupPrefix not yet implemented")
		return ""
	}

	// Node.lookupNamespaceURI()
	// Accepts a prefix and returns the namespace URI associated with it on the given node if found (and null if not). Supplying null for the prefix will return the default namespace.
	lookupNamespaceURI() {
		// TODO: implemenet this
		console.warn("lookupNamespaceURI not yet implemented")
		return null
	}

	// Node.normalize()
	// Clean up all the text nodes under this element (merge adjacent, remove empty).
	normalize() {
		// TODO: implemenet this
		console.warn("normalize not yet implemented")
	}

	// Node.removeChild()
	// Removes a child node from the current element, which must be a child of the current node.
	removeChild(childNode) {
		if (!(childNode instanceof CanvasNode))
			throw new Error(`Failed to execute 'removeChild' on 'CanvasNode': parameter 1 is not of type 'CanvasNode'.`)
		if (childNode.parentNode !== this)
			throw new Error(`Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.`)
		const existingIndex = this.#childNodes.indexOf(childNode)
		if (existingIndex === -1)
			throw new Error(`Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.`)
		this.#childNodes.splice(existingIndex, 1)
		this.#system(childNode, 'parentNode', null)
		return childNode
	}

	// Node.replaceChild()
	// Replaces one child Node of the current one with the second one given in parameter.
	replaceChild(newChild, oldChild) {
		if (!(newChild instanceof CanvasNode))
			throw new Error(`Failed to execute 'replaceChild' on 'CanvasNode': parameter 1 is not of type 'CanvasNode'.`)
		if (!(oldChild instanceof CanvasNode))
			throw new Error(`Failed to execute 'replaceChild' on 'CanvasNode': parameter 2 is not of type 'CanvasNode'.`)
		if (oldChild.parentNode !== this)
			throw new Error(`Failed to execute 'replaceChild' on 'Node': The node to be replaced is not a child of this node.`)
		const existingIndex = this.#childNodes.indexOf(oldChild)
		if (existingIndex === -1)
			throw new Error(`Failed to execute 'replaceChild' on 'Node': The node to be replaced is not a child of this node.`)
		if (newChild.parentNode)
			newChild.parentNode.removeChild(newChild)
		this.#childNodes.splice(existingIndex, 1, newChild)
		return oldChild
	}

	// Obsolete methods

	// Node.getUserData()
	// Allows a user to get some DOMUserData from the node.

	// Node.hasAttributes()
	// Returns a Boolean indicating if the element has any attributes, or not.

	// Node.isSupported()
	// Returns a Boolean flag containing the result of a test whether the DOM implementation implements a specific feature and this feature is supported by the specific node.

	// Node.setUserData()
	// Allows a user to attach, or remove, DOMUserData to the node.
}

class CanvasElement extends CanvasNode {
	// https://developer.mozilla.org/en-US/docs/Web/API/Element
	constructor(com, tagName, systemSetter) {
		super(com, tagName, systemSetter)
		this.#tagName = tagName
		this.#system = systemSetter(this, {
			clearBounds: () => {
				this.#boundingClientRect = null
			}
		})
	}
	#system = null
	// Element.assignedSlot (Read only)
	// Returns a HTMLSlotElement representing the <slot> the node is inserted in.
	get assignedSlot() {
		// TODO: implemenet this
		console.warn("assignedSlot not yet implemented")
		return null
	}

	// Element.attributes (Read only)
	// Returns a NamedNodeMap object containing the assigned attributes of the corresponding HTML element.
	get attributes() {
		// TODO: implemenet this
		console.warn("attributes not yet implemented")
		// return null
	}

	// Element.childElementCount (Read only)
	// Returns the number of child elements of this element.
	get childElementCount() {
		return this.#children.length
	}

	// Element.children (Read only)
	// Returns the child elements of this element.
	#children = new CanvasHTMLCollection(this.childNodes)
	get children() {
		return this.#children
	}

	// Element.classList (Read only)
	// Returns a DOMTokenList containing the list of class attributes.
	#classList = []
	#classTokenList = new COMTokenList(this.#classList)
	get classList() {
		return this.#classTokenList
	}

	// Element.className
	// Is a DOMString representing the class of the element.
	get className() {
		return this.#classTokenList.value
	}
	set className(newValue) {
		const newList = newValue.toString().trim().split(/\s+/);
		[...this.#classList].forEach(oldItem => {
			if (!newList.includes(oldItem))
				this.#classTokenList.remove(oldItem)
		})
		newList.forEach(newItem => {
			if (!this.#classTokenList.contains(newItem))
				this.#classTokenList.add(newItem)
		})
	}

	// TODO: ensure these return proper values

	// Element.clientHeight (Read only)
	// Returns a Number representing the inner height of the element.
	get clientHeight() {
		// TODO: implemenet this
		console.warn("clientHeight not yet implemented")
		return 0
	}

	// Element.clientLeft (Read only)
	// Returns a Number representing the width of the left border of the element.
	get clientLeft() {
		// TODO: implemenet this
		console.warn("clientLeft not yet implemented")
		return 0
	}

	// Element.clientTop (Read only)
	// Returns a Number representing the width of the top border of the element.
	get clientTop() {
		// TODO: implemenet this
		console.warn("clientTop not yet implemented")
		return 0
	}

	// Element.clientWidth (Read only)
	// Returns a Number representing the inner width of the element.
	get clientWidth() {
		// TODO: implemenet this
		console.warn("clientWidth not yet implemented")
		return 0
	}

	// Element.firstElementChild (Read only)
	// Returns the first child element of this element.
	get firstElementChild() {
		if (this.childElementCount === 0)
			return null
		return this.#children[0]
	}

	// Element.id
	// Is a DOMString representing the id of the element.
	#id = ""
	get id() {
		return this.#id
	}
	set id(newValue) {
		this.#id = newValue.toString()
	}

	// Element.innerHTML
	// Is a DOMString representing the markup of the element's content.
	get innerHTML() {
		// TODO: implemenet this
		console.warn("innerHTML not yet implemented")
		return ""
	}
	set innerHTML(newValue) {
		// TODO: implemenet this
		console.warn("innerHTML not yet implemented")
	}

	// Element.lastElementChild (Read only)
	// Returns the last child element of this element.
	get lastElementChild() {
		const elCount = this.childElementCount
		if (elCount === 0)
			return null
		return this.#children[elCount-1]
	}

	// Element.localName (Read only)
	// A DOMString representing the local part of the qualified name of the element.
	get localName() {
		// TODO: implemenet this
		console.warn("localName not yet implemented")
		return ""
	}

	// Element.namespaceURI (Read only)
	// The namespace URI of the element, or null if it is no namespace.
	// Note: In Firefox 3.5 and earlier, HTML elements are in no namespace. In later versions, HTML elements are in the http://www.w3.org/1999/xhtml namespace in both HTML and XML trees.
	get namespaceURI() {
		// TODO: implemenet this
		console.warn("namespaceURI not yet implemented")
		return ""
	}

	// Element.nextElementSibling (Read only)
	// Is an Element, the element immediately following the given one in the tree, or null if there's no sibling node.
	get nextElementSibling() {
		if (!this.parentElement)
			return null
		const siblings = [...this.parentElement.children]
		const index = siblings.indexOf(this)
		if (index === -1)
			return null // TODO: this shouldn't happen, throw error?
		const nextIndex = index+1
		if (nextIndex >= siblings.length)
			return null
		return siblings[nextIndex]
	}

	// Element.previousElementSibling (Read only)
	// Is a Element, the element immediately preceding the given one in the tree, or null if there is no sibling element.
	get previousSibling() {
		if (!this.parentElement)
			return null
		const siblings = [...this.parentElement.children]
		const index = siblings.indexOf(this)
		if (index === -1)
			return null // TODO: this shouldn't happen, throw error?
		const prevIndex = index-1
		if (prevIndex < 0)
			return null
		return siblings[prevIndex]
	}

	// Element.outerHTML
	// Is a DOMString representing the markup of the element including its content. When used as a setter, replaces the element with nodes parsed from the given string.
	get outerHTML() {
		// TODO: implemenet this
		console.warn("outerHTML not yet implemented")
		return ""
	}

	// Element.part
	// Represents the part identifier(s) of the element (i.e. set using the part attribute), returned as a DOMTokenList.
	get part() {
		// TODO: implemenet this
		console.warn("part not yet implemented")
	}
	set part(newValue) {
		// TODO: implemenet this
		console.warn("part not yet implemented")
	}

	// Element.prefix (Read only)
	// A DOMString representing the namespace prefix of the element, or null if no prefix is specified.
	get prefix() {
		// TODO: implemenet this
		console.warn("prefix not yet implemented")
		return ""
	}

	// Element.scrollHeight (Read only)
	// Returns a Number representing the scroll view height of an element.
	get scrollHeight() {
		// TODO: implemenet this
		console.warn("scrollHeight not yet implemented")
		return 0
	}

	// Element.scrollLeft
	// Is a Number representing the left scroll offset of the element.
	get scrollLeft() {
		// TODO: implemenet this
		console.warn("scrollLeft not yet implemented")
		return 0
	}
	set scrollLeft(newValue) {
		// TODO: implemenet this
		console.warn("scrollLeft not yet implemented")
	}

	// Element.scrollLeftMax (Read only)
	// Returns a Number representing the maximum left scroll offset possible for the element.
	get scrollLeftMax() {
		// TODO: implemenet this
		console.warn("scrollLeftMax not yet implemented")
		return 0
	}

	// Element.scrollTop
	// A Number representing number of pixels the top of the document is scrolled vertically.
	get scrollTop() {
		// TODO: implemenet this
		console.warn("scrollTop not yet implemented")
		return 0
	}
	set scrollTop(newValue) {
		// TODO: implemenet this
		console.warn("scrollTop not yet implemented")
	}

	// Element.scrollTopMax (Read only)
	// Returns a Number representing the maximum top scroll offset possible for the element.
	get scrollTopMax() {
		// TODO: implemenet this
		console.warn("scrollTopMax not yet implemented")
		return 0
	}

	// Element.scrollWidth (Read only)
	// Returns a Number representing the scroll view width of the element.
	get scrollWidth() {
		// TODO: implemenet this
		console.warn("scrollWidth not yet implemented")
		return 0
	}

	// Element.shadowRoot (Read only)
	// Returns the open shadow root that is hosted by the element, or null if no open shadow root is present.
	get shadowRoot() {
		// TODO: implemenet this
		console.warn("shadowRoot not yet implemented")
		return null
	}

	// Element.openOrClosedShadowRoot (Read only)
	// Returns the shadow root that is hosted by the element, regardless if its open or closed. Available only to WebExtensions.
	get openOrClosedShadowRoot() {
		// TODO: implemenet this
		console.warn("openOrClosedShadowRoot not yet implemented")
		return null
	}

	// Element.slot
	// Returns the name of the shadow DOM slot the element is inserted in.
	get slot() {
		// TODO: implemenet this
		console.warn("slot not yet implemented")
		return ""
	}
	set slot(newValue) {
		// TODO: implemenet this
		console.warn("slot not yet implemented")
	}

	// Element.tabStop
	// Is a Boolean indicating if the element can receive input focus via the tab key.
	get tabStop() {
		// TODO: implemenet this
		console.warn("tabStop not yet implemented")
		return false
	}
	set tabStop(newValue) {
		// TODO: implemenet this
		console.warn("tabStop not yet implemented")
	}

	// Element.tagName (Read only)
	// Returns a String with the name of the tag for the given element.
	#tagName = ""
	get tagName() {
		return this.#tagName
	}

	// Properties included from ARIA
	// The Element interface includes the following properties, defined on the ARIAMixin mixin.

		// Element.ariaAtomic
		// Is a DOMString reflecting the aria-atomic attribute, which indicates whether assistive technologies will present all, or only parts of, the changed region based on the change notifications defined by the aria-relevant attribute.

		// Element.ariaAutoComplete
		// Is a DOMString reflecting the aria-autocomplete attribute, which indicates whether inputting text could trigger display of one or more predictions of the user's intended value for a combobox, searchbox, or textbox and specifies how predictions would be presented if they were made.

		// Element.ariaBusy
		// Is a DOMString reflecting the aria-busy attribute, which indicates whether an element is being modified, as assistive technologies may want to wait until the modifications are complete before exposing them to the user.

		// Element.ariaChecked
		// Is a DOMString reflecting the aria-checked attribute, which indicates the current "checked" state of checkboxes, radio buttons, and other widgets that have a checked state.

		// Element.ariaColCount
		// Is a DOMString reflecting the aria-colcount attribute, which defines the number of columns in a table, grid, or treegrid.

		// Element.ariaColIndex
		// Is a DOMString reflecting the aria-colindex attribute, which defines an element's column index or position with respect to the total number of columns within a table, grid, or treegrid.

		// Element.ariaColIndexText
		// Is a DOMString reflecting the aria-colindextext attribute, which defines a human readable text alternative of aria-colindex.

		// Element.ariaColSpan
		// Is a DOMString reflecting the aria-colspan attribute, which defines the number of columns spanned by a cell or gridcell within a table, grid, or treegrid.

		// Element.ariaCurrent
		// Is a DOMString reflecting the aria-current attribute, which indicates the element that represents the current item within a container or set of related elements.

		// Element.ariaDescription
		// Is a DOMString reflecting the aria-description attribute, which defines a string value that describes or annotates the current element.

		// Element.ariaDisabled
		// Is a DOMString reflecting the aria-disabled attribute, which indicates that the element is perceivable but disabled, so it is not editable or otherwise operable.

		// Element.ariaExpanded
		// Is a DOMString reflecting the aria-expanded attribute, which indicates whether a grouping element owned or controlled by this element is expanded or collapsed.

		// Element.ariaHasPopup
		// Is a DOMString reflecting the aria-haspopup attribute, which indicates the availability and type of interactive popup element, such as menu or dialog, that can be triggered by an element.

		// Element.ariaHidden
		// Is a DOMString reflecting the aria-hidden attribute, which indicates whether the element is exposed to an accessibility API.

		// Element.ariaKeyShortcuts
		// Is a DOMString reflecting the aria-keyshortcuts attribute, which indicates keyboard shortcuts that an author has implemented to activate or give focus to an element.

		// Element.ariaLabel
		// Is a DOMString reflecting the aria-label attribute, which defines a string value that labels the current element.

		// Element.ariaLevel
		// Is a DOMString reflecting the aria-level attribute, which defines the hierarchical level of an element within a structure.

		// Element.ariaLive
		// Is a DOMString reflecting the aria-live attribute, which indicates that an element will be updated, and describes the types of updates the user agents, assistive technologies, and user can expect from the live region.

		// Element.ariaModal
		// Is a DOMString reflecting the aria-modal attribute, which indicates whether an element is modal when displayed.

		// Element.ariaMultiline
		// Is a DOMString reflecting the aria-multiline attribute, which indicates whether a text box accepts multiple lines of input or only a single line.

		// Element.ariaMultiSelectable
		// Is a DOMString reflecting the aria-multiselectable attribute, which indicates that the user may select more than one item from the current selectable descendants.

		// Element.ariaOrientation
		// Is a DOMString reflecting the aria-orientation attribute, which indicates whether the element's orientation is horizontal, vertical, or unknown/ambiguous.

		// Element.ariaPlaceholder
		// Is a DOMString reflecting the aria-placeholder attribute, which defines a short hint intended to aid the user with data entry when the control has no value.

		// Element.ariaPosInSet
		// Is a DOMString reflecting the aria-posinset attribute, which defines an element's number or position in the current set of listitems or treeitems.

		// Element.ariaPressed
		// Is a DOMString reflecting the aria-pressed attribute, which indicates the current "pressed" state of toggle buttons.

		// Element.ariaReadOnly
		// Is a DOMString reflecting the aria-readonly attribute, which indicates that the element is not editable, but is otherwise operable.

		// Element.ariaRelevant
		// Is a DOMString reflecting the aria-relevant attribute, which indicates what notifications the user agent will trigger when the accessibility tree within a live region is modified. This is used to describe what changes in an aria-live region are relevant and should be announced.

		// Element.ariaRequired
		// Is a DOMString reflecting the aria-required attribute, which indicates that user input is required on the element before a form may be submitted.

		// Element.ariaRoleDescription
		// Is a DOMString reflecting the aria-roledescription attribute, which defines a human-readable, author-localized description for the role of an element.

		// Element.ariaRowCount
		// Is a DOMString reflecting the aria-rowcount attribute, which defines the total number of rows in a table, grid, or treegrid.

		// Element.ariaRowIndex
		// Is a DOMString reflecting the aria-rowindex attribute, which defines an element's row index or position with respect to the total number of rows within a table, grid, or treegrid.

		// Element.ariaRowIndexText
		// Is a DOMString reflecting the aria-rowindextext attribute, which defines a human readable text alternative of aria-rowindex.

		// Element.ariaRowSpan
		// Is a DOMString reflecting the aria-rowspan attribute, which defines the number of rows spanned by a cell or gridcell within a table, grid, or treegrid.

		// Element.ariaSelected
		// Is a DOMString reflecting the aria-selected attribute, which indicates the current "selected" state of elements that have a selected state.

		// Element.ariaSetSize
		// Is a DOMString reflecting the aria-setsize attribute, which defines the number of items in the current set of listitems or treeitems.

		// Element.ariaSort
		// Is a DOMString reflecting the aria-sort attribute, which indicates if items in a table or grid are sorted in ascending or descending order.

		// Element.ariaValueMax
		// Is a DOMString reflecting the aria-valueMax attribute, which defines the maximum allowed value for a range widget.

		// Element.ariaValueMin
		// Is a DOMString reflecting the aria-valueMin attribute, which defines the minimum allowed value for a range widget.

		// Element.ariaValueNow
		// Is a DOMString reflecting the aria-valueNow attribute, which defines the current value for a range widget.

		// Element.ariaValueText
		// Is a DOMString reflecting the aria-valuetext attribute, which defines the human readable text alternative of aria-valuenow for a range widget.


	// Element.attachShadow()
	// Attaches a shadow DOM tree to the specified element and returns a reference to its ShadowRoot.
	attachShadow() {
		// TODO: implemenet this
		console.warn("attachShadow not yet implemented")
	}

	// Element.animate()
	// A shortcut method to create and run an animation on an element. Returns the created Animation object instance.
	animate() {
		// TODO: implemenet this
		console.warn("animate not yet implemented")
	}

	// Element.append()
	// Inserts a set of Node objects or DOMString objects after the last child of the element.
	append() {
		// TODO: implemenet this
		console.warn("append not yet implemented")
	}

	// Element.closest()
	// Returns the Element which is the closest ancestor of the current element (or the current element itself) which matches the selectors given in parameter.
	closest(selector) {
		if (this.matches(selector)) return this

		if (!this.parentElement) return null

		if (this.parentElement.matches(selector))
			return this.parentElement

		return this.parentElement.closest(selector)
	}

	// Element.createShadowRoot()
	// Creates a shadow DOM on the element, turning it into a shadow host. Returns a ShadowRoot.
	createShadowRoot() {
		// TODO: implemenet this
		console.warn("createShadowRoot not yet implemented")
	}

	// Element.computedStyleMap()
	// Returns a StylePropertyMapReadOnly interface which provides a read-only representation of a CSS declaration block that is an alternative to CSSStyleDeclaration.
	computedStyleMap() {
		// TODO: implemenet this
		console.warn("computedStyleMap not yet implemented")
	}

	// Element.getAnimations()
	// Returns an array of Animation objects currently active on the element.
	getAnimations() {
		// TODO: implemenet this
		console.warn("getAnimations not yet implemented")
	}

	// Element.getAttribute()
	// Retrieves the value of the named attribute from the current node and returns it as an Object.
	getAttribute(name) {
		// TODO: implemenet this
		console.warn("getAttribute not yet implemented")
		return undefined
	}

	// Element.getAttributeNames()
	// Returns an array of attribute names from the current element.
	getAttributeNames() {
		// TODO: implemenet this
		console.warn("getAttributeNames not yet implemented")
	}

	// Element.getAttributeNode()
	// Retrieves the node representation of the named attribute from the current node and returns it as an Attr.
	getAttributeNode() {
		// TODO: implemenet this
		console.warn("getAttributeNode not yet implemented")
	}

	// Element.getAttributeNodeNS()
	// Retrieves the node representation of the attribute with the specified name and namespace, from the current node and returns it as an Attr.
	getAttributeNodeNS() {
		// TODO: implemenet this
		console.warn("getAttributeNodeNS not yet implemented")
	}

	// Element.getAttributeNS()
	// Retrieves the value of the attribute with the specified name and namespace, from the current node and returns it as an Object.
	getAttributeNS() {
		// TODO: implemenet this
		console.warn("getAttributeNS not yet implemented")
	}

	// Element.getBoundingClientRect()
	// Returns the size of an element and its position relative to the viewport.
	getBoundingClientRect() {
		if (!this.#boundingClientRect)
			this.#boundingClientRect = this.#getBoundingClientRect()
		return this.#boundingClientRect
	}
	#boundingClientRect = null
	#getBoundingClientRect = () => {
		const parentBounds = (this.parentElement && this.parentElement.getBoundingClientRect()) || {
			x: this.ownerDocument.offsetLeft,
			y: this.ownerDocument.offsetTop,
			width: this.ownerDocument.offsetWidth,
			height: this.ownerDocument.offsetHeight,
		}
		const style = this.style
		const { width, height } = {
			width: style.width || 0,
			height: style.height || 0,
		}
		let x = 0
		let y = 0
		if ((style.right === undefined || style.right === 'auto') && !(style.left === undefined || style.left === 'auto'))
			x = style.left
		else if (!(style.right === undefined || style.right === 'auto') && (style.left === undefined || style.left === 'auto'))
			x = parentBounds.width - (style.right + width)
		else if (!(style.right === undefined || style.right === 'auto') && !(style.left === undefined || style.left === 'auto'))
			x = style.left + (((parentBounds.width - style.left - style.right) - width) / 2)

		if ((style.bottom === undefined || style.bottom === 'auto') && !(style.top === undefined || style.top === 'auto'))
			y = style.top
		else if (!(style.bottom === undefined || style.bottom === 'auto') && (style.top === undefined || style.top === 'auto'))
			y = parentBounds.height - (style.bottom + height)
		else if (!(style.bottom === undefined || style.bottom === 'auto') && !(style.top === undefined || style.top === 'auto'))
			y = style.top + (((parentBounds.height - style.top - style.bottom) - height) / 2)

		x += parentBounds.x
		y += parentBounds.y

		return {
			x,y,
			top: y, left: x,
			width, height,
			offsetWidth: width,
			offsetHeight: height
		}
	}

	// Element.getClientRects()
	// Returns a collection of rectangles that indicate the bounding rectangles for each line of text in a client.
	getClientRects() {
		// TODO: implemenet this
		console.warn("getClientRects not yet implemented")
	}

	// Element.getElementsByClassName()
	// Returns a live HTMLCollection that contains all descendants of the current element that possess the list of classes given in the parameter.
	getElementsByClassName() {
		// TODO: implemenet this
		console.warn("getElementsByClassName not yet implemented")
	}

	// Element.getElementsByTagName()
	// Returns a live HTMLCollection containing all descendant elements, of a particular tag name, from the current element.
	getElementsByTagName(tagNameSelector) {
		return new CanvasHTMLCollection(() => {
			const children = [...this.children]
			return children.filter(({ tagName }) => tagName === tagNameSelector)
				.concat(...children.map(child => child.getElementsByTagName(tagNameSelector)))
		})
	}

	// Element.getElementsByTagNameNS()
	// Returns a live HTMLCollection containing all descendant elements, of a particular tag name and namespace, from the current element.
	getElementsByTagNameNS() {
		// TODO: implemenet this
		console.warn("getElementsByTagNameNS not yet implemented")
	}

	// Element.hasAttribute()
	// Returns a Boolean indicating if the element has the specified attribute or not.
	hasAttribute() {
		// TODO: implemenet this
		console.warn("hasAttribute not yet implemented")
	}

	// Element.hasAttributeNS()
	// Returns a Boolean indicating if the element has the specified attribute, in the specified namespace, or not.
	hasAttributeNS() {
		// TODO: implemenet this
		console.warn("hasAttributeNS not yet implemented")
	}

	// Element.hasAttributes()
	// Returns a Boolean indicating if the element has one or more HTML attributes present.
	hasAttributes() {
		// TODO: implemenet this
		console.warn("hasAttributes not yet implemented")
	}

	// Element.hasPointerCapture()
	// Indicates whether the element on which it is invoked has pointer capture for the pointer identified by the given pointer ID.
	hasPointerCapture() {
		// TODO: implemenet this
		console.warn("hasPointerCapture not yet implemented")
	}

	// Element.insertAdjacentElement()
	// Inserts a given element node at a given position relative to the element it is invoked upon.
	insertAdjacentElement() {
		// TODO: implemenet this
		console.warn("insertAdjacentElement not yet implemented")
	}

	// Element.insertAdjacentHTML()
	// Parses the text as HTML or XML and inserts the resulting nodes into the tree in the position given.
	insertAdjacentHTML() {
		// TODO: implemenet this
		console.warn("insertAdjacentHTML not yet implemented")
	}

	// Element.insertAdjacentText()
	// Inserts a given text node at a given position relative to the element it is invoked upon.
	insertAdjacentText() {
		// TODO: implemenet this
		console.warn("insertAdjacentText not yet implemented")
	}

	// Element.matches()
	// Returns a Boolean indicating whether or not the element would be selected by the specified selector string.
	matches(selector) {
		selector = selector.trim()
		// console.log('mat', JSON.stringify(selector))
		if (this.tagName === selector) return true

		const validWord = '[a-zA-Z_][a-zA-Z0-9_-]+'
		const stringDef = `([0-9]+)|(${validWord})|("[^"]*")|('[^']*')`
		const selectorParts = {
			id: `\\#${validWord}`,
			class: `\\.${validWord}`,
			attr: `\\[(${validWord})=(${stringDef})\\]`,
			tag: validWord
		}
		const dat = {
			attr: [],
			tag: [],
			id: [],
			class: [],
		}

		let parts = [selector]
		const mapper = type => part => {
			const matches = part.matchAll(new RegExp(selectorParts[type], 'g'))
			const ret = []
			let rest = part
			let i = 0
			for (const match of matches) {
				dat[type].push(match[0])
				const r = rest.slice(0, match.index-i)
				if (r) ret.push(r)
				const ni = match.index + match[0].length
				rest = rest.slice(ni-i)
				i = ni
			}
			if (rest)
				ret.push(rest)
			return ret
		}

		parts = [].concat(...parts.map(mapper('attr')))

		parts = [].concat(...parts.map(mapper('id')))

		parts = [].concat(...parts.map(mapper('class')))

		parts = [].concat(...parts.map(mapper('tag')))

		if (parts.length)
			console.warn(`Query Selector parts not implemented: "${parts.join('", "')}"`)

		if (dat.tag.length && dat.tag[0] !== this.tagName)
			return false

		if (dat.id.length && dat.id[0].slice(1) !== this.id)
			return false

		if (dat.class.length && !dat.class.every(cl => this.classList.contains(cl.slice(1))))
			return false

		if (dat.attr.length && !dat.attr.every(attr => {
			const match = attr.match(new RegExp(selectorParts.attr))
			if (!match) {
				// TODO: throw error?
				return false
			}
			const name = match[1]
			const valFull = match[2]
			const val = (
				(valFull[0] === '"' && valFull[valFull.length-1] === '"' ) ||
				(valFull[0] === "'" && valFull[valFull.length-1] === "'" ))
				? valFull.slice(1,-1)
				: valFull
			return this.getAttribute(name) === val
		}))
			return false

		return true
	}

	// Element.prepend()
	// Inserts a set of Node objects or DOMString objects before the first child of the element.
	prepend() {
		// TODO: implemenet this
		console.warn("prepend not yet implemented")
	}

	// Element.querySelector()
	// Returns the first Node which matches the specified selector string relative to the element.
	querySelector() {
		// TODO: implemenet this
		console.warn("querySelector not yet implemented")
	}

	// Element.querySelectorAll()
	// Returns a NodeList of nodes which match the specified selector string relative to the element.
	querySelectorAll(selector) {
		const initSelector = selector
		const validWord = '[a-zA-Z_][a-zA-Z0-9_-]+'
		const stringDef = `${validWord}|"[^"]*"|'[^']*'`
		const elementSelectorPart = `(\\#${validWord})|(\\.${validWord})|(\\[${validWord}=(${stringDef})\\])|(${validWord})`
		const elementSelector = `(${elementSelectorPart})+`
		if (!selector.match(/^\s*\:scope[^a-z0-9_-]/))
			selector = `:scope ${selector}`
		selector = selector.slice(selector.indexOf(':scope')+6)
		const nextSelector = selector.match(new RegExp(elementSelector))
		const nextSelectorString = nextSelector[0]
		const nextSelectorIndex = nextSelector.index
		const operator = selector.slice(0, nextSelectorIndex).trim()

		const _this = this
		switch (operator) {
			case '': {
				const children = [...this.children]
				// console.log()
				const nextMatches = children
					.filter(child => child.matches(nextSelectorString))
					.concat(...children.map(child => child.querySelectorAll(`:scope ${nextSelectorString}`)))
				const remainder = selector.slice(nextSelectorIndex+nextSelectorString.length).trim()
				if (!remainder)
					return nextMatches

				// console.log(initSelector, selector, JSON.stringify(remainder))
				return [].concat(...nextMatches.map(child => child.querySelectorAll(`:scope ${remainder}`)))
			}
			case '>': {
				// console.log(this.tagName,[...this.children])
				const children = [...this.children]
				// console.log()
				const nextMatches = children
					.filter(child => child.matches(nextSelectorString))

				const remainder = selector.slice(nextSelectorIndex+nextSelectorString.length).trim()
				if (!remainder)
					return nextMatches

				// console.log(initSelector, selector, JSON.stringify(remainder))
				return [].concat(...nextMatches.map(child => child.querySelectorAll(`:scope ${remainder}`)))
			}
			default:
				console.warn(`Query Selector Operator not supported: "${operator}"`, initSelector)
				return []
		}
		console.log(selector, nextSelectorString, JSON.stringify(operator))
		// TODO: implemenet this
		console.warn("querySelectorAll not yet implemented")
		// console.log(selector, this, )
		return []
	}

	// Element.releasePointerCapture()
	// Releases (stops) pointer capture that was previously set for a specific pointer event.
	releasePointerCapture() {
		// TODO: implemenet this
		console.warn("releasePointerCapture not yet implemented")
	}

	// Element.remove()
	// Removes the element from the children list of its parent.
	remove() {
		// // TODO: implemenet this
		// console.warn("remove not yet implemented")
		if (!this.parentNode) return;

		this.parentNode.removeChild(this)
	}

	// Element.removeAttribute()
	// Removes the named attribute from the current node.
	removeAttribute() {
		// TODO: implemenet this
		console.warn("removeAttribute not yet implemented")
	}

	// Element.removeAttributeNode()
	// Removes the node representation of the named attribute from the current node.
	removeAttributeNode() {
		// TODO: implemenet this
		console.warn("removeAttributeNode not yet implemented")
	}

	// Element.removeAttributeNS()
	// Removes the attribute with the specified name and namespace, from the current node.
	removeAttributeNS() {
		// TODO: implemenet this
		console.warn("removeAttributeNS not yet implemented")
	}

	// Element.replaceChildren()
	// Replaces the existing children of a Node with a specified new set of children.
	replaceChildren() {
		// TODO: implemenet this
		console.warn("replaceChildren not yet implemented")
	}

	// Element.replaceWith()
	// Replaces the element in the children list of its parent with a set of Node or DOMString objects.
	replaceWith() {
		// TODO: implemenet this
		console.warn("replaceWith not yet implemented")
	}

	// Element.requestFullscreen()
	// Asynchronously asks the browser to make the element full-screen.
	requestFullscreen() {
		// TODO: implemenet this
		console.warn("requestFullscreen not yet implemented")
	}

	// Element.requestPointerLock()
	// Allows to asynchronously ask for the pointer to be locked on the given element.
	requestPointerLock() {
		// TODO: implemenet this
		console.warn("requestPointerLock not yet implemented")
	}

	// Element.scroll()
	// Scrolls to a particular set of coordinates inside a given element.
	scroll() {
		// TODO: implemenet this
		console.warn("scroll not yet implemented")
	}

	// Element.scrollBy()
	// Scrolls an element by the given amount.
	scrollBy() {
		// TODO: implemenet this
		console.warn("scrollBy not yet implemented")
	}

	// Element.scrollIntoView()
	// Scrolls the page until the element gets into the view.
	scrollIntoView() {
		// TODO: implemenet this
		console.warn("scrollIntoView not yet implemented")
	}

	// Element.scrollTo()
	// Scrolls to a particular set of coordinates inside a given element.
	scrollTo() {
		// TODO: implemenet this
		console.warn("scrollTo not yet implemented")
	}

	// Element.setAttribute()
	// Sets the value of a named attribute of the current node.
	setAttribute() {
		// TODO: implemenet this
		console.warn("setAttribute not yet implemented")
	}

	// Element.setAttributeNode()
	// Sets the node representation of the named attribute from the current node.
	setAttributeNode() {
		// TODO: implemenet this
		console.warn("setAttributeNode not yet implemented")
	}

	// Element.setAttributeNodeNS()
	// Sets the node representation of the attribute with the specified name and namespace, from the current node.
	setAttributeNodeNS() {
		// TODO: implemenet this
		console.warn("setAttributeNodeNS not yet implemented")
	}

	// Element.setAttributeNS()
	// Sets the value of the attribute with the specified name and namespace, from the current node.
	setAttributeNS() {
		// TODO: implemenet this
		console.warn("setAttributeNS not yet implemented")
	}

	// Element.setCapture()
	// Sets up mouse event capture, redirecting all mouse events to this element.
	setCapture() {
		// TODO: implemenet this
		console.warn("setCapture not yet implemented")
	}

	// Element.setPointerCapture()
	// Designates a specific element as the capture target of future pointer events.
	setPointerCapture() {
		// TODO: implemenet this
		console.warn("setPointerCapture not yet implemented")
	}

	// Element.toggleAttribute()
	// Toggles a boolean attribute, removing it if it is present and adding it if it is not present, on the specified element.
	toggleAttribute() {
		// TODO: implemenet this
		console.warn("toggleAttribute not yet implemented")
	}
}

class CanvasHTMLElement extends CanvasElement {
	// https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	constructor(com, tagName, markForRender, systemSetter) {
		super(com, tagName, systemSetter)
		this.#markForRender = markForRender
	}

	#markForRender = () => {}
	// ElementCSSInlineStyle.style
	// Is a CSSStyleDeclaration, an object representing the declarations of an element's style attributes.
	#style = {
		top: undefined,
		left: undefined,
		bottom: undefined,
		right: undefined,

		width: undefined,
		height: undefined,

		border: undefined,
		background: undefined,

		zIndex: 0,
		color: undefined,
		opacity: undefined
	}
	style = new Proxy(this.#style, {
		set: (target, name, value, reciever) => {
			const originalValue = target[name]
			if (originalValue !== value) {
				if (name === "opacity" && typeof value === "number") {
					target[name] = Math.min(Math.max(value, 0), 1)
				} else {
				// if (name === "color" && typeof value === "string" && value !== "inherit") {
				// 	target[name] = parseColor(value)
				// } else{
					target[name] = (calcable.includes(name) && typeof value === "string")
								? calcStyle(value, name) : value
				}
				this.#markForRender()
			}
			return true
		},
		get: (target, name, reciever) => {
			if (name === "color" && (target[name] === "inherit" || target[name] === undefined)) {
				if (this.parentElement instanceof CanvasElement)
					return this.parentElement.style[name]
				return
			}
			// if (name === "color") {
			// 	let val = target[name]
			// 	if (val === "inherit" || val === undefined) {
			// 		if (this.parentElement instanceof CanvasElement)
			// 			val = this.parentElement.style[name]
			// 	}
			// 	if (val === undefined)
			// 		val = [0,0,0,1]

			// 	if (!(val instanceof Array))
			// 		val = parseColor(val)

			// 	if (!(val instanceof Array))
			// 		val = [0,0,0,1]

			// 	return `rgba(${val.slice(0,3).concat(val[3]*calculateOpacity(this)).join(",")})`
			// }
			if (target[name] === 'inherit') {
				if (!(this.parentElement instanceof CanvasElement))
					return undefined
				return this.parentElement.style[name]
			}
			const v = target[name]
			if (v instanceof Function) {
				if (this.parentElement)
					return v(this.parentElement.getBoundingClientRect())
				else return v(this.ownerDocument)
			}
			return v
		}
	})


	// HTMLElement.accessKey
	// Is a DOMString representing the access key assigned to the element.
	#accessKey = ""
	set accessKey(newValue) {
		// TODO: bind key event to focus / activate this element
		console.warn("accessKey not yet implemented")
		this.#accessKey = newValue.toString()
	}
	get accessKey() {
		return this.#accessKey
	}

	// HTMLElement.accessKeyLabel (Read only)
	// Returns a DOMString containing the element's assigned access key.
	get accessKeyLabel() {
		return this.accessKey
	}

	// HTMLElement.contentEditable
	// Is a DOMString, where a value of true means the element is editable and a value of false means it isn't.
	#contentEditable = "inherit"
	set contentEditable(newValue) {
		// TODO: allows the element to be directly editable like an input element
		console.warn("contentEditable not yet implemented")
		const valStr = newValue.toString().toLowerCase()
		const allowed = ['true','false','plaintext-only','inherit']
		if (!allowed.includes(valStr))
			throw new Error(`Failed to set the 'contentEditable' property on 'COMElement': The value provided ('${valStr}') is not one of 'true', 'false', 'plaintext-only', or 'inherit'.`)
		this.#contentEditable = valStr
	}
	get contentEditable() {
		return this.#contentEditable
	}

	// HTMLElement.isContentEditable (Read only)
	// Returns a Boolean that indicates whether or not the content of the element can be edited.
	get isContentEditable() {
		if (this.#contentEditable === "inherit") {
			if (this.parentElement)
				return this.parentElement.isContentEditable
			return false
		}
		return this.#contentEditable !== 'false'
	}

	// HTMLElement.contextMenu
	// Is a HTMLMenuElement representing the contextual menu associated with the element. It may be null.
	get contextMenu() {
		// TODO: implement this
		console.warn("contextMenu not yet implemented")
	}
	set contextMenu(newValue) {
		// TODO: implement this
		console.warn("contextMenu not yet implemented")
	}

	// HTMLOrForeignElement.dataset (Read only)
	// Returns a DOMStringMap with which script can read and write the element's custom data attributes (data-*) .
	get dataset() {
		// TODO: returns object of all data- prefixed attributes
		console.warn("dataset not yet implemented")
		return {}
	}

	// HTMLElement.dir
	// Is a DOMString, reflecting the dir global attribute, representing the directionality of the element. Possible values are "ltr", "rtl", and "auto".
	#dir = ""
	set dir(newValue) {
		// TODO: sets text direction of element
		console.warn("dir not yet implemented")
		this.#dir = newValue.toString()
	}
	get dir() {
		const lowerVal = this.#dir.toLowerCase()
		const allowed = ["rtl","ltr","auto"]
		if (!allowed.includes(lowerVal))
			return ""
		return lowerVal
	}

	// HTMLElement.draggable
	// Is a Boolean indicating if the element can be dragged.

	// HTMLElement.enterkeyhint
	// Is a DOMString defining what action label (or icon) to present for the enter key on virtual keyboards.
	#enterKeyHint = ""
	set enterkeyhint(newValue) {
		// TODO: For virtual keyboards, probably not implmentable
		console.warn("enterKeyHint not yet implemented")
		this.#enterKeyHint = newValue.toString()
	}
	get enterkeyhint() {
		const lowerVal = this.#enterKeyHint.toLowerCase()
		const allowed = ["enter","done","go","next","previous","search","send"]
		if (!allowed.includes(lowerVal))
			return ""
		return lowerVal
	}

	// HTMLElement.hidden
	// Is a Boolean indicating if the element is hidden or not.
	#hidden = false
	set hidden(newValue) {
		// TODO: hides element and children
		console.warn("hidden not yet implemented")
		this.#hidden = Boolean(newValue)
	}
	get hidden() {
		return this.#hidden
	}

	// HTMLElement.inert
	// Is a Boolean indicating whether the user agent must act as though the given node is absent for the purposes of user interaction events, in-page text searches ("find in page"), and text selection.
	get inert() {
		// TODO: implement this
		console.warn("inert not yet implemented")
	}
	set inert(newValue) {
		// TODO: implement this
		console.warn("inert not yet implemented")
	}

	// HTMLElement.innerText
	// Represents the "rendered" text content of a node and its descendants. As a getter, it approximates the text the user would get if they highlighted the contents of the element with the cursor and then copied it to the clipboard.
	set innerText(newValue) {
		// TODO: implement this
		console.warn("innerText not yet implemented")
	}
	get innerText() {
		// TODO: implement this
		console.warn("innerText not yet implemented")
		return ""
	}

	// HTMLElement.itemScope
	// Is a Boolean representing the item scope.
	set itemScope(newValue) {
		// TODO: implement this
		console.warn("itemScope not yet implemented")
	}
	get itemScope() {
		// TODO: implement this
		console.warn("itemScope not yet implemented")
	}

	// HTMLElement.itemType (Read only)
	// Returns a DOMSettableTokenList…
	get itemType() {
		// TODO: implement this
		console.warn("itemType not yet implemented")
	}

	// HTMLElement.itemId
	// Is a DOMString representing the item ID.
	set itemId(newValue) {
		// TODO: implement this
		console.warn("itemId not yet implemented")
	}
	get itemId() {
		// TODO: implement this
		console.warn("itemId not yet implemented")
	}

	// HTMLElement.itemRef (Read only)
	// Returns a DOMSettableTokenList…
	get itemRef() {
		// TODO: implement this
		console.warn("itemRef not yet implemented")
	}

	// HTMLElement.itemProp (Read only)
	// Returns a DOMSettableTokenList…
	get itemProp() {
		// TODO: implement this
		console.warn("itemProp not yet implemented")
	}

	// HTMLElement.itemValue
	// Returns a Object representing the item value.
	set itemValue(newValue) {
		// TODO: implement this
		console.warn("itemValue not yet implemented")
	}
	get itemValue() {
		// TODO: implement this
		console.warn("itemValue not yet implemented")
	}

	// HTMLElement.lang
	// Is a DOMString representing the language of an element's attributes, text, and element contents.
	#lang = ""
	set lang(newValue) {
		this.#lang = newValue.toString()
	}
	get lang() {
		return this.#lang
	}

	// HTMLElement.noModule
	// Is a Boolean indicating whether an import script can be executed in user agents that support module scripts.
	set noModule(newValue) {
		// TODO: implement this
		console.warn("noModule not yet implemented")
	}
	get noModule() {
		// TODO: implement this
		console.warn("noModule not yet implemented")
	}

	// HTMLOrForeignElement.nonce
	// Returns the cryptographic number used once that is used by Content Security Policy to determine whether a given fetch will be allowed to proceed.
	set nonce(newValue) {
		// TODO: implement this
		console.warn("nonce not yet implemented")
	}
	get nonce() {
		// TODO: implement this
		console.warn("nonce not yet implemented")
	}


	// TODO: ensure these align with supposed values

	// HTMLElement.offsetHeight (Read only)
	// Returns a double containing the height of an element, relative to the layout.
	get offsetHeight() {
		if (this.style.height !== undefined)
			return calcValue(this.style.height, this.parentElement)
		if (this.style.top === undefined
		|| this.style.bottom === undefined
		|| ! (this.parentElement instanceof CanvasElement))
			return 0
		return Math.max(0, this.parentElement.offsetHeight - calcValue(this.style.top, this.parentElement) - calcValue(this.style.bottom, this.parentElement))
	}

	// HTMLElement.offsetLeft (Read only)
	// Returns a double, the distance from this element's left border to its offsetParent's left border.
	get offsetLeft() {
		if (! (this.parentElement instanceof CanvasElement))
			return calcValue(this.style.left || this.ownerDocument.offsetLeft || 0)

		if (!(this.style.left === undefined || this.style.left === 'auto') && !(this.style.right === undefined || this.style.right === 'auto')) {
			const left = calcValue(this.style.left, this.parentElement)
			return this.parentElement.offsetLeft + left + (((this.parentElement.offsetWidth - left - calcValue(this.style.right, this.parentElement)) - this.offsetWidth) / 2)
		}

		if (!(this.style.left === undefined || this.style.left === 'auto'))
			return this.parentElement.offsetLeft + calcValue(this.style.left, this.parentElement)

		if ((this.style.right === undefined || this.style.right === 'auto'))
			return this.parentElement.offsetLeft

		return this.parentElement.offsetLeft + this.parentElement.offsetWidth - this.offsetWidth - calcValue(this.style.right, this.parentElement)
	}

	// HTMLElement.offsetParent (Read only)
	// Returns a Element that is the element from which all offset calculations are currently computed.
	get offsetparent() {

	}

	// HTMLElement.offsetTop (Read only)
	// Returns a double, the distance from this element's top border to its offsetParent's top border.
	get offsetTop() {
		if (! (this.parentElement instanceof CanvasElement))
			return calcValue(this.style.top || this.ownerDocument.offsetTop || 0)

		if (!(this.style.top === undefined || this.style.top === 'auto') && !(this.style.bottom === undefined || this.style.bottom === 'auto')) {
			const top = calcValue(this.style.top, this.parentElement)
			return this.parentElement.offsetTop + top + (((this.parentElement.offsetHeight - top - calcValue(this.style.bottom, this.parentElement)) - this.offsetHeight) / 2)
		}
		if (!(this.style.top === undefined || this.style.top === 'auto'))
			return this.parentElement.offsetTop + calcValue(this.style.top, this.parentElement)

		if (this.style.bottom === undefined || this.style.bottom === 'auto')
			return this.parentElement.offsetTop

		return this.parentElement.offsetTop + this.parentElement.offsetHeight - this.offsetHeight - calcValue(this.style.bottom, this.parentElement)
	}

	// HTMLElement.offsetWidth (Read only)
	// Returns a double containing the width of an element, relative to the layout.
	get offsetWidth() {
		if (this.style.width !== undefined)
			return calcValue(this.style.width, this.parentElement)
		if (this.style.left === undefined
		||  this.style.right === undefined
		|| !(this.parentElement instanceof CanvasElement))
			return 0
		return Math.max(0, this.parentElement.offsetWidth - calcValue(this.style.left, this.parentElement) - calcValue(this.style.right, this.parentElement))
	}

	// HTMLElement.properties (Read only)
	// Returns a HTMLPropertiesCollection…
	get properties() {
		// TODO: implement this
		console.warn("properties not yet implemented")
	}

	// HTMLElement.spellcheck
	// Is a Boolean that controls spell-checking. It is present on all HTML elements, though it doesn't have an effect on all of them.
	set spellcheck(newValue) {
		// TODO: implement this
		console.warn("spellcheck not yet implemented")
	}
	get spellcheck() {
		// TODO: implement this
		console.warn("spellcheck not yet implemented")
	}

	// HTMLOrForeignElement.tabIndex
	// Is a long representing the position of the element in the tabbing order.
	set tabIndex(newValue) {
		// TODO: implement this
		console.warn("tabIndex not yet implemented")
	}
	get tabIndex() {
		// TODO: implement this
		console.warn("tabIndex not yet implemented")
	}

	// HTMLElement.title
	// Is a DOMString containing the text that appears in a popup box when mouse is over the element.
	#title = ""
	set title(newValue) {
		// TODO: hover / tooltip text for an element
		console.warn("title not yet implemented")
		this.#title = newValue.toString()
	}
	get title() {
		return this.#title
	}

	// HTMLElement.translate
	// Is a Boolean representing the translation.
	set translate(newValue) {
		// TODO: implement this
		console.warn("translate not yet implemented")
	}
	get translate() {
		// TODO: implement this
		console.warn("translate not yet implemented")
	}

	// Event handlers
	// Most event handler properties, of the form onXYZ, are defined on the DocumentAndElementEventHandlers, GlobalEventHandlers or TouchEventHandlers interfaces and implemented by HTMLElement. In addition, the following handlers are specific to HTMLElement.

		// HTMLElement.oncopy
		// Returns the event handling code for the copy event (bug 280959).

		// HTMLElement.oncut
		// Returns the event handling code for the cut event (bug 280959).

		// HTMLElement.onpaste
		// Returns the event handling code for the paste event (bug 280959).

		// TouchEventHandlers.ontouchstart
		// Returns the event handling code for the touchstart event.

		// TouchEventHandlers.ontouchend
		// Returns the event handling code for the touchend event.

		// TouchEventHandlers.ontouchmove
		// Returns the event handling code for the touchmove event.

		// TouchEventHandlers.ontouchenter
		// Returns the event handling code for the touchenter event.

		// TouchEventHandlers.ontouchleave
		// Returns the event handling code for the touchleave event.

		// TouchEventHandlers.ontouchcancel
		// Returns the event handling code for the touchcancel event.


	// Methods
	// Inherits methods from its parent, Element, and implements those from DocumentAndElementEventHandlers, ElementCSSInlineStyle, GlobalEventHandlers, HTMLOrForeignElement and TouchEventHandlers.

	// HTMLElement.attachInternals()
	// Attaches an ElementInternals instance to the custom element.
	attachInternals() {
		// TODO: implement this
		console.warn("attachInternals not yet implemented")
	}

	// HTMLOrForeignElement.blur()
	// Removes keyboard focus from the currently focused element.
	blur() {
		// TODO: implement this
		console.warn("blur not yet implemented")
	}

	// HTMLElement.click()
	// Sends a mouse click event to the element.
	click() {
		// TODO: implement this
		console.warn("click not yet implemented")
	}

	// HTMLOrForeignElement.focus()
	// Makes the element the current keyboard focus.
	focus() {
		// TODO: implement this
		console.warn("focus not yet implemented")
	}

	// HTMLElement.forceSpellCheck()
	// Runs the spell checker on the element's contents.
	forceSpellCheck() {
		// TODO: implement this
		console.warn("forceSpellCheck not yet implemented")
	}
}

class CanvasRenderElement extends CanvasHTMLElement {
	constructor(com, tagName, markForRender, systemSetter) {
		super(com, tagName, markForRender, systemSetter)
		this.#markForRender = markForRender
	}

	#markForRender = () => {}

	#renderer = context => {}
	#renderHelpers = {}
	get renderHelpers() {
		return new Proxy(this.#renderHelpers, {
			get: (target, prop) => {
				return target[prop]
			},
			set: (target, prop, value) => {
				target[prop] = value
				this.#markForRender()
				return true
			}
		})
	}
	set render(renderer) {
		this.#renderer = renderer
		this.#markForRender()
	}
	get render() {
		return (context) => {
			// console.log('hi')
			const newAlpha = calculateOpacity(this)
			if (newAlpha !== context.globalAlpha)
				context.globalAlpha = newAlpha

			// Render background
			if (this.style.background) {
				context.fillStyle = this.style.background
				context.fillRect(
					this.offsetLeft, this.offsetTop,
					this.offsetWidth, this.offsetHeight
				)
			}
			// Render border
			if (this.style.border) {
				context.strokeStyle = this.style.border
				context.strokeRect(
					this.offsetLeft, this.offsetTop,
					this.offsetWidth, this.offsetHeight
				)
			}

			// Custom render
			context.strokeStyle = this.style.color || "#000000"
			this.#renderer(context)

			// Render children
			sortElements(this.children)
			.forEach(childElement => {
				childElement.render(context)
			})
		}
	}
}

class CanvasDocument extends CanvasNode {
	// https://developer.mozilla.org/en-US/docs/Web/API/Document
	#systemSetterMap = new Map()
	#systemSetter = (indexNode, setters) => {
		if (!this.#systemSetterMap.has(indexNode))
			this.#systemSetterMap.set(indexNode, {})
		Object.assign(this.#systemSetterMap.get(indexNode), setters)
		return (node, prop, ...args) => {
			this.#markForRender()
			this.dispatchEvent({ type: 'DOMSubtreeModified' })
			return this.#systemSetterMap.get(node)[prop](...args)
		}
	}
	#hovering = false
	constructor(canvasOrContainer) {
		super(null, '#document', () => () => {})
		this.#documentElement = this.createElement('html')
		this.#head = this.createElement('head')
		this.#body = this.createElement('body')
		this.#documentElement.appendChild(this.#head)
		this.#documentElement.appendChild(this.#body)
		this.#documentElement.style.width = "100%"
		this.#documentElement.style.height = "100%"
		this.#body.style.width = "100%"
		this.#body.style.height = "100%"


		const forwardDomEvent = event => this.dispatchEvent(event)
		const bindDomEvents = dom => {
			dom.addEventListener('keypress', forwardDomEvent)
			dom.addEventListener('keyup',    forwardDomEvent)
			dom.addEventListener('keydown',  forwardDomEvent)
		}
		const unbindDomEvents = dom => {
			dom.removeEventListener('keypress', forwardDomEvent)
			dom.removeEventListener('keyup',    forwardDomEvent)
			dom.removeEventListener('keydown',  forwardDomEvent)
		}
		// canvasOrContainer
		if (!canvasOrContainer)
			canvasOrContainer = document.body
		if (canvasOrContainer instanceof HTMLCanvasElement) {
			this.#canvas = canvasOrContainer
			let elementConnected = this.#canvas.isConnected
			let parentDom = this.#canvas.ownerDocument
			if (elementConnected)
				bindDomEvents(parentDom)
			setInterval(() => {
				const newElementConnected = this.#canvas.isConnected
				const newDom = this.#canvas.ownerDocument
				if (newDom !== parentDom && elementConnected)
					unbindDomEvents(parentDom)
				if (newElementConnected !== elementConnected) {
					if (newElementConnected) {
						bindDomEvents(newDom)
						const parentBounds = this.#canvas.parentNode.getBoundingClientRect()
						this.#canvas.width = parentBounds.width
						this.#canvas.height = parentBounds.height
						this.#markForRender()
					} else {
						unbindDomEvents(newDom)
					}
				}
				parentDom = newDom
				elementConnected = newElementConnected
			}, 100)
		} else {
			this.#canvas = document.createElement('canvas')
			// this.#canvas.width = window.innerWidth
			// this.#canvas.height = window.innerHeight
			// canvasOrContainer.appendChild(this.#canvas)
		}

		// return;



		this.#canvas.onmousedown = event => {
			const x = event.offsetX
			const y = event.offsetY

			const hitElement = hitsElement(x, y, this.#documentElement)

			// Bubble event
			dispatchEvent(hitElement, {
				type: "mousedown",
				target: hitElement,
				x,y,
			})
		}
		this.#canvas.onmouseup = event => {
			const x = event.offsetX
			const y = event.offsetY

			const hitElement = hitsElement(x, y, this.#documentElement)

			// Bubble event
			dispatchEvent(hitElement, {
				type: "mouseup",
				target: hitElement,
				x,y,
			})
		}
		this.#canvas.onclick = event => {
			const x = event.offsetX
			const y = event.offsetY

			const hitElement = hitsElement(x, y, this.#documentElement)

			// Bubble event
			dispatchEvent(hitElement, {
				type: "click",
				target: hitElement,
				x,y,
			})
		}
		this.#canvas.ondblclick = event => {
			const x = event.offsetX
			const y = event.offsetY

			const hitElement = hitsElement(x, y, this.#documentElement)

			// Bubble event
			dispatchEvent(hitElement, {
				type: "dblclick",
				target: hitElement,
				x,y,
			})
		}

		this.#canvas.onmousemove = event => {
			const x = event.offsetX
			const y = event.offsetY

			const hitElement = hitsElement(x, y, this.#documentElement)

			// Bubble event
			dispatchEvent(hitElement, {
				type: "mousemove",
				target: hitElement,
				x,y,
			})

			if (hitElement !== this.#hovering) {
				if (this.#hovering) {
					dispatchEvent(this.#hovering, {
						type: "mouseout",
						target: this.#hovering,
						x,y,
					})
				}
				dispatchEvent(hitElement, {
					type: "mouseover",
					target: hitElement,
					x,y,
				})
				this.#hovering = hitElement
			}
		}
		this.#canvas.onmouseout = event => {
			const x = event.offsetX
			const y = event.offsetY
			if (this.#hovering) {
				dispatchEvent(this.#hovering, {
					type: "mouseout",
					target: this.#hovering,
					x,y,
				})
				this.#hovering = false
			}
		}
		this.#canvas.onwheel = event => {
			const x = event.offsetX
			const y = event.offsetY

			const hitElement = hitsElement(x, y, this.#documentElement)

			// Bubble event
			dispatchEvent(hitElement, {
				type: "wheel",
				target: hitElement,
				x,y,
				deltaY: event.deltaY,
				deltaX: event.deltaX,
				// delta: { x: event.deltaX, y: event.deltaY }
			})
		}
	}
	#renderPending = false
	#markForRender = () => {
		if (this.#renderPending) return;
		this.#renderPending = true
		requestAnimationFrame(this.#doRender)
	}
	#canvas = null
	#doRender = () => {
		this.#renderPending = false
		const context = this.#canvas.getContext('2d');
		[...this.#systemSetterMap.values()].forEach(({ clearBounds }) => clearBounds());
		context.clearRect(0,0,this.#canvas.width,this.#canvas.height)
		this.#documentElement.render(context)
	}

	// Document.activeElement (Read only)
	// Returns the Element that currently has focus.

	// Document.body
	// Returns the <body> or <frameset> node of the current document.
	#body = null
	get body() {
		return this.#body
	}

	// Document.characterSet (Read only)
	// Returns the character set being used by the document.

	// Document.childElementCount (Read only)
	// Returns the number of child elements of the current document.

	// Document.children (Read only)
	// Returns the child elements of the current document.

	// Document.compatMode (Read only)
	// Indicates whether the document is rendered in quirks or strict mode.

	// Document.contentType (Read only)
	// Returns the Content-Type from the MIME Header of the current document.

	// Document.doctype (Read only)
	// Returns the Document Type Definition (DTD) of the current document.

	// Document.documentElement (Read only)
	// Returns the Element that is a direct child of the document. For HTML documents, this is normally the HTMLHtmlElement object representing the document's <html> element.
	#documentElement = null
	get documentElement() {
		return this.#documentElement
	}

	// Document.documentURI (Read only)
	// Returns the document location as a string.

	// Document.embeds (Read only)
	// Returns a list of the embedded <embed> elements within the current document.

	// Document.firstElementChild (Read only)
	// Returns the first child element of the current document.

	// Document.fonts
	// Returns the FontFaceSet interface of the current document.

	// Document.forms (Read only)
	// Returns a list of the <form> elements within the current document.

	// Document.fullscreenElement (Read only)
	// The element that's currently in full screen mode for this document.

	// Document.head (Read only)
	// Returns the <head> element of the current document.
	#head = null
	get head() {
		return this.#head
	}

	// Document.hidden (Read only)
	// Returns a Boolean value indicating if the page is considered hidden or not.

	// Document.images (Read only)
	// Returns a list of the images in the current document.

	// Document.implementation (Read only)
	// Returns the DOM implementation associated with the current document.

	// Document.lastElementChild (Read only)
	// Returns the last child element of the current document.

	// Document.links (Read only)
	// Returns a list of all the hyperlinks in the document.

	// Document.mozSyntheticDocument
	// Returns a Boolean that is true only if this document is synthetic, such as a standalone image, video, audio file, or the like.

	// Document.pictureInPictureElement (Read only)
	// Returns the Element currently being presented in picture-in-picture mode in this document.

	// Document.pictureInPictureEnabled (Read only)
	// Returns true if the picture-in-picture feature is enabled.

	// Document.plugins (Read only)
	// Returns a list of the available plugins.

	// Document.pointerLockElement (Read only)
	// Returns the element set as the target for mouse events while the pointer is locked. null if lock is pending, pointer is unlocked, or if the target is in another document.

	// Document.featurePolicy (Read only)
	// Returns the FeaturePolicy interface which provides a simple API for introspecting the feature policies applied to a specific document.

	// Document.scripts (Read only)
	// Returns all the <script> elements on the document.

	// Document.scrollingElement (Read only)
	// Returns a reference to the Element that scrolls the document.

	// Document.styleSheets (Read only)
	// Returns a StyleSheetList of CSSStyleSheet objects for stylesheets explicitly linked into, or embedded in a document.

	// Document.timeline (Read only)
	// Returns timeline as a special instance of DocumentTimeline that is automatically created on page load.

	// Document.visibilityState (Read only)
	// Returns a string denoting the visibility state of the document. Possible values are visible, hidden, prerender, and unloaded.



	get offsetHeight() {
		return this.#canvas.height
	}

	get offsetWidth() {
		return this.#canvas.width
	}

	get offsetLeft() {
		return 0
	}

	get offsetTop() {
		return 0
	}


	// Extensions for HTMLDocument
	// The Document interface for HTML documents inherits from the HTMLDocument interface or, since HTML5, is extended for such documents.

		// Document.cookie
		// Returns a semicolon-separated list of the cookies for that document or sets a single cookie.

		// Document.defaultView (Read only)
		// Returns a reference to the window object.

		// Document.designMode
		// Gets/sets the ability to edit the whole document.

		// Document.dir
		// Gets/sets directionality (rtl/ltr) of the document.

		// Document.domain
		// Gets/sets the domain of the current document.

		// Document.lastModified (Read only)
		// Returns the date on which the document was last modified.

		// Document.location (Read only)
		// Returns the URI of the current document.

		// Document.readyState (Read only)
		// Returns loading status of the document.

		// Document.referrer (Read only)
		// Returns the URI of the page that linked to this page.

		// Document.title
		// Sets or gets the title of the current document.

		// Document.URL (Read only)
		// Returns the document location as a string.


	// Methods
	// This interface also inherits from the Node and EventTarget interfaces.

	// Document.adoptNode()
	// Adopt node from an external document.
	adoptNode() {
		// TODO: implemenet this
		console.warn("adoptNode not yet implemented")
	}

	// Document.append()
	// Inserts a set of Node objects or DOMString objects after the last child of the document.
	append() {
		// TODO: implemenet this
		console.warn("append not yet implemented")
	}

	// Document.captureEvents()
	// See Window.captureEvents.
	captureEvents() {
		// TODO: implemenet this
		console.warn("captureEvents not yet implemented")
	}

	// Document.caretPositionFromPoint()
	// Returns a CaretPosition object containing the DOM node containing the caret, and caret's character offset within that node.
	caretPositionFromPoint() {
		// TODO: implemenet this
		console.warn("caretPositionFromPoint not yet implemented")
	}

	// Document.caretRangeFromPoint()
	// Gets a Range object for the document fragment under the specified coordinates.
	caretRangeFromPoint() {
		// TODO: implemenet this
		console.warn("caretRangeFromPoint not yet implemented")
	}

	// Document.createAttribute()
	// Creates a new Attr object and returns it.
	createAttribute() {
		// TODO: implemenet this
		console.warn("createAttribute not yet implemented")
	}

	// Document.createAttributeNS()
	// Creates a new attribute node in a given namespace and returns it.
	createAttributeNS() {
		// TODO: implemenet this
		console.warn("createAttributeNS not yet implemented")
	}

	// Document.createCDATASection()
	// Creates a new CDATA node and returns it.
	createCDATASection() {
		// TODO: implemenet this
		console.warn("createCDATASection not yet implemented")
	}

	// Document.createComment()
	// Creates a new comment node and returns it.
	createComment() {
		// TODO: implemenet this
		console.warn("createComment not yet implemented")
	}

	// Document.createDocumentFragment()
	// Creates a new document fragment.
	createDocumentFragment() {
		// TODO: implemenet this
		console.warn("createDocumentFragment not yet implemented")
	}

	// Document.createElement()
	// Creates a new element with the given tag name.
	createElement(tagName) {
		return new CanvasRenderElement(this, tagName, this.#markForRender, this.#systemSetter)
	}

	// Document.createElementNS()
	// Creates a new element with the given tag name and namespace URI.
	createElementNS() {
		// TODO: implemenet this
		console.warn("createElementNS not yet implemented")
	}

	// Document.createEntityReference()
	// Creates a new entity reference object and returns it.
	createEntityReference() {
		// TODO: implemenet this
		console.warn("createEntityReference not yet implemented")
	}

	// Document.createEvent()
	// Creates an event object.
	createEvent() {
		// TODO: implemenet this
		console.warn("createEvent not yet implemented")
	}

	// Document.createNodeIterator()
	// Creates a NodeIterator object.
	createNodeIterator() {
		// TODO: implemenet this
		console.warn("createNodeIterator not yet implemented")
	}

	// Document.createProcessingInstruction()
	// Creates a new ProcessingInstruction object.
	createProcessingInstruction() {
		// TODO: implemenet this
		console.warn("createProcessingInstruction not yet implemented")
	}

	// Document.createRange()
	// Creates a Range object.
	createRange() {
		// TODO: implemenet this
		console.warn("createRange not yet implemented")
	}

	// Document.createTextNode()
	// Creates a text node.
	createTextNode() {
		// TODO: implemenet this
		console.warn("createTextNode not yet implemented")
	}

	// Document.createTouch()
	// Creates a Touch object.
	createTouch() {
		// TODO: implemenet this
		console.warn("createTouch not yet implemented")
	}

	// Document.createTouchList()
	// Creates a TouchList object.
	createTouchList() {
		// TODO: implemenet this
		console.warn("createTouchList not yet implemented")
	}

	// Document.createTreeWalker()
	// Creates a TreeWalker object.
	createTreeWalker() {
		// TODO: implemenet this
		console.warn("createTreeWalker not yet implemented")
	}

	// Document.elementFromPoint()
	// Returns the topmost element at the specified coordinates.
	elementFromPoint() {
		// TODO: implemenet this
		console.warn("elementFromPoint not yet implemented")
	}

	// Document.elementsFromPoint()
	// Returns an array of all elements at the specified coordinates.
	elementsFromPoint() {
		// TODO: implemenet this
		console.warn("elementsFromPoint not yet implemented")
	}

	// Document.enableStyleSheetsForSet()
	// Enables the style sheets for the specified style sheet set.
	enableStyleSheetsForSet() {
		// TODO: implemenet this
		console.warn("enableStyleSheetsForSet not yet implemented")
	}

	// Document.exitPictureInPicture()
	// Remove the video from the floating picture-in-picture window back to its original container.
	exitPictureInPicture() {
		// TODO: implemenet this
		console.warn("exitPictureInPicture not yet implemented")
	}

	// Document.exitPointerLock()
	// Release the pointer lock.
	exitPointerLock() {
		// TODO: implemenet this
		console.warn("exitPointerLock not yet implemented")
	}

	// Document.getAnimations()
	// Returns an array of all Animation objects currently in effect, whose target elements are descendants of the document.
	getAnimations() {
		// TODO: implemenet this
		console.warn("getAnimations not yet implemented")
	}

	// Document.getElementById
	// Returns an object reference to the identified element.
	getElementById() {
		// TODO: implemenet this
		console.warn("getElementById not yet implemented")
	}

	// Document.getElementsByClassName()
	// Returns a list of elements with the given class name.
	getElementsByClassName() {
		// TODO: implemenet this
		console.warn("getElementsByClassName not yet implemented")
	}

	// Document.getElementsByTagName()
	// Returns a list of elements with the given tag name.
	getElementsByTagName(tagName) {
		return this.querySelectorAll(tagName)
		// TODO: implemenet this
		console.warn("getElementsByTagName not yet implemented")
	}

	// Document.getElementsByTagNameNS()
	// Returns a list of elements with the given tag name and namespace.
	getElementsByTagNameNS() {
		// TODO: implemenet this
		console.warn("getElementsByTagNameNS not yet implemented")
	}

	// Document.getSelection()
	// Returns a Selection object representing the range of text selected by the user, or the current position of the caret.
	getSelection() {
		// TODO: implemenet this
		console.warn("getSelection not yet implemented")
	}

	// Document.hasStorageAccess()
	// Returns a Promise that resolves with a boolean value indicating whether the document has access to its first-party storage.
	hasStorageAccess() {
		// TODO: implemenet this
		console.warn("hasStorageAccess not yet implemented")
	}

	// Document.importNode()
	// Returns a clone of a node from an external document.
	importNode() {
		// TODO: implemenet this
		console.warn("importNode not yet implemented")
	}

	// Document.normalizeDocument()
	// Replaces entities, normalizes text nodes, etc.
	normalizeDocument() {
		// TODO: implemenet this
		console.warn("normalizeDocument not yet implemented")
	}

	// Document.prepend()
	// Inserts a set of Node objects or DOMString objects before the first child of the document.
	prepend() {
		// TODO: implemenet this
		console.warn("prepend not yet implemented")
	}

	// Document.querySelector()
	// Returns the first Element node within the document, in document order, that matches the specified selectors.
	querySelector() {
		// TODO: implemenet this
		console.warn("querySelector not yet implemented")
	}

	// Document.querySelectorAll()
	// Returns a list of all the Element nodes within the document that match the specified selectors.
	querySelectorAll() {
		// TODO: implemenet this
		console.warn("querySelectorAll not yet implemented")
	}

	// Document.releaseCapture()
	// Releases the current mouse capture if it's on an element in this document.
	releaseCapture() {
		// TODO: implemenet this
		console.warn("releaseCapture not yet implemented")
	}

	// Document.releaseEvents()
	// See Window.releaseEvents().
	releaseEvents() {
		// TODO: implemenet this
		console.warn("releaseEvents not yet implemented")
	}

	// Document.replaceChildren()
	// Replaces the existing children of a document with a specified new set of children.
	replaceChildren() {
		// TODO: implemenet this
		console.warn("replaceChildren not yet implemented")
	}

	// Document.requestStorageAccess()
	// Returns a Promise that resolves if the access to first-party storage was granted, and rejects if access was denied.
	requestStorageAccess() {
		// TODO: implemenet this
		console.warn("requestStorageAccess not yet implemented")
	}

	// Document.routeEvent()
	// See Window.routeEvent().
	routeEvent() {
		// TODO: implemenet this
		console.warn("routeEvent not yet implemented")
	}

	// Document.mozSetImageElement()
	// Allows you to change the element being used as the background image for a specified element ID.
	mozSetImageElement() {
		// TODO: implemenet this
		console.warn("mozSetImageElement not yet implemented")
	}


	// The Document interface is extended with the XPathEvaluator interface:


	// Document.createExpression()
	// Compiles an XPathExpression which can then be used for (repeated) evaluations.
	createExpression() {
		// TODO: implemenet this
		console.warn("createExpression not yet implemented")
	}

	// Document.createNSResolver()
	// Creates an XPathNSResolver object.
	createNSResolver() {
		// TODO: implemenet this
		console.warn("createNSResolver not yet implemented")
	}

	// Document.evaluate()
	// Evaluates an XPath expression.
	evaluate() {
		// TODO: implemenet this
		console.warn("evaluate not yet implemented")
	}


	// Extension for HTML documents
	// The Document interface for HTML documents inherit from the HTMLDocument interface or, since HTML5, is extended for such documents:

	// Document.clear()
	// In majority of modern browsers, including recent versions of Firefox and Internet Explorer, this method does nothing.
	clear() {
		// TODO: implemenet this
		console.warn("clear not yet implemented")
	}

	// Document.close()
	// Closes a document stream for writing.
	close() {
		// TODO: implemenet this
		console.warn("close not yet implemented")
	}

	// Document.execCommand()
	// On an editable document, executes a formatting command.
	execCommand() {
		// TODO: implemenet this
		console.warn("execCommand not yet implemented")
	}

	// Document.getElementsByName()
	// Returns a list of elements with the given name.
	getElementsByName() {
		// TODO: implemenet this
		console.warn("getElementsByName not yet implemented")
	}

	// Document.hasFocus()
	// Returns true if the focus is currently located anywhere inside the specified document.
	hasFocus() {
		// TODO: implemenet this
		console.warn("hasFocus not yet implemented")
	}

	// Document.open()
	// Opens a document stream for writing.
	open() {
		// TODO: implemenet this
		console.warn("open not yet implemented")
	}

	// Document.queryCommandEnabled()
	// Returns true if the formatting command can be executed on the current range.
	queryCommandEnabled() {
		// TODO: implemenet this
		console.warn("queryCommandEnabled not yet implemented")
	}

	// Document.queryCommandIndeterm()
	// Returns true if the formatting command is in an indeterminate state on the current range.
	queryCommandIndeterm() {
		// TODO: implemenet this
		console.warn("queryCommandIndeterm not yet implemented")
	}

	// Document.queryCommandState()
	// Returns true if the formatting command has been executed on the current range.
	queryCommandState() {
		// TODO: implemenet this
		console.warn("queryCommandState not yet implemented")
	}

	// Document.queryCommandSupported()
	// Returns true if the formatting command is supported on the current range.
	queryCommandSupported() {
		// TODO: implemenet this
		console.warn("queryCommandSupported not yet implemented")
	}

	// Document.queryCommandValue()
	// Returns the current value of the current range for a formatting command.
	queryCommandValue() {
		// TODO: implemenet this
		console.warn("queryCommandValue not yet implemented")
	}

	// Document.write()
	// Writes text in a document.
	write() {
		// TODO: implemenet this
		console.warn("write not yet implemented")
	}

	// Document.writeln()
	// Writes a line of text in a document.
	writeln() {
		// TODO: implemenet this
		console.warn("writeln not yet implemented")
	}
}





const sortByZIndex = (a, b) => a.style.zIndex - b.style.zIndex
const sortElements = elements => // smallest zIndex first
	[...elements].sort(sortByZIndex)

const hitsElement = (x, y, element, ignores = []) => {
	if (ignores.includes(element)) return false
	// Check children for hits first
	const sortedChildren =
		// last first
		sortElements(element.children)
			.reverse()
	for (const childElement of sortedChildren) {
		const childHit = hitsElement(x, y, childElement, ignores)
		if (childHit) return childHit
	}

	// Check self for hit
	if (x < element.offsetLeft)
		return false
	if (y < element.offsetTop)
		return false
	if (x > element.offsetLeft + element.offsetWidth)
		return false
	if (y > element.offsetTop + element.offsetHeight)
		return false

	return element
}
const dispatchEvent = (hitElement, common) => {
	if (!hitElement) return

	const hitEvent = {
		...common,
		cancelBubble: false,
		offsetX: common.x-hitElement.offsetLeft,
		offsetY: common.y-hitElement.offsetTop
	}
	hitElement.dispatchEvent(hitEvent)

	if (hitEvent.cancelBubble) return

	const parent = hitElement.parentElement
	dispatchEvent(parent, common)
}

const elementsOverlap = (element, otherElement, threshold = 1) => {
	const x = otherElement.offsetLeft
	const y = otherElement.offsetTop
	const w = otherElement.offsetWidth
	const h = otherElement.offsetHeight

	const ex = element.offsetLeft
	const ey = element.offsetTop
	const ew = element.offsetWidth
	const eh = element.offsetHeight

	if (ex > x+w) return false
	if (ey > y+h) return false
	if (ex+ew < x) return false
	if (ey+eh < y) return false

	const dw = Math.min(ex+ew, x+w) - Math.max(ex, x)
	const dh = Math.min(ey+eh, y+h) - Math.max(ey, y)

	const wp = dw / ew
	if (wp < threshold) return false

	const hp = dh / eh
	if (hp < threshold) return false

	const overlap = wp * hp
	return overlap > threshold
}



class CanvasHTMLElementOLD extends CanvasElement {
	#tagName = "element"
	#context = null
	#markForRender = () => {}
	#cleanup = () => {}

	constructor (name, markForRender, context, cleanup) {
		this.#tagName = name
		this.#markForRender = markForRender
		this.#context = context
		this.#cleanup = cleanup
	}
	get tagName() {
		return this.#tagName
	}


	#parentElement = null
	#childElements = []
	set parentElement(parent) {
		this.#parentElement = parent
	}
	get parentElement() {
		return this.#parentElement
	}
	appendChild(element) {
		if (element.parentElement === this)
			this.removeChild(element)
		element.parentElement = this
		this.#childElements.push(element)
		this.#markForRender()
		return element
	}
	removeChild(element) {
		if (element.parentElement !== this) return
		const i = this.#childElements.indexOf(element)
		if (i === -1)
			throw new Error('Element has parent but is not in children. Big oof.')
		element.parentElement = null
		this.#childElements.splice(i, 1)
		this.#cleanup(element)
		this.#markForRender()
		return element
	}
	remove() {
		return this.parentElement.removeChild(this);
	}
	get children() {
		return [...this.#childElements]
	}

	getBoundingClientRect() {
		// bottom: 140
		// height: 0
		// left: 27.499998092651367
		// right: 57.499996185302734
		// top: 140
		// width: 29.999998092651367
		// x: 27.499998092651367
		// y: 140

		// get offsetLeft() {
		// 	if (! (this.#parentElement instanceof CanvasElement))
		// 		return calcValue(this.style.left || 0)

		// 	if (this.style.left !== undefined)
		// 		return this.#parentElement.offsetLeft + calcValue(this.style.left, this.#parentElement)

		// 	if (this.style.right === undefined)
		// 		return this.#parentElement.offsetLeft

		// 	return this.#parentElement.offsetLeft + this.#parentElement.offsetWidth - this.offsetWidth - calcValue(this.style.right, this.#parentElement)
		// }
		// get offsetTop() {
		// 	if (! (this.#parentElement instanceof CanvasElement))
		// 		return calcValue(this.style.top || 0)

		// 	if (this.style.top !== undefined)
		// 		return this.#parentElement.offsetTop + calcValue(this.style.top, this.#parentElement)

		// 	if (this.style.bottom === undefined)
		// 		return this.#parentElement.offsetTop

		// 	return this.#parentElement.offsetTop + this.#parentElement.offsetHeight - this.offsetHeight - calcValue(this.style.bottom, this.#parentElement)
		// }
		// get offsetWidth() {
		// 	if (this.style.width !== undefined)
		// 		return calcValue(this.style.width, this.#parentElement)
		// 	if (this.style.left === undefined
		// 	||  this.style.right === undefined
		// 	|| !(this.#parentElement instanceof CanvasElement))
		// 		return 0
		// 	return Math.max(0, this.#parentElement.offsetWidth - calcValue(this.style.left, this.#parentElement) - calcValue(this.style.right, this.#parentElement))
		// }
		// get offsetHeight() {
		// 	if (this.style.height !== undefined)
		// 		return calcValue(this.style.height, this.#parentElement)
		// 	if (this.style.top === undefined
		// 	|| this.style.bottom === undefined
		// 	|| ! (this.#parentElement instanceof CanvasElement))
		// 		return 0
		// 	return Math.max(0, this.#parentElement.offsetHeight - calcValue(this.style.top, this.#parentElement) - calcValue(this.style.bottom, this.#parentElement))
		// }
	}

	getElementsByTagName(tagName) {
		return this.#childElements.reduce((acc, child) => [
			...acc,
			...(child.tagName === tagName ? [child] : []),
			...child.getElementsByTagName(tagName)
		], [])
		// return this.body.getElementsByTagName(tagName)
	}
	getElementsByClassName(className) {
		// return this.body.getElementsByClassName(className)
	}
	getElementById(id) {
		// return this.body.getElementById(id)
	}



	/*
	 * HTMLElement properties
	 * From: https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	*/

	// TODO: contextMenu?



	// TODO: draggable? ondragstart, ondragover, ondrop?


	// TODO: inert? new or old?


	// TODO: experimental: itemScope, itemType, itemId, itemRef, itemProp, itemValue


	// noModule not supported

	// nonce not supported


	// TODO: experimental: properties

	// spellcheck not supported

	// style implmeneted at top

	// tabIndex not supported

	// TODO: experimental: translate

	// TODO: oncopy, oncut, onpaste, ontouchstart, ontouchend, ontouchmove, ontouchenter, ontouchleave, ontouchcancel

	// TODO: experimental: attachInternals

	// TODO: blur(), click(), focus(), forceSpellCheck()
}



class CanvasDocumentOLD {
	#canvas = null
	#context = null
	#root = null
	#rendering = false
	#hovering = false
	#render = () => {
		this.#context.clearRect(
			0, 0,
			this.#canvas.width, this.#canvas.height
		)
		this.#root.render()
		this.#rendering = false
	}
	#markForRender = () => {
		if (this.#rendering === true) return;
		window.requestAnimationFrame(this.#render)
		// window.setTimeout(this.#render, 1000)
		this.#rendering = true
	}
	#cleanup = (el) => {
		if (el === this.#hovering) {
			this.#hovering = false
		}
		el.children.forEach(child => child.remove())
		// delete el
	}
	constructor(canvas) {
		this.#canvas = canvas
		this.#context = this.#canvas.getContext("2d")

		this.#canvas.onmousedown = event => {
			const x = event.offsetX
			const y = event.offsetY

			const hitElement = hitsElement(x, y, this.#root)

			// Bubble event
			dispatchEvent(hitElement, {
				type: "mousedown",
				target: hitElement,
				x,y,
			})
		}
		this.#canvas.onmouseup = event => {
			const x = event.offsetX
			const y = event.offsetY

			const hitElement = hitsElement(x, y, this.#root)

			// Bubble event
			dispatchEvent(hitElement, {
				type: "mouseup",
				target: hitElement,
				x,y,
			})
		}
		this.#canvas.onclick = event => {
			const x = event.offsetX
			const y = event.offsetY

			const hitElement = hitsElement(x, y, this.#root)

			// Bubble event
			dispatchEvent(hitElement, {
				type: "click",
				target: hitElement,
				x,y,
			})
		}
		this.#canvas.ondblclick = event => {
			const x = event.offsetX
			const y = event.offsetY

			const hitElement = hitsElement(x, y, this.#root)

			// Bubble event
			dispatchEvent(hitElement, {
				type: "dblclick",
				target: hitElement,
				x,y,
			})
		}

		this.#canvas.onmousemove = event => {
			const x = event.offsetX
			const y = event.offsetY

			const hitElement = hitsElement(x, y, this.#root)

			// Bubble event
			dispatchEvent(hitElement, {
				type: "mousemove",
				target: hitElement,
				x,y,
			})

			if (hitElement !== this.#hovering) {
				if (this.#hovering) {
					dispatchEvent(this.#hovering, {
						type: "mouseout",
						target: this.#hovering,
						x,y,
					})
				}
				dispatchEvent(hitElement, {
					type: "mouseover",
					target: hitElement,
					x,y,
				})
				this.#hovering = hitElement
			}
		}
		this.#canvas.onmouseout = event => {
			const x = event.offsetX
			const y = event.offsetY
			if (this.#hovering) {
				dispatchEvent(this.#hovering, {
					type: "mouseout",
					target: this.#hovering,
					x,y,
				})
				this.#hovering = false
			}
		}
		this.#canvas.onwheel = event => {
			const x = event.offsetX
			const y = event.offsetY

			const hitElement = hitsElement(x, y, this.#root)

			// Bubble event
			dispatchEvent(hitElement, {
				type: "wheel",
				target: hitElement,
				x,y,
				delta: { x: event.deltaX, y: event.deltaY }
			})
		}


		window.onresize = () => {
			this.#canvas.width = window.innerWidth
			this.#canvas.height = window.innerHeight
			this.#root.style.width = window.innerWidth
			this.#root.style.height = window.innerHeight
			this.#markForRender()
		}
		// canvas.style.left = 20
		// canvas.style.top = 80
		// canvas.style.position = 'relative'
		this.#root = new CanvasRenderElement(
			elementName,
			{
				markForRender: this.#markForRender,
				context: this.#context,
				cleanup: this.#cleanup,
				document: this,

			}
		)
		window.onresize()
	}
	createElement(elementName) {
		return new CanvasRenderElement(
			elementName,
			{
				markForRender: this.#markForRender,
				context: this.#context,
				cleanup: this.#cleanup,
				document: this
			}
		)
	}
	get body() {
		return this.#root
	}
	getElementsByTagName(tagName) {
		return this.body.getElementsByTagName(tagName)
	}
	getElementsByClassName(className) {
		return this.body.getElementsByClassName(className)
	}
	getElementById(id) {
		return this.body.getElementById(id)
	}
}










// const canvas = document.createElement("canvas")
// document.body.appendChild(canvas)
//*
// const COM = new CanvasDocument(canvas)
/*/
const COM = document
CanvasNodeList = NodeList
CanvasElement = Element
CanvasHTMLElement = HTMLElement

;(() => {

let next_renders = []
let pendingRender = false
const renderAll = () => {
	const renders = next_renders
	next_renders = []
	pendingRender = false
	const bounds = renders.map(({ scope }) => scope.getBoundingClientRect())
	renders.forEach(({ scope, rend }, i) => {

		const comp = bounds[i]
		const dat = {
			id: scope.id,
			renderHelpers: scope.renderHelpers,
			getBoundingClientRect() {
				return {
					width: comp.width,
					height: comp.height,
					y:0, x:0,
					left:0, top:0,
				}
			}
		}
		scope.canvas.width = comp.width
		scope.canvas.height = comp.height
		const context = scope.canvas.getContext("2d")
		context.strokeStyle = scope.style.color || "#000000"
		// context.clearRect(0,0,comp.width, comp.height)
		rend.call(dat, context)
		scope.querySelectorAll(':scope > *:not(canvas)')
			.forEach(element => {
				if (element._reRender) element._reRender()
			})
	})

}
const pendRender = r => {
	next_renders.push(r)
	if (pendingRender) return;
	pendingRender = true
	requestAnimationFrame(renderAll)
}

HTMLElement.prototype.__defineSetter__("render", function (renderFunction) {
	this._reRender = () => this.render = renderFunction
	if (!this.canvas) {
		const c = COM.createElement("canvas")
		this.appendChild(c)
		this.canvas = c
		this.mutationObserver = new MutationObserver(() => {
			this._reRender()
		})
		this.mutationObserver.observe(this, {
		  attributes: true,
		  attributeFilter: ['style']
		})
	}
	pendRender({scope:this,rend:renderFunction})
})
HTMLElement.prototype.__defineGetter__("renderHelpers", function () {
	if (!this._renderHelpers) {
		this._renderHelpers = new ObservableProxy({})
		this._renderHelpers("set", ({ success }) =>  {
			if (!success) return;
			if (this._reRender)
				this._reRender()
		})
	}
	return this._renderHelpers
})


})()
//*/

const truthy = input => input
const unique = (item, index, list) => list.indexOf(item) === index
const flatten = obj => Object.fromEntries(
	[].concat(...Object.entries(obj).map(([ key, val ]) => {
		if (typeof val === 'object')
			return Object.entries(flatten(val)).map(([k,v]) => [`${key}.${k}`, v])
		return [[key, val]]
	}))
)
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


const getDefaultSize = () => ({
	width: 40, height: 40
})
const popup = (config, content) => {
	const popupContainer = document.createElement("div")
	popupContainer.classList.add("popup-container")
	popupContainer.style.zIndex = layers.editOverlay

	const popupElement = document.createElement("div")
	popupElement.classList.add("popup-element")

	const popupButtons = document.createElement("div")
	popupButtons.classList.add("popup-buttons")

	const callbacks = {
		accept(){},
		deny(){},
		close(){}
	}

	if (config.deny !== false) {
		const popupDeny = document.createElement("div")
		popupDeny.innerHTML = config.deny || "Cancel"
		popupButtons.appendChild(popupDeny)
		popupDeny.classList.add("popup-button")
		popupDeny.classList.add("popup-deny")
		popupDeny.onclick = () => {
			popupContainer.remove()
			callbacks.close()
			callbacks.deny()
		}
	}
	if (config.accept !== false) {
		const popupAccept = document.createElement("div")
		popupAccept.innerHTML = config.accept || "Okay"
		popupButtons.appendChild(popupAccept)
		popupAccept.classList.add("popup-button")
		popupAccept.classList.add("popup-accept")
		popupAccept.onclick = () => {
			popupContainer.remove()
			callbacks.close()
			callbacks.accept()
		}
	}
	if (config.title !== false) {
		const popupTitle = document.createElement("h2")
		popupTitle.innerHTML = config.title || "Popup"
		popupElement.appendChild(popupTitle)
		popupTitle.classList.add("popup-title")
	}
	if (content) {
		const popupContent = document.createElement("div")
		popupContent.appendChild(content)
		popupElement.appendChild(popupContent)
		popupContent.classList.add("popup-content")
	}

	popupContainer.appendChild(popupElement)

	popupElement.appendChild(popupButtons)

	document.body.appendChild(popupContainer)

	return {
		accept(callback) {
			callbacks.accept = callback
			return this
		},
		deny(callback) {
			callbacks.deny = callback
			return this
		},
		close(callback) {
			callbacks.close = callback
			return this
		}
	}
}
const normalizeBox = (pointA, pointB) => {
	const x = Math.min(pointA.x, pointB.x)
	const y = Math.min(pointA.y, pointB.y)
	const dx = pointB.x - pointA.x
	const dy = pointB.y - pointA.y
	const w = Math.abs(dx)
	const h = Math.abs(dy)
	const xd = Math.sign(dx)
	const yd = Math.sign(dy)
	return {
		x, y, w, h, xd, yd
	}
}

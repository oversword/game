

const applyStyles = (element, styles) => {
	Object.assign(element.style, styles)
}
const layersList = [
	"field",
	"group",
	"component",
	"target",
	"connectionNode",
	"connection",
	"interface",
	"newComponent",
	"playField",
	"abovePlayField",
	"editOverlay"
]
const layers = layersList.reduce((layers, name, index) => ({
	...layers,
	[name]: index+1
}), {})
const size = 40
const spacing = 25

const style = {
	field: {
		width: "100%",
		height: "100%"
	},
	palette: {
		left: 10,
		top: 10,
		width: size+spacing,
		zIndex: layers.interface,
		border: "1px solid #000000",
		background: "#AAAAFF",
	},
	separator: {
		// border: "1px solid #000000",
		left: (spacing/2) + 5,
		width: size-10,
	},
	button: {
		top: 10,
		width: 30,
		height: 30
	},
	buttonAbovePlayfield: {
		zIndex: layers.abovePlayField
	},
	connection: {
		width: 0,
		height: 0,
		minWidth: 1,
		minHeight: 1,
	},
	selection: {
		border: "1px solid #999999",
		background: "rgba(0,0,200, 0.2)",
	},
	selected: {
		background: "rgba(0,0,200, 0.2)",
	},
	notSelected: {
		background: "",
	},
	target: {
		left: 0,
		top: 0,
		right: 0,
		bottom: 0,
		margin: "auto",
		width: 15,
		height: 15,
		zIndex: layers.target,
	},
	active: {
		color: "#FF0000"
	},
	notActive: {
		color: "#000000"
	},
	dragHelper: {
		zIndex: layers.newComponent
	},
	resizeSE: {
		right: -3,
		bottom: -3,
		width: 10,
		height: 10,
	},
	targetSW: {
		left: -7,
		bottom: -7,
		width: 15,
		height: 15,
	},
	rotateNE: {
		right: -3,
		stop: -3,
		width: 10,
		height: 10,
		// border: "1px solid #AAAAAA",
	},
	group: {
		border: "1px solid #000000",
		zIndex: layers.group
	},
	fieldComponent: {
		width: size,
		height: size,
		zIndex: layers.component
	},
	paletteComponent: {
		// border = "1px solid #000000"
		left: (spacing/2),
		width: size,
		height: size,
	},
	node: {
		zIndex: layers.connectionNode,
		top: 0,
		bottom: 0,
		margin: "auto",

		width: 10,
		height: 10,
	},
	inputNode: {
		left: -5
	},
	outputNode: {
		right: -5
	},
	targetsNode: {
		top: -5,
		bottom: 'auto',
		right: 0,
		left: 0,
	},
	targetedNode: {
		bottom: -5,
		top: 'auto',
		right: 0,
		left: 0,
	},
	playField: {
		width: "100%",
		height: "100%",
		zIndex: layers.playField,
		background: "rgba(255,255,255,0.6)",
	},
	editOverlay:{
		top: 0,
		left: 0,
		width: "100%",
		height: "100%",
		zIndex: layers.editOverlay,
		background: "rgba(255,255,255,0.8)",
	}
}

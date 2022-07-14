
INTERFACE_SYSTEM
.define(({
	htma
}) =>
'tabs', FACE => {
	FACE.htma.add(class Tabs {
		static template = `
		<div.tabs pos="absolute; width; height; top; left">
			<div.tabs-list pos="height:40;">
				<for#tab in=tabs key=t >
					<Tab
						<if exp="t === currentTab">
							active=<var#true>
						<args#tab>
						onclick=<fun#handleTabClick(tab)>
						onclose=<fun#handleTabClose(tab)>
					>
			<div.tabs-contents pos="height:100%-40px" >
				<TabContent <args#tabs[currentTab]> >
		`
		handleTabClick(tab) {
			const index = this.tabs.indexOf(tab)
			if (index === this.currentTab) return;
			if (index === -1) return;

			currentTab = index
			this.onchange(index, this.tabs[index])
		}
		handleTabClose(tab) {
			const index = this.tabs.indexOf(tab)
			if (index === -1) return;

			if (!this.canclose(index, tab)) return;

			this.tabs.splice(index, 1)

			this.onclose(index, tab)
		}
		onchange(){}
		onclose(){}
		canclose(){return true}
		tabs = []
		currentTab = -1
	})
	FACE.htma.add(class Tab {
		static template = `
		<div.tab
			pos="float:left; height;"
			onclick=<fun#handleTabClick()>
			<if#active>
				class="tab-active"
		>
			<div.tab-container>
				<if#icon>
					<i.tab-icon class=<var#icon> >
				<span.tab-label>
					<var#label>
				<button.tab-close-button onclick=<fun#handleTabClose(event)> >
					x
		`
		active = false
		onclick = () => {}
		onclose = () => {}
		label = ''
		handleTabClick() {
			this.onclick()
		}
		handleTabClose(event) {
			event.cancelBubble = true
			this.onclose()
			return false
		}
	})
	FACE.htma.add(class TabContent {
		static template = `
		<div.tab-content pos="width;height;" >
			<if#domContent>
				<div pos="width;height;" onload=<fun#loadDomContent(this)> >
		`
		domContent = null

		loadDomContent(el) {
			el.append(this.domContent)
		}
	})




	const container = document.createElement('div')
	document.body.appendChild(container)

	const oncloseCallbacks = []
	const cancloseCallbacks = []
	let currentTab = 0
	const args = {
		tabs: [],
		get currentTab() {
			if (!currentTab && args.tabs.length)
				currentTab = 0
			if (currentTab >= args.tabs.length)
				currentTab = args.tabs.length-1
			return currentTab
		},
		set currentTab(newVal) {
			const index = args.tabs.findIndex(tab => (tab.id || tab.label) === newVal)
			if (index === -1) return false
			currentTab = index
			return true
		},
		canclose: (...a) => {
			const index = cancloseCallbacks.findIndex(callback => !callback(...a))
			return index === -1
		},
		onclose: (...a) => {
			oncloseCallbacks.forEach(callback => {
				callback(...a)
			})
			reRender()
		},
		onchange: (index, tab) => {
			args.currentTab = index
			reRender()
		}
	}


	const reRender = () => {
		requestAnimationFrame(() => {
			container.innerHTML = FACE.htma.parse(`<Tabs <args#args> >`, { args });
			[...container.querySelectorAll('[onload]')].forEach(el => {
				el.dispatchEvent(new Event('load'))
			})
		})
	}

	reRender()

	return {
		set onclose(callback) {
			oncloseCallbacks.push(callback)
		},
		set canclose(callback) {
			cancloseCallbacks.push(callback)
		},
		add(tab) {
			args.tabs.push(tab)
			reRender()
		},
		set selected(tab) {
			const type = typeof tab
			let id;
			if (type === 'object')
				id = tab.id || tab.label
			else id = tab
			const index = args.tabs.findIndex(t => (t.id || t.label) === id)
			if (index === -1)
				return false
			currentTab = index
			reRender()
			return true
		},
		get selected() {
			return args.tabs[args.currentTab]
		},
		del() {

		}
	}

})

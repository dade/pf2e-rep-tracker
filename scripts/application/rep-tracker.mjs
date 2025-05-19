const { ApplicationV2, HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api
import { ReputationSystem } from "../reputation/system.mjs"
import { Settings } from "../helpers/settings.mjs"

const MODULE = "pf2e-rep-tracker"

export default class PF2eReputation extends HandlebarsApplicationMixin(ApplicationV2) {

	static DEFAULT_OPTIONS = {
		classes: ["rep-tracker"],
		position: {
			width: 520,
			height: 640
		},
		actions: {
			addReputation: PF2eReputation.addReputation,
			editReputation: PF2eReputation.editReputation,
			resetDB: PF2eReputation.resetDB
		},
		window: {
			icon: "fas fa-flag",
			title: "Reputation",
			resizable: true,
			controls: [
				{
					icon: "fas fa-plus",
					label: "Add Reputation",
					action: "addReputation"
				},
				{
					icon: "fas fa-trash",
					label: "Reset All Data",
					action: "resetDB"
				}
			]
		},
		form: {
			closeOnSubmit: false,
			submitOnChange: true
		}
	}

	static PARTS = {
		tabs: {
			template: "templates/generic/tab-navigation.hbs"
		},
		faction: {
			template: "./modules/pf2e-rep-tracker/templates/reputation/faction.hbs",
			scrollable: [""]
		},
		npc: {
			template: "./modules/pf2e-rep-tracker/templates/reputation/npc.hbs",
			scrollable: [""]
		}
	}

	static TABS = {
		reputation: {
			tabs: [
				{ id: "faction", icon: "fas fa-people", label: "Faction" },
				{ id: "npc", icon: "fas fa-person", label: "NPC" },
			],
			initial: "faction"
		}
	}

	_prepareTabs(group) {
		const tabs = super._prepareTabs(group)
		return tabs
	}

	async _prepareContext(options) {
		let context = await super._prepareContext(options)
		context.party = Settings.get(Settings.KEYS.REP_DB)

		context.tabs = {
			faction: {
				cssClass: this.tabGroups.reputation === "faction" ? "active" : ""
			},
			npc: {
				cssClass: this.tabGroups.reputation === "npc" ? "active" : ""
			}
		}

		context = foundry.utils.mergeObject(context, {
			tabs: this._prepareTabs("reputation")
		})

		return context
	}

	async _preparePartContext(partId, context) {
		switch (partId) {
			case "faction":
			case "npc":
				context.tab = context.tabs[partId]
				break
			default:
		}
		return context
	}

	async _onRender(context, options) {
		await super._onRender(context, options)

		const thisEl = this.element

		// # Expand/Collapse
		let expandBtn = thisEl.querySelectorAll("a.expand")
		expandBtn.forEach(btn => {
			btn.addEventListener("click", async (event) => {
				await ReputationSystem.expandReputation(event).then(() => {
					this.render(true)
				})
			})
		})

		// # Delete Entry
		let deleteBtn = thisEl.querySelectorAll(".rep-controls .delete")
		deleteBtn.forEach(btn => {
			btn.addEventListener("click", async (event) => {
				await ReputationSystem.deleteReputation(event).then(() => {
					this.render(true)
				})
			})
		})

		// # Tab Management
		// TODO: Fix this to be dynamic... yikes
		let tabBtn = thisEl.querySelectorAll("a[data-action=tab]")
		tabBtn.forEach(btn => {
			btn.addEventListener("click", async (event) => {
				const tab = event.currentTarget.dataset.tab

				$(this.parts[tab]).addClass("active")

				if (tab === "npc") {
					$(this.parts.faction).removeClass("active")
				} else {
					$(this.parts.npc).removeClass("active")
				}

				this.changeTab(tab, "reputation")
			})
		})

		let inputFields = thisEl.querySelectorAll("input")
		inputFields.forEach(f => {
			f.addEventListener("change", async (event) => {
				await this._onChangeInput(event)
			})
		})

		let editCog = thisEl.querySelectorAll(".rep-controls .edit")
		editCog.forEach(btn => {
			btn.addEventListener("click", async (event) => {
				// NOTE: Dialog...?
				const et = event.currentTarget.closest(".party-rep")
				const id = et.dataset.id
				const type = $(et).hasClass("faction") ? "faction" : "npc"

				PF2eReputation.editReputation(id, type, this)
			})
		})
	}

	async _onChangeInput(event) {
		const target = event.currentTarget
		
		// INFO: using data-field-id, we assign each input with an id that lets us figure out its
		// origin and target, so we know exactly where we need to update the data.
		// this is achieved by getting `event.currentTarget.dataset.fieldId`
		const p = target.dataset.fieldId.split("-")
		const rep = {
			id: p[1],
			type: p[0] + "s",
			actor: p[2],
			field: p[3],
			value: target.value
		}

		if (rep.field === rep)
			rep.value = int(rep.value)

		const db = Settings.get(Settings.KEYS.REP_DB)
		const entry = db[rep.type].find(r => r.id === rep.id)

		if (!entry)
			return

		if (rep.field === "rep") {
			if (rep.actor.includes("Actor")) {
				entry.pcs.find(a => a.uuid === rep.actor).value = rep.value
			} else {
				entry.value = rep.value
			}
		} else if (rep.field === "name") {
			entry.name = rep.value
		}

		Settings.set(Settings.KEYS.REP_DB, db)
		this.render(true, { focus: true })
	}

	changeTab(tab, group, options = {}) {
		super.changeTab(tab, group, options)
		this.tabGroups[group] = tab
		this.render(true)
	}

	async _renderHTML(context, options) {
		const rendered = await super._renderHTML(context, options)
		return rendered
	}

	get title() {
		return `${game.i18n.localize(this.options.window.title)}`
	}

	static async addReputation() {
		// NOTE: create a modal to input faction data
		// on accept, push data into the "create" script
		const fields = foundry.applications.fields;

		const repType = fields.createSelectInput({
			options: [
				{
					label: "Faction",
					value: "faction"
				},
				{
					label: "NPC",
					value: "npc"
				}
			],
			name: "repType",
			autofocus: true
		})

		const repName = fields.createTextInput({
			name: "repName",
			value: `Name`,
		})

		const repTypeGroup = fields.createFormGroup({
			input: repType,
			label: "Reputation Type",
			hint: "Select the type of reputation."
		})

		const repNameGroup = fields.createFormGroup({
			input: repName,
			label: "Name",
			hint: "Enter the name of the reputation."
		})

		const content = `${repTypeGroup.outerHTML} ${repNameGroup.outerHTML}`

		new DialogV2({
			window: { title: "Create New Faction" },
			content: content,
			buttons: [{
				label: "Create",
				default: true,
				callback: (event, button, dialog) => {
					return {
						type: button.form.elements.repType.value,
						name: button.form.elements.repName.value
					}
				}
			}],
			submit: async (result) => {
				if (!result)
					return

				await ReputationSystem.addReputation(result.type, result.name).then(() => {
					this.render(true)
				})
			}
		}).render({ force: true })
	}

	static async editReputation(id, type, app) {
		const db = Settings.get(Settings.KEYS.REP_DB)
		const fields = foundry.applications.fields
		const entry = db[type + "s"].find(r => r.id === id)
		type = type + "s"

		const showpcs = fields.createCheckboxInput({
			value: entry.showpcs,
			name: "showpcs",
		})

		const useInfluence = fields.createCheckboxInput({
			value: entry.useInfluence,
			name: "useInfluence",
		})

		const showpcsGroup = fields.createFormGroup({
			input: showpcs,
			label: "Show PCs",
			hint: "Show individual PCs in the reputation?"
		})

		const influenceGroup = fields.createFormGroup({
			input: useInfluence,
			label: "Use Influence",
			hint: "Use the Influence system for PF2e rather than the Reputation system. Influence thresholds can be set up."
		})

		if (useInfluence.checked) {
			showpcs.checked = true
			showpcs.disabled = true
		}

		let content = `${showpcsGroup.outerHTML}`
		if (type === "npcs") {
			content += `${influenceGroup.outerHTML}`
		}

		new DialogV2({
			window: { title: "Edit Reputation: " + entry.name},
			position: {
				width: 500
			},
			form: {
				closeOnSubmit: true,
				submitOnChange: false
			},
			content,
			buttons: [{
				label: "Save",
				callback: (event, button, dialog) => {
					let res = {
						showpcs: button.form.elements.showpcs.checked
					}

					if (button.form.elements.useInfluence)
						res.useInfluence = button.form.elements.useInfluence.checked

					return res
				}
			}],
			submit: async (res) => {
				const db = Settings.get(Settings.KEYS.REP_DB)
				const entry = db[type].find(r => r.id === id)

				if (res.useInfluence === true)
					entry.shownpcs = true
				else
					entry.showpcs = res.showpcs

				entry.useInfluence = res.useInfluence

				Settings.set(Settings.KEYS.REP_DB, db)
				app.render(true, { focus: true })
			}
		}).render(true)
	}

	async close(options = {}) {
		super.close(options)
	}

	static async resetDB() {
		const reset = await DialogV2.confirm({
			id: "reset-reputation-confirm",
			modal: true,
			window: {
				title: "CAUTION!"
			},
			content: `<p align="center">You are about to delete and reset all reputation data.<br/>Are you sure?`
		})

		if (!reset)
			return
		else
			await ReputationSystem.resetDB().then(() => {
				setTimeout(async () => {
					this.render(true, { focus: true })
				}, 500)
			})
	}

}

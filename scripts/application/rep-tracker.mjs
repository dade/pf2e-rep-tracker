const { ApplicationV2, HandlebarsApplicationMixin, DialogV2, DocumentreputationV2 } = foundry.applications.api
import { REPUTATION_SCHEMA as REPUTATION } from "../consts.mjs"
import { ReputationSystem } from "../reputation/system.mjs"

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
			reputationReset: PF2eReputation.reputationReset,
			editReputation: PF2eReputation.editReputation
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
					action: "reputationReset"
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
		context.party = game.actors.party.getFlag(MODULE, "reputation")

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

		// NOTE:
		// Tabs appear to work without the need of explicitly creating a
		// custom listener now. As if fixed overnight... I don't remember
		// what I did to make this happen. Going to leave this code
		// commented here just in case it's a blip
		//
		// # Tab Management
		//let tabBtn = thisEl.querySelectorAll("a[data-action=tab]")
		//tabBtn.forEach(btn => {
		//	btn.addEventListener("click", async (event) => {
		//		const tab = event.currentTarget.dataset.tab
		//
		//		$(this.parts[tab]).addClass("active")
		//
		//		if (tab === "npc") {
		//			$(this.parts.faction).removeClass("active")
		//		} else {
		//			$(this.parts.npc).removeClass("active")
		//		}
		//
		//		this.changeTab(tab, "reputation")
		//	})
		//})

		// Input field onChange
		let inputFields = thisEl.querySelectorAll("input")
		inputFields.forEach(f => {
			f.addEventListener("change", async (event) => {
				await this._onChangeInput(event)
			})
		})

		// Edit reputation
		let editCog = thisEl.querySelectorAll(".rep-controls .edit")
		editCog.forEach(btn => {
			btn.addEventListener("click", async (event) => {
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

		const flags = await game.actors.party.getFlag(MODULE, "reputation")
		const entry = flags[rep.type].find(r => r.id === rep.id)

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

		await game.actors.party.setFlag(MODULE, "reputation", flags).then(async () => {
			this.render(true)
		})
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
		// TODO:
		// - Find a way to get the tab we're on and if it is not
		// the same as the entry we're creating, switch to the relevant
		// tab?? Maybe
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
			value: `Name`
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
			window: { title: "Create Reputation Entry" },
			content: content,
			buttons: [{
				label: "Create",
				default: true,
				autofocus: false,
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
					this.tabGroups.reputation = result.type
					this.render(true, { focus: true })
				})
			}
		}).render(true)
	}

	static async editReputation(id, type, app) {
		const flags = await game.actors.party.getFlag(MODULE, "reputation")
		const fields = foundry.applications.fields;
		const entry = flags[type + "s"].find(a => a.id === id)
		type = type + "s"

		const showpcs = fields.createCheckboxInput({
			value: entry.showpcs,
			name: "showpcs"
		})

		const useInfluence = fields.createCheckboxInput({
			value: entry.useInfluence,
			name: "useInfluence"
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
				const flags = await game.actors.party.getFlag(MODULE, "reputation")
				const entry = flags[type].find(r => r.id === id)

				entry.showpcs = res.showpcs
				entry.useInfluence = res.useInfluence

				await game.actors.party.setFlag(MODULE, "reputation", flags).then(() => {
					app.render(true)
				})
			}
		}).render(true, { focus: true })
	}

	static async reputationReset() {
		const reset = await DialogV2.confirm({
			id: "reset-reputation-confirm",
			modal: true,
			window: {
				title: "CAUTION!!"
			},
			content: `<p>You are about to reset all reputation data. Are you sure?</p>`
		})

		if (!reset)
			return
		else {
			await ReputationSystem.repopulateData(
				game.actors.party,
				REPUTATION,
				true
			).then(() => {
				setTimeout(async () => {
					await this.render(true)
				}, 500)
			})
		}
	}

}

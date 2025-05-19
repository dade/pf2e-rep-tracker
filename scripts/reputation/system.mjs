import { initHandlebarsHelpers } from "../helpers/handlebars.mjs"
import { Settings } from "../helpers/settings.mjs"

const MODULE = "pf2e-rep-tracker"

export class ReputationSystem {
	
	static app = null

	static async init() {
		initHandlebarsHelpers()
	}

	static async resetDB() {
		Settings.set(Settings.KEYS.REP_DB, {
			factions: [],
			npcs: []
		})
	}

	static async addReputation(type, name) {
		const db = Settings.get(Settings.KEYS.REP_DB)
		const uuid = foundry.utils.randomID(5)
		const members = game.actors.party.members
		let pcs = []

		for (let m of members) {
			let pc = {
				name: m.name,
				uuid: m.uuid,
				value: 0
			}
			pcs.push(pc)
		}

		const repStruct = {
			id: uuid,
			name,
			value: 0,
			pcs,
			expanded: false,
			showpcs: true
		}

		if (type === "npc")
			repStruct.useInfluence = false

		db[type + "s"].push(repStruct)
		Settings.set(Settings.KEYS.REP_DB, db)
	}
	
	static async expandReputation(event) {
		const target = event.currentTarget
		const db = Settings.get(Settings.KEYS.REP_DB)
		const partyRep = target.closest(".party-rep")
		let repType
		let entry

		if ($(partyRep).hasClass("faction"))
			repType = "factions"
		else if ($(partyRep).hasClass("npc"))
			repType = "npcs"

		entry = db[repType].find(rep => rep.id === partyRep.dataset.id)
		if (entry)
			entry.expanded = !entry.expanded

		Settings.set(Settings.KEYS.REP_DB, db)
	}

	static async deleteReputation(event) {
		const target = event.currentTarget
		const db = Settings.get(Settings.KEYS.REP_DB)
		const partyRep = target.closest(".party-rep")
		let repType
		let entry

		if ($(partyRep).hasClass("faction"))
			repType = "factions"
		else if ($(partyRep).hasClass("npc"))
			repType = "npcs"

		entry = db[repType].find(rep => rep.id === partyRep.dataset.id)

		Settings.set(Settings.KEYS.REP_DB, db)
	}

}

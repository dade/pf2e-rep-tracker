import { initHandlebarsHelpers } from "../helpers/handlebars.mjs"

const MODULE = "pf2e-rep-tracker"

export class ReputationSystem {
	
	static app = null

	static async init() {
		// Do we need to fix lib-wrapper patchFunc? Maybe not.

		initHandlebarsHelpers()
	}

	static async buildData(party, schema) {
		await party.setFlag(MODULE, "reputation", schema)
	}

	static async repopulateData(party, schema, rebuildData = false) {
		let data = await party.getFlag(MODULE, "reputation")

		if (rebuildData) {
			await party.setFlag(MODULE, "reputation", null)
			await party.setFlag(MODULE, "reputation", schema)
		}

		if (!data)
			await party.setFlag(MODULE, "reputation", schema)
	}

	static async addReputation(type, name) {
		const party = game.actors.party
		const flags = party.getFlag(MODULE, "reputation")
		const uuid = foundry.utils.randomID(5)
		const members = party.members
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

		console.log(repStruct)

		flags[type + "s"].push(repStruct)
		party.setFlag(MODULE, "reputation", flags)
	}

	static async expandReputation(event) {
		const target = event.currentTarget
		const party = game.actors.party
		const flags = party.getFlag(MODULE, "reputation")
		const partyRep = target.closest(".party-rep")
		let repType
		let entry

		if ($(partyRep).hasClass("faction"))
			repType = "factions"
		if ($(partyRep).hasClass("npc"))
			repType = "npcs"

		entry = flags[repType].find(rep => rep.id === partyRep.dataset.id)

		if(entry)
			entry.expanded = !entry.expanded

		await party.setFlag(MODULE, "reputation", flags)
	}

	static async deleteReputation(event) {
		const target = event.currentTarget
		const party = game.actors.party
		const flags = party.getFlag(MODULE, "reputation")
		const partyRep = target.closest(".party-rep")
		let repType
		let entry

		if ($(partyRep).hasClass("faction"))
			repType = "factions"
		else if ($(partyRep).hasClass("npc"))
			repType = "npcs"

		entry = flags[repType].find(rep => rep.id === partyRep.dataset.id)

		if (entry) {
			const flagIndex = flags[repType].indexOf(entry)
			flags[repType].splice(flagIndex, 1)
		}

		await party.setFlag(MODULE, "reputation", flags)
	}

}

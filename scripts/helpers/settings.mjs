const MODULE = "pf2e-rep-tracker"

export class Settings {
	static KEYS = Object.freeze({
		VIS_PLAYER: "visibleToPlayers",
		REP_DB: "reputationDB"
	})

	static registerSettings() {
		game.settings.register(MODULE, this.KEYS.REP_DB, {
			name: "Reputation DB",
			scope: "world",
			type: Object,
			config: false,
			default: {
				factions: [],
				npcs: []
			}
		})
	}

	static get(name) {
		return game.settings.get(MODULE, name)
	}

	static set(name, value) {
		return game.settings.set(MODULE, name, value)
	}
}

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
		game.settings.register(MODULE, "adminDBResetControls", {
			name: "Admin Reset DB Controls",
			hint: "Turns on a button on the actor screen to kill the DB. This is a hacky way to reset the db in case the rep window doesn't load. Don't use.",
			scope: "world",
			type: Boolean,
			config: true,
			default: false,
			reload: true
		})
	}

	static get(name) {
		return game.settings.get(MODULE, name)
	}

	static set(name, value) {
		return game.settings.set(MODULE, name, value)
	}
}

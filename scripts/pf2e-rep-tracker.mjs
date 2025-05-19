import { default as PF2eReputation } from "./application/rep-tracker.mjs"
import { ReputationSystem } from "./reputation/system.mjs"
import { Settings } from "./helpers/settings.mjs"
import { REPUTATION_SCHEMA } from "./consts.mjs"

const MODULE = "pf2e-rep-tracker";

Hooks.once("init", async () => {
	ReputationSystem.init()
	Settings.registerSettings()

	// TODO: Work out how to properyly handle toggling the window.
	// Low prior
	//
	//game.keybindings.register(MODULE, "openRep", {
	//	name: "Open Reputation Tracker",
	//	editable: [
	//		{ key: "KeyO" }
	//	],
	//	onDown: ???
	//})
})

Hooks.once("ready", () => {
	console.log("Reputation Tracker | READY")
});

Hooks.on("ready", () => {
	const rep = new PF2eReputation()

	$(".actors-sidebar .directory-header .header-actions").after(
		`<div class="header-actions action-buttons flexrow">
	       <button type="button" class="button" data-action="openReputation">
	           <i class="fa-solid fa-flag"></i>
	           <span>Open Reputation</span>
	       </button>
	   </div>`
	)

	$("button[data-action=openReputation]").on("click", () => rep.render(true))
})

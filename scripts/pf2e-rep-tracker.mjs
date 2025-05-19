import { default as PF2eReputation } from "./application/rep-tracker.mjs"
import { ReputationSystem } from "./reputation/system.mjs"
import { Settings } from "./helpers/settings.mjs"
import { REPUTATION_SCHEMA } from "./consts.mjs"

const MODULE = "pf2e-rep-tracker";

// TODO:
// - Transition storage of Reputation data to game.settings rather than party flags
// - Revert compatibility attempts for V12 and just stick to V13. We're not making this backward compat
// - Look into potential styling
// - Try to fix TABS to use AppV2 properly, and not the abominatiion that we're currently running

Hooks.once("init", async () => {
	ReputationSystem.init()
	Settings.registerSettings()
})

Hooks.once("ready", () => {
	console.log("Reputation Tracker | READY")
});

Hooks.on("ready", () => {
	const rep = new PF2eReputation()
	
	if (!game.user.isGM && !Settings.get(Settings.KEYS.VIS_PLAYER))
		return

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

import { default as PF2eReputation } from "./application/rep-tracker.mjs"
import { ReputationSystem } from "./reputation/system.mjs"
import { Settings } from "./helpers/settings.mjs"
import { REPUTATION_SCHEMA } from "./consts.mjs"

const MODULE = "pf2e-rep-tracker"

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
})

Hooks.on("ready", (html) => {
	if (!game.user.isGM)
		return

	if (game.settings.get(MODULE, "adminDBResetControls"))
		$(".actors-sidebar .directory-header .header-actions").after(
			`<div class="header-actions action-buttons flexrow">
				<button type="button" class="button" data-action="resetDB">
					 <i class="fa-solid fa-cancel"></i>
					 <span>Reset Rep DB</span>
				</button>
			</div>`
		)

	$("button[data-action=resetDB]").click((html, data, other) => {
		ReputationSystem.resetDB()
	})
})

Hooks.on("renderSceneControls", (app, html, data) => {
	if (!game.user.isGM)
		return

	if (html.querySelector(".open-rep-control"))
		return

	const rep = new PF2eReputation()

	if (html.querySelector('button[data-action=openReputation]'))
		return

	const li = document.createElement("li")
	const button = document.createElement("button")

	button.className = "control ui-control layer icon fa-solid fa-flag open-rep-control"
	button.dataset.tooltip = "Open Reputation Tracker"

	li.appendChild(button)
	html.querySelector('menu[id="scene-controls-layers"]').appendChild(li)
	button.addEventListener("click", () => {
		rep.render(true)
	})
})

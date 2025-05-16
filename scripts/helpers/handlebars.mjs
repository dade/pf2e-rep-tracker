export function initHandlebarsHelpers() {

	Handlebars.registerHelper("setVar", function(name, val, opts) {
		options.data.root[name] = val
	})

	Handlebars.registerHelper("ifEquals", function(arg1, arg2, opts) {
		return (arg1 == arg2) ? opts.fn(this) : opts.inverse(this)
	})

	Handlebars.registerHelper("getImgFromUUID", function(uuid, opts) {
		return game.actors.find(a => a.uuid === uuid).img
	})

	Handlebars.registerHelper("getRepText", function(value, useInfluence = false) {
		if (useInfluence !== false)
			return "Influence"

		if (value < 20)
			return "(Ignored)"
		else if (value < 60)
			return "(Liked)"
		else if (value < 120)
			return "(Admired)"
		else if (value >= 120)
			return  "(Revered)"
		else
			return "N/A"
	})

}

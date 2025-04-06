export function get_flags(pattern) {
	if (pattern instanceof RegExp) {
		return new Set(pattern.flags);
	} else {
		return new Set();
	}
}
export function get_source(pattern) {
	if (pattern instanceof RegExp) {
		return pattern.source;
	} else {
		return pattern;
	}
}

export function concat(...pattern_list) {
	let pending_source = '';
	const pending_flags = new Set();

	for (const pattern of pattern_list) {

		if (pattern instanceof RegExp) {
			pending_source += pattern.source;
			for (const flag of pattern.flags) {
				pending_flags.add(flag);
			}
		} else {
			pending_source += pattern;
		}
	}

	return new RegExp(pending_source, String.prototype.concat(...pending_flags));
}


export function join(pattern_list, separator, flags=undefined) {
	return new RegExp(pattern_list.map(pattern => get_source(pattern)).join(get_source(separator)), flags);
}


export function update_flag(pattern, flag, state) {
	const pattern_flags = get_flags(pattern);
	if (state) {
		pattern_flags.add(flag);
	} else {
		pattern_flags.delete(flag);
	}
	return new RegExp(pattern.source, String.prototype.concat(...pattern_flags));
}
import { REQUIREMENT_STATE, check_requirement_state, create_conditional_sequential_number_lut } from '../data/management.js';
import * as RE from '../text/regexp.js';
import * as R from '../data/rules.js';
import * as C from '../data/conditions.js';

//TODO - maybe make a span class separate from this?
class Regex_Group_Reference {
	constructor(match, group) {
		Object.assign(this, { match, group });
	}

	get value() {
		return this.match[this.group + 1];
	}

	get span() {
		return this.match.indices[this.group + 1];
	}

	span_relative_to(relative_to, offset=0) {
		const [ssl, ssr] = this.span;
		const [rtl, rtr] = relative_to;
		return [offset + rtl + ssl, offset + rtl + ssr];
	}
}



//TODO - we have so many settings here - we should make it into an object (maybe even a configuration schema object)
export function create_block_rule(tag, handler, include_type=REQUIREMENT_STATE.OPTIONAL, include_name=REQUIREMENT_STATE.OPTIONAL, include_settings=REQUIREMENT_STATE.OPTIONAL, ignore_case=true, name_pattern=/\w+/) {
	const pieces = [];
	const inner = RE.join(tag.split(/\s+/), /\s/);

	const type_used = check_requirement_state(include_type, () => {
		pieces.push(/^(\w+)\s+/);
	}, () => {
		pieces.push('?');
	});

	pieces.push(inner, /:?/);
	const name_used = check_requirement_state(include_name, () => {
		pieces.push('(?:\\s+(', name_pattern, '))');
	}, () => {
		pieces.push('?');
	});

	const settings_used = check_requirement_state(include_settings, () => {
		pieces.push(/(?:\s*(\{.*\}))/);
	}, () => {
		pieces.push('?');
	});

	pieces.push(/\s*$/d);

	const groups = create_conditional_sequential_number_lut({
		type: type_used,
		name: name_used,
		settings: settings_used,
	});

	const pattern = RE.update_flag(RE.concat(...pieces), 'i', ignore_case);

	return new R.Resolution_Rule(new C.Title_Condition(new C.Regex_Condition( pattern )),
		(resolver, item, match) => {
			const regex_groups = match.value.value.slice(1);
			const unpacked = {};
			for (let index=0; index<regex_groups.length; index++) {
				unpacked[groups[index]] = new Regex_Group_Reference(match.value.value, index);
			}

			return handler(resolver, item, match, unpacked);

		}
	);


}


export function create_named_definition_rule(handler, name_pattern=/\w+/, definition_pattern=/.+/) {

	const pieces = [/^\s*/, '(', name_pattern, ')', /\s*:?\s*/, '(', definition_pattern, ')', /\s*$/d];
	const groups = ['key', 'value'];
	const pattern = RE.concat(...pieces);

	return new R.Resolution_Rule(new C.Title_Condition(new C.Regex_Condition( pattern )),
		(resolver, item, match) => {
			const regex_groups = match.value.value.slice(1);
			const unpacked = {};
			for (let index=0; index<regex_groups.length; index++) {
				unpacked[groups[index]] = new Regex_Group_Reference(match.value.value, index);
			}

			return handler(resolver, item, match, unpacked);

		}
	);


}

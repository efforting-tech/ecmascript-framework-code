import { REQUIREMENT_STATE, check_requirement_state, create_conditional_sequential_number_lut } from '../data/management.js';
import * as RE from '../text/regexp.js';
import * as R from '../data/rules.js';
import * as C from '../data/conditions.js';



export function create_block_rule(tag, handler, include_type=REQUIREMENT_STATE.OPTIONAL, include_name=REQUIREMENT_STATE.OPTIONAL, include_settings=REQUIREMENT_STATE.OPTIONAL, ignore_case=true) {
	const pieces = [];
	const inner = RE.join(tag.split(/\s+/), /\s/);

	const type_used = check_requirement_state(include_type, () => {
		pieces.push(/^(\w+)\s+/);
	}, () => {
		pieces.push('?');
	});

	pieces.push(inner, /:?/);
	const name_used = check_requirement_state(include_name, () => {
		pieces.push(/(?:\s+(\w+))/);
	}, () => {
		pieces.push('?');
	});

	const settings_used = check_requirement_state(include_settings, () => {
		pieces.push(/(?:\s*(\{.*\}))/);
	}, () => {
		pieces.push('?');
	});

	pieces.push(/\s*$/);

	const groups = create_conditional_sequential_number_lut({
		type: type_used,
		name: name_used,
		settings: settings_used,
	});

	const pattern = RE.update_flag(RE.concat(...pieces), 'i', ignore_case);

	console.log(groups, pattern);

	return new R.Resolution_Rule(new C.Title_Condition(new C.Regex_Condition( pattern )),
		(resolver, item, match) => {
			const regex_groups = match.value.value.slice(1);
			const unpacked = {};
			for (let index=0; index<regex_groups.length; index++) {
				unpacked[groups[index]] = regex_groups[index];
			}

			return handler(resolver, item, match, unpacked);

		}
	);


}

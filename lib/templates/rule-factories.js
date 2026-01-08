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

/*

	The resulting regular expression becomes:

		^
		  [type]?          → (\w+)\s+
		  <tag>            → e.g., concrete\s+component
		  :?               → optional colon
		  [name]?          → (name_pattern)
		  [settings]?      → (\{.*\})
		\s*$   // with /d to track indices


	Parameter summary

		| Parameter          | Controls                | Affects Pattern      | Captured? |
		| ------------------ | ----------------------- | -------------------- | --------- |
		| `tag`              | literal command         | central `tag` match  | no        |
		| `include_type`     | leading word before tag | `(\w+)\s+`           | yes/no    |
		| `include_name`     | identifier after tag    | `(name_pattern)`     | yes/no    |
		| `include_settings` | trailing `{…}` block    | `(\{.*\})`           | yes/no    |
		| `ignore_case`      | case sensitivity        | adds/removes `/i`    | n/a       |
		| `name_pattern`     | allowed name syntax     | appears inside group | yes       |


*/

export function create_block_rule(tag, handler, include_type=REQUIREMENT_STATE.OPTIONAL, include_name=REQUIREMENT_STATE.OPTIONAL, include_settings=REQUIREMENT_STATE.OPTIONAL, ignore_case=true, name_pattern=/\w+/, capture_tag=false) {
	const { pattern, groups } = create_block_rule_pattern(tag, include_type, include_name, include_settings, ignore_case, name_pattern, capture_tag);
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

//TODO - we have so many settings here - we should make it into an object (maybe even a configuration schema object)
export function create_block_rule_pattern(tag, include_type=REQUIREMENT_STATE.OPTIONAL, include_name=REQUIREMENT_STATE.OPTIONAL, include_settings=REQUIREMENT_STATE.OPTIONAL, ignore_case=true, name_pattern=/\w+/, capture_tag=false) {
	const pieces = [/^/];

	let inner;

	if (tag instanceof RegExp) {
		inner = tag;
	} else {
		inner = RE.join(tag.split(/\s+/), /\s/);
	}


	const type_used = check_requirement_state(include_type, () => {
		pieces.push(/(\w+)\s+/);
	}, () => {
		pieces.push('?');
	});

	if (capture_tag) {
		pieces.push('(', inner, ')', /:?/);
	} else {
		pieces.push(inner, /:?/);
	}



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
	return { pattern, groups };

}



/*

	The resulting regular expression becomes:

	        ^\s*
	          (name_pattern)        → first capture: key
	          \s*:?\s*              → optional colon with surrounding space
	          (definition_pattern)  → second capture: value
	        \s*$   // with /d to track indices


	Parameter summary

	        | Parameter            | Controls                       | Affects Pattern              | Captured? |
	        | -------------------- | ------------------------------ | ---------------------------- | --------- |
	        | `handler`            | callback receiving key/value   | not part of regex            | n/a       |
	        | `name_pattern`       | syntax of the key              | first capture group          | yes       |
	        | `definition_pattern` | syntax of the value            | second capture group         | yes       |


	Captured groups (in order)

	        1. `key`   → text matched by `name_pattern`
	        2. `value` → text matched by `definition_pattern`


*/

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

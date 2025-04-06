import { Enum } from '../enum.js';
import { run_callback } from '../operations/callback.js';


export const REQUIREMENT_STATE = new Enum('REQUIREMENT_STATE', {
	MANDATORY: Symbol,
	OPTIONAL: Symbol,
	NOT_ALLOWED: Symbol,
});



export function check_requirement_state(option, if_used, if_optional, if_not_allowed) {

	switch (option) {
		case REQUIREMENT_STATE.MANDATORY:
			run_callback(if_used);
			return true;

		case REQUIREMENT_STATE.OPTIONAL:
			run_callback(if_used, if_optional);
			return true;

		case REQUIREMENT_STATE.NOT_ALLOWED:
			run_callback(if_not_allowed);
			return false;
		default:
			throw new Error('option must be REQUIREMENT_STATE');
	}
}



export function create_conditional_sequential_number_lut(entries, start=0) {
	const result = {};
	let count = start;

	for (const [key, value] of Object.entries(entries)) {
		if (value) {
			result[count++] = key;
		}
	}
	return result;
}

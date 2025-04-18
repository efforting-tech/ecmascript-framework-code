import * as M from './matches.js';

export class Abstract_Condition {};


//NOTE - Currently we haven't touched on captures here. Maybe this should only be conditions for now and we have to address captures later.

//TODO - refactor to Regexp_Condition
export class Regex_Condition extends Abstract_Condition {
	constructor(pattern) {
		super();
		Object.assign(this, { pattern });
	}

	match(text) {
		const regex_match = text.match(this.pattern);
		if (regex_match) {
			return new M.Condition_Match(this, regex_match);	//TODO - should we use a specific match object?
		}
	}
}



export class Title_Condition extends Abstract_Condition {
	constructor(condition) {
		super();
		Object.assign(this, { condition });
	}

	match(node) {
		const title = node?.title;
		const sub_match = this.condition.match(title);
		if (sub_match) {
			return new M.Condition_Match(this, sub_match);	//TODO - should we use a specific match object?
		}
	}
}


//TODO - figure out if there is need for something like this

/*export class Matches_Sequence extends Abstract_Condition {
	constructor (sequence) {
		super();
		Object.assign(this, { sequence });
	}

	match(item) {
		const condition_sequence = this.sequence;
		if (item.length !== condition_sequence.length) {
			return;
		}

		const result = [];
		for (let index=0; index<condition_sequence.length; index++) {
			const match = condition_sequence[index].match(item[index]);
			if (match) {
				result.push(match);
			} else {
				return;
			}
		}

		return new M.Matched_Sequence(this, result);

	}

}
*/


export class Instance_of extends Abstract_Condition {
	constructor (type) {
		super();
		Object.assign(this, { type });
	}

	match(item) {
		if (item instanceof this.type) {
			return new M.Condition_Match(this, item);
		} else {
			return;
		}
	}

}

export class Value_is extends Abstract_Condition {
	constructor (value) {
		super();
		Object.assign(this, { value });
	}

	match(item) {
		if (item === this.value) {
			return new M.Condition_Match(this, item);
		} else {
			return;
		}
	}
}

export class Type_is extends Abstract_Condition {
	constructor (type) {
		super();
		Object.assign(this, { type });
	}

	match(item) {
		if (typeof item === this.type) {
			return new M.Condition_Match(this, item);
		} else {
			return;
		}
	}
}

export class Constructor_is extends Abstract_Condition {
	constructor (type) {
		super();
		Object.assign(this, { type });
	}

	match(item) {
		if (item?.constructor === this.type) {
			return new M.Condition_Match(this, item);
		} else {
			return;
		}
	}

}



//TODO - this should possibly support variable size captures and captures in general later - but for now it is just a simple condition
export class Partial_Sequence extends Abstract_Condition {
	constructor (sequence) {
		super();
		Object.assign(this, { sequence });
	}

	match(sequence, start_index=0) {
		const sequence_length = this.sequence.length;
		const test_slice = sequence.slice(start_index, start_index + sequence_length);

		//In this basic implementation we can rely on length because we do not have variable size things
		if (test_slice.length == sequence_length) {
			const sub_result = [];

			for (let index=0; index < sequence_length; index++) {
				const sub_match = this.sequence[index].match(test_slice[index]);
				if (sub_match) {
					sub_result.push(sub_match);
				} else {
					return;
				}
			}

			return new M.Sequence_Match(this, sequence, start_index, sub_result);
		}
		return;

	}
}

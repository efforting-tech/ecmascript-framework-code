import * as M from './matches.js';
import * as CA from './captures.js';

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



export class Exact_Sequence extends Abstract_Condition {
	constructor (sequence) {
		super();
		Object.assign(this, { sequence });
	}


	match(sequence) {
		const sequence_length = this.sequence.length;
		//In this basic implementation we can rely on length because we do not have variable size things
		if (sequence.length == sequence_length) {
			const sub_result = [];

			for (let index=0; index < sequence_length; index++) {
				const sub_match = this.sequence[index].match(sequence[index]);
				if (sub_match) {
					sub_result.push(sub_match);
				} else {
					return;
				}
			}

			return new M.Exact_Sequence_Match(this, sequence, sub_result);
		}
		return;
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

		const left = [];
		const right = [];
		let current = left;
		let css_object = null;
		this.sequence.map(item => {
			if (item.constructor === CA.Capture_Sub_Sequence) {
				if (css_object) {
					throw new Error('This implementation only supports one CA.Capture_Sub_Sequence');
				} else {
					css_object = item;
					current = right;
				}
			} else {
				current.push(item);
			};
		});


		if (css_object) {
			const left_start_index = start_index;
			const left_test_slice = sequence.slice(left_start_index, left_start_index + left.length);

			const right_start_index = start_index + sequence_length - right.length;
			const right_test_slice = sequence.slice(right_start_index, right_start_index + right.length);

			const left_match = new Exact_Sequence(left).match(left_test_slice);
			if (!left_match) {
				return;
			}

			const right_match = new Exact_Sequence(right).match(right_test_slice);
			if (!right_match) {
				return;
			}

			const css_start_index = left_start_index + left.length;
			const css_length = sequence_length - left.length - right.length;
			const css_match = new M.Captured_Sequence_Match(css_object, sequence.slice(css_start_index, css_start_index + css_length));

			const sub_result = [];
			if (left_match.value.length) {
				sub_result.push(left_match);
			}

			if (css_match.value.length) {
				sub_result.push(css_match);
			}

			if (right_match.value.length) {
				sub_result.push(right_match);
			}

			return new M.Nested_Sequence_Match(this, sequence, start_index, sub_result);

		} else {
			const test_slice = sequence.slice(start_index, start_index + sequence_length);
			return new Exact_Sequence(this.sequence).match(test_slice);
		}


	}
}

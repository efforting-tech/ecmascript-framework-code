import * as M from './matches.js';

export class Abstract_Condition {};


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

export class Type_is extends Abstract_Condition {
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

import * as M from './matches.js';
import * as CA from './captures.js';


export class Abstract_Condition {

	get capture_classification() {
		return CA.CLASSIFICATION.NO_CAPTURE;
	}

	*walk_sequence() {
		yield this;
	}

};

export class Abstract_Element_Condition extends Abstract_Condition {

	//this comes in handy because we might have a sequence of multiple variable sub sequences.
	match_sequence(sequence) {
		const match = this.match(sequence[0]);
		if (match) {
			return new M.Sub_Sequence_Match(this, match, sequence, 0, 0);
		}
	}

};



export class Regex_Condition extends Abstract_Element_Condition {
	constructor(pattern) {
		super();
		Object.assign(this, { pattern });
	}

	match(text) {
		const regex_match = text.match(this.pattern);
		if (regex_match) {
			return new M.Value_Match(this, regex_match);
		}
	}
}



export class Title_Condition extends Abstract_Element_Condition {
	constructor(condition) {
		super();
		Object.assign(this, { condition });
	}

	match(node) {
		const title = node?.title;
		const sub_match = this.condition.match(title);
		if (sub_match) {
			return new M.Value_Match(this, sub_match);
		}
	}
}


export class Instance_of extends Abstract_Element_Condition {
	constructor (type) {
		super();
		Object.assign(this, { type });
	}

	match(item) {
		if (item instanceof this.type) {
			return new M.Value_Match(this, item);
		} else {
			return;
		}
	}

}

export class Value_is extends Abstract_Element_Condition {
	constructor (value) {
		super();
		Object.assign(this, { value });
	}

	match(item) {
		if (item === this.value) {
			return new M.Value_Match(this, item);
		} else {
			return;
		}
	}
}

export class Type_is extends Abstract_Element_Condition {
	constructor (type) {
		super();
		Object.assign(this, { type });
	}

	match(item) {
		if (typeof item === this.type) {
			return new M.Value_Match(this, item);
		} else {
			return;
		}
	}
}

export class Constructor_is extends Abstract_Element_Condition {
	constructor (type) {
		super();
		Object.assign(this, { type });
	}

	match(item) {
		if (item?.constructor === this.type) {
			return new M.Value_Match(this, item);
		} else {
			return;
		}
	}

}


export class Property extends Abstract_Element_Condition {
	constructor (property, sub_condition) {
		super();
		Object.assign(this, { property, sub_condition });
	}

	match(item) {
		const sub_match = this.sub_condition.match(item[this.property]);
		if (sub_match) {
			return new M.Value_Match(this, sub_match);
		}

	}

}



export class Conjunction extends Abstract_Element_Condition {
	constructor (...sub_conditions) {
		super();
		Object.assign(this, { sub_conditions });
	}

	match(item) {
		const sub_result = [];
		for (const sub_condition of this.sub_conditions) {
			const sub_match = sub_condition.match(item);
			if (sub_match) {
				sub_result.push(sub_match);
			} else {
				return;
			}
		}
		return new M.Value_Match(this, sub_result);
	}

}




export class Union extends Abstract_Element_Condition {
	constructor (...sub_conditions) {
		super();
		Object.assign(this, { sub_conditions });
	}

	match(item) {
		for (const sub_condition of this.sub_conditions) {
			const sub_match = sub_condition.match(item);
			if (sub_match) {
				return new M.Value_Match(this, sub_match);
			}
		}
	}

}






//TODO - deprecate? This seems to be at odds with other conditions
export class Sequence extends Abstract_Condition {
	constructor (sequence, comparator=undefined) {	//TODO: some default comparator - or required?
		super();
		Object.assign(this, { sequence, comparator });
	}

	match(item) {
		const { sequence, comparator } = this;

		if (sequence.length !== item.length) {
			return;
		}

		const sub_matches = [];
		for (let index=0; index < sequence.length; index++) {
			const target = sequence[index];
			const candidate = item[index];
			const sub_match = comparator.is_equal(target, candidate);
			if (sub_match) {
				sub_matches.push(new M.Value_Match(comparator.is_equal, [target, candidate]));
			} else {
				return;
			}
		}
		return new M.Value_Match(this, sub_matches);
	}
}




export class Sequence2 extends Abstract_Condition {
	constructor (...sequence) {
		super();
		Object.assign(this, { sequence });
	}

	match_sequence(sequence) {
		throw new Error('not imple');
	}


	match(item) {
		const { sequence } = this;

		if (sequence.length !== item.length) {
			return;
		}

		const sub_matches = [];
		for (let index=0; index < sequence.length; index++) {
			const target = sequence[index];
			const candidate = item[index];
			const sub_match = target.match(candidate);
			if (sub_match) {
				sub_matches.push(sub_match);
			} else {
				return;
			}
		}
		return new M.Value_Match(this, sub_matches);
	}
}





export class Repeat extends Abstract_Condition {
	//NOTE: I was considering some sort of lazy flag but then that also requires lookahead so I will wait with this a bit
	constructor (sub_condition, min=null, max=null) {
		super();
		Object.assign(this, { sub_condition, min, max });
	}

	match_sequence(sequence) {
		const sub_result = [];
		const { max, min, sub_condition } = this;

		let count = 0;
		while (true) {
			const match = sub_condition.match_sequence(sequence.slice(count));

			if (match) {
				sub_result.push(match.value);
				count++;
				if ((max != null) && count === max) {
					break;
				}
			} else {
				break;
			}

		}

		if ((min != null) && count >= min) {
			return new M.Sub_Sequence_Match(this, sub_result, sequence, 0, count - 1);
		}
	}
}




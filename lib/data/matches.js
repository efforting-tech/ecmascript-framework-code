//TODO - document this
//TODO - write tests
export class Abstract_Matched_Condition {
	constructor(condition, value) {
		Object.assign(this, { condition, value });
	}
};


//TODO - document this
//TODO - write tests
export class Sequence_Match extends Abstract_Matched_Condition {

	constructor(condition, sequence, start_index, value) {
		super(condition, value);
		Object.assign(this, { sequence, start_index });
	}

	get sequence_values() {
		return this.value.map(item => item.value);
	}

	get pending_index() {
		return this.value.at(-1).pending_index;
	}

	transform_replace(...replacement) {

		this.sequence.splice(this.start_index, this.pending_index - this.start_index, ...replacement);
	}

};

//TODO - document this
//TODO - write tests
export class Condition_Match extends Abstract_Matched_Condition {};

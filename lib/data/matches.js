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

//DEPRECATED (why did we do this? Did we have a plan? Should we care?)
/*	get pending_index() {
		return this.value.at(-1).pending_index;
	}
*/
	transform_replace(...replacement) {
		//this.sequence.splice(this.start_index, this.pending_index - this.start_index, ...replacement);
		this.sequence.splice(this.start_index, this.value.length, ...replacement);
	}

};



export class Exact_Sequence_Match extends Abstract_Matched_Condition {

	get sequence_values() {
		return this.value.map(item => item.value);
	}

//DEPRECATED (why did we do this? Did we have a plan? Should we care?)
/*	get pending_index() {
		return this.value.at(-1).pending_index;
	}
*/
	transform_replace(...replacement) {
		//this.sequence.splice(this.start_index, this.pending_index - this.start_index, ...replacement);
		this.sequence.splice(this.start_index, this.value.length, ...replacement);
	}

};

export class Captured_Sequence_Match extends Exact_Sequence_Match {}


//TODO - document this
//TODO - write tests
export class Condition_Match extends Abstract_Matched_Condition {};



//TODO - support nested matches
export class Nested_Sequence_Match extends Sequence_Match {}


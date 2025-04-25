import * as CA from './captures.js';

/*

	There are some problems here with transform. For one, transform doesn't work for all types it can be called on (like nested sequences).
	Sub matches doesn't retain enough information for transform to function.
	One transform may invalidate offsets for another.

	Hierarchical transforms may solve this, but maybe we should in that case have some sort of edit framework that we tie into this. Separating matches from the updates.

*/

//TODO - document this
//TODO - write tests
export class Abstract_Matched_Condition {
	constructor(condition, value) {
		Object.assign(this, { condition, value });
	}

	*walk_captures() {
		if (this.condition instanceof CA.Abstract_Capture) {
			yield this;
		}
	}

	find_capture(identity) {
		for (const capture of this.walk_captures()) {
			if (capture.condition.identity == identity) {
				return capture;
			};
		}
	}

	require_capture(identity) {
		const capture = this.find_capture(identity);
		if (!capture) {
			throw new Error(`Required capture ${identity} not found in ${this}`);
		}
		return capture;
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

	*walk_captures() {
		if (this.condition instanceof CA.Abstract_Capture) {
			yield this;
		}
		for (const sub_item of this.value) {
			yield* sub_item.walk_captures();
		}
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
export class Nested_Sequence_Match extends Sequence_Match {


}


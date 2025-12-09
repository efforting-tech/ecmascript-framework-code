import * as CA from './captures.js';
import { inspect } from 'util';

//Note - transforms should be outside of the matches
//Note - we may have features here to help with walking, finding captures and so on

export class Abstract_Match {
	constructor(condition) {
		Object.assign(this, { condition });
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
			throw new Error(`Required capture ${inspect(identity)} not found in ${inspect(this)}`);
		}
		return capture;
	}

}

export class Abstract_Value_Match extends Abstract_Match {
	constructor(condition, value) {
		super(condition);
		Object.assign(this, { value });
	}
}

export class Abstract_Sub_Sequence_Match extends Abstract_Value_Match {
	constructor(condition, sub_result, sequence_reference, sequence_start=undefined, sequence_end=undefined) {
		super(condition, sub_result);
		Object.assign(this, { sequence_reference, sequence_start, sequence_end });
	}

	*walk_captures() {
		if (this.condition instanceof CA.Abstract_Capture) {
			yield this;
		}
		for (const sub_item of this.value) {
			yield* sub_item.walk_captures();
		}
	}

	get matched_sequence() {
		return this.sequence_reference.slice(this.sequence_start, this.sequence_end + 1);
	}

	get sequence_length() {
		return this.sequence_end - this.sequence_start + 1;
	}

}



export class Abstract_Sequence_Element_Match extends Abstract_Value_Match {
	constructor(condition, element, element_sequence, element_index=undefined) {
		super(condition, element);
		Object.assign(this, { element_sequence, element_index });
	}

}

export class Value_Match extends Abstract_Value_Match {};
export class Sub_Sequence_Match extends Abstract_Sub_Sequence_Match {};
export class Composite_Sequence_Match extends Abstract_Sub_Sequence_Match {};
export class Sequence_Element_Match extends Abstract_Sequence_Element_Match {};

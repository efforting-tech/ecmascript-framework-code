import { Abstract_Condition } from './conditions.js';
import * as CA from './captures.js';
import * as M from './matches.js';


export class Abstract_Sequence_Condition extends Abstract_Condition {

	get capture_classification() {
		let result = CA.CLASSIFICATION.NO_CAPTURE;
		for (const item of this.walk_sequence()) {
			switch (item.capture_classification) {
				case CA.CLASSIFICATION.FIXED_LENGTH_SEQUENCE:
					if (result === CA.CLASSIFICATION.NO_CAPTURE) {
						result = CA.CLASSIFICATION.FIXED_LENGTH_SEQUENCE;	//We can upgrade from no capture to fixed length
					}
					break;
				case CA.CLASSIFICATION.DYNAMIC_LENGTH_SEQUENCE:
					return CA.CLASSIFICATION.DYNAMIC_LENGTH_SEQUENCE;
			}
		}

		return result;
	}

	*walk_sequence() {
		for (const item of this.sequence) {
			yield* item.walk_sequence();
		}
	}


	get length() {

		let count = 0;
		for (const item of this.walk_sequence()) {
			if (item.capture_classification === CA.CLASSIFICATION.DYNAMIC_LENGTH_SEQUENCE) {
				return undefined;
			}
			count++;
		}
		return count;
	}
}

export class Exact_Sequence extends Abstract_Sequence_Condition {
	constructor (sequence) {
		super();
		Object.assign(this, { sequence });
	}

	match(sequence, start_index=0, end_index=undefined) {
		const sequence_length = this.sequence.length;

		if (end_index === undefined) {
			end_index = sequence.length - 1;
		}

		const match_length = end_index - start_index + 1;


		//In this basic implementation we can rely on length because we do not have variable size things
		if (match_length === sequence_length) {
			const sub_result = [];

			for (let index=start_index; index <= end_index; index++) {
				const sub_match = this.sequence[index - start_index].match(sequence[index]);
				if (sub_match) {
					sub_result.push(sub_match);
				} else {
					return;
				}
			}

			return new M.Sub_Sequence_Match(this, sub_result, sequence, start_index, end_index);
		}
		return;
	}

}


//TODO - this should possibly support variable size captures and captures in general later - but for now it is just a simple condition
export class Partial_Sequence extends Abstract_Sequence_Condition {
	constructor (sequence) {
		super();
		Object.assign(this, { sequence });
	}


	match(sequence, start_index=0, end_index=undefined) {
		const sequence_length = this.sequence.length;

		const left = [];
		const right = [];
		let current = left;
		let css_object = null;

		for (const item of this.walk_sequence()) {
			if (item.capture_classification === CA.CLASSIFICATION.DYNAMIC_LENGTH_SEQUENCE) {
				if (css_object) {
					throw new Error('This implementation only supports one CA.Capture_Sub_Sequence');
				} else {
					css_object = item;
					current = right;
				}
			} else {
				current.push(item);
			};
		}

		if (css_object) {
			const left_start_index = start_index;
			const left_end_index = left_start_index + left.length - 1;

			const right_start_index = sequence.length - right.length;
			const right_end_index = sequence.length - 1;

			const left_match = new Exact_Sequence(left).match(sequence, left_start_index, left_end_index);
			if (!left_match) {
				return;
			}

			const right_match = new Exact_Sequence(right).match(sequence, right_start_index, right_end_index);
			if (!right_match) {
				return;
			}


			const css_start_index = left_start_index + left.length;
			const css_end_index = right_start_index - 1;
			const css_match = new M.Sub_Sequence_Match(css_object, null, sequence, css_start_index, css_end_index);	//value is null because we don't have a condition on the sub sequence

			const sub_result = [];
			if (left_match.sequence_length) {
				sub_result.push(left_match);
			}

			if (css_match.sequence_length) {
				sub_result.push(css_match);
			}

			if (right_match.sequence_length) {
				sub_result.push(right_match);
			}

			return new M.Composite_Sequence_Match(this, sub_result, sequence, start_index, end_index);

		} else {

			if (end_index === undefined) {
				end_index = start_index + this.length - 1;
			}

			return new Exact_Sequence(this.sequence).match(sequence, start_index, end_index);
		}


	}
}

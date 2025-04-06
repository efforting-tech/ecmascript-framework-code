import * as C from './conditions.js';
import * as M from './matches.js';



export class Abstract_Sequence_Rule {
	constructor(sequence_condition, sequence_action) {
		Object.assign(this, { sequence_condition, sequence_action });
	}
}

export class Abstract_Rule {
	constructor(condition, action) {
		Object.assign(this, { condition, action });
	}

	match(item) {
		const condition = this.condition;
		if (condition === true) {
			return true;
		} else if (condition === false) {
			return false;
		} else if (condition instanceof C.Abstract_Condition) {
			return condition.match(item);
		} else {
			return condition(item);
		}
	}
}


export class Transform_Rule extends Abstract_Rule {};
export class Resolution_Rule extends Abstract_Rule {};

export class Default_Rule extends Abstract_Rule {
	constructor(action) {
		super(true, action);
	}

}


//TODO - we should have a splitting function in the parser instead I think
/*
export class Sequence_Splitting_Transform_Rule extends Abstract_Sequence_Rule {
	match_sequence(sequence, start_index=0) {

		for (let index=start_index; index<sequence.length; index++) {
			let match;

			if (condition instanceof C.Abstract_Condition) {	//TODO - support conditions that may eat more than one item (sequence conditions)
				match = condition.match(pending_item);
			} else {
				match = condition(pending_item);
			}

		}
	}

}
*/
export class Sequence_Transform_Rule extends Abstract_Sequence_Rule {

	match_sequence(sequence, start_index=0) {
		let index = start_index;
		const result = [];

		for (const condition of this.sequence_condition) {
			let pending_index = index + 1;
			const pending_item = sequence[index];
			let match;

			if (condition instanceof C.Abstract_Condition) {	//TODO - support conditions that may eat more than one item (sequence conditions)
				match = condition.match(pending_item);
			} else {
				match = condition(pending_item);
			}

			//TODO - just for now we will upgrade "true" to an object so that we can write pending_index to it but I think that for later we want to avoid having to deal with this and require our conditions to be proper from the start
			if (match === true) {
				match = {};
			}

			if (match) {
				result.push(match);
				index = match.pending_index = pending_index;
			} else {
				return;
			}
		}

		return new M.Sequence_Match(this, sequence, start_index, result);
	}


};


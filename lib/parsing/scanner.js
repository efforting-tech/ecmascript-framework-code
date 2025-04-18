import { Enum, Enum_get } from '../enum.js';

//TODO - decide if this should live under data/operators or here - maybe this should just be the specific one and we use generic from data/operators

// We will start by its own thing here and then evolve it


const REDUCTION_ORDER = new Enum('REDUCTION_ORDER', {
	RULE_MAJOR: Symbol,
	POSITION_MAJOR: Symbol,
});


export class Reduction_Scanner {

	constructor(rules=[], reduction_order=REDUCTION_ORDER.RULE_MAJOR) {
		Object.assign(this, { rules, reduction_order });
	}

	perform_reduction(sequence) {
		switch(Enum_get(REDUCTION_ORDER, this.reduction_order)) {
			case REDUCTION_ORDER.RULE_MAJOR:
				for (const rule of this.rules) {
					for (let start_index=0; start_index < sequence.length; start_index++) {
						const match = rule.match(sequence, start_index);
						if (match) {
							rule.action(this, sequence, match);
							return true;
						}
					}
				}
				return false;

			case REDUCTION_ORDER.POSITION_MAJOR:
				for (let start_index=0; start_index < sequence.length; start_index++) {
					for (const rule of this.rules) {
						const match = rule.match(sequence, start_index);
						if (match) {
							rule.action(this, sequence, match);
							return true;
						}
					}
				}
				return false;
			default:
				throw new Error(`Unknown reduction order: ${this.reduction_order}`);

		}

	}

	transform(sequence) {
		while (true) {
			if (!this.perform_reduction(sequence)) {
				break;
			}
		}
		return sequence;
	}

}

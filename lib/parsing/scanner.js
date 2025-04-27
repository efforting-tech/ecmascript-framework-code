import { Enum, Enum_get } from '../enum.js';
import { FPR_State } from './state.js';
import { Reduction_Contract, FPR_Contract } from './contracts.js';


//TODO - decide if this should live under data/operators or here - maybe this should just be the specific one and we use generic from data/operators

// We will start by its own thing here and then evolve it


export const REDUCTION_ORDER = new Enum('REDUCTION_ORDER', {
	RULE_MAJOR: Symbol,
	POSITION_MAJOR: Symbol,
});



export class Reduction_Scanner {

	constructor(rules=[], reduction_order=REDUCTION_ORDER.RULE_MAJOR, reduction_contract=new Reduction_Contract) {
		Object.assign(this, { rules, reduction_order, reduction_contract });
		this.clear_transform_state();
		reduction_contract.on_create_scanner(this);
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

	clear_transform_state() {
		this.last_reduction_status = null;
		this.reductions_attempted = 0;
		this.reductions_made = 0;
	}

	transform(sequence) {
		const reduction_contract = this.reduction_contract;
		this.clear_transform_state();
		reduction_contract.on_start_transform(this, sequence);

		while (!reduction_contract.check_if_done(this, sequence)) {
			reduction_contract.assert_readiness(this, sequence);
			this.last_reduction_status = this.perform_reduction(sequence);
			this.reductions_attempted++;
			if (this.last_reduction_status) {
				this.reductions_made++;
				reduction_contract.on_reduction_made(this, sequence);
			}
			reduction_contract.on_reduction_attempted(this, sequence);
		}

		reduction_contract.on_end_transform(this, sequence);
		return sequence;
	}

}

export class Fixed_Point_Reduction_Scanner extends Reduction_Scanner {
	constructor(rules=[], reduction_order=REDUCTION_ORDER.RULE_MAJOR, reduction_contract=new FPR_Contract()) {
		super(rules, reduction_order)
		Object.assign(this, { reduction_contract });
		reduction_contract.on_create_scanner(this);
	}
}


//TODO - graph based reduction scanner
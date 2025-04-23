import { FPR_State } from './state.js';

export class Abstract_Reduction_Contract {
	on_create_scanner(scanner) {}
	on_start_transform(scanner, sequence) {}
	on_end_transform(scanner, sequence) {}
	on_reduction_attempted(scanner, sequence) {}
	on_reduction_made(scanner, sequence) {}

	check_if_done(scanner, sequence) {
		return false;
	}

	assert_readiness(scanner, sequence) {}
}

export class Reduction_Contract extends Abstract_Reduction_Contract {
	check_if_done(scanner, sequence) {
		return scanner.last_reduction_status === false;
	}
}

export class FPR_Contract extends Reduction_Contract {
	constructor(end_condition=null) {
		super();
		Object.assign(this, { end_condition });
	}

	check_if_done(scanner, sequence) {
		if (this.end_condition) {
			return this.end_condition(scanner, sequence);
		} else {
			return super.check_if_done(scanner, sequence);
		}
	}

	on_create_scanner(scanner) {
		Object.assign(scanner, {
			cycle_detected: false,
			state_manager: new FPR_State(),
		});
	}

	on_start_transform(scanner, sequence) {
		super.on_start_transform(scanner, sequence);
		const state_manager = scanner.state_manager;
		state_manager.clear_journal();
		const state = state_manager.gather_state(sequence);	//Log initial state
		state_manager.log_state(state);

		scanner.cycle_detected = false;
	}

	on_reduction_made(scanner, sequence) {
		const state_manager = scanner.state_manager;
		const state = state_manager.gather_state(sequence);

		const pre_count = state_manager.length;
		state_manager.log_state(state);
		const post_count = state_manager.length;

		if (pre_count === post_count) {
			scanner.cycle_detected = true;
		}

	}

	assert_readiness(scanner, sequence) {
		if (scanner.cycle_detected) {
			throw new Error('Cycle detected');
		}
	}

}

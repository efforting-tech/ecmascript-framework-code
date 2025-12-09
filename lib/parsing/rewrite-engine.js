


export class Leftmost_Rewrite_Engine {
	// NOTE: A rewrite engine could, under the assumption it is the only thing mutating sequences, have a cache to prevent re-evaluating conditions over and over when no mutations have occured.
	// TODO: Implement such a feature or possibly make an extension of Rewrite_Engine

	constructor(rules=[]) {
		Object.assign(this, { rules });
	}

	rewrite_once(state, context=null) {

		for (let index=0; index<state.length; index++) {
			const rule_match = this.match(state.slice(index));
			if (rule_match) {
				const { condition, match, action } = rule_match;
				const rewrite_as = action({engine: this, match, state: state.slice(index, index+match.sequence_length), context});
				state.splice(index, match.sequence_length, ...rewrite_as);
				return true;

			}
		}
		return false;

	}

	exhaust_rewrites(state, context=null) {
		let count=0;
		while (this.rewrite_once(state, context)) {
			count++;
		};
		return count;
	}


	match(state) {
		for (const [condition, action] of this.rules) {
			const match = condition.match_sequence(state);
			if (match) {
				return { condition, match, action };
			}
		}
	}

}


//NOTE: This class is made by ChatGPT based on class above - we should clean these two up and make them etend a common one.
export class Priority_Rewrite_Engine {
	constructor(rules = []) {
		Object.assign(this, { rules });
	}

	rewrite_once(state, context = null) {
		for (const [condition, action] of this.rules) {
			// scan left to right, but only for this rule
			for (let index = 0; index < state.length; index++) {
				const match = condition.match_sequence(state.slice(index));
				if (match) {
					const rewrite_as = action({
						engine: this,
						match,
						state: state.slice(index, index + match.sequence_length),
						context
					});
					state.splice(index, match.sequence_length, ...rewrite_as);
					return true; // 🔑 restart with rule #1 again
				}
			}
		}
		return false;
	}

	resolve(item) {
		const state = [item];
		const count = this.exhaust_rewrites(state);
		return [state, count];
	}

	exhaust_rewrites(state, context = null) {
		let count = 0;
		while (this.rewrite_once(state, context)) {
			count++;
		}
		return count;
	}


	match(state) {
		for (const [condition, action] of this.rules) {
			const match = condition.match_sequence(state);
			if (match) {
				return { condition, match, action };
			}
		}
	}
}

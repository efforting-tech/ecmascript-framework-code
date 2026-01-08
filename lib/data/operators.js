import { inspect } from 'util';
import * as TP from '../text/tree-processing.js';

//TODO - there is some overlap between here and dispatchers.js - it should be cleaned up!

/*

	An Operator will use a rule system in order to operate on data.
	These operations are defined in terms of their contract as specified below.

	Name         | Value           | Target Mutation
	------------ | --------------- | ----------------
	Resolver     | 🧱 Required     | 🛑 Forbidden
	Transformer  | 📜 Allowed      | 📜 Allowed
	Visitor      | 🤔 Discouraged  | 🛑 Forbidden


*/

//TODO - Determine if it would make sense to put all abstract types somewhere else - though I am currently leaning towards having them in their proper module.
export class Abstract_Operator {
	constructor(name, rules=[], strict=true) {
		Object.assign(this, { name, rules, strict });
	}

	*iter_rules() {
		for (const rule of this.rules) {
			if (rule instanceof this.constructor) {
				yield* rule.iter_rules();
			} else {
				yield rule;
			}
		}
	}

	get_upstream() {
		const seen = new Set();
		seen.add(this);
		for (const rule of this.rules) {
			if (rule instanceof this.constructor) {
				for (const sub_processor of rule.get_upstream()) {
					seen.add(sub_processor);
				};
			}
		}
		return [...seen];
	}

	[inspect.custom](depth, options, inspect) {
		const { strict, name, rules } = this;
		return `${strict ? 'strict': 'relaxed'} ${this.constructor.name}(${inspect(name, options)} with ${inspect(rules.length, options)} rules)`;

	}

}


//TODO: Unfinished class (Rewrite_Engine?)
export class Generic_Transformer extends Abstract_Operator {
	//TODO - implement
	transform(item) {
		throw new Error(`NOT IMPLEMENTED - Failed to transform the item ${item} using transformer ${this.name}.`)
	}

}

//TODO: Untested class
export class Generic_Resolver extends Abstract_Operator {


	//TODO - Added stack (see Tree_Processor) - must verify it works everywhere we sub dispatch and such - 2025-12-28
	resolve(item, stack=undefined) {
		for (const rule of this.iter_rules()) {
			const match = rule.match(item);
			if (match) {
				return rule.action(this, item, match, stack);
			}
		}

		if (this.strict) {
			this.on_failed_resolution(item, stack);
		}
	}

	on_failed_resolution(item) {
		throw new Error(`Failed to resolve the item ${inspect(item)} using resolver ${inspect(this.name)}.`);
	}

};

//TODO: Unfinished class
export class Scanning_Transformer extends Generic_Transformer {
	//TODO - implement end condition and remove hardcoded transformation limit (should be an option)
	transform(sequence, start_index=0) {
		//NOTE - The working principle of this transformer is that it will reduce the first valid thing it finds, for instance, you may have rules for A * B and A + B, so for the expression 1 + 2 * 3 it would first find the 2 * 3 and reduce that to 6 and then the new sequence 1 + 6 would be reduced to 7.
		//		If we use the state system we could simply make sure that we got a new state and didn't end up in a loop
		//		Another method is that we count actions taken and assume they were mutations and keep going as long as there were mutations


		//TODO - we could use a state snapshot of sequence to know if we are going in a circle but then we also need to provide functions for serializing the sequence to this state



	}

}



export class Tree_Processor extends Generic_Resolver {

	resolve(item, stack=undefined) {
		if (item.title.length > 0) {
			return super.resolve(item, stack);
		} else {
			return this.process_tree(item.body, stack);
		}
	}

	process_node_sequence(node_sequence, stack=undefined) {
		const result = [];
		for (const node of node_sequence) {
			result.push(this.resolve(node, stack));
		}
		return result;
	}

	process_tree(tree, stack=undefined) {
		return this.process_node_sequence(tree, stack);
	}

	process_node(node, stack=undefined) {
		return this.resolve(node, stack);
	}

	process_text(text, stack=undefined) {
		return this.process_tree(TP.Node.from_string(text), stack);
	}

	on_failed_resolution(item, stack=undefined) {
		throw new Error(`Failed to resolve the node ${inspect(item.title)} using resolver ${inspect(this.name)}.`);
	}


}


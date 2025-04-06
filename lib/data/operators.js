import { inspect } from 'util';
import * as TP from '../text/tree-processing.js';

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
}


//TODO: Unfinished class
export class Generic_Transformer extends Abstract_Operator {
	//TODO - implement
	transform(item) {
		throw new Error(`NOT IMPLEMENTED - Failed to transform the item ${item} using transformer ${this.name}.`)
	}

}

//TODO: Untested class
export class Generic_Resolver extends Abstract_Operator {

	resolve(item) {
		for (const rule of this.rules) {
			const match = rule.match(item);
			if (match) {
				return rule.action(this, item, match);
			}
		}

		if (this.strict) {
			this.on_failed_resolution(item);
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

		for (let q=0; q<5; q++) {

			const remaining = sequence.length - start_index;
			if (!remaining) {
				return;
			}

			let index = start_index;
			let actions_taken = 0;

			for (const rule of this.rules) {
				const match = rule.match_sequence(sequence, index);
				if (match) {
					if (rule.sequence_action) {
						rule.sequence_action(this, match);
						actions_taken++;
					}
					index = match.pending_index;
				}
			}

			//Next step is to figure out how to deal with arguments (comma)
			//Maybe we should split the tokens up first and then transform each remaining part.
			//Could we do some matching that says "if there is a comma in the entire things, we split it up"?
			console.log("Start index:", start_index, "End index:", index, 'Actions taken:', actions_taken);
			if (!actions_taken) {
				//throw new Error(`Failed to transform ${inspect(sequence)} at position ${start_index} using resolver ${inspect(this.name)}.`);
				console.log("We are possibly finished");
				break;
			}


		}

	}

}



export class Tree_Processor extends Generic_Resolver {

	process_node_sequence(node_sequence) {
		const result = [];
		for (const node of node_sequence) {
			result.push(this.resolve(node));
		}
		return result;
	}

	process_tree(tree) {
		return this.process_node_sequence(tree.iter_nodes());
	}

	process_node(node) {
		return this.resolve(node);
	}

	process_text(text) {
		return this.process_tree(TP.Node.from_string(text).body);
	}

	on_failed_resolution(item) {
		throw new Error(`Failed to resolve the node ${inspect(item.title)} using resolver ${inspect(this.name)}.`);
	}


}


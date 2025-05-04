import * as tt_processing from '../../lib/text/tree-processing.js';
import { Resolution_Rule } from '../../lib/data/rules.js';
import { Tree_Processor } from '../../lib/data/operators.js';
import { Title_Condition, Regex_Condition } from '../../lib/data/conditions.js';


const TP = new Tree_Processor('Test resolver', [

	new Resolution_Rule(new Title_Condition(new Regex_Condition( /Child\s+(\d+)/ )),
		(resolver, item, match) => {
			//console.log(match.value.value);	//This could possibly be simplified if we have a getter for value (or regex value even) - but on the other hand it may add clutter
			return parseInt(match.value.value[1]);
		}
	),
]);



const root = tt_processing.Node.from_string(`

	Root
		Child 1
			Grand child 1
		Child 2

`)

const [root_node] = root.iter_valid_nodes();

const [A, B] = TP.process_tree(root_node.body);

if (A !== 1 || B !== 2) {
	throw new Error(`Unexpected output: ${A}, ${B}`);
}
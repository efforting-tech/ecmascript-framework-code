import { assert_equality } from '../framework/utils.js';
import * as tt_processing from '../../lib/text/tree-processing.js';
import * as log from '../../lib/debug/console.js';


const root = tt_processing.Node.from_string(
`	Root

		Child 1
			Grand child 1
		Child 2

	other-root
		more stuff
`)


assert_equality(root.body.owner.to_text(), '\n\t\tChild 1\n\t\t\tGrand child 1\n\t\tChild 2\n');
assert_equality([...root.iter_nodes().map(node => node.to_text())], ['\tRoot\n\n\t\tChild 1\n\t\t\tGrand child 1\n\t\tChild 2\n', '\tother-root\n\t\tmore stuff\n']);


process.exit(2);



const [root_node] = root.iter_nodes();
log.Debug(root_node.title);	// Root

for (const n2 of root_node.iter_nodes()) {	//This should just yield the same node again (no slicing)
	log.Debug(n2.owner.to_text());
}



/*console.log(root_node.title);

for (const n of root_node.iter_nodes()) {
	console.log(n.title);
}
*/
process.exit(4);
const children = [...root_node.body.iter_nodes()];



for (const node of children[1].body.iter_nodes()) {
	console.log(node.title, node.line_view);
}



if (children[0].title !== 'Child 1') {
	throw new Error('Validation failed')
}


if (children[1].title !== 'Child 2') {
	throw new Error('Validation failed')
}

if (children[0].body.iter_nodes().next().value.title !== 'Grand child 1') {
	throw new Error('Validation failed')
}

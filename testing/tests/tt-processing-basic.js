import * as tt_processing from '../../lib/text/tree-processing.js';


const root = tt_processing.Node.from_string(`

	Root
		Child 1
			Grand child 1
		Child 2

`)

const [root_node] = root.iter_nodes();

const children = [...root_node.body.iter_nodes()];

for (const node of children[1].body.iter_nodes()) {
	console.log(node.title, node.line_view);
}






process.exit(1);
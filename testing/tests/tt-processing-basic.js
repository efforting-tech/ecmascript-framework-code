import { assert_equality } from '../framework/utils.js';
import * as tt_processing from '../../lib/text/tree-processing.js';
import * as log from '../../lib/debug/console.js';


const doc = tt_processing.Node.from_string(
`	Root
			Stray 1
		Child 1
			Grand child 1
			Grand child 2
		Child 2

	other-root
		more stuff
`)



const [root, other_root] = doc;
root.parent = other_root.parent = doc;	// Super root must be set manually

const [stray, ...children] = root.body;
const [...grand_children] = children[0].body;

assert_equality(root.title, 						'Root');
assert_equality(other_root.title, 					'other-root');
assert_equality(stray.title, 						'Stray 1');
assert_equality(children[0].title, 					'Child 1');
assert_equality(children[1].title, 					'Child 2');
assert_equality(grand_children[0].title, 			'Grand child 1');
assert_equality(grand_children[1].title, 			'Grand child 2');

assert_equality(grand_children[0].parent.title, 	children[0].title);
assert_equality(grand_children[1].parent.title, 	children[0].title);

assert_equality(grand_children[0].root,				doc);

assert_equality(children[0].indent_offset,			0);
assert_equality(stray.indent_offset,				1);


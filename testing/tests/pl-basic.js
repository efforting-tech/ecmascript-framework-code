
import * as log from '../../lib/debug/console.js';

import * as PL_AST from '../../lib/parsing/ast.js';



import { Dotted_Tree_Directory } from '../../lib/data/object.js';


import { assign_property_stack } from '../../lib/data/stack.js';

import { Group, group_access_interface } from './support/pl-records.js';
import { pl_parser } from './support/pl-parser.js';
import { language_definition_1 } from './support/pl-examples.js';
import { CONTEXT_SYMBOL } from '../../lib/templates/context.js';

//BUG: REDUCTION_ORDER.nonexistent as argument to FPRS constructor does not cause an error (also, we must decide whether we should do early testing (constructor) or runtime testing (reduction). This should go into project wide design principles


//TODO - possibly utilize stack_channel (or something else?)
//	NOTE: We will probably migrate to Property_Stack
/*const root_group = new Group('root');
pl_parser[CONTEXT_SYMBOL] = {
	root: root_group,
	group_stack: [root_group],
}
*/



const group_directory = new Dotted_Tree_Directory();

pl_parser[CONTEXT_SYMBOL] = assign_property_stack({
	target: new PL_AST.Group(language_definition_1, group_directory),	//NOTE: We just use the string as source here for now
	group_directory,
	current_group: group_directory,
});


pl_parser.process_text(language_definition_1);

log.Debug(group_directory.get_dir('template.basic').value.members[1].rule_definitions[0].value);
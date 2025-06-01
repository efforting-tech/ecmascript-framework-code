
import * as log from '../../lib/debug/console.js';

import { Group, group_access_interface } from './support/pl-records.js';
import { pl_parser } from './support/pl-parser.js';
import { language_definition_1 } from './support/pl-examples.js';
import { CONTEXT_SYMBOL } from '../../lib/templates/context.js';

//BUG: REDUCTION_ORDER.nonexistent as argument to FPRS constructor does not cause an error (also, we must decide whether we should do early testing (constructor) or runtime testing (reduction). This should go into project wide design principles


//TODO - possibly utilize stack_channel (or something else?)
const root_group = new Group('root');
pl_parser[CONTEXT_SYMBOL] = {
	root: root_group,
	group_stack: [root_group],
}


pl_parser.process_text(language_definition_1);

log.Debug(root_group);
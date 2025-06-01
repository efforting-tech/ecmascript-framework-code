
import * as log from '../../lib/debug/console.js';

import { Group, group_access_interface } from './support/pl-records.js';
import { pl_parser } from './support/pl-parser.js';
import { language_definition_1 } from './support/pl-examples.js';


// Most of this is deprecated now and should be rewritten

/*

	There are many places where we copy a sequence in order to transform a fresh copy
	This may not be needed - this was mostly in order to fasciliate source tracking
	Once we decide how to do source tracking we can figure out if these copies are needed or not


*/

//BUG: REDUCTION_ORDER.nonexistent as argument to FPRS constructor does not cause an error (also, we must decide whether we should do early testing (constructor) or runtime testing (reduction). This should go into project wide design principles

/*function compute_span_relative_to(subject_span, relative_to) {
	const [ssl, ssr] = subject_span;
	const [rtl, rtr] = relative_to;
	return [rtl + ssl, rtl + ssr];
}
*/


import { Fixed_Point_Reduction_Scanner, REDUCTION_ORDER } from '../../lib/parsing/scanner.js';
import { FPR_Contract } from '../../lib/parsing/contracts.js';

import { sequence_in_place_replacement } from '../../lib/data/transform.js';

import * as O from '../../lib/data/operators.js';
import * as R from '../../lib/data/rules.js';
import * as C from '../../lib/data/conditions.js';
import * as SC from '../../lib/data/sequence-conditions.js';
import * as CA from '../../lib/data/captures.js';
import { create_block_rule, create_named_definition_rule } from '../../lib/templates/rule-factories.js';
import { REQUIREMENT_STATE } from '../../lib/data/management.js';

import { Context, CONTEXT_SYMBOL } from '../../lib/templates/context.js';

import { Basic_Dotted_Name_Tree_Interface } from '../../lib/data/object.js';

import * as PL_AST from '../../lib/parsing/ast.js';
import * as PL_TOKEN from '../../lib/parsing/tokens.js';

import { Parser }  from '../../lib/parsing/generic-parser.js';
import { Advanced_Regex_Tokenizer }  from '../../lib/parsing/regexp-tokenizer.js';

import { inspect } from 'util';


//TODO - possibly utilize stack_channel (or something else?)
const root_group = new Group('root');
pl_parser[CONTEXT_SYMBOL] = {
	root: root_group,
	group_stack: [root_group],
}


pl_parser.process_text(language_definition_1);

log.Debug(root_group);
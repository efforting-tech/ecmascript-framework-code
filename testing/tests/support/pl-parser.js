import * as O from '../../../lib/data/operators.js';
import * as R from '../../../lib/data/rules.js';
import * as C from '../../../lib/data/conditions.js';
import * as PL_AST from '../../../lib/parsing/ast.js';

import { rule_fprs } from './pl-fprs.js';

import { Rule_Parser } from './pl-rule-parser.js';
import { create_block_rule, create_named_definition_rule } from '../../../lib/templates/rule-factories.js';
import { REQUIREMENT_STATE } from '../../../lib/data/management.js';
import { CONTEXT_SYMBOL } from '../../../lib/templates/context.js';
import { group_access_interface } from './pl-records.js';

import { Rule_Tokenizer } from './pl-tokenizers.js';

import * as log from '../../../lib/debug/console.js';

// no prefix capture, no name, no settings
const concrete_statement_settings = [REQUIREMENT_STATE.NOT_ALLOWED, REQUIREMENT_STATE.NOT_ALLOWED, REQUIREMENT_STATE.NOT_ALLOWED];
// no prefix capture, required name, no settings, case insensitive, dotted names
const dotted_name_statement_settings = [REQUIREMENT_STATE.NOT_ALLOWED, REQUIREMENT_STATE.REQUIRED, REQUIREMENT_STATE.NOT_ALLOWED, true, /[\w\.]+/];

// no prefix capture, required name (not used as a name though), no settings, case insensitive, capture anything as name
const capture_anything = [REQUIREMENT_STATE.NOT_ALLOWED, REQUIREMENT_STATE.REQUIRED, REQUIREMENT_STATE.NOT_ALLOWED, true, /.+/];



export const pl_parser = new O.Tree_Processor('Parsing_Language_Parser', [

	new R.Resolution_Rule(new C.Title_Condition(new C.Regex_Condition( /^\s*$/ )),
		(resolver, item, match) => {
			//console.log("EMPTY");
		}
	),


	create_block_rule('tokens', (resolver, item, match, group_args) => {
		const ctx = resolver[CONTEXT_SYMBOL];
		ctx.target.members.push(new PL_AST.Token_Table(item, token_definition_parser.process_tree(item.body)));
	}, ...concrete_statement_settings),

	create_block_rule('group', (resolver, item, match, group_args) => {
		const ctx = resolver[CONTEXT_SYMBOL];
		const pending_group_dir = ctx.current_group.mkdir(group_args.name.value);
		const pending_group = new PL_AST.Group(item, pending_group_dir);
		pending_group_dir.value = pending_group;
		ctx.stack.push({current_group: pending_group_dir, target: pending_group});
		resolver.process_tree(item.body);
		ctx.stack.pop();


	}, ...dotted_name_statement_settings),


	create_block_rule('tokenizer', (resolver, item, match, group_args) => {
		const ctx = resolver[CONTEXT_SYMBOL];

		const new_tokenizer = new PL_AST.Tokenizer(item, group_args.name.value);
		ctx.target.members.push(new_tokenizer);

		//const name_span = group_args.name.span_relative_to(item.lines[0].title_span);

		//console.log(item.body.span);
		const [body_start, body_end] = item.body.span;
		const rule_definition_tokens = (new Rule_Parser(item.source.slice(0, body_end), Rule_Tokenizer, body_start)).parse();	//item.body is wrong here, we need a rule_parser that doesn't mind operating on a text span rather than a string primitive

		//log.Debug(rule_definition_tokens);

		//console.log(item.title);
		//console.log();
		new_tokenizer.rule_definitions.push(...rule_fprs.transform(rule_definition_tokens));
		//console.log();

	}, ...dotted_name_statement_settings),


]);


const token_definition_parser = new O.Tree_Processor('Token_Definition_Parser', [
	create_block_rule('default token', (resolver, item, match, group_args) => {
		return new PL_AST.Default_Token(item, group_args.name.value);
	}, ...capture_anything),

	create_named_definition_rule((resolver, item, match, group_args) => {
		return new PL_AST.Regexp_Token(item, group_args.key.value, group_args.value.value);
	}),

]);


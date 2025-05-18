import * as O from '../../../lib/data/operators.js';
import * as R from '../../../lib/data/rules.js';
import * as C from '../../../lib/data/conditions.js';
import * as PL_AST from '../../../lib/parsing/ast.js';
import * as PL_TOKEN from '../../../lib/parsing/tokens.js';
import { create_block_rule, create_named_definition_rule } from '../../../lib/templates/rule-factories.js';
import { REQUIREMENT_STATE } from '../../../lib/data/management.js';
import { Context, CONTEXT_SYMBOL } from '../../../lib/templates/context.js';
import { group_access_interface } from './pl-records.js';


import * as log from '../../../lib/debug/console.js';
import { TP } from './pl-debug-output.js';


// no prefix capture, no name, no settings
const concrete_statement_settings = [REQUIREMENT_STATE.NOT_ALLOWED, REQUIREMENT_STATE.NOT_ALLOWED, REQUIREMENT_STATE.NOT_ALLOWED];
// no prefix capture, required name, no settings, case insensitive, dotted names
const dotted_name_statement_settings = [REQUIREMENT_STATE.NOT_ALLOWED, REQUIREMENT_STATE.REQUIRED, REQUIREMENT_STATE.NOT_ALLOWED, true, /[\w\.]+/];

// no prefix capture, required name (not used as a name though), no settings, case insensitive, capture anything as name
const capture_anything = [REQUIREMENT_STATE.NOT_ALLOWED, REQUIREMENT_STATE.REQUIRED, REQUIREMENT_STATE.NOT_ALLOWED, true, /.+/];


/*
const LINE_INDEX = Symbol('LINE_INDEX');
const COLUMN_INDEX = Symbol('COLUMN_INDEX');

*/


export const pl_parser = new O.Tree_Processor('Parsing_Language_Parser', [

	new R.Resolution_Rule(new C.Title_Condition(new C.Regex_Condition( /^\s*$/ )),
		(resolver, item, match) => {
			console.log("EMPTY");
		}
	),


	create_block_rule('tokens', (resolver, item, match, group_args) => {
		const ctx = resolver[CONTEXT_SYMBOL];
		const group = ctx.group_stack.at(-1);
		group.token_table = new PL_AST.Token_Table(token_definition_parser.process_tree(item.body));
	}, ...concrete_statement_settings),

	create_block_rule('group', (resolver, item, match, group_args) => {
		const ctx = resolver[CONTEXT_SYMBOL];
		const new_group = group_access_interface.write(ctx.group_stack.at(-1), group_args.name.value);
		ctx.group_stack.push(new_group);
		resolver.process_tree(item.body);	//TODO - figure out why we need to do it like this, if we do item.body we will only process the last entry which is a bit weird
		ctx.group_stack.pop();
	}, ...dotted_name_statement_settings),


	create_block_rule('tokenizer', (resolver, item, match, group_args) => {
		console.log("Found tokenizer:", group_args);
		const ctx = resolver[CONTEXT_SYMBOL];
		const new_tokenizer = group_access_interface.write(ctx.group_stack.at(-1), group_args.name.value, 'TOKENIZER' );	//TODO - actually create


		//TODO - we should use a range based view here!

		//NOTE this is just an experiment in slicing for now where we will want a partical body

		const name_span = group_args.name.span_relative_to(item.lines[0].title_span);

		log.Debug(item.lines[0].full_line); // '\t\ttokenizer: embedding\n'
		log.Debug(name_span);	// [ 99, 108 ]
		log.Debug(item.owner.source.slice(...name_span)); // 'embedding'

		log.Debug(item.owner.source.slice(name_span[1], item.body.lines.at(-1).tail_span[1])); // "\n\t\t\tstatement: '§' optional_space, anything as value ;\n\n"


		const column_index = name_span[0] - item.lines[0].full_span[0];
		console.log(group_args.name.span, item.lines[0].title_span, item.lines[0].full_span, column_index);
		console.log(name_span[0] - item.lines[0].full_span[0] );
		log.Debug(item.owner.source.slice());

/*		log.Debug(item.lines[0].copy_trimmed_title(column_index).full_line);	//	'\t\ttokenizer: embedding\n'
		log.Debug(item.lines[0].copy_trimmed_title(column_index).title);		//	'embedding'
		log.Debug(item.lines[0].copy_trimmed_title(column_index).column_index);	//	13
*/
		log.Debug(item.lines[0].copy_trimmed(column_index).full_line);	//	'\t\ttokenizer: embedding\n'
		log.Debug(item.lines[0].copy_trimmed(column_index).title);		//	'embedding'
		log.Debug(item.lines[0].copy_trimmed(column_index).column_index);	//	13


		//TODO - perhaps make a single copy_trimmed(head=0, title=0, tail=0)

		console.log('===');

		const args_to_test = [
			[0, 0],
			[1, 0],
			[0, 1],
			[1, 1],

			[0, 0],
			[3, 0],
			[0, 3],
			[3, 3],


		];

		const result_table = [['Arguments', 'Column Index', 'Full Line', 'Head', 'Title', 'Tail']];


		for (const args of args_to_test) {
			const result = item.lines[0].copy_trimmed(...args);

			result_table.push([
				`${args}`,
				`${JSON.stringify(result.column_index)}`,
				`${JSON.stringify(result.full_line)}`,
				`${JSON.stringify(result.head)}`,
				`${JSON.stringify(result.title)}`,
				`${JSON.stringify(result.tail)}`,
			]);

		}


		TP.print(result_table);


/*		log.Debug(item.lines[0].copy_trimmed(0, 0, 0, 0).full_line);
		log.Debug(item.lines[0].copy_trimmed(1, 0, 0, 0).full_line);
		console.log('---');

		log.Debug(item.lines[0].copy_trimmed(5, 0, 0, 0).full_line);
		log.Debug(item.lines[0].copy_trimmed(0, 5, 0, 0).full_line);
		log.Debug(item.lines[0].copy_trimmed(0, 0, 5, 0).full_line);
		log.Debug(item.lines[0].copy_trimmed(0, 0, 0, 5).full_line);

*/




/*
		const ts = compute_span_relative_to(match.value.value.indices[1], item.lines[0].title_span);
		log.Debug(match.value.condition.pattern);
		log.Debug(match.value.value);
		log.Debug(match.value.value.indices[1]);
		log.Debug(ts);
		log.Debug(item.owner.source.slice(...ts));
		log.Debug(item.owner.source.slice(...item.lines[0].title_span));

*/
		process.exit(1);



		//const definition = item.body.to_string();		//NOTE - we should not do it like this because now we recreate the text from the node - we should have our trees operate on text spans all the way up!
		log.Debug('span', item.body.source.slice(...item.body.span));	//This shows that we can get the span of the body properly

		const rule_definition_tokens = (new Rule_Parser(item.body, tokenizer_rule_parser)).parse();	//item.body is wrong here, we need a rule_parser that doesn't mind operating on a text span rather than a string primitive
		rule_fprs.transform(rule_definition_tokens);

		console.log('TOKENS!', inspect(rule_definition_tokens, { colors: true, depth: null }));

		//TODO - check what happens if we try to create a tokenizer where there is a group


	}, ...dotted_name_statement_settings),


]);


const token_definition_parser = new O.Tree_Processor('Token_Definition_Parser', [
	create_block_rule('default token', (resolver, item, match, group_args) => {
		return new PL_AST.Default_Token(group_args.name.value);
	}, ...capture_anything),

	create_named_definition_rule((resolver, item, match, group_args) => {
		return new PL_AST.Regexp_Token(group_args.key.value, group_args.value.value);
	}),

]);


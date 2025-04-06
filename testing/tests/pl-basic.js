
import * as O from '../../lib/data/operators.js';
import { create_block_rule, create_named_definition_rule } from '../../lib/templates/rule-factories.js';
import { REQUIREMENT_STATE } from '../../lib/data/management.js';

import { Context, CONTEXT_SYMBOL } from '../../lib/templates/context.js';

import { Basic_Dotted_Name_Tree_Interface } from '../../lib/data/object.js';

import * as PL_AST from '../../lib/parsing/ast.js';


import { inspect } from 'util';

// no prefix capture, no name, no settings
const concrete_statement_settings = [REQUIREMENT_STATE.NOT_ALLOWED, REQUIREMENT_STATE.NOT_ALLOWED, REQUIREMENT_STATE.NOT_ALLOWED];
// no prefix capture, required name, no settings, case insensitive, dotted names
const dotted_name_statement_settings = [REQUIREMENT_STATE.NOT_ALLOWED, REQUIREMENT_STATE.REQUIRED, REQUIREMENT_STATE.NOT_ALLOWED, true, /[\w\.]+/];

// no prefix capture, required name (not used as a name though), no settings, case insensitive, capture anything as name
const capture_anything = [REQUIREMENT_STATE.NOT_ALLOWED, REQUIREMENT_STATE.REQUIRED, REQUIREMENT_STATE.NOT_ALLOWED, true, /.+/];



class Group {
	constructor(name, parent=null, children={}) {
		Object.assign(this, { name, parent, children });
	}
}



class Group_Access_Interface extends Basic_Dotted_Name_Tree_Interface {
	static name = 'group';

	create_child(name, parent=undefined) {
		return new Group(name, parent);
	}
}


const group_access_interface = new Group_Access_Interface();


const token_definition_parser = new O.Tree_Processor('Token_Definition_Parser', [
	create_block_rule('default token', (resolver, item, match, group_args) => {
		return new PL_AST.Default_Token(group_args.name);
	}, ...capture_anything),

	create_named_definition_rule((resolver, item, match, group_args) => {
		return new PL_AST.Regexp_Token(group_args.key, group_args.value);
	}),

]);



const pl_parser = new O.Tree_Processor('Parsing_Language_Parser', [

	create_block_rule('tokens', (resolver, item, match, group_args) => {
		const ctx = resolver[CONTEXT_SYMBOL];
		const group = ctx.group_stack.at(-1);
		group.token_table = new PL_AST.Token_Table(token_definition_parser.process_tree(item.body));
	}, ...concrete_statement_settings),

	create_block_rule('group', (resolver, item, match, group_args) => {
		const ctx = resolver[CONTEXT_SYMBOL];
		const new_group = group_access_interface.write(ctx.group_stack.at(-1), group_args.name);
		ctx.group_stack.push(new_group);
		resolver.process_tree(item.body.body);	//TODO - figure out why we need to do it like this, if we do item.body we will only process the last entry which is a bit weird
		ctx.group_stack.pop();
	}, ...dotted_name_statement_settings),


	create_block_rule('tokenizer', (resolver, item, match, group_args) => {
		console.log("Found tokenizer:", group_args);
		const ctx = resolver[CONTEXT_SYMBOL];
		const new_tokenizer = group_access_interface.write(ctx.group_stack.at(-1), group_args.name, 'TOKENIZER' );	//TODO - actually create
		//TODO - check what happens if we try to create a tokenizer where there is a group


	}, ...dotted_name_statement_settings),


]);


//TODO - possibly utilize stack_channel (or something else?)

const root_group = new Group('root');
pl_parser[CONTEXT_SYMBOL] = {
	root: root_group,
	group_stack: [root_group],
}


const language_definition = `
	tokens:
		optional_space: /(\s*)/
		default token: anything

	group: template.basic

		tokenizer: embedding
			statement: '§' optional_space, anything as value ;

		tokenizer: body
			expression: '«' anything as value '»' ;

`

const token_definition = `
	optional_space: /(\s*)/
	default token: anything
`;


pl_parser.process_text(language_definition);

//const tokens = token_definition_parser.process_text(token_definition);

//console.log(inspect(tokens, {colors: true, depth: null}));
console.log(inspect(root_group, {colors: true, depth: null}));

//TODO next: Implement token definition tables and tokenizers
//			create a usable tokenizer based on this

//	Look into template-title.js for what is next after that



process.exit(1);
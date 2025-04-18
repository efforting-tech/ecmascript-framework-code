// Most of this is deprecated now and should be rewritten

// NEXT STEP - the parser thing

import * as O from '../../lib/data/operators.js';
import * as R from '../../lib/data/rules.js';
import * as C from '../../lib/data/conditions.js';
import { create_block_rule, create_named_definition_rule } from '../../lib/templates/rule-factories.js';
import { REQUIREMENT_STATE } from '../../lib/data/management.js';

import { Context, CONTEXT_SYMBOL } from '../../lib/templates/context.js';

import { Basic_Dotted_Name_Tree_Interface } from '../../lib/data/object.js';

import * as PL_AST from '../../lib/parsing/ast.js';
import * as PL_TOKEN from '../../lib/parsing/tokens.js';


import { Parser }  from '../../lib/parsing/generic-parser.js';
import { Advanced_Regex_Tokenizer }  from '../../lib/parsing/regexp-tokenizer.js';


import { inspect } from 'util';

// no prefix capture, no name, no settings
const concrete_statement_settings = [REQUIREMENT_STATE.NOT_ALLOWED, REQUIREMENT_STATE.NOT_ALLOWED, REQUIREMENT_STATE.NOT_ALLOWED];
// no prefix capture, required name, no settings, case insensitive, dotted names
const dotted_name_statement_settings = [REQUIREMENT_STATE.NOT_ALLOWED, REQUIREMENT_STATE.REQUIRED, REQUIREMENT_STATE.NOT_ALLOWED, true, /[\w\.]+/];

// no prefix capture, required name (not used as a name though), no settings, case insensitive, capture anything as name
const capture_anything = [REQUIREMENT_STATE.NOT_ALLOWED, REQUIREMENT_STATE.REQUIRED, REQUIREMENT_STATE.NOT_ALLOWED, true, /.+/];


const LINE_INDEX = Symbol('LINE_INDEX');
const COLUMN_INDEX = Symbol('COLUMN_INDEX');


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

const tokenizer_rules = `

	statement: '§' optional_space, 	#This is the start of the thing
		anything as value ;	#Here is more stuff

	expression: '«' anything as value '»' ;

`;

const common_rules = [

	new R.Resolution_Rule(new C.Regex_Condition( /(\n+)/ ),
		(resolver, newlines) => {
			resolver[LINE_INDEX] += newlines.length;
			resolver[COLUMN_INDEX] = 0;
		}
	),

	new R.Resolution_Rule(new C.Regex_Condition( /([\t ])+/ ),
		(resolver, spaces) => {
			resolver[COLUMN_INDEX] += spaces.length;
		}
	),

	new R.Resolution_Rule(new C.Regex_Condition( /\#(.*)$/m ),
		(resolver, comment) => {
			resolver.push_token(new PL_TOKEN.Comment(resolver[LINE_INDEX], resolver[COLUMN_INDEX], comment));
			resolver[COLUMN_INDEX] += 1 + comment.length;
		}
	),

];


const tokenizer_string_parser = new Advanced_Regex_Tokenizer('Tokenizer_String_Parser', [

	new R.Resolution_Rule(new C.Regex_Condition( /'/ ),
		(resolver) => {
			resolver.push_token(new PL_TOKEN.Quote(resolver[LINE_INDEX], resolver[COLUMN_INDEX], '\''));
			resolver.leave_sub_tokenizer();
			resolver[COLUMN_INDEX] += 1;
		}
	),

	new R.Default_Rule(
		(resolver, text) => {
			resolver.push_token(new PL_TOKEN.Literal(resolver[LINE_INDEX], resolver[COLUMN_INDEX], text));
			resolver[COLUMN_INDEX] += text.length;
		}
	),


]);


const tokenizer_rule_definition_parser = new Advanced_Regex_Tokenizer('Tokenizer_Rule_Parser', [


	new R.Resolution_Rule(new C.Regex_Condition( /(\w+)/ ),
		(resolver, name) => {
			resolver.push_token(new PL_TOKEN.Identifier(resolver[LINE_INDEX], resolver[COLUMN_INDEX], name));
			resolver[COLUMN_INDEX] += name.length;
		}
	),

	new R.Resolution_Rule(new C.Regex_Condition( /[,]/ ),
		(resolver) => {
			resolver.push_token(new PL_TOKEN.Punctuation(resolver[LINE_INDEX], resolver[COLUMN_INDEX], ','));
			resolver[COLUMN_INDEX] += 1;
		}
	),

	new R.Resolution_Rule(new C.Regex_Condition( /[;]/ ),
		(resolver) => {
			resolver.push_token(new PL_TOKEN.Punctuation(resolver[LINE_INDEX], resolver[COLUMN_INDEX], ';'));
			resolver.leave_sub_tokenizer();
			resolver[COLUMN_INDEX] += 1;
		}
	),

	new R.Resolution_Rule(new C.Regex_Condition( /'/ ),
		(resolver) => {
			resolver.enter_sub_tokenizer(tokenizer_string_parser, (sub_resolver, sub_result) => {
				resolver.push_token(new PL_TOKEN.String(resolver[LINE_INDEX], resolver[COLUMN_INDEX], sub_result));
			});	//We should add a function to handle the result
			resolver.push_token(new PL_TOKEN.Quote(resolver[LINE_INDEX], resolver[COLUMN_INDEX], '\''));
			resolver[COLUMN_INDEX] += 1;
		}
	),

	...common_rules,

]);


const tokenizer_pending_colon_for_rule = new Advanced_Regex_Tokenizer('Tokenizer_Pending_Colon_For_Rule', [
	new R.Resolution_Rule(new C.Regex_Condition( /[:]/ ),
		(resolver) => {
			resolver.switch_to(tokenizer_rule_definition_parser);
			resolver[COLUMN_INDEX] += 1;
		}
	),

	...common_rules,
]);

const tokenizer_rule_parser = new Advanced_Regex_Tokenizer('Tokenizer_Rule_Parser', [

	new R.Resolution_Rule(new C.Regex_Condition( /(\w+)/ ),
		(resolver, name) => {
			resolver.enter_sub_tokenizer(tokenizer_pending_colon_for_rule, (sub_resolver, sub_result) => {
				resolver.push_token(new PL_TOKEN.Rule_Definition(resolver[LINE_INDEX], resolver[COLUMN_INDEX], name, sub_result));
			});

			resolver[COLUMN_INDEX] += name.length;
		}
	),

	...common_rules,



]);





const rule_parser = new Parser(tokenizer_rules, tokenizer_rule_parser);
rule_parser[LINE_INDEX] = 0;
rule_parser[COLUMN_INDEX] = 0;
console.log(inspect(rule_parser.parse(), {colors: true, depth: null}));

/*for (const token of tokenizer_rule_parser.feed(tokenizer_rules)) {
	console.log('TOKEN', token);
}
*/


//pl_parser.process_text(language_definition);
//const tokens = token_definition_parser.process_text(token_definition);

//console.log(inspect(tokens, {colors: true, depth: null}));
//console.log(inspect(root_group, {colors: true, depth: null}));

//TODO next: Implement token definition tables and tokenizers
//			create a usable tokenizer based on this

//	Look into template-title.js for what is next after that

class State_Serializer {

	constructor(symbols=new Map()) {
		Object.assign(this, { symbols });
	}

	serialize_symbols(...symbols) {
		const result = [];
		for (const symbol of symbols) {
			const existing = this.symbols.get(symbol);
			if (existing !== undefined) {
				result.push(existing);
			} else {
				const new_symbol_index = this.symbols.size;
				this.symbols.set(symbol, new_symbol_index);
				result.push(new_symbol_index);
			}
		}
		return result;
	}


	serialize_object(object) {

		switch (typeof(object)) {
			case 'object':

				const existing_instance = this.symbols.get(object);
				if (existing_instance !== undefined) {
					return existing_instance;
				}

				const [type, instance] = this.serialize_symbols(object.constructor, object);
				const symbols = this.serialize_symbols(...Object.getOwnPropertySymbols(object));
				const keys = Object.keys(object).map(item => this.serialize_object(item));
				const values = Object.values(object).map(item => this.serialize_object(item));

				return [instance, type, symbols, keys, values];

			case 'string':
			case 'number':
				const [value_type] = this.serialize_symbols(typeof(object));
				return [value_type, object];


			case 'function':
				const [reference_type, reference_id] = this.serialize_symbols(typeof(object), object);
				return [reference_type, reference_id];

			case 'undefined':
				const [singleton_type] = this.serialize_symbols(typeof(object));
				return singleton_type;


			default:
				throw new Error(typeof(object));
		}



	}


};


function serialize_state(object, serializer = new State_Serializer()) {
	return JSON.stringify(serializer.serialize_object(object));
}

//NOTE - the serializer should be kept by the scanning transformer so that it can keep the symbol map


console.log(serialize_state(rule_parser));

process.exit(1);
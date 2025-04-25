// Most of this is deprecated now and should be rewritten

// NEXT STEP - Line 320

import { Fixed_Point_Reduction_Scanner, REDUCTION_ORDER } from '../../lib/parsing/scanner.js';
import { FPR_Contract } from '../../lib/parsing/contracts.js';


import * as O from '../../lib/data/operators.js';
import * as R from '../../lib/data/rules.js';
import * as C from '../../lib/data/conditions.js';
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
			const [start_line, start_col] = [resolver[LINE_INDEX], resolver[COLUMN_INDEX]];
			resolver.enter_sub_tokenizer(tokenizer_string_parser, (sub_resolver, sub_result) => {
				resolver.push_token(new PL_TOKEN.String(start_line, start_col, sub_result));
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
			const [start_line, start_col] = [resolver[LINE_INDEX], resolver[COLUMN_INDEX]];
			resolver.enter_sub_tokenizer(tokenizer_pending_colon_for_rule, (sub_resolver, sub_result) => {
				resolver.push_token(new PL_TOKEN.Rule_Definition(start_line, start_col, name, sub_result));
			});

			resolver[COLUMN_INDEX] += name.length;
		}
	),

	...common_rules,



]);







class Logging_FPR_Contract extends FPR_Contract {

	constructor(name) {
		super();
		Object.assign(this, { name });
	}

	on_start_transform(scanner, sequence) {
		console.log("START TRANSFORM", this.name, inspect(sequence, {colors: true, depth: null}));
		super.on_start_transform(scanner, sequence);
	}

	on_reduction_made(scanner, sequence) {
		console.log("REDUCTION MADE", this.name, inspect(sequence, {colors: true, depth: null}));
		super.on_reduction_made(scanner, sequence);
	}

}

const token_fprs = new Fixed_Point_Reduction_Scanner([
	new R.Transform_Rule(
		new C.Partial_Sequence([
			new C.Constructor_is(PL_TOKEN.String),
		]), ((scanner, sequence, match) => {
			console.log("FOUND STRING", match);
			match.transform_replace(new PL_AST.String(match.value));
		}),
	),

], REDUCTION_ORDER.RULE_MAJOR, new Logging_FPR_Contract('token'));



const string_contents_fprs = new Fixed_Point_Reduction_Scanner([

	new R.Transform_Rule(
		new C.Partial_Sequence([
			new C.Constructor_is(PL_TOKEN.Literal),
		]), ((scanner, sequence, match) => {
			match.transform_replace(match.value);
		}),
	),

], REDUCTION_ORDER.RULE_MAJOR, new Logging_FPR_Contract('string_contents_fprs'));

const STRING_CONTENTS = Symbol('STRING_CONTENTS');

const string_fprs = new Fixed_Point_Reduction_Scanner([

	new R.Transform_Rule(
		new C.Partial_Sequence([
			new C.Constructor_is(PL_TOKEN.Quote),
			new CA.Capture_Sub_Sequence(STRING_CONTENTS),
			new C.Constructor_is(PL_TOKEN.Quote),
		]), ((scanner, sequence, match) => {
			//console.log("FOUND", match);
			const contents = [...match.require_capture(STRING_CONTENTS).value];

			string_contents_fprs.transform(contents);	//THe current problem here is that Exact_Match lacks proper tracking for transform to work
			console.log('AFTER TRANSFORM', contents);

			match.transform_replace(new PL_AST.String('TBD'));	//TODO track source of this AST node

			//contents.transform_replace('HELLO');		//This is just an example which is not possible right now due to limitations of matches.js


		}),
	),

], REDUCTION_ORDER.RULE_MAJOR, new Logging_FPR_Contract('string'));



const rule_parser = new Parser(tokenizer_rules, tokenizer_rule_parser);
rule_parser[LINE_INDEX] = 0;
rule_parser[COLUMN_INDEX] = 0;

const rule_tokens = rule_parser.parse();

//console.log(inspect(rule_tokens, {colors: true, depth: null}));
//console.log(inspect(rule_tokens[0].value, {colors: true, depth: null}));


string_fprs.transform(rule_tokens[0].value[0].value);



//pl_parser.process_text(language_definition);
//const tokens = token_definition_parser.process_text(token_definition);

//console.log(inspect(tokens, {colors: true, depth: null}));
//console.log(inspect(root_group, {colors: true, depth: null}));

//TODO next: Implement token definition tables and tokenizers
//			create a usable tokenizer based on this

//	Look into template-title.js for what is next after that


process.exit(1);
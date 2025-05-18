import * as log from '../../lib/debug/console.js';
import { Table_Printer } from '../../lib/table/printer.js';

// Most of this is deprecated now and should be rewritten

const TP = new Table_Printer(
	null,
	['┃ ', ' ', ' ┃ ', ' ┃'],
	['┣━', '━', '━╋━', '━┫'],
	['┃ ', ' ', ' ┃ ', ' ┃'],
	null,
);

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
		return new PL_AST.Default_Token(group_args.name.value);
	}, ...capture_anything),

	create_named_definition_rule((resolver, item, match, group_args) => {
		return new PL_AST.Regexp_Token(group_args.key.value, group_args.value.value);
	}),

]);



const pl_parser = new O.Tree_Processor('Parsing_Language_Parser', [

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
/*
//Just for testing rule tokenizer
const tokenizer_rules = `

	statement: '§' optional_space, 	#This is the start of the thing
		anything as value ;	#Here is more stuff

	expression: '«' anything as value '»' ;

`;
*/
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



//Defining these tables are done in a bit contrived way for now - we should use a multi key table instead
const ESCAPE_LUT = {
	'0': Symbol('NULL'),
	'n': Symbol('NEWLINE'),
	'r': Symbol('CARRIAGE_RETURN'),
	'\'': Symbol('SINGLE_QUOTE'),
	'"': Symbol('DOUBLE_QUOTE'),
}

const ESCAPE_REVERSE_LUT = {
	[ESCAPE_LUT['0']]: '\0',
	[ESCAPE_LUT['n']]: '\n',
	[ESCAPE_LUT['r']]: '\r',
	[ESCAPE_LUT['\"']]: '\"',
	[ESCAPE_LUT['"']]: '"',
};


const tokenizer_string_parser = new Advanced_Regex_Tokenizer('Tokenizer_String_Parser', [

	new R.Resolution_Rule(new C.Regex_Condition( /'/ ),
		(resolver) => {
			resolver.push_token(new PL_TOKEN.Quote(resolver[LINE_INDEX], resolver[COLUMN_INDEX], '\''));
			resolver.leave_sub_tokenizer();
			resolver[COLUMN_INDEX] += 1;
		}
	),

	new R.Resolution_Rule(new C.Regex_Condition( /\\(0|n|r)/ ),	//TODO - SSoT
		(resolver, escape_sequence) => {
			const value = ESCAPE_LUT[escape_sequence];
			if (value === undefined) {
				throw new Error('Unknown escape')
			}
			resolver.push_token(new PL_TOKEN.Escape(resolver[LINE_INDEX], resolver[COLUMN_INDEX], value));
			resolver[COLUMN_INDEX] += 2;
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
			//NOTE: Let's not push the sentinel token - how we deal with all this depends a bit on how we decide to implement source tracking later on
			//resolver.push_token(new PL_TOKEN.Punctuation(resolver[LINE_INDEX], resolver[COLUMN_INDEX], ';'));
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
			log.Debug('name', name);
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


//First pass will remove comments, transform strings and identifiers
//TODO - source mapping
const rule_value_1_fprs = new Fixed_Point_Reduction_Scanner([

	new R.Transform_Rule(
		new SC.Partial_Sequence([
			new C.Constructor_is(PL_TOKEN.Comment),
		]), ((scanner, sequence, match) => {
			sequence_in_place_replacement(match);	//Remove
		}),
	),


	new R.Transform_Rule(
		new SC.Partial_Sequence([
			new C.Constructor_is(PL_TOKEN.String),
		]), ((scanner, sequence, match) => {

			const [string] = match.matched_sequence;
			const string_contents = [...string.value];	//Copy before sub transform
			string_fprs.transform(string_contents);
			sequence_in_place_replacement(match, ...string_contents);

		}),
	),

	new R.Transform_Rule(
		new SC.Partial_Sequence([
			new C.Constructor_is(PL_TOKEN.Identifier),
		]), ((scanner, sequence, match) => {

			const [identifier] = match.matched_sequence;
			sequence_in_place_replacement(match, new PL_AST.Identifier(identifier.value));

		}),
	),

], REDUCTION_ORDER.POSITION_MAJOR); //new Logging_FPR_Contract('rule_value_1')



//Second pass will turn stuff like "stuff as thing" into the proper alias node
//This must be RULE_MAJOR because once all rules are performed we will get rid of punctuaction commas (they are only for disambiguition which should be reflected in the design for the language)
//TODO - source mapping
const rule_value_2_fprs = new Fixed_Point_Reduction_Scanner([

	new R.Transform_Rule(
		new SC.Partial_Sequence([
			new C.Constructor_is(PL_AST.Identifier),
			new C.Conjunction(new C.Constructor_is(PL_AST.Identifier), new C.Property('value', 'as')),
			new C.Constructor_is(PL_AST.Identifier),
		]), ((scanner, sequence, match) => {
			const [identifier, _as_, alias] = match.matched_sequence;
			sequence_in_place_replacement(match, new PL_AST.Capture(identifier, alias.value));

		}),
	),

	new R.Transform_Rule(
		new SC.Partial_Sequence([
			new C.Conjunction(new C.Constructor_is(PL_TOKEN.Punctuation), new C.Property('value', ',')),
		]), ((scanner, sequence, match) => {
			sequence_in_place_replacement(match);
		}),
	),

], REDUCTION_ORDER.RULE_MAJOR); // new Logging_FPR_Contract('rule_value_2')


// NOTE - in this demo we boil it down to the value but we are not tracking source - something we should of course do in a proper implementation
const string_contents_fprs = new Fixed_Point_Reduction_Scanner([

	// PL_TOKEN.Literal → primitive string
	new R.Transform_Rule(
		new SC.Partial_Sequence([
			new C.Constructor_is(PL_TOKEN.Literal),
		]), ((scanner, sequence, match) => {
			const [literal] = match.matched_sequence;
			sequence_in_place_replacement(match, literal.value);
		}),
	),

	// PL_TOKEN.Escape → primitive string
	new R.Transform_Rule(
		new SC.Partial_Sequence([
			new C.Constructor_is(PL_TOKEN.Escape),
		]), ((scanner, sequence, match) => {
			const [escape_sequence] = match.matched_sequence;

			const escape_value = ESCAPE_REVERSE_LUT[escape_sequence.value];
			if (escape_value === undefined) {
				throw new Error('Unknown escape')
			}

			sequence_in_place_replacement(match, escape_value);
		}),
	),

	// string, string → merged string
	new R.Transform_Rule(
		new SC.Partial_Sequence([
			new C.Type_is('string'),
			new C.Type_is('string'),
		]), ((scanner, sequence, match) => {
			const [left, right] = match.matched_sequence;
			sequence_in_place_replacement(match, left + right);
		}),
	),

], REDUCTION_ORDER.RULE_MAJOR); //new Logging_FPR_Contract('string_contents_fprs')

const STRING_CONTENTS = Symbol('STRING_CONTENTS');

const string_fprs = new Fixed_Point_Reduction_Scanner([

	new R.Transform_Rule(
		//NOTE - this could in theory be Exact_Sequence since we are matching the entire thing, the problem is Exact_Sequence currently does not support dynamic length captures
		new SC.Partial_Sequence([
			new C.Constructor_is(PL_TOKEN.Quote),
			new CA.Dynamic_Length_Sub_Sequence(STRING_CONTENTS),
			new C.Constructor_is(PL_TOKEN.Quote),
		]), ((scanner, sequence, match) => {

			const contents = [...match.require_capture(STRING_CONTENTS).matched_sequence];	//Copy before change
			string_contents_fprs.transform(contents);

			const [primitive_string] = contents;


			sequence_in_place_replacement(match, new PL_AST.String(primitive_string)); //TODO track source of this AST node (source mapping)

		}),
	),

], REDUCTION_ORDER.RULE_MAJOR); // new Logging_FPR_Contract('string')



const rule_fprs = new Fixed_Point_Reduction_Scanner([

	new R.Transform_Rule(
		new SC.Partial_Sequence([
			new C.Constructor_is(PL_TOKEN.Comment),
		]), ((scanner, sequence, match) => {
			sequence_in_place_replacement(match);	//Remove
		}),
	),

	new R.Transform_Rule(
		new SC.Partial_Sequence([
			new C.Constructor_is(PL_TOKEN.Rule_Definition),
		]), ((scanner, sequence, match) => {
			const [rule_def] = match.matched_sequence;
			const rule_value = [...rule_def.value];	//Copy rule value before transform
			rule_value_1_fprs.transform(rule_value);
			rule_value_2_fprs.transform(rule_value);
			sequence_in_place_replacement(match, new PL_AST.Rule_Definition(rule_def.name, rule_value));

		}),
	),

], REDUCTION_ORDER.RULE_MAJOR); // new Logging_FPR_Contract('rule')


class Rule_Parser extends Parser {
	constructor(source, rules) {
		super(source, rules);
		Object.assign(this, {
			[LINE_INDEX]: 0,
			[COLUMN_INDEX]: 0,
		});

	}

}



//const rule_tokens = (new Rule_Parser(tokenizer_rules, tokenizer_rule_parser)).parse();
//rule_fprs.transform(rule_tokens);

//console.log(inspect(rule_tokens, {colors: true, depth: null}));
//console.log(inspect(rule_tokens[0].value, {colors: true, depth: null}));
//string_fprs.transform(rule_tokens[0].value[0].value);



pl_parser.process_text(language_definition);
//const tokens = token_definition_parser.process_text(token_definition);

//console.log(inspect(tokens, {colors: true, depth: null}));
//console.log(inspect(root_group, {colors: true, depth: null}));

//TODO next: Implement token definition tables and tokenizers
//			create a usable tokenizer based on this

//	Look into template-title.js for what is next after that


process.exit(1);
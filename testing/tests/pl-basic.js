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




//const rule_tokens = (new Rule_Parser(tokenizer_rules, tokenizer_rule_parser)).parse();
//rule_fprs.transform(rule_tokens);

//console.log(inspect(rule_tokens, {colors: true, depth: null}));
//console.log(inspect(rule_tokens[0].value, {colors: true, depth: null}));
//string_fprs.transform(rule_tokens[0].value[0].value);



pl_parser.process_text(language_definition_1);
//const tokens = token_definition_parser.process_text(token_definition);

//console.log(inspect(tokens, {colors: true, depth: null}));
//console.log(inspect(root_group, {colors: true, depth: null}));

//TODO next: Implement token definition tables and tokenizers
//			create a usable tokenizer based on this

//	Look into template-title.js for what is next after that


process.exit(1);
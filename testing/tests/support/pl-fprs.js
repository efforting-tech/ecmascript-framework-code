import { Fixed_Point_Reduction_Scanner, REDUCTION_ORDER } from '../../../lib/parsing/scanner.js';
import { FPR_Contract } from '../../../lib/parsing/contracts.js';

import { sequence_in_place_replacement } from '../../../lib/data/transform.js';

import * as R from '../../../lib/data/rules.js';
import * as C from '../../../lib/data/conditions.js';
import * as SC from '../../../lib/data/sequence-conditions.js';
import * as CA from '../../../lib/data/captures.js';

import * as PL_AST from '../../../lib/parsing/ast.js';
import * as PL_TOKEN from '../../../lib/parsing/tokens.js';

//TODO - possibly utilize stack_channel (or something else?)

//TODO - move to lib
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



export const rule_fprs = new Fixed_Point_Reduction_Scanner([

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



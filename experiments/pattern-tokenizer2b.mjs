import * as P from 'efforting.tech-framework/parsing/basic-tokenizer/declarative.js';
import * as C from 'efforting.tech-framework/data/conditions.js';

import { inspect } from 'node:util';


import { create_character_tokens, create_symbol_tokens,  create_escape_tokens, Match_Based_Token_Processor } from 'efforting.tech-framework/parsing/basic-tokenizer/basic-tokenizer.js';
import { Default_Match, Token_Match, implement_tokenizer, Pass_Through_Token_Processor, Standard_Token_Processor } from 'efforting.tech-framework/parsing/basic-tokenizer/implementation.js';
import { create_records_from_raster_table  } from 'efforting.tech-framework/operations/high-level-dispatchers.js';
import { dump, assert, assert_type } from 'efforting.tech-framework/validation/utils.js';


import { System } from 'efforting.tech-framework/tree-language/system.js';
import { Program_Context } from 'efforting.tech-framework/tree-language/context.js';



//TODO - Move to lib
class Rewrite_Engine {
	// NOTE: A rewrite engine could, under the assumption it is the only thing mutating sequences, have a cache to prevent re-evaluating conditions over and over when no mutations have occured.
	// TODO: Implement such a feature or possibly make an extension of Rewrite_Engine

	constructor(rules=[]) {
		Object.assign(this, { rules });
	}

	rewrite_once(state) {

		for (let index=0; index<state.length; index++) {
			const rule_match = this.match(state.slice(index));
			if (rule_match) {
				const { condition, match, action } = rule_match;
				const rewrite_as = action(this, match);
				state.splice(index, match.sequence_length, ...rewrite_as);
				return true;

			}
		}
		return false;

	}

	exhaust_rewrites(state) {
		while (this.rewrite_once(state));
	}


	match(state) {
		for (const [condition, action] of this.rules) {
			const match = condition.match_sequence(state);
			if (match) {
				return { condition, match, action };
			}
		}
	}

}



const token_characters = '|«»[]() \t\n';
const token_names = 'PIPE, LD_ARROW, RD_ARROW, LSQ_PAR, RSQ_PAR, L_PAR, R_PAR, SPACE, TABULATOR, NEWLINE';

const T = create_escape_tokens(token_characters + '\\', token_names + ', BACKSLASH', token => `\\${token}`, name => `ESCAPE_${name}`);
Object.assign(T, create_character_tokens(token_characters, token_names));
Object.assign(T, create_symbol_tokens('OPTIONAL, CAPTURE, EXPRESSION'));

T.IDENTIFIER = /(\w+)/;
T.WHITESPACE = /(\s+)/;


dump(T)


// NOTE - this is somewhat cumbersome and it also doesn't give a clean directory back - but will have to do for now
const sys = new System();
const ctx = new Program_Context(sys);
create_records_from_raster_table(ctx, `
	name			members
	----			-------
	Text			value
	Expression		〃
	Optional		〃
	Capture			〃
`);
const AST = ctx.flatten();
const TOKEN = {
	PIPE: Symbol('PIPE'),
	CAPTURE: Symbol('CAPTURE'),
	EXPRESSION: Symbol('EXPRESSION'),
	OPTIONAL: Symbol('OPTIONAL'),
	WHITESPACE: Symbol('WHITESPACE'),
	TEXT: Symbol('TEXT'),
}




const system = P.tokenization_system(null,
	P.assign_tokens(T),
	P.sub_tokenizer('main',

		//TODO - function to help with these
		P.on_token('ESCAPE_BACKSLASH', P.emit_token(TOKEN.TEXT)),
		P.on_token('ESCAPE_LD_ARROW', P.emit_token(TOKEN.TEXT)),
		P.on_token('ESCAPE_RD_ARROW', P.emit_token(TOKEN.TEXT)),

		P.on_token('LD_ARROW', P.enter('capture').then( P.emit_token(TOKEN.CAPTURE) )),

		P.on_token('R_PAR', P.exit() ),
		P.on_token('RSQ_PAR', P.exit() ),

		P.on_token('L_PAR', P.enter().then( P.emit_token(TOKEN.EXPRESSION)) ),
		P.on_token('LSQ_PAR', P.enter().then( P.emit_token(TOKEN.OPTIONAL)) ),

		P.on_token('PIPE', P.emit_token(TOKEN.PIPE)),
		/*
		P.on_token('SPACE', P.emit_token(TOKEN.WHITESPACE)),
		P.on_token('TABULATOR', P.emit_token(TOKEN.WHITESPACE)),
		P.on_token('NEWLINE', P.emit_token(TOKEN.WHITESPACE)),
		*/

		P.default_action( P.emit_token(TOKEN.TEXT) ),
	),
	P.sub_tokenizer('inner_capture',
		P.on_token('RD_ARROW', P.emit_token(TOKEN.TEXT).then(P.exit())),
		P.on_token('LD_ARROW', P.emit_token(TOKEN.TEXT).then(P.enter().then( P.emit_pending_tokens() ))),

		P.on_token('WHITESPACE', P.emit_token(TOKEN.WHITESPACE)),

		P.default_action( P.emit_token(TOKEN.TEXT) ),
	),
	P.sub_tokenizer('capture',
		P.on_token('RD_ARROW', P.exit()),
		P.on_token('LD_ARROW', P.enter('inner_capture').and( P.emit_token('hellu')) ),

		P.on_token('WHITESPACE', P.emit_token(TOKEN.WHITESPACE)),

		P.default_action( P.emit_token(TOKEN.TEXT) ),
	),


);

//const test = 'capture «identifier»[:] «pattern»';
const test = 'identifier';
const tokenizer = implement_tokenizer(system);

const pattern = [...tokenizer.tokenize(test)];		// [ Token_Match(Symbol(TEXT), Default_Match('identifier')) ]

function single_word_condition(word) {
	return new C.Sequence2(
		new C.Conjunction(
			new C.Constructor_is(Token_Match), new C.Property(
				'match_or_value', new C.Conjunction(
					new C.Constructor_is(Default_Match),
					new C.Property('text', new C.Value_is(word)),
				),
			),
		),
	);
}



const state = [...tokenizer.tokenize('stuff «inline «inner»» things')];


//TODO - move to lib
class Match_Span {
	constructor(start, end) {
		Object.assign(this, { start, end });
	}


	[inspect.custom](depth, options, inspect) {
		const { start, end } = this;
		const sub_string = start.input.slice(start.index, end.end_index);

		return `${this.constructor.name}(${inspect(sub_string, options)})`;
	}

}


//Next step is to have a rewrite engine to match state (and to coalesce neighbor tokens)


const rw = new Rewrite_Engine([

	[new C.Repeat(new C.Conjunction(new C.Constructor_is(Token_Match), new C.Property('token', new C.Value_is(TOKEN.WHITESPACE))), 2, null), (engine, match) => {
		const span_match = new Match_Span(match.matched_sequence.at(0), match.matched_sequence.at(-1));
		return [new Token_Match(match.condition, TOKEN.WHITESPACE, span_match)];
	}],

	[new C.Repeat(new C.Conjunction(new C.Constructor_is(Token_Match), new C.Property('token', new C.Value_is(TOKEN.TEXT))), 2, null), (engine, match) => {
		const span_match = new Match_Span(match.matched_sequence.at(0), match.matched_sequence.at(-1));
		return [new Token_Match(match.condition, TOKEN.TEXT, span_match)];
	}],

]);


dump(state)
rw.exhaust_rewrites(state);
dump(state)


//dump(single_word_condition('identifier').match(pattern))

//dump(c)
//dump(pattern);
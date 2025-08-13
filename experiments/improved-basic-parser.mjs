import * as P from './parsing-system.mjs';

import { inspect } from 'node:util';
import { dump, assert, assert_type } from 'efforting.tech-framework/validation/utils.js';
import { implement_parser, Pass_Through_Token_Processor } from './implement-parser.mjs';



function create_character_tokens(string, names=null) {
	//TODO - if names is null we should use unicodedata
	assert(names !== null, 'Not using names is not supported yet');

	if (typeof names === 'string') {
		names = names.split(',').map(i => i.trim());
	}
	assert(string.length === names.length, 'Length mismatch');
	return Object.fromEntries(names.map((name, i) => [name, string[i]] ));
}

function create_symbol_tokens(names) {

	if (typeof names === 'string') {
		names = names.split(',').map(i => i.trim());
	}
	assert_type(names, Array);

	return Object.fromEntries(names.map(name => [name, Symbol(name)]));
}


class Match_Based_Token_Processor {
	constructor(processor) {
		Object.assign(this, { processor });
	}

	process_token(state, token, match_or_value) {
		if (Array.isArray(match_or_value)) {
			// Sub expressions
			return this.processor(match_or_value);
		} else {
			// Regular or default matches
			return this.processor(...match_or_value.plain_matches);
		}
	}
}


const T = create_character_tokens('§«»[](){}#', 'SIGIL, LD_ARROW, RD_ARROW, LSQ_PAR, RSQ_PAR, L_PAR, R_PAR, LC_PAR, RC_PAR, HASH');
T.LINE_REMAINING = /(.*)$/m;
T.BLARGH = /\((.*?)\)/;
Object.assign(T, create_symbol_tokens('EXPRESSION, VALUE, TEXT'));

const test = 'Hello (world) «this is expression»!!!';	// In this test we want to only match « and » - so we will be using a subset of T.

const system = P.parsing_system(null,
	P.assign_tokens(T),
	P.set_token_processor_factory((processor) => new Match_Based_Token_Processor(processor)),
	P.sub_parser('main',
		P.push_token_processor_factory((processor) => new Pass_Through_Token_Processor(processor)),	//Demonstrate using pass through for more access to matching data
		P.on_token('BLARGH', P.emit_token('BLARGH', (state, token, match_or_value) => ({token: 'Blarg', value: match_or_value.match }) )),
		P.pop_token_processor_factory(),


		P.on_token('LD_ARROW', P.enter('expression').then( P.emit_token('EXPRESSION', (expr) => ({token: 'Expression', value: expr })) )),
		P.default_action( P.emit_token('TEXT', (text) => ({token: 'Text', value: text })) ),
	),
	P.sub_parser('expression',
		P.on_token('RD_ARROW', P.exit()),
		P.default_action( P.emit_token('VALUE', text => ({token: 'Value', value: text})) ),
	),
);


const parser = implement_parser(system);
for (const item of parser.parse(test)) {
	console.log(item);
};

/*

{ token: 'Text', value: 'Hello ' }
{
  token: 'Blarg',
  value: [
    '(world)',
    'world',
    index: 6,
    input: 'Hello (world) «this is expression»!!!',
    groups: undefined
  ]
}
{ token: 'Text', value: ' ' }
{
  token: 'Expression',
  value: [ { token: 'Value', value: 'this is expression' } ]
}
{ token: 'Text', value: '!!!' }


*/
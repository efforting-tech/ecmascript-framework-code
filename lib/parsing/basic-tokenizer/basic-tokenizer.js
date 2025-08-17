//NOTE: Adding another tokenizer system here of course makes things messy and not very DRY or SSoT.
//		This will be resolved once this library matures a bit - it is considered unstable at this point.

import * as P from './declarative.js';
import { implement_tokenizer, Pass_Through_Token_Processor } from './implementation.js';

import { inspect } from 'node:util';
import { dump, assert, assert_type } from '../../validation/utils.js';



export function create_character_tokens(string, names=null) {
	//TODO - if names is null we should use unicodedata
	assert(names !== null, 'Not using names is not supported yet');

	if (typeof names === 'string') {
		names = names.split(',').map(i => i.trim());
	}
	assert(string.length === names.length, 'Length mismatch');
	return Object.fromEntries(names.map((name, i) => [name, string[i]] ));
}

export function create_symbol_tokens(names) {

	if (typeof names === 'string') {
		names = names.split(',').map(i => i.trim());
	}
	assert_type(names, Array);

	return Object.fromEntries(names.map(name => [name, Symbol(name)]));
}


export function create_escape_tokens(string, names=null, escape_token_translator, escape_name_translator) {
	//TODO - if names is null we should use unicodedata
	assert(names !== null, 'Not using names is not supported yet');

	if (typeof names === 'string') {
		names = names.split(',').map(i => i.trim());
	}
	assert(string.length === names.length, 'Length mismatch');
	return Object.fromEntries(names.map((name, i) => [escape_name_translator(name), escape_token_translator(string[i])] ));
}



//TODO - probably move all token processors to one place - and possibly implement an abstract class. It is not 100% clear how I want to manage the token processors yet but the current sytem is versatile
export class Match_Based_Token_Processor {
	constructor(processor) {
		Object.assign(this, { processor });
	}

	process_token(state, token, match_or_value) {
		if (this.processor) {
			if (Array.isArray(match_or_value)) {
				// Sub expressions
				return this.processor(match_or_value);
			} else {
				// Regular or default matches
				return this.processor(...match_or_value.plain_matches);
			}
		} else {
			return token;
		}
	}
}



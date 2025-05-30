import * as R from '../../../lib/data/rules.js';
import * as C from '../../../lib/data/conditions.js';
import * as PL_TOKEN from '../../../lib/parsing/tokens.js';
import { Advanced_Regex_Tokenizer }  from '../../../lib/parsing/regexp-tokenizer.js';
import { ESCAPE_LUT_GENERIC } from './pl-escapes.js';

const ESCAPE_LUT = ESCAPE_LUT_GENERIC.get_view('symbol_by_escape');

const FROM_SUB_RESULT = Symbol('FROM_SUB_RESULT');


const common_rules = [

	//To be determined - option 1 - keep whitespace tokens
	/*
	new R.Resolution_Rule(new C.Regex_Condition( /(\s+)/ ),
		(resolver, space) => {
			resolver.push_token(new PL_TOKEN.Whitespace(resolver.pending_match, space));
		}
	),
	*/

	// Option 2 - just ignore them (but allow them) - this gets cleaner output and we can recover whitespace later but this hinges on whitespace being the only token that we treat like this
	new R.Resolution_Rule(new C.Regex_Condition( /(\s+)/ )),


	new R.Resolution_Rule(new C.Regex_Condition( /\#(.*)$/m ),
		(resolver, comment) => {
			resolver.push_token(new PL_TOKEN.Comment(resolver.pending_match, comment));
		}
	),

];


export const String_Tokenizer = new Advanced_Regex_Tokenizer('String_Tokenizer', [

	new R.Resolution_Rule(new C.Regex_Condition( /'/ ),
		(resolver) => {
			resolver.push_token(new PL_TOKEN.Quote(resolver.pending_match, '\''));
			resolver.leave_sub_tokenizer();
		}
	),

	new R.Resolution_Rule(new C.Regex_Condition( /\\(0|n|r)/ ),	//TODO - SSoT
		(resolver, escape_sequence) => {
			const value = ESCAPE_LUT[escape_sequence];
			if (value === undefined) {
				throw new Error('Unknown escape')
			}
			resolver.push_token(new PL_TOKEN.Escape(resolver.pending_match, value));
		}
	),

	new R.Default_Rule(
		(resolver, text) => {
			resolver.push_token(new PL_TOKEN.Literal(resolver.pending_match, text));
		}
	),
]);


export const Rule_Definition_Tokenizer = new Advanced_Regex_Tokenizer('Rule_Definition_Tokenizer', [


	new R.Resolution_Rule(new C.Regex_Condition( /(\w+)/ ),
		(resolver, name) => {
			resolver.push_token(new PL_TOKEN.Identifier(resolver.pending_match, name));
		}
	),

	new R.Resolution_Rule(new C.Regex_Condition( /[,]/ ),
		(resolver) => {
			resolver.push_token(new PL_TOKEN.Punctuation(resolver.pending_match, ','));
		}
	),

	new R.Resolution_Rule(new C.Regex_Condition( /[;]/ ),
		(resolver) => {
			//NOTE: Let's not push the sentinel token - how we deal with all this depends a bit on how we decide to implement source tracking later on
			//resolver.push_token(new PL_TOKEN.Punctuation(resolver.pending_match, ';'));
			resolver.leave_sub_tokenizer();
		}
	),

	new R.Resolution_Rule(new C.Regex_Condition( /'/ ),
		(resolver) => {
			resolver.enter_sub_tokenizer(String_Tokenizer, (sub_resolver, sub_result) => {
				resolver.push_token(new PL_TOKEN.String(FROM_SUB_RESULT, sub_result));
			});
			resolver.push_token(new PL_TOKEN.Quote(resolver.pending_match, '\''));
		}
	),

	...common_rules,

]);


export const Pending_Colon_Tokenizer = new Advanced_Regex_Tokenizer('Pending_Colon_Tokenizer', [
	new R.Resolution_Rule(new C.Regex_Condition( /[:]/ ),
		(resolver) => {
			resolver.switch_to(Rule_Definition_Tokenizer);
		}
	),

	...common_rules,
]);

export const Rule_Tokenizer = new Advanced_Regex_Tokenizer('Rule_TokenizerTokenizer_Rule_Parser', [

	new R.Resolution_Rule(new C.Regex_Condition( /(\w+)/ ),
		(resolver, name) => {
			resolver.enter_sub_tokenizer(Pending_Colon_Tokenizer, (sub_resolver, sub_result) => {
				resolver.push_token(new PL_TOKEN.Rule_Definition(FROM_SUB_RESULT, name, sub_result));
			});
		}
	),

	...common_rules,



]);


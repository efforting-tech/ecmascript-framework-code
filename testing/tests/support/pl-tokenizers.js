import * as R from '../../../lib/data/rules.js';
import * as C from '../../../lib/data/conditions.js';
import * as PL_TOKEN from '../../../lib/parsing/tokens.js';
import { Advanced_Regex_Tokenizer }  from '../../../lib/parsing/regexp-tokenizer.js';


export const LINE_INDEX = Symbol('LINE_INDEX');
export const COLUMN_INDEX = Symbol('COLUMN_INDEX');


//TODO - remove after debugging
import * as log from '../../../lib/debug/console.js';



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
	[ESCAPE_LUT["'"]]: "'",
	[ESCAPE_LUT['"']]: '"',
};




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


export const String_Tokenizer = new Advanced_Regex_Tokenizer('String_Tokenizer', [

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


export const Rule_Definition_Tokenizer = new Advanced_Regex_Tokenizer('Rule_Definition_Tokenizer', [


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
			resolver.enter_sub_tokenizer(String_Tokenizer, (sub_resolver, sub_result) => {
				resolver.push_token(new PL_TOKEN.String(start_line, start_col, sub_result));
			});	//We should add a function to handle the result
			resolver.push_token(new PL_TOKEN.Quote(resolver[LINE_INDEX], resolver[COLUMN_INDEX], '\''));
			resolver[COLUMN_INDEX] += 1;
		}
	),

	...common_rules,

]);


export const Pending_Colon_Tokenizer = new Advanced_Regex_Tokenizer('Pending_Colon_Tokenizer', [
	new R.Resolution_Rule(new C.Regex_Condition( /[:]/ ),
		(resolver) => {
			resolver.switch_to(Rule_Definition_Tokenizer);
			resolver[COLUMN_INDEX] += 1;
		}
	),

	...common_rules,
]);

export const Rule_Tokenizer = new Advanced_Regex_Tokenizer('Rule_TokenizerTokenizer_Rule_Parser', [

	new R.Resolution_Rule(new C.Regex_Condition( /(\w+)/ ),
		(resolver, name) => {
			log.Debug('name', name);
			const [start_line, start_col] = [resolver[LINE_INDEX], resolver[COLUMN_INDEX]];
			resolver.enter_sub_tokenizer(Pending_Colon_Tokenizer, (sub_resolver, sub_result) => {
				resolver.push_token(new PL_TOKEN.Rule_Definition(start_line, start_col, name, sub_result));
			});

			resolver[COLUMN_INDEX] += name.length;
		}
	),

	...common_rules,



]);


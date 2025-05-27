import { Rule_Parser } from './support/pl-rule-parser.js';
import { Rule_Tokenizer } from './support/pl-tokenizers.js';


const tokenizer_rules = `

	statement: '§' optional_space, 	#This is the start of the thing
		anything as value ;	#Here is more stuff

	expression: '«' anything as value '»' ;

	escapes: 'newline: \\n, null: \\0';

`;

const rule_tokens = (new Rule_Parser(tokenizer_rules, Rule_Tokenizer)).parse();


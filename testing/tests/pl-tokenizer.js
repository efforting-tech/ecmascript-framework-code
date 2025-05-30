import { Rule_Parser } from './support/pl-rule-parser.js';
import { Rule_Tokenizer } from './support/pl-tokenizers.js';
import { Parsing_Error } from '../../lib/parsing/regexp-tokenizer.js';

import { Line_Column_Indexer } from '../../lib/text/indexing.js';

const tokenizer_rules = `

	statement: '§' optional_space, 	#This is the start of the thing
		anything as value ;	#Here is more stuff

	expression: '«' anything as value '»' ;

	cause_error: \\weee

	escapes: 'newline: \\n, null: \\0';

`;





//TODO - move to formatter module - but since it is very specific we need to find a nice place for it, possibly via some interface rather than a top level function
function highlight_error_in_text_based_on_index(lci, index, message) {
	const [line_index, span] = lci.get_line_and_span_at_index(index);

	let column_index;
	let pending_column_index=0;
	let character_index = span.start;

	const line = span.slice(lci.source);
	let result = '';
	for (const char of line) {
		if (char == '\t') {
			const new_column_index = (Math.floor(pending_column_index / lci.tab_width) + 1) * lci.tab_width;
			result += ' '.repeat(new_column_index - pending_column_index);
			pending_column_index = new_column_index;
		} else {
			pending_column_index++;

			if (char.charCodeAt(0) < 32) {
				result += '�';
			} else {
				result += char;
			}
		}

		if (character_index++ == index) {
			column_index = pending_column_index;
		}
	}

	console.log(result);
	console.log(`${' '.repeat(column_index - 1)}⮬ ${message}`)	// ⮤ ⮬ ⮴ ⬑ ⬁ ⬉
}

const lci = new Line_Column_Indexer(tokenizer_rules, 1);

try {
	const rule_tokens = (new Rule_Parser(tokenizer_rules, Rule_Tokenizer)).parse();
	console.log(rule_tokens[0]);
} catch (err) {
	if (err instanceof Parsing_Error) {
		const [row, col] = lci.get_line_and_visual_col_at_index(err.index);
		console.log(`[stringdata]:${row}:${col} Parsing Error`);
		highlight_error_in_text_based_on_index(lci, err.index, err.message);
	} else {
		throw err;
	}

}




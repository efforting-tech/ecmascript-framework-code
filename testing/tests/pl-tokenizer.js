import { Rule_Parser } from './support/pl-rule-parser.js';
import { Rule_Tokenizer } from './support/pl-tokenizers.js';

import { Parsing_Error } from '../../lib/parsing/regexp-tokenizer.js';

const tokenizer_rules = `

	statement: '§' optional_space, 	#This is the start of the thing
		anything as value ;	#Here is more stuff

	expression: '«' anything as value '»' ;

	cause_error: \\weee

	escapes: 'newline: \\n, null: \\0';

`;


//TODO - move to lib
class Line_Span {
	constructor(start, end) {
		Object.assign(this, { start, end });
	}

	contains(index) {
		return this.start <= index && index <= this.end;
	}

	slice(text) {
		return text.slice(this.start, this.end);
	}

}


//TODO - move to lib
class Line_Column_Indexer {
	// Note: This could be improved with both incremental and binned approaches but for now we start simple by computing the entire table once but lazily

	constructor(source, start_index=0, tab_width=4) {
		const _line_list = null;
		Object.assign(this, { source, start_index, tab_width, _line_list });
	}

	get line_list() {
		if (!this._line_list) {
			this._line_list = [];
			// Create line list

			for (const match of this.source.matchAll(/^.*$/gm)) {
				this._line_list.push(new Line_Span(match.index, match.index + match[0].length));
			}

		}
		return this._line_list;
	}

	get_visual_column(span, index) {
		let column_index = 0;	//We will work in zero based columns but return 1 based (since this is for visual column)
		let character_index = span.start;

		const line = span.slice(this.source);
		for (const char of line) {
			if (char == '\t') {
				column_index = (Math.floor(column_index / this.tab_width) + 1) * this.tab_width;
			} else {
				column_index++;
			}

			if (character_index++ == index) {
				return column_index;
			}
		}
	}

	get_line_and_visual_col_at_index(index) {
		let line_index = this.start_index;
		for (const span of this.line_list) {
			if (span.contains(index)) {
				return [line_index, this.get_visual_column(span, index)];
			}
			line_index++;
		}
	}


	get_line_and_span_at_index(index) {
		let line_index = this.start_index;
		for (const span of this.line_list) {
			if (span.contains(index)) {
				return [line_index, span];
			}
			line_index++;
		}
	}

}


//TODO - move to formatter module
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




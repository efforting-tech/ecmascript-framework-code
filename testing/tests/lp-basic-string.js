import * as LP from '../../lib/text/line-processing/string-list.js';
import { inspect } from 'util';

const lv1 = LP.View.from_string(`
	This is a bunch
	of lines and such

	in this string here`);





//console.log(inspect(lv1, { colors: true, depth: null }));
console.log('--==[ First Test ]==--');

for (const line of lv1.lines) {

	const info = {
		full_line: line.full_line,
		title_span: [line.title_span_left, line.title_span_right],
		title: line.title,
		title_length: line.title_length,
		title_column: line.title_column,
	}

	console.log(inspect(info, { colors: true, depth: null }));
}

console.log('--==[ Second Test ]==--');

for (const line of lv1.indented_copy(1).lines) {
	const info = {
		full_line: line.full_line,
		title_span: [line.title_span_left, line.title_span_right],
		title: line.title,
		title_length: line.title_length,
		title_column: line.title_column,
	}

	console.log(inspect(info, { colors: true, depth: null }));
}


process.exit(1)
import * as LP from '../../lib/text/line-processing/span-list.js';
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
		indent_level: line.indent_level,
		title_span: line.title_span,
		title: line.title,
		title_length: line.title_length,
		title_visual_column: line.title_visual_column,
	}

	console.log(inspect(info, { colors: true, depth: null }));
}

console.log('--==[ Second Test ]==--');

for (const line of lv1.indented_copy(1).lines) {
	const info = {
		full_line: line.full_line,
		indent_level: line.indent_level,
		title_span: line.title_span,
		title: line.title,
		title_length: line.title_length,
		title_visual_column: line.title_visual_column,
	}

	console.log(inspect(info, { colors: true, depth: null }));
}


//process.exit(1)
//TODO - add assertions

import { assert_equality } from '../framework/utils.js';
import { POSIX } from '../../lib/text/line-endings.js';
import { Tabulators, Spaces } from '../../lib/text/indent.js';
import { Text_Format } from '../../lib/text/format.js';

import { inspect } from 'util';

const test_text_tabs = `
	Hello World
	How are you?
		This text should be
			using posix style line endings
	or else...`;

const test_text_spaces = `
    Hello World
    How are you?
        This text should be
            using posix style line endings
    or else...`;



const format_tabs = new Text_Format( POSIX, Tabulators );
const format_spaces = new Text_Format( POSIX, new Spaces(4) );


const experiments = [
	['Tabs', format_tabs, test_text_tabs],
	['Spaces', format_spaces, test_text_spaces],
]

for (const [experiment_title, format, text] of experiments) {
	console.log(`--== ${experiment_title} ==--`);
	let pending_column_index = 0;	//Opportunity to set start column if we are slicing a line
	let pending_row_index = 0;
	for (const [level, head_span, title_span, tail_span] of format.iter_level_and_component_spans(text)) {
		const title_column_index = pending_column_index + format.indention_mode.level_to_column(level);
		console.log(inspect([pending_row_index, title_column_index, text.slice(...title_span)]));
		pending_column_index = 0;
		pending_row_index++;
	}
}

process.exit(2)
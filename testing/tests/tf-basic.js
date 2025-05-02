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



const format_tabs = new Text_Format( POSIX, new Tabulators(4) );
const format_spaces = new Text_Format( POSIX, new Spaces(4) );

for (const [level, head, title, tail] of format_tabs.iter_level_and_components(test_text_tabs)) {
	console.log(inspect([level, head, title, tail]));
}

for (const [level, head, title, tail] of format_tabs.iter_level_and_component_spans(test_text_tabs)) {
	console.log(inspect([level, head, title, tail]));
}

console.log('----')

for (const [level, head, title, tail] of format_spaces.iter_level_and_components(test_text_spaces)) {
	console.log(inspect([level, head, title, tail]));
}

for (const [level, head, title, tail] of format_spaces.iter_level_and_component_spans(test_text_spaces)) {
	console.log(inspect([level, head, title, tail]));
}


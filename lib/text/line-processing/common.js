import { Enum } from '../../enum.js';
import * as RE from '../regexp.js';

//We will change it so that a line has an owner which is the line view with possible settings.
export const INDENTION_MODE = new Enum('INDENTION_MODE', {
	TABULATORS: Symbol,
	SPACES: Symbol,
});

export const DEFAULT_INDENTION_MODE = INDENTION_MODE.TABULATORS;
export const DEFAULT_INDENTION_WIDTH = 4;

export function create_head(level, indention_mode=DEFAULT_INDENTION_MODE, indention_width=DEFAULT_INDENTION_WIDTH) {
	switch (indention_mode) {
		case INDENTION_MODE.TABULATORS:
			return '\t'.repeat(level);

		case INDENTION_MODE.SPACES:
			return ' '.repeat(level * indention_width);
	}
}


export function get_indent_level_from_head(head, indention_mode=DEFAULT_INDENTION_MODE, indention_width=DEFAULT_INDENTION_WIDTH) {
	switch (indention_mode) {
		case INDENTION_MODE.TABULATORS: {
			return head.length;
		}
		case INDENTION_MODE.SPACES: {
			return Math.floor(head.length, indention_width);
		}
	}
}

export function get_line_components(string, indention_mode=DEFAULT_INDENTION_MODE, indention_width=DEFAULT_INDENTION_WIDTH) {
	//Returns [head, title, tail]
	switch (indention_mode) {
		case INDENTION_MODE.TABULATORS: {
			return string.match(/^(\t*)(.*)$(\n?)/m).slice(1);
		}
		case INDENTION_MODE.SPACES: {
			return string.match(RE.concat('^(', `(?:[ ]{${indention_width}})`, '*)', /(.*)$(\n?)/m )).slice(1);
		}
	}
}



//TODO - move to scalar utils
export function clamped_adjustment(value, low=undefined, high=undefined) {
	if ((low !== undefined) && (value < low)) {
		return low;
	} else if ((high !== undefined) && (value > high)) {
		return high;
	} else {
		return value;
	}
}


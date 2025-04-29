import { Enum } from '../../enum.js';
import * as RE from '../regexp.js';

//We will change it so that a line has an owner which is the line view with possible settings.
export const INDENTION_MODE = new Enum('INDENTION_MODE', {
	TABULATORS: Symbol,
	SPACES: Symbol,
});

export const DEFAULT_INDENTION_MODE = INDENTION_MODE.TABULATORS;
export const DEFAULT_INDENTION_WIDTH = 4;

//DEPRECATED
export const DEFAULT_LINE_SETTINGS = {
	indention_mode: DEFAULT_INDENTION_MODE,
	indention_width: DEFAULT_INDENTION_WIDTH,
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



//DEPRECATED
export function get_indention_level_and_text(string, settings=DEFAULT_LINE_SETTINGS) {
	switch (settings.indention_mode) {
		case INDENTION_MODE.TABULATORS: {
			const [tabs, text] = string.match(/(\t*)(.*)/).slice(1);
			return [tabs.length, text];
		}
		case INDENTION_MODE.SPACES: {
			// TODO - `(?:[ ]{4})*` where 4 is the indention_width (we can use the regexp concat stuff here)
			const [spaces, text] = string.match(/([ ]*)(.*)/).slice(1);
			if (spaces.length % settings.indention_width) {
				throw new Error('Uneven indent');	//TODO  - add strictness option
			}
			const level = Math.floor(spaces.length / settings.indention_width);
			return [level, text];
		}
	}
}

//DEPRECATED
export function get_title_start_point(string, indention_mode=DEFAULT_INDENTION_MODE) {
	switch (indention_mode) {
		case INDENTION_MODE.TABULATORS:
			const [tabs] = string.match(/^(\t*)/);
			return tabs.length;

		case INDENTION_MODE.SPACES:
			const [spaces]  = string.match(/^([ ]*)/);
			return spaces.length;
	}
}

//DEPRECATED
export function get_title_end_point(string) {
	const [tail] = string.match(/(\s*)$/);
	return tail.length;
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


//TODO: DEPRECATED - move to line-processing
/*

	Create two interfaces, string_list and span_list

*/

import { Enum } from '../enum.js';

//We will change it so that a line has an owner which is the line view with possible settings.

export const INDENTION_MODE = new Enum('INDENTION_MODE', {
	TABULATORS: Symbol,
	SPACES: Symbol,
});


export const DEFAULT_LINE_SETTINGS = {
	indention_mode: INDENTION_MODE.TABULATORS,
	indention_width: 4,
}

export const DEFAULT_LINE_VIEW_SETTINGS = {
	line_ending: '\n',
	line_settings: DEFAULT_LINE_SETTINGS,
};


function get_indent(level, settings=DEFAULT_LINE_SETTINGS) {
	switch (settings.indention_mode) {
		case INDENTION_MODE.TABULATORS:
			return '\t'.repeat(level);

		case INDENTION_MODE.SPACES:
			return ' '.repeat(level * settings.indention_width);

	}

}

function get_indention_level(string, settings=DEFAULT_LINE_SETTINGS) {
	switch (settings.indention_mode) {
		case INDENTION_MODE.TABULATORS: {
			const [tabs, text] = string.match(/(\t*)(.*)/).slice(1);
			return [tabs.length, text];
		}
		case INDENTION_MODE.SPACES: {
			const [spaces, text] = string.match(/(\s*)(.*)/).slice(1);
			if (spaces.length % settings.indention_width) {
				throw new Error('Uneven indent');	//TODO  - add strictness option
			}
			const space_count = spaces.length / settings.indention_width;
			return [space_count, text];
		}
	}
}


export class Indented_Line {
	constructor(level, text, settings=DEFAULT_LINE_SETTINGS) {
		Object.assign(this, { level, text, settings });
	}

	copy() {	//NOTE - assumption here is that we do shallow copy of settings
		//TODO - add support for overrides
		return new this.constructor(this.level, this.text, this.settings);
	}

	static from_string(string, settings=DEFAULT_LINE_SETTINGS) {
		const [level, text] = get_indention_level(string, settings);
		return new this(level, text, settings);
	}

	static from_anything(item, settings=DEFAULT_LINE_SETTINGS) {
		if (item instanceof this) {
			return new this(item.level, item.text, settings);
		} else if (item instanceof String) {
			return this.from_string(item, settings);
		} else {
			throw new Error('Unknown type');	//TODO - improve
		}
	}
}

//TODO - should we really store settings here? Seems it makes things more complicated than they have to be
export class Line_View {
	constructor (lines=[]) {
		Object.assign(this, { lines });
	}


	static from_string(string, settings=DEFAULT_LINE_VIEW_SETTINGS) {
		return new this(string.split(settings.line_ending).map(line => Indented_Line.from_string(line, settings.line_settings)));
	}

	static from_lines(lines, settings=DEFAULT_LINE_VIEW_SETTINGS) {
		return new this(lines.map(line => Indented_Line.from_anything(line, settings.line_settings)));
	}

	to_string(settings=DEFAULT_LINE_VIEW_SETTINGS) {
		return this.lines.map(line => `${get_indent(line.level, line.settings)}${line.text}` ).join(settings.line_ending);
	}

	copy() {
		return new this.constructor(this.lines.map(line => line.copy()));
	}

	get_minimum_indent_level() {
		return Math.min(...this.lines.filter(line => line.text.length).map(line => line.level));
	}

}

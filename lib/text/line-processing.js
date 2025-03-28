import { Enum } from '../enum.js';

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
	constructor(level, text, settings) {
		Object.assign(this, { level, text, settings });
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

export class Line_View {
	constructor (lines=[]) {
		Object.assign(this, { lines });
	}

	get_minimum_indent_level() {
		return Math.min(...this.lines.filter(line => line.text.length).map(line => line.level));
	}

	static from_string(string, settings=DEFAULT_LINE_VIEW_SETTINGS) {
		return new this(string.split(settings.line_ending).map(line => Indented_Line.from_string(line, settings.line_settings)));
	}

	static from_lines(lines, settings=DEFAULT_LINE_VIEW_SETTINGS) {
		return new this(lines.map(line => Indented_Line.from_anything(line, settings.line_settings)));
	}

}

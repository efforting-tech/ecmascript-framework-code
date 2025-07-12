import * as log from '../debug/console.js';
import { POSIX } from './line-endings.js';
import { Tabulators } from './indent.js';

export class Text_Format {
	constructor(line_endings, indention_mode) {
		Object.assign(this, { line_endings, indention_mode });
	}

	*iter_components(text) {
		// Returns [head, title, tail]
		for (const [line, tail] of this.line_endings.iter_components(text)) {
			yield [...this.indention_mode.to_components(line), tail];
		}
	}

	*iter_level_title_ending(text) {
		// Returns [level, title, tail]
		for (const [line, tail] of this.line_endings.iter_components(text)) {
			yield [...this.indention_mode.to_level_and_title(line), tail];
		}
	}

	*iter_level_and_components(text) {
		// Returns [head, title, tail]
		for (const [line, tail] of this.line_endings.iter_components(text)) {
			const [head, title] = this.indention_mode.to_components(line);
			const level = this.indention_mode.get_level_from_head(head);
			yield [level, head, title, tail];
		}
	}

	*iter_level_and_component_spans(text) {
		// Returns [head, title, tail]
		for (const [line_span, tail_span] of this.line_endings.iter_component_spans(text)) {
			const [head_span, title_span] = this.indention_mode.to_component_spans(text, line_span);
			const head = text.slice(...head_span);
			const level = this.indention_mode.get_level_from_head(head);
			yield [level, head_span, title_span, tail_span];
		}
	}

	*iter_component_spans(text) {
		// Returns [head, title, tail]
		for (const [line_span, tail_span] of this.line_endings.iter_component_spans(text)) {
			const [head_span, title_span] = this.indention_mode.to_component_spans(text, line_span);
			yield [head_span, title_span, tail_span];
		}
	}

	to_component_spans(text, sub_span=undefined) {
		const [line_span, tail_span] = this.line_endings.to_component_spans(text, sub_span);
		log.Debug('format.to_component_spans[1]', text, sub_span, line_span, tail_span);
		const [head_span, title_span] = this.indention_mode.to_component_spans(text, line_span);
		log.Debug('format.to_component_spans[2]', head_span, title_span);
		return [head_span, title_span, tail_span];
	}

	to_components(text) {
		const [line, tail] = this.line_endings.to_components(text);
		log.Debug('format.to_components[1]', text, line, tail);
		const [head, title] = this.indention_mode.to_components(line);
		log.Debug('format.to_components[2]', head, title);
		return [head, title, tail];
	}


}

export const LIBRARY_DEFAULT = new Text_Format(POSIX, new Tabulators(4));


export const char_width_lut = {
	'〃': 2,
}

//TODO - move to formatter module
//NOTE - this one only support posix newlines, this should be fixed later
export function tabs_to_spaces(text, tab_width=4) {
	let pending_column_index=0;

	let result = '';
	for (const char of text) {
		if (char == '\t') {
			const new_column_index = (Math.floor(pending_column_index / tab_width) + 1) * tab_width;
			result += ' '.repeat(new_column_index - pending_column_index);
			pending_column_index = new_column_index;
		} else {
			if (char.charCodeAt(0) === 10) {
				result += '\n';
				pending_column_index = 0;
/*			} else if (char.charCodeAt(0) < 32) {
				result += '�';
*/			} else {
				pending_column_index += (char_width_lut[char] ?? 1)
				result += char;
			}
		}
	}
	return result;

}

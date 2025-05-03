import { LIBRARY_DEFAULT } from '../format.js';
import * as String_List from './string-list.js';
import * as log from '../../debug/console.js';

export class Line {
	constructor(owner, head_span, title_span, tail_span, line_index=undefined, column_index=undefined) {
		Object.assign(this, { owner, head_span, title_span, tail_span, line_index, column_index });
	}

	static from_line_span(owner, span, line_index=undefined, column_index=undefined) {
		return new this(owner, ...owner.text_format.to_component_spans(owner.source, span), line_index, column_index);
	}

	get full_span() {
		return [this.head_span[0], this.tail_span[1]];
	}

	get full_line() {
		return this.owner.source.slice(...this.full_span);
	}

	get head_and_title() {
		return this.owner.source.slice(this.head_span[0], this.title_span[1]);
	}

	get title() {
		return this.owner.source.slice(...this.title_span);
	}

	get head() {
		return this.owner.source.slice(...this.head_span);
	}

	get tail() {
		return this.owner.source.slice(...this.tail_span);
	}


	get indent_level() {
		if (this.title_length > 0) {
			return this.owner.text_format.indention_mode.get_level_from_span(this.head_span);
		} else {
			return undefined;
		}
	}


	get title_length() {
		return this.title_span[1] - this.title_span[0];
	}

	get title_visual_column() {
		return this.owner.text_format.indention_mode.level_to_visual_column(this.indent_level);
	}

}


export class View {
	constructor(source, lines, text_format=LIBRARY_DEFAULT) {
		Object.assign(this, { source, lines, text_format });
	}

	//TODO
/*	indented_copy(adjustment=0) {
		const lines = this.lines.map(line => line.indented_copy(adjustment));
		const copy = new this.constructor(undefined, lines, this.text_format);
		return copy;
	}
*/

	get_minimum_indent_level() {
		let min_level = undefined;
		for (const line of this.lines) {
			const level = line.indent_level;
			if ((level !== undefined) && ((min_level === undefined) || (level < min_level))) {
				min_level = level;
				if (min_level === 0) {
					return min_level;
				}
			}
		}
		return min_level;
	}

	static from_string(text, first_line_index=0, first_column_index=0, text_format=LIBRARY_DEFAULT) {
		let column_index = first_column_index;
		let line_index = first_line_index;

		const lines = [];
		const result = new this(text, lines, text_format);

		for (const component_spans of text_format.iter_component_spans(text)) {
			lines.push(new Line(result, ...component_spans, line_index, column_index));
			line_index++;
			column_index = 0;
		}

		return result;
	}

	to_text() {
		return this.text_format.line_endings.join(this.lines.map(line => line.head_and_title));
	}

	slice(left, right=undefined) {
		return new this.constructor(this.source, this.lines.slice(left, right), this.text_format);
	}

	get first_line_index() {
		return this.lines[0].line_index;
	}

	absolute_slice(left, right=undefined) {
		const sliced_lines = new this.constructor(this.source, this.lines.slice(left - this.first_line_index, right - this.first_line_index), this.text_format);
		return new this.constructor(this.source, sliced_lines);
	}

	*[Symbol.iterator] () {
		yield* this.lines;
	}


}
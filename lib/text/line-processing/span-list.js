import * as log from '../../debug/console.js';
import { LIBRARY_DEFAULT } from '../format.js';

//import { create_head, get_line_components, clamped_adjustment, DEFAULT_INDENTION_MODE, DEFAULT_INDENTION_WIDTH, INDENTION_MODE } from './common.js';

import * as String_List from './string-list.js';

//TODO - maybe disallow title = null and have a has_title or something property
//TODO - we should probably go through this module and see if things could be updated due to improved common.js features

export class Line {
	constructor(owner, head_span, title_span, tail_span, line_index=undefined, column_index=undefined) {
		Object.assign(this, { owner, head_span, title_span, tail_span, line_index, column_index });
	}

	static from_line_span(owner, span, line_index=undefined, column_index=undefined) {
		return new this(owner, ...owner.text_format.to_component_spans(owner.source, span), line_index, column_index);
	}

	indented_copy(adjustment=0) {
		return new String_List.Line(this.owner, this.head, this.title, this.tail, this.line_index, this.column_index);
	}

	get full_span() {
		return [this.head_span[0], this.tail_span[1]];
	}

	get full_line() {
		return this.owner.source.slice(...this.full_span);
	}

	get title() {	//TODO - decide if this should always be string or if null is fine too
		return this.owner.source.slice(...this.title_span);
	}

	get head() {
		return this.owner.source.slice(...this.head_span);
	}

	get tail() {
		return this.owner.source.slice(...this.tail_span);
	}

	get indent_level() {
		return this.owner.text_format.indention_mode.get_level_from_span(this.head_span);
	}

	get title_length() {
		return (this.span_right - this.title_span_right) - (this.span_left + this.title_span_left);
	}

	get title_visual_column() {
		return this.owner.text_format.indention_mode.level_to_visual_column(this.indent_level);
	}


	reindented_full_line(adjustment) {
		throw new Error('OUTDATED')
		if (this.indent_level === null) {
			return this.full_line;
		}

		const new_level = clamped_adjustment(this.indent_level + adjustment, 0, undefined);

		const indention_mode = this.owner.indention_mode ?? DEFAULT_INDENTION_MODE;
		const indention_width = this.owner.indention_width ?? DEFAULT_INDENTION_WIDTH;

		switch (indention_mode) {
			case INDENTION_MODE.TABULATORS:
				return '\t'.repeat(new_level) + (this.title ?? '') + this.tail;

			case INDENTION_MODE.SPACES:
				return ' '.repeat(new_level * indention_width) + (this.title ?? '') + this.tail;
		}

	}

}


export class View {
	constructor(source, lines, text_format=LIBRARY_DEFAULT) {
		Object.assign(this, { source, lines, text_format });
	}

	indented_copy(adjustment=0) {
		const lines = this.lines.map(line => line.indented_copy(adjustment));
		const copy = new this.constructor(undefined, lines, this.text_format);
		return copy;
	}

	static from_string(text, first_line_index=0, first_column_index=0, text_format=LIBRARY_DEFAULT) {
		let column_index = first_column_index;
		let line_index = first_line_index;

		const lines = [];
		const result = new this(text, lines, text_format);

		for (const component_spans of text_format.iter_component_spans(text)) {
			console.log(component_spans);
			lines.push(new Line(result, ...component_spans, line_index, column_index));
			line_index += 1;
			column_index = 0;
		}

		return result;
	}
}
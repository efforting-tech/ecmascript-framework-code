import { LIBRARY_DEFAULT } from '../format.js';
import { clamped_scalar } from '../../data/scalars.js';
import { inspect } from 'util';

// TODO - fix line_index vs row_index terms


export class Line {
	constructor(owner, head, title, tail, line_index=undefined, column_index=undefined) {
		Object.assign(this, { owner, head, title, tail, line_index, column_index });
	}

	static from_string(owner, value, line_index=undefined, column_index=undefined) {
		return new this(owner, ...owner.text_format.to_components(value), line_index, column_index);
	}

	get indent_level() {
		return this.owner.text_format.indention_mode.get_level_from_head(this.head);
	}

	indented_copy(adjustment=0) {
		return new Line(this.owner, this.owner.text_format.indention_mode.create_adjusted_head(this.head, adjustment), this.title, this.tail, this.line_index, this.column_index);
	}

	get full_line() {
		return this.head + this.title + this.tail;
	}

	get title_length() {
		return this.title.length
	}

	get title_visual_column() {
		return this.owner.text_format.indention_mode.level_to_visual_column(this.indent_level);
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

		for (const components of text_format.iter_components(text)) {
			lines.push(new Line(result, ...components, line_index, column_index));
			line_index += 1;
			column_index = 0;
		}

		return result;
	}
}
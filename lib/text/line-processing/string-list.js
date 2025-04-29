import { inspect } from 'util';
import { create_head, get_line_components, get_indent_level_from_head, clamped_adjustment, DEFAULT_INDENTION_MODE, DEFAULT_INDENTION_WIDTH, INDENTION_MODE } from './common.js';


//NOTE: Line.title and Line.full_line is orthogonal in this implementation - should we do something about that?

export class Line {
	constructor(owner, head, title, tail, line_index=undefined, column_index=undefined) {
		//We should set head and tail also but we should have a different split function
		Object.assign(this, { owner, head, title, tail, line_index, column_index });
	}

	static from_string(owner, value, line_index=undefined, column_index=undefined) {
		return new this(owner, ...get_line_components(value, owner.indention_mode, owner.indention_width), line_index, column_index);
	}

	get indent_level() {
		return get_indent_level_from_head(this.head);
	}

	indented_copy(adjustment=0) {
		return new Line(this.owner, create_head(clamped_adjustment(this.indent_level + adjustment, 0, undefined)), this.title, this.tail, this.line_index, this.column_index);
	}

	get full_line() {
		return this.head + this.title + this.tail;
	}

	get title_length() {
		return this.title.length
	}

	get title_column() {
		if (!this.title.length) {
			return null;
		}
		const indention_mode = this.owner.indention_mode ?? DEFAULT_INDENTION_MODE;
		const indention_width = this.owner.indention_width ?? DEFAULT_INDENTION_WIDTH;

		switch (indention_mode) {
			case INDENTION_MODE.TABULATORS:
				return (this.column_index ?? 0) + this.head.length * indention_width;

			case INDENTION_MODE.SPACES:
				return (this.column_index ?? 0) + this.head.length;
		}
	}

}


export class View {
	constructor(source, lines, indention_mode=undefined, indention_width=undefined) {
		Object.assign(this, { source, lines, indention_mode, indention_width });
	}

	indented_copy(adjustment=0) {
		const lines = this.lines.map(line => line.indented_copy(adjustment));
		const copy = new this.constructor(undefined, lines, this.indention_mode, this.indention_width);



		return copy;
	}

	static from_string(text, first_row_index=0, first_column_index=0, indention_mode=undefined, indention_width=undefined) {
		const lines = [];
		const result = new this(text, lines, indention_mode, indention_width);

		let line_index = first_row_index;
		let column_index = first_column_index;

		for (const match of text.matchAll(/^.*$\n?/gm)) {

			lines.push(Line.from_string(result, match[0], line_index, column_index));
			line_index += 1;
			column_index = 0;
		}

		return result;
	}
}
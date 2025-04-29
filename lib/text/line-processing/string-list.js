import { inspect } from 'util';
import { get_indention_level_and_text, /*clamped_adjustment, get_title_start_point, get_title_end_point, DEFAULT_INDENTION_MODE, DEFAULT_INDENTION_WIDTH, INDENTION_MODE */} from './common.js';


//NOTE: Line.title and Line.full_line is orthogonal in this implementation - should we do something about that?

export class Line {
	constructor(owner, full_line, title, indent_level=0, line_index=undefined, column_index=undefined) {
		//We should set head and tail also but we should have a different split function
		Object.assign(this, { owner, full_line, title, indent_level, line_index, column_index });
	}

	static from_string(owner, value, line_index=undefined, column_index=undefined) {
		const [level, title] = get_indention_level_and_text(value);
		const result = new this(owner, value, title, level, line_index, column_index);
		return result;
	}

	indented_copy(adjustment=0) {
		return new Line(this.owner, this.full_line, this.title, clamped_adjustment(this.indent_level + adjustment, 0, undefined), this.line_index, this.column_index);
	}


	get title_length() {
		return this.title.length
	}

	get title_column() {
		if (!this.title_span_left) {
			return null;
		}
		const indention_mode = this.owner.indention_mode ?? DEFAULT_INDENTION_MODE;
		const indention_width = this.owner.indention_width ?? DEFAULT_INDENTION_WIDTH;

		switch (indention_mode) {
			case INDENTION_MODE.TABULATORS:
				return (this.column_index ?? 0) + this.title_span_left * indention_width;

			case INDENTION_MODE.SPACES:
				return (this.column_index ?? 0) + this.title_span_left;
		}
	}


	reindented_full_line(adjustment) {
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

export class Line_With_Adjusted_Indent {
	constructor(original, adjustment=0) {
		Object.assign(this, { original, adjustment });
	}

	get span_left() {
		return this.original.span_left;
	}

	get span_right() {
		return this.original.span_right;
	}


	get line_index() {
		return this.original.line_index;
	}

	get column_index() {
		return this.original.column_index;
	}


	get full_line() {
		return this.original.reindented_full_line(this.adjustment);
	}

	get title() {
		return this.original.title;
	}

	get title_length() {
		return this.original.title_length;
	}

	get title_column() {
		if (!this.original.title_span_left) {
			return null;
		}
		const indention_mode = this.original.owner.indention_mode ?? DEFAULT_INDENTION_MODE;
		const indention_width = this.original.owner.indention_width ?? DEFAULT_INDENTION_WIDTH;


		switch (indention_mode) {
			case INDENTION_MODE.TABULATORS:
				return clamped_adjustment((this.column_index ?? 0) + this.original.title_span_left * indention_width + this.adjustment * indention_width, 0, undefined);

			case INDENTION_MODE.SPACES:
				return clamped_adjustment((this.column_index ?? 0) + this.original.title_span_left + this.adjustment * indention_width, 0, undefined);
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
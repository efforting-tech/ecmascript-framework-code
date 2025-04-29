import { inspect } from 'util';
import { create_head, get_line_components, clamped_adjustment, DEFAULT_INDENTION_MODE, DEFAULT_INDENTION_WIDTH, INDENTION_MODE } from './common.js';
import * as String_List from './string-list.js';

//TODO - maybe disallow title = null and have a has_title or something property

export class Line {
	constructor(owner, span_left, span_right, line_index=undefined, column_index=undefined) {
		Object.assign(this, { owner, span_left, span_right, line_index, column_index });
	}

	static from_span(owner, span_left, span_right, line_index=undefined, column_index=undefined) {
		const result = new this(owner, span_left, span_right, line_index, column_index);
		const [head, title, tail] = get_line_components(result.full_line, owner.indention_mode, owner.indention_width);
		result.title_span_left = head.length;
		result.title_span_right = tail.length;

		return result;
	}

	indented_copy(adjustment=0) {
		return new String_List.Line(this.owner, create_head(clamped_adjustment(this.indent_level + adjustment, 0, undefined)), this.title ?? '', this.tail, this.line_index, this.column_index);
	}

	get full_line() {
		return this.owner.source.slice(this.span_left, this.span_right);
	}

	get title() {
		const title = this.owner.source.slice(this.span_left + this.title_span_left, this.span_right - this.title_span_right);
		if (title.length) {
			return title;
		} else {
			return null;
		}
	}

	get head() {
		return this.owner.source.slice(this.span_left, this.span_left + this.title_span_left);
	}

	get tail() {
		return this.owner.source.slice(this.span_right - this.title_span_right, this.span_right);
	}

	get indent_level() {
		//TODO -  move/use utils instead
		if (!this.title_span_left) {
			return null;
		}
		const indention_mode = this.owner.indention_mode ?? DEFAULT_INDENTION_MODE;
		const indention_width = this.owner.indention_width ?? DEFAULT_INDENTION_WIDTH;

		switch (indention_mode) {
			case INDENTION_MODE.TABULATORS:
				return this.title_span_left;

			case INDENTION_MODE.SPACES:
				//Note - there might be places where wi blindly trust title_span_left for indention, but if we have 10 space with indention width 4 we should have 2 levels and then 2 spaces in the title - this is not how we currently do it.
				return Math.floor(this.title_span_left / indention_width);
		}

	}

	get title_length() {
		return (this.span_right - this.title_span_right) - (this.span_left + this.title_span_left);
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


/*export class Line_With_Adjusted_Indent {
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
*/


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
			const span_left = match.index;
			const span_right = match.index + match[0].length;

			if (span_left >= text.length) {	//This can happen if we lack a trailing \n - we get a null match outside the string
				break;
			}

			lines.push(Line.from_span(result, span_left, span_right, line_index, column_index));
			line_index += 1;
			column_index = 0;
		}

		return result;
	}
}
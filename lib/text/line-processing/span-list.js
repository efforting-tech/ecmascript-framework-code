import { LIBRARY_DEFAULT } from '../format.js';
import * as String_List from './string-list.js';
import * as log from '../../debug/console.js';

//NOTE - column_index is not the same as visual_column which depends on tab settings

export class Line {
	constructor(owner, head_span, title_span, tail_span, line_index=undefined, column_index=undefined) {
		Object.assign(this, { owner, head_span, title_span, tail_span, line_index, column_index });
	}

	static from_line_span(owner, span, line_index=undefined, column_index=undefined) {
		return new this(owner, ...owner.text_format.to_component_spans(owner.source, span), line_index, column_index);
	}


	copy_trimmed(line_left=0, line_right=0) {
		const { owner, head_span, title_span, tail_span, line_index, column_index } = this;
		let [[h1, h2], [ti1, ti2], [ta1, ta2]] = [head_span, title_span, tail_span];

		if (h2 !== ti1 || ti2 !== ta1) {
			throw new Error('holes in spans');
		}

		let hl = h2 - h1;
		let til = ti2 - ti1;
		let tal = ta2 - ta1;
		let column_index_offset = 0;

		if (hl < 0 || til < 0 || tal < 0) {
			throw new Error('negative span lengths');
		}

		let to_remove = line_left;

		let local_remove = Math.min(hl, to_remove);
		hl -= local_remove; to_remove -= local_remove;
		h1 += local_remove; column_index_offset += local_remove;

		local_remove = Math.min(til, to_remove);
		til -= local_remove; to_remove -= local_remove;
		ti1 += local_remove; column_index_offset += local_remove

		local_remove = Math.min(tal, to_remove);
		tal -= local_remove; to_remove -= local_remove;
		ta1 += local_remove; column_index_offset += local_remove
		//console.log('remaining left to_remove', to_remove, 'column_index_offset', column_index_offset);

		to_remove = line_right;
		local_remove = Math.min(tal, to_remove);
		tal -= local_remove; to_remove -= local_remove;
		ta2 -= local_remove;

		local_remove = Math.min(til, to_remove);
		til -= local_remove; to_remove -= local_remove;
		ti2 -= local_remove;

		local_remove = Math.min(hl, to_remove);
		hl -= local_remove; to_remove -= local_remove;
		h2 -= local_remove;

		//console.log('remaining right to_remove', to_remove);
		return new this.constructor(owner, [h1, h2], [ti1, ti2], [ta1, ta2], line_index, column_index + column_index_offset);
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

	get head_and_title_span() {
		return [this.head_span[0], this.title_span[1]];
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

	copy() {
		return new this.constructor(this.source, this.lines, this.text_format);
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
		return this.map(line => line.head_and_title).join(this.text_format.line_endings.unambiguous_line_ending);
	}

	get first_line_index() {
		return this.lines[0].line_index;
	}

	slice(left=undefined, right=undefined) {
		return new this.constructor(this.source, this.lines.slice(left, right), this.text_format);
	}

	absolute_slice(left=undefined, right=undefined) {
		return new this.constructor(this.source, this.lines.slice(left - this.first_line_index, right - this.first_line_index), this.text_format);
	}

	get span() {
		return [this.lines.at(0).head_span[0], this.lines.at(-1).tail_span[1]];
	}

	*[Symbol.iterator] () {
		yield* this.lines;
	}

	map(func) {	//TODO - reuse pattern for iterable things
		return [...this].map(func);
	}
}
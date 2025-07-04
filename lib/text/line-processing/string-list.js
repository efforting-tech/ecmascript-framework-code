import { LIBRARY_DEFAULT } from '../format.js';
import { clamped_scalar } from '../../data/scalars.js';
import { inspect } from 'util';

export class Line {
	constructor(owner, head, title, tail, line_index=undefined, column_index=undefined) {
		Object.assign(this, { owner, head, title, tail, line_index, column_index });
	}

	static from_string(owner, value, line_index=undefined, column_index=undefined) {
		return new this(owner, ...owner.text_format.to_components(value), line_index, column_index);
	}

	get indent_level() {
		if (this.title_length > 0) {
			return this.owner.text_format.indention_mode.get_level_from_head(this.head);
		} else {
			return undefined;
		}
	}

	get head_and_title() {
		return this.head + this.title;
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


	//TODO
/*	indented_copy(adjustment=0) {
		const lines = this.lines.map(line => line.indented_copy(adjustment));
		const copy = new this.constructor(undefined, lines, this.text_format);
		return copy;
	}
*/

	//TODO - common implementation?
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

		for (const components of text_format.iter_components(text)) {
			lines.push(new Line(result, ...components, line_index, column_index));
			line_index++;
			column_index = 0;
		}

		return result;
	}
}
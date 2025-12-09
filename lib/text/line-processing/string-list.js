import { LIBRARY_DEFAULT } from '../format.js';
import { clamped_scalar } from '../../data/scalars.js';
import { inspect } from 'util';
import { Abstract_View } from './common.js';

export class Line {
	constructor(owner, head, title, tail, line_index=undefined, column_index=undefined) {
		Object.assign(this, { owner, head, title, tail, line_index, column_index });
	}

	static from_string(owner, value, line_index=undefined, column_index=undefined) {
		return new this(owner, ...owner.text_format.to_components(value), line_index, column_index);
	}

	reindented_value(adjustment=0) {
		const adjusted_head = this.owner.text_format.indention_mode.create_adjusted_head(this.head, adjustment);
		return adjusted_head + this.title + this.tail;
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


export class View extends Abstract_View {
	constructor(source, lines, text_format=LIBRARY_DEFAULT) {
		super();
		Object.assign(this, { source, lines, text_format });
	}


	insert_line(position, line) {
		this.lines.splice(position, 0, Line.from_string(this, line));
	}

	minimally_indented_copy() {
		const min_level = this.get_minimum_indent_level();
		return this.reindented_copy(-min_level);
	}

	reindented_copy(adjustment=0) {
		const string_list = new this.constructor(this, [], this.text_format);

		for (const line of this.lines) {
			const reindented_line = line.reindented_value(adjustment);
			string_list.lines.push(Line.from_string(string_list, reindented_line, line.line_index, line.column_index));
		}

		return string_list;

	}

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

	copy_with_trimmed_title_prefix(prefix_length) {
		const [first, ...rest] = this;
		const new_lines = [
			first.head + first.title.slice(prefix_length) + first.tail,
			...rest.map(line => line.full_line)
		];

		const new_view = this.constructor.from_lines(this.source, new_lines, first.line_index, first.column_index + first.head.length + prefix_length, this.text_format);
		return new_view;
	}

	copy_with_new_title(new_title, column_adjustment=0) {
		const [first, ...rest] = this;
		const new_lines = [
			first.head + new_title + first.tail,
			...rest.map(line => line.full_line)
		];
		const new_view = this.constructor.from_lines(this.source, new_lines, first.line_index, first.column_index + column_adjustment, this.text_format);
		return new_view;
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

	static from_lines(source, lines, first_line_index=0, first_column_index=0, text_format=LIBRARY_DEFAULT) {
		let column_index = first_column_index;
		let line_index = first_line_index;

		const target_lines = [];
		const result = new this(source, target_lines, text_format);

		for (const line of lines) {
			target_lines.push(Line.from_string(result, line, line_index, column_index));
			line_index++;
			column_index = 0;
		}

		return result;

	}


	absolute_slice(left=undefined, right=undefined) {
		return new this.constructor(this.source, this.lines.slice(left - this.first_line_index, right - this.first_line_index), this.text_format);
	}



	//TODO - harmonize with span-list.js

	get first_line_index() {
		return this.lines[0].line_index;
	}

	to_text() {
		return this.map(line => line.head_and_title).join(this.text_format.line_endings.unambiguous_line_ending);
	}


	*[Symbol.iterator] () {
		yield* this.lines;
	}

	map(func) {	//TODO - reuse pattern for iterable things
		return [...this].map(func);
	}

	filter(func) {	//TODO - reuse pattern for iterable things
		return [...this].filter(func);
	}

}


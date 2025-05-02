import * as log from '../debug/console.js';
import * as Span_List from './line-processing/span-list.js';
import * as String_List from './line-processing/string-list.js';
import { LIBRARY_DEFAULT } from './format.js';

//TODO move to proper place
class Span_Base {
	constructor(left=undefined, right=undefined) {
		Object.assign(this, { left, right });
	}

	clear() {
		this.left = undefined;
		this.right = undefined;
	}

	get defined() {
		return this.left !== undefined && this.right !== undefined;
	}

	to_list() {
		return [this.left, this.right];
	}

	*[Symbol.iterator]() {
		yield this.left;
		yield this.right;
	}

	incorporate(index) {
		if (!this.defined) {
			this.left = index;
			this.right = index;
		} else if (this.is_left_adjacent(index)) {
			this.left = index;
		} else if (this.is_right_adjacent(index)) {
			this.right = index;
		} else {
			throw new Error(`Holes not allowed in ${this.constructor.name}`);
		}
	}

	is_left_adjacent(index) {
		return (index !== undefined) && (this.left === index + 1);
	}

	is_right_adjacent(index) {
		return (index !== undefined) && (this.right === index - 1);
	}

	convert(target_constructor) {
		if (!this.defined) {
			return new target_constructor();
		}

		const result = new target_constructor(this.left, this.right);

		if (this.left_open && !result.left_open) {
			result.left++;
		} else if (!this.left_open && result.left_open) {
			result.left--;
		}

		if (this.right_open && !result.right_open) {
			result.right--;
		} else if (!this.right_open && result.right_open) {
			result.right++;
		}

		return result;

	}

}

class Span_Closed extends Span_Base {

	get left_open() {
		return false;
	}

	get right_open() {
		return false;
	}

	get length() {
		if (this.defined) {
			return this.right - this.left + 1;
		} else {
			return undefined;
		}
	}

	includes(index) {
		return (this.defined && (index >= this.left) && (index <= this.right));
	}

}

class Span_Open extends Span_Base {
	get left_open() {
		return true;
	}

	get right_open() {
		return true;
	}

	get length() {
		if (this.defined) {
			return this.right - this.left - 1;
		} else {
			return undefined;
		}
	}

	includes(index) {
		return (this.defined && (index > this.left) && (index < this.right));
	}

}

class Span_Half_Open extends Span_Base {
	get length() {
		if (this.defined) {
			return this.right - this.left;
		} else {
			return undefined;
		}
	}
}

class Span_Left_Open extends Span_Half_Open {

	get left_open() {
		return true;
	}

	get right_open() {
		return false;
	}


	includes(index) {
		return (this.defined && (index > this.left) && (index <= this.right));
	}
};

//Right Open is useful for slice()
class Span_Right_Open extends Span_Half_Open {
	get left_open() {
		return false;
	}

	get right_open() {
		return true;
	}

	includes(index) {
		return (this.defined && (index >= this.left) && (index < this.right));
	}
};



export const DEFAULT_TREE_SETTINGS = {
	emit_untitled: false,
	text_format: LIBRARY_DEFAULT,
};

export class Node {
	constructor (owner, settings=DEFAULT_TREE_SETTINGS) {
		Object.assign(this, { owner, settings });
	}

	static from_string(string, first_line_index=0, first_column_index=0, settings=DEFAULT_TREE_SETTINGS) {
		return new this(Span_List.View.from_string(string, first_line_index=0, first_column_index=0, settings.text_format), settings);
	}

	static from_line_span(view, line_span, settings=DEFAULT_TREE_SETTINGS) {
		console.log(view);
		//console.log(new view.constructor(view.owner ) );
		process.exit(2);
	}


	get title() {
		return this.owner.lines[0]?.title;
	}

/*


	static from_lines(lines, settings=DEFAULT_TREE_SETTINGS) {
		return new this(Line_View.from_lines(lines, settings.line_view_settings), settings);
	}

	static from_title_and_body(title, body, settings=DEFAULT_TREE_SETTINGS) {
		throw new Error('Not implemented');	// TODO
	}

	to_string(settings=null) {
		return this.line_view.to_string(settings || this.settings.line_view_settings);
	}


	set title(value) {
		const line = this.line_view.lines[0];
		if (line !== undefined) {
			line.text = value ?? '';
		} else {
			throw Error("Can't set title of empty line_view");
		}
	}


	trim_trailing_blank_lines() {
		const lines = this.line_view.lines;
		let last_line_with_content;
		for (let i=lines.length-1; i>=0; i--) {
			if (lines[i].text.length) {
				last_line_with_content = i;
				break;
			}
		}

		if (last_line_with_content !== undefined) {
			const trimmed_lines = lines.length - last_line_with_content - 1;
			lines.splice(last_line_with_content + 1);
			return trimmed_lines;
		} else {
			return 0;
		}

	}


	copy(title=undefined, body=undefined) {
		if (body !== undefined) {
			throw new Error('not implemented');	//TODO
		}

		const new_line_view = this.line_view.copy();
		const result = new this.constructor(new_line_view, this.settings);

		if (title !== undefined) {
			result.title = title;
		}

		return result;

	}

*/

	get is_untitled() {
		const lines = this.owner.lines;
		return ((lines.length === 0) || (lines[0].title.length === 0));
	}

	slice(left, right=undefined) {
		const sliced_view = new this.owner.constructor(this.owner.source, this.owner.lines.slice(left, right), this.owner.text_format);
		return new this.constructor(sliced_view, this.settings);
	}


	get body() {

		//BUG - I think this is broken - make proper tests
		let first_level = null;
		const pending = new Span_Closed();

		for (const line of this.owner.lines.slice(1)) {
			if (line.title.length) {
				if (first_level === null) {
					first_level = line.indent_level;
				} else if (line.indent_level < first_level) {
					break;
				}
			}
			pending.incorporate(line.line_index);
		}

		return this.slice(...pending.convert(Span_Right_Open));
	}



	*iter_nodes() {
		//BUG - This might be broken - make proper tests
		const min_level = this.owner.get_minimum_indent_level();
		let current_span = new Span_Closed();
		for (const line of this.owner.lines) {
			if (line.indent_level === min_level) {
				if (current_span.length) {
					if (this.settings.emit_untitled || !this.is_untitled) {
						yield this.slice(...current_span.convert(Span_Right_Open));
					}
					current_span.clear();
				}

			}
			current_span.incorporate(line.line_index);
		}

		if (current_span.length) {
			yield this.slice(...current_span.convert(Span_Right_Open));
		}
	}
}
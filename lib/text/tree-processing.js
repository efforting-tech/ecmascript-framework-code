import * as log from '../debug/console.js';
import * as Span_List from './line-processing/span-list.js';
import * as String_List from './line-processing/string-list.js';
import { LIBRARY_DEFAULT } from './format.js';
import { Span_Closed, Span_Right_Open } from '../math/span.js';

//BUG - The current bugs are probably because we do multiple slicing of a line list, causing line_index to go nuts.
//		I think we should define a view object that looks into the span-list or string-list (keeping track of start)


function assign_parent(item, parent) {
	item.parent = parent;
	return item;
}


export const DEFAULT_TREE_SETTINGS = {
//	emit_untitled: false,	//TBD: This was removed because I wanted the responsibilities of node iteration more clear and focused. Might add some higher level walk instead with this. But then it might be a parameter.
	text_format: LIBRARY_DEFAULT,
};

export class Node {
	constructor (owner, settings=DEFAULT_TREE_SETTINGS, parent=undefined) {
		Object.assign(this, { owner, settings, parent });
	}

	static from_string(string, first_line_index=0, first_column_index=0, settings=DEFAULT_TREE_SETTINGS) {
		return new this(Span_List.View.from_string(string, first_line_index=0, first_column_index=0, settings.text_format), settings);
	}

	static from_line_span(view, line_span, settings=DEFAULT_TREE_SETTINGS) {
		console.log(view);
		//console.log(new view.constructor(view.owner ) );
		process.exit(2);
	}

	get_minimum_indent_level() {
		return this.owner.get_minimum_indent_level();
	}

	absolute_slice(left=undefined, right=undefined) {
		return new this.constructor(this.owner.absolute_slice(left, right), this.settings);
	}

	slice(left=undefined, right=undefined) {
		return new this.constructor(this.owner.slice(left, right), this.settings);
	}

	get title() {
		return this.owner.lines[0]?.title;
	}

	get indent_level() {
		return this.owner.lines[0]?.indent_level;
	}

	get indent_offset() {
		//How many levels extra deep we are with respect to the ideal tree structure
		return this.indent_level - this.parent.indent_level - 1;
	}

	to_text() {
		return this.owner.to_text();
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


*/


	set title(value) {
		const line = this.owner.lines[0];
		if (line !== undefined) {
			line.text = value ?? '';
		} else {
			throw Error("Can't set title of empty line_view");
		}
	}



	copy(title=undefined, body=undefined) {
		if (body !== undefined) {
			throw new Error('not implemented');	//TODO
		}

		const new_owner = this.owner.copy();
		const result = new this.constructor(new_owner, this.settings, this.parent);

		if (title !== undefined) {
			result.title = title;
		}

		return result;

	}



	get is_untitled() {
		const lines = this.owner.lines;
		return ((lines.length === 0) || (lines[0].title.length === 0));
	}


	get body() {
		let first_level = undefined;
		const pending = new Span_Closed();

		for (const line of this.owner) {
			if (line.title.length) {
				if (first_level === undefined) {
					first_level = line.indent_level;
				} else if (line.indent_level <= first_level) {
					break;
				} else if (first_level !== undefined) {
					pending.extend_to(line.line_index);
				}
			} else if (first_level !== undefined) {
				pending.extend_to(line.line_index);
			}
		}

		return assign_parent(this.absolute_slice(...pending.convert(Span_Right_Open)), this);
	}

	get root() {
		if (this.parent) {
			return this.parent.root;
		} else {
			return this;
		}
	}

	get lines() {
		return this.owner.lines;
	}

	get span() {
		return this.owner.span;
	}

	get source() {
		return this.owner.source;
	}

	*iter_valid_nodes() {	//TODO - maybe we should have a filter function with requirements
		for (const sub_node of this) {
			if (sub_node.title?.trim()) {
				yield sub_node;
			}
		}
	}

	*[Symbol.iterator] () {
		const min_level = this.get_minimum_indent_level();
		const current_span = new Span_Closed();
		for (const line of this.owner) {
			if (line.indent_level === min_level) {
				if (current_span.length) {	//not undefined and not 0
					yield assign_parent(this.absolute_slice(...current_span.convert(Span_Right_Open)), this.parent);
				}
				current_span.clear();
			}
			current_span.incorporate(line.line_index);
		}

		if (current_span.length) {	//not undefined and not 0
			yield assign_parent(this.absolute_slice(...current_span.convert(Span_Right_Open)), this.parent);
		}

	}
}
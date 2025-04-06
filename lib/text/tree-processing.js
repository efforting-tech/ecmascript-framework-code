import { Line_View, DEFAULT_LINE_VIEW_SETTINGS } from './line-processing.js';


export const DEFAULT_TREE_SETTINGS = {
	emit_untitled: false,
	line_view_settings: DEFAULT_LINE_VIEW_SETTINGS,
};

export class Node {
	constructor (line_view, settings=DEFAULT_TREE_SETTINGS) {
		Object.assign(this, { line_view, settings });
	}


	static from_string(string, settings=DEFAULT_TREE_SETTINGS) {
		return new this(Line_View.from_string(string, settings.line_view_settings), settings);
	}

	static from_lines(lines, settings=DEFAULT_TREE_SETTINGS) {
		return new this(Line_View.from_lines(lines, settings.line_view_settings), settings);
	}

	static from_title_and_body(title, body, settings=DEFAULT_TREE_SETTINGS) {
		throw new Error('Not implemented');	// TODO
	}

	get title() {
		return this.line_view.lines[0]?.text;
	}

	set title(value) {
		const line = this.line_view.lines[0];
		if (line !== undefined) {
			line.text = value ?? '';
		} else {
			throw Error("Can't set title of empty line_view");
		}
	}

	get body() {

		let first_level = null;
		const pending = [];

		for (const line of this.line_view.lines.slice(1)) {
			if (line.text.length) {
				if (first_level === null) {
					first_level = line.level;
				} else if (line.level < first_level) {
					break;
				}
			}
			pending.push(line);
		}

		return Node.from_lines(pending, this.settings);

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

	is_untitled() {
		const lines = this.line_view.lines;
		return ((lines.length === 0) || (lines[0].text.length === 0));
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

	*iter_nodes() {
		const min_level = this.line_view.get_minimum_indent_level();
		let pending = [];

		for (const line of this.line_view.lines) {
			if (line.level === min_level) {
				if (pending.length) {
					if (this.settings.emit_untitled || !this.is_untitled()) {
						yield Node.from_lines(pending, this.settings);
					}
					pending = [];
				}

			}
			pending.push(line);
		}

		if (pending.length) {
			yield Node.from_lines(pending, this.settings);
		}

	}

}
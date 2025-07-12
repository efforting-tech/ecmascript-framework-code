import * as String_List from './line-processing/string-list.js';

import { TRINARY_OPTION } from '../data/definitions.js';
import { Enum_get, Enum } from '../enum.js';


//Maybe move this one out to line-processing
const LINE_LEVEL = new Enum('LINE_LEVEL', {
	NONE: 0,
	HEAD: 1,
	TITLE: 2,
	TAIL: 3,
});


export class Text_Writer {
	constructor(view=new String_List.View(null, []), current_indent_level=0) {
		Object.assign(this, { view, current_indent_level });
	}

	get last_line() {
		return this.view.lines.at(-1);
	}

	_push_line(head, title, tail) {
		this.view.lines.push(new String_List.Line(this.view, head, title, tail));
	}

	_get_line_level(head, title, tail) {
		if (tail.length > 0) {
			return LINE_LEVEL.TAIL;
		} else if (title.length > 0) {
			return LINE_LEVEL.TITLE;
		} else if (head.length > 0) {
			return LINE_LEVEL.HEAD;
		} else {
			return LINE_LEVEL.NONE;
		}
	}

	write(text) {	//BUG - we are collating tails, that's not right
		const TF = this.view.text_format;
		for (const [head, title, tail] of TF.iter_components(text)) {

			if (head.length === 0 && title.length === 0 && tail.length === 0) {
				continue;	//This is a NOP
			}

			const last_line = this.last_line;

			if (last_line) {
				const last_level = this._get_line_level(last_line.head, last_line.title, last_line.tail);
				const this_level = this._get_line_level(head, title, tail);

				// We can remove all this_level === 0 because of the NOP condition above
				if (last_level === 3) {
					this._push_line(head, title, tail);
				} else if (last_level == 2) {
					last_line.title += head + title;
					last_line.tail += tail;
				} else if (last_level <= 1) {
					last_line.head += head;
					last_line.title += title;
					last_line.tail += tail;
				} else {
					throw new Error('internal error');
				}

			} else {
				this._push_line(head, title, tail);
			}
		}
	}

	write_full_block(text) {	//Like write_block but will close any previous lines and trim the end of the block we are writing
		const last_line = this.last_line;
		const TF = this.view.text_format;
		const N = TF.line_endings.unambiguous_line_ending;
		if (last_line) {
			if (last_line.tail.length == 0) {
				last_line.tail += N;
			}
		}
		this.write_block(text.trimRight());
	}

	write_block(text) {	//Like write but aligns new lines with current_indent_level
		const TF = this.view.text_format;
		const head_prefix = TF.indention_mode.get_head(this.current_indent_level);

		for (const [in_head, title, tail] of TF.iter_components(text)) {
			const head = head_prefix + in_head;

			if (head.length === 0 && title.length === 0 && tail.length === 0) {
				continue;	//This is a NOP
			}

			const last_line = this.last_line;

			if (last_line) {
				const last_level = this._get_line_level(last_line.head, last_line.title, last_line.tail);
				const this_level = this._get_line_level(head, title, tail);

				// We can remove all this_level === 0 because of the NOP condition above
				if (last_level === 3) {	// Previous line is closed
					this._push_line(head, title, tail);
				} else if (last_level == 2) {	// Previous line is not closed, we add both head and title to title
					last_line.title += head + title;
					last_line.tail += tail;
				} else if (last_level <= 1) {	// Previous line is at most indented
					last_line.head += head;
					last_line.title += title;
					last_line.tail += tail;
				} else {
					throw new Error('internal error');
				}

			} else {
				this._push_line(head, title, tail);
			}
		}
	}


	/* TODO: implement
	write_line(line, newline=TRINARY_OPTION.YES, terminate_previous_line=TRINARY_OPTION.AUTO) {

		const TF = this.view.text_format;
		for (const [head, title, tail] of TF.iter_components(line)) {
			const last_line = this.last_line;
			const had_line = last_line !== undefined;
			const had_newline = had_line && (last_line.tail.length > 0);

			const has_title = title.length > 0;
			const has_newline = tail.length > 0;

			console.log([head, title, tail, had_line, had_newline, has_title, has_newline]);
		}


		/*


		const N = LE.unambiguous_line_ending;

		for (let pending_line of LE.split_lines(line)) {
			const tnl = Enum_get(TRINARY_OPTION, newline);
			const tpl = Enum_get(TRINARY_OPTION, terminate_previous_line);

			switch (tnl) {
				case TRINARY_OPTION.YES:
					pending_line += N;
					break;

				case TRINARY_OPTION.NO:
					break;
				case TRINARY_OPTION.AUTO:
					if (pending_line.trimLeft().length > 0) {
						pending_line += N;
					}
					break;
			}

			if (this.last_line) {
				if (this.last_line.tail.length > 0) {
					switch (tpl) {
						case TRINARY_OPTION.YES:
							this._push_line();
							break;
						case TRINARY_OPTION.AUTO:
						case TRINARY_OPTION.NO:
							break;
					}
					this._push_line(pending_line);
				} else {
					switch (tpl) {
						case TRINARY_OPTION.YES:
						case TRINARY_OPTION.AUTO:
							this.last_line.tail += N;
							this._push_line(pending_line);
							break;
						case TRINARY_OPTION.NO:
							this.last_line.tail += pending_line;
							break;
					}

				}
			} else {
				this._push_line(pending_line);
			}

		}

	}
	*/
}
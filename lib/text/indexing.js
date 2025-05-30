export class Line_Span {
	constructor(start, end) {
		Object.assign(this, { start, end });
	}

	contains(index) {
		return this.start <= index && index <= this.end;
	}

	slice(text) {
		return text.slice(this.start, this.end);
	}

}




export class Line_Column_Indexer {
	// Note: This could be improved with both incremental and binned approaches but for now we start simple by computing the entire table once but lazily

	constructor(source, start_index=0, tab_width=4) {
		const _line_list = null;
		Object.assign(this, { source, start_index, tab_width, _line_list });
	}

	get line_list() {
		if (!this._line_list) {
			this._line_list = [];
			// Create line list

			for (const match of this.source.matchAll(/^.*$/gm)) {
				this._line_list.push(new Line_Span(match.index, match.index + match[0].length));
			}

		}
		return this._line_list;
	}

	get_visual_column(span, index) {
		let column_index = 0;	//We will work in zero based columns but return 1 based (since this is for visual column)
		let character_index = span.start;

		const line = span.slice(this.source);
		for (const char of line) {
			if (char == '\t') {
				column_index = (Math.floor(column_index / this.tab_width) + 1) * this.tab_width;
			} else {
				column_index++;
			}

			if (character_index++ == index) {
				return column_index;
			}
		}
	}

	get_line_and_visual_col_at_index(index) {
		let line_index = this.start_index;
		for (const span of this.line_list) {
			if (span.contains(index)) {
				return [line_index, this.get_visual_column(span, index)];
			}
			line_index++;
		}
	}


	get_line_and_span_at_index(index) {
		let line_index = this.start_index;
		for (const span of this.line_list) {
			if (span.contains(index)) {
				return [line_index, span];
			}
			line_index++;
		}
	}

}

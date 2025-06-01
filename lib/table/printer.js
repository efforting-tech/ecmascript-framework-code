export class Table_Printer {
	constructor(top_format = null, header_format = null, sep_format = null, body_format = null, bottom_format = null, cell_format=String) {
		this.top_format = top_format;
		this.header_format = header_format;
		this.sep_format = sep_format;
		this.body_format = body_format;
		this.bottom_format = bottom_format;
		this.cell_format = cell_format;
	}

	_calc_col_widths(table) {
		const num_cols = table[0].length;
		return Array.from({ length: num_cols }, (_, col_index) =>
			Math.max(...table.map(row => this.cell_format(row[col_index]).length))
		);
	}

	_format_row(row, col_widths, format) {
		const [left, , middle, right] = format;
		const line = row.map((cell, i) =>
			this.cell_format(cell).padEnd(col_widths[i])
		).join(middle);
		return left + line + right;
	}

	_print_separator(col_widths, format) {
		const [left, fill, middle, right] = format;
		const line = col_widths.map(w => fill.repeat(w)).join(middle);
		console.log(left + line + right);
	}

	print(table) {
		const col_widths = this._calc_col_widths(table);
		const [header, ...rows] = table;

		if (this.top_format) {
			this._print_separator(col_widths, this.top_format);
		}

		if (this.header_format) {
			console.log(this._format_row(header, col_widths, this.header_format));
		}

		if (this.sep_format) {
			this._print_separator(col_widths, this.sep_format);
		}

		if (this.body_format) {
			for (const row of rows) {
				console.log(this._format_row(row, col_widths, this.body_format));
			}
		}

		if (this.bottom_format) {
			this._print_separator(col_widths, this.bottom_format);
		}
	}
}

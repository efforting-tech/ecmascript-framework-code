import * as SIC from '../data/simple-conditions.js';

export class Reference {
	constructor(name) {
		Object.assign(this, { name });
	}
}

export class Lambda_Object_Mapping {
	constructor(source, dest) {
		Object.assign(this, { source, dest });
	}


	create_view(table, name) {

		const src_numeric = (typeof this.source === 'number') || (typeof this.source === 'bigint');
		const dest_numeric = (typeof this.dest === 'number') || (typeof this.dest === 'bigint');

		const src_string = (!src_numeric) && (typeof this.source === 'string');
		const dest_string = (!dest_numeric) && (typeof this.dest === 'string');

		const src_id = src_string && table.column_indices[this.source];
		const dest_id = dest_string && table.column_indices[this.dest];


		//const dest_id = table.column_indices[this.dest];
		const lut = {};
		for (const row of table.rows) {

			let row_object = null;
			function get_row_object() {
				if (row_object) {
					return row_object;
				} else {
					row_object = table.row_to_row_object(row);
					return row_object;
				}
			}

			let key, value;

			if (src_numeric) {
				key = row[this.source];
			} else if (src_string) {
				key = row[src_id];
			} else {	// Assume function that wants an object that represents a row
				key = this.source(get_row_object());
			}

			if (dest_numeric) {
				value = row[this.dest];
			} else if (dest_string) {
				value = row[dest_id];
			} else {	// Assume function that wants an object that represents a row
				value = this.dest(get_row_object());
			}

			lut[key] = value;
		}
		return lut;
	}
}

export class Simple_Mapping {
	constructor(source, dest) {
		Object.assign(this, { source, dest });
	}

	create_view(table, name) {
		const src_id = table.column_indices[this.source];
		const dest_id = table.column_indices[this.dest];
		const lut = {};
		for (const row of table.rows) {
			lut[row[src_id]] = row[dest_id];
		}
		return lut;
	}
}

export class Multi_View_Table {
	constructor(rows=[], columns=[], view_factories={}) {
		const column_indices = {};
		const views = {};

		for (let index=0; index<columns.length; index++) {
			column_indices[columns[index]] = index;
		}

		Object.assign(this, { rows, columns, column_indices, views, view_factories });
	}

	row_to_row_object(row) {
		const columns = this.columns;
		const result = {};
		for (let index=0; index<columns.length; index++) {
			result[columns[index]] = row[index];
		}
		return result;
	}

	get_view(name) {
		const view = this.views[name];
		if (view) {
			return view;
		} else {
			const new_view = this.views[name] = this.view_factories[name].create_view(this, name);
			return new_view;
		}
	}

	push(...rows) {
		//TODO - verify columns widths or not this functions responsibility?
		this.rows.push(...rows);
	}

	static merge(first, ...remaining_tables_to_join) {

		const result = new this([...first.rows], [...first.columns], {...first.view_factories});

		for (const table of remaining_tables_to_join) {
			if (!SIC.Array_Equals(table.columns, result.columns)) {
				throw new Error(`Column mismatch - ${result.columns} ≠ ${table.columns}`);
			}
			Object.assign(result.view_factories, table.view_factories);
			result.push(...table.rows);
		}

		return result;
	}

	static from_values(columns_and_values, width, view_factories={}) {
		const resulting_rows = [];
		const columns = columns_and_values.slice(0, width);
		const length = Math.ceil(columns_and_values.length / width) - 1;   //Subtract head, use ceil to detect shorter final row.length
		for (let index=0; index < length; index++) {
			const row = columns_and_values.slice((index + 1) * width, (index + 2) * width);
			if (row.length < width) {
				throw new Error('Wrong number of values');
			}
			resulting_rows.push(row)
		}

		return new this(resulting_rows, columns, view_factories);
	}

	render(entries) {
		return new this.constructor(this.render_rows(entries), [...this.columns], {...this.view_factories});
	}

	render_rows(entries) {
		const result = [];
		for (const row of this.rows) {
			const pending_row = [];
			for (const cell of row) {
				if ((cell instanceof Reference) && (cell.name in entries)) {
					pending_row.push(entries[cell.name]);
				} else {
					pending_row.push(cell);
				}
			}
			result.push(pending_row);
		}
		return result;
	}

}


import * as SIC from '../data/simple-conditions.js';
import { tabs_to_spaces } from '../text/format.js';

export const DUMMY_TRANSLATION = ((value) => value);

const raster_table_pattern = /^[^\S\n]*^((?:[^\S\n]|\w)+)\n((?:[^\S\n]|-)+)\n(.+)/ms
const column_pattern = /\w+/gd
const row_pattern = /^(.+)$/mg

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

export class Grouped_Mapping {
	constructor(source, dest) {
		Object.assign(this, { source, dest });
	}

	create_view(table, name) {
		const src_id = table.column_indices[this.source];
		const dest_id = table.column_indices[this.dest];
		const lut = {};
		for (const row of table.rows) {
			const key = row[src_id];
			const value = row[dest_id];
			if (!lut[key]) lut[key] = [];
			lut[key].push(value);
		}
		return lut;
	}


}

/*
export class LUT_Mapping {
	//HALF BAKED - not sure what I wanted to use this for
	constructor(lut, source) {
		Object.assign(this, { lut, source });
	}

	create_view(table, name) {
		const src_id = table.column_indices[this.source];
		const dest_id = table.column_indices[this.dest];
		const lut = {};


		const keys = new Set(table.rows.map(row => row[src_id].trim()));
		for (const key of table.rows) {

		}
		return lut;
	}
}
*/

export class Multi_View_Table {
	constructor(rows=[], columns=[], view_factories={}) {
		const column_indices = {};
		const views = {};

		for (let index=0; index<columns.length; index++) {
			column_indices[columns[index]] = index;
		}

		Object.assign(this, { rows, columns, column_indices, views, view_factories });
	}

	copy_structure() {	//Copies everything but body
		return new this.constructor([], this.columns, this.view_factories);
	}


	row_to_row_object(row) {
		const columns = this.columns;
		const result = {};
		for (let index=0; index<columns.length; index++) {
			result[columns[index]] = row[index];
		}
		result[Symbol.iterator] = function*() {
			yield* row;
		};

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

	get_column(column) {
		const column_index = typeof column === 'string' ? this.columns.indexOf(column) : column ;
		const result = [];
		for (const row of this.rows) {
			result.push(row[column_index]);
		}
		return result;
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

	static from_raster(raster, tab_width=4) {
		const table = table_from_raster(raster, tab_width);
		return new this(table.rows, table.columns);
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

	render(entries, extra_view_factories={}) {
		return new this.constructor(this.render_rows(entries), [...this.columns], {...this.view_factories, ...extra_view_factories});
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

	write_cell(row_index, col_index, new_value) {
		this.rows[row_index][col_index] = new_value;
	}

	require_cell(row_index, col_index) {
		const result = this.rows[row_index][col_index];
		if (result === undefined) {
			throw new Error('Cell required');
		}
		return result;
	}

	visit_all_cells(callback) {
		for (let row_index = 0; row_index < this.rows.length; row_index++) {
			const row = this.rows[row_index];
			for (let col_index = 0; col_index < row.length; col_index++) {
				const value = row[col_index];
				callback(this, row_index, col_index, value);
			}
		}
	}

	*[Symbol.iterator]() {
		for (const row of this.rows) {
			yield this.row_to_row_object(row);
		}
	}



}





export class Table_Translator {

	//The default translation function simply does no translation
	constructor(get_translation_function=((row_index, col_index) => DUMMY_TRANSLATION)) {
		Object.assign(this, { get_translation_function });
	}

	*walk_cells(table) {
		for (const [row_index, row] of this.walk_rows(table)) {
			for (let col_index=0; col_index<table.columns.length; col_index++) {
				yield [row_index, col_index, row[col_index]];
			}
		}
	}

	*walk_rows(table) {
		for (let row_index=0; row_index<table.rows.length; row_index++) {
			const row = table.rows[row_index];
			yield [row_index, row];
		}
	}



	//TODO walk_columns

	//TODO static common pattern
	//static from_declaration(by_cell, by_row, by_column, fallback, order=[CELL, ROW, COLUMN, FALLBACK])

	translate(table) {	//Translate entire table
		const result = table.copy_structure();

		for (const [row_index, row] of this.walk_rows(table)) {

			const pending_row = [];
			for (let col_index=0; col_index<table.columns.length; col_index++) {
				const cell = row[col_index];
				const translation_function = this.get_translation_function(row_index, col_index);

				pending_row.push(translation_function(cell));
			}
			result.push(pending_row);
		}
		return result;
	}


}



export function table_from_raster(raster, tab_width=4) {
	if (raster.match(/\t/g)) {
		raster = tabs_to_spaces(raster, tab_width);
	}

	const m = raster.match(raster_table_pattern);
	const column_matches = [...m[1].matchAll(column_pattern)];
	const column_indices = [...column_matches.map(cm => cm.indices[0][0])]
	const columns = [...column_matches.map(cm => cm[0])]

	const result = [];

	for (const row of m[3].matchAll(row_pattern)) {

		const pending_row = [];
		for (let ci=0; ci<column_indices.length; ci++) {
			pending_row.push(row[1].slice(column_indices[ci], column_indices[ci+1]));
		}
		result.push(pending_row);
	}

	return {columns, column_indices, rows: result};
}


export function table_as_bijective_map(table, keep_table=true) {
	const [key, value] = table.columns;
	const trim_cell = (value => value.trim());
	const tt = new Table_Translator((row_index, col_index) => trim_cell );
	const intermediary_views = {
		by_key: new Simple_Mapping(key, value),
		by_value: new Simple_Mapping(value, key),
	};

	const mvt = tt.translate(new Multi_View_Table(table.rows, table.columns, intermediary_views))
	const meta = {};
	if (keep_table) {
		meta.table = mvt;
	}

	return {
		...meta,
		[`by_${key}`]: mvt.get_view('by_key'),
		[`by_${value}`]: mvt.get_view('by_value'),
	}
}



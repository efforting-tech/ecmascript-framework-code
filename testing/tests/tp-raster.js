import { Multi_View_Table, Simple_Mapping, Lambda_Object_Mapping, Table_Translator, DUMMY_TRANSLATION, table_from_raster } from '../../lib/table/data-table.js';
import { TP } from './support/pl-debug-output.js';

const T1 = `
	escape		symbol				representation			description
	------		------				--------------			-----------
	0			NULL				\\0						Null character
	n			NEWLINE				\\n						Newline
	r			CARRIAGE_RETURN		\\r						Carriage return
	"			DOUBLE_QUOTE		@double_quote_repr		Double quotation mark
	'			SINGLE_QUOTE		@single_quote_repr		Single quotation mark
`;

const ESCAPE_LUT_VIEWS = {
	symbol_by_escape: new Simple_Mapping('escape', 'symbol'),
	repr_by_symbol: new Simple_Mapping('symbol', 'representation'),
	desc_by_symbol: new Simple_Mapping('symbol', 'description'),
	repr_by_name: new Lambda_Object_Mapping((row) => row.symbol.description, 'representation'),
};


const intermediary = table_from_raster(T1);
const by_column = {
	1: (value => Symbol(value.trim())),
};

const TRIM_CELL = (value => value.trim());
const TD = new Table_Translator((row_index, col_index) => by_column[col_index] ?? TRIM_CELL );
const tbl = TD.translate(new Multi_View_Table(intermediary.rows, intermediary.columns, ESCAPE_LUT_VIEWS));

console.log(tbl.get_view('symbol_by_escape'));
console.log(tbl.get_view('repr_by_name'));

TP.print([tbl.columns, ...tbl.rows]);
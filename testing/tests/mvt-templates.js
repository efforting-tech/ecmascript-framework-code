//This view assume immutable table

import { Multi_View_Table, Simple_Mapping, Lambda_Object_Mapping, Reference } from '../../lib/table/data-table.js';


const ESCAPE_LUT_VIEWS = {
	symbol_by_escape: new Simple_Mapping('escape', 'symbol'),
	repr_by_symbol: new Simple_Mapping('symbol', 'representation'),
	desc_by_symbol: new Simple_Mapping('symbol', 'description'),
	repr_by_name: new Lambda_Object_Mapping((row) => row.symbol.description, 'representation'),
};



const ESCAPE_LUT_TEMPLATE = Multi_View_Table.from_values([
	'escape',	'symbol',					'representation',						'description',
/*  --------    --------                    ----------------						-------------	*/
	'0',		Symbol('NULL'),				'\\0',									'Null character',
	'n',		Symbol('NEWLINE'),			'\\n',									'Newline',
	'r',		Symbol('CARRIAGE_RETURN'),	'\\r',									'Carriage return',
	'"', 		Symbol('DOUBLE_QUOTE'),		new Reference('double_quote_repr'),		'Double quotation mark',
	"'", 		Symbol('SINGLE_QUOTE'),		new Reference('single_quote_repr'),		'Single quotation mark',

], 4, ESCAPE_LUT_VIEWS);



const ESCAPE_LUT_SQ = ESCAPE_LUT_TEMPLATE.render({
	double_quote_repr: '"',
	single_quote_repr: "\\'",
});

const ESCAPE_LUT_DQ = ESCAPE_LUT_TEMPLATE.render({
	double_quote_repr: '\\"',
	single_quote_repr: "'",
});

console.log(ESCAPE_LUT_SQ.get_view('repr_by_name'));
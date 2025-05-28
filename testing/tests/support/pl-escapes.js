import { Multi_View_Table, Simple_Mapping, Lambda_Object_Mapping, Reference } from '../../../lib/table/data-table.js';

const ESCAPE_LUT_VIEWS = {
	symbol_by_escape: new Simple_Mapping('escape', 'symbol'),
	repr_by_symbol: new Simple_Mapping('symbol', 'representation'),
	desc_by_symbol: new Simple_Mapping('symbol', 'description'),
	repr_by_name: new Lambda_Object_Mapping((row) => row.symbol.description, 'representation'),
};

//One potential problem here is that we may want these symbols to be defined in a canonical root somewhere. - or perhaps this is where they live!?
//	This could be the place they live and we may have more tables here for other token types

// To address the above we should utilize Cache_Map like https://github.com/efforting-tech/ecmascript-framework-code/blob/bd1b087b634ef035e1640df84afe0136d82215b2/testing/tests/cm-basic.js#L12


class Escape {
	constructor(escape, symbol, representation, description) {
		Object.assign(this, { escape, symbol, representation, description });
	}
}



const ESCAPE_LUT_TEMPLATE = Multi_View_Table.from_values([
	'escape',	'symbol',					'representation',						'description',
/*  --------    --------                    ----------------						-------------	*/
	'0',		Symbol('NULL'),				'\\0',									'Null character',
	'n',		Symbol('NEWLINE'),			'\\n',									'Newline',
	'r',		Symbol('CARRIAGE_RETURN'),	'\\r',									'Carriage return',
	'"', 		Symbol('DOUBLE_QUOTE'),		new Reference('double_quote_repr'),		'Double quotation mark',
	"'", 		Symbol('SINGLE_QUOTE'),		new Reference('single_quote_repr'),		'Single quotation mark',

], 4, ESCAPE_LUT_VIEWS);


export const ESCAPE_LUT_GENERIC = ESCAPE_LUT_TEMPLATE.render({
	double_quote_repr: '"',
	single_quote_repr: "'",
}, {
	token_by_name: new Lambda_Object_Mapping((row) => row.symbol.description, (row) => new Escape(...row)),
});

export const ESCAPE_LUT_SQ = ESCAPE_LUT_TEMPLATE.render({
	double_quote_repr: '"',
	single_quote_repr: "\\'",
});

export const ESCAPE_LUT_DQ = ESCAPE_LUT_TEMPLATE.render({
	double_quote_repr: '\\"',
	single_quote_repr: "'",
});


export const ESCAPE_TOKEN_LUT = ESCAPE_LUT_GENERIC.get_view('token_by_name');


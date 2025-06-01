import { Multi_View_Table, Table_Translator, DUMMY_TRANSLATION } from '../../lib/table/data-table.js';

const T1 = Multi_View_Table.from_values([
	'escape',	'symbol',				'representation',						'description',
/*  --------    --------                ----------------						-------------	*/
	'0',		'NULL',					'\\0',									'Null character',
	'n',		'NEWLINE',				'\\n',									'Newline',
	'r',		'CARRIAGE_RETURN',		'\\r',									'Carriage return',
	'"', 		'DOUBLE_QUOTE',			'@double_quote_repr',					'Double quotation mark',
	"'", 		'SINGLE_QUOTE',			'@single_quote_repr',					'Single quotation mark',

], 4);




class Abstract_Value {
	constructor (value) {
		this.value = value;
	}
}

class Reference extends Abstract_Value {};
class Literal extends Abstract_Value {};

const by_column = {
	1: Symbol,
	2: (value) => {
		const m = value.match(/@(.*)/);
		if (m) {
			return new Reference(m[0]);
		} else {
			return new Literal(value);
		}
	}
};

const TD = new Table_Translator((row_index, col_index) => by_column[col_index] ?? DUMMY_TRANSLATION );


for (const [row_index, row] of TD.walk_rows(TD.translate(T1))) {
	console.log(row);
}

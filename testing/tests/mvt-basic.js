import { Multi_View_Table, Simple_Mapping, Lambda_Object_Mapping, Reference } from '../../lib/table/data-table.js';

const ESCAPE_LUT_COMMON = Multi_View_Table.from_values([
    'escape',  'symbol',                    'representation',   'description',
/*   ------      ------                      --------------      -----------    */
    '0',        Symbol('NULL'),             '\\0',              'Null character',
    'n',        Symbol('NEWLINE'),          '\\n',              'Newline',
    'r',        Symbol('CARRIAGE_RETURN'),  '\\r',              'Carriage return'
], 4, {
    symbol_by_escape: new Simple_Mapping('escape', 'symbol'),
    repr_by_symbol: new Simple_Mapping('symbol', 'representation'),
    desc_by_symbol: new Simple_Mapping('symbol', 'description'),
});


const symbol_DOUBLE_QUOTE = Symbol('DOUBLE_QUOTE');
const symbol_SINGLE_QUOTE = Symbol('SINGLE_QUOTE');
const desc_DOUBLE_QUOTE = 'Double quotation mark';
const desc_SINGLE_QUOTE = 'Single quotation mark';

const ESCAPE_LUT_SINGLE_QUOTED = Multi_View_Table.from_values([
    'escape',  'symbol',                    'representation',   'description',
/*   ------      ------                      --------------      -----------    */
    '"',        symbol_DOUBLE_QUOTE,        '"',                desc_DOUBLE_QUOTE,
    "'",        symbol_SINGLE_QUOTE,        "\\'",              desc_SINGLE_QUOTE,
], 4);

const ESCAPE_LUT_DOUBLE_QUOTED = Multi_View_Table.from_values([
    'escape',  'symbol',                    'representation',   'description',
/*   ------      ------                      --------------      -----------    */
    '"',        symbol_DOUBLE_QUOTE,        '\\"',              desc_DOUBLE_QUOTE,
    "'",        symbol_SINGLE_QUOTE,        "'",                desc_SINGLE_QUOTE,
], 4);



//console.log(ESCAPE_LUT_COMMON.get_view('desc_by_symbol'));
console.log( Multi_View_Table.merge(ESCAPE_LUT_COMMON, ESCAPE_LUT_SINGLE_QUOTED).get_view('desc_by_symbol'));
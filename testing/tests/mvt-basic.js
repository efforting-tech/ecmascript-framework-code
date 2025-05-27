

//This view assume immutable table
class Simple_Mapping {
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

class Multi_View_Table {
    constructor(rows=[], columns=[], view_factories={}) {
        const column_indices = {};
        const views = {};

        for (let index=0; index<columns.length; index++) {
            column_indices[columns[index]] = index;
        }

        Object.assign(this, { rows, columns, column_indices, views, view_factories });


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
}

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



console.log(ESCAPE_LUT_COMMON.get_view('desc_by_symbol'));
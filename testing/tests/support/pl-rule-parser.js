import { Parser }  from '../../../lib/parsing/generic-parser.js';
import { LINE_INDEX, COLUMN_INDEX }  from './pl-tokenizers.js';


export class Rule_Parser extends Parser {
	constructor(source, rules) {
		super(source, rules);
		Object.assign(this, {
			[LINE_INDEX]: 0,
			[COLUMN_INDEX]: 0,
		});

	}
}

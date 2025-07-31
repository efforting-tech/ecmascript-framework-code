//TODO: The advanced templates are not finished yet - but we don't need them here
//import { Template } from '../templates/types.js';



import { tokenize_block, Advanced_Regex_Tokenizer } from '../parsing/regexp-tokenizer.js';
import * as R from '../data/rules.js';
import * as C from '../data/conditions.js';

//TODO: Move these to some simple template feature location
export class Template {
	constructor(name, contents) {
		Object.assign(this, { name, contents });
	}


	render(context={}) {
		const pieces = [];
		for (const [type, value] of this.contents) {
			switch (type) {
				case TEXT:
					pieces.push(value);
					break;
				case PLACEHOLDER:
					if (!(value in context)) {
						throw new Error(`Missing: ${value}`);
					}
					pieces.push(context[value])
					break;
				default:
					throw new Error('wrong type');
			}
		}
		return pieces.join('');
	}

	create_positional_factory_function() {
		const code_lines = [];
		const placeholders = new Set();

		for (const [type, value] of this.contents) {
			switch (type) {
				case TEXT:
					code_lines.push(JSON.stringify(value));
					break;
				case PLACEHOLDER:
					placeholders.add(value);
					code_lines.push(value);
					break;
				default:
					throw new Error('wrong type');
			}
		}


		const ph_args = [...placeholders].join(', ');
		const code = (
			`function ${name}(${ph_args}) {\n` +
			`	return ${code_lines.join(' + ')};\n` +
			`}\n`
		);
		return code;
	}

}

const TEXT = Symbol('TEXT');
const PLACEHOLDER = Symbol('PLACEHOLDER');

const basic_template_tokenizer = new Advanced_Regex_Tokenizer('basic_template_tokenizer', [
	new R.Resolution_Rule(new C.Regex_Condition( /(««|»»|§§)/ ), (escaped) => [TEXT, escaped[0]]),
	new R.Resolution_Rule(new C.Regex_Condition( /«(.*?)»/ ), (expression) => [PLACEHOLDER, expression]),
	new R.Default_Rule((text) => [TEXT, text]),
]);



export function create_template(name, lines) {
	return new Template(name, tokenize_block(basic_template_tokenizer, lines.join('\n')))
}


export const record_factory = create_template('record_factory', [
	'class «name» {',
	'	constructor(«joined_member_definitions») {',
	'		Object.assign(this, { «joined_member_names» });',
	'	}',
	'}',
]);

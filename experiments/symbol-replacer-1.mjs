import * as P from 'efforting.tech-framework/parsing/basic-tokenizer/declarative.js';
import { implement_tokenizer } from 'efforting.tech-framework/parsing/basic-tokenizer/implementation.js';

import { inspect } from 'node:util';



function create_template(text, place_holders, factories) {
	const [place_holder_factory, text_factory, template_factory] = [factories.match, factories.text, factories.template];
	const token_actions = Object.keys(place_holders).map(k =>
		P.on_token(k, P.call_function_emit_value(({match}) => {
			return place_holder_factory(k, ...match.value);
		}))
	);

	const s = P.tokenization_system(null,
		P.assign_tokens(place_holders),
		P.sub_tokenizer('main',
			...token_actions,
			P.default_action(P.call_function_emit_value(({match}) => {
				return text_factory(match.text);
			})),
		),
	);

	const ts = implement_tokenizer(s);
	return template_factory(ts.tokenize(text).value)

}


class Basic_Template {
	constructor(contents) {
		Object.assign(this, { contents });
	}

	render_using_lut(lut) {
		return this.contents.map(i => {
			switch (i.constructor) {
				case Placeholder:
					if (!(i.name in lut)) {
						throw new Error(i.name);
					}
					return lut[i.name];

				case Text:
					return i.value

				default:
					throw new Error(inspect(i));
			}
		}).join('');
	}

	render_using_eval(evaluation_function = eval) {
		return this.contents.map(i => {
			switch (i.constructor) {
				case Expression:
					return evaluation_function(i.value);

				case Text:
					return i.value

				default:
					throw new Error(inspect(i));
			}
		}).join('');
	}
}

class Placeholder {
	constructor(name) {
		Object.assign(this, { name });
	}
}

class Text {
	constructor(value) {
		Object.assign(this, { value });
	}
}


class Expression {
	constructor(value) {
		Object.assign(this, { value });
	}
}

const basic_template = {
	match: (key, value) => new Placeholder(key),
	text: (value) => new Text(value),
	template: (contents) => new Basic_Template(contents),
};



function identifier_based_template(text, identifiers, flags='', rule_factory=((p, f) => [p, new RegExp(`\\b${p}\\b`, f)])) {
	const sorted_identifiers = identifiers.sort((a, b) => b.length - a.length);
	const rules = Object.fromEntries(sorted_identifiers.map(i => rule_factory(i, flags)));
	return create_template(text, rules, basic_template);
}



function js_template_string_based_template(text, identifiers, flags='', rule_factory=((p, f) => [p, new RegExp(`\\b${p}\\b`, f)])) {


	//const sorted_identifiers = identifiers.sort((a, b) => b.length - a.length);
	//const rules = Object.fromEntries(sorted_identifiers.map(i => rule_factory(i, flags)));

	return create_template(text, {
		expression: /\$\{(.*?)\}/
	}, {...basic_template, match: (key, value) => new Expression(value) });
}



const t = identifier_based_template('hello and stuff you see this is stuff and stuff-such', ['stuff', 'stuff-such'])

//OUTPUT: hello and (stuff) you see this is (stuff) and (stuff-such)
console.log(t.render_using_lut({
	stuff: '(stuff)',
	['stuff-such']: '(stuff-such)'
}));


const u = js_template_string_based_template('this ${TEMPLATE} is more like a js literal. ${10 * 20}.');

const TEMPLATE = 'TeMplAte';

//OUTPUT: this TeMplAte is more like a js literal. 200.
console.log(u.render_using_eval((expr) => eval(expr)));	// Bind locally





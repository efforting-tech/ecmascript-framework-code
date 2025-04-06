import * as TP from '../../lib/text/tree-processing.js';
import * as O from '../../lib/data/operators.js';
import * as R from '../../lib/data/rules.js';
import * as C from '../../lib/data/conditions.js';

import * as T_AST from '../../lib/templates/ast.js';
import { concat as regexp_concat, join as regexp_join, update_flag as regexp_update_flag } from '../../lib/text/regexp.js';
import { Enum } from '../../lib/enum.js';


const CONTEXT_SYMBOL = Symbol('CONTEXT_SYMBOL');

//Just while experimenting
import { inspect } from 'util';



class Abstract_Template_Node {
	constructor(title=null, body=[], source=undefined) {
		Object.assign(this, { title, body, source });
	}
}

class Template_Node extends Abstract_Template_Node {};
class Text_Node extends Abstract_Template_Node {

	to_string(indent=0) {
		const indent_string = '    '.repeat(indent); 	//TODO - support various indent modes
		if (this.title === null) {
			return this.body.map(item => item.to_string(indent)).join('\n');	//TODO - support various line ending modes		} else {
		} else {
			return [
				`${indent_string}${this.title}`,
				...this.body.map(item => item.to_string(indent+1)),
			].join('\n');	//TODO - support various line ending modes
		}
	}

};


//TODO - decide if we should utilize this or not - the idea was that expression_node may have an expression as a title or maybe even body.
//class Expression_Node extends Template_Node {};


class Resolver_Match {
	constructor(resolver, item, match) {
		Object.assign(this, { resolver, item, match });
	}
}


const REQUIREMENT_STATE = new Enum('REQUIREMENT_STATE', {
	MANDATORY: Symbol,
	OPTIONAL: Symbol,
	NOT_ALLOWED: Symbol,
});


function check_requirement_state(option, if_used, if_optional) {

	function run(...callback_list) {
		for (const callback of callback_list) {
			if (callback) {
				callback();
			}
		}
	}

	switch (option) {
		case REQUIREMENT_STATE.MANDATORY:
			run(if_used);
			return true;

		case REQUIREMENT_STATE.OPTIONAL:
			run(if_used, if_optional);
			return true;

		case REQUIREMENT_STATE.NOT_ALLOWED:
			return false;
		default:
			throw new Error('option must be REQUIREMENT_STATE');
	}
}



function conditional_number_entries(entries, start=0) {
	const result = {};
	let count = start;

	for (const [key, value] of Object.entries(entries)) {
		if (value) {
			result[count++] = key;
		}
	}
	return result;
}

function create_block_rule(tag, handler, include_type=REQUIREMENT_STATE.OPTIONAL, include_name=REQUIREMENT_STATE.OPTIONAL, include_settings=REQUIREMENT_STATE.OPTIONAL, ignore_case=true) {
	const pieces = [];
	const inner = regexp_join(tag.split(/\s+/), /\s/);

	const type_used = check_requirement_state(include_type, () => {
		pieces.push(/^(\w+)\s+/);
	}, () => {
		pieces.push('?');
	});

	pieces.push(inner, /:?/);
	const name_used = check_requirement_state(include_name, () => {
		pieces.push(/(?:\s+(\w+))/);
	}, () => {
		pieces.push('?');
	});

	const settings_used = check_requirement_state(include_settings, () => {
		pieces.push(/(?:\s*(\{.*\}))/);
	}, () => {
		pieces.push('?');
	});

	pieces.push(/\s*$/);

	const groups = conditional_number_entries({
		type: type_used,
		name: name_used,
		settings: settings_used,
	});

	const pattern = regexp_update_flag(regexp_concat(...pieces), 'i', ignore_case);

	console.log(groups, pattern);

	return new R.Resolution_Rule(new C.Title_Condition(new C.Regex_Condition( pattern )),
		(resolver, item, match) => {
			const regex_groups = match.value.value.slice(1);
			const unpacked = {};
			for (let index=0; index<regex_groups.length; index++) {
				unpacked[groups[index]] = regex_groups[index];
			}

			return handler(resolver, item, match, unpacked);

		}
	);


}



const Template_Statement_Resolver = new O.Generic_Resolver('Template_Statement_Resolver', [
	create_block_rule('code', (resolver, item, match, group_args) => {

		if (group_args.settings) {
			//TODO - care about these settings, parse the template, add this to the other rules (we should actually use a rule factory and then a single handler to throw moar drysoot in the mix).
			console.log("Settings", item[CONTEXT_SYMBOL].evaluate(group_args.settings));
		}

		const result = T_AST.Code_Block.from_node(item.body, group_args.name, group_args.type);
		const trimmed_lines = result.contents.trim_trailing_blank_lines();


		if (trimmed_lines) {
			return new T_AST.Sequence(result, new T_AST.Blank_Lines(trimmed_lines));
		} else {
			return result;
		}

	}),
]);



/*const Template_Statement_Resolver = new O.Generic_Resolver('Template_Statement_Resolver', [
	new R.Resolution_Rule(new C.Title_Condition(new C.Regex_Condition( /^(\w+)\s+code:?\s+(\w+)(?:\s*(\{.*\}))?\s*$/i )),
		(resolver, item, match) => {

			const settings = match.value.value[3];
			if (settings) {
				//TODO - care about these settings, parse the template, add this to the other rules (we should actually use a rule factory and then a single handler to throw moar drysoot in the mix).
				console.log("Settings", item[CONTEXT_SYMBOL].evaluate(settings));
			}

			const result = T_AST.Code_Block.from_node(item.body, match.value.value[2], match.value.value[1]);
			const trimmed_lines = result.contents.trim_trailing_blank_lines();


			if (trimmed_lines) {
				return new T_AST.Sequence(result, new T_AST.Blank_Lines(trimmed_lines));
			} else {
				return result;
			}

		}
	),

	new R.Resolution_Rule(new C.Title_Condition(new C.Regex_Condition( /^(\w+)\s+code:?(?:\s*(\{.*\}))?\s*$/i )),
		(resolver, item, match) => {
			return T_AST.Code_Block.from_node(item.body, undefined, match.value.value[1]);
		}
	),

	new R.Resolution_Rule(new C.Title_Condition(new C.Regex_Condition( /^code:?\s+(\w+)(?:\s*(\{.*\}))?\s*$/i )),
		(resolver, item, match) => {
			return T_AST.Code_Block.from_node(item.body, match.value.value[1]);
		}
	),

	new R.Resolution_Rule(new C.Title_Condition(new C.Regex_Condition( /^code:?(?:\s*(\{.*\}))?\s*$/i )),
		(resolver, item, match) => {
			return T_AST.Code_Block.from_node(item.body);
		}
	),
]);
*/


class Context {
	constructor(name, scope={}) {
		Object.assign(this, { name, scope });
	}

	evaluate(expression) {
		const keys = Object.keys(this.scope);
		const values = Object.values(this.scope);
		const arg_def = keys.join(',');
		const outer_expression = `(${arg_def}) => (${expression})`;
		return eval(outer_expression)(...values);
	}

};

const DEFAULT_CONTEXT = new Context('DEFAULT_CONTEXT', {
	template: 'place holder for template processing',			//TODO - just for PoC
	blargh: 123,
	// [CONTEXT_SYMBOL]: 'hello world', // This is just a demo that symbols will not interfere with Object.keys() and Object.values()
});



const Template_TT_Resolver = new O.Tree_Processor('Template_TT_Resolver', [

	new R.Resolution_Rule(new C.Title_Condition(new C.Regex_Condition( /§\s*(.*)/ )),
		(resolver, item, match) => {
			const statement = match.value.value[1];
			const node = item.copy(statement);
			node[CONTEXT_SYMBOL] = DEFAULT_CONTEXT;
			return Template_Statement_Resolver.resolve(node);
		}
	),

	new R.Resolution_Rule(new C.Title_Condition(new C.Regex_Condition( /(.*)/ )),
		//TODO - actually parse the title using the template parser
		(resolver, item, match) => {
			return new Template_Node(item.title, resolver.process_tree(item.body), new Resolver_Match(resolver, item, match));
		}
	),
]);



class Template {
	constructor(name, root) {
		Object.assign(this, { name, root });
	}
	static from_string(data, name=undefined) {
		const root = TP.Node.from_string(data);
		root.settings.emit_empty = true;
		return new this(name, Template_TT_Resolver.process_node(root));
	}
}


const template = Template.from_string(`
	This is a template
		We can have «stuff» in it.

	§ python code: block1
		import sys
		# This code block is named «definition name»

	§ python code: block2 {parser: null}
		# This code block is completely literal «definition name»

	Here is more stuff
`, 'my-template');



const BODY_ARRAY_RENDERER = Symbol('BODY_ARRAY_RENDERER');
const BODY_ELEMENT_RENDERER = Symbol('BODY_ELEMENT_RENDERER');
const TITLE_RENDERER = Symbol('TITLE_RENDERER');
const TEMPLATE_RENDERER = Symbol('TEMPLATE_RENDERER');

const template_renderer = new O.Generic_Resolver('template_renderer', [
	new R.Resolution_Rule(new C.Type_is(Template), (resolver, item, match) => {
		return resolver.resolve(item.root);
	}),

	new R.Default_Rule((resolver, item, match) => {
		return resolver[BODY_ELEMENT_RENDERER].resolve(item);
	}),


]);

const title_renderer = new O.Generic_Resolver('title_renderer', [
	new R.Resolution_Rule(new C.Type_is(String), (resolver, item, match) => {
		return item;
	}),

]);

const body_array_renderer = new O.Generic_Resolver('body_array_renderer', [
	new R.Resolution_Rule(new C.Type_is(Array), (resolver, item, match) => {
		return item.map(item => resolver[BODY_ELEMENT_RENDERER].resolve(item));
	}),

	new R.Default_Rule((resolver, item, match) => {
		return [resolver[BODY_ELEMENT_RENDERER].resolve(item)];
	}),

]);

const body_element_renderer = new O.Generic_Resolver('body_element_renderer', [
	new R.Resolution_Rule(new C.Type_is(Template_Node), (resolver, item, match) => {
		return new Text_Node(resolver[TITLE_RENDERER].resolve(item.title), resolver[BODY_ARRAY_RENDERER].resolve(item.body));
	}),

	new R.Resolution_Rule(new C.Type_is(T_AST.Sequence), (resolver, item, match) => {
		return new Text_Node(null, item.contents.map(sub_item => resolver.resolve(sub_item)));
	}),

	new R.Resolution_Rule(new C.Type_is(T_AST.Code_Block), (resolver, item, match) => {
		return new Text_Node(null, [
			new Text_Node('```' + `${item.type}`, resolver[BODY_ARRAY_RENDERER].resolve(item.contents)),
			new Text_Node('```')
		]);
	}),

	new R.Resolution_Rule(new C.Type_is(TP.Node), (resolver, item, match) => {
		//TODO - check warning vs error vs defer errors/warnings for presenting them under a block or after processing
		const error_text = `Found unprocessed Text Node: ${JSON.stringify(item.title)} when processing data using ${resolver.name}.`;
		//throw new Error(error_text)

		return new Text_Node(null, [
			new Text_Node(`> [!WARNING]`),
			new Text_Node(`> ${error_text}`),
		]);

	}),

	new R.Resolution_Rule(new C.Type_is(T_AST.Blank_Lines), (resolver, item, match) => {
		return new Text_Node(null, Array.from({ length: item.count }, () => new Text_Node('')));
	}),


]);



for (const target of [body_array_renderer, body_element_renderer, title_renderer, template_renderer]) {
	target[TITLE_RENDERER] = title_renderer;
	target[TEMPLATE_RENDERER] = template_renderer;
	target[BODY_ARRAY_RENDERER] = body_array_renderer;
	target[BODY_ELEMENT_RENDERER] = body_element_renderer;
}



console.log(template_renderer.resolve(template).to_string());
process.exit(1);
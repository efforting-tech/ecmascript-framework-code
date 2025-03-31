import * as TP from '../../lib/text/tree-processing.js';
import * as O from '../../lib/data/operators.js';
import * as R from '../../lib/data/rules.js';
import * as C from '../../lib/data/conditions.js';

import * as T_AST from '../../lib/templates/ast.js';


const CONTEXT_SYMBOL = Symbol('CONTEXT_SYMBOL');

//Just while experimenting
import { inspect } from 'util';



class Template_Node {
	constructor(title, body=[], source=undefined) {
		Object.assign(this, { title, body, source });
	}
}


//TODO - decide if we should utilize this or not - the idea was that expression_node may have an expression as a title or maybe even body.
class Expression_Node extends Template_Node {};


class Resolver_Match {
	constructor(resolver, item, match) {
		Object.assign(this, { resolver, item, match });
	}
}




const Template_Statement_Resolver = new O.Generic_Resolver('Template_Statement_Resolver', [
	new R.Resolution_Rule(new C.Title_Condition(new C.Regex_Condition( /^(\w+)\s+code:?\s+(\w+)(?:\s*(\{.*\}))?\s*$/i )),
		(resolver, item, match) => {

			const settings = match.value.value[3];
			if (settings) {
				//TODO - care about these settings, parse the template, add this to the other rules (we should actually use a rule factory and then a single handler to throw moar drysoot in the mix).
				console.log("Settings", item[CONTEXT_SYMBOL].evaluate(settings));
			}

			return T_AST.Code_Block.from_node(item.body, match.value.value[2], match.value.value[1]);
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
	static from_string(data) {
		const root = TP.Node.from_string(data);
		root.settings.emit_empty = true;

		const result = Template_TT_Resolver.process_tree(root.body);

		console.log(inspect(result, { depth: null, colors: true }));
		process.exit(1);
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
`);



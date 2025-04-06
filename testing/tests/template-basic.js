import * as TP from '../../lib/text/tree-processing.js';
import * as O from '../../lib/data/operators.js';
import * as R from '../../lib/data/rules.js';
import * as C from '../../lib/data/conditions.js';

import * as T_AST from '../../lib/templates/ast.js';
import { create_block_rule } from '../../lib/templates/rule-factories.js';


const CONTEXT_SYMBOL = Symbol('CONTEXT_SYMBOL');

//Just while experimenting
import { inspect } from 'util';


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
			const result = new T_AST.Template_Node(item.title, resolver.process_tree(item.body));
			//TODO: attach this source: new Resolver_Match(resolver, item, match)

			return result;
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




const dispatch_table = {};

const template_renderer = new O.Generic_Resolver('template_renderer', [
	new R.Resolution_Rule(new C.Type_is(Template), (resolver, item, match) => {
		return resolver.resolve(item.root);
	}),

	new R.Default_Rule((resolver, item, match) => {
		return dispatch_table.body_element.resolve(item);
	}),


]);

const title_renderer = new O.Generic_Resolver('title_renderer', [
	new R.Resolution_Rule(new C.Type_is(String), (resolver, item, match) => {
		return item;
	}),

]);

const body_array_renderer = new O.Generic_Resolver('body_array_renderer', [
	new R.Resolution_Rule(new C.Type_is(Array), (resolver, item, match) => {
		return item.map(item => dispatch_table.body_element.resolve(item));
	}),

	new R.Default_Rule((resolver, item, match) => {
		return [dispatch_table.body_element.resolve(item)];
	}),

]);

const body_element_renderer = new O.Generic_Resolver('body_element_renderer', [
	new R.Resolution_Rule(new C.Type_is(T_AST.Template_Node), (resolver, item, match) => {
		return new T_AST.Text_Node(dispatch_table.title.resolve(item.title), dispatch_table.body_array.resolve(item.body));
	}),

	new R.Resolution_Rule(new C.Type_is(T_AST.Sequence), (resolver, item, match) => {
		return new T_AST.Text_Node(null, item.contents.map(sub_item => resolver.resolve(sub_item)));
	}),

	new R.Resolution_Rule(new C.Type_is(T_AST.Code_Block), (resolver, item, match) => {
		return new T_AST.Text_Node(null, [
			new T_AST.Text_Node('```' + `${item.type}`, dispatch_table.body_array.resolve(item.contents)),
			new T_AST.Text_Node('```')
		]);
	}),

	new R.Resolution_Rule(new C.Type_is(TP.Node), (resolver, item, match) => {
		//TODO - check warning vs error vs defer errors/warnings for presenting them under a block or after processing
		const error_text = `Found unprocessed Text Node: ${JSON.stringify(item.title)} when processing data using ${resolver.name}.`;
		//throw new Error(error_text)

		return new T_AST.Text_Node(null, [
			new T_AST.Text_Node(`> [!WARNING]`),
			new T_AST.Text_Node(`> ${error_text}`),
		]);

	}),

	new R.Resolution_Rule(new C.Type_is(T_AST.Blank_Lines), (resolver, item, match) => {
		return new T_AST.Text_Node(null, Array.from({ length: item.count }, () => new T_AST.Text_Node('')));
	}),


]);



Object.assign(dispatch_table, {
	body_array: body_array_renderer,
	body_element: body_element_renderer,
	title: title_renderer,
	template: template_renderer
});





console.log(dispatch_table.template.resolve(template).to_string());
process.exit(1);
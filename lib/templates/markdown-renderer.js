//NOTE: This is based on some testing and I have not yet decided if this is going to be markdown or plain text or whatever.
//		It will mostly be here for reference and once we need markdown or something else we will cross that bridge

import * as R from '../data/rules.js';
import * as C from '../data/conditions.js';
import * as O from '../data/operators.js';
import * as TP from '../text/tree-processing.js';
import * as T_AST from './ast.js';
import { Template } from './types.js';


export const dispatch_table = {};

const template_renderer = new O.Generic_Resolver('template_renderer', [
	new R.Resolution_Rule(new C.Constructor_is(Template), (resolver, item, match) => {
		return resolver.resolve(item.root);
	}),

	new R.Default_Rule((resolver, item, match) => {
		return dispatch_table.body_element.resolve(item);
	}),


]);

const title_renderer = new O.Generic_Resolver('title_renderer', [
	new R.Resolution_Rule(new C.Constructor_is(String), (resolver, item, match) => {
		return item;
	}),

]);

const body_array_renderer = new O.Generic_Resolver('body_array_renderer', [
	new R.Resolution_Rule(new C.Constructor_is(Array), (resolver, item, match) => {
		return item.map(item => dispatch_table.body_element.resolve(item));
	}),

	new R.Default_Rule((resolver, item, match) => {
		return [dispatch_table.body_element.resolve(item)];
	}),

]);

const body_element_renderer = new O.Generic_Resolver('body_element_renderer', [
	new R.Resolution_Rule(new C.Constructor_is(T_AST.Template_Node), (resolver, item, match) => {
		return new T_AST.Text_Node(dispatch_table.title.resolve(item.title), dispatch_table.body_array.resolve(item.body));
	}),

	new R.Resolution_Rule(new C.Constructor_is(T_AST.Sequence), (resolver, item, match) => {
		return new T_AST.Text_Node(null, item.contents.map(sub_item => resolver.resolve(sub_item)));
	}),

	new R.Resolution_Rule(new C.Constructor_is(T_AST.Code_Block), (resolver, item, match) => {
		return new T_AST.Text_Node(null, [
			new T_AST.Text_Node('```' + `${item.type}`, dispatch_table.body_array.resolve(item.contents)),
			new T_AST.Text_Node('```')
		]);
	}),

	new R.Resolution_Rule(new C.Constructor_is(TP.Node), (resolver, item, match) => {
		//TODO - check warning vs error vs defer errors/warnings for presenting them under a block or after processing
		const error_text = `Found unprocessed Text Node: ${JSON.stringify(item.title)} when processing data using ${resolver.name}.`;
		//throw new Error(error_text)

		return new T_AST.Text_Node(null, [
			new T_AST.Text_Node(`> [!WARNING]`),
			new T_AST.Text_Node(`> ${error_text}`),
		]);

	}),

	new R.Resolution_Rule(new C.Constructor_is(T_AST.Blank_Lines), (resolver, item, match) => {
		return new T_AST.Text_Node(null, Array.from({ length: item.count }, () => new T_AST.Text_Node('')));
	}),


]);



Object.assign(dispatch_table, {
	body_array: body_array_renderer,
	body_element: body_element_renderer,
	title: title_renderer,
	template: template_renderer
});

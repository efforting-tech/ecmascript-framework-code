import * as O from '../data/operators.js';
import * as C from '../data/conditions.js';
import * as R from '../data/rules.js';
import * as T_AST from './ast.js';
import { Context, CONTEXT_SYMBOL, DEFAULT_CONTEXT } from './context.js';
import { create_block_rule } from './rule-factories.js';


export const template_statement_parser = new O.Generic_Resolver('Template_Statement_Parser', [
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


export const embedded_template_parser = new O.Tree_Processor('Embedded_Template_Parser', [

	new R.Resolution_Rule(new C.Title_Condition(new C.Regex_Condition( /§\s*(.*)/ )),
		(resolver, item, match) => {
			const statement = match.value.value[1];
			const node = item.copy(statement);
			node[CONTEXT_SYMBOL] = DEFAULT_CONTEXT;
			return template_statement_parser.resolve(node);
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


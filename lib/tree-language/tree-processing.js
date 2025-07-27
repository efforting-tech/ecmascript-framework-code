import * as O from '../data/operators.js';
import { create_dispatchers_from_raster_table } from '../operations/high-level-dispatchers.js';
//import { create_records_from_raster_table, create_symbols_from_raster_table, create_dispatchers_from_raster_table } from '../operations/high-level-dispatchers.js';


class Pending_Pattern {
	constructor(placeholders, re_cond) {
		Object.assign(this, { placeholders, re_cond });
	}
}



export function create_processor(context, name) {
	context.set(name, new O.Tree_Processor(context.resolve_path(name)));
}


export function tp_parse_pattern(pattern) {
	if (pattern instanceof Pending_Pattern) {
		return pattern;
	}
	const placeholders = [];
	const re_cond = AST.to_regex({ placeholders }, tokenize_block(pattern_tokenizer, pattern));
	return new Pending_Pattern( placeholders, re_cond );
}



export function tp_add_rule(parser, pattern, handler) {
	const { placeholders, re_cond } = tp_parse_pattern(pattern);
	re_cond.processing_metadata = {
		pattern, parser
	};
	parser.rules.push(new R.Resolution_Rule(new C.Title_Condition(new C.Regex_Condition(re_cond)),
		(resolver, item, match) => {
			const values = {};
			for (let i=0; i<placeholders.length; i++) {
				values[placeholders[i]] = match.value.value[i+1];
			}
			return handler(resolver, item, match, values);
		}
	));
}


export function install_tree_processing(system) {

	const context = system.sub_context('processors.efforting.tree_language');
	const processor = create_processor(context, 'ingress');

	create_dispatchers_from_raster_table(context, `
		name							group				constructor				expression
		----							-----				-----------				----------
		to_regex(context, §item)		AST					Array					RE.update_flag(RE.concat('^', ...item.map(sub_item => AST.to_regex(context, sub_item)), '$'), 'i', true)
		〃								〃					.Text					escape_regex(item.value)
		〃								〃					.Whitespace				/\\s+/
		〃								〃					.Optional				RE.concat('(?:', escape_regex(item.value), ')?')
		〃								〃					.Placeholder			process_placeholder(context, item)
	`);


	tp_add_rule(processor, 'execute[:]', (resolver, node, match) => {
		console.log("SHould subcontext and execute");
		//exec_in_context(sub_context, node.body.to_text());
	});

}
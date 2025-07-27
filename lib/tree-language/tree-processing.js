import * as O from '../data/operators.js';
import * as R from '../data/rules.js';
import * as C from '../data/conditions.js';
import * as RE from '../text/regexp.js';
import { create_records_from_raster_table, create_dispatchers_from_raster_table } from '../operations/high-level-dispatchers.js';
//import { create_records_from_raster_table, create_symbols_from_raster_table, create_dispatchers_from_raster_table } from '../operations/high-level-dispatchers.js';
import { Constructor_Based_Mapping_Processor } from '../data/dispatchers.js';
import { tokenize_block, Advanced_Regex_Tokenizer } from '../parsing/regexp-tokenizer.js';

class Pending_Pattern {
	constructor(placeholders, re_cond) {
		Object.assign(this, { placeholders, re_cond });
	}
}



export function create_processor(context, name) {
	const new_processor = new O.Tree_Processor(context.resolve_path(name));
	context.set(name, new_processor);
	return new_processor;
}



export function install_tree_processing(system) {

	const types = system.sub_context('types');
	types.set('Constructor_Based_Mapping_Processor', Constructor_Based_Mapping_Processor);
	system.sub_context().set('RE', RE);

	const context = system.sub_context('processors.efforting.tree_language');
	const processor = create_processor(context, 'ingress');

	create_records_from_raster_table(context, `
		name			group				members
		----			-----				-------
		Text			AST					value
		Whitespace		〃					〃
		Placeholder		〃					〃
		Optional		〃					〃
	`);

	create_dispatchers_from_raster_table(context, `
		name							group				constructor				expression
		----							-----				-----------				----------
		to_regex(context, §item)		AST					Array					RE.update_flag(RE.concat('^', ...item.map(sub_item => AST.to_regex(context, sub_item)), '$'), 'i', true)
		〃								〃					.Text					RE.escape_regex(item.value)
		〃								〃					.Whitespace				/\\s+/
		〃								〃					.Optional				RE.concat('(?:', RE.escape_regex(item.value), ')?')
		〃								〃					.Placeholder			process_placeholder(context, item)
	`);

	const AST = context.get_dir('AST').to_object();
	const pattern_tokenizer = new Advanced_Regex_Tokenizer('pattern_tokenizer', [
		new R.Resolution_Rule(new C.Regex_Condition( /(««|»»|§§)/ ),
			(escaped) => {
				return new AST.Text(escaped[0]);
			}
		),

		new R.Resolution_Rule(new C.Regex_Condition( /«(.*?)»/ ),
			(expression) => {
				return new AST.Placeholder(expression)
			}
		),

		new R.Resolution_Rule(new C.Regex_Condition( /\[(.*?)\]/ ),
			(expression) => {
				return new AST.Optional(expression)
			}
		),

		new R.Resolution_Rule(new C.Regex_Condition( /(\s+)/ ),
			(expression) => {
				return new AST.Whitespace(expression)
			}
		),

		new R.Default_Rule(
			(text) => {
				return new AST.Text(text);
			}
		),

	]);



	function tp_parse_pattern(pattern) {
		if (pattern instanceof Pending_Pattern) {
			return pattern;
		}
		const placeholders = [];
		const re_cond = AST.to_regex({ placeholders }, tokenize_block(pattern_tokenizer, pattern));
		return new Pending_Pattern( placeholders, re_cond );
	}

	function tp_add_rule(parser, pattern, handler) {
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

	tp_add_rule(processor, 'execute[:]', (resolver, node, match) => {
		console.log("SHould subcontext and execute");
		return 123;
		//exec_in_context(sub_context, node.body.to_text());
	});

}
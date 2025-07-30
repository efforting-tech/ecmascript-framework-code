import * as O from '../data/operators.js';
import * as R from '../data/rules.js';
import * as C from '../data/conditions.js';
import * as RE from '../text/regexp.js';
import { load_ditto_raster } from '../table/data-table.js';

import { create_records_from_raster_table, create_dispatchers_from_raster_table } from '../operations/high-level-dispatchers.js';
//import { create_records_from_raster_table, create_symbols_from_raster_table, create_dispatchers_from_raster_table } from '../operations/high-level-dispatchers.js';
import { Constructor_Based_Mapping_Processor } from '../data/dispatchers.js';
import { tokenize_block, Advanced_Regex_Tokenizer } from '../parsing/regexp-tokenizer.js';


export function install_tree_processing(system) {
	const root = system.sub_context('efforting');

	root.set_multiple([
		['P.tree_language', null],
		['other.stuff', 'NEKRÅÅÅS'],
		['other.things', {
			name: 'Nekråsus',
			hobby: 'rabbit holin',
		}],
	]);

}


if (false) {



	class Pending_Pattern {
		constructor(placeholders, re_cond) {
			Object.assign(this, { placeholders, re_cond });
		}
	}

	/* export */ function process_placeholder(context, placeholder) {
		console.log('Should process placeholder', placeholder);
	}



	/* export */ function create_processor(context, name) {
		const new_processor = new O.Tree_Processor(context.resolve_path(name));
		context.set(name, new_processor);
		return new_processor;
	}


	/* export */ function create_placeholder_patterns(context, raster) {
		const patterns = load_ditto_raster(raster, 'pattern');

		for (const {pattern, regex, captures} of patterns) {
			console.log(pattern, regex, captures);
		}

	}


	/* export */ function install_tree_processing(system) {

		//TODO: Build initial context - this should probably be its own module - we also may want to use some update function that is only strict about changing the root context of system when values differ since many sub systems may have similar dependencies
		//TODO:	Later during testing we should also make sure we test each feature by itself and together to make sure we don't leave gaps.
		system.sub_context().assign({
			RE, C, O, R, D: {
				/* Here we can put various data interfaces */
			},
			T: {	/* Types */
				Constructor_Based_Mapping_Processor,
			},
			TPF: {	/* Tree processing functions */
				process_placeholder,
			},
			TPP: {	/* Tree processing patterns */
				placeholders: [],
			},
			P: {
			}
		});

		//TODO - decide if this is the right place for this
		const context = system.sub_context('processors.efforting.tree_language');
		const processor = create_processor(context, 'ingress');

		create_placeholder_patterns(context, `

			pattern								regex		captures
			-------								-----		--------
			pattern								(.*?)		pattern
			identifier							(\\w+?)		identifier

		`);


	// Composed patterns - not sure yet how we describe them
	/*
			«pattern» as «identifier»
			comma separated list of «pattern»
	*/



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
			〃								〃					.Placeholder			TPF.process_placeholder(context, item)
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


		//TODO - these functions should be moved into the system context
		function tp_parse_pattern(pattern) {
			if (pattern instanceof Pending_Pattern) {
				return pattern;
			}
			const placeholders = [];
			//TODO: to_regex should not be under AST - furthermore it should probably not give a regex back but a higher level capture object.
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
			console.log("SHould subcontext and execute", node.body.to_text());
			return 123;
		});

		tp_add_rule(processor, 'test[:] «identifier as bob»', (resolver, node, match) => {
			console.log(`Test was called with data: ${bob}`);
		});

		console.log(processor.rules.at(-1).condition.condition.pattern)
		//TODO: we should probably not accept "undefined" as part of a pattern which could happen if TPF.process_placeholder has a buggy/partial implementation.
		//		now "thing as bob" becomes undefined like this: /^test(?::)?\s+undefined$/i


	}

}
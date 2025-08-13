import * as O from '../data/operators.js';
import { tokenize_block, Advanced_Regex_Tokenizer } from '../parsing/regexp-tokenizer.js';
import * as R from '../data/rules.js';
import * as C from '../data/conditions.js';
//import * as RE from '../text/regexp.js';

//import { inspect } from 'node:util';
//import { load_ditto_raster } from '../table/data-table.js';

//import { create_records_from_raster_table, create_dispatchers_from_raster_table } from '../operations/high-level-dispatchers.js';
//import { create_records_from_raster_table, create_symbols_from_raster_table, create_dispatchers_from_raster_table } from '../operations/high-level-dispatchers.js';
//import { Constructor_Based_Mapping_Processor } from '../data/dispatchers.js';
//import { tokenize_block, Advanced_Regex_Tokenizer } from '../parsing/regexp-tokenizer.js';


import { create_basic_parsing_system, create_namespace, create_resolver, create_placeholder_patterns, create_records, create_constructor_based_dispatchers } from './helpers.js';
import { Namespace } from './context.js';


export function install_tree_processing(system) {

	const root = system.sub_context();
	create_namespace(root, 'efforting');

	const efforting = system.sub_context('efforting');

	//NOTE: Currently we are not supplying an evaluation scope here but that is something we could do in order to have access to useful stuff in the factories (members)
	const AST = create_records(efforting.sub_context('RT.tree_language.token'), `
		name			members
		----			-------
		Text			value
		Whitespace		〃
		Placeholder		〃
		Optional		〃
	`);


	create_resolver(O.Tree_Processor, efforting, 'TP.tree_language.ingress');
	const pattern_to_capture = create_resolver(O.Generic_Resolver, efforting, 'GR.tree_language.pattern_to_capture');	//NOTE: This should look up regular expressions
	const pattern_tokenizer = create_resolver(Advanced_Regex_Tokenizer, efforting, 'TK.tree_language.pattern');


	efforting.set_multiple([
		['F.create_resolver', create_resolver],
		['F.create_namespace', create_namespace],
		['F.create_placeholder_patterns', create_placeholder_patterns],
		['F.create_records', create_records],

		['SC.tree_language.placeholder_expression_scope.hello', 'world'],	//TODO - just testing

	]);



	//TODO - should probably put this in its own module
	efforting.set('F.tree_language.pattern.get_placeholders',
		function get_placeholders(tokens) {
			return tokens.filter(i => i instanceof AST.Placeholder);
		}
	);


	pattern_tokenizer.add_rule(
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
	);


	//TODO - probably not have this at all
	const sequence_comparator = {
		//TODO: This should be a dispatcher - we just hardcode for test
		is_equal: function is_equal(a, b) {
			console.log(a, b)
			if (a.constructor ===  AST.Text && b.constructor ===  AST.Text) {
				return a.value === b.value;
			} else if (a.constructor ===  AST.Whitespace && b.constructor ===  AST.Whitespace) {
				return true;
			} else if (a.constructor ===  AST.Placeholder && b.constructor ===  AST.Text) {
				return true;
			} else if (a.constructor !== b.constructor) {
				return false;
			} else {
				throw new Error(`Comparing ${a.constructor} with ${b.constructor} not implemented`);
			}
		}
	}



	//console.log(tokenize_block(pattern_tokenizer, 'pattern as thing'));

	//TODO: Next step is to create the dispatchers with all the bells and whistles.
	//		We may need to start giving these things some curated contexts
	//NOTE: I also see some weird stuff in here that may not be completely compatible with what we want to do

/*
	const { to_regex } = create_dispatchers(efforting, `
		name							constructor				expression
		----							-----------				----------
		to_regex(context, §item)		Array					RE.update_flag(RE.concat('^', ...item.map(sub_item => AST.to_regex(context, sub_item)), '$'), 'i', true)
		〃								.Text					RE.escape_regex(item.value)
		〃								.Whitespace				/\\s+/
	`);

*/

	//PLAN: In order to create the dispatch table we may want some settings and context


	const SAST = create_records(efforting.sub_context('RT.tree_language.signature.token'), `
		name				members
		----				-------
		Identifier			name
		Parameters			parameters

	`);




	//NOTE: stuff like "leave and push sub result" may later have extensions for post processing, such as "leave and push sub result: new Thingamabob(sub_result)"
	//		or "leave and push sub result as thing: new Thingamabob(thing)"
	create_basic_parsing_system(efforting.sub_context('not_decided.basic_parser'), `
		parser										pattern						captures		operation
		------										-------						--------		---------
		common										/\\s+/										ignore

		ingress extends common						/(\\w+)/					name			push: new SAST.Function(name)
																								switch to: parameters.ingress

		parameters.ingress extends common			/\\(/										enter parameters.body and push sub result upon return:
																									new SAST.Parameters(sub_result)

		parameters.body extends common				/\\)/										leave
		parameters.body								/(\\w+)\\s*=\\s*([^,)])/	name, value		push: new SAST.Member(name, value)
		parameters.body								/(\\w+)/					name			push: new SAST.Member(name)
		parameters.body								/,/											ignore

	`);




	/*
	const signature_tokenizer = create_resolver(Advanced_Regex_Tokenizer, efforting, 'TK.tree_language.signature');

	signature_tokenizer.add_rule(

		new R.Resolution_Rule(new C.Regex_Condition( /\(/ ),
			(expression) => {
				return new AST.Placeholder(expression)
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
	);


	console.log(signature_tokenizer)
*/




/*
	create_constructor_based_dispatchers(efforting.anonymous_sub_context(), `

		name							constructor				expression
		----							-----------				----------
		to_regex(item)					Array					RE.update_flag(RE.concat('^', ...item.map(sub_item => resolve(sub_item)), '$'), 'i', true)
		〃								AST.Text				RE.escape_regex(item.value)
		〃								AST.Whitespace			/\\s+/

	`);

*/

	//console.log(to_regex.process_multiple(tokenize_block(pattern_tokenizer, 'pattern as thing')));
	process.exit(45)


	//NOTE: This is a bit contrived because this is for generating regex rules that are not going through a tokenizer.
	//		In order to add support for comma separated lists and such, one must extend the pattern with a character set.
	//		It also means only patterns that define repeat_ws_cs will work for this (source.repeat_with_separator_cs should throw error otherwise)
	create_placeholder_patterns(efforting, `

		pattern								regex													captures				repeat_ws_cs
		-------								-----													--------				------------
		pattern								/(.*?)/													['pattern']				/(.*?)/
		identifier							/(\\w+?)/												['identifier']			RE.concat('([\\w', separator,']+?)')
		teeest«»							resolve('pattern')										['identifier']			RE.concat('([\\w', separator,']+?)')

		«pattern» as «identifier»			const source = resolve(pattern);						[identifier]
											assert(source.captures.length === 1);
											return source.regex;

		comma separated list of «pattern»	const source = resolve(pattern);						['csl']
											return source.repeat_with_separator_cs(/[\\s,]/);

	`);

	console.log(pattern_to_capture.resolve('identifier'))



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
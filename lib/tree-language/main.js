// import { create_records_from_raster_table, create_symbols_from_raster_table, create_dispatchers_from_raster_table } from '../operations/high-level-dispatchers.js';
// import { Dotted_Tree_Directory } from '../data/object.js';
// import { tokenize_block, Advanced_Regex_Tokenizer } from '../parsing/regexp-tokenizer.js';
// import { Property_Stack } from '../data/stack.js';
// import { eval_in_context, exec_in_context } from '../data/context.js';
// import { inspect } from 'node:util';
// import * as O from '../data/operators.js';
// import * as R from '../data/rules.js';
// import * as C from '../data/conditions.js';
// import * as RE from '../text/regexp.js';

import { System } from  './system.js';

export function create_default_system() {
	const system = new System();

	return system;
}


if (false) {

	class Pending_Pattern {
		constructor(placeholders, re_cond) {
			Object.assign(this, { placeholders, re_cond });
		}
	}

	function escape_regex(r) {	//export
		//TODO: actually escape regex - move to proper place
		return r;
	}

	function process_placeholder(context, placeholder) {	//export
		//TODO - not hardcode
		//TODO - add post processors
		switch (placeholder.value) {
			case 'name':
				context.placeholders.push('name');
				return /\s*(\w+?)/;
			case 'identifier':
				context.placeholders.push('identifier');
				return /\s*(\w+?)/;
			case 'path':
				context.placeholders.push('path');
				return /\s*(.+?)/;
			case 'pattern':
				context.placeholders.push('pattern');
				return /(.*)/;
			case 'data path':
				context.placeholders.push('data_path');
				return /\s*([\w\.]+?)/;
			case 'comma separated identifiers':
				context.placeholders.push('identifiers');
				return /\s*([\s\w,]+)/;
			default:
				throw new Error(placeholder.value);
		}

	}





	function create_system(target_context={}, records_tree=new Dotted_Tree_Directory(), dispatch_tree=new Dotted_Tree_Directory(), symbol_tree=new Dotted_Tree_Directory()) {	//export
		Object.assign(target_context, { RE, escape_regex, process_placeholder });

		const code_preprocessor_stack = [];

		function code_preprocessor(code) {
			for (const processor of code_preprocessor_stack) {
				code = processor(code);
			}
			return code;
		}

		const tp_main_processor = new O.Tree_Processor('tp_main_processor');
		const tp_definition_processor = new O.Tree_Processor('tp_definition_processor');
		const tp_tokenizer_processor = new O.Tree_Processor('tp_tokenizer_processor');

		const context = {};
		const context_stack = new Property_Stack(context);

		Object.assign(context, {
			push: ((values) => context_stack.push(values)),
			assign: ((values) => Object.assign(context, values)),
			pop: (() => context_stack.pop()),
			set_by_path, get_by_path, tokenize_block, code_preprocessor, code_preprocessor_stack
		});

		create_records_from_raster_table(target_context, 'Tree_Language', records_tree, `
			name			group				members
			----			-----				-------
			Text			AST					value
			Whitespace		〃					〃
			Placeholder		〃					〃
			Optional		〃					〃
		`);


		/* __flat should not be needed for __flat.to_regex but we have some bug here */
		create_dispatchers_from_raster_table(target_context, 'Tree_Language', dispatch_tree, `
			name							group				constructor				expression
			----							-----				-----------				----------
			to_regex(context, §item)		AST					Array					RE.update_flag(RE.concat('^', ...item.map(sub_item => Tree_Language.AST.to_regex(context, sub_item)), '$'), 'i', true)
			〃								〃					.Text					escape_regex(item.value)
			〃								〃					.Whitespace				/\\s+/
			〃								〃					.Optional				RE.concat('(?:', escape_regex(item.value), ')?')
			〃								〃					.Placeholder			process_placeholder(context, item)
		`);

		const { AST } = target_context.Tree_Language;


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


		function parse_pattern(pattern) {
			if (pattern instanceof Pending_Pattern) {
				return pattern;
			}
			const placeholders = [];
			const re_cond = AST.to_regex({ placeholders }, tokenize_block(pattern_tokenizer, pattern));
			return new Pending_Pattern( placeholders, re_cond );
		}


		function add_rule(parser, pattern, handler) {
			const { placeholders, re_cond } = parse_pattern(pattern);
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

		function add_default_rule(parser, handler) {
			parser.rules.push(new R.Default_Rule(handler));
		}

		add_rule(tp_definition_processor, 'pattern[:] «pattern»', (resolver, node, match, { pattern }) => {
			//In the future we will add § support in code block - we do this by transforming sigil blocks into named callbacks hoisted into the finalized code block

			const pp = parse_pattern(pattern.trim());

			/*
			const args = ['resolver', 'node', 'match'];
			if (pp.placeholders.length > 0) {
				const joined_placeholders = pp.placeholders.join(', ')
				args.push(`{ ${joined_placeholders} }`);
			}
			*/

			//const joined_args = args.join(', ');
			//const code = `(${joined_args}) => {${node.body.to_text()}}`;


			const preprocessed = context.code_preprocessor(node.body.to_text());
			const code = `(() => {${preprocessed}})()`;

			//const definition_time_context = {...context};
			//eval_in_context(definition_time_context, code)
			add_rule(context.target_processor, pp, (resolver, node, match) => {

				const captured_placeholders = {};
				pp.placeholders.map((e, i) => {
					captured_placeholders[e] = match.value.value[i+1];
				});

				const sub_context = {
					...context,
					resolver, node, match,
					...captured_placeholders
				};

				return eval_in_context(sub_context, code)
			});
		});


		add_rule(tp_definition_processor, 'default[:]', (resolver, node, match) => {
			//In the future we will add § support in code block - we do this by transforming sigil blocks into named callbacks hoisted into the finalized code block
			const code = `(() => {${node.body.to_text()}})()`;

			add_default_rule(context.target_processor, (resolver, node, match) => {
				const sub_context = {
					...context,
					resolver, node, match,
				};

				return eval_in_context(sub_context, code)
			});
		});


		add_rule(tp_main_processor, 'tree processor[:] «data path»', (resolver, node, match, { data_path }) => {
			const target = data_path.trim();
			const target_processor = new O.Tree_Processor(target);
			set_by_path(context, target, target_processor)
			context_stack.push( { target_processor });
			tp_definition_processor.process_tree(node.body);
			context_stack.pop();
			return target_processor;
		});

		add_rule(tp_main_processor, 'amend processor[:] «data path»', (resolver, node, match, { data_path }) => {
			const target = data_path.trim();
			const target_processor = get_by_path(context, target);
			context_stack.push( { target_processor });
			tp_definition_processor.process_tree(node.body);
			context_stack.pop();
			return target_processor;
		});

		add_rule(tp_main_processor, 'amend main processor[:]', (resolver, node, match) => {
			const target_processor = tp_main_processor;
			context_stack.push( { target_processor });
			tp_definition_processor.process_tree(node.body);
			context_stack.pop();
			return target_processor;
		});

		add_rule(tp_main_processor, 'execute[:]', (resolver, node, match) => {
			const sub_context = {
				...context,
				resolver, node, match,
			};

			exec_in_context(sub_context, node.body.to_text());
		});

		add_rule(tp_main_processor, 'note[:] «pattern»', (resolver, node, match) => {
			// Notes do nothing
		});

		add_rule(tp_main_processor, 'set namespace[:] «pattern»', (resolver, node, match) => {
			console.warn('Set namespace not implemented');
		});

		add_rule(tp_main_processor, 'record table[:] «data path»', (resolver, node, match, { data_path }) => {
			return create_records_from_raster_table(context, data_path, records_tree, node.body.to_text());
		});

		add_rule(tp_main_processor, 'symbol table[:] «data path»', (resolver, node, match, { data_path }) => {
			return create_symbols_from_raster_table(context, data_path, symbol_tree, node.body.to_text());
		});


		add_rule(tp_main_processor, 'constructor based dispatch table[:]', (resolver, node, match, { data_path }) => {
			return create_dispatchers_from_raster_table(context, dispatch_tree, node.body.to_text());
		});

		add_rule(tp_main_processor, 'process block using «data path»[:]', (resolver, node, match, { data_path }) => {
			// For this demo we assume data_path is only one name
			const target = data_path.trim();
			const processor = context[target];
			return processor.process_tree(node.body);
		});


		//TODO - we should create a generic-parser so that we may switch to sub tokenizers
		//		we should also harmonize local contexts - maybe write helper functions
		add_rule(tp_main_processor, 'regex tokenizer[:] «data path»', (resolver, node, match, { data_path }) => {
			const target = data_path.trim();
			const target_tokenizer = new Advanced_Regex_Tokenizer(target);
			set_by_path(context, target, target_tokenizer)
			context_stack.push( { target_tokenizer });
			tp_tokenizer_processor.process_tree(node.body);
			context_stack.pop();
			return target_tokenizer;
		});


		add_rule(tp_main_processor, 'text tree[:] «data path»', (resolver, node, match, { data_path }) => {
			const target = data_path.trim();
			set_by_path(context, target, node.body)
			return node.body;	//TODO - reference object?
		});

		add_rule(tp_tokenizer_processor, 'capture «comma separated identifiers»[:] «pattern»', (resolver, node, match, { identifiers, pattern }) => {
			const split_identifier = identifiers.split(/,/).map(e => e.trim());
			const { target_tokenizer } = context;
			target_tokenizer.add_rule(new R.Resolution_Rule(new C.Regex_Condition( eval(pattern) ), (...captures) => {
				const local_context = {...context, tokenizer: target_tokenizer};
				split_identifier.map((e, i) => {
					local_context[e] = captures[i];
				});
				return eval_in_context(local_context, `{${node.body.to_text()}}`);

			}));
		});

		add_rule(tp_tokenizer_processor, 'match[:] «pattern»', (resolver, node, match, { pattern }) => {
			context.target_tokenizer.add_rule(new R.Resolution_Rule(new C.Regex_Condition( eval(pattern) ), () => {
				const local_context = {...context};
				return eval_in_context(local_context, `{${node.body.to_text()}}`);

			}));
		});

		add_rule(tp_tokenizer_processor, 'default[:]', (resolver, node, match) => {
			context.target_tokenizer.add_rule(new R.Default_Rule((text) => {
				const local_context = {...context, text};
				return eval_in_context(local_context, `{${node.body.to_text()}}`);
			}));
		});


		//TODO - better schema
		Object.assign(context, { add_rule, add_default_rule, parse_pattern });
		return {
			add_rule, add_default_rule, records_tree, dispatch_tree, parse_pattern, context, context_stack,
			//TODO - maybe move processors inteo context?
			processors: {
				tp_main_processor, tp_definition_processor, tp_tokenizer_processor
			},
		};



	}


	//TODO - move to data/object
	function get_by_path(context, path) {	//export
		let ptr = context;
		for (const piece of path.split(/\./)) {
			const pending_ptr = ptr[piece];
			if (pending_ptr === undefined) {
				throw new Error(`No ${inspect(piece)} in ${inspect(ptr)}`);
			}
			ptr = pending_ptr;
		}
		return ptr;
	}

	//TODO - move to data/object
	function set_by_path(context, path, value) {	//export
		let ptr = context;
		const parts = path.split(/\./);
		const final_name = parts.pop();
		for (const key of parts) {
			if (!(key in ptr)) {
				ptr[key] = {};
			}
			ptr = ptr[key];
		}
		ptr[final_name] = value;
	}
}
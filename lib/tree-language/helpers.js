import { Namespace } from './context.js';
import { load_ditto_raster } from '../table/data-table.js';
import { tokenize_block } from '../parsing/regexp-tokenizer.js';
import { record_factory } from './templates.js';

import * as C from '../data/conditions.js';
import * as R from '../data/rules.js';


/* AUTHOR COMMENTARY: We are kinda transitioning from functions with traditional arguments to
		functions that just have a context and get everything it needs from there.
		On the way we end up with functions neither here nor there.
		I think that is fine early on but long term plan might be to select on or the other.
		It could be that we have "lower level" functions that are traditional and that we have
		context based functions for higher level functions that may in turn call the lower level ones.
*/


export function create_resolver(processor_type, context, name) {
	const new_processor = new processor_type(context.resolve_path(name));
	context.set(name, new_processor);
	return new_processor;
}

export function create_namespace(context, name, description=undefined) {
	const new_namespace = new Namespace(context.resolve_path(name), description);
	context.set(name, new_namespace);
	return new_namespace;
}

export function register_types(context, type_list) {

	for (const type of type_list) {
		context.set(type.name, type);
	}
}

export function assert_valid_code(code) {
	eval(`if (false) { ${code} }`);
}

export function check_if_valid_code(code, return_error=false) {
	try {
		eval(`if (false) { ${code} }`);
		return true;
	} catch (e) {
		return return_error ? e : false;
	}
}


class Prepared_Expression {
	constructor(code, scope_names=[], treat_as_function=false) {
		Object.assign(this, { code, scope_names, treat_as_function });
	}

	to_function() {
		const { code, scope_names, treat_as_function } = this;
		if (treat_as_function) {
			return new Function(...scope_names, code);
		} else {
			return new Function(...scope_names, `return ${code}`);
		}
	}
}

const [ILLEGAL_RETURN_NAME, ILLEGAL_RETURN_MESSAGE] = (() => {
	const error = check_if_valid_code('return;', true);
	return [error.name, error.message];
})();

export function is_illegal_return_statement(code) {
	const error = check_if_valid_code(code, true);
	return (error.name === ILLEGAL_RETURN_NAME) && (error.message === ILLEGAL_RETURN_MESSAGE);
}

export function prepare_expression_for_eval(code, scope_names=[], promote_to_function=true) {
	const treat_as_function = promote_to_function && is_illegal_return_statement(code);
	return new Prepared_Expression(code, scope_names, treat_as_function);
}




export function create_placeholder_patterns(efforting, raster_table) {
	const resolver = efforting.get('GR.tree_language.pattern_to_capture');
	const pattern_tokenizer = efforting.get('TK.tree_language.pattern');
	const get_placeholders = efforting.get('F.tree_language.pattern.get_placeholders');
	const table = load_ditto_raster(raster_table, 'pattern');

	for (const {pattern, regex, captures, repeat_ws_cs} of table) {
		const pattern_tokens = tokenize_block(pattern_tokenizer, pattern);
		const placeholder_names = get_placeholders(pattern_tokens).map(p => p.value);



		if (placeholder_names.length === 0) {
			console.log("Primitive pattern", regex);



			//Answers such as regex, captures, repeat_ws_cs can always be late evaluated


/*			const flattened_sub_context = efforting.sub_context('SC.tree_language.placeholder_expression_scope').anonymous_sub_context({
				resolve: function resolve(item) {
					return resolver.resolve(item);
				}
			});

*/


		} else {
			console.log("Composed pattern", regex);
		}

		/*
		//NOTE: In this experiment I confused myself into doing sequential matching here - but this should be regex matching!
		resolver.rules.push(new R.Resolution_Rule(new C.Sequence(pattern_tokens, sequence_comparator), (resolver, item, match) => {
			console.log("Sequence matches!", resolver, item);
		}));
		*/

		/*

		//console.log(pattern, [regex, check_if_valid_code(regex)], [captures, check_if_valid_code(captures)], [repeat_ws_cs, check_if_valid_code(repeat_ws_cs)]);


		const sub_context_names = [...Object.keys(flattened_sub_context)];
		const sub_context_values = [...Object.values(flattened_sub_context)];
		const prepared_regex = prepare_expression_for_eval(regex, sub_context_names).to_function();

		console.log(prepared_regex(sub_context_values))
		*/


		//console.log(prepare_expression_for_eval(regex).to_function()());


	}
	console.log('TODO', resolver)


}

export function create_records(target_context, raster_table, evaluation_context=target_context) {

	const table = load_ditto_raster(raster_table, 'name');
	const pieces = [
		'() => {',
		'const result = {};'
	];

	for (const {name, members} of table) {
		const member_definitions = members.split(/\n|,/).map(e => e.trim());
		const member_names = member_definitions.map(e => e.match(/(\w+)(:?=|$)/)[1] );
		const joined_member_definitions = member_definitions.join(', ');
		const joined_member_names = member_names.join(', ');
		const class_def = record_factory.render({name, joined_member_definitions, joined_member_names});
		pieces.push(`result.${name} = ${class_def}`);
	}

	pieces.push(
		'return result;',
		'}'
	);

	const records = evaluation_context.evaluate(pieces.join('\n'))();

	for (const record of Object.values(records)) {
		target_context.set(record.name, record);
	}

	return records
}


export function create_constructor_based_dispatchers(target_context, raster_table, evaluation_context=target_context) {

	const table = load_ditto_raster(raster_table, 'name');
	for (const { name, constructor, expression } of table) {
		console.log(evaluation_context.evaluate(constructor));



		/* console.log(context.anonymous_sub_context({
			item: [123, 456],
		}).evaluate(expression)); */

	}

}

export function create_basic_parsing_system(target_context, raster_table, evaluation_context=target_context) {

	const table = load_ditto_raster(raster_table, 'pattern');
	for (const { parser, pattern, captures, operation } of table) {


		console.log(parser);

		/* console.log(context.anonymous_sub_context({
			item: [123, 456],
		}).evaluate(expression)); */

	}
}
import { Namespace } from './context.js';
import { load_ditto_raster } from '../table/data-table.js';
import { tokenize_block } from '../parsing/regexp-tokenizer.js';
import { record_factory } from './templates.js';

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


export function create_placeholder_patterns(efforting, resolver, raster_table) {

	const pattern_tokenizer = efforting.get('TK.tree_language.pattern');
	//const get_placeholders = efforting.get('F.tree_language.pattern.get_placeholders');
	const table = load_ditto_raster(raster_table, 'pattern');

	console.log('TODO', resolver)
	for (const {pattern, regex, captures, repeat_ws_cs} of table) {
		const pattern_tokens = tokenize_block(pattern_tokenizer, pattern);

		/*
		const placeholder_names = get_placeholders(pattern_tokens).map(p => p.value);
		//console.log(pattern, [regex, check_if_valid_code(regex)], [captures, check_if_valid_code(captures)], [repeat_ws_cs, check_if_valid_code(repeat_ws_cs)]);

		const flattened_sub_context = efforting.sub_context('SC.tree_language.placeholder_expression_scope').anonymous_sub_context({
			resolve: function resolve() { console.log("REsOlvE!") },
		}).flatten();

		const sub_context_names = [...Object.keys(flattened_sub_context)];
		const sub_context_values = [...Object.values(flattened_sub_context)];
		const prepared_regex = prepare_expression_for_eval(regex, sub_context_names).to_function();

		console.log(prepared_regex(sub_context_values))
		*/


		//console.log(prepare_expression_for_eval(regex).to_function()());


	}


}

export function create_records(context, raster_table) {
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

	//TODO - use context
	const records = eval(pieces.join('\n'))();

	for (const record of Object.values(records)) {
		context.set(record.name, record);
	}

	return records
}

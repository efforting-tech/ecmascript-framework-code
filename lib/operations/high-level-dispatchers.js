import { load_ditto_raster } from '../table/data-table.js';
import { Dotted_Tree_Directory } from '../data/object.js';
import { Constructor_Based_Mapping_Processor } from '../data/dispatchers.js';
import { exec_in_context, eval_in_context } from '../data/context.js';


export function create_record_descriptors_from_table(table) {
	const result = [];
	for (const [name, group, member_text] of table) {
		const member_definitions = member_text.split(/\n|,/).map(e => e.trim());
		const path = group.length ? `${group}.${name}` : name;
		const member_names = member_definitions.map(e => e.match(/(\w+)(:?=|$)/)[1] );

		const descriptor = {
			name, group, path, member_definitions, member_names
		};

		result.push(descriptor);
	}
	return result;
}


export function create_dispatch_descriptors_from_table(table) {
	const result = [];
	for (const [name_and_args, group, constructor, expression] of table) {
		const [name, args] = name_and_args.match(/(\w+)(?:\((.*)\))?/).slice(1);
		const arg_entries = args.split(/\n|,/).map(e => e.trim());
		const marked_entries = arg_entries.map((e, i) => [e.match(/§(.*)/), i]).filter(([e, i]) => e);
		const path = group.length ? `${group}.${name}` : name;

		const signature_arguments = [...arg_entries];
		let main_argument = null;
		if (marked_entries.length > 1) {
			throw new Error('Can only mark one');
		} else if (marked_entries.length == 1) {
			arg_entries.splice(marked_entries[0][1], 1);
			signature_arguments[marked_entries[0][1]] = marked_entries[0][0][1];
			main_argument = marked_entries[0][0][1];
		} else {
			[main_argument] = arg_entries.splice(0, 1);
		}

		const key = `${path}(${args})`;
		const descriptor = {
			name, group, path, constructor, expression, arg_entries, main_argument, key, signature_arguments
		};

		result.push(descriptor);
	}
	return result;
}

export function create_record_tree_from_descriptors(context, records_tree, pending_records) {
// Create records
	for (const { path, name, member_definitions, member_names } of pending_records) {
		const joined_member_definitions = member_definitions.join(', ');
		const joined_member_names = member_names.join(', ');
		const code = `
			const __t = class ${name} {
				constructor(${joined_member_definitions}) {
					Object.assign(this, { ${joined_member_names} });
				}
			};
			__rt.set(${JSON.stringify(path)}, __t);
			if (__flat.${name} !== undefined) {
				throw new Error('Name clash');
			}
			__flat.${name} = __t;
		`;

		exec_in_context({
			...context,
			__rt: records_tree,
			__flat: context,
		}, code);
	}
	return records_tree;

}

export function create_dispatch_tree_from_descriptors(context, dispatch_tree, pending_dispatchers) {
	// Collate rules
	const pending_collated_dispatchers = {};
	for (const { path, name, constructor, expression, arg_entries, main_argument, signature_arguments, key } of pending_dispatchers) {
		let target = pending_collated_dispatchers[path];
		if (target === undefined) {
			pending_collated_dispatchers[path] = target = { name, path, key, main_argument, arg_entries, signature_arguments, rules: [] };
		} else {
			if (target.key !== key) {
				throw new Error('key mismatch');
			}
		}
		target.rules.push({ constructor, expression });
	}


	// Create dispatch functions
	for (const { path, name, main_argument, arg_entries, signature_arguments, rules } of Object.values(pending_collated_dispatchers)) {
		const joined_signature_arguments = signature_arguments.join(', ');
		const joined_arg_entries = arg_entries.join(', ');

		let code = `
			const __d = new Constructor_Based_Mapping_Processor(${JSON.stringify(path)});
			__dt.set(${JSON.stringify(path)}, __d);
			if (__flat.${name} !== undefined) {
				throw new Error('Name clash');
			}
			__flat.${name} = function ${name}(${joined_signature_arguments}) {
				return __d.process({${joined_arg_entries}}, ${main_argument})
			}
		`.trimRight();

		for (const { expression, constructor } of rules) {
			if (arg_entries.length > 0) {
				code += `\n__d.register(${constructor}, ({${joined_arg_entries}}, __processor__, ${main_argument}) => (${expression}));`
			} else {
				code += `\n__d.register(${constructor}, (__context__, __processor__, ${main_argument}) => (${expression}));`
			}
		}

		exec_in_context({
			...context,
			Constructor_Based_Mapping_Processor,
			__dt: dispatch_tree,
			__flat: context,
		}, code);

	}
	return dispatch_tree;
}

export function create_dispatchers_from_raster_table(context, dispatch_tree, raster) {
	const dispatchers = load_ditto_raster(raster);
	const pending_dispatchers = create_dispatch_descriptors_from_table(dispatchers);
	//TODO - rename function to reflect that it is adding to the tree
	create_dispatch_tree_from_descriptors(context, dispatch_tree, pending_dispatchers);
}

export function create_records_from_raster_table(context, records_tree, raster) {
	const records = load_ditto_raster(raster, 'name');
	const pending_records = create_record_descriptors_from_table(records);
	//TODO - rename function to reflect that it is adding to the tree
	create_record_tree_from_descriptors(context, records_tree, pending_records);
}
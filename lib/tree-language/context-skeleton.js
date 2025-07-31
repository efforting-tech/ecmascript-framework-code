import { create_namespace, register_types } from './helpers.js';
import { Namespace } from './context.js';
import { Capture, Capture_Regex } from './types.js';


export function install_context_skeleton(system) {
	const root = system.sub_context();
	create_namespace(root, 'efforting');

	const efforting = system.sub_context('efforting');

	create_namespace(efforting, 'F', 'Functions');
	create_namespace(efforting, 'P', 'Processors');
	create_namespace(efforting, 'T', 'Types');
	create_namespace(efforting, 'TP', 'Tree Processing');
	create_namespace(efforting, 'GR', 'Generic Resolving');
	create_namespace(efforting, 'RT', 'Record Types');
	create_namespace(efforting, 'RE', 'Regular Expressions');
	create_namespace(efforting, 'S', 'Symbols');
	create_namespace(efforting, 'C', 'Conditions');
	create_namespace(efforting, 'O', 'Operators');
	create_namespace(efforting, 'R', 'Rules');
	create_namespace(efforting, 'M', 'Match Objects');

	create_namespace(efforting, 'TP.tree_language');
	create_namespace(efforting, 'GR.tree_language');
	create_namespace(efforting, 'P.tree_language');
	create_namespace(efforting, 'T.tree_language');

	create_namespace(efforting, 'S.tree_language');
	create_namespace(efforting, 'S.tree_language.Namespace');

	register_types(efforting.sub_context('T.tree_language'), [
		Namespace,
		Capture, Capture_Regex,
	]);


	efforting.set_multiple([

		['S.tree_language.Namespace.NAME', Namespace.NAME],
		['S.tree_language.Namespace.DESCRIPTION', Namespace.DESCRIPTION],
	]);


}

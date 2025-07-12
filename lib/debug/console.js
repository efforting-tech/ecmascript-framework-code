import { inspect } from 'util';

export function Debug(...pieces) {
	return;	//TODO - decide if we should instance these functions or not based on environment/config

	const result = ['Debug: '];

	for (const p of pieces) {
		result.push(inspect(p, { colors: true, depth: null }));
	}

	console.log(result.join(' '));
}
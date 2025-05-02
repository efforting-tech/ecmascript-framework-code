import { inspect } from 'util';

export function Debug(...pieces) {
	const result = ['Debug: '];

	for (const p of pieces) {
		result.push(inspect(p, { colors: true, depth: null }));
	}

	console.log(result.join(' '));
}
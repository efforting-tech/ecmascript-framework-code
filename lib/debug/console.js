import { inspect } from 'util';

//TODO - deprecate
export function Debug(...pieces) {
	throw new Error('deprecated');
	return;	//TODO - decide if we should instance these functions or not based on environment/config

	const result = ['Debug: '];

	for (const p of pieces) {
		result.push(inspect(p, { colors: true, depth: null }));
	}

	console.log(result.join(' '));
}

export function dump(item) {
	console.log(inspect(item, { colors: true, depth: null }));
}

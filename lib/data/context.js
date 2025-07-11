// Note - we have similar functions in templates/context.js - we may later want to harmonize this

export function eval_in_context(context, expression) {
	const keys = Object.keys(context);
	const code = `({ ${keys} }) => ${expression}`;
	return eval(code)(context);
}

export function exec_in_context(context, expression) {
	const keys = Object.keys(context);
	const code = `({ ${keys} }) => { ${expression} }`;
	eval(code)(context);
}


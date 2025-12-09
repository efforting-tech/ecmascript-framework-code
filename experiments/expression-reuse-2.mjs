import { inspect } from 'node:util'

// In this experiment we try to improve our contracts a bit regarding the compositions
//	For instance, we will not have rendered_expressions that contain additional functions and such - we should try to manage these things from the "outside" instead



class Scope_Manager {
	constructor(scope={}) {
		Object.assign(this, { scope });
	}

	get names() {
		return Object.keys(this.scope).join(', ');
	}

	get values() {
		return Object.values(this.scope);
	}

	// Create arrow function code based on the names of this scope manager
	create_arrow_function_code(expression) {
		return `(${this.names}) => (${expression})`;
	}

	// Create an anonymous function based on the names of this scope manager
	// This function specifically exprects an expression and not a full function body - we should separate concerns of function/expression nodes and scope manager
	implement_function(expression) {
		return new Function(this.names, `return ${expression};`);
	}

	create_arrow_function(expression, sub_scope={}) {
		const sm = new this.constructor(sub_scope);
		return sm.eval_expression(this.create_arrow_function_code(expression));
	}


	eval_expression(expression) {
		const f = this.implement_function(expression);
		return f(...this.values);
	}

}


const m = new Scope_Manager();

console.log(
	m.create_arrow_function('hello.toUpperCase()', {hello: 'World'})
)




function scoped_eval(expression, scope=undefined) {
	const local_scope = {};
	if (scope) {
		Object.assign(local_scope, scope);
	}

	const names = Object.keys(local_scope);
	const values = Object.values(local_scope);
	const joined_names = names.join(', ');

	const local_code = (
		`(${joined_names}) => {\n` +
			`return ${expression};\n` +
		`}`
	);

	return eval(local_code)(...values);
}

function expression_to_scoped_function(arguments_, body, scope=undefined) {
	const local_scope = {};
	if (scope) {
		Object.assign(local_scope, scope);
	}

	const names = Object.keys(local_scope);
	const values = Object.values(local_scope);
	const joined_names = names.join(', ');
	const joined_arguments = arguments_.join(', ');

	const local_code = (
		`(${joined_names}) => {\n` +
			`return function (${joined_arguments}) {\n` +
				`return ${body};\n` +
			`};\n` +
		`}`
	);

	return eval(local_code)(...values);
}


function body_to_scoped_function(arguments_, body, scope=undefined) {
	const local_scope = {};
	if (scope) {
		Object.assign(local_scope, scope);
	}

	const names = Object.keys(local_scope);
	const values = Object.values(local_scope);
	const joined_names = names.join(', ');
	const joined_arguments = arguments_.join(', ');

	const local_code = (
		`(${joined_names}) => {\n` +
			`return function (${joined_arguments}) {\n` +
				`${body};\n` +
			`};\n` +
		`}`
	);

	return eval(local_code)(...values);
}

function named_multi_eval(named_expressions, scope=undefined) {
	const local_scope = {};
	if (scope) {
		Object.assign(local_scope, scope);
	}

	const names = Object.keys(local_scope);
	const values = Object.values(local_scope);
	const joined_names = names.join(', ');
	const code = named_expressions.map(([name, value]) => value).join('\n\n');
	const expression_names = named_expressions.map(([name, value]) => name).join(', ');

	const local_code = (
		`(${joined_names}) => {\n` +
			`${code}\n` +
		`	return { ${expression_names} };\n` +
		`}`
	);

	return eval(local_code)(...values);
}



class Expression {
	constructor(expression, context) {
		Object.assign(this, { expression, context });
	}

	bind(locals) {
		return new this.constructor(this.render(), locals);
	}

	render(override) {
		const context = {...this.context, ...override};

		let { expression } = this;
		const pending_functions = [];

		for (const [key, value] of Object.entries(context)) {
			const pattern = new RegExp(`\\b${RegExp.escape(key)}\\b`, 'g');
			const value_type = typeof value;
			const value_constructor = value.constructor;
			let rendered_value;
			if (value_type === 'string') {
				rendered_value = `(${value})`;
			} else if (value_type === 'number') {
				rendered_value = value.toString();
			} else if (value_constructor === this.constructor) {
				rendered_value = `(${value.render(override)})`;
			} else if (value_constructor === Function) {
				pending_functions.push(value);
				rendered_value = value.name;
			} else {
				throw new Error(inspect(value));
			}

			expression = expression.replaceAll(pattern, rendered_value);
		}
		return expression;
	}

}

/*
const e = new Expression('x**2', {x: 'varx'});
const f = new Expression('x + x', {x: e});

console.log(f.render())						// varx**2 + varx**2
console.log(f.render({x: 'pop'}))			// pop + pop
console.log(f.render({varx: 'crackle'}))	// crackle**2 + crackle**2
*/


function check_circle(cx, cy, cr, x, y) {
	const sq_dis = (cx - x) ** 2 + (cy - y) ** 2;
	if (cr > 0 ) {
		return sq_dis < cr ** 2;
	} else {
		return sq_dis >= cr ** 2;
	}
}


function circle(cx=0, cy=0, cr=1.0, x='x', y='y') {
	//NOTE: Both these are good options - one gives an expression, another defers check to a function, but, for a more complete code synthesizer
	//		this circle-function should be a higher level "circle" object that also has configuration, this configuration could determine runtime or compile time specifics
	//return new Expression('(cx - x) ** 2 + (cy - y) ** 2 < cr ** 2', { cx, cy, cr, x, y });
	return new Expression(`F(cx, cy, cr, x, y)`, { cx, cy, cr, x, y, F: check_circle });
}

function rectangle(rx=0, ry=0, rw=1.0, rh=1.0, x='x', y='y') {
	return new Expression('x >= rx && x <= (rx + rw) && y >= ry && y <= (ry + rh)', { rx, ry, rw, rh, x, y });
}


function vertical_capsule(cx, cy, cw, ch, x='x', y='y') {
	return union(
		circle('cx + cw * .5', 'cy + cw * .5', 'cw * .5'),
		circle('cx + cw * .5', 'cy + ch - cw * .5', 'cw * .5'),
		rectangle(cx, 'cy + cw * .5', cw, 'ch - cw'),
	).bind({ cx, cy, cw, ch, x, y })
}

function union(...sub_expressions) {
	const e = sub_expressions.map((e, i) => `_${i}`).join(' || ');
	const c = Object.fromEntries(sub_expressions.map((e, i) => [`_${i}`, e]));
	return new Expression(e, c);
}


//console.log(circle('cx + cw*.5', 'cy + cw*.5', 'cw').render({cx: 100, cy: 200, cw: 11}))
//process.exit();

//const e = union(circle(20, 10, 10), circle(70, 20, 10));


const e = vertical_capsule(10, 15, 30, 80)
//const e = circle(25, 30, -15)
console.log(e);


const re = e.render();

//const pending_function_definitions = re.additional_functions.map(f => [f.name, `${f.toString()}\n`]);
//pending_function_definitions.push(['circle', re.create_function_factory('circle', ['x', 'y'])])

//const f = named_multi_eval(pending_function_definitions, {hello: 'world'}).circle;

const f = expression_to_scoped_function(['x', 'y'], re);

console.log(f);


//const f = new Function('x, y', `return ${e.render()};`);

for (let y=0; y < 120; y+=2) {
	let line = '';
	for (let x=0; x<50; x+=1) {
		line += f(x, y) ? '#' : '·';
	}
	console.log(line);
}




import { inspect } from 'node:util'

// Focusing on scope manager - function/expression nodes and integration with stuff in lib/tree-language/helpers.js

class Signature {
	constructor(parameters=[]) {
		Object.assign(this, { parameters });
	}

	get names() {
		//TODO - handle non strings
		return this.parameters.join(', ');
	}

	get name_list() {
		//TODO - handle non strings
		return this.parameters;
	}

	static from_anything(item) {
		if (item.constructor === this) {
			return item;
		} else if (Array.isArray(item)) {
			return new this(item);
		} else if (typeof item === 'string') {
			//TO DOCUMENT: This is a very naive approach - use presplit args for better control
			//	features like this might be marked "bootstrap features" since they are mostly going to be used to build our foundation
			return new this(item.split(',').map(e => e.trim()));
		} else {
			throw new Error(inspect(item));
		}
	}
}

class Scope_Manager {
	constructor(scope={}) {
		Object.assign(this, { scope });
	}


	static from_anything(item) {
		if (item.constructor === this) {
			return item;
		} else {
			return new this(item);
		}
	}

	get names() {
		return Object.keys(this.scope).join(', ');
	}

	get name_list() {
		return Object.keys(this.scope);
	}

	get values() {
		return Object.values(this.scope);
	}

}

class Abstract_Fragment {
	constructor(fragment, definition_scope=new Scope_Manager()) {
		Object.assign(this, { fragment, definition_scope: Scope_Manager.from_anything(definition_scope) });
	}

	get code() {
		throw new Error(`Abstract getter "code" not implemented for ${inspect(this)}`);
	}

	//TODO - decide if this should be a thing
	get implementation_code() {
		throw new Error(`Abstract getter "implementation_code" not implemented for ${inspect(this)}`);
	}

	implement() {
		const { values } = this.definition_scope;
		return this.implementation_function(...values);
	}

}


class Abstract_Expression_Fragment extends Abstract_Fragment {
	get implementation_function() {
		//NOTE - this.code is always returnable becuase it is an expression
		const { name_list } = this.definition_scope;
		return new Function(...name_list, `return ${this.code}`);
	}
}

class Expression_Fragment extends Abstract_Expression_Fragment {
	get code() {
		return this.fragment;
	}

}


class Function_Fragment extends Abstract_Expression_Fragment {
	constructor(parameters, body, name=undefined, definition_scope=new Scope_Manager()) {
		super(body, definition_scope);
		Object.assign(this, { name, parameters: Signature.from_anything(parameters) });
	}

	get code() {
		const { names } = this.parameters;
		const name_def = this.name ? ` ${this.name}` : '';
		return `function${name_def}(${names}) {\n${this.fragment}\n}`;
	}

}

class Arrow_Function_Fragment extends Abstract_Expression_Fragment {
	constructor(parameters, body, definition_scope=new Scope_Manager()) {
		super(body, definition_scope);
		Object.assign(this, { parameters: Signature.from_anything(parameters) });
	}

	get code() {
		const { names } = this.parameters;
		return `(${names}) => ${this.fragment}`;
	}

}


// const e1 = (a, b) => ( a * b );
// const e2 = (a, b) => { return a * b };
// const e3 = (a, b) => { return (a * b) };
// const e4 = (a, b) => ({ return a * b });   // Invalid


const f = new Arrow_Function_Fragment('greeting', '`${greeting} ${hello.toUpperCase()}`', {hello: 'World'})
console.log(f.code)
console.log(f.implement()('Yo'))	// 'Yo WORLD'
console.log();

const g = new Function_Fragment('greeting', 'return `${greeting} ${hello.toUpperCase()}`', null, {hello: 'Everyone'})
console.log(g.code)
console.log(g.implement()('Yo'))	// 'Yo EVERYONE'
console.log();

const h = new Expression_Fragment('`${greeting} ${hello.toUpperCase()}`', {hello: 'folks', greeting: 'HeLLo'})
console.log(h.code)
console.log(h.implement())	// 'heLLo FOLKS'
console.log();


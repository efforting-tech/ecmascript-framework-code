import { Dotted_Tree_Directory, POSIX_Tree_Directory } from '../data/object.js';
import { inspect } from 'node:util';

export class POSIX_Context {
	constructor(system, working_path='/') {
		Object.assign(this, { system, working_path });
	}

	*dir(glob=null) {
		if (glob) {
			throw new Error('Not implemented yet');	//TODO - Implement
		}
		const { system, working_path } = this;
		const dir = system.posix_root.get_dir(working_path);
		for (const entry of dir?.children?.values()) {
			yield entry;
		}
	}

	write(path, data) {
		const { system, working_path } = this;
		system.posix_root.write(system.posix_root.constructor.resolve_path(working_path, path), data);
	}

	sub_context(working_path='./') {
		return new this.constructor(this.system,
			POSIX_Tree_Directory.resolve_path(this.working_path, working_path),
		);
	}

}

export class Anonymous_Context {
	constructor(locals={}, parent=undefined) {
		Object.assign(this, { locals, parent });
	}

	flatten() {
		const { parent, locals } = this;
		const result = parent === undefined ? {} : parent.flatten();
		Object.assign(result, locals);
		result.context = this;	//Automatically assign context by protocol (configurable?)
		return result;
	}

	//TODO: DRY-SSoT
	evaluate(expression) {
		const context = this.flatten();
		const keys = Object.keys(context);
		const parameters = keys.join(', ');
		return eval(`(${parameters}) => ${expression}`)(...Object.values(context));
	}

	execute(statement) {
		const context = this.flatten();
		const keys = Object.keys(context);
		const parameters = keys.join(', ');
		return eval(`(${parameters}) => { ${statement} }`)(...Object.values(context));
	}

}

export class Program_Context {
	constructor(system, working_path='') {
		Object.assign(this, { system, working_path });
	}


	*dir(glob=null) {
		if (glob) {
			throw new Error('Not implemented yet');	//TODO - Implement
		}
		const { system, working_path } = this;
		const dir = system.program_root.get_dir(working_path);
		for (const entry of dir?.children?.values()) {
			yield entry;
		}

	}

	get_dir(relative='') {
		const { system, working_path } = this;
		return system.program_root.get_dir(Dotted_Tree_Directory.resolve_path(working_path, relative));
	}

	resolve_path(relative='') {
		const { working_path } = this;
		return Dotted_Tree_Directory.resolve_path(working_path, relative)
	}

	assign(object) {
		const { system, working_path } = this;
		for (const [key, value] of Object.entries(object)) {
			system.program_root.set(system.program_root.constructor.resolve_path(working_path, key), value);
		}
	}

	set_multiple(iterator) {
		for (const [path, data] of iterator) {
			this.set(path, data);
		}
	}

	mkdir(path) {
		const { system, working_path } = this;
		return system.program_root.mkdir(system.program_root.constructor.resolve_path(working_path, path));
	}

	//TODO - here could be a good place to put in weak/strong behavior as an optional feature of a context
	set(path, data) {
		const { system, working_path } = this;
		system.program_root.set(system.program_root.constructor.resolve_path(working_path, path), data);
	}

	get(path) {
		const { system, working_path } = this;
		return system.program_root.get(system.program_root.constructor.resolve_path(working_path, path));
	}

	require(path) {
		const { system, working_path } = this;
		const result = system.program_root.get(system.program_root.constructor.resolve_path(working_path, path));
		if (result === undefined) {
			throw new Error(`Can't find ${path} in ${this}.`)
		}
	}

	sub_context(working_path='') {
		return new this.constructor(this.system,
			Dotted_Tree_Directory.resolve_path(this.working_path, working_path)
		);
	}

	anonymous_sub_context(updates={}) {
		return new Anonymous_Context(updates, this);
	}


	flatten() {
		const result = {};
		const { system, working_path } = this;
		const concrete_program_dir = system.program_root.get_concrete_dir(working_path);
		const root = concrete_program_dir.root;
		let ptr = root;
		let result_ptr = result;
		for (const piece of concrete_program_dir.pieces) {
			ptr.to_object(result_ptr);
			ptr = ptr.get_dir(piece);
			const pending_result_ptr = result_ptr[piece];
			if (pending_result_ptr === undefined) {
				result_ptr[piece] = {};
				result_ptr = {};
			} else {
				result_ptr = pending_result_ptr;
			}
		}
		ptr.to_object(result_ptr);
		result.context = this;	//Automatically assign context by protocol (configurable?)
		return result;
	}

	evaluate(expression) {
		const context = this.flatten();
		const keys = Object.keys(context);
		const parameters = keys.join(', ');
		return eval(`(${parameters}) => ${expression}`)(...Object.values(context));
	}

	execute(statement) {
		const context = this.flatten();
		const keys = Object.keys(context);
		const parameters = keys.join(', ');
		return eval(`(${parameters}) => { ${statement} }`)(...Object.values(context));
	}
}

export class User_Context extends Program_Context {

	flatten() {
		//NOTE: This is the place to add scope customization hooks
		const result = {};
		const globals = super.flatten();

		Object.assign(result, globals.base_scope);	// Add base scope
		Object.assign(result, globals);				// Add upstream globals
		this.get_dir().to_object(result);		// Add local children
		result.context = this;

		return result;
	}

}



export class Namespace {
	static NAME = Symbol('NAME');
	static DESCRIPTION = Symbol('DESCRIPTION');

	constructor(name, description=undefined) {
		const { NAME, DESCRIPTION } = this.constructor;
		this[NAME] = name;
		this[DESCRIPTION] = description;
	}

	[inspect.custom](depth, options, inspect) {
		const { NAME, DESCRIPTION } = this.constructor;
		const description = this[DESCRIPTION];
		const name = this[NAME];
		if (description) {
			return `${this.constructor.name}(${inspect(name, options)}, ${inspect(description, options)})`;
		} else {
			return `${this.constructor.name}(${inspect(name, options)})`;
		}
	}
}



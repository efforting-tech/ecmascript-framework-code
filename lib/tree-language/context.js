import { Dotted_Tree_Directory, POSIX_Tree_Directory } from '../data/object.js';

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

	write(path, data) {
		const { system, working_path } = this;
		system.program_root.set(system.program_root.constructor.resolve_path(working_path, path), data);
	}

	sub_context(working_path='') {
		return new this.constructor(this.system,
			Dotted_Tree_Directory.resolve_path(this.working_path, working_path)
		);
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
			result_ptr = result_ptr[piece];
		}
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
		const locals = super.flatten();

		Object.assign(result, locals.base_scope);
		Object.assign(result, locals);

		return result;
	}

}

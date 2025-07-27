import { Dotted_Tree_Directory, POSIX_Tree_Directory } from '../data/object.js';

export class Context {
	constructor(system, posix_working_path='/', program_working_path='') {
		Object.assign(this, { system, posix_working_path, program_working_path });
	}

	*posix_dir(glob=null) {
		if (glob) {
			throw new Error('Not implemented yet');	//TODO - Implement
		}
		const { system, posix_working_path } = this;
		const posix_dir = system.posix_root.get_dir(posix_working_path);
		for (const entry of posix_dir?.children?.values()) {
			yield entry;
		}
	}

	*program_dir(glob=null) {
		if (glob) {
			throw new Error('Not implemented yet');	//TODO - Implement
		}
		const { system, program_working_path } = this;
		const program_dir = system.program_root.get_dir(program_working_path);
		for (const entry of program_dir?.children?.values()) {
			yield entry;
		}

	}

	sub_context(posix_working_path='./', program_working_path='') {
		return new this.constructor(this.system,
			POSIX_Tree_Directory.resolve_path(this.posix_working_path, posix_working_path),
			Dotted_Tree_Directory.resolve_path(this.program_working_path, program_working_path)
		);
	}


}
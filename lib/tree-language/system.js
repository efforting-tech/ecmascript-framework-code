import { Dotted_Tree_Directory, POSIX_Tree_Directory } from '../data/object.js';
import { Context } from './context.js';


export class System {
	constructor(posix_root=new POSIX_Tree_Directory(), program_root=new Dotted_Tree_Directory()) {
		Object.assign(this, { posix_root, program_root });
	}

	sub_context(posix_working_path='/', program_working_path='') {
		return new Context(this, posix_working_path, program_working_path);
	}

}
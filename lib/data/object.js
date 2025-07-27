
function *iter_split(source, separator) {
	if (typeof source === 'string') {
		yield *source.split(separator);
	} else if (source instanceof Array) {
		for (const sub_item of source) {
			yield *iter_split(sub_item, separator);
		}
	} else {
		throw new Error(`Must be string or array, got ${source}`);
	}
}

function flattened_split(source, separator) {
	return [...iter_split(source, separator)];
}


//This will be deprecated for an improved version - the idea was to have both interface and a concrete and to adhere to DRY/SSoT but maybe we should define these orthogonally at first and then decide how to do later
//DEPRECATED
export class Path_Based_Interface {
	constructor(separator = /\./) {
		Object.assign(this, { separator });
	}

	get_path(target) {
		return null;	//Not supported for objects
	}

	get_child(target, name) {
		return target[name];
	}

	set_child(target, name, value) {
		target[name] = value;
	}

	create_child(name, parent=undefined) {
		return {};
	}

	read(target, path, default_value=undefined) {
		let ptr = target;
		const pieces = flattened_split(path, this.separator);

		for (const name of pieces) {
			if (ptr === undefined) {
				break;
			}

			ptr = this.get_child(ptr, name);
		}

		if (ptr === undefined) {
			return default_value;
		} else {
			return ptr;
		}
	}

	write(target, path, value=undefined) {	//Returns value or new child after writing it
		let ptr = target;

		const pieces = flattened_split(path, /\./);
		const final_name = pieces.pop();

		for (const name of pieces) {
			const pending = this.get_child(ptr, name);

			if (pending === undefined) {
				const new_child = this.create_child(name, ptr);
				this.set_child(ptr, name, new_child);
				ptr = new_child;
			} else {
				ptr = pending;
			}
		}

		if (value === undefined) {
			const new_child = this.create_child(final_name, ptr);
			this.set_child(ptr, final_name, new_child);
			return new_child;
		} else {
			this.set_child(ptr, final_name, value);
			return value;
		}


	}

}

//DEPRECATED
export class Basic_Dotted_Name_Tree_Interface extends Path_Based_Interface {
	static name = 'node';

	get_path(target) {
		if (target.parent) {
			return `${this.get_path(target.parent)}.${target.name}`;
		} else {
			return `${target.name}`;
		}
	}

	get_child(target, name) {
		return target.children[name];
	}

	//TODO: Maybe not make assumptions regarding overwrite policy - it should probably be two functions, like set and only_set_unset
	set_child(target, name, value) {
		if (target.children[name] !== undefined) {
			throw new Error(`${JSON.stringify(name)} already exists in ${this.constructor.name} ${JSON.stringify(this.get_path(target) ?? target.name)}`);
		}
		target.children[name] = value;
	}

	create_child(name, parent=undefined) {
		throw new Error('Function create_child() must be defined');
	}
}

//DEPRECATED
export class Basic_Dotted_Name_Tree_Object_Interface extends Basic_Dotted_Name_Tree_Interface{
	create_child(node, parent=undefined, children={}) {
		return { node, parent, children };
	}
}

//DEPRECATED
export class Basic_Dotted_Tree_Node {
	constructor(node='', parent=null, children = {}) {
		this.interface = new Basic_Dotted_Name_Tree_Object_Interface();
		this.root = { node, children, parent, value: undefined };
	}

	get(path) {
		return this.interface.read(this.root, path);
	}

	require(path) {
		return this.interface.read(this.root, path);
	}

	set(path, value) {
		this.interface.write(this.root, path).value = value;

		//console.log('set', this.interface.write(this.root, path) );
	}

}


export class Abstract_Tree_Directory {
	constructor(name, parent=null, children=new Map()) {
		Object.assign(this, { name, parent, children });
	}

	get path() {
		if (this.parent) {
			return this.constructor.join_path(this.parent.path, this.name);
		} else {
			return this.constructor.join_path(this.name);
		}
	}

	*walk() {
		yield this;
		for (const child of this.children.values()) {
			yield* child.walk();
		}
	}

	//This mkdir implies that we will create whatever is missing and existing is ok too, so it is like mkdir -pf
	mkdir(path) {
		let ptr = this;

		for (const piece of this.constructor.normalize_and_split_path(path)) {
			const pending_ptr = ptr.children.get(piece);
			if (pending_ptr) {
				ptr = pending_ptr;
			} else {
				const new_ptr = new this.constructor(piece, ptr);
				ptr.children.set(piece, new_ptr);
				ptr = new_ptr;
			}
		}
		return ptr;
	}

	rmdir(path) {
		const directory = this.get_dir(path);

		if (!directory) {
			throw Error('no such dir');	//TODO proper concrete
		}

		directory.parent.children.delete(directory.name);
		return directory;
	}


	get_dir(path) {
		let ptr = this;

		for (const piece of this.constructor.normalize_and_split_path(path)) {
			ptr = ptr.children.get(piece);
			if (!ptr) {
				return;
			}
		}
		return ptr;
	}

}



//NOTE: This will showcase a typical posix-like tree where we will always assume directories has a trailing slash
export class POSIX_Tree_Directory extends Abstract_Tree_Directory {



	static normalize_and_split_path(path) {
		const pending = [];
		for (const piece of path.split(/\//)) {
			if (piece === '.' || piece === '') {
				//pass
			} else if (piece === '..') {
				pending.pop();
			} else {
				pending.push(piece);
			}
		}

		return pending;
	}

	static join_path(...pieces) {
		let result = '';
		let final = false;
		for (const piece of pieces) {
			if (piece) {
				if (piece.at(-1) == '/') {
					result += piece;
				} else {
					result += piece + '/';
				}
			} else if (final) {
				throw new Error('Only the final entry may be without name');
			} else {
				result += '/';
				final = true;
			}
		}

		return result;
	}


}


export class Dotted_Tree_Directory extends Abstract_Tree_Directory {

	set(path, value) {
		const directory = this.mkdir(path);
		directory.value = value;
		return directory;
	}

	get(path) {
		return this.get_dir(path)?.value;
	}


	require(path) {
		const directory = this.get_dir(path);
		if (!directory) {
			throw new Error(`The path ${path} does not exist in ${this}`);	//TODO - proper concrete
		} else {
			return directory.value;
		}
	}

	static normalize_and_split_path(path) {
		return path.split(/\./);
	}

	static join_path(...pieces) {
		if (pieces[0]) {
			return pieces.join('.');
		} else {
			return pieces.slice(1).join('.');
		}

	}

	to_object(target=null) {
		if (!target) {
			target = this.value ?? {};
		}

		for (const child of this.children.values()) {
			target[child.name] = child.to_object();
		}

		return target;
	}

	graft_to_object(target=null) {
		if (!target) {
			target = this.value ?? {};
		}

		for (const child of this.children.values()) {
			if (child.name in target) {
				child.graft_to_object(target[child.name]);
			} else {
				target[child.name] = child.to_object();
			}

		}

		return target;
	}

}

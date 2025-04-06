
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


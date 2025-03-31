

export class Code_Block {
	constructor(contents, name, type) {
		Object.assign(this, { contents, name, type });
	}

	static from_node(node, name=undefined, type=undefined) {
		return new this(node, name, type);
	}

}
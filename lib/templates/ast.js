

export class Sequence {
	constructor(...contents) {
		Object.assign(this, { contents });
	}
}

export class Blank_Lines {
	constructor(count=1) {
		Object.assign(this, { count });
	}
}

export class Code_Block {
	constructor(contents, name, type) {
		Object.assign(this, { contents, name, type });
	}

	static from_node(node, name=undefined, type=undefined) {
		return new this(node, name, type);
	}

}
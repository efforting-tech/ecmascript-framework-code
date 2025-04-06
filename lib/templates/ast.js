export class Abstract_Node {};

export class Abstract_Template_Node extends Abstract_Node {
	constructor(title=null, body=[]) {
		super();
		Object.assign(this, { title, body });
	}
}

export class Template_Node extends Abstract_Template_Node {};

export class Text_Node extends Abstract_Template_Node {

	to_string(indent=0) {
		const indent_string = '    '.repeat(indent); 	//TODO - support various indent modes
		if (this.title === null) {
			return this.body.map(item => item.to_string(indent)).join('\n');	//TODO - support various line ending modes		} else {
		} else {
			return [
				`${indent_string}${this.title}`,
				...this.body.map(item => item.to_string(indent+1)),
			].join('\n');	//TODO - support various line ending modes
		}
	}

};



export class Sequence extends Abstract_Node {
	constructor(...contents) {
		super();
		Object.assign(this, { contents });
	}
}

export class Blank_Lines extends Abstract_Node {
	constructor(count=1) {
		super();
		Object.assign(this, { count });
	}
}

export class Code_Block extends Abstract_Node {
	constructor(contents, name, type) {
		super();
		Object.assign(this, { contents, name, type });
	}

	static from_node(node, name=undefined, type=undefined) {
		return new this(node, name, type);
	}

}
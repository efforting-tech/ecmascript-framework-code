//This AST is for the parser definition language


export class Abstract_Node {};

export class Abstract_Sequence extends Abstract_Node {
	constructor(sequence) {
		super();
		Object.assign(this, { sequence });
	}
}

export class Default_Token extends Abstract_Node {
	constructor(token) {
		super();
		Object.assign(this, { token });
	}
}

export class Regexp_Token extends Abstract_Node {
	constructor(name, pattern) {
		super();
		Object.assign(this, { name, pattern });
	}
}


export class Token_Table extends Abstract_Sequence {};

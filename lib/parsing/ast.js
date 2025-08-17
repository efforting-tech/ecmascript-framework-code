//This AST is for the tokenizer definition language


export class Abstract_Node {
	constructor(source) {
		Object.assign(this, { source });
	}
};

export class Abstract_Value extends Abstract_Node {
	constructor(source, value) {
		super(source);
		Object.assign(this, { value });
	}
};

export class Abstract_Sequence extends Abstract_Node {
	constructor(source, sequence=[]) {
		super(source);
		Object.assign(this, { sequence });
	}
}



export class Group extends Abstract_Node {
	constructor(source, directory, members=[]) {
		super(source);
		Object.assign(this, { directory, members });
	}
};


export class Regexp_Token extends Abstract_Value {};
export class Default_Token extends Abstract_Value {};
export class String extends Abstract_Value {};
export class Identifier extends Abstract_Value {};

export class Token_Table extends Abstract_Sequence {};


export class Tokenizer extends Abstract_Node {
	constructor(source, name, rule_definitions=[]) {
		super(source);
		Object.assign(this, { name, rule_definitions });
	}
};

export class Capture extends Abstract_Node {
	constructor(source, target, name) {
		super(source);
		Object.assign(this, { target, name });
	}
};



export class Rule_Definition extends Abstract_Node {
	constructor(source, name, value) {
		super(source);
		Object.assign(this, { name, value });
	}
};

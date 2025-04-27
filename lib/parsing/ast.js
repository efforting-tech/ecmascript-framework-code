//This AST is for the parser definition language


export class Abstract_Node {};

export class Abstract_Sequence extends Abstract_Node {
	constructor(sequence) {
		super();
		Object.assign(this, { sequence });
	}
}

export class Abstract_Value extends Abstract_Node {
	constructor(value) {
		super();
		Object.assign(this, { value });
	}
};



export class Regexp_Token extends Abstract_Value {};
export class Default_Token extends Abstract_Value {};
export class String extends Abstract_Value {};
export class Identifier extends Abstract_Value {};


export class Token_Table extends Abstract_Sequence {};


export class Alias extends Abstract_Node {
	constructor(target, alias) {
		super();
		Object.assign(this, { target, alias });
	}
};




export class Rule_Definition extends Abstract_Node {
	constructor(name, value) {
		super();
		Object.assign(this, { name, value });
	}
};



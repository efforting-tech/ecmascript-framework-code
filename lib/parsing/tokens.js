export class Abstract_Token {
	constructor(source, value) {
		Object.assign(this, { source, value });
	}
};

export class Abstract_Sequence_Token extends Abstract_Token {};

export class Comment extends Abstract_Token {};
export class Identifier extends Abstract_Token {};
export class Punctuation extends Abstract_Token {};
export class Whitespace extends Abstract_Token {};

export class Literal extends Abstract_Token {};
export class Quote extends Abstract_Token {};
export class Escape extends Abstract_Token {};




export class String extends Abstract_Sequence_Token {};

export class Rule_Definition extends Abstract_Sequence_Token {
	constructor(source, name, value) {
		super(source, value);
		Object.assign(this, { name });
	}

};


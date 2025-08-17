//TODO - Decide how and what to integrate in the library and deprecate the basic tokenizer.

export class Abstract_Action {
	constructor(pending_actions=[], conjunctive_actions=[]) {
		Object.assign(this, { pending_actions, conjunctive_actions });
	}

	then(...further_actions) {
		this.pending_actions.push(...further_actions);
		return this;
	}

	and(...conjunctive_actions) {
		this.conjunctive_actions.push(...conjunctive_actions);
		return this;
	}
}

export class Abstract_Pattern {
	constructor(action) {
		Object.assign(this, { action });
	}
}


export class Pattern_Token extends Abstract_Pattern {
	constructor(token, action) {
		super(action);
		Object.assign(this, { token });
	}
}

export class Pattern_Default extends Abstract_Pattern {
	constructor(action) {
		super(action);
		Object.assign(this, {  });
	}
}

export class Action_Sequence extends Abstract_Action {
	constructor(sequence) {
		super();
		Object.assign(this, { sequence });
	}
}

export class Enter extends Abstract_Action {
	constructor(sub_tokenizer, pending_actions=[]) {
		super(pending_actions);
		Object.assign(this, { sub_tokenizer });
	}
}

export class Exit extends Abstract_Action {
	constructor(pending_actions=[]) {
		super(pending_actions);
		Object.assign(this, {  });
	}
}

export class Emit_Token extends Abstract_Action {
	constructor(token, token_processor=null, pending_actions=[]) {
		super(pending_actions);
		Object.assign(this, { token, token_processor });
	}
}

export class Emit_Pending_Tokens extends Abstract_Action {
	constructor(pending_actions=[]) {
		super(pending_actions);
		Object.assign(this, { });
	}
}

//TODO - should this be here?
export class Sub_Tokenizer {
	constructor(name, rules=[]) {
		//super(name, rules);
		Object.assign(this, { name, rules });
	}
}

export class Tokenization_System {
	constructor(name, components=[]) {
		//super(name);
		Object.assign(this, { name, components });
	}
}


export class Assign_Tokens {
	constructor(token_sources=[]) {
		//super(name, tokens);
		Object.assign(this, { token_sources });
	}
}


export class Assign_Default_Token_Processor {
	constructor(processor) {
		//super(name, tokens);
		Object.assign(this, { processor });
	}
}

export class Assign_Token_Processor_Factory {
	constructor(factory) {
		//super(name, tokens);
		Object.assign(this, { factory });
	}
}


export class Push_Token_Processor_Factory {
	constructor(factory) {
		//super(name, tokens);
		Object.assign(this, { factory });
	}
}


export class Pop_Token_Processor_Factory {
	constructor() {
		//super(name, tokens);
		Object.assign(this, { });
	}
}


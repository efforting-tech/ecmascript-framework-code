
//TODO - move these up a level or to data or something
export const CONTEXT_SYMBOL = Symbol('CONTEXT_SYMBOL');


export class Context {
	constructor(name, scope={}) {
		Object.assign(this, { name, scope });
	}

	evaluate(expression) {
		const keys = Object.keys(this.scope);
		const values = Object.values(this.scope);
		const arg_def = keys.join(',');
		const outer_expression = `(${arg_def}) => (${expression})`;
		return eval(outer_expression)(...values);
	}

};



//TODO: WIP - should probably not be in here (also, context should probably not live in templates) (this should probably be the only thing in here - see comment at CONTEXT_SYMBOL)
export const DEFAULT_CONTEXT = new Context('DEFAULT_CONTEXT', {
	template: 'place holder for template processing',			//TODO - just for PoC
	blargh: 123,
});


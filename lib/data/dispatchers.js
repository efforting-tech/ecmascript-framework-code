//TODO - there is some overlap between here and operators.js - it should be cleaned up!

//NOTE: These dispatchers are not stateful - stateful dispatchers should have a different base class

import { inspect } from 'node:util';


export const DEFAULT_HANDLER = Symbol('DEFAULT_HANDLER');


export class Mapping_Dispatcher {
	constructor(name=undefined, rules=new Map()) {
		Object.assign(this, { name, rules });
	}
}



export class Mapping_Processor extends Mapping_Dispatcher {
	register(...entries) {
		const handler = entries.pop(-1);
		for (const e of entries) {
			this.rules.set(e, handler);
		}
		return handler;
	}

	resolve_processor(...args) {
		let item, context, strict=false;

		switch (args.length) {
			case 1:		[item] = args; 						break;
			case 2:		[context, item] = args; 			break;
			case 3:		[context, item, strict] = args; 	break;
			default:	throw new Error("Expected signature: resolve_processor(item) | resolve_processor(context, item) | resolve_processor(context, item, strict=false)");
		}

		const key = this.key(item);
		const processor = this.rules.get(key) ?? this.rules.get(DEFAULT_HANDLER);

		if (!processor && strict) {
			if (this.name) {
				throw Error(`Processor ${this.name} has no function registered to process ${this.reference(item)}: ${inspect(item)}`);
			} else {
				throw Error(`No function registered to process ${this.reference(item)}: ${inspect(item)}`);
			}
		}

		return processor;
	}

	// process(item) or process(context, item)
	process(...args) {
		let item, context;
		switch (args.length) {
			case 1:		[item] = args; 				break;
			case 2:		[context, item] = args; 	break;
			default:	throw new Error("Expected signature: process(item) | process(context, item)");
		}

		const processor = this.resolve_processor(context, item, true);
		return processor(context, this, item);
	}

	process_multiple(context, ...items_to_process) {
		const result = [];
		for (const item of items_to_process) {
			const processor = this.resolve_processor(context, item, true);
			result.push(processor(context, this, item));
		}
		return result;
	}

}



export class Constructor_Based_Mapping_Processor extends Mapping_Processor {
	key(item) {
		return item?.constructor;
	}

	reference(item) {
		return item?.constructor.name;
	}
}

export class Key_Based_Mapping_Processor extends Mapping_Processor {
	constructor(name=undefined, key_delegate, reference_delegate, rules=new Map()) {
		super(name, rules);
		Object.assign(this, { key_delegate, reference_delegate });
	}

	key(item) {
		return this.key_delegate(item);
	}

	reference(item) {
		if (this.reference_delegate) {
			return this.reference_delegate(item);
		} else {
			return this.key(item);
		}
	}
}


export class Constructor_Based_Mapping_Iterator extends Constructor_Based_Mapping_Processor {

	*process(...args) {
		let item, context;
		switch (args.length) {
			case 1:		[item] = args; 				break;
			case 2:		[context, item] = args; 	break;
			default:	throw new Error("Expected signature: process(item) | process(context, item)");
		}

		const processor = this.resolve_processor(context, item, true);
		yield* processor(context, this, item);
	}

	*process_multiple(context, ...items_to_process) {
		for (const item of items_to_process) {
			const processor = this.resolve_processor(context, item, true);
			yield* processor(context, this, item);
		}
	}

}

export class First_Match_Dispatcher {
	constructor(name=undefined, rules=[]) {
		Object.assign(this, { name, rules });
	}
}


export class Rule {
	constructor(condition, handler) {
		Object.assign(this, { condition, handler });
	}
}


export class First_Match_Processor extends First_Match_Dispatcher {
	register(condition, handler) {
		//TODO - this is not correct, we should use the rules from data/rules
		const rule = new Rule(condition, handler);
		this.rules.push(rule);
		return rule;
	}

	resolve_processor(...args) {
		let item, context, strict=false;

		switch (args.length) {
			case 1:		[item] = args; 						break;
			case 2:		[context, item] = args; 			break;
			case 3:		[context, item, strict] = args; 	break;
			default:	throw new Error("Expected signature: resolve_processor(item) | resolve_processor(context, item) | resolve_processor(context, item, strict=false)");
		}

		for (const rule of this.rules) {
			const match = rule.match(item, context);
			if (match) {
				return match.processor;
			}
		}

		if (strict) {
			if (this.name) {
				throw Error(`Processor ${this.name} has no function registered to process ${this.reference(item)}: ${inspect(item)}`);
			} else {
				throw Error(`No function registered to process ${this.reference(item)}: ${inspect(item)}`);
			}
		}
	}

	//NOTE - these are same as mapping dispatcher, we could move to common interface
	// process(item) or process(context, item)
	process(...args) {
		let item, context;
		switch (args.length) {
			case 1:		[item] = args; 				break;
			case 2:		[context, item] = args; 	break;
			default:	throw new Error("Expected signature: process(item) | process(context, item)");
		}

		const processor = this.resolve_processor(context, item, true);
		return processor(context, this, item);
	}

	process_multiple(context, ...items_to_process) {
		const result = [];
		for (const item of items_to_process) {
			const processor = this.resolve_processor(context, item, true);
			result.push(processor(context, this, item));
		}
		return result;
	}

}

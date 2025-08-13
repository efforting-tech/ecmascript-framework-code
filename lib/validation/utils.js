import { inspect } from 'node:util';
export { dump } from '../debug/console.js';



export function assert(condition, message=null, message_data=[]) {
	//TODO - proper formatting - proper Error subclass - make use of message_data and so on
	if (!condition) {
		throw new Error(`Assertion Error: ${message ?? "Condition failed"}`);
	}
}


export function assert_unset(value, message=null, message_data=[]) {
	//TODO - proper formatting - proper Error subclass - make use of message_data and so on
	if (value) {
		const msg = message ?? `Value has already been set: ${inspect(value)}`;
		throw new Error(`Assertion Error: ${msg}`);
	}
}

export function assert_empty_array(value, message=null, message_data=[]) {
	//TODO - proper formatting - proper Error subclass - make use of message_data and so on
	if (value.length > 0) {
		const msg = message ?? `List not empty: ${inspect(value)}`;
		throw new Error(`Assertion Error: ${msg}`);
	}
}


export function assert_defined(value, message=null, message_data=[]) {
	//TODO - proper formatting - proper Error subclass - make use of message_data and so on
	if (value === undefined) {
		const msg = message ?? `Value must be defined`;
		throw new Error(`Assertion Error: ${msg}`);
	}
}

export function assert_found(key, value, message=null, message_data=[]) {
	//TODO - proper formatting - proper Error subclass - make use of message_data and so on
	if (!value) {
		const msg = message ?? `Key not found: ${inspect(key)}`;
		throw new Error(`Assertion Error: ${msg}`);
	}
}

export function assert_type(item, type, message=null, message_data=[]) {
	//TODO - use resolver for type
	//TODO - proper formatting - proper Error subclass - make use of message_data and so on
	//TODO - support various primitives such as string
	let state = false;
	if (type === Array) {
		state = Array.isArray(item);
	} else {
		state = item instanceof type;
	}

	if (!state) {
		throw new Error(`Assertion Error: ${message ?? "Condition failed"}`);
	}

}




export function not_implemented(message=null, message_data=[]) {
	//TODO - proper formatting - proper Error subclass - make use of message_data and so on
	throw new Error(`Not Implemented Error: ${message ?? "Feature not implemented"}`);
}

export function not_handled(value, message=null, message_data=[]) {
	//TODO - proper formatting - proper Error subclass - make use of message_data and so on
	throw new Error(`Data not handled error: ${message ?? inspect(value)}`);
}

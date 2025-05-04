import { inspect } from 'util';

function repr(item) {
	return inspect(item, {depth: null, colors: true});
}

export function assert_equality(value, expected, message = "Assertion failed, expected ${expected_repr} but got ${value_repr}") {
	const expected_repr = repr(expected);
	const value_repr = repr(value);
	if (expected_repr !== value_repr) {
		throw new Error(eval(`\`${message}\``));
	}
}

export function assert_properties(value, expected, message = "Assertion failed, expected ${expected_json} but got ${value_json}") {
	const subset = {};
	for (const key in expected) {
		subset[key] = value[key];
	}
	assert_equality(subset, expected, message);
}


export function assert_error(function_reference, expected_error = true, message = "Assertion failed: Expected the error \"${inspect(expected_error)}\" but ${caught_error ? 'got ' + inspect(String(caught_error)) : 'did not catch any error'}.") {
	if (expected_error === false) {	//No error is expected, therefore we just call the function_reference()
		function_reference();
		return;
	}

	let caught_error = null;

	try {
		function_reference();
	} catch (error) {
		caught_error = error;
		if (expected_error === true) {
			// Assertion passes
		} else if (expected_error instanceof RegExp) {
			// Check caught error against pattern
			if (!expected_error.test(String(caught_error))) {
				throw new Error(eval(`\`${message}\``));
			}
		}
	}

	if (!caught_error) {
		if (expected_error !== false) {
			throw new Error(eval(`\`${message}\``));
		}
	}
}

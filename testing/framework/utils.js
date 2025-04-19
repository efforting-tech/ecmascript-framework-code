export function assert_equality(expected, value, message = "Assertion failed, expected ${expected_json} but got ${value_json}") {
	const expected_json = JSON.stringify(expected);
	const value_json = JSON.stringify(value);
	if (expected_json !== value_json) {
		throw new Error(eval(`\`${message}\``));
	}
}

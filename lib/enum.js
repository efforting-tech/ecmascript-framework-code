export const ENUM_NAME = Symbol('ENUM_NAME');
export const ENUM_CHOICES = Symbol('ENUM_CHOICES');
export const ENUM_REVERSE_LUT = Symbol('ENUM_REVERSE_LUT');
export const ENUM_SET_FILTER = Symbol('ENUM_SET_FILTER');

/*

	Regarding Enum choices, currently this is an object where values can be
		`Number`
			For automatically incrementing a value, starting as `start`

		`Symbol`
			For automatically creating symbols of the same name as the key

		Anything else
			Assigns the value specified


	TODO - Future plans:
		Add a special container that allows us to specify something by value, even if it may collide with the options above, for instance:
			`new EnumValue(Symbol)` to specifically set the value to `Symbol`


*/

export class Enum {
	constructor(name, choices, start=0) {
		this[ENUM_NAME] = name;
		this[ENUM_CHOICES] = choices;
		const reverse_lut = this[ENUM_REVERSE_LUT] = {};

		let counter=start;
		for (const [key, value] of Object.entries(choices)) {
			let filtered_value;
			if (value === Number) {
				filtered_value= this[key] = counter++;
			} else if (value === Symbol) {
				filtered_value = this[key] = Symbol(key);
			} else {
				filtered_value = this[key] = value;
			}

			reverse_lut[filtered_value] = key;
		}

		Object.freeze(this[ENUM_CHOICES]);
		Object.freeze(this[ENUM_REVERSE_LUT]);
		Object.freeze(this);

	}

	[ENUM_SET_FILTER] (value) {
		const value_by_key = this[value];
		if (value_by_key !== undefined) {
			return value_by_key;
		}

		if (value in this[ENUM_REVERSE_LUT]) {
			return value;
		}

		throw new Error(`The value ${value} is neither a key nor value of ${this}.`)

	}

}


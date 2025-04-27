
class Object_Serialization_Strategy {
	constructor(identity, type, symbols, keys, values) {
		Object.assign(this, { identity, type, symbols, keys, values });
	}
}


class State_Serialization_Strategy {
	constructor(array=new Object_Serialization_Strategy(false, true, false, false, true), object=new Object_Serialization_Strategy(true, true, true, true, true)) {
		Object.assign(this, { array, object });
	}
}

export class State_Serializer {

	constructor(symbols=new Map(), strategy=new State_Serialization_Strategy()) {
		Object.assign(this, { symbols, strategy });
	}

	serialize_symbols(...symbols) {
		const result = [];
		for (const symbol of symbols) {
			const existing = this.symbols.get(symbol);
			if (existing !== undefined) {
				result.push(existing);
			} else {
				const new_symbol_index = this.symbols.size;
				this.symbols.set(symbol, new_symbol_index);
				result.push(new_symbol_index);
			}
		}
		return result;
	}


	serialize_object(object) {
		const state_strategy = this.strategy;
		const result = [];

		switch (typeof(object)) {
			case 'object':
				if (object === null) {
					return ['N'];
				}


				const is_array = object.constructor === Array;
				const strategy = is_array ? state_strategy.array : state_strategy.object;
				result.push(is_array ? 'a' : 'o');


				if (strategy.identity) {
					const existing_instance = this.symbols.get(object);
					if (existing_instance !== undefined) {
						return existing_instance;
					}

					const [instance] = this.serialize_symbols(object);
					result.push(instance);
				}

				if (strategy.type) {
					const [type] = this.serialize_symbols(object.constructor);
					result.push(type);
				}

				if (strategy.symbols) {
					const symbols = this.serialize_symbols(...Object.getOwnPropertySymbols(object));
					result.push(symbols);
				}

				if (strategy.keys) {
					const keys = Object.keys(object).map(item => this.serialize_object(item));
					result.push(keys);
				}

				if (strategy.values) {
					const values = Object.values(object).map(item => this.serialize_object(item));
					result.push(values);
				}

				return result;

			case 'string':
				return ['s', ...this.serialize_symbols(typeof(object)), object];

			case 'number':
				return ['n', ...this.serialize_symbols(typeof(object)), object];

			case 'boolean':
				return [object ? 'T' : 'F'];

			case 'function':
				const [reference_type, reference_id] = this.serialize_symbols(typeof(object), object);
				return ['f', reference_type, reference_id];

			case 'symbol':
				return ['S', ...this.serialize_symbols(object)];


			case 'undefined':
				return ['u'];


			default:
				throw new Error(typeof(object));
		}
	}
};


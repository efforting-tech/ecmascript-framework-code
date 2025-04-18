
export class State_Serializer {

	constructor(symbols=new Map()) {
		Object.assign(this, { symbols });
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

		switch (typeof(object)) {
			case 'object':

				const existing_instance = this.symbols.get(object);
				if (existing_instance !== undefined) {
					return existing_instance;
				}

				const [type, instance] = this.serialize_symbols(object.constructor, object);
				const symbols = this.serialize_symbols(...Object.getOwnPropertySymbols(object));
				const keys = Object.keys(object).map(item => this.serialize_object(item));
				const values = Object.values(object).map(item => this.serialize_object(item));

				return [instance, type, symbols, keys, values];

			case 'string':
			case 'number':
				const [value_type] = this.serialize_symbols(typeof(object));
				return [value_type, object];


			case 'function':
				const [reference_type, reference_id] = this.serialize_symbols(typeof(object), object);
				return [reference_type, reference_id];

			case 'undefined':
				const [singleton_type] = this.serialize_symbols(typeof(object));
				return singleton_type;


			default:
				throw new Error(typeof(object));
		}



	}


};

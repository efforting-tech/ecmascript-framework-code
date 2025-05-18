import { State_Function } from '../../lib/data/serialization.js';
import { createRequire } from 'module';

import { test_class_1, test_class_2, test_class_3 } from './support/serialization-classes.js';

/*const Recreation_Method = new Enum('Recreation_Method', {
	State: Symbol,
	Factory: Symbol,
	Constructor: Symbol,
});
*/

const PRIMITIVE_TYPES = new Set(['string', 'number', 'boolean', 'bigint', 'undefined']);


class Deserializer {
	constructor(pool=new Map(), modules=new Map(), cache=new Map()) {

		const handler_lut = {
			'primitive': ((value) => value),
			'Array': ((...elements) => elements.map(e => this.pull(e))),

			'RM.Constructor': ((path, name, ...constructor_arguments) => {
				const module = this.acquire_module(path);
				return new module[name](...constructor_arguments);
			}),

			'RM.Factory': ((path, name, ...factory_arguments) => {
				const module = this.acquire_module(path);
				return module[name](...factory_arguments);
			}),

			'RM.State': ((path, name, state) => {
				const module = this.acquire_module(path);
				const class_ref = module[name];
				return class_ref[State_Function.From_State](state);
			}),
		}

		Object.assign(this, { pool, modules, cache, handler_lut });
	}

	acquire_module(path) {

		const cached_module = this.modules.get(path);
		if (cached_module) {
			return cached_module;
		} else {
			const require = createRequire(import.meta.url);
			const module = require(path);
			this.modules.set(path, module);
			return module;
		}
	}

	pull(key) {
		if (this.cache.has(key)) {
			return this.cache.get(key);
		} else {
			const [object_type, ...object_data] = this.pool.get(key);
			const handler = this.handler_lut[object_type];
			return handler(...object_data);
		}
	}

}


class Serializer {
	constructor(pool=new Map(), visited=new Map(), pending=0) {
		Object.assign(this, { pool, visited, pending });
	}

	_serialize_object(object) {
		const state_getter = object[State_Function.Get_State];
		if (state_getter) {
			return state_getter.apply(object);
		}

		const factory_getter = object[State_Function.Get_Factory];
		if (factory_getter) {
			return factory_getter.apply(object);
		}

		const constructor_getter = object[State_Function.Get_Constructor];
		if (constructor_getter) {
			return constructor_getter.apply(object);
		}

		if (Array.isArray(object)) {
			return ['Array', ...object.map(e => this.feed(e))];
		}

		if (object === null || PRIMITIVE_TYPES.has(typeof object)) {
			return ['primitive', object];
		}

		throw new Error([typeof object, object]);

	}

	feed(object) {
		const ref = this.visited.get(object);
		if (ref !== undefined) {
			return ref;
		} else {
			const new_ref = this.pending++;
			this.visited.set(object, new_ref);
			this.pool.set(new_ref, this._serialize_object(object));
			return new_ref;
		}
	}

}

const s = new Serializer();


s.feed(new test_class_1(11, 25));
s.feed(new test_class_2(12, 26));
s.feed(new test_class_3(13, 27));

s.feed(['hello', 'world', 123n, 123, '123']);

console.log(s.pool);


const d = new Deserializer(s.pool);

console.log(d.pull(0))
console.log(d.pull(1))
console.log(d.pull(2))
console.log(d.pull(3))




//console.log(s.result);
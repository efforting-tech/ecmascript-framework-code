import { State_Function } from '../../../lib/data/serialization.js';

export class test_class_1 {

	constructor(a, b) {
		this.ab = a * b;
		this._construction_args = [a, b];
	}

	[State_Function.Get_Constructor]() {
		return ['RM.Constructor', './support/serialization-classes.js', 'test_class_1', ...this._construction_args];
	}
}

export class test_class_2 {

	constructor(a, b) {
		this.ab = a * b;
		this._construction_args = [a, b];
	}

	[State_Function.Get_Factory]() {
		return ['RM.Factory', './support/serialization-classes.js', 'class_2_factory', ...this._construction_args];
	}
}


export class test_class_3 {

	constructor(a, b) {
		this.ab = a * b;
	}

	[State_Function.Get_State]() {
		const { ab } = this;
		return ['RM.State', './support/serialization-classes.js', 'test_class_3', { ab }];
	}

	static [State_Function.From_State](state) {
		const result = new this();
		Object.assign(result, state);
		return result;
	}


}


export function class_2_factory(a, b) {
	return new test_class_2(a, b);
}
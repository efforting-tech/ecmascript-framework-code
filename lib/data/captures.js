import { Enum, Enum_get } from '../enum.js';

export const CLASSIFICATION = new Enum('CLASSIFICATION', {
	NO_CAPTURE: Symbol,
	SINGLE_ITEM: Symbol,
	FIXED_LENGTH_SEQUENCE: Symbol,
	DYNAMIC_LENGTH_SEQUENCE: Symbol,
});


export class Abstract_Capture {
	constructor(identity, condition=null) {
		Object.assign(this, { identity, condition });
	}

	get capture_classification() {
		return CLASSIFICATION.SINGLE_ITEM;
	}

	*walk_sequence() {
		yield this;
	}


};

export class Abstract_Sequence_Capture extends Abstract_Capture {};

export class Fixed_Length_Sub_Sequence extends Abstract_Sequence_Capture {
	get capture_classification() {
		return CLASSIFICATION.FIXED_LENGTH_SEQUENCE;
	}
};


export class Dynamic_Length_Sub_Sequence extends Abstract_Sequence_Capture {
	get capture_classification() {
		return CLASSIFICATION.DYNAMIC_LENGTH_SEQUENCE;
	}
};


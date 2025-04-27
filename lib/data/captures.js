import { Enum, Enum_get } from '../enum.js';

/* NOTE - One OOP thing I don't like is when you risk having "the wrong concrete function" from a base.
	Like if were to forget to override capture_classification in Abstract_Sequence_Capture,
	then we would get the wrong classification. One way to fix this is to have the abstract implementation
	only throw an error regarding a lack of implementation and put this responsibility on the concretes.

	This note should not live here but it lives here until it ends up in the right place, which should be some sort of
	discussion regarding design principles governing this project.
*/

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


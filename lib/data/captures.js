export class Abstract_Capture {
	constructor(identity) {
		Object.assign(this, { identity });
	}
};

export class Abstract_Sequence_Capture extends Abstract_Capture {};

export class Capture_Entry extends Abstract_Capture {};
export class Capture_Sub_Sequence extends Abstract_Sequence_Capture {};


//TODO - later we should have conditional captures which might include sub sequences with end conditions and such
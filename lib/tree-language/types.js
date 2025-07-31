export class Capture {
	constructor(names, processors={}, validators={}) {
		Object.assign(this, { names, processors, validators });
	}
}

export class Capture_Regex extends Capture {
	constructor(names, regular_expression, processors={}, validators={}) {
		super(names, processors, validators);
		Object.assign(this, { regular_expression });
	}
}

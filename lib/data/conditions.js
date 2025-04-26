import * as M from './matches.js';
import * as CA from './captures.js';


export class Abstract_Condition {

	get capture_classification() {
		return CA.CLASSIFICATION.NO_CAPTURE;
	}

	*walk_sequence() {
		yield this;
	}

};

export class Regex_Condition extends Abstract_Condition {
	constructor(pattern) {
		super();
		Object.assign(this, { pattern });
	}

	match(text) {
		const regex_match = text.match(this.pattern);
		if (regex_match) {
			return new M.Value_Match(this, regex_match);
		}
	}
}



export class Title_Condition extends Abstract_Condition {
	constructor(condition) {
		super();
		Object.assign(this, { condition });
	}

	match(node) {
		const title = node?.title;
		const sub_match = this.condition.match(title);
		if (sub_match) {
			return new M.Value_Match(this, sub_match);
		}
	}
}


export class Instance_of extends Abstract_Condition {
	constructor (type) {
		super();
		Object.assign(this, { type });
	}

	match(item) {
		if (item instanceof this.type) {
			return new M.Value_Match(this, item);
		} else {
			return;
		}
	}

}

export class Value_is extends Abstract_Condition {
	constructor (value) {
		super();
		Object.assign(this, { value });
	}

	match(item) {
		if (item === this.value) {
			return new M.Value_Match(this, item);
		} else {
			return;
		}
	}
}

export class Type_is extends Abstract_Condition {
	constructor (type) {
		super();
		Object.assign(this, { type });
	}

	match(item) {
		if (typeof item === this.type) {
			return new M.Value_Match(this, item);
		} else {
			return;
		}
	}
}

export class Constructor_is extends Abstract_Condition {
	constructor (type) {
		super();
		Object.assign(this, { type });
	}

	match(item) {
		if (item?.constructor === this.type) {
			return new M.Value_Match(this, item);
		} else {
			return;
		}
	}

}



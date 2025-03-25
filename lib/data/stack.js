//TODO - document this
//TODO - write tests
export class Stack_Channel {
	constructor(owner, name, fields) {
		this.owner = owner;
		this.name = name;
		this.fields = fields;
		this.stack = [];
	}

	get top() {
		return this.stack.at(-1);
	}

	push() {
		const frame = {};
		for (const field of this.fields) {
			frame[field] = this.owner[field];
		}
		this.stack.push(frame);
	}

	pop() {
		if (this.stack.length == 0) {
			throw new Error('Pop from empty stack');
		}
		const frame = this.stack.pop();
		const snapshot = {};
		for (const field of this.fields) {
			snapshot[field] = this.owner[field];
			this.owner[field] = frame[field];
		}
		return snapshot;
	}

}

//TODO - document this
//TODO - write tests
export function init_stack_channel(owner, name, init) {
	Object.assign(owner, init);
	owner[name] = new Stack_Channel(owner, name, Object.keys(init));
}

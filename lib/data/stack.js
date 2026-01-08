//TODO - document this
//TODO - write tests

export const DELETE_PROPERTY = Symbol('DELETE_PROPERTY');


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



export class Property_Stack_Frame {
	constructor(owner, value) {
		Object.assign(this, { owner, value });
	}
}

export class Property_Stack {
	constructor(target={}, name=undefined, stack=[]) {
		Object.assign(this, { target, name, stack });
	}

	push(updates={}) {
		const frame_value = {};
		const frame = new Property_Stack_Frame(this, frame_value)
		this.stack.push(frame);
		for (const [key, value] of Object.entries(updates)) {

			if (key in this.target) {
				frame_value[key] = this.target[key];
			} else {
				frame_value[key] = DELETE_PROPERTY;
			}

			if (value === DELETE_PROPERTY) {
				delete this.target[key];
			} else {
				this.target[key] = value;
			}
		}
		return frame;
	}

	pop() {
		const frame = this.stack.pop();
		for (const [key, value] of Object.entries(frame.value)) {
			if (value === DELETE_PROPERTY) {
				delete this.target[key];
			} else {
				this.target[key] = value;
			}
		}
		// NOTE - breaking change - pop() now return frame instead of frame.value - 2025-12-28
		return frame;
	}

	get top_reverse_delta() {	//Renamed from top
		return this.stack.at(-1)?.value;
	}

}


export class Object_Snapshot_Stack {
	constructor(target={}, name=undefined, stack=[]) {
		Object.assign(this, { target, name, stack });
	}

	push() {
		const frame = {...this.target};
		this.stack.push(frame);
		return frame;
	}

	pop() {
		const frame = this.stack.pop();
		Object.keys(this.target).forEach(key => delete this.target[key]);
		Object.assign(this.target, frame);
		return frame;
	}

	get top() {
		return this.stack.at(-1) ?? this.target;
	}
}

export class Basic_Stack {
	constructor(top_frame={}) {
		const stack = [top_frame];
		Object.assign(this, { stack });
	}

	push(frame_data) {
		const frame = {...this.top};
		Object.assign(frame, frame_data);
		this.stack.push(frame);
		return frame;
	}

	pop() {
		return this.stack.pop();
	}

	get top() {
		return this.stack.at(-1);
	}
}


export function assign_property_stack(target, key='stack') {
	target[key] = new Property_Stack(target, key);
	return target;
}
export class Switchable_Iterator {
	constructor(iterator=null, stack=[]) {
		Object.assign(this, { iterator, stack });
	}

	push(iterator) {
		this.stack.push(this.iterator);
		this.switch_to(iterator);
	}

	pop(iterator) {
		this.switch_to(this.stack.pop());
	}

	switch_to(iterator) {
		this.iterator = iterator;
	}

	next() {
		return this.iterator.next();
	}

	peek() {
		return this.iterator.peek();
	}

	[Symbol.iterator]() {
		return this;
	}

}

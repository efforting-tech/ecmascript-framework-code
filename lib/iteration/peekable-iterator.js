export const END_OF_ITERATION = Symbol('END_OF_ITERATION');

export class Peekable_Iterator {
	constructor(source, pending=[], consumed_count=0) {
		if (Array.isArray(source)) {
			source = source[Symbol.iterator]();
		}
		Object.assign(this, { source, pending, consumed_count });
	}

	next() {
		const { pending, source } = this;
		if (pending.length > 0) {
			return pending.shift();
		} else {
			this.consumed_count++;
			return source.next();
		}
	}

	peek() {
		const { pending, source } = this;
		if (pending.length > 0) {
			const value = pending[0];
			return value.done ? END_OF_ITERATION : value.value;
		} else {
			this.consumed_count++;
			const value = source.next();
			pending.push(value);
			return value.done ? END_OF_ITERATION : value.value;
		}
	}

	[Symbol.iterator]() {
		return this;
	}

}

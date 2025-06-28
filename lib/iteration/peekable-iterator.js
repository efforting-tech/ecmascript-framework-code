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
		this.consumed_count++;
		if (pending.length > 0) {
			return { value: pending.shift(), done: false };
		} else {
			return source.next();
		}
	}

	peek() {
		const { pending, source } = this;
		if (pending.length > 0) {
			return pending[0];
		} else {
			const value = source.next();
			if (!value.done) {
				pending.push(value.value);
			}
			return value.done ? END_OF_ITERATION : value.value;
		}
	}

	advance(count) {
		const result = [];
		for (let i=0; i<count; i++) {
			result.push(this.next());
		}
		return result;
	}

	exhaust() {
		const result = [];
		while (true) {
			const item = this.next();
			if (item.done) {
				break;
			}

			result.push(item.value);
		}
		return result;
	}

	peek_remaining() {
		this.pending.push(...this.source);
		return [...this.pending];
	}

	[Symbol.iterator]() {
		return this;
	}

}

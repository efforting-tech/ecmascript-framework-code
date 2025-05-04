
//TODO move to proper place
export class Span_Base {
	constructor(left=undefined, right=undefined) {
		Object.assign(this, { left, right });
	}

	clear() {
		this.left = undefined;
		this.right = undefined;
	}

	get defined() {
		return this.left !== undefined && this.right !== undefined;
	}

	static from_consequtive(iterable) {
		const result = new Span_Closed();
		for (const item of iterable) {
			result.incorporate(item);
		}
		return result.convert(this);
	}

	static from_extent(iterable) {
		let min = undefined;
		let max = undefined;
		for (const item of iterable) {
			if ((min === undefined) || (item < min)) {
				min = item;
			}
			if ((max === undefined) || (item > max)) {
				max = item;
			}
		}
		return new Span_Closed(min, max).convert(this);
	}

	to_list() {
		return [this.left, this.right];
	}

	*[Symbol.iterator]() {
		yield this.left;
		yield this.right;
	}

	incorporate(index) {
		if (!this.defined) {
			this.left = index;
			this.right = index;
		} else if (this.is_left_adjacent(index)) {
			this.left = index;
		} else if (this.is_right_adjacent(index)) {
			this.right = index;
		} else {
			throw new Error(`Holes not allowed in ${this.constructor.name}`);
		}
	}

	is_left_adjacent(index) {
		return (index !== undefined) && (this.left === index + 1);
	}

	is_right_adjacent(index) {
		return (index !== undefined) && (this.right === index - 1);
	}

	convert(target_constructor) {
		if (!this.defined) {
			return new target_constructor();
		}

		const result = new target_constructor(this.left, this.right);

		if (this.left_open && !result.left_open) {
			result.left++;
		} else if (!this.left_open && result.left_open) {
			result.left--;
		}

		if (this.right_open && !result.right_open) {
			result.right--;
		} else if (!this.right_open && result.right_open) {
			result.right++;
		}

		return result;

	}

}

export class Span_Closed extends Span_Base {

	get left_open() {
		return false;
	}

	get right_open() {
		return false;
	}

	get length() {
		if (this.defined) {
			return this.right - this.left + 1;
		} else {
			return undefined;
		}
	}

	includes(index) {
		return (this.defined && (index >= this.left) && (index <= this.right));
	}

}

export class Span_Open extends Span_Base {
	get left_open() {
		return true;
	}

	get right_open() {
		return true;
	}

	get length() {
		if (this.defined) {
			return this.right - this.left - 1;
		} else {
			return undefined;
		}
	}

	includes(index) {
		return (this.defined && (index > this.left) && (index < this.right));
	}

}

export class Span_Half_Open extends Span_Base {
	get length() {
		if (this.defined) {
			return this.right - this.left;
		} else {
			return undefined;
		}
	}
}

export class Span_Left_Open extends Span_Half_Open {

	get left_open() {
		return true;
	}

	get right_open() {
		return false;
	}


	includes(index) {
		return (this.defined && (index > this.left) && (index <= this.right));
	}
};

//Right Open is useful for slice()
export class Span_Right_Open extends Span_Half_Open {
	get left_open() {
		return false;
	}

	get right_open() {
		return true;
	}

	includes(index) {
		return (this.defined && (index >= this.left) && (index < this.right));
	}
};



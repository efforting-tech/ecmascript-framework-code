
export function *iter_count(count, start=0) {
	for (let i=0; i<count; i++) {
		yield start + i;
	}
}

export function *enumerate(iterable, start=0) {
	let index = start;
	for (const value of iterable) {
		yield [index++, value];
	}

}

export function *repeat(element, count) {
	for (let i=0; i<count; i++) {
		yield element;
	}
}

export function *repeat_factory(element_factory, count) {
	for (let i=0; i<count; i++) {
		yield element_factory(i);
	}
}

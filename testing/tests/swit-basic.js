import { Switchable_Iterator } from '../../lib/iteration/switchable-iterator.js';

function *iter(source) {
	for (const item of source) {
		yield item;
	}
}

function *test1() {
	const swit = new Switchable_Iterator(iter([1, 2, 3, 4, 5]));
	for (const item of swit) {
		if (item == 3) {
			swit.switch_to(iter(['A', 'B', 'C']));
		} else {
			yield item;
		}
	}
}


const output = JSON.stringify([...test1()]);
if (output != '[1,2,"A","B","C"]') {
	throw new Error(`Test failed, unexpected output: ${output}`);
}

import { inspect } from 'node:util';

// These classes contains a solution and will also be responsible for generating code that we can evaluate

class pending_description {
	constructor(text) {
		Object.assign(this, { text });
	}

}

class pending_record {
	constructor(components) {
		//TODO: Decide whether we should make sure we understand all components here (fail early) or if we want to allow future components to just get passed through
		Object.assign(this, { components });
	}

	*iter_members() {
		for (const component of this.components) {
			//TODO - make sure we handle all relevant cases
			if (typeof component === 'string') {
				yield component;
			}
		}
	}

	get_code() {
		const members  = [...this.iter_members()];
		const member_names = members.map(m => m.match(/([^=]+)/)[0]).join(',');
		const signature = members.join(',');
		return `class {constructor(${signature}){Object.assign(this, {${member_names}})}}`;
	}
}

class pending_record_tree {
	constructor(tree) {
		Object.assign(this, { tree });
	}

	get_code() {
		const inner = Object.entries(this.tree).map(([name, value]) => `${name}:${value.get_code()}`).join(',');
		return `{${inner}}`;
	}

	implement() {
		return Function('', `return ${this.get_code()}`)();
	}
}


// These functions here act as the interface for now, this is just to make it more comfortable to define the trees.

function tree(tree) {
	return new pending_record_tree(tree);
}

function record(...members) {
	return new pending_record(members);
}

function description(text) {
	return new pending_description(text);
}


const { root } = tree({
	root: tree({
		math: tree({
			scalar: record('value=0.0', description('A scalar can scale something else, it is a tensor of rank 0.')),
			integer: record('value=0'),
		}),
		rectangle: record('width=1.0', 'height=1.0', 'color'),

	}),
}).implement();


console.log(root)
/* {
  math: { scalar: [class scalar], integer: [class integer] },
  rectangle: [class rectangle]
} */

console.log(new root.math.scalar(42))
/* scalar { value: 42 } */

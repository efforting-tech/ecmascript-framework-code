
import { Property_Stack, DELETE_PROPERTY } from '../../lib/data/stack.js';


class State {
	constructor(users, documents) {
		Object.assign(this, { users, documents });

		this.stack = new Property_Stack(this);

	}
}


const s = new State(['cat', 'dog'], {hello: 'world'} );

console.log(s);
s.stack.push({ users: ['other'], documents: DELETE_PROPERTY, new_thing: 123 });
console.log(s);
console.log(s.stack.pop());
console.log(s);


import { POSIX_Tree_Directory, Dotted_Tree_Directory } from '../../lib/data/object.js';



const root = new POSIX_Tree_Directory();

root.mkdir('/path/to/../thing/');

for (const node of root.walk()) {
	console.log(node.path);
}


const root2 = new Dotted_Tree_Directory();

root2.mkdir('path.to.thing');

for (const node of root2.walk()) {
	console.log(node.path);
}

root2.set('magic.value', 123)
console.log(root2.get('magic.value'));

root2.rmdir('magic.value')

console.log(root2.get('magic.value'));

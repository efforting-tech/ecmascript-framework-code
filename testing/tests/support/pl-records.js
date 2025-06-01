import { Basic_Dotted_Name_Tree_Interface } from '../../../lib/data/object.js';




//TODO - we will wait a bit with these since we will first do the parsing step and then we may use some intermediate representation later on

export class Group {
	constructor(name, parent=null, children={}) {
		Object.assign(this, { name, parent, children });
	}
}



export class Group_Access_Interface extends Basic_Dotted_Name_Tree_Interface {
	static name = 'group';

	create_child(name, parent=undefined) {
		return new Group(name, parent);
	}
}


export const group_access_interface = new Group_Access_Interface();


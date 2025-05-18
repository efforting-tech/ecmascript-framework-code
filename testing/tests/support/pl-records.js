import { Basic_Dotted_Name_Tree_Interface } from '../../../lib/data/object.js';




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


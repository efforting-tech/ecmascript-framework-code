import * as TP from '../text/tree-processing.js';

import { embedded_template_parser } from './parser.js';


export class Template {
	constructor(name, root) {
		Object.assign(this, { name, root });
	}
	static from_string(data, name=undefined) {
		const root = TP.Node.from_string(data);
		root.settings.emit_empty = true;
		return new this(name, embedded_template_parser.process_node(root));
	}
}

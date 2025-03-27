//TODO - note that this has third party dependencies and that we must document what features will be available and not
//TODO - one test per function (4)

import xmlFormat from 'xml-formatter';
import { XMLSerializer } from 'xmldom';
import { neonTheme } from '../../formatting/ansi/simple-themes.js';
import { highlight } from 'cli-highlight';



export function dir_node(node) {
	for (const [sub_tag, sub_node] of iter_node(node)) {
		console.log(sub_tag);
	}
}



export function get_tag_id(node) {
	if (node.namespaceURI) {
		return `${node.namespaceURI} ${node.nodeName}`;
	} else {
		return node.nodeName;
	}
}



export function dump_node(node) {
	const output = xmlFormat((new XMLSerializer()).serializeToString(node), {
		indentation: '  ',
		/*filter: (node) => node.type !== 'Comment', */
		collapseContent: true,
		lineSeparator: '\n',
	});
	console.log(highlight(output, { language: 'xml', ignoreIllegals: true, theme: neonTheme }));
}


export function object_from_attributes(attributes) {
	return Object.fromEntries(
		Array.from(attributes, ({ name, value }) => [name, value])
	);
}

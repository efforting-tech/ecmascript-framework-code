//TODO - note that this has third party dependencies and that we must document what features will be available and not
//TODO - we have 4 planned but not implemented tests and 1 implemented

import { DOMParser } from 'xmldom';
import { get_tag_id } from './utils.js';
import fs from 'fs';

export function* iter_node(node) {
	for (let i = 0; i < node.childNodes?.length ?? 0; i++) {
		const sub_node = node.childNodes[i];
		const tag_id = get_tag_id(sub_node);
		yield [tag_id, sub_node];
	}
}

//TODO - test are WIP
export function process_tree(node, rules, recursive=false, strict=true) {

	// console.log('processing tree', node.nodeName);
	const result = [];

	for (const [tag, child] of iter_node(node)) {
		const sub_result = process_node(child, rules, recursive, strict);
		if (sub_result !== undefined) {
			result.push(sub_result);
		}
	}

	return result.length ? result : undefined;
}


//TODO - this function seem rather unfinished - we should improve upon that.
//TODO - test are WIP
export function process_node(node, rules, recursive=false, strict=true) {
	//console.log('processing', node.nodeName);
	if (node.nodeType === node.ELEMENT_NODE) {
		const tag_id = get_tag_id(node);
		const handler = rules[tag_id];

		//Testing stuff
		// if (tag_id.match( /.*calc.*/i )) {
		// 	console.log(tag_id);
		// }


		if (handler) {
			//console.log('running handler for', tag_id, handler);
			return handler(node);
		} else if (strict) {
			throw new Error(`No handler for ${tag_id}`);
		} else {
			//return 'non-strict-match';
		}

	} else if (node.nodeType === node.TEXT_NODE)  {
		//console.log("text", node.nodeValue);
		//return 'text';
	} else {
		console.log("node", node.nodeType);
		//return 'other-node';
	}

	if (recursive) {
		const result = [];
		for (const [tag, child] of iter_node(node)) {
			const sub_result = process_node(child, rules, recursive, strict);
			if (sub_result !== undefined) {
				result.push(sub_result);
			}
		}
		return result.length ? result : undefined;
	} else {
		//return 'not-recursive';
	}
}


//TODO - test are WIP
export function process_xml_string(string, rules, recursive=false, strict=true) {
	const parser = new DOMParser();
	const xmlDoc = parser.parseFromString(string, "application/xml");
	return process_tree(xmlDoc.documentElement, rules, recursive, strict);
}


//TODO - test are WIP
export function process_xml_file(filename, rules, recursive=false, strict=true) {
	return process_xml_string(fs.readFileSync(filename, 'utf8'), rules, recursive, strict);
}
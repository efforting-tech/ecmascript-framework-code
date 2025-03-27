import * as xml_processing from '../../lib/formats/xml/processing.js';
import * as xml_utils from '../../lib/formats/xml/utils.js';
import { DOMParser } from 'xmldom';


//TODO - these tests need to be improved but we need some better test cases


//iter_node

const parser = new DOMParser();
const xmlDoc = parser.parseFromString(`<root>
	<child name="Alice">
		<grandchild name="Charlie"></grandchild>
	</child>
	<child name="Bob">
		<grandchild name="David"></grandchild>
		<grandcat name="Tuss"></grandcat>
	</child>
</root>`, "application/xml");


/*
function test1() {

	const rules = {
		'child': (node => xml_utils.object_from_attributes(node.attributes).name),
	}

	//Get names from children
	const result = xml_processing.process_node(xmlDoc.documentElement, rules, true, false);
	if (JSON.stringify(result) != '["Alice","Bob"]') {
		throw new Error(`Test failed, unexpected result: ${result}`);
	}
}


function test2() {
	const rules = {
		'grandchild': (node => xml_utils.object_from_attributes(node.attributes).name),
	}

	console.log(xmlDoc.documentElement);

	const result = xml_processing.process_tree(xmlDoc.documentElement, rules, false, true);
	if (JSON.stringify(result) != '["Charlie","David"]') {
		throw new Error(`Test failed, unexpected result: ${result}`);
	}

}

test1();
test2();

process.exit(1);

*/
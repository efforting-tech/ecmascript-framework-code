import * as xml_processing from '../../lib/formats/xml/processing.js';
import { DOMParser } from 'xmldom';

//iter_node

const parser = new DOMParser();
const xmlDoc = parser.parseFromString(`<root>
	<child1>
		<grandchild1></grandchild1>
	</child1>
	<child2></child2>
</root>`, "application/xml");

function *test() {
	for (const [tag_id, sub_node] of xml_processing.iter_node(xmlDoc.documentElement)) {
		if (tag_id != '#text') {
			yield tag_id;
		}
	}
}

const output = JSON.stringify([...test()]);
if (output != '["child1","child2"]') {
	throw new Error(`Test failed, unexpected output: ${output}`);
}

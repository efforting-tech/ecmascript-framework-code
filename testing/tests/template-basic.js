import { dispatch_table as rendering_dispatch_table } from '../../lib/templates/markdown-renderer.js';
import { Template } from '../../lib/templates/types.js';


//Just while experimenting
import { inspect } from 'util';

const template = Template.from_string(`
	This is a template
		We can have «stuff» in it.

	§ python code: block1
		import sys
		# This code block is named «definition name»

	§ python code: block2 {parser: null}
		# This code block is completely literal «definition name»

	Here is more stuff
`, 'my-template');


console.log(rendering_dispatch_table.template.resolve(template).to_string());
import * as LP_String from '../../lib/text/line-processing/string-list.js';
import * as LP_Span from '../../lib/text/line-processing/span-list.js';
import { Span_Closed } from '../../lib/math/span.js';

import { assert_equality } from '../framework/utils.js';


const test1 = LP_Span.View.from_string(
	  '0: Your concept describes a bidirectional build system model—one that not only\n'
	+ '1: resolves how to reach targets from available sources (classic Make-style),\n'
	+ '2: but also considers how to propagate sources into valid target contexts.\n'
	+ '3: This dual perspective could enable:\n'
	+ '4: · Declarative Pull (Make-style):\n'
	+ '5: 	Targets declare dependencies; the system resolves how to build them.\n'
	+ '6: · Declarative Push:\n'
	+ '7: 	Sources declare where or how they should be consumed or applied; the system resolves what to build or update.\n'
 );


function lines_to_span(iterable) {
	return [...Span_Closed.from_consequtive([...iterable].map(line => line.line_index))];
}



assert_equality(lines_to_span(test1.slice(2, 7)), [2, 6]);
assert_equality(lines_to_span(test1.slice(2, 7).slice(2, 4)), [4, 5]);
assert_equality(lines_to_span(test1.slice(2, 7).absolute_slice(2, 4)), [2, 3]);



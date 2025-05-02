import { assert_equality } from '../framework/utils.js';
import * as Indent from '../../lib/text/indent.js';

const tabulators = new Indent.Tabulators(4);

assert_equality(
	tabulators.get_head(2),
	'\t\t',
);
assert_equality(
	(new Indent.Spaces(4)).get_head(2),
	'        ',
);

assert_equality(
	tabulators.get_level_from_head('\t\t'),
	2,
);
assert_equality(
	(new Indent.Spaces(4)).get_level_from_head('          '),
	2,
);

assert_equality(
	tabulators.validate_head('\t\t'),
	true,
);
assert_equality(
	(new Indent.Spaces(4)).validate_head('        '),
	true,
);

assert_equality(
	tabulators.validate_head('          '),
	false,
);
assert_equality(
	(new Indent.Spaces(4)).validate_head('          '),
	false,
);

assert_equality(
	tabulators.to_components('\t\tHello World'),
	[ '\t\t', 'Hello World' ],
);
assert_equality(
	(new Indent.Spaces(4)).to_components('          Hello World'),
	[ '        ', '  Hello World' ],
);



assert_equality(
	tabulators.create_adjusted_head('\t\t', -1),
	'\t',
);
assert_equality(
	(new Indent.Spaces(4)).create_adjusted_head('          ', -1),
	'    ',
);


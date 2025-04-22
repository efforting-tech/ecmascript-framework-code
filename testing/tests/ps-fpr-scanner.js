import { Fixed_Point_Reduction_Scanner } from '../../lib/parsing/scanner.js';
import * as C from '../../lib/data/conditions.js';
import * as R from '../../lib/data/rules.js';

import { assert_equality, assert_error } from '../framework/utils.js'


const s = new Fixed_Point_Reduction_Scanner([

	new R.Transform_Rule(
		new C.Partial_Sequence([
			new C.Value_is('Hello'),
		]), ((scanner, sequence, match) => {
			match.transform_replace('World');
		}),
	),

	new R.Transform_Rule(
		new C.Partial_Sequence([
			new C.Value_is('World'),
		]), ((scanner, sequence, match) => {
			match.transform_replace('Hello');
		}),
	),

]);


const test_data = 'I just want to say: Hello'.split(/\s+/);

assert_error(() => {
	s.transform([...test_data]);
}, /cycle detected/i);

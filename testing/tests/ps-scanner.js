import { Reduction_Scanner } from '../../lib/parsing/scanner.js';
import * as C from '../../lib/data/conditions.js';
import * as SC from '../../lib/data/sequence-conditions.js';
import * as R from '../../lib/data/rules.js';
import { sequence_in_place_replacement } from '../../lib/data/transform.js';

import { assert_equality } from '../framework/utils.js';


const s = new Reduction_Scanner([

	new R.Transform_Rule(
		new SC.Partial_Sequence([
			new C.Type_is('number'),
			new C.Value_is('*'),
			new C.Type_is('number'),
		]), ((scanner, sequence, match) => {
			const [left, op, right] = match.matched_sequence;
			sequence_in_place_replacement(match, left * right);
		}),
	),


	new R.Transform_Rule(
		new SC.Partial_Sequence([
			new C.Type_is('number'),
			new C.Value_is('+'),
			new C.Type_is('number'),
		]), ((scanner, sequence, match) => {
			const [left, op, right] = match.matched_sequence;
			sequence_in_place_replacement(match, left + right);
		}),
	),

]);


const test_data = [10, '+', 20, '*', 50]

//Default reduction order is RULE_MAJOR (so * will come before +)
assert_equality(s.transform([...test_data]), [ 1010 ]);


console.log('SWITCH ORDER');

s.reduction_order = 'POSITION_MAJOR';	//Position order, + will come before *
assert_equality(s.transform([...test_data]), [ 1500 ]);



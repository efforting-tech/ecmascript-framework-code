import { Fixed_Point_Reduction_Scanner, REDUCTION_ORDER } from '../../lib/parsing/scanner.js';
import { FPR_Contract } from '../../lib/parsing/contracts.js';
import * as C from '../../lib/data/conditions.js';
import * as R from '../../lib/data/rules.js';

import { assert_properties, assert_equality, assert_error } from '../framework/utils.js'


const test_rules = [

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

];

const test_data = 'I just want to say: Hello'.split(/\s+/);

const s1 = new Fixed_Point_Reduction_Scanner(test_rules);


assert_error(() => {
	s1.transform([...test_data]);
}, /cycle detected/i);



const s2 = new Fixed_Point_Reduction_Scanner(test_rules, REDUCTION_ORDER.RULE_MAJOR, new FPR_Contract(
	(scanner, sequence) => scanner.cycle_detected
));


const seq2 = [...test_data];
s2.transform(seq2);
assert_equality(seq2, test_data);	//This is because this is expected to exhaust options and therefore cycle back to beginning
assert_properties(s2, {
	reductions_attempted: 2,
	reductions_made: 2,
});



class Custom_Contract extends FPR_Contract {

	constructor(journal) {
		super();
		this.journal = journal;
	}

	check_if_done(scanner, sequence) {
		return scanner.cycle_detected || scanner.last_reduction_status === false;
	}

	on_start_transform(scanner, sequence) {
		super.on_start_transform(scanner, sequence);
		this.journal.push([...sequence]);
	}

	on_reduction_made(scanner, sequence) {
		super.on_reduction_made(scanner, sequence);
		this.journal.push([...sequence]);
	}

}


const result_log3 = [];
const contract3 = new Custom_Contract(result_log3);

const s3 = new Fixed_Point_Reduction_Scanner([test_rules[0]], REDUCTION_ORDER.RULE_MAJOR, contract3);
const seq3 = ['Hello', 'Hello', 'Hello'];

s3.transform(seq3);
assert_equality(result_log3, [
	[ 'Hello', 'Hello', 'Hello' ],
	[ 'World', 'Hello', 'Hello' ],
	[ 'World', 'World', 'Hello' ],
	[ 'World', 'World', 'World' ]
]);

assert_properties(s3, {
	reductions_attempted: 4,
	reductions_made: 3,
});

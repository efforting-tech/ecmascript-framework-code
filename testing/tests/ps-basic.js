import { FPR_State } from '../../lib/parsing/state.js';

const s = new FPR_State();

s.log_state(123);
s.log_state(456);

console.log(s.seen_state(123));

s.discard_state(123);

console.log(s.seen_state(123));

s.clear_journal()
console.log(s.seen_state(456));


console.log(s.gather_state([1, 2, 3]));


console.log(s);


import { Peekable_Iterator, END_OF_ITERATION } from '../iteration/peekable-iterator.js';
import { Constructor_Based_Mapping_Processor } from '../data/dispatchers.js';
import * as RE from '../text/regexp.js';
import { inspect } from 'node:util';


export const CONSUME_NEXT = Symbol('CONSUME_NEXT');
export const CONSUME_REMAINING = Symbol('CONSUME_REMAINING');


//TODO - there is currently a lot of overlap here, we need more cowbell and drysoot.

/*

  Argument parsing framework — architecture summary by OpenAI's ChatGPT 4o (as of 2025-06-28)

  === Core Capabilities ===
  - Modular matcher types:
      * Flag — Boolean presence-only switch via `--flag` or `-f`.
      * Setting — Named value via `--key=value`, `--key value`, or `-kvalue`.
      * Dynamic_Key_Setting — Arbitrary key-value pairs via forms like `-Pkey=value`, `-P key=value`, `-Pkey value`.
      * Static_Key_Setting — Fixed key with value via `-P value` or `-P=value`.
      * Definition_Setting — Variant of Dynamic_Key_Setting supporting value-less keys: `-Dkey`, `-Dkey=value`.
      * Sub_Command — Dispatch to nested rules using leading literal or pattern.
      * Positional — Ordered unnamed arguments.
      * Remaining — Variadic collector of trailing arguments.

  - Parsing model:
      * Token stream is processed via `Peekable_Iterator`, supporting lookahead and consumption tracking.
      * Rule evaluation is driven by `iter_parse()` with short-circuiting on successful match.
      * Matchers produce structured result nodes: `Pattern_Match`, `Sub_Command_Match`, etc.

  - Rule authoring:
      * `Pattern_Matcher.capture(names, pattern)` supports sequential or RegExp-based matching.
      * Capture rules support recursive composition via nested arrays and symbolic constants:
          CONSUME_NEXT, CONSUME_REMAINING.
      * Rule registration is declarative via factories (e.g. `Setting`, `Flag`) producing composable matchers.

  === Output ===
  - `structured_argument_list()` converts match tree into deeply structured data object.
  - Order of arguments is preserved; no flattening into simple key-value maps unless post-processed.

  === Incomplete / Pending ===
  - Constraints:
      * `required`, `min_count`, `max_count` are declared but not enforced.
      * `validator` field is stored but unused; hooks for match-time validation not yet implemented.
  - Diagnostics:
      * Fallback handling and detailed errors are minimal.
  - Duplication:
      * Code paths in `Pattern_Matcher` and `Sub_Command_Matcher` share structural overlap.
  - Utilities:
      * `flatten()` and `flat_matches()` assist in value normalization but are ad hoc.
      * `match_pattern()` is legacy and mostly deprecated.

  === Prospective Enhancements ===
  - Integrate validator support per matcher or per rule.
  - Provide CLI help generation via matcher introspection.
  - Add disambiguation and priority ranking to matcher resolution.
  - Abstract capture resolution into reusable combinator logic.
  - Allow matcher aliases or grouped variants for richer UX.


	Mikaels note:
		Some of the things mentioned here are not what ChatGPT thinks but I am leaving them in because they should be documented properly in case humans makes the same inference mistakes
		Example of this is how unmatched things don't throw errors and such but it is up to the caller to make sure the input stream was consumed for now

*/


function structured_argument_list(item) {

	switch (item.constructor) {

		case Array: {
			const result = [];
			for (const sub_item of item) {
				result.push(structured_argument_list(sub_item));
			}
			return result;
		}

		default:
			//console.log(item);
			return item.structured_argument_list();

	}

}


//TODO - move to iterators
function *iter_in_use(iterable) {
	for (const i of iterable) {
		if ((i !== undefined) && (i !== null)) {
			yield(i);
		}
	}
}

// TODO - deprecate?
function match_pattern(pattern, input) {
	if (pattern === undefined || pattern === null || input === END_OF_ITERATION) {
		return;
	} else if (pattern instanceof RegExp) {
		return pattern.exec(input);
	} else {
		return pattern.match(input);
	}
}



function check_pattern(pattern, iterator) {

	//console.log(["Checking", iterator.peek(), "against", pattern]);

	switch (pattern) {
		case CONSUME_NEXT: {
			return iterator.next().value;
		}
		case CONSUME_REMAINING: {
			return iterator.exhaust();
		}
	}

	switch (pattern.constructor) {
		case RegExp: {
			const match = pattern.exec(iterator.peek());
			if (match) {
				iterator.next();
			}
			return match;
		}
		case Array: {
			const sub_iterator = new Peekable_Iterator(iterator.peek_remaining());
			const result = [];
			for (const sub_pattern of pattern) {
				//console.log(sub_pattern, sub_iterator.peek());

				const sub_result = check_pattern(sub_pattern, sub_iterator);
				if (!sub_result) {
					return;
				} else {
					result.push(sub_result);
				}
			}

			iterator.advance(sub_iterator.consumed_count);
			return result;


		}
		default:
			throw new Error(`Unknown capture rule: ${inspect(pattern)}`);
	}
}




export class Capture_Rule {
	constructor (parent, pattern, names) {
		Object.assign(this, { parent, pattern, names });
	}

	get name() {
		return this.parent.name;
	}

	process_arguments(context) {
		const { pattern } = this;
		const { iterator } = context;
		const sub_result = check_pattern(pattern, iterator);
		if (sub_result) {
			context.result.push(new Capture_Rule_Match(this, sub_result));
		}

	}

}


/*//NOTE: we have removed value here and will get it from match downstream
export class Argument_Match {
	constructor(matcher, match) {
		Object.assign(this, { matcher, match });
	}
}
*/


//TODO - maybe we should use the other fixed point reducer for this - but for now this is fine

function iter_parse(iterator, rules, parent_context=undefined) {
	const context = { iterator, parent_context, result: [] };
	while (iterator.peek() !== END_OF_ITERATION) {
		let success = false;
		for (const rule of rules) {
			const consumed_before = iterator.consumed_count;
			rule.process_arguments(context);
			const consumed_after = iterator.consumed_count;

			if (consumed_after > consumed_before) {
				success = true;
				break;
			}
		}
		if (!success) {
			break;
		}
	}
	return context.result;
}


// Matchers

export class Argument_Matcher {
	constructor (name, description, rules=[], extra_options={}) {
		Object.assign(this, { name, description, rules, ...extra_options });	//TODO - vet extra_options
	}


	structured_argument_list(_arguments, parent_context=undefined) {
		const iterator = new Peekable_Iterator(_arguments);
		const resulting_items = iter_parse(iterator, this.rules, parent_context);


		const remaining = [...iterator];

		if (remaining.length) {
			throw new Error(`The following arguments were not handled by ${this.constructor.name} ${this.name}: ${inspect(remaining)}`)
		}

		return structured_argument_list(resulting_items);

	}
}



export class Pattern_Matcher {
	constructor (name, description, extra_options={}, rules=[]) {
		Object.assign(this, { name, description, rules, ...extra_options });	//TODO - vet extra_options
	}

	capture(names, pattern) {
		this.rules.push(new Capture_Rule(this, pattern, names));
	}

	process_arguments(context) {
		const iterator = new Peekable_Iterator(context.iterator.peek_remaining());
		const result = iter_parse(iterator, this.rules, context);

		if (result.length) {
			context.result.push(new Pattern_Match(this, result));
			context.iterator.advance(iterator.consumed_count);
		}



	}

}

export class Sub_Command_Matcher {
	constructor (name, description, sub_command_rules, extra_options={}, ingress_rules=[]) {
		Object.assign(this, { name, description, sub_command_rules, ingress_rules, ...extra_options });	//TODO - vet extra_options
	}

	capture(names, pattern) {
		this.ingress_rules.push(new Capture_Rule(this, pattern, names));
	}

	process_arguments(context) {
		const iterator = new Peekable_Iterator(context.iterator.peek_remaining());
		const ingress = iter_parse(iterator, this.ingress_rules, context);

		if (ingress.length) {
			const inner = iter_parse(iterator, this.sub_command_rules, context);
			context.iterator.advance(iterator.consumed_count);
			context.result.push(new Sub_Command_Match(this, ingress, inner));
		}

	}

}



// Matches

function flatten(item) {
	switch (item.constructor) {
		case Array: {
			const result = [];
			for (const sub_item of item) {
				const sub_result = flatten(sub_item);
				if (Array.isArray(sub_result)) {
					result.push(...sub_result);
				} else {
					result.push(sub_result);
				}
			}
			if (result.length === 0) {
				return null;
			} else if (result.length === 1) {
				return result[0];
			} else {
				return result;
			}

		}

		default:
			return item;
	}
}


function flat_names(item) {
	switch (item.constructor) {
		case Array: {
			const result = [];
			for (const sub_item of item) {
				result.push(...flat_names(sub_item));
			}
			return result;
		}
		case String: {
			return [item];
		}

		default:
			throw new Error(`Type Error: ${inspect(item)}`);
	}
}



function flat_matches(item) {
	switch (item.constructor) {
		case Array: {
			if ('input' in item) {
				return item.slice(1);	//this is a RegExp match
			} else {
				const result = [];
				for (const sub_item of item) {
					result.push(...flat_matches(sub_item));
				}
				return result;
			}
		}

		case String: {
			return [item];
		}

		default:
			throw new Error(`Type Error: ${inspect(item)}`);
	}
}


export class Sub_Command_Match {
	constructor (matcher, ingress, inner) {
		Object.assign(this, { matcher, ingress, inner });
	}

	structured_argument_list() {
		return {[this.matcher.name]: {
			ingress: structured_argument_list(this.ingress),
			inner: structured_argument_list(this.inner),
		}};



	}
}

export class Capture_Rule_Match {
	constructor (matcher, match) {
		Object.assign(this, { matcher, match });
	}

	structured_argument_list() {
		const names = flat_names(this.matcher.names);
		const matches = flat_matches(this.match);

		//return {[this.matcher.name]: Object.fromEntries(names.map((k, i) => [k, matches[i]]))};
		return Object.fromEntries(names.map((k, i) => [k, matches[i]]));
	}

}

export class Pattern_Match {
	constructor (matcher, match) {
		Object.assign(this, { matcher, match });
	}

	structured_argument_list() {
		return Object.fromEntries([[this.matcher.name, flatten(structured_argument_list(this.match))]]);
	}
}
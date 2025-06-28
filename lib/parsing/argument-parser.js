import { Peekable_Iterator, END_OF_ITERATION } from '../iteration/peekable-iterator.js';
import { Constructor_Based_Mapping_Processor } from '../data/dispatchers.js';
import * as RE from '../text/regexp.js';
import { inspect } from 'node:util';


export const CONSUME_NEXT = Symbol('CONSUME_NEXT');
export const CONSUME_REMAINING = Symbol('CONSUME_REMAINING');


//TODO - there is currently a lot of overlap here, we need more cowbell and drysoot.

/*

  Argument parsing framework — status summary (by OpenAI: ChatGPT 4o 2025-06-27)

  === Implemented Features ===
  - Supported matcher types:
      * Flag — boolean switches via `-f` or `--flag`.
      * Setting — named values via `--key value` or `--key=value`.
      * Dynamic_Key_Setting — dynamic key-value pairs via `-Pname=value` or `-Pname value`.
      * Static_Key_Setting — fixed-key values via `-o value` or `-ovalue`.
      * Sub_Command — command dispatch with nested rules.
      * Positional — ordered unnamed arguments.
      * Remaining — catch-all argument collector.
  - Rule dispatch system via Constructor_Based_Mapping_Processor.
  - Peekable_Iterator provides lookahead and controlled token consumption.
  - Argument_Match instances encapsulate match origin, value, and metadata.
  - `parse_to_bins()` collects parsed values by matcher name, recursing into sub-command results.
  - Strict mode in `parse_to_bins()` throws on unconsumed input.

  === Declared but Incomplete or Unused ===
  - Constraints:
    * `required`, `min_count`, `max_count` present in definitions but not yet enforced.
    * `validator` in Setting and related matchers is unused.
  - Matcher registration:
    * All matcher types have parsing logic registered, but only partial error handling or diagnostics.
  - Control flow:
    * Matching is greedy-first by rule order; no prioritization or backtracking.
  - Code structure:
    * Duplicate parsing logic between Argument_Parser and Sub_Command.
    * Rule handler logic is verbose; future centralization could reduce repetition.
  - Utilities:
    * `maybe_re_concat()` and `iter_in_use()` serve narrow purposes; could be streamlined. ( narrow functions can be local non exported ones, they are still useful / Mikael )

  === Potential Enhancements ===
  - Enforce declared constraints via validation pass post-parse.
  - Implement structured error reporting for ambiguous, repeated, or malformed input.
  - Consolidate rule handlers through pattern strategies or matcher interfaces.
  - Provide introspection over matcher schemas to support CLI help or completion generation.
  - Add composable pattern operators (`anyOf`, `oneOf`, etc.) for richer CLI grammars.

	Mikaels note:
		Some of the things mentioned here are not what ChatGPT thinks but I am leaving them in because they should be documented properly in case humans makes the same inference mistakes
		Example of this is how unmatched things don't throw errors and such but it is up to the caller to make sure the input stream was consumed for now

*/


function to_bins(resulting_items) {
	const bins = {};
	for (const sub_result of resulting_items) {

		let value = sub_result.value;
		if (Array.isArray(value)) {
			if (!value.every(v => typeof v === 'string')) {
				value = to_bins(value);
			}
		}

		let bin = bins[sub_result.matcher.name];
		if (bin === undefined) {
			bin = bins[sub_result.matcher.name] = [value];
		} else {
			bin.push(value);
		}
	};
	return bins;
}


//TODO - move to iterators
function *iter_in_use(iterable) {
	for (const i of iterable) {
		if ((i !== undefined) && (i !== null)) {
			yield(i);
		}
	}
}


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
	console.log(["Checking", iterator.peek(), "against", pattern]);

	switch (pattern) {
		case CONSUME_NEXT: {
			console.log("Consumed item");
			return iterator.next().value;
		}
		case CONSUME_REMAINING: {
			console.log("Consumed remaining");
			return iterator.exhaust();
		}
	}

	switch (pattern.constructor) {
		case RegExp: {
			const match = pattern.exec(iterator.peek());
			if (match) {
				console.log("Had match", match);
				iterator.next();
			}
			return match;
		}
		case Array: {
			const sub_iterator = new Peekable_Iterator(iterator.peek_remaining());
			const result = [];
			for (const sub_pattern of pattern) {
				const sub_result = check_pattern(sub_pattern, sub_iterator);
				if (!sub_result) {
					return;
				} else {
					console.log("Had subresult match", sub_result);
					result.push(sub_result);
				}
			}

			iterator.advance(sub_iterator.consumed_count);
			console.log("Had array match", result);
			return result;


		}
		default:
			throw new Error(`Unknown capture rule: ${inspect(pattern)}`);
	}
}


export class Capture_Rule {
	constructor (pattern, names) {
		Object.assign(this, { pattern, names });
	}


	process_arguments(context) {
		console.log("Should process", this.pattern);
		const { pattern } = this;
		const { iterator } = context;
		const sub_result = check_pattern(pattern, iterator);
		if (sub_result) {
			context.result.push(new Argument_Match(this, sub_result, null));
		}

	}

}


export class Argument_Match {
	constructor(matcher, value, match=null) {
		Object.assign(this, { matcher, value, match });
	}
}



function iter_parse(iterator, rules, parent_context=undefined) {
	const context = { iterator, parent_context, result: [] };
	while (iterator.peek() !== END_OF_ITERATION) {
		const consumed_before = iterator.consumed_count;
		for (const rule of rules) {
			rule.process_arguments(context);
		}
		const consumed_after = iterator.consumed_count;
		console.log('Consoooom', consumed_before, consumed_after);
		if (consumed_before === consumed_after) {
			break;
		}
	}
	return context.result;
}

export class Argument_Matcher {
	constructor (name, description, rules=[], extra_options={}) {
		Object.assign(this, { name, description, rules, ...extra_options });	//TODO - vet extra_options
	}


	parse_to_bins(_arguments, parent_context=undefined) {
		const iterator = new Peekable_Iterator(_arguments);
		const resulting_items = iter_parse(iterator, this.rules, parent_context);

		console.log(iterator);

		const remaining = [...iterator];

		if (remaining.length) {
			throw new Error(`The following arguments were not handled by ${this.constructor.name} ${this.name}: ${inspect(remaining)}`)
		}

		return to_bins(resulting_items);
	}
}



export class Pattern_Matcher {
	constructor (name, description, extra_options={}, rules=[]) {
		Object.assign(this, { name, description, rules, ...extra_options });	//TODO - vet extra_options
	}

	capture(names, pattern) {
		this.rules.push(new Capture_Rule(pattern, names));
	}

	process_arguments(context) {
		console.log("Should process pattern matcher");

		const iterator = new Peekable_Iterator(context.iterator.peek_remaining());
		const result = iter_parse(iterator, this.rules, context);

		if (result.length) {
			console.log("PM result", result);	//TODO - we must extract the proper matches as values here and in some other places
			context.result.push(new Argument_Match(this, null, result));
			context.iterator.advance(iterator.consumed_count);
		}



	}

}

export class Sub_Command_Matcher {
	constructor (name, description, sub_command_rules, extra_options={}, ingress_rules=[]) {
		Object.assign(this, { name, description, sub_command_rules, ingress_rules, ...extra_options });	//TODO - vet extra_options
	}

	capture(names, pattern) {
		this.ingress_rules.push(new Capture_Rule(pattern, names));
	}

	process_arguments(context) {
		console.log("Should process sub command");
		const iterator = new Peekable_Iterator(context.iterator.peek_remaining());
		const ingress = iter_parse(iterator, this.ingress_rules, context);

		if (ingress.length) {
			console.log("Ingress", ingress);
			const inner = iter_parse(iterator, this.sub_command_rules, context);
			console.log("Inner", inner);
			context.iterator.advance(iterator.consumed_count);
		}



	}

}


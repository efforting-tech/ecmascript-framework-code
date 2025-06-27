import { Peekable_Iterator, END_OF_ITERATION } from '../iteration/peekable-iterator.js';
import { Constructor_Based_Mapping_Processor } from '../data/dispatchers.js';
import * as RE from '../text/regexp.js';
import { inspect } from 'node:util';




/*
  Argument parsing framework — status summary (by OpenAI: ChatGPT 4o 2025-06-27)

  === Implemented Features ===
  - Supported matcher types: Sub_Command, Flag, Setting, Positional, Remaining.
  - Dispatch system via Constructor_Based_Mapping_Processor enables type-specific rule handling.
  - Argument_Match captures matcher metadata, value(s), and optional match data.
  - Peekable_Iterator enables lookahead-based parsing with consumption tracking.
  - Setting supports trailing (`--key value`) and baked (`--key=value`) syntaxes.
  - Flag supports long and short forms with exact-match pattern anchoring.
  - Positional and Remaining now populate result with appropriate value collections.
  - `parse_to_bins()` converts parsed results to a name-keyed bin structure, recursing into subcommand output.
  - Remaining tokens post-parse trigger error in `parse_to_bins()` for strict input enforcement.

  === Declared but Incomplete or Unused ===
  - Constraints:
    * `required`, `min_count`, `max_count` defined in matcher options but not enforced.
    * `validator` in Setting is ignored.
  - Matching:
    * No ambiguity or conflict resolution — first matching rule wins. (This is fine / Mikael)
  - Inheritance:
    * Code duplication exists in Argument_Parser and Sub_Command parsing methods.
  - Utilities:
    * `iter_in_use()` is used but not strictly necessary; could be inlined.
    * `maybe_re_concat()` handles nullable inputs; useful but not enforced in pattern validation.

  === Potential Enhancements ===
  - Enforce declared constraints via a validation phase post-parse.
  - Deduplicate parser logic across Argument_Parser and Sub_Command.
  - Emit diagnostics or structured errors on parsing failure or invalid input.
  - Introduce schema introspection to support help generation or shell completions.
  - Add compositional pattern logic (e.g., `anyOf`, `oneOf`) for advanced CLI forms.

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

function maybe_re_concat(..._arguments) {
	for (const a of _arguments) {
		if ((a === null) || (a === undefined)) {
			return;
		}
	}
	return RE.concat(..._arguments);
}


const DEFAULT_SUB_COMMAND_OPTIONS = {
};

const DEFAULT_PARSER_OPTIONS = {
	...DEFAULT_SUB_COMMAND_OPTIONS,
};

const DEFAULT_OPTIONS = {
	required: false,
};


const DEFAULT_CAPTURE_OPTIONS = {
	...DEFAULT_OPTIONS,
	validator: null,
	min_count: null,
	max_count: null,
};

const DEFAULT_REMAINING_OPTIONS = {
	...DEFAULT_CAPTURE_OPTIONS,
};



export class Argument_Match {
	constructor(matcher, value, match=null) {
		Object.assign(this, { matcher, value, match });
	}
}


export class Argument_Parser {
	constructor(name, rules=[], description=null, extra_options=DEFAULT_PARSER_OPTIONS) {
		Object.assign(this, { name, rules, description, ...extra_options });
	}



	iter_parse(iterator, parent_context=undefined) {
		const context = { iterator, parent_context, result: [] };
		while (iterator.peek() !== END_OF_ITERATION) {
			const consumed_before = iterator.consumed_count;
			for (const rule of this.rules) {
				RULE_PROCESSOR.process(context, rule);
			}
			const consumed_after = iterator.consumed_count;
			if (consumed_before === consumed_after) {
				break;
			}
		}
		return context.result;
	}

	parse(_arguments, parent_context=undefined) {
		return this.iter_parse(new Peekable_Iterator(_arguments), parent_context);
	}

	parse_to_bins(_arguments, parent_context=undefined) {
		const iterator = new Peekable_Iterator(_arguments);
		const resulting_items = this.iter_parse(iterator, parent_context);
		const remaining = [...iterator];

		if (remaining.length) {
			throw new Error(`The following arguments were not handled by ${this.constructor.name} ${this.name}: ${inspect(remaining)}`)
		}

		return to_bins(resulting_items);
	}

};


//TODO - this could benefit from the type system so that we could make sure extra_options and such are proper
export class Sub_Command {
	constructor(name, pattern, rules=[], description=null, extra_options=DEFAULT_SUB_COMMAND_OPTIONS) {
		Object.assign(this, { name, pattern, rules, description, ...extra_options });
	}



	//TODO - dedup code?
	iter_parse(iterator, parent_context=undefined) {
		const context = { iterator, parent_context, result: [] };
		while (iterator.peek() !== END_OF_ITERATION) {
			const consumed_before = iterator.consumed_count;
			for (const rule of this.rules) {
				RULE_PROCESSOR.process(context, rule);
			}
			const consumed_after = iterator.consumed_count;
			if (consumed_before === consumed_after) {
				break;
			}
		}
		return context.result;
	}

	parse(_arguments, parent_context=undefined) {
		return this.iter_parse(new Peekable_Iterator(_arguments), parent_context);
	}

};

export class Flag {
	constructor(name, long_pattern, short_pattern=null, description=null, extra_options=DEFAULT_OPTIONS) {
		Object.assign(this, { name, long_pattern, short_pattern, description, ...extra_options });

	}
};

export class Setting {
	constructor(name, long_pattern, short_pattern=null, description=null, extra_options=DEFAULT_CAPTURE_OPTIONS) {
		Object.assign(this, { name, long_pattern, short_pattern, description, ...extra_options });
	}
};

export class Positional {
	constructor(name, description=null, extra_options=DEFAULT_CAPTURE_OPTIONS) {
		Object.assign(this, { name, description, ...extra_options });
	}
};

export class Remaining {
	constructor(name, description=null, extra_options=DEFAULT_REMAINING_OPTIONS) {
		Object.assign(this, { name, description, ...extra_options });
	}
};


const RULE_PROCESSOR = new Constructor_Based_Mapping_Processor('RULE_PROCESSOR');

//TODO, IMPORTANT - these rules are not complete and does not check all requirements

RULE_PROCESSOR.register( Sub_Command, (context, processor, item) => {
	const match = match_pattern(item.pattern, context.iterator.peek());
	if (match) {
		context.iterator.next();	// Consume the matched item
		// Enter sub command
		const sub_result = item.iter_parse(context.iterator, context);
		context.result.push(new Argument_Match(item, sub_result, match));
	}

});

RULE_PROCESSOR.register( Setting, (context, processor, item) => {

	/* TODO - currently we make the following assumptions (assuming input patterns are strings like below)

		For short_pattern `-s` and long_pattern `--long` we will check:

			Trailing value
				`-s «VALUE»`
				`--long «VALUE»`

			Baked value
				`-s=«VALUE»`
				`--long=«VALUE»`

	*/

	const trailing_patterns = [
		maybe_re_concat(/^/, item.short_pattern, /$/),
		maybe_re_concat(/^/, item.long_pattern, /$/),
	];


	const baked_patterns = [
		maybe_re_concat(/^/, item.short_pattern, /=(.*)$/),
		maybe_re_concat(/^/, item.long_pattern, /=(.*)$/),
	];


	for (const pattern of trailing_patterns) {
		const match = match_pattern(pattern, context.iterator.peek());
		if (match) {
			context.iterator.next();	// Consume the matched item
			context.result.push(new Argument_Match(item, context.iterator.next().value, match));	// Also consume the trailing item
			return;
		}
	}

	for (const pattern of baked_patterns) {
		const match = match_pattern(pattern, context.iterator.peek());
		if (match) {
			context.iterator.next();	// Consume the matched item
			context.result.push(new Argument_Match(item, match[1], match));
			return;
		}
	}


});

RULE_PROCESSOR.register( Flag, (context, processor, item) => {

	/* TODO - currently we assume these are strings so we add anchors */

	const patterns_to_check = [
		maybe_re_concat(/^/, item.short_pattern, /$/),
		maybe_re_concat(/^/, item.long_pattern, /$/),
	];

	for (const pattern of patterns_to_check) {
		const match = match_pattern(pattern, context.iterator.peek());
		if (match) {
			context.result.push(new Argument_Match(item, context.iterator.next().value, match));
			return;
		}
	}
});

RULE_PROCESSOR.register( Positional, (context, processor, item) => {
	if (context.iterator.peek() !== END_OF_ITERATION) {
		context.result.push(new Argument_Match(item, context.iterator.next().value));
	}


});

RULE_PROCESSOR.register( Remaining, (context, processor, item) => {
	context.result.push(new Argument_Match(item, [...context.iterator]));
});

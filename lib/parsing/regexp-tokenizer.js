import { inspect } from 'util';

import * as RE from '../text/regexp.js';
import * as C from '../data/conditions.js';


//TODO - look into unifying this with other conditions we have

export class Local_Regexp_Rule {
	constructor(pattern, action) {
		const pattern_source = RE.get_source(pattern);
		const pattern_flags = RE.get_flags(pattern);

		const immediate_flags = String.prototype.concat(...(new Set([...pattern_flags, 'y'])));
		const scanning_flags =  String.prototype.concat(...(new Set([...pattern_flags, 'y', 'g'])));

		this.immediate_pattern = new RegExp(pattern_source, immediate_flags);
		this.scanning_pattern = new RegExp(pattern_source, scanning_flags);

		this.action = action;
	}
}



export class Pattern_Match {
	constructor(match, rule, type=null) {
		this.match = match;
		this.rule = rule;
		this.type = type;
	}

	get value() {
		return this.match.slice(1);
	}

	get handler() {
		return this.rule.handler;
	}

	get pending_index() {
		return this.match.index + this.match[0].length;
	}

	get index() {
		return this.match.index;
	}

};


export class Default_Match {
	constructor(text, index, end_index, rule, type=null) {
		this.text = text;
		this.index = index;
		this.end_index = end_index;
		this.rule = rule;
		this.type = type;
	}

	get handler() {
		return this.rule;
	}

	get value() {
		return [this.text];
	}

	get pending_index() {
		if (this.end_index === null) {
			return null;
		} else {
			return this.end_index;
		}
	}

};




export class Advanced_Regex_Tokenizer {
	constructor(name, rules=[], default_rule) {
		this.name = name;
		this.rules = [];
		this.default_rule = default_rule;

		for (const rule of rules) {

			if (rule.condition instanceof C.Regex_Condition) {
				this.rules.push(new Local_Regexp_Rule(rule.condition.pattern, rule.action));
			}
		}

	}


	*feed(text, position=0) {

		while (true) {
			const new_chunk = [...this.find_matches(text, position)];

			if (new_chunk.length) {
				position = new_chunk.at(-1).pending_index;
				yield* new_chunk;
			} else {
				position = null;
			}

			if (position === null) {
				return;
			}
		}

	}

	_handle_default_match(value, index, end_index=null) {
		const default_rule = this.default_rule;
		if (!default_rule) {
			throw new Error(`Parsing failed, no match for ${JSON.stringify(value)} (${inspect(this, { depth: null, colors: true })})`) ; //TODO actual exception object
		}
		return new Default_Match(value, index, end_index, default_rule);
	}

	*find_matches(text, position=0) {
		// First pass - immediate matches
		for (const rule of this.rules) {

			const pattern = rule.immediate_pattern;
			pattern.lastIndex = position;
			const match = pattern.exec(text);
			if (match) {
				yield new Pattern_Match(match, rule);
				return;
			}

		}

		// Second pass - global matches
		let best_match;
		for (const rule of this.rules) {
			const pattern = rule.scanning_pattern;
			pattern.lastIndex = position;
			const match = pattern.exec(text);

			if (match) {
				if ((best_match === undefined) || (best_match.match.index > match.index)) {
					best_match = new Pattern_Match(match, rule);
				}
			}
		}

		console.log('BM', best_match);

		// There was no match, just get the tail
		if (!best_match) {
			const tail = text.slice(position);
			if (tail.length) {
				yield this._handle_default_match(tail, position);
			}
			return;
		}

		// There was a match, check the head
		const head = text.slice(position, best_match.match.index);
		if (head.length) {
			yield this._handle_default_match(head, position, best_match.match.index);
		}

		yield best_match;

	}

};



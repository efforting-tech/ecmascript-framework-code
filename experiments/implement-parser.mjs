import { dump, assert, not_handled, assert_unset, assert_empty_array, assert_defined, assert_type, assert_found, not_implemented } from 'efforting.tech-framework/validation/utils.js';
import { assign_property_stack } from 'efforting.tech-framework/data/stack.js';
import * as AST from './parsing-ast.mjs';
import { inspect } from 'node:util';
import * as RE from 'efforting.tech-framework/text/regexp.js';


export class Parsing_Error extends Error {
	constructor(tracking_info) {
		const { parser, value } = tracking_info;
		super(`Parsing error detected. No rule in parser "${parser.name}" matches the value ${JSON.stringify(value)}.`);
		Object.assign(this, tracking_info);
	}
}


// TODO Move to lib
function set_property(target, name, value) {
	Object.defineProperty(target, name, {
		value,
		writable: false,
		configurable: true,
		enumerable: true,
	});
}


class Regexp_Rule {

	constructor(pattern, action) {
		Object.assign(this, { pattern, action });
	}

	get pattern_source() {
		const value = RE.get_source(this.pattern);
		set_property(this, 'pattern_source', value);
		return value;
	}

	get pattern_flags() {
		const value =  RE.get_flags(this.pattern);
		set_property(this, 'pattern_flags', value);
		return value;
	}

	get immediate_pattern() {
		const { pattern_flags, pattern_source } = this;
		const immediate_flags = String.prototype.concat(...(new Set([...pattern_flags, 'y'])));
		const value = new RegExp(pattern_source, immediate_flags);
		set_property(this, 'immediate_pattern', value);
		return value;
	}

	get scanning_pattern() {
		const { pattern_flags, pattern_source } = this;
		const scanning_flags = String.prototype.concat(...(new Set([...pattern_flags, 'g'])));
		const value = new RegExp(pattern_source, scanning_flags);
		set_property(this, 'scanning_pattern', value);
		return value;
	}

}


export class Default_Match {
	constructor(text, index, end_index, action) {
		this.text = text;
		this.index = index;
		this.end_index = end_index;
		this.action = action;
	}

	get plain_matches() {
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


export class Pattern_Match {
	constructor(match, rule) {
		this.match = match;
		this.rule = rule;
	}

	get plain_matches() {
		return this.match.slice(1);
	}

	get action() {
		return this.rule.action;
	}

	get pending_index() {
		return this.match.index + this.match[0].length;
	}

	get index() {
		return this.match.index;
	}

};

class Token_Match {
	constructor(state, token, match_or_value) {
		Object.assign(this, { state, token, match_or_value });
	}

	get plain_matches() {
		if (Array.isArray(this.match_or_value)) {
			return this.match_or_value.map(i => i.plain_matches);
		} else {
			return this.match_or_value.plain_matches;
		}
	}

	get value() {
		if (this.match_or_value instanceof Default_Match) {
			return this.match_or_value.text;
		} else if (this.match_or_value instanceof Pattern_Match) {
			return this.match_or_value.match.slice(1);
		} else if (Array.isArray(this.match_or_value)) {
			return this.match_or_value.map(i => i.value);
		} else {
			not_handled(this.match_or_value);
		}
	}

}


export class Standard_Token_Processor {

	static process_token(state, token, match_or_value) {
		return new Token_Match(state, token, match_or_value)
	}

}

export class Pass_Through_Token_Processor {
	constructor(processor) {
		Object.assign(this, { processor });
	}

	process_token(state, token, match_or_value) {
		return this.processor(state, token, match_or_value);
	}

}

class Generic_Parsing_System {
	constructor(name, sub_parsers={}, token_lut={}, ingress=undefined, regexp_resolver=to_regexp, default_token_processor=Standard_Token_Processor, token_processor_factory=undefined, strict_stack_check=true) {
		Object.assign(this, { name, sub_parsers, token_lut, ingress, regexp_resolver, default_token_processor, token_processor_factory, strict_stack_check });
		assign_property_stack(this, 'factory_stack');
	}

	resolve_token(token) {
		const result = this.token_lut[token];
		assert_found(token, result);
		return result;
	}

	resolve_token_processor(processor) {
		return processor ?? this.default_token_processor;
	}

	[inspect.custom](depth, options, inspect) {
		const { name, sub_parsers } = this;
		if (name) {
			return `${this.constructor.name}(${inspect(name, options)} with sub parsers ${Object.keys(sub_parsers).map(p => inspect(p, options)).join(", ")})`;
		} else {
			return `${this.constructor.name}(sub parsers: ${Object.keys(sub_parsers).map(p => inspect(p, options)).join(", ")})`;
		}
	}

	parse(text, start_position=0) {
		const state = new Generic_Parsing_State(this, text, start_position);
		state.parse_all();

		if (this.strict_stack_check) {
			assert_empty_array(state.stack.stack);
		}

		return state;
	}

}

class Generic_Parsing_State {
	constructor(system, text, start_position=0, position=start_position, parser=system.ingress, pending_position=null, value=[]) {
		Object.assign(this, { system, text, start_position, position, parser, pending_position, value })
		assign_property_stack(this, 'stack');
	}

	*[Symbol.iterator]() {
		yield* this.value;
	}

	parse_next() {

		const { pending_position } = this;
		if (pending_position !== null) {
			this.position = pending_position;
			this.pending_position = null;
		}

		const { system, parser, text, position } = this;
		const current_parser = system.sub_parsers[parser];

		const match = current_parser.find_next_match(text, position);
		const { action } = match;
		// TODO - use resolver

		this.perform_match_action(system, match, action);

	}

	perform_match_action(system, match, action) {
		//TODO - resolver
		if (action instanceof AST.Emit_Token) {
			const { token } = action;
			const tp = system.resolve_token_processor(action.token_processor);
			assert_defined(tp);
			this.value.push(tp.process_token(this, token, match));
			this.pending_position = match.pending_index;

		} else if (action instanceof AST.Enter) {
			const { pending_actions, sub_parser } = action;
			this.stack.push({ pending_actions, parser: sub_parser, value: [] });
			this.pending_position = match.pending_index;

		} else if (action instanceof AST.Exit) {
			const { value, pending_actions } = this;
			this.stack.pop();
			this.perform_actions(system, value, pending_actions);

			if (action.pending_actions.length > 0) {
				not_implemented();	//TODO - figure out - implement
			}
			//this.perform_actions(system, match, action.pending_actions);
			this.pending_position = match.pending_index;

		} else {
			not_handled(action);
		}
	}

	perform_actions(system, value, action_list) {
		//TODO - resolver
		for (const action of action_list) {
			if (action instanceof AST.Emit_Token) {
				const { token } = action;
				const tp = system.resolve_token_processor(action.token_processor);
				assert_defined(tp);
				this.value.push(tp.process_token(this, token, value));	//SIGNATURE: (state, token, value)
			} else {
				not_handled(action);
			}
		}
	}

	parse_all() {
		while (true) {
			this.parse_next();
			if (this.pending_position === null) {
				break;
			};
		}
	}
}

class Generic_Regexp_Parser {
	constructor(system, name, rules=[], default_action=null) {
		Object.assign(this, { system, name, rules, default_action });
	}

	add_regexp_rule(pattern, action) {
		const { system, rules } = this;
		const regexp = system.regexp_resolver(pattern);
		const rule = new Regexp_Rule(regexp, action);
		rules.push(rule);
		return rule;
	}

	handle_default_match(value, index, end_index=null) {
		const default_action = this.default_action;
		if (!default_action) {
			throw new Parsing_Error({ parser: this, value, index, end_index });
		}
		return new Default_Match(value, index, end_index, default_action);
	}

	find_next_match(text, position=0) {
		// First pass - immediate matches
		for (const rule of this.rules) {

			const pattern = rule.immediate_pattern;
			pattern.lastIndex = position;
			const match = pattern.exec(text);
			if (match) {
				return new Pattern_Match(match, rule);
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

		// There was no match, just get the tail
		if (!best_match) {
			const tail = text.slice(position);
			if (tail.length) {
				return this.handle_default_match(tail, position);
			}
		}

		// There was a match, check the head
		if (best_match) {
			const head = text.slice(position, best_match.match.index);
			if (head.length) {
				return this.handle_default_match(head, position, best_match.match.index);
			}
		}

		return best_match;

	}

}

export function to_regexp(data) {
	//TODO - this should be a resolver
	if (data instanceof RegExp) {
		return data;
	} else if (typeof data === 'string') {
		return RegExp(RegExp.escape(data));
	} else {
		not_handled(data);
	}
}



export function implement_parser(parser) {
	assert_type(parser, AST.Parsing_System);
	const result = new Generic_Parsing_System(parser.name);

	for (const component of parser.components) {
		implement_component(result, component);
	}

	return result;
}


export function implement_component(system, component) {
	//TODO - use resolver
	if (component instanceof AST.Assign_Tokens) {
		for (const ts of component.token_sources) {
			Object.assign(system.token_lut, ts)
		}
	} else if (component instanceof AST.Assign_Default_Token_Processor) {
		system.default_token_processor = component.processor;
	} else if (component instanceof AST.Assign_Token_Processor_Factory) {
		system.token_processor_factory = component.factory;
	} else if (component instanceof AST.Sub_Parser) {
		implement_sub_parser(system, component);
	} else {
		not_handled(component);
	}
}

export function implement_action(target_parser, action) {

	if (action instanceof AST.Emit_Token) {
		const { token } = action;
		let { token_processor } = action;

		if (!token_processor.process_token) {
			token_processor = target_parser.system.token_processor_factory(token_processor);
		}
		const pending_actions = action.pending_actions.map(a => implement_action(target_parser, a));
		return new action.constructor(token, token_processor, pending_actions);

	} else if (action instanceof AST.Enter) {
		const { sub_parser } = action;
		const pending_actions = action.pending_actions.map(a => implement_action(target_parser, a));
		return new action.constructor(sub_parser, pending_actions);

	} else if (action instanceof AST.Exit) {
		const pending_actions = action.pending_actions.map(a => implement_action(target_parser, a));
		return new action.constructor(pending_actions);

	} else {
		dump(action);
		not_implemented()
	}


}

export function implement_rule(target_parser, rule) {
	//TODO - use resolver
	const system = target_parser.system;
	if (rule instanceof AST.Pattern_Token) {
		target_parser.add_regexp_rule(system.resolve_token(rule.token), implement_action(target_parser, rule.action));
	} else if (rule instanceof AST.Pattern_Default) {
		assert_unset(target_parser.default_action);
		target_parser.default_action = implement_action(target_parser, rule.action);
	} else if (rule instanceof AST.Push_Token_Processor_Factory) {
		target_parser.system.factory_stack.push({ token_processor_factory: rule.factory });
	} else if (rule instanceof AST.Pop_Token_Processor_Factory) {
		target_parser.system.factory_stack.pop();
	} else {
		dump(rule)
		not_implemented();
	}
}

export function implement_sub_parser(system, sub_parser) {
	const implemented_parser = new Generic_Regexp_Parser(system, sub_parser.name);

	for (const rule of sub_parser.rules) {
		implement_rule(implemented_parser, rule);
	}

	assert_unset(system.sub_parsers[implemented_parser.name]);
	system.sub_parsers[implemented_parser.name] = implemented_parser;

	if (system.ingress === undefined) {
		system.ingress = implemented_parser.name;
	}

	return implemented_parser;
}
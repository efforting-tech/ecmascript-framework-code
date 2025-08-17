import { dump, assert, not_handled, assert_unset, assert_empty_array, assert_defined, assert_type, assert_found, not_implemented } from '../../validation/utils.js';
import { assign_property_stack } from '../../data/stack.js';
import * as AST from './ast.js';
import { inspect } from 'node:util';
import * as RE from '../../text/regexp.js';


export class Tokenization_Error extends Error {
	constructor(tracking_info) {
		const { tokenizer, value } = tracking_info;
		super(`Tokenization error detected. No rule in tokenizer "${tokenizer.name}" matches the value ${JSON.stringify(value)}.`);
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
	constructor(input, text, index, end_index, action) {
		Object.assign(this, { input, text, index, end_index, action });
	}

	[inspect.custom](depth, options, inspect) {
		const { text } = this;
		return `${this.constructor.name}(${inspect(text, options)})`;
	}

	get span() {
		return [this.index, this.end_index]
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

	get input() {
		return this.match.input;
	}

	[inspect.custom](depth, options, inspect) {
		const { match } = this;
		return `${this.constructor.name}(${inspect(match[0], options)})`;
	}



	get end_index() {
		return this.match.index + this.match[0].length;
	}

	get span() {
		return [this.match.index, this.end_index]
	}

	get value() {
		if (this.match.length === 1) {
			return this.match[0];
		} else {
			return this.match.slice(1);
		}
	}

	get plain_matches() {
		if (this.match.length === 1) {
			return this.match[0];
		} else {
			return this.match.slice(1);
		}
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

export class Token_Match {
	constructor(state, token, match_or_value) {
		Object.assign(this, { state, token, match_or_value });
	}

	get input() {
		return this.match_or_value.input;
	}

	get index() {
		return this.match_or_value.index;
	}

	get end_index() {
		return this.match_or_value.end_index;
	}

	[inspect.custom](depth, options, inspect) {
		const { token, match_or_value } = this;
		if (match_or_value) {
			return `${this.constructor.name}(${inspect(token, options)}, ${inspect(match_or_value, options)})`;
		} else {
			return `${this.constructor.name}(${inspect(token, options)})`;
		}
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
			return this.match_or_value.value;
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

class Generic_Tokenization_System {
	constructor(name, sub_tokenizers={}, token_lut={}, ingress=undefined, regexp_resolver=to_regexp, default_token_processor=Standard_Token_Processor, token_processor_factory=undefined, strict_stack_check=true) {
		Object.assign(this, { name, sub_tokenizers, token_lut, ingress, regexp_resolver, default_token_processor, token_processor_factory, strict_stack_check });
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
		const { name, sub_tokenizers } = this;
		if (name) {
			return `${this.constructor.name}(${inspect(name, options)} with sub tokenizers ${Object.keys(sub_tokenizers).map(p => inspect(p, options)).join(", ")})`;
		} else {
			return `${this.constructor.name}(sub tokenizers: ${Object.keys(sub_tokenizers).map(p => inspect(p, options)).join(", ")})`;
		}
	}

	tokenize(text, start_position=0, sub_tokenizer=null) {
		const state = new Generic_Tokenization_State(this, text, start_position);
		if (sub_tokenizer) {
			state.tokenizer = sub_tokenizer;
		}
		state.tokenize_all();

		if (this.strict_stack_check) {
			assert_empty_array(state.stack.stack);
		}

		return state;
	}

}

class Generic_Tokenization_State {
	constructor(system, text, start_position=0, position=start_position, tokenizer=system.ingress, pending_position=null, value=[], pending_actions=[]) {
		Object.assign(this, { system, text, start_position, position, tokenizer, pending_position, value, pending_actions })
		assign_property_stack(this, 'stack');
	}

	*[Symbol.iterator]() {
		yield* this.value;
	}

	tokenize_next() {

		const { pending_position } = this;
		if (pending_position !== null) {
			this.position = pending_position;
			this.pending_position = null;
		}

		const { system, tokenizer, text, position } = this;
		const current_tokenizer = system.sub_tokenizers[tokenizer];

		const match = current_tokenizer.find_next_match(text, position);
		if (match) {
			const { action } = match;
			// TODO - use resolver

			this.perform_match_action(system, match, action);
		} else if (this.position === this.text.length) {
			// Done
		} else {
			throw new Error('Tokenization error');
		}
	}

	perform_match_action(system, match, action) {
		//TODO - resolver

		if (action instanceof AST.Emit_Token) {

			const { token, token_processor } = action;
			const tp = system.resolve_token_processor(action.token_processor);
			assert_defined(tp);
			this.value.push(tp.process_token(this, token, match));
			this.pending_position = match.pending_index;

		} else if (action instanceof AST.Enter) {

			let { sub_tokenizer } = action;
			if (!sub_tokenizer) {
				sub_tokenizer = this.tokenizer;
			}

			this.stack.push({ pending_actions: [], tokenizer: sub_tokenizer, value: [] });
			this.pending_position = match.pending_index;

		} else if (action instanceof AST.Action_Sequence) {
			const { conjunctive_actions, deferred_actions } = action;
			this.perform_actions(system, match, conjunctive_actions);
			this.pending_actions.push(...deferred_actions);

		} else if (action instanceof AST.Exit) {

			const { value, pending_actions } = this;
			this.stack.pop();
			this.perform_actions(system, value, pending_actions);

			this.pending_position = match.pending_index;

		} else {
			not_handled(action);
		}
	}

	perform_actions(system, value, action_list) {
		for (const action of action_list) {
			this.perform_match_action(system, value, action);
		}
	}

	tokenize_all() {
		while (true) {
			this.tokenize_next();
			if (this.pending_position === null) {
				break;
			};
		}
	}
}

class Generic_Regexp_tokenizer {
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

	handle_default_match(input, value, index, end_index=null) {
		const default_action = this.default_action;
		if (!default_action) {
			throw new Tokenization_Error({ tokenizer: this, value, index, end_index });
		}
		return new Default_Match(input, value, index, end_index, default_action);
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
				return this.handle_default_match(text, tail, position);
			}
		}

		// There was a match, check the head
		if (best_match) {
			const head = text.slice(position, best_match.match.index);
			if (head.length) {
				return this.handle_default_match(text, head, position, best_match.match.index);
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



export function implement_tokenizer(tokenizer) {
	assert_type(tokenizer, AST.Tokenization_System);
	const result = new Generic_Tokenization_System(tokenizer.name);

	for (const component of tokenizer.components) {
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
	} else if (component instanceof AST.Sub_Tokenizer) {
		implement_sub_tokenizer(system, component);
	} else {
		not_handled(component);
	}
}

export function implement_action(target_tokenizer, action) {
	return action;
}


//deprecated
export function dep_implement_action(target_tokenizer, action) {



	if (action instanceof AST.Emit_Token) {
		const { token } = action;
		let { token_processor } = action;

		//TODO - figure out why we are resolving it like this and not calling the resolve function
		if (!token_processor?.process_token) {
			if (target_tokenizer.system.token_processor_factory) {
				token_processor = target_tokenizer.system.token_processor_factory(token_processor);
			} else {
				token_processor = target_tokenizer.system.default_token_processor;
			}
		}
		return new action.constructor(token, token_processor);

	} else if (action instanceof AST.Emit_Pending_Tokens) {
		const { token } = action;
		throw new Error('TODO - implement');
		const pending_actions = action.pending_actions.map(a => implement_action(target_tokenizer, a));
		return new action.constructor(pending_actions);

	} else if (action instanceof AST.Enter) {
		throw new Error('TODO - implement');
		const { sub_tokenizer } = action;
		const pending_actions = action.pending_actions.map(a => implement_action(target_tokenizer, a));
		return new action.constructor(sub_tokenizer, pending_actions);

	} else if (action instanceof AST.Exit) {
		throw new Error('TODO - implement');
		const pending_actions = action.pending_actions.map(a => implement_action(target_tokenizer, a));
		return new action.constructor(pending_actions);

	} else {
		dump(action);
		not_implemented()
	}


}

export function implement_rule(target_tokenizer, rule) {
	//TODO - use resolver
	const system = target_tokenizer.system;
	if (rule instanceof AST.Pattern_Token) {
		target_tokenizer.add_regexp_rule(system.resolve_token(rule.token), implement_action(target_tokenizer, rule.action));
	} else if (rule instanceof AST.Pattern_Default) {
		assert_unset(target_tokenizer.default_action);
		target_tokenizer.default_action = implement_action(target_tokenizer, rule.action);
	} else if (rule instanceof AST.Push_Token_Processor_Factory) {
		target_tokenizer.system.factory_stack.push({ token_processor_factory: rule.factory });
	} else if (rule instanceof AST.Pop_Token_Processor_Factory) {
		target_tokenizer.system.factory_stack.pop();
	} else {
		dump(rule)
		not_implemented();
	}
}

export function implement_sub_tokenizer(system, sub_tokenizer) {
	const implemented_tokenizer = new Generic_Regexp_tokenizer(system, sub_tokenizer.name);

	for (const rule of sub_tokenizer.rules) {
		implement_rule(implemented_tokenizer, rule);
	}

	assert_unset(system.sub_tokenizers[implemented_tokenizer.name]);
	system.sub_tokenizers[implemented_tokenizer.name] = implemented_tokenizer;

	if (system.ingress === undefined) {
		system.ingress = implemented_tokenizer.name;
	}

	return implemented_tokenizer;
}
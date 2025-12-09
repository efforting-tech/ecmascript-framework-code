import * as AST from './ast.js';

function _ol(item) {	// Optional List
	if (item.length === 1) {
		return item[0];
	} else {
		return item;
	}
}



export function enter(sub_tokenizer) {
	return new AST.Enter(sub_tokenizer);
}

export function exit() {
	//TODO - support exit-processor?
	return new AST.Exit();
}

export function emit_token(token, token_processor=null) {
	return new AST.Emit_Token(token, token_processor);
}

export function call_function_emit_value(function_ref, token_processor=null) {
	return new AST.Call_Function_Emit_Value(function_ref, token_processor);
}

export function emit_pending_tokens() {
	return new AST.Emit_Pending_Tokens();
}

export function on_token(token, ...actions) {
	return new AST.Pattern_Token(token, _ol(actions));
}

export function default_action(...actions) {
	return new AST.Pattern_Default(_ol(actions));
}

export function sub_tokenizer(name, ...rules) {
	return new AST.Sub_Tokenizer(name, rules);
}

export function tokenization_system(name, ...components) {
	return new AST.Tokenization_System(name, components);
}

export function assign_tokens(...token_sources) {
	return new AST.Assign_Tokens(token_sources);
}

export function set_default_token_processor(processor) {
	return new AST.Assign_Default_Token_Processor(processor);
}

export function set_token_processor_factory(factory) {
	return new AST.Assign_Token_Processor_Factory(factory);
}

export function push_token_processor_factory(factory) {
	return new AST.Push_Token_Processor_Factory(factory);
}

export function pop_token_processor_factory() {
	return new AST.Pop_Token_Processor_Factory();
}

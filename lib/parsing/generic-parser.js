import { Switchable_Iterator } from '../iteration/switchable-iterator.js';
import { init_stack_channel } from '../data/stack.js';

export class Parser {

	constructor(source, tokenizer, pending_position=0, pending_value=[], sub_tokenizer_handlers=[]) {
		this.token_generator = new Switchable_Iterator();
		init_stack_channel(this, 'stack', { tokenizer, pending_position, pending_value, sub_tokenizer_handlers })
		this.switch_to(tokenizer, pending_position, source);
	}


	switch_to(tokenizer, pending_position=undefined, source=undefined) {
		//console.log('SWITCH', tokenizer.name, pending_position);
		const pending = { tokenizer, pending_position, source };
		for (const [key, value] of Object.entries(pending)) {
			if (value !== undefined) {
				this[key] = value;
			}
		}

		this.token_generator.switch_to(this.tokenizer.feed(this.source, this.pending_position));
	}


	parse() {
		const start_frame = this.stack.top;

		for (const match of this.token_generator) {
			const handler = match.rule.action;
			this.pending_position = match.pending_index;
			this.pending_match = match;
			if (handler) {
				handler(this, ...match.value);
			}
		}

		//TODO - check if top level?
		//console.log("Done?", start_frame == this.stack.top);

		return this.pending_value;

	}

	push_token(...token) {
		this.pending_value.push(...token);
	}


	enter_sub_tokenizer(tokenizer, handler=undefined) {
		this.stack.push();
		this.pending_value = [];
		if (handler) {
			this.sub_tokenizer_handlers.push(handler);
		}
		this.switch_to(tokenizer);
	}

	leave_sub_tokenizer() {
		const frame = this.stack.pop();

		if (this.sub_tokenizer_handlers.length) {
			const handler = this.sub_tokenizer_handlers.pop();
			//this.push_token(
			this.pending_match = null;
			handler(this, frame.pending_value);//);
		} else {
			this.push_token(frame.pending_value);
		}

		this.switch_to(this.tokenizer, frame.pending_position);
		return frame;
	}


	process_sub_expression(tokenizer) {
		this.enter_sub_tokenizer(tokenizer);
		return this.parse().pop(-1);	//Pop top of pending_value
	}


}
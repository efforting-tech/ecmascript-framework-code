import { State_Serializer } from './state-serializer.js';
import { createHash } from 'crypto';




export class Abstract_State {
	constructor(seen = new Set()) {
		Object.assign(this, { seen });
	}

	gather_state(sequence) {
		throw new Error(`gather_state(sequence) not implemented for ${this.constructor.name}`);
	}

	seen_state(state) {
		return this.seen.has(state);
	}

	log_state(state) {
		this.seen.add(state);
	}

	discard_state(state) {
		this.seen.delete(state);
	}

	clear_journal() {
		this.seen.clear();
	}
}

export class FPR_State extends Abstract_State {
	constructor(seen = new Set(), serializer = new State_Serializer()) {
		super(seen);
		Object.assign(this, { serializer });
	}

	gather_state(sequence) {
		const str = JSON.stringify(this.serializer.serialize_object(sequence));
		const hash = createHash('sha1').update(str).digest('hex');
		return `${hash.slice(0, 8)}-${str}`;
	}

}
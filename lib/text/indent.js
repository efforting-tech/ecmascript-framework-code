import * as RE from './regexp.js';
import { clamped_scalar } from '../data/scalars.js';

//NOTE - this does not care about line endings, they should not be included when calling these functions - a higher level settings object could be encompassing both line endings and indention

export class Tabulators {
	static component_pattern = /^(\t*)(.*)$/

	static get_head(level=1) {
		return '\t'.repeat(level);
	}

	static get_level_from_head(head) {
		return head.length;
	}

	static create_adjusted_head(original_head, adjustment=0) {
		return '\t'.repeat(clamped_scalar(original_head.length + adjustment, 0, undefined));
	}

	static validate_head(head) {
		const [extracted_head] = head.match(this.component_pattern).slice(1);
		return head.length === extracted_head.length;
	}

	static to_components(text) {
		return text.match(this.component_pattern).slice(1);
	}
}

export class Spaces {
	constructor(width=4) {
		const component_pattern = RE.concat('^(', `(?:[ ]{${width}})`, '*)', /(.*)$/ );
		Object.assign(this, { width, component_pattern });
	}

	get_head(level=1) {
		return ' '.repeat(this.width * level);
	}

	get_level_from_head(head) {
		return Math.floor(head.length / this.width);
	}

	create_adjusted_head(original_head, adjustment=0) {
		return ' '.repeat(this.width * clamped_scalar(Math.floor(original_head.length / this.width) + adjustment, 0, undefined));
	}

	validate_head(head) {
		const [extracted_head] = head.match(this.component_pattern).slice(1);
		return head.length === extracted_head.length;
	}

	to_components(text) {
		return text.match(this.component_pattern).slice(1);
	}

}
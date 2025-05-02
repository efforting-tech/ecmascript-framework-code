import * as log from '../debug/console.js';
import * as RE from './regexp.js';
import { clamped_scalar } from '../data/scalars.js';



export class Tabulators {
	constructor(width=4) {
		const component_pattern = /^(\t*)(.*)$/;
		const indexed_component_pattern = RE.update_flag(component_pattern, 'd', true);
		Object.assign(this, { width, component_pattern, indexed_component_pattern });
	}

	level_to_visual_column(level) {
		return 1 + level * this.width;
	}

	get_level_from_span(span) {
		return span[1] - span[0];
	}

	get_head(level=1) {
		return '\t'.repeat(level);
	}

	get_level_from_head(head) {
		return head.length;
	}

	create_adjusted_head(original_head, adjustment=0) {
		return '\t'.repeat(clamped_scalar(original_head.length + adjustment, 0, undefined));
	}

	validate_head(head) {
		const [extracted_head] = head.match(this.component_pattern).slice(1);
		return head.length === extracted_head.length;
	}

	to_components(text) {
		return text.match(this.component_pattern).slice(1);
	}

	to_component_spans(text, sub_span=undefined) {
		if (sub_span) {
			const [left, right] = sub_span;
			const [[head_left, head_right], [title_left, title_right]] = text.slice(left, right).match(this.indexed_component_pattern).indices.slice(1);
			return [[head_left + left, head_right + left], [title_left + left, title_right + left]];

		} else {
			return text.match(this.indexed_component_pattern).indices.slice(1);
		}
	}

	to_level_and_title(text) {
		const [head, title] = text.match(this.component_pattern).slice(1);
		return [this.get_level_from_head(head), title];
	}

}



export class Spaces {
	constructor(width=4) {
		const component_pattern = RE.concat('^(', `(?:[ ]{${width}})`, '*)', /(.*)$/ );
		const indexed_component_pattern = RE.update_flag(component_pattern, 'd', true);
		Object.assign(this, { width, component_pattern, indexed_component_pattern });
	}

	level_to_visual_column(level) {
		return 1 + level * this.width;
	}

	get_level_from_span(span) {
		return Math.floor((span[1] - span[0]) / this.width);
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

	to_component_spans(text, sub_span=undefined) {
		if (sub_span) {
			const [left, right] = sub_span;
			const [[head_left, head_right], [title_left, title_right]] = text.slice(left, right).match(this.indexed_component_pattern).indices.slice(1);
			return [[head_left + left, head_right + left], [title_left + left, title_right + left]];

		} else {
			return text.match(this.indexed_component_pattern).indices.slice(1);
		}
	}

	to_level_and_title(text) {
		const [head, title] = text.match(this.component_pattern).slice(1);
		return [this.get_level_from_head(head), title];
	}

}
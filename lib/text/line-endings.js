import * as RE from './regexp.js';

export class Line_Ending {
	constructor(ending_pattern=/\n/, unambiguous_line_ending) {

		const basic_full_pattern = RE.concat(/(.*)/, '(', ending_pattern, ')');
		const full_pattern = RE.update_flag(basic_full_pattern, 'g', true);
		const line_pattern = RE.concat(/^/, basic_full_pattern, /$/);

		Object.assign(this, {ending_pattern, line_pattern, full_pattern, unambiguous_line_ending} );
	}

	split_lines(text) {
		return [...this.iter_lines(text)];
	}

	split_full_lines(text) {
		return [...this.iter_full_lines(text)];
	}

	*iter_lines(text) {
		let last_index = undefined;
		for (const match of text.matchAll(this.full_pattern)) {
			yield match[1];
			last_index = match.index + match[0].length;
		}
		if (last_index !== undefined) {
			yield text.slice(last_index);
		}
	}

	*iter_full_lines(text) {
		let last_index = undefined;
		for (const match of text.matchAll(this.full_pattern)) {
			yield match.slice(1);
			last_index = match.index + match[0].length;
		}
		if (last_index !== undefined) {
			yield [text.slice(last_index), ''];
		}
	}

}
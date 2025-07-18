import * as log from '../debug/console.js';
import * as RE from './regexp.js';

export class Line_Ending {
	constructor(ending_pattern=/\n/, unambiguous_line_ending='\n', name=undefined) {

		const basic_full_pattern = RE.concat(/(.*)/, '(', ending_pattern, ')');
		const optional_ending_full_pattern = RE.concat(/(.*)/, '((:?', ending_pattern, ')?)');

		const full_pattern = RE.update_flag(basic_full_pattern, 'g', true);
		const indexed_full_pattern = RE.update_flag(full_pattern, 'd', true);

		const line_pattern = RE.concat(/^/, optional_ending_full_pattern, /$/);
		const indexed_line_pattern = RE.update_flag(line_pattern, 'd', true);

		Object.assign(this, {ending_pattern, line_pattern, full_pattern, unambiguous_line_ending, indexed_full_pattern, indexed_line_pattern, name} );
	}

	split_lines(text) {
		return [...this.iter_lines(text)];
	}

	split_full_lines(text) {
		return [...this.iter_components(text)];
	}

	//TODO - use a count function
	count_lines(text) {
		let count = 0;
		for (const item of this.iter_lines(text)) {
			count++;
		}
		return count;
	}

	count_line_endings(text) {
		let count = 0;
		for (const item of this.iter_line_endings(text)) {
			count++;
		}
		return count;
	}

	join(lines) {
		return lines.join(this.unambiguous_line_ending);
	}

	*iter_lines(text) {
		let last_index = undefined;
		for (const match of text.matchAll(this.full_pattern)) {
			yield match[1];
			last_index = match.index + match[0].length;
		}
		if (last_index === undefined) {
			yield text;
		} else {
			yield text.slice(last_index);
		}
	}

	*iter_components(text) {
		let last_index = undefined;
		for (const match of text.matchAll(this.full_pattern)) {
			yield match.slice(1);
			last_index = match.index + match[0].length;
		}
		if (last_index === undefined) {
			yield [text, ''];
		} else {
			yield [text.slice(last_index), ''];
		}
	}

	*iter_component_spans(text) {
		let last_index = undefined;
		for (const match of text.matchAll(this.indexed_full_pattern)) {
			yield match.indices.slice(1);
			last_index = match.indices[2][1];
		}

		if (last_index === undefined) {
			yield [[0, text.length], [text.length, text.length]];
		} else {
			yield [[last_index, text.length], [text.length, text.length]];
		}
	}


	*iter_line_endings(text) {
		for (const match of text.matchAll(this.full_pattern)) {
			yield match[2];
		}
	}


	to_components(line) {
		return line.match(this.line_pattern).slice(1);
	}

	to_component_spans(line, sub_span=undefined) {

		if (sub_span) {
			const [left, right] = sub_span;
			const [title_span, ending_span] = line.slice(left, right).match(this.indexed_line_pattern).indices.slice(1);
			return [[title_span[0] + left, title_span[1] + left], [ending_span[0] + left, ending_span[1] + left]];	//TODO - adjust span function
		} else {
			return line.match(this.indexed_line_pattern).indices.slice(1);

		}
	}
}

export const POSIX = new Line_Ending(/\n/, '\n', 'POSIX')
export const MACOS = new Line_Ending(/\r/, '\r', 'MacOS')
export const WINDOWS = new Line_Ending(/\r\n/, '\r\n', 'Windows')
export const UNIVERSAL = new Line_Ending(/\r\n|\r|\n/, '\n', 'Universal')

export function detect_line_ending(test_text) {
	//Returns [line_endings or undefined, confidence level (true/false) or undefined]
	const W = WINDOWS.count_line_endings(test_text);
	const P = POSIX.count_line_endings(test_text) - W;
	const M = MACOS.count_line_endings(test_text) - W;

	if ((P === 0) && (M === 0) && (W === 0)) {
		return [undefined, undefined];
	} else if ((P === 0) && (M === 0)) {
		return [WINDOWS, true];
	} else if ((M === 0) && (W === 0)) {
		return [POSIX, true];
	} else if ((P === 0) && (W === 0)) {
		return [MACOS, true];
	} else if ((P > M ) && (P > W)) {
		return [POSIX, false];
	} else if ((M > P ) && (M > W)) {
		return [MACOS, false];
	} else if ((W > P ) && (W > M)) {
		return [WINDOWS, false];
	} else {
		return [undefined, undefined];
	}
}

import * as RE from './regexp.js';

export class Line_Ending {
	constructor(ending_pattern=/\n/, unambiguous_line_ending='\n', name=undefined) {

		const basic_full_pattern = RE.concat(/(.*)/, '(', ending_pattern, ')');
		const full_pattern = RE.update_flag(basic_full_pattern, 'g', true);
		const line_pattern = RE.concat(/^/, basic_full_pattern, /$/);

		Object.assign(this, {ending_pattern, line_pattern, full_pattern, unambiguous_line_ending, name} );
	}

	split_lines(text) {
		return [...this.iter_lines(text)];
	}

	split_full_lines(text) {
		return [...this.iter_full_lines(text)];
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

	*iter_line_endings(text) {
		for (const match of text.matchAll(this.full_pattern)) {
			yield match[2];
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

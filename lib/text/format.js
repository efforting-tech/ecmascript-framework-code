export class Text_Format {
	constructor(line_endings, indention_mode) {
		Object.assign(this, { line_endings, indention_mode });
	}

	*iter_components(text) {
		// Returns [head, title, tail]
		for (const [line, tail] of this.line_endings.iter_components(text)) {
			yield [...this.indention_mode.to_components(line), tail];
		}
	}

	*iter_level_title_ending(text) {
		// Returns [level, title, tail]
		for (const [line, tail] of this.line_endings.iter_components(text)) {
			yield [...this.indention_mode.to_level_and_title(line), tail];
		}
	}

	*iter_level_and_components(text) {
		// Returns [head, title, tail]
		for (const [line, tail] of this.line_endings.iter_components(text)) {
			const [head, title] = this.indention_mode.to_components(line);
			const level = this.indention_mode.get_level_from_head(head);
			yield [level, head, title, tail];
		}
	}

	*iter_level_and_component_spans(text) {
		// Returns [head, title, tail]
		for (const [line_span, tail_span] of this.line_endings.iter_component_spans(text)) {
			const [head_span, title_span] = this.indention_mode.to_component_spans(text, line_span);
			const head = text.slice(...head_span);
			const level = this.indention_mode.get_level_from_head(head);
			yield [level, head_span, title_span, tail_span];
		}
	}

}

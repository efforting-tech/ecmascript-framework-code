
export const language_definition_1 = `
	tokens:
		optional_space: /(\s*)/
		default token: anything

	group: template.basic

		tokenizer: embedding
			statement: '§' optional_space, anything as value ;

		tokenizer: body
			expression: '«' anything as value '»' ;

`
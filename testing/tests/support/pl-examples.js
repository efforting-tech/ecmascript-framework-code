
export const language_definition_1 = `
	tokens:
		optional_space: /(\s*)/
		default token: anything

	group: template.basic

		tokenizer: embedding
			statement: '§' optional_space, anything as value ;
			meta: '§§' anything as metadata ;

		tokenizer: body
			expression: '«' anything as value '»' ;

`


export const ld2 = `

	token table: common
		-whitespace: /\s+/
		comment: /\#(.*)$/m




`
# Planning out DSL specification for generic DSL specification

## Purpose
The **DSL-DSL** is a declarative language designed to describe the structure and semantics of other domain-specific languages. Its goal is to replace manual parser construction (e.g. hand-written tokenizers and reduction rules) with a structured, interpretable specification format.


### Base components

#### Literals
- Strings
- Regular expressions

#### References
- Internal identifiers
- External identifiers

#### Captures


Repetition modifiers

	?	zero or 1
	+	One or more
	*	Any amount
	{2,4}	min 2, max 4

Repetititon modifiers modifiers
	?	non-greedy




---

Note: This table schema represents an earlier idea for how to make this schema. This whole document is only a place holder that will be addressed once the foundational layers are more flushed out.

Table schema: token_table_schema
	match column: symbol
		@create.symbol

	match column: definition
		@create.definition

	default:
		pass through as text


Table: primitive_tokens using token_table_schema

	escape		symbol				representation			description
	------		------				--------------			-----------
	0			NULL				\0						Null character
	n			NEWLINE				\n						Newline
	r			CARRIAGE_RETURN		\r						Carriage return
	"			QUOTE.DOUBLE		@repr.double_quote		Double quotation mark
	'			QUOTE.SINGLE		@repr.single_quote		Single quotation mark
				ARROW.R.ASCII		->						ASCII compatible arrow
				ARROW.R				→						Arrow

Table: composit_tokens using token_table_schema
	symbol				description
	------				-----------
	Literal				Literal text data


Table: main_tokens using token_table_schema
	symbol			definition											description
	----			----------											-----------
	Identifier		/\w+/												Identifier
	SQ_String		[SINGLE_QUOTE sq_string_body SINGLE_QUOTE]			Single quoted string
	DQ_String		[DOUBLE_QUOTE dq_string_body DOUBLE_QUOTE]			Double qouted string

Table mapping: escape_map
	table: primitive_tokens
	key predicate: not empty
	key: escape
	value: symbol

Tokenizer: sq_string_body
	escape_sequence: ['\' escape_map]
	default token: Literal

Tokenizer: dq_string_body
	escape_sequence: ['\' escape_map]
	default token: Literal

# Line Interface Specification

This document describes the common interface shared by both `string-list.Line` and `span-list.Line` classes in the Efforting text processing framework. It defines the required constructor parameters, instance properties, and method signatures so that any implementation conforming to this interface can be tested and documented consistently.
> [!NOTE]
> This was written by ChatGPT and has not yet been properly vetted

## Constructor

```js
new Line(owner, head, title, tail, line_index?, column_index?)
```
- `owner`: reference to the container/view object, which must have a `text_format` property.
- `head`: either a string or a span tuple depending on implementation.
- `title`: string or span.
- `tail`: string or span.
- `line_index`: optional line index in the view.
- `column_index`: optional starting column index of the line.

## Static Methods

### Common
- N/A

### Specific
- `Line.from_string(owner, string, line_index?, column_index?)` — for `string-list`
- `Line.from_line_span(owner, span, line_index?, column_index?)` — for `span-list`

## Instance Properties

### Common (Both Implementations)
- `owner`: Reference to the parent view.
- `line_index`: Optional integer index in the view.
- `column_index`: Optional starting column.
- `indent_level`: Returns the logical indentation level.
- `title_length`: Number of characters in the `title`.
- `title_visual_column`: Visual start column of the title.
- `title`: Title string.
- `head`: Indentation string.
- `tail`: Trailing characters (typically line ending).
- `full_line`: Concatenation of `head + title + tail`.
- `indented_copy(adjustment = 0)`: Returns a new line with adjusted indentation.
	> [!NOTE]
	> This will be removed for now and move that responsibility to the owner

### Specific to `span-list`
- `head_span`: Span `[start, end]` of the indentation.
- `title_span`: Span `[start, end]` of the title.
- `tail_span`: Span `[start, end]` of the tail.
- `full_span`: Span `[start, end]` covering the entire line.

## Interface Testing Notes

A conformance test module should validate that a `Line` instance:
- Correctly reports its `indent_level`, `title_length`, and `title_visual_column`
- Can return the proper `full_line` content
- Produces a structurally equivalent `Line` when calling `indented_copy()`
- Maintains consistent logic regardless of representation type (string vs span)

### Additional Notes

- Span-specific fields and methods are available only in the `span-list` implementation and should not be assumed in general interface tests.
- When testing both implementations, tests should focus on the common interface and conditionally verify extended capabilities.

This interface defines the stable contract for all line representations and should be version-locked if extended.


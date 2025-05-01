import { assert_equality } from '../framework/utils.js';
import { Line_Ending } from '../../lib/text/line-endings.js';
import { inspect } from 'util';


const posix = new Line_Ending(/\n/, '\n')
const macos = new Line_Ending(/\r/, '\r')
const windows = new Line_Ending(/\r\n/, '\r\n')
const universal = new Line_Ending(/\r\n|\r|\n/, '\n')

const text = 'Hello World|How are you?|Regards'.split(/\|/);

const posix_text = text.join(posix.unambiguous_line_ending);
const macos_text = text.join(macos.unambiguous_line_ending);
const windows_text = text.join(windows.unambiguous_line_ending);
const universal_text = text.join(universal.unambiguous_line_ending);


assert_equality(
	posix.split_full_lines(posix_text),
	[["Hello World","\n"],["How are you?","\n"],["Regards",""]]
);

assert_equality(
	macos.split_full_lines(macos_text),
	[["Hello World","\r"],["How are you?","\r"],["Regards",""]]
);

assert_equality(
	windows.split_full_lines(windows_text),
	[["Hello World","\r\n"],["How are you?","\r\n"],["Regards",""]]
);

assert_equality(
	universal.split_full_lines(posix_text),
	[["Hello World","\n"],["How are you?","\n"],["Regards",""]]
);

assert_equality(
	universal.split_full_lines(macos_text),
	[["Hello World","\r"],["How are you?","\r"],["Regards",""]]
);

assert_equality(
	universal.split_full_lines(windows_text),
	[["Hello World","\r\n"],["How are you?","\r\n"],["Regards",""]]
);


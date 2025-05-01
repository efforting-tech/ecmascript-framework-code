import { POSIX, WINDOWS, MACOS, Line_Ending, detect_line_ending } from '../../lib/text/line-endings.js';
import { assert_equality } from '../framework/utils.js';


const text = 'Hello World|How are you?|Regards'.split(/\|/);
const posix_mixed_text = 'Hello World\rHow Are you?\nAll good?\r\nMostly posix eh?\n';
const macos_mixed_text = 'Hello World\rHow Are you?\nAll good?\r\nMostly macos eh?\r';
const windows_mixed_text = 'Hello World\rHow Are you?\nAll good?\r\nMostly windows eh?\r\n';
const mixed_text = 'Hello World\rHow Are you?\nAll good?\r\n';

const posix_text = POSIX.join(text);
const macos_text = MACOS.join(text);
const windows_text = WINDOWS.join(text);


assert_equality(
	detect_line_ending(''),
	[undefined, undefined]
);

assert_equality(
	detect_line_ending(posix_text),
	[POSIX, true]
);
assert_equality(
	detect_line_ending(macos_text),
	[MACOS, true]
);
assert_equality(
	detect_line_ending(windows_text),
	[WINDOWS, true]
);

assert_equality(
	detect_line_ending(posix_mixed_text),
	[POSIX, false]
);
assert_equality(
	detect_line_ending(macos_mixed_text),
	[MACOS, false]
);
assert_equality(
	detect_line_ending(windows_mixed_text),
	[WINDOWS, false]
);

assert_equality(
	detect_line_ending(mixed_text),
	[undefined, undefined]
);


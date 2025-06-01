import { Table_Printer } from '../../../lib/table/printer.js';

import { inspect } from "util";

export const TP = new Table_Printer(
	null,
	['┃ ', ' ', ' ┃ ', ' ┃'],
	['┣━', '━', '━╋━', '━┫'],
	['┃ ', ' ', ' ┃ ', ' ┃'],
	null,
	(value) => inspect(value, {colors: false, depth: 0}),
);


/* console.log(inspect('hello', {colors: true, depth: 0}))

$ node testing/tests/tp-raster.js  | hexdump -C
00000000  1b 5b 33 32 6d 27 68 65  6c 6c 6f 27 1b 5b 33 39  |.[32m'hello'.[39|
00000010  6d 0a                                             |m.|
00000012

NOTE: we don't get STX/ETX from inspect - we have to roll our own

*/
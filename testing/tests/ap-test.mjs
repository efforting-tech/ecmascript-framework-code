// TODO - this is just copied over from PoC state.
// TODO - we should refine how we run our tests, maybe we can just have "library" or something as the name of the library and then use npm link.

import { Argument_Parser, Sub_Command, Flag, Setting, Positional, Remaining, Dynamic_Key_Setting, Static_Key_Setting, Definition_Setting } from 'efforting.tech-framework/parsing/argument-definition.js';
import { Peekable_Iterator } from 'efforting.tech-framework/iteration/peekable-iterator.js';

import { inspect } from 'node:util';


const argument_parser = Argument_Parser('argument_parser', [

	Sub_Command('erase', 'erase', [
		Flag('force', '--force', null, 'Forceful erasure'),
	]),

	Dynamic_Key_Setting('template', '--template', '-T', 'Select template origin'),
	Setting('output', '--output', '-o', 'Sets output file'),
	Setting('key', '--key', '-k', 'Set what key to use for the chest', { required: true, max_count: 1 }),
	Flag('simulation_only', '--dry-run', 'Dry run'),
	Definition_Setting('definition', null, '-D', 'Define'),
	Sub_Command('pending_command', '--', [
		Positional('command', 'The command to execute'),
		Remaining('arguments', 'Arguments for the command'),
	]),

]);


const a = 'erase --force -Dmydef -D otherdef=456 -Dthirddef=768 -k 123 -Tmain=hello -o output.file -ofile -Textra stuff -T extra2=stuff2 --key=hello -- blargh blorgh blerg'.split(/\s+/);

const bins = argument_parser.structured_argument_list(a);
console.log(inspect(bins, { colors: true, depth: null }));


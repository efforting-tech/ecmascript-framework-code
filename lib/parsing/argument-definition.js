import * as RE from '../text/regexp.js';
import * as P from './argument-parser.js';

const DEFAULT_SUB_COMMAND_OPTIONS = {
};

const DEFAULT_PARSER_OPTIONS = {
	...DEFAULT_SUB_COMMAND_OPTIONS,
};

const DEFAULT_OPTIONS = {
	required: false,
};


const DEFAULT_CAPTURE_OPTIONS = {
	...DEFAULT_OPTIONS,
	validator: null,
	min_count: null,
	max_count: null,
};

const DEFAULT_REMAINING_OPTIONS = {
	...DEFAULT_CAPTURE_OPTIONS,
};


function maybe_re_concat(..._arguments) {
	for (const a of _arguments) {
		if ((a === null) || (a === undefined)) {
			return;
		}
	}
	return RE.concat(..._arguments);
}


export function Argument_Parser(name, rules=[], description=null, extra_options={...DEFAULT_PARSER_OPTIONS}) {
	extra_options.type ??= 'Argument_Parser';
	return new P.Argument_Matcher(name, description, rules, extra_options);
}

export function Sub_Command(name, pattern, rules=[], description=null, extra_options={...DEFAULT_SUB_COMMAND_OPTIONS}) {
	extra_options.type ??= 'Sub_Command';
	if (Array.isArray(pattern)) {
		extra_options.source_patterns = pattern;
	} else {
		extra_options.source_patterns = [pattern];
	}

	const target = new P.Sub_Command_Matcher(name, description, rules, extra_options);

	for (const sub_pattern of extra_options.source_patterns) {
		//	-P
		target.capture('command', maybe_re_concat(/^/, sub_pattern, /$/));
	}

	return target;
}

export function Flag(name, long_pattern, short_pattern=null, description=null, extra_options={...DEFAULT_OPTIONS}) {
	extra_options.type ??= 'Flag';
	extra_options.source_patterns = [long_pattern, short_pattern];
	const target = new P.Pattern_Matcher(name, description, extra_options);
	for (const pattern of extra_options.source_patterns) {
		if (!pattern) {
			continue;
		}
		//	-P
		target.capture('flag', maybe_re_concat(/^/, pattern, /$/));
	}
	return target;
}

export function Setting(name, long_pattern, short_pattern=null, description=null, extra_options={...DEFAULT_CAPTURE_OPTIONS}) {
	//NOTE - this may not be API stable, maybe we would want this setting to do -s«value» and --long «value»
	extra_options.type ??= 'Setting';
	extra_options.source_patterns = [long_pattern, short_pattern];
	const target = new P.Pattern_Matcher(name, description, extra_options);
	for (const pattern of extra_options.source_patterns) {
		if (!pattern) {
			continue;
		}
		//	-P «VALUE»
		target.capture('value', [maybe_re_concat(/^/, pattern, /$/), P.CONSUME_NEXT]);
		//	-P«VALUE»
		target.capture('value', maybe_re_concat(/^/, pattern, /(.+)/));
	}
	return target;
}

export function Dynamic_Key_Setting(name, long_pattern, short_pattern=null, description=null, extra_options={...DEFAULT_CAPTURE_OPTIONS}) {
	extra_options.type ??= 'Dynamic_Key_Setting';
	extra_options.source_patterns = [long_pattern, short_pattern];
	const target = new P.Pattern_Matcher(name, description, extra_options);
	for (const pattern of extra_options.source_patterns) {
		if (!pattern) {
			continue;
		}
		//	-P «NAME»=«VALUE»
		target.capture(['name', 'value'], [maybe_re_concat(/^/, pattern, /$/), /^([^=]+)=(.*)/s]);
		//	-P«NAME»=«VALUE»
		target.capture(['name', 'value'], maybe_re_concat(/^/, pattern, /([^=]+)=(.*)/s));
		// 	-P«NAME» «VALUE»
		target.capture(['name', 'value'], [maybe_re_concat(/^/, pattern, /([^=]+)$/), P.CONSUME_NEXT]);
		// 	-P «NAME» «VALUE»
		target.capture(['name', 'value'], [maybe_re_concat(/^/, pattern, /$/), P.CONSUME_NEXT, P.CONSUME_NEXT]);
	}
	return target;
}

export function Static_Key_Setting(name, long_pattern, short_pattern=null, description=null, extra_options={...DEFAULT_CAPTURE_OPTIONS}) {
	extra_options.type ??= 'Static_Key_Setting';
	extra_options.source_patterns = [long_pattern, short_pattern];
	const target = new P.Pattern_Matcher(name, description, extra_options);
	for (const pattern of extra_options.source_patterns) {
		if (!pattern) {
			continue;
		}
		//	-P «VALUE»
		target.capture('value', [maybe_re_concat(/^/, pattern, /$/), P.CONSUME_NEXT]);
		//	-P=«VALUE»
		target.capture('value', maybe_re_concat(/^/, pattern, /=(.*)/s));
	}
	return target;
}

export function Definition_Setting(name, long_pattern, short_pattern=null, description=null, extra_options={...DEFAULT_CAPTURE_OPTIONS}) {
	extra_options.type ??= 'Definition_Setting';
	extra_options.source_patterns = [long_pattern, short_pattern];
	const target = new P.Pattern_Matcher(name, description, extra_options);
	for (const pattern of extra_options.source_patterns) {
		if (!pattern) {
			continue;
		}
		//	-P «NAME»=«VALUE»
		target.capture(['name', 'value'], [maybe_re_concat(/^/, pattern, /$/), /^([^=]+)=(.*)/s]);
		//	-P«NAME»=«VALUE»
		target.capture(['name', 'value'], [maybe_re_concat(/^/, pattern, /([^=]+)=(.*)/s)]);
		//	-P«NAME»
		target.capture('name', maybe_re_concat(/^/, pattern, /([^=]+)$/));
	}
	return target;
}

export function Positional(name, description=null, pattern=null, extra_options={...DEFAULT_CAPTURE_OPTIONS}) {
	extra_options.type ??= 'Positional';
	extra_options.source_patterns = [pattern];
	const target = new P.Pattern_Matcher(name, description, extra_options);

	if (pattern) {
		target.capture('value', pattern);
	} else {
		//	positional_argument
		target.capture('value', P.CONSUME_NEXT);
	}
	return target;
}

export function Remaining(name, description=null, extra_options={...DEFAULT_REMAINING_OPTIONS}) {
	extra_options.type ??= 'Remaining';
	const target = new P.Pattern_Matcher(name, description, extra_options);
	//	remaining arguments
	target.capture('arguments', P.CONSUME_REMAINING);
	return target;
}




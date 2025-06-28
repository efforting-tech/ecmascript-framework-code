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


export function Argument_Parser(name, rules=[], description=null, extra_options=DEFAULT_PARSER_OPTIONS) {
	return new P.Argument_Matcher(name, description, rules, extra_options);
}

export function Sub_Command(name, pattern, rules=[], description=null, extra_options=DEFAULT_SUB_COMMAND_OPTIONS) {
	const target = new P.Sub_Command_Matcher(name, description, rules, extra_options);
	//	-P
	target.capture('command', maybe_re_concat(/^/, pattern, /$/));
	return target;
}

export function Flag(name, long_pattern, short_pattern=null, description=null, extra_options=DEFAULT_OPTIONS) {
	const target = new P.Pattern_Matcher(name, description, extra_options);
	for (const pattern of [long_pattern, short_pattern]) {
		if (!pattern) {
			continue;
		}
		//	-P
		target.capture('flag', maybe_re_concat(/^/, pattern, /$/));
	}
	return target;
}

export function Setting(name, long_pattern, short_pattern=null, description=null, extra_options=DEFAULT_CAPTURE_OPTIONS) {
	const target = new P.Pattern_Matcher(name, description, extra_options);
	for (const pattern of [long_pattern, short_pattern]) {
		if (!pattern) {
			continue;
		}
		//	-P «VALUE»
		target.capture('value', [maybe_re_concat(/^/, pattern, /$/), P.CONSUME_NEXT]);
		//	-P=«VALUE»
		target.capture('value', maybe_re_concat(/^/, pattern, /=(.*)/));
		//	-P«VALUE»
		target.capture('value', maybe_re_concat(/^/, pattern, /(.+)/));
	}
	return target;
}

export function Dynamic_Key_Setting(name, long_pattern, short_pattern=null, description=null, extra_options=DEFAULT_CAPTURE_OPTIONS) {
	const target = new P.Pattern_Matcher(name, description, extra_options);
	for (const pattern of [long_pattern, short_pattern]) {
		if (!pattern) {
			continue;
		}
		//	-P «NAME»=«VALUE»
		target.capture(['name', 'value'], [maybe_re_concat(/^/, pattern, /$/), /^([^=]+)=(.*)$/]);
		//	-P«NAME»=«VALUE»
		target.capture(['name', 'value'], maybe_re_concat(/^/, pattern, /([^=]+)=(.*)$/));
		// 	-P«NAME» «VALUE»
		target.capture(['name', 'value'], [maybe_re_concat(/^/, pattern, /([^=]+)$/), P.CONSUME_NEXT]);
		// 	-P «NAME» «VALUE»
		target.capture(['name', 'value'], [maybe_re_concat(/^/, pattern, /$/), P.CONSUME_NEXT, P.CONSUME_NEXT]);
	}
	return target;
}

export function Static_Key_Setting(name, long_pattern, short_pattern=null, description=null, extra_options=DEFAULT_CAPTURE_OPTIONS) {
	const target = new P.Pattern_Matcher(name, description, extra_options);
	for (const pattern of [long_pattern, short_pattern]) {
		if (!pattern) {
			continue;
		}
		//	-P «VALUE»
		target.capture('value', [maybe_re_concat(/^/, pattern, /$/), P.CONSUME_NEXT]);
		//	-P=«VALUE»
		target.capture('value', maybe_re_concat(/^/, pattern, /=(.*)/));
	}
	return target;
}

export function Definition_Setting(name, long_pattern, short_pattern=null, description=null, extra_options=DEFAULT_CAPTURE_OPTIONS) {
	const target = new P.Pattern_Matcher(name, description, extra_options);
	for (const pattern of [long_pattern, short_pattern]) {
		if (!pattern) {
			continue;
		}
		//	-P «NAME»=«VALUE»
		target.capture(['name', 'value'], [maybe_re_concat(/^/, pattern, /$/), /^([^=]+)=(.*)$/]);
		//	-P«NAME»=«VALUE»
		target.capture(['name', 'value'], [maybe_re_concat(/^/, pattern, /([^=]+)=(.*)$/)]);
		//	-P«NAME»
		target.capture('name', maybe_re_concat(/^/, pattern, /([^=]+)$/));
	}
	return target;
}

export function Positional(name, description=null, extra_options=DEFAULT_CAPTURE_OPTIONS) {
	const target = new P.Pattern_Matcher(name, description, extra_options);
	//	positional_argument
	target.capture('value', P.CONSUME_NEXT);
	return target;
}

export function Remaining(name, description=null, extra_options=DEFAULT_REMAINING_OPTIONS) {
	const target = new P.Pattern_Matcher(name, description, extra_options);
	//	remaining arguments
	target.capture('arguments', P.CONSUME_REMAINING);
	return target;
}




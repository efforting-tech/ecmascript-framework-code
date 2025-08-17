import * as P from 'efforting.tech-framework/parsing/basic-tokenizer/declarative.js';
import { create_character_tokens, create_symbol_tokens,  create_escape_tokens, Match_Based_Token_Processor } from 'efforting.tech-framework/parsing/basic-tokenizer/basic-tokenizer.js';
import { implement_tokenizer, Pass_Through_Token_Processor } from 'efforting.tech-framework/parsing/basic-tokenizer/implementation.js';
import { create_records_from_raster_table  } from 'efforting.tech-framework/operations/high-level-dispatchers.js';
import { dump, assert, assert_type } from 'efforting.tech-framework/validation/utils.js';


import { System } from 'efforting.tech-framework/tree-language/system.js';
import { Program_Context } from 'efforting.tech-framework/tree-language/context.js';

const token_characters = '|«»[]() \t\n';
const token_names = 'PIPE, LD_ARROW, RD_ARROW, LSQ_PAR, RSQ_PAR, L_PAR, R_PAR, SPACE, TABULATOR, NEWLINE';

const T = create_escape_tokens(token_characters + '\\', token_names + ', BACKSLASH', token => `\\${token}`, name => `ESCAPE_${name}`);
Object.assign(T, create_character_tokens(token_characters, token_names));
Object.assign(T, create_symbol_tokens('OPTIONAL, CAPTURE, EXPRESSION'));

//console.log(T);


// NOTE - this is somewhat cumbersome and it also doesn't give a clean directory back - but will have to do for now
const sys = new System();
const ctx = new Program_Context(sys);
create_records_from_raster_table(ctx, `
	name			members
	----			-------
	Text			value
	Expression		〃
	Optional		〃
	Capture			〃
`);
const AST = ctx.flatten();
const TOKEN = {
	PIPE: Symbol('PIPE'),
	CAPTURE: Symbol('CAPTURE'),
	EXPRESSION: Symbol('EXPRESSION'),
	OPTIONAL: Symbol('OPTIONAL'),
	WHITESPACE: Symbol('WHITESPACE'),
	TEXT: Symbol('TEXT'),
}




const system = P.tokenization_system(null,
	P.assign_tokens(T),
	P.set_token_processor_factory((processor) => new Match_Based_Token_Processor(processor)),
	P.sub_tokenizer('main',

		//TODO - function to help with these
		P.on_token('ESCAPE_BACKSLASH', P.emit_token(TOKEN.TEXT, () => new AST.Text('\\'))),
		P.on_token('ESCAPE_LD_ARROW', P.emit_token(TOKEN.TEXT, () => new AST.Text('«'))),
		P.on_token('ESCAPE_RD_ARROW', P.emit_token(TOKEN.TEXT, () => new AST.Text('»'))),



		P.on_token('LD_ARROW', P.enter('capture').then( P.emit_token(TOKEN.CAPTURE, (expr) => new AST.Capture(expr)) )),

		P.on_token('R_PAR', P.exit() ),
		P.on_token('RSQ_PAR', P.exit() ),

		P.on_token('L_PAR', P.enter().then( P.emit_token(TOKEN.EXPRESSION, (expr) => new AST.Expression(expr)) )),
		P.on_token('LSQ_PAR', P.enter().then( P.emit_token(TOKEN.OPTIONAL, (expr) => new AST.Optional(expr)) )),

		P.on_token('PIPE', P.emit_token(TOKEN.PIPE)),
		P.on_token('SPACE', P.emit_token(TOKEN.WHITESPACE)),
		P.on_token('TABULATOR', P.emit_token(TOKEN.WHITESPACE)),
		P.on_token('NEWLINE', P.emit_token(TOKEN.WHITESPACE)),

		P.default_action( P.emit_token(TOKEN.TEXT, (text) => new AST.Text(text)) ),
	),
	P.sub_tokenizer('capture',
		P.on_token('RD_ARROW', P.exit() ),
		P.on_token('LD_ARROW', P.enter().then( P.emit_token(TOKEN.CAPTURE, (expr) => new AST.Capture(expr)) )),

		P.default_action( P.emit_token(TOKEN.TEXT, (text) => new AST.Text(text)) ),
	)

);

const test = '\\\\-\\«hello\\» «capture thing: [extra «capture sub_thing: [hello]»]» ([big|fat] freaking)  world';
const tokenizer = implement_tokenizer(system);
for (const item of tokenizer.tokenize(test)) {
	dump(item);
};

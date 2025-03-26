import { readFile } from 'node:fs/promises';
import { inspect } from 'util';

async function run_program(report_file='/dev/stdin') {

	const buffer = await readFile(report_file);
	const report = JSON.parse(buffer);

	const stdout_buf = Buffer.from(report.stdout, 'base64');
	const stderr_buf = Buffer.from(report.stderr, 'base64');

	delete report.stdout;
	delete report.stderr;


	const stdout = stdout_buf.toString('utf8');
	const stderr = stderr_buf.toString('utf8');

	/*
	const sanitized_stdout = stdout.replace(/[^\x20-\x7E\n\t]/g, (char) => '·');
	const sanitized_stderr = stderr.replace(/[^\x20-\x7E\n\t]/g, (char) => '·');
	*/

	for (const [key, value] of Object.entries(report)) {
		console.log(key, inspect(value, { depth: null, colors: true }));
	}

	console.log('stdout:')
	for (const line of stdout.split('\n')) {
		const presentable_line = inspect(line, { depth: null, colors: true });
		console.log(`  | ${presentable_line}`);
	}

	console.log('stderr:')
	for (const line of stderr.split('\n')) {
		const presentable_line = inspect(line, { depth: null, colors: true });
		console.log(`  | ${presentable_line}`);
	}





}


run_program(...process.argv.slice(2));

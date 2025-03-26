import { mkdtemp, open, readFile, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';

async function wait_for_process(child) {
	return new Promise((resolve, reject) => {
		child.on('error', reject);
		child.on('exit', resolve);
	});
}

async function run_program(program, program_arguments=[], report_file='/dev/stdout', timeout=null) {
	let timeout_handler;
	const extra_info = {
		timeout_triggered: false,
	};

	const local_temp_directory = await mkdtemp(join(tmpdir(), 'etesft-'));

	const stdout_log_file = join(local_temp_directory, 'stdout.log');
	const stderr_log_file = join(local_temp_directory, 'stderr.log');

	const stdout_log = await open(stdout_log_file, 'w');
	const stderr_log = await open(stderr_log_file, 'w');

	const child = spawn(program, program_arguments, {
		stdio: ['ignore', stdout_log, stderr_log],
	});


	if (timeout) {
		timeout_handler = setTimeout(() => {
			extra_info.timeout_triggered = true;
			child.kill();
		}, timeout);
	}

	await wait_for_process(child);

	if (timeout_handler) {
		clearTimeout(timeout_handler);
	}

	await stdout_log.close();
	await stderr_log.close();

	const stdout = (await readFile(stdout_log_file)).toString('base64');
	const stderr = (await readFile(stderr_log_file)).toString('base64');

	const report = {
		program, program_arguments, stdout, stderr, timeout,
		exit_code: child.exitCode,
		signal_code: child.signalCode,
		...extra_info,
	}

	writeFile(report_file, JSON.stringify(report));


	await rm(local_temp_directory, { recursive: true, force: true });
}



/*

	If argument --output or -O exists we will pop the next for output
	If argument -- exists we will assume the rest is no arguments

*/

const remaining = [...process.argv.slice(2)];
let output_file;
let finished = false;

while (!finished && remaining.length) {

	const top = remaining.at(0);
	switch (top) {
		case "--output":
		case "-O":
			remaining.shift();
			output_file = remaining.shift();
			break;
		case "--":
			remaining.shift();
			finished = true;
			break;
		default:
			finished = true;
			break;
	}

}

run_program(remaining[0], remaining.slice(1), output_file, 250);	//1 second timeout by default

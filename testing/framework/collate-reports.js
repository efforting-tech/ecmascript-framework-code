import { readFile } from 'node:fs/promises';
import { inspect } from 'util';

//TODO - this should be a common feature shared among different utilities in the testing framework.
async function load_report(report_file) {
	const buffer = await readFile(report_file);
	const report = JSON.parse(buffer);
	report.stdout = Buffer.from(report.stdout, 'base64');
	report.stderr = Buffer.from(report.stderr, 'base64');
	return report;
}

async function run_program(file_list_file ='/dev/stdin') {

	//TODO - we should allow a json file that decides expected outcomes for tests because some might be supposed to fail

	let failed_count = 0;
	const file_list_buffer = await readFile(file_list_file);
	const file_list = file_list_buffer.toString('utf8');

	for (const filename of file_list.split('\n')) {
		if (filename.length) {
			const report = await load_report(filename);
			const icon = report.exit_code ? '❌' : '✅';
			if (!report.exit_code) {
				failed_count++;
			}
			console.log(icon, inspect(report.program_arguments, { colors: true }), '-', inspect(report.exit_code, { colors: true }));
		}
	}

	if (failed_count) {
		return 1;
	} else {
		return 0;
	}

}


process.exit(await run_program(...process.argv.slice(2)));

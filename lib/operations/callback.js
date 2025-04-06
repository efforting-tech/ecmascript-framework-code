export function run_callback(...callback_list) {
	for (const callback of callback_list) {
		if (callback) {
			callback();
		}
	}
}

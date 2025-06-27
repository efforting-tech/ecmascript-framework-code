export function assign_interfaces(target, ...interfaces) {
	for (const source of interfaces) {
		Object.defineProperties(target.prototype, Object.getOwnPropertyDescriptors(source));
		for (const sym of Object.getOwnPropertySymbols(source)) {
			Object.defineProperty(target.prototype, sym, Object.getOwnPropertyDescriptor(source, sym));
		}
	}
}

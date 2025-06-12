export const NAMESPACE_NAME = Symbol('NAMESPACE_NAME');

export class Namespace {
	constructor(name, members={}) {
		this[NAMESPACE_NAME] = name;
		Object.assign( this, members );
	}
}

export class Cache_Map extends Map {
	constructor(source=undefined, factory=undefined) {
		super();
		this.factory = factory;
		if (source) {
			if (source instanceof Map || Array.isArray(source)) {
				for (const [key, value] of source) {
					this.set(key, value);
				}
			} else {
				for (const [key, value] of Object.entries(source)) {
					this.set(key, value);
				}
			}
		}
	}

	require(key, factory=undefined) {
		if (this.has(key)) {
			return this.get(key);
		} else {
			const value = (factory ?? this.factory)(key);
			this.set(key, value);
			return value;
		}
	}
}

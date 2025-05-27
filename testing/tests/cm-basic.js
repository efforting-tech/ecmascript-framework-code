class Cache_Map extends Map {
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


const m = new Map();
m.set('hello', 'world');

const cm1 = new Cache_Map(m);

const cm2 = new Cache_Map({
	hello: 'world',
});

const cm3 = new Cache_Map(m, (key) => Symbol(key));

console.log(cm3.require('stuff'));							//Symbol(stuff)
console.log(cm3.require('stuff', (key) => parseInt(key)));	//Symbol(stuff)
console.log(cm3.require(10, (key) => parseInt(key)));		//10

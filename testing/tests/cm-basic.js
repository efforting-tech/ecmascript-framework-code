import { Cache_Map } from '../../lib/data/cache.js';

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

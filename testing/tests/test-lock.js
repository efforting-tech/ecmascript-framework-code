import { scheduler } from 'node:timers/promises';

while(true) {
	await scheduler.wait(1000);
}
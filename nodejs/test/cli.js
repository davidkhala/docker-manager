import {daemonJsonFile, setHosts} from '../dockerCmd.js';
import fs from 'fs';

describe('docker cli', function () {
	this.timeout(0);
	if (!process.env.CI) {
		it('set Hosts', () => {
			setHosts();
			const content = fs.readFileSync(daemonJsonFile).toString();
			console.info(content);
		});
	}

});
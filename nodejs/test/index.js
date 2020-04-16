const DockerManager = require('../docker');
const docker = new DockerManager({
	host: 'ec2-54-169-64-23.ap-southeast-1.compute.amazonaws.com',
	username: 'ubuntu',
	password: process.env.password
});

const task = async () => {
	switch (parseInt(process.env.taskID)) {
		case 0:
			break;
		default: {
			const info = await docker.info();
			console.log(info);
		}


	}
};

task();
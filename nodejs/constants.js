/**
 *
 * @enum {string}
 */
const ContainerStatus = {
	created: 'created',
	restarting: 'restarting',
	running: 'running',
	removing: 'removing',
	paused: 'paused',
	exited: 'exited',
	dead: 'dead'
};
exports.ContainerStatus = ContainerStatus;
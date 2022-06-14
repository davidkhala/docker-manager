/**
 *
 * @enum {string}
 */
export const ContainerStatus = {
	created: 'created',
	restarting: 'restarting',
	running: 'running',
	removing: 'removing',
	paused: 'paused',
	exited: 'exited',
	dead: 'dead',
	initialized: 'initialized',
};
/**
 *
 * @enum {string}
 */
export const Reason = {
	ContainerNotFound: 'no such container',
	NetworkNotFound: 'no such network',
	ImageNotFound: 'no such image',
	VolumeNotFound: 'no such volume'
};

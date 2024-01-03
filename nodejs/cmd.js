export function ping(domain, count = 3) {
	return ['ping', `${domain}`, '-c', `${count}`];
}

export const hang = ['sleep', 'infinity'];
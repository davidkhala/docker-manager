import {execSync} from '@davidkhala/light/devOps.js';

export const serviceStart = () => execSync('systemctl --user enable --now podman.socket');

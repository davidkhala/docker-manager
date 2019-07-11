const containerOptsBuilder = require('../containerOptsBuilder');
const Image = 'a';
const Cmd = 'b';
const builder = new containerOptsBuilder(Image, Cmd);
builder.setEnvObject({deployment: 'uat'});
console.log(builder.opts.Env);

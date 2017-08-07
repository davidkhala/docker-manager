const dockerAPIVersion = 'v1.30'
const dockerodeUtil=require('./dockerode-util')


dockerodeUtil.deleteContainer('hello-world').then((container)=>dockerodeUtil.createHelloworld())
		.catch((err)=>console.log(err))

//dev-peer0.pm.delphi.com-delphichaincode-v1
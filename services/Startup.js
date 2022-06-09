const EC2 = require("../lib/EC2");
const DynamoDb = require("../lib/DynamoDb");
const Route53 = require("../lib/Route53");
const SES = require("../lib/SES");

module.exports.service = async (event) => {
	const payload = event.detail;
	const instanceId = payload["instance-id"];
	let workstationId;

	const instance = await EC2.getInstance(instanceId);

	if (instance.project !== "cloudverse") {
		return;
	}

	const user = await DynamoDb.getUser(instance.UserId);

	for (let i = 0; i < user.workstations.length; i++) {
		if (user.workstations[i].instanceId === instance.InstanceId) {
			user.workstations[i].status = "running";
			user.workstations[i].dns = instance.DNS;
			workstationId = user.workstations[i].workstationId;
			break;
		}
	}

	await SES.sendEmail(
		"parthshahk@gmail.com",
		`Workstation ${workstationId} is running`,
		`Hello,\n\nYour workstation ${workstationId} is running. Use this DNS to access your computer
		\n\n${instance.DNS}\n\nThanks,\nCloudverse`
	);

	await Route53.createWorkstationDNS(workstationId, instance.DNS);
	await DynamoDb.updateUser(instance.UserId, user);
	return;
};

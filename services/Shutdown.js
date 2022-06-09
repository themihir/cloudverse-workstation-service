const EC2 = require("../lib/EC2");
const EBS = require("../lib/EBS");
const DynamoDb = require("../lib/DynamoDb");
const Route53 = require("../lib/Route53");

module.exports.service = async (event) => {
	const payload = event.detail;
	const instanceId = payload["instance-id"];
	const instance = await EC2.getInstance(instanceId);
	let workstationId, dns;

	if (instance.project !== "cloudverse") {
		return;
	}

	const snapshot = await EBS.createSnapshot(instance);

	const user = await DynamoDb.getUser(instance.UserId);
	for (let i = 0; i < user.workstations.length; i++) {
		if (user.workstations[i].workstationId === instance.WorkstationId) {
			workstationId = user.workstations[i].workstationId;
			dns = user.workstations[i].dns;
			user.workstations[i].status = "snapping";
			user.workstations[i].snapshotId = snapshot.SnapshotId;
			user.workstations[i].lastShutdown = new Date().toISOString();
			delete user.workstations[i].dns;
			break;
		}
	}
	await Route53.deleteWorkstationDNS(workstationId, dns);
	await DynamoDb.updateUser(instance.UserId, user);
	return;
};

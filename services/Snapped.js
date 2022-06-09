const EBS = require("../lib/EBS");
const EC2 = require("../lib/EC2");
const DynamoDb = require("../lib/DynamoDb");

const BASE_IMAGE_ID_WINDOWS_DEFAULT = process.env.BASE_IMAGE_ID_WINDOWS_DEFAULT;

module.exports.service = async (event) => {
	const payload = event.detail;
	const snapShotARNParts = payload["snapshot_id"].split("/");
	const snapshotId = snapShotARNParts[snapShotARNParts.length - 1];

	const snapshot = await EBS.getSnapshot(snapshotId);

	if (snapshot.project !== "cloudverse") {
		return;
	}

	const user = await DynamoDb.getUser(snapshot.UserId);
	const instance = user.workstations.find(
		(workstation) => workstation.workstationId === snapshot.WorkstationId
	);

	await EC2.deleteInstance(instance.instanceId);

	const sourceImage = await EC2.getAMI(instance.sourceImage);
	if (sourceImage.ImageId !== BASE_IMAGE_ID_WINDOWS_DEFAULT) {
		const sourceSnapshotId =
			sourceImage.BlockDeviceMappings[0].Ebs.SnapshotId;
		await EC2.deregisterImage(sourceImage.ImageId);
		await EC2.deleteSnapshot(sourceSnapshotId);
	}

	const newImage = await EC2.registerAMI(snapshot);

	for (let i = 0; i < user.workstations.length; i++) {
		if (user.workstations[i].workstationId === snapshot.WorkstationId) {
			user.workstations[i].status = "snapped";
			user.workstations[i].imageId = newImage.ImageId;
			delete user.workstations[i].instanceId;
			delete user.workstations[i].sourceImage;
			delete user.workstations[i].snapshotId;
			break;
		}
	}
	await DynamoDb.updateUser(snapshot.UserId, user);
	return;
};

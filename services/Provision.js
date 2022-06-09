const EC2 = require("../lib/EC2");
const DynamoDb = require("../lib/DynamoDb");
const short = require("short-uuid");

const BASE_IMAGE_ID_WINDOWS_DEFAULT = process.env.BASE_IMAGE_ID_WINDOWS_DEFAULT;

module.exports.service = async (event) => {
	try {
		const payload = JSON.parse(event.Records[0].body);
		const action = payload.action;
		const userId = payload.userId;
		let workstationId = payload.workstationId;
		const instanceType = payload.instanceType;
		const volumeSize = parseInt(payload.volumeSize);
		const user = await DynamoDb.getUser(userId);

		if (action === "new") {
			workstationId = short.generate();
			const instance = await EC2.createInstance(
				BASE_IMAGE_ID_WINDOWS_DEFAULT,
				instanceType,
				volumeSize,
				userId,
				workstationId
			);

			if (!user.workstations) {
				user.workstations = [];
			}

			user.workstations.push({
				workstationId: workstationId,
				instanceId: instance.InstanceId,
				instanceType: instanceType,
				volumeSize: volumeSize,
				sourceImage: BASE_IMAGE_ID_WINDOWS_DEFAULT,
				status: "provisioned",
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			});

			await DynamoDb.updateUser(userId, user);
		} else if (action === "existing" && workstationId) {
			const workstation = user.workstations.find(
				(workstation) => workstation.workstationId === workstationId
			);
			if (!workstation) {
				return;
			}
			const instance = await EC2.createInstance(
				workstation.imageId,
				instanceType,
				volumeSize,
				userId,
				workstationId
			);
			for (let i = 0; i < user.workstations.length; i++) {
				if (user.workstations[i].workstationId === workstationId) {
					user.workstations[i].instanceId = instance.InstanceId;
					user.workstations[i].instanceType = instanceType;
					user.workstations[i].volumeSize = volumeSize;
					user.workstations[i].sourceImage = workstation.imageId;
					user.workstations[i].status = "provisioned";
					user.workstations[i].updatedAt = new Date().toISOString();
					delete user.workstations[i].imageId;
					break;
				}
			}
			await DynamoDb.updateUser(userId, user);
		}

		return;
	} catch (err) {
		console.log(err);
	}
};

const AWS = require("aws-sdk");

const getVolume = async (volumeId) => {
	const ec2 = new AWS.EC2({ apiVersion: "2016-11-15" });

	const params = {
		VolumeIds: [volumeId],
	};

	const data = await ec2.describeVolumes(params).promise();
	return data.Volumes[0];
};

const createSnapshot = async (instance) => {
	const ec2 = new AWS.EC2({ apiVersion: "2016-11-15" });

	const params = {
		VolumeId: instance.VolumeId,
		TagSpecifications: [
			{
				ResourceType: "snapshot",
				Tags: [
					{
						Key: "Name",
						Value: `cloudverse-${instance.UserId}-${instance.WorkstationId}`,
					},
					{
						Key: "Project",
						Value: `cloudverse`,
					},
					{
						Key: "UserId",
						Value: `${instance.UserId}`,
					},
					{
						Key: "WorkstationId",
						Value: `${instance.WorkstationId}`,
					},
				],
			},
		],
	};

	const snapshot = await ec2.createSnapshot(params).promise();
	return snapshot;
};

const getSnapshot = async (snapshotId) => {
	const ec2 = new AWS.EC2({ apiVersion: "2016-11-15" });
	const response = {};

	const params = {
		SnapshotIds: [snapshotId],
	};

	const data = await ec2.describeSnapshots(params).promise();
	const snapshot = data.Snapshots[0];

	response.SnapshotId = snapshot.SnapshotId;

	for (let i = 0; i < snapshot.Tags.length; i++) {
		if (snapshot.Tags[i].Key === "UserId") {
			response.UserId = snapshot.Tags[i].Value;
		}
		if (snapshot.Tags[i].Key === "WorkstationId") {
			response.WorkstationId = snapshot.Tags[i].Value;
		}
		if (snapshot.Tags[i].Key === "Project") {
			response.project = snapshot.Tags[i].Value;
		}
	}

	return response;
};

module.exports = {
	getVolume,
	createSnapshot,
	getSnapshot,
};

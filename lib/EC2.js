const AWS = require("aws-sdk");
const EBS = require("./EBS");

const DEFAULT_SECURITY_GROUP = process.env.DEFAULT_SECURITY_GROUP;
const DEFAULT_INSTANCE_TYPE = process.env.DEFAULT_INSTANCE_TYPE;
const DEFAULT_VOLUME_SIZE = process.env.DEFAULT_VOLUME_SIZE;
const WINDOWS_USER_DATA_BASE64 = process.env.WINDOWS_USER_DATA_BASE64;

const getAllAMIs = async () => {
	try {
		const ec2 = new AWS.EC2({ apiVersion: "2016-11-15" });
		const describeImagesParams = {
			Filters: [
				{
					Name: "tag:Project",
					Values: ["cloudverse"],
				},
			],
		};

		const AMICall = await ec2
			.describeImages(describeImagesParams)
			.promise();
		const AMIList = AMICall.Images;
		return AMIList;
	} catch (e) {
		console.log(e);
	}
};

const getImageByName = async (AMIList, name) => {
	let selectedImage;
	for (let i = 0; i < AMIList.length; i++) {
		for (let j = 0; j < AMIList[i].Tags.length; j++) {
			if (
				AMIList[i].Tags[j].Key === "Name" &&
				AMIList[i].Tags[j].Value === name
			) {
				selectedImage = AMIList[i];
				break;
			}
		}
		if (selectedImage) break;
	}
	return selectedImage;
};

const createInstance = async (
	ImageId,
	instanceType = DEFAULT_INSTANCE_TYPE,
	volumeSize = DEFAULT_VOLUME_SIZE,
	userId,
	workstationId
) => {
	const ec2 = new AWS.EC2({ apiVersion: "2016-11-15" });

	const params = {
		ImageId,
		InstanceType: instanceType,
		MinCount: 1,
		MaxCount: 1,
		SecurityGroupIds: [DEFAULT_SECURITY_GROUP],
		BlockDeviceMappings: [
			{
				DeviceName: "/dev/sda1",
				Ebs: {
					VolumeSize: volumeSize,
				},
			},
		],
		TagSpecifications: [
			{
				ResourceType: "instance",
				Tags: [
					{
						Key: "Name",
						Value: `cloudverse-${userId}-${workstationId}`,
					},
					{
						Key: "Project",
						Value: `cloudverse`,
					},
					{
						Key: "UserId",
						Value: `${userId}`,
					},
					{
						Key: "WorkstationId",
						Value: `${workstationId}`,
					},
				],
			},
			{
				ResourceType: "volume",
				Tags: [
					{
						Key: "Name",
						Value: `cloudverse-${userId}-${workstationId}`,
					},
					{
						Key: "Project",
						Value: `cloudverse`,
					},
					{
						Key: "UserId",
						Value: `${userId}`,
					},
					{
						Key: "WorkstationId",
						Value: `${workstationId}`,
					},
				],
			},
		],
		UserData: WINDOWS_USER_DATA_BASE64,
	};

	const instances = await ec2.runInstances(params).promise();
	return instances.Instances[0];
};

const getInstance = async (instanceId) => {
	const response = {};
	const ec2 = new AWS.EC2({ apiVersion: "2016-11-15" });
	const params = {
		InstanceIds: [instanceId],
	};

	const instances = await ec2.describeInstances(params).promise();
	const instance = instances.Reservations[0].Instances[0];

	response.InstanceType = instance.InstanceType;
	response.DNS = instance.PublicDnsName;
	response.InstanceId = instance.InstanceId;

	for (let i = 0; i < instance.Tags.length; i++) {
		if (instance.Tags[i].Key === "UserId") {
			response.UserId = instance.Tags[i].Value;
		}
		if (instance.Tags[i].Key === "WorkstationId") {
			response.WorkstationId = instance.Tags[i].Value;
		}
		if (instance.Tags[i].Key === "Project") {
			response.project = instance.Tags[i].Value;
		}
	}

	const volume = await EBS.getVolume(
		instance.BlockDeviceMappings[0].Ebs.VolumeId
	);
	response.VolumeSize = volume.Size;
	response.VolumeId = volume.VolumeId;

	return response;
};

const registerAMI = async (snapshot) => {
	const ec2 = new AWS.EC2({ apiVersion: "2016-11-15" });

	const params = {
		Name: `cloudverse-${snapshot.UserId}-${snapshot.WorkstationId}`,
		Architecture: "x86_64",
		RootDeviceName: "/dev/sda1",
		BlockDeviceMappings: [
			{
				DeviceName: "/dev/sda1",
				Ebs: {
					SnapshotId: snapshot.SnapshotId,
					VolumeType: "gp2",
				},
			},
		],
		VirtualizationType: "hvm",
		SriovNetSupport: "simple",
	};

	const image = await ec2.registerImage(params).promise();

	const tagParams = {
		Resources: [image.ImageId],
		Tags: [
			{
				Key: "Name",
				Value: `cloudverse-${snapshot.UserId}-${snapshot.WorkstationId}`,
			},
			{
				Key: "Project",
				Value: `cloudverse`,
			},
			{
				Key: "UserId",
				Value: `${snapshot.UserId}`,
			},
			{
				Key: "WorkstationId",
				Value: `${snapshot.WorkstationId}`,
			},
		],
	};

	await ec2.createTags(tagParams).promise();

	return image;
};

const deleteInstance = async (instanceId) => {
	const ec2 = new AWS.EC2({ apiVersion: "2016-11-15" });
	const params = {
		InstanceIds: [instanceId],
	};
	await ec2.terminateInstances(params).promise();
};

const getAMI = async (imageId) => {
	const ec2 = new AWS.EC2({ apiVersion: "2016-11-15" });

	const params = {
		ImageIds: [imageId],
	};

	const images = await ec2.describeImages(params).promise();
	const image = images.Images[0];

	return image;
};

const deregisterImage = async (imageId) => {
	const ec2 = new AWS.EC2({ apiVersion: "2016-11-15" });

	const params = {
		ImageId: imageId,
	};

	await ec2.deregisterImage(params).promise();
};

const deleteSnapshot = async (snapshotId) => {
	const ec2 = new AWS.EC2({ apiVersion: "2016-11-15" });

	const params = {
		SnapshotId: snapshotId,
	};

	await ec2.deleteSnapshot(params).promise();
};

module.exports = {
	getAllAMIs,
	getImageByName,
	createInstance,
	getInstance,
	registerAMI,
	deleteInstance,
	getAMI,
	deregisterImage,
	deleteSnapshot,
};

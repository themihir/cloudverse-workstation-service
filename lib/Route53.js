const AWS = require("aws-sdk");
const HOSTED_ZONE_ID = process.env.HOSTED_ZONE_ID;
const BASE_URL = process.env.BASE_URL;

const createWorkstationDNS = async (workstationId, defaultDns) => {
	const route53 = new AWS.Route53();

	const params = {
		ChangeBatch: {
			Changes: [
				{
					Action: "UPSERT",
					ResourceRecordSet: {
						Name: `${workstationId}.workstation.${BASE_URL}`,
						Type: "CNAME",
						TTL: 60,
						ResourceRecords: [
							{
								Value: defaultDns,
							},
						],
					},
				},
			],
		},
		HostedZoneId: HOSTED_ZONE_ID,
	};

	await route53.changeResourceRecordSets(params).promise();
};

const deleteWorkstationDNS = async (workstationId, defaultDns) => {
	const route53 = new AWS.Route53();

	const params = {
		ChangeBatch: {
			Changes: [
				{
					Action: "DELETE",
					ResourceRecordSet: {
						Name: `${workstationId}.workstation.${BASE_URL}`,
						Type: "CNAME",
						TTL: 60,
						ResourceRecords: [
							{
								Value: defaultDns,
							},
						],
					},
				},
			],
		},
		HostedZoneId: HOSTED_ZONE_ID,
	};

	await route53.changeResourceRecordSets(params).promise();
};

module.exports = {
	createWorkstationDNS,
	deleteWorkstationDNS,
};

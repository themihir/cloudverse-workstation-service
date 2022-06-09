const AWS = require("aws-sdk");

const getUser = async (userId) => {
	const docClient = new AWS.DynamoDB.DocumentClient();
	const params = {
		TableName: "cloudverse_prod_users",
		Key: {
			userId,
		},
	};
	const data = await docClient.get(params).promise();
	return data.Item;
};

const updateUser = async (userId, user) => {
	const docClient = new AWS.DynamoDB.DocumentClient();
	const params = {
		TableName: "cloudverse_prod_users",
		Key: {
			userId,
		},
		UpdateExpression: "set workstations = :workstations",
		ExpressionAttributeValues: {
			":workstations": user.workstations,
		},
		ReturnValues: "UPDATED_NEW",
	};
	const data = await docClient.update(params).promise();
	return data;
};

module.exports = {
	getUser,
	updateUser,
};

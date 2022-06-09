const AWS = require("aws-sdk");

const sendEmail = async (to, title, text) => {
	try {
		const sesv2 = new AWS.SESV2();

		const params = {
			Content: {
				Simple: {
					Body: {
						Text: {
							Data: text,
						},
					},
					Subject: {
						Data: title,
					},
				},
			},
			Destination: {
				ToAddresses: [to],
			},
			FromEmailAddress: "mail@cloudverse.app",
		};

		const data = await sesv2.sendEmail(params).promise();
	} catch (e) {
		console.log(e.message);
	}
};

module.exports = {
	sendEmail,
};

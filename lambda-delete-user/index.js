const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME || 'Users_Table';

exports.handler = async (event) => {
    const userId = event.queryStringParameters && event.queryStringParameters.userId;

    if (!userId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ success: false, message: 'userId가 필요합니다.' })
        };
    }

    try {
        await dynamoDb.delete({
            TableName: USERS_TABLE_NAME,
            Key: { userId }
        }).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: '삭제 성공' })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: '삭제 실패', error: error.message })
        };
    }
};
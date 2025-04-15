// src/awsConfig.ts
import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    region: process.env.REACT_APP_REGION!,
    userPoolId: process.env.REACT_APP_USER_POOL_ID!,
    userPoolWebClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID!,
    authenticationFlowType: 'USER_PASSWORD_AUTH',
  },
});

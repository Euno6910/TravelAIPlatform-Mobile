// src/awsConfig.ts
import { Amplify } from 'aws-amplify';
import {
  REACT_APP_REGION,
  REACT_APP_USER_POOL_ID,
  REACT_APP_USER_POOL_CLIENT_ID
} from '@env';

Amplify.configure({
  Auth: {
    region: REACT_APP_REGION,
    userPoolId: REACT_APP_USER_POOL_ID,
    userPoolWebClientId: REACT_APP_USER_POOL_CLIENT_ID,
    authenticationFlowType: 'USER_PASSWORD_AUTH',
  },
});

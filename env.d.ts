// env.d.ts
// 타입 정의 파일 - 환경 변수 타입 지정 
declare module '@env' {
    export const REACT_APP_REGION: string;
    export const REACT_APP_USER_POOL_ID: string;
    export const REACT_APP_USER_POOL_CLIENT_ID: string;
    // 필요한 항목 더 추가 가능
  }
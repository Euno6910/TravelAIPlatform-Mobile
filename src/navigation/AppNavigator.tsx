import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

//스택 네비게이션을 사용하여 화면 전환 관리리
// 화면 컴포넌트 가져오기
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import PlanCreationScreen from '../screens/PlanCreationScreen';
import PlanResultScreen from '../screens/PlanResultScreen';
import MyPageScreen from '../screens/MyPageScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import TravelCartScreen from '../screens/TravelCartScreen';
import TravelScheduleScreen from '../screens/TravelScheduleScreen';
import MapScreen from '../screens/MapScreen';
import ManualPlanScreen from '../screens/ManualPlanScreen';
import FlightSearchScreen from '../screens/FlightSearchScreen';
import EditScheduleScreen from '../screens/EditScheduleScreen';

// UserAttributes 타입 정의
export type UserAttributes = {
  name: string;
  email: string;
  birthdate: string;
  phone_number: string;
};

// 네비게이션 스택 타입 정의
export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  PlanCreation: undefined;
  MyPage: undefined;
  TravelCart: undefined;
  TravelSchedule: { plans: any[]; flightInfo?: any };
  PlanResult: {
    destination: string;
    startDate: string;
    endDate: string;
    interests: string[];
    budget: string;
  };
  EditProfile: { userInfo: UserAttributes };
  Map: undefined;
  ManualPlan: undefined;
  FlightSearch: undefined;
  EditSchedule: { plan: any };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="MyPage" component={MyPageScreen} />
        <Stack.Screen name="PlanCreation" component={PlanCreationScreen} />
        <Stack.Screen name="PlanResult" component={PlanResultScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="TravelCart" component={TravelCartScreen} />
        <Stack.Screen name="TravelSchedule" component={TravelScheduleScreen} />
        <Stack.Screen name="Map" component={MapScreen} />
        <Stack.Screen name="ManualPlan" component={ManualPlanScreen} />
        <Stack.Screen name="FlightSearch" component={FlightSearchScreen} />
        <Stack.Screen name="EditSchedule" component={EditScheduleScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

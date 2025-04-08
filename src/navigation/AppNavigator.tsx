import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// 화면 컴포넌트 가져오기
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import PlanCreationScreen from '../screens/PlanCreationScreen';
import PlanResultScreen from '../screens/PlanResultScreen';

// 네비게이션 스택 타입 정의
export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  PlanCreation: undefined;
  PlanResult: {
    destination: string;
    startDate: string;
    endDate: string;
    interests: string[];
    budget: string;
  };
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#fff' }
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="PlanCreation" component={PlanCreationScreen} />
        <Stack.Screen name="PlanResult" component={PlanResultScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 
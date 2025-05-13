/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
// 앱의 진입점 파일 - 앱 실행 시 처음 실행되는 파일

import './src/awsConfig'; // 상대경로 잘 맞춰서 import
import React from 'react';
import { StatusBar, SafeAreaView } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import { FlightProvider } from './src/contexts/FlightContext';

function App(): React.JSX.Element {
  return (
    <FlightProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <AppNavigator />
      </GestureHandlerRootView>
    </FlightProvider>
  );
}

export default App;

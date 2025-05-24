/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
// 앱의 진입점 파일 - 앱 실행 시 처음 실행되는 파일

import './src/awsConfig'; // 상대경로 잘 맞춰서 import
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { FlightProvider } from './src/contexts/FlightContext';
import { HotelProvider } from './src/contexts/HotelContext';
import SplashScreen from './src/screens/SplashScreen';

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000); // 3초 후 SplashScreen 종료
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <SafeAreaProvider>
      <FlightProvider>
        <HotelProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
            <AppNavigator />
          </GestureHandlerRootView>
        </HotelProvider>
      </FlightProvider>
    </SafeAreaProvider>
  );
};

export default App;

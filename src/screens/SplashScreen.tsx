import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';

//스플래시 화면
const SplashScreen = () => {
  const [showTitle, setShowTitle] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTitle(true);
    }, 1000); // 1초 후 글자 표시
    return () => clearTimeout(timer);
  }, []);

  return (
    <ImageBackground
      source={require('../assets/Travel.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        {showTitle && <Text style={styles.title}>WINDROAD</Text>}
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#1E88E5',
    fontSize: 44,
    fontWeight: 'bold',
    textShadowColor: '#fff',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
  },
});

export default SplashScreen; 
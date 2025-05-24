import React from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';

const SplashScreen = () => {
  return (
    <ImageBackground
      source={require('../assets/Travel.gif')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <Text style={styles.title}>WINDROAD</Text>
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
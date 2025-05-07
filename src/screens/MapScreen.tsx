import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Dimensions, Text } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const MapScreen = () => {
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    // 지연 로딩: 컴포넌트가 마운트된 후 맵 로드
    const timer = setTimeout(() => {
      setIsMapLoaded(true);
    }, 1000); // 1초 후 맵 로드

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>한성대학교 위치</Text>
      {isMapLoaded ? (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE} // Google Maps 사용
            initialRegion={{
              latitude: 37.5825, // 한성대학교 위도
              longitude: 127.0090, // 한성대학교 경도
              latitudeDelta: 0.005, // 더 확대
              longitudeDelta: 0.005, // 더 확대
            }}
            cacheEnabled={true} // 캐싱 활성화
          >
            <Marker
              coordinate={{
                latitude: 37.5825, // 한성대학교 위도
                longitude: 127.0090, // 한성대학교 경도
              }}
              title="한성대학교"
              description="서울특별시 성북구 삼선교로 16길 116"
            />
          </MapView>
        </View>
      ) : (
        <Text>맵 로딩 중...</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  mapContainer: {
    height: 300,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2, // 검은색 테두리 추가
    borderColor: '#000', // 검은색
  },
  map: {
    width: '100%',
    height: '100%',
  },
});

export default MapScreen; 
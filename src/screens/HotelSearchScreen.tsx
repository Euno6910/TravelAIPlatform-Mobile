import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { useHotel } from '../contexts/HotelContext';

interface Hotel {
  hotel_id: string;
  hotel_name: string;
  address: string;
  price: string;
  original_price?: string;
  review_score: number;
  main_photo_url: string;
}

const fetchLatLng = async (city: string) => {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`;
  const res = await axios.get(url, {
    headers: {
      'User-Agent': 'TravelAIPlatform/1.0 (your@email.com)',
    },
  });
  if (res.data && res.data.length > 0) {
    return {
      lat: parseFloat(res.data[0].lat),
      lon: parseFloat(res.data[0].lon),
    };
  }
  return null;
};

const HotelSearchScreen = () => {
  const [loading, setLoading] = useState(false);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [city, setCity] = useState('도쿄');
  const [checkin, setCheckin] = useState('2025-05-22');
  const [checkout, setCheckout] = useState('2025-05-23');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);

  const navigation = useNavigation();
  const { setSelectedHotel } = useHotel();

  const handleSearch = async () => {
    setLoading(true);
    try {
      // 1. 도시명 → 위도/경도 변환
      const geo = await fetchLatLng(city);
      if (!geo) {
        Alert.alert('도시명을 정확히 입력해주세요.');
        setLoading(false);
        return;
      }
      // 2. 호텔 검색 API 호출
      const response = await axios.post(
        'https://lngdadu778.execute-api.ap-northeast-2.amazonaws.com/Stage/api/Booking-com/SearchHotelsByCoordinates',
        {
          type: 'preferred_hotels',
          city: {
            latitude: geo.lat,
            longitude: geo.lon,
            currency: 'KRW',
          },
          checkin_date: checkin,
          checkout_date: checkout,
          adults_number: adults,
          children_number: children,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      setHotels(response.data.result);
    } catch (error) {
      console.error('호텔 검색 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 호텔 선택 시 Context에 저장 + Alert + 홈으로 이동
  const handleSelectHotel = (hotel: Hotel) => {
    setSelectedHotel({
      ...hotel,
      city,
      checkin,
      checkout,
      adults,
      children,
    });
    Alert.alert(
      '알림',
      '숙박일정이 반영되었습니다.',
      [
        {
          text: '확인',
          onPress: () => navigation.goBack(),
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <View style={styles.container}>
      {/* 검색 조건 입력 폼 */}
      <View style={styles.formSection}>
        <Text style={styles.label}>도시 / 지역</Text>
        <TextInput
          style={styles.input}
          value={city}
          onChangeText={setCity}
          placeholder="도시명 입력 (예: 도쿄)"
        />
        <Text style={styles.label}>체크인</Text>
        <TextInput
          style={styles.input}
          value={checkin}
          onChangeText={setCheckin}
          placeholder="YYYY-MM-DD"
        />
        <Text style={styles.label}>체크아웃</Text>
        <TextInput
          style={styles.input}
          value={checkout}
          onChangeText={setCheckout}
          placeholder="YYYY-MM-DD"
        />
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>성인</Text>
            <View style={styles.counterRow}>
              <TouchableOpacity onPress={() => setAdults(Math.max(1, adults - 1))} style={styles.counterBtn}><Text style={styles.counterBtnText}>-</Text></TouchableOpacity>
              <Text style={styles.counterValue}>{adults}</Text>
              <TouchableOpacity onPress={() => setAdults(adults + 1)} style={styles.counterBtn}><Text style={styles.counterBtnText}>+</Text></TouchableOpacity>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>어린이</Text>
            <View style={styles.counterRow}>
              <TouchableOpacity onPress={() => setChildren(Math.max(0, children - 1))} style={styles.counterBtn}><Text style={styles.counterBtnText}>-</Text></TouchableOpacity>
              <Text style={styles.counterValue}>{children}</Text>
              <TouchableOpacity onPress={() => setChildren(children + 1)} style={styles.counterBtn}><Text style={styles.counterBtnText}>+</Text></TouchableOpacity>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.buttonText}>숙소 검색</Text>
        </TouchableOpacity>
      </View>

      {/* 검색 결과 */}
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <ScrollView style={styles.hotelList}>
          {hotels.map((hotel) => (
            <TouchableOpacity key={hotel.hotel_id} style={styles.hotelCard} onPress={() => handleSelectHotel(hotel)}>
              <Text style={styles.hotelName}>{hotel.hotel_name}</Text>
              <Text style={styles.hotelAddress}>{hotel.address}</Text>
              <Text style={styles.hotelPrice}>{hotel.price}</Text>
              {hotel.original_price && (
                <Text style={styles.originalPrice}>{hotel.original_price}</Text>
              )}
              <Text style={styles.reviewScore}>
                평점: {hotel.review_score}/10
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  formSection: {
    marginBottom: 20,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 16,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    padding: 10,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  counterBtn: {
    backgroundColor: '#e0e0e0',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnText: {
    fontSize: 20,
    color: '#333',
  },
  counterValue: {
    fontSize: 16,
    marginHorizontal: 8,
    minWidth: 20,
    textAlign: 'center',
  },
  searchButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hotelList: {
    flex: 1,
  },
  hotelCard: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  hotelName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  hotelAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  hotelPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginBottom: 4,
  },
  reviewScore: {
    fontSize: 14,
    color: '#666',
  },
});

export default HotelSearchScreen; 
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
  Modal,
  Image,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import axios from 'axios';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useHotel } from '../contexts/HotelContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

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

//호텔 검색 화면
const HotelSearchScreen = () => {
  const [loading, setLoading] = useState(false);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [city, setCity] = useState('도쿄');
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [showCheckinCalendar, setShowCheckinCalendar] = useState(false);
  const [showCheckoutCalendar, setShowCheckoutCalendar] = useState(false);

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { currentHotel, checkIn, checkOut } = route.params as any;
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

  const handleHotelSelect = (hotel: any) => {
    // 선택한 호텔 정보를 Context에 저장하고 이전 화면으로 돌아가기
    setSelectedHotel({
      ...hotel,
      checkin: checkIn,
      checkout: checkOut
    });
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>호텔 검색</Text>
      {/* 검색 조건 입력 폼 */}
      <View style={styles.formSection}>
        <View style={styles.searchRow}>
          <View style={styles.searchColumn}>
            <Text style={styles.label}>도시 / 지역</Text>
            <TextInput
              style={[styles.input, { color: '#000' }]}
              value={city}
              onChangeText={setCity}
              placeholder="도시명 입력 (예: 도쿄)"
            />
          </View>
          <View style={styles.searchColumn}>
            <Text style={styles.label}>체크인</Text>
            <TouchableOpacity 
              style={styles.input} 
              onPress={() => setShowCheckinCalendar(true)}
            >
              <Text style={{ color: '#000' }}>{checkin}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.searchColumn}>
            <Text style={styles.label}>체크아웃</Text>
            <TouchableOpacity 
              style={styles.input} 
              onPress={() => setShowCheckoutCalendar(true)}
            >
              <Text style={{ color: '#000' }}>{checkout}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.guestRow}>
          <View style={styles.guestColumn}>
            <Text style={styles.label}>성인</Text>
            <View style={styles.counterRow}>
              <TouchableOpacity onPress={() => setAdults(Math.max(1, adults - 1))} style={styles.counterBtn}>
                <Text style={[styles.counterBtnText, { color: '#000' }]}>-</Text>
              </TouchableOpacity>
              <Text style={[styles.counterValue, { color: '#000' }]}>{adults}</Text>
              <TouchableOpacity onPress={() => setAdults(adults + 1)} style={styles.counterBtn}>
                <Text style={[styles.counterBtnText, { color: '#000' }]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.guestColumn}>
            <Text style={styles.label}>어린이</Text>
            <View style={styles.counterRow}>
              <TouchableOpacity onPress={() => setChildren(Math.max(0, children - 1))} style={styles.counterBtn}>
                <Text style={[styles.counterBtnText, { color: '#000' }]}>-</Text>
              </TouchableOpacity>
              <Text style={[styles.counterValue, { color: '#000' }]}>{children}</Text>
              <TouchableOpacity onPress={() => setChildren(children + 1)} style={styles.counterBtn}>
                <Text style={[styles.counterBtnText, { color: '#000' }]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.buttonText}>숙소 검색</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showCheckinCalendar}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.calendarContainer}>
            <Calendar
              onDayPress={(day) => {
                setCheckin(day.dateString);
                setShowCheckinCalendar(false);
              }}
              minDate={new Date().toISOString().split('T')[0]}
              markedDates={{
                [checkin]: { selected: true, selectedColor: '#007AFF' }
              }}
            />
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowCheckinCalendar(false)}
            >
              <Text style={styles.closeButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCheckoutCalendar}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.calendarContainer}>
            <Calendar
              onDayPress={(day) => {
                setCheckout(day.dateString);
                setShowCheckoutCalendar(false);
              }}
              minDate={checkin}
              markedDates={{
                [checkout]: { selected: true, selectedColor: '#007AFF' }
              }}
            />
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowCheckoutCalendar(false)}
            >
              <Text style={styles.closeButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 검색 결과 */}
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <ScrollView style={styles.hotelList}>
          {hotels.map((hotel) => (
            <TouchableOpacity key={hotel.hotel_id} style={styles.hotelCard} onPress={() => handleHotelSelect(hotel)}>
              <Image 
                source={{ uri: hotel.main_photo_url }} 
                style={styles.hotelImage}
                resizeMode="cover"
              />
              <Text style={[styles.hotelName, { color: '#000' }]}>{hotel.hotel_name}</Text>
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  formSection: {
    marginBottom: 20,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  searchColumn: {
    flex: 1,
  },
  guestRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  guestColumn: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: '#333',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    padding: 8,
    backgroundColor: '#fff',
    height: 40,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  counterBtn: {
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnText: {
    fontSize: 16,
  },
  counterValue: {
    fontSize: 14,
    marginHorizontal: 4,
    minWidth: 16,
    textAlign: 'center',
  },
  searchButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  calendarContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '90%',
  },
  closeButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#007AFF',
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
  },
  hotelImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
});

export default HotelSearchScreen; 
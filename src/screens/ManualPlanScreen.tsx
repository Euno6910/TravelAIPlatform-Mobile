import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useFlight } from '../contexts/FlightContext';
import { useHotel } from '../contexts/HotelContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Auth } from 'aws-amplify';

const API_URL = 'https://lngdadu778.execute-api.ap-northeast-2.amazonaws.com/Stage/api/travel/save';

//여행 계획 생성 화면 - 여행 계획 생성 단계별 입력, 계획 생성 결과 화면으로 이동  
const PlanCreationScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { selectedFlight, setSelectedFlight } = useFlight();
  const { selectedHotel, setSelectedHotel } = useHotel();
  const [flight, setFlight] = useState<any>(null);
  const [hotel, setHotel] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [days, setDays] = useState<any[]>([{ date: '', title: '', schedules: [] }]);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    // 사용자 ID 가져오기
    const getUserId = async () => {
      try {
        const user = await Auth.currentAuthenticatedUser();
        setUserId(user.attributes.sub);
      } catch (error) {
        console.error('사용자 ID 가져오기 실패:', error);
      }
    };
    getUserId();
  }, []);

  // selectedFlight가 변경될 때마다 flight 상태 업데이트
  useEffect(() => {
    if (selectedFlight) {
      setFlight(selectedFlight);
    }
    if (selectedHotel) {
      setHotel(selectedHotel);
    }
  }, [selectedFlight, selectedHotel]);

  // 날짜(day) 관련 함수
  const updateDay = (dayIdx: number, newDay: any) => {
    setDays((days: any[]) => days.map((d: any, i: number) => i === dayIdx ? newDay : d));
  };
  const addDay = () => {
    setDays((days: any[]) => [...days, { date: '', title: '', schedules: [] }]);
  };
  const removeDay = (dayIdx: number) => {
    setDays(days => days.filter((_, i) => i !== dayIdx));
  };

  // 일정(schedule) 관련 함수
  const addSchedule = (dayIdx: number) => {
    setDays(days => days.map((d, i) =>
      i === dayIdx ? { ...d, schedules: [...(d.schedules || []), { time: '', name: '', notes: '' }] } : d
    ));
  };
  const updateSchedule = (dayIdx: number, schIdx: number, newSch: any) => {
    setDays(days => days.map((d, i) =>
      i === dayIdx
        ? { ...d, schedules: d.schedules.map((s: any, j: number) => j === schIdx ? newSch : s) }
        : d
    ));
  };
  const removeSchedule = (dayIdx: number, schIdx: number) => {
    setDays(days => days.map((d, i) =>
      i === dayIdx
        ? { ...d, schedules: d.schedules.filter((_: any, j: number) => j !== schIdx) }
        : d
    ));
  };

  // 저장 핸들러
  const handleSave = async () => {
    try {
      if (!title.trim()) {
        Alert.alert('오류', '제목을 입력해주세요.');
        return;
      }

      const session = await Auth.currentSession();
      const token = session.getIdToken().getJwtToken();

      // 일정 데이터를 Lambda 함수가 기대하는 형식으로 변환
      let flightData = selectedFlight || flight;
      const daysWithFlights = days.map((day, idx) => {
        let schedules = day.schedules || [];
        // 첫째 날에만 항공권 정보 추가
        if (idx === 0 && flightData) {
          const flightArray = Array.isArray(flightData) ? flightData : [flightData];
          const flightsWithType = flightArray.map(f => ({
            ...f,
            type: f.type || 'Flight_Departure',
          }));
          schedules = [...flightsWithType, ...schedules];
        }
        return { ...day, schedules };
      });

      const formattedData = daysWithFlights.reduce((acc, day, index) => {
        acc[index + 1] = {
          title: day.title,
          date: day.date,
          schedules: day.schedules || []
        };
        return acc;
      }, {});

      console.log('변환된 formattedData:', formattedData);

      // Lambda 함수가 기대하는 형식으로 데이터 구성
      const flightArray = flightData ? (Array.isArray(flightData) ? flightData : [flightData]) : [];
      const requestData = {
        name: title,
        plans: formattedData,
        accmo_info: hotel ? {
          hotel: hotel,
          checkIn: hotel.checkin,
          checkOut: hotel.checkout
        } : undefined,
        paid_plan: 0,
        flightInfo: flightArray
      };

      console.log('저장할 데이터:', JSON.stringify(requestData, null, 2));

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      const responseText = await response.text();
      console.log('Raw 응답:', responseText);

      let result;
      try {
        result = JSON.parse(responseText);
        console.log('파싱된 응답:', result);
      } catch (e) {
        console.error('응답 파싱 실패:', e);
        throw new Error('서버 응답을 처리할 수 없습니다.');
      }

      if (result.success) {
        Alert.alert('저장 완료', '여행 일정이 저장되었습니다.', [
          { text: '확인', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('저장 실패', result.message || '저장에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('저장 중 오류:', error);
      Alert.alert('오류', error.message || '저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 20, backgroundColor: '#F8F9FF' }} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* 항공편 정보 카드 */}
      <View style={styles.infoCard}>
        {flight && flight.itineraries ? (
          <>
            <Text style={styles.infoTitle}>✈️ 항공편 정보</Text>
            <Text style={styles.infoText}>
              {flight.itineraries[0]?.segments[0]?.departure?.iataCode}
              {" → "}
              {flight.itineraries[0]?.segments[0]?.arrival?.iataCode}
              {"  "}
              {flight.itineraries[0]?.segments[0]?.departure?.at?.slice(0, 10)}
              {" "}
              {flight.itineraries[0]?.segments[0]?.departure?.at?.slice(11, 16)}
            </Text>
            {flight.itineraries[1] && (
              <Text style={styles.infoText}>
                {flight.itineraries[1]?.segments[0]?.departure?.iataCode}
                {" → "}
                {flight.itineraries[1]?.segments[0]?.arrival?.iataCode}
                {"  "}
                {flight.itineraries[1]?.segments[0]?.departure?.at?.slice(0, 10)}
                {" "}
                {flight.itineraries[1]?.segments[0]?.departure?.at?.slice(11, 16)}
              </Text>
            )}
            {flight.price?.grandTotal && (
              <Text style={styles.priceText}>
                총 요금: {Number(flight.price.grandTotal).toLocaleString()}원
              </Text>
            )}
          </>
        ) : (
          <Text style={styles.emptyText}>등록된 항공편 정보가 없습니다</Text>
        )}
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => {
            setSelectedFlight(null);
            navigation.navigate('FlightSearch');
          }}
        >
          <Text style={styles.editButtonText}>
            {flight && flight.itineraries ? '항공편 수정' : '항공편 등록'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 호텔 정보 카드 */}
      <View style={styles.infoCard}>
        {hotel ? (
          <>
            <Text style={styles.infoTitle}>🏨 호텔 정보</Text>
            <Text style={styles.infoText}>{hotel.hotel_name}</Text>
            <Text style={styles.infoSubText}>{hotel.address}</Text>
            <Text style={styles.infoSubText}>
              {hotel.checkin} ~ {hotel.checkout}
            </Text>
            <Text style={styles.priceText}>{hotel.price}</Text>
          </>
        ) : (
          <Text style={styles.emptyText}>등록된 호텔 정보가 없습니다</Text>
        )}
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => {
            setSelectedHotel(null);
            navigation.navigate('HotelSearch', {
              checkIn: days[0]?.date || '',
              checkOut: days[days.length - 1]?.date || ''
            });
          }}
        >
          <Text style={styles.editButtonText}>
            {hotel ? '호텔 수정' : '호텔 등록'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 기존 여행 계획 입력 부분 */}
      <Text style={styles.sectionTitle}>새 여행 일정 만들기</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        style={styles.titleInput}
        placeholder="여행 제목을 입력하세요"
        placeholderTextColor="#A5B4CB"
      />
      {days.map((day, dayIdx) => (
        <View key={dayIdx} style={{ marginBottom: 20, padding: 12, backgroundColor: '#F0F4FF', borderRadius: 10 }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 4, color: '#4A6572' }}>{dayIdx + 1}일차</Text>
          <TextInput
            value={day.date}
            onChangeText={text => updateDay(dayIdx, { ...day, date: text })}
            placeholder="날짜 (예: 2025-05-13)"
            style={{ borderWidth: 1, borderColor: '#E0E7FF', borderRadius: 8, padding: 8, marginBottom: 8, color: '#4A6572', backgroundColor: 'white' }}
            placeholderTextColor={'#A5B4CB'}
          />
          <TextInput
            value={day.title}
            onChangeText={text => updateDay(dayIdx, { ...day, title: text })}
            placeholder="일차 제목"
            style={{ borderWidth: 1, borderColor: '#E0E7FF', borderRadius: 8, padding: 8, marginBottom: 8, color: '#4A6572', backgroundColor: 'white' }}
            placeholderTextColor={'#A5B4CB'}
          />
          {day.schedules && day.schedules.map((sch: any, schIdx: number) => (
            <View key={schIdx} style={{ marginTop: 8, backgroundColor: 'white', borderRadius: 8, padding: 8 }}>
              <Text style={{ fontWeight: 'bold', color: '#4A6572' }}>일정 {schIdx + 1}</Text>
              <TextInput
                value={sch.time}
                onChangeText={text => updateSchedule(dayIdx, schIdx, { ...sch, time: text })}
                placeholder="시간"
                style={{ borderWidth: 1, borderColor: '#E0E7FF', borderRadius: 8, padding: 8, marginBottom: 4, color: '#4A6572', backgroundColor: 'white' }}
                placeholderTextColor={'#A5B4CB'}
              />
              <TextInput
                value={sch.name}
                onChangeText={text => updateSchedule(dayIdx, schIdx, { ...sch, name: text })}
                placeholder="장소/활동명"
                style={{ borderWidth: 1, borderColor: '#E0E7FF', borderRadius: 8, padding: 8, marginBottom: 4, color: '#4A6572', backgroundColor: 'white' }}
                placeholderTextColor={'#A5B4CB'}
              />
              <TextInput
                value={sch.notes}
                onChangeText={text => updateSchedule(dayIdx, schIdx, { ...sch, notes: text })}
                placeholder="메모"
                style={{ borderWidth: 1, borderColor: '#E0E7FF', borderRadius: 8, padding: 8, marginBottom: 4, color: '#4A6572', backgroundColor: 'white' }}
                placeholderTextColor={'#A5B4CB'}
              />
              <TouchableOpacity onPress={() => removeSchedule(dayIdx, schIdx)} style={{ alignSelf: 'flex-end', marginTop: 4 }}>
                <Text style={{ color: '#FF6B6B' }}>일정 삭제</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity onPress={() => addSchedule(dayIdx)} style={{ marginTop: 8, alignSelf: 'flex-start' }}>
            <Text style={{ color: '#6B8AFE', fontWeight: 'bold' }}>+ 일정 추가</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => removeDay(dayIdx)} style={{ marginTop: 8, alignSelf: 'flex-end' }}>
            <Text style={{ color: '#FF6B6B' }}>이 날짜 삭제</Text>
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity onPress={addDay} style={styles.addButton}>
        <Text style={styles.addButtonText}>+ 날짜 추가</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        onPress={handleSave} 
        style={styles.saveButton}
      >
        <Text style={styles.saveButtonText}>저장</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  infoCard: {
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  infoTitle: {
    color: '#1E88E5',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
  infoText: {
    color: '#333',
    fontSize: 14,
    marginBottom: 4,
  },
  infoSubText: {
    color: '#666',
    fontSize: 13,
    marginBottom: 2,
  },
  priceText: {
    color: '#1E88E5',
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: 4,
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  editButton: {
    backgroundColor: '#1E88E5',
    padding: 8,
    borderRadius: 6,
    marginTop: 10,
    alignItems: 'center',
  },
  editButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#4A6572',
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#E0E7FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    color: '#4A6572',
    backgroundColor: 'white',
    fontSize: 16,
  },
  addButton: {
    marginBottom: 20,
  },
  addButtonText: {
    color: '#1E88E5',
    fontWeight: 'bold',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#1E88E5',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PlanCreationScreen; 
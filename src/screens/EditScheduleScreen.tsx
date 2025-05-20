import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, ScrollView, Alert, TouchableOpacity, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useFlight } from '../contexts/FlightContext';
import { useHotel } from '../contexts/HotelContext';
import { Auth } from 'aws-amplify';

//여행계획 수정 화면
const API_URL = 'https://lngdadu778.execute-api.ap-northeast-2.amazonaws.com/Stage/api/travel/save';

const EditScheduleScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const plan = (route.params as any)?.plan;
  const { selectedFlight, setSelectedFlight } = useFlight();
  const { selectedHotel, setSelectedHotel } = useHotel();
  const [flight, setFlight] = useState(plan?.flight_info);
  const [accmo, setAccmo] = useState(plan?.accmo_info);

  // travelInfo 구조 파싱 (TravelScheduleScreen.tsx와 동일하게)
  let travelInfo: any = {};
  try {
    const text = plan?.plan_data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const match = text.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonStr = match ? match[1] : text;
    travelInfo = JSON.parse(jsonStr);
  } catch (e: any) {
    travelInfo = {};
  }

  // 상태: 제목, days
  const [title, setTitle] = useState(travelInfo.title || '');
  const [days, setDays] = useState<any[]>(travelInfo.days || []);

  // selectedFlight가 변경될 때마다 flight 상태 업데이트
  useEffect(() => {
    if (selectedFlight) {
      setFlight(selectedFlight);
    }
  }, [selectedFlight]);

  // selectedHotel이 변경될 때마다 accmo 상태 업데이트
  useEffect(() => {
    if (selectedHotel) {
      setAccmo({
        hotel: selectedHotel,
        checkIn: selectedHotel.checkin,
        checkOut: selectedHotel.checkout
      });
    }
  }, [selectedHotel]);

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
      // AWS Amplify에서 현재 세션 가져오기
      const session = await Auth.currentSession();
      const token = session.getIdToken().getJwtToken();

      const planId = plan.planId || plan.id;
      console.log('현재 plan:', plan);
      console.log('현재 selectedFlight:', selectedFlight);
      console.log('현재 flight:', flight);
      console.log('현재 accmo:', accmo);
      console.log('현재 days:', days);
      
      // 일정 데이터를 Lambda 함수가 기대하는 형식으로 변환
      // 항공권 정보를 schedules에 포함시키기 위해 days를 변환
      let flightData = selectedFlight || flight;
      const daysWithFlights = days.map((day, idx) => {
        let schedules = day.schedules || [];
        // 첫째 날에만 항공권 정보 추가(예시, 필요에 따라 위치 조정)
        if (idx === 0 && flightData) {
          const flightArray = Array.isArray(flightData) ? flightData : [flightData];
          // 항공권 객체에 type이 없으면 type: 'Flight_Departure'로 추가
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

      // Lambda 함수가 기대하는 형식으로 데이터 구성 (flightInfo 필드 추가)
      const flightArray = flightData ? (Array.isArray(flightData) ? flightData : [flightData]) : [];
      const requestData = {
        plan_id: planId,
        name: title,
        plans: formattedData,
        accmo_info: accmo,
        paid_plan: plan?.paid_plan || 0,
        flightInfo: flightArray // 별도 필드로 추가
      };

      console.log('저장할 데이터:', JSON.stringify(requestData, null, 2));

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`  // 토큰 추가
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
    } catch (e: any) {
      console.error('저장 중 오류:', e);
      Alert.alert('오류', e.message || '저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 20, backgroundColor: '#F8F9FF' }} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* 항공편 정보 카드 */}
      <View style={{
        backgroundColor: '#f0f8ff',
        borderRadius: 8,
        padding: 10,
        marginBottom: 18,
      }}>
        {(() => {
          const flightArray = Array.isArray(flight) ? flight : flight ? [flight] : [];
          return flightArray.length > 0 ? (
            flightArray.map((f, idx) => (
              <View key={idx}>
                {/* 출국편 */}
                {f.itineraries && (
                  <>
                    <Text style={{ color: '#1E88E5', fontWeight: 'bold', fontSize: 15 }}>
                      ✈️ {f.itineraries[0]?.segments[0]?.departure?.iataCode}
                      {" → "}
                      {f.itineraries[0]?.segments[0]?.arrival?.iataCode}
                      {"  "}
                      {f.itineraries[0]?.segments[0]?.departure?.at?.slice(0, 10)}
                      {" "}
                      {f.itineraries[0]?.segments[0]?.departure?.at?.slice(11, 16)}
                    </Text>
                    {/* 귀국편(왕복일 때) */}
                    {f.itineraries[1] && (
                      <Text style={{ color: '#1E88E5', fontWeight: 'bold', fontSize: 15, marginTop: 2 }}>
                        ✈️ {f.itineraries[1]?.segments[0]?.departure?.iataCode}
                        {" → "}
                        {f.itineraries[1]?.segments[0]?.arrival?.iataCode}
                        {"  "}
                        {f.itineraries[1]?.segments[0]?.departure?.at?.slice(0, 10)}
                        {" "}
                        {f.itineraries[1]?.segments[0]?.departure?.at?.slice(11, 16)}
                      </Text>
                    )}
                    {/* 총 요금 */}
                    {f.price?.grandTotal && (
                      <Text style={{ color: '#333', fontSize: 13, marginTop: 2 }}>
                        총 요금: {Number(f.price.grandTotal).toLocaleString()}원
                      </Text>
                    )}
                  </>
                )}
              </View>
            ))
          ) : (
            <Text style={{ color: '#666', fontSize: 14, textAlign: 'center', marginBottom: 8 }}>
              등록된 항공편 정보가 없습니다
            </Text>
          );
        })()}
        {/* 항공편 수정 버튼 */}
        <TouchableOpacity 
          style={{
            backgroundColor: '#1E88E5',
            padding: 8,
            borderRadius: 6,
            marginTop: 10,
            alignItems: 'center'
          }}
          onPress={() => {
            setSelectedFlight(null);
            navigation.navigate('FlightSearch');
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>
            {flight && (Array.isArray(flight) ? flight.length > 0 && flight[0].itineraries : flight.itineraries) ? '항공편 수정' : '항공편 등록'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 호텔 정보 카드 */}
      <View style={{
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 10,
        marginBottom: 18,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      }}>
        {accmo?.hotel ? (
          <>
            {accmo.hotel.main_photo_url && (
              <Image
                source={{ uri: accmo.hotel.main_photo_url }}
                style={{
                  width: '100%',
                  height: 150,
                  borderRadius: 8,
                  marginBottom: 10
                }}
                resizeMode="cover"
              />
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Text style={{ color: '#333', fontWeight: 'bold', fontSize: 16, flex: 1, marginRight: 10 }}>
                {accmo.hotel.hotel_name}
              </Text>
              {accmo.hotel.review_score && (
                <View style={{
                  backgroundColor: '#4CAF50',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 4,
                }}>
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>
                    {accmo.hotel.review_score}
                  </Text>
                  <Text style={{ color: '#fff', fontSize: 10 }}>
                    {accmo.hotel.review_score_word}
                  </Text>
                </View>
              )}
            </View>
            <Text style={{ color: '#666', fontSize: 14, marginTop: 4 }}>
              {accmo.hotel.address}
            </Text>
            <Text style={{ color: '#666', fontSize: 14, marginTop: 2 }}>
              {accmo.hotel.city}
            </Text>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: 8,
              backgroundColor: '#f5f5f5',
              padding: 8,
              borderRadius: 6,
            }}>
              <View>
                <Text style={{ color: '#666', fontSize: 12 }}>체크인</Text>
                <Text style={{ color: '#333', fontSize: 14, fontWeight: 'bold' }}>
                  {accmo.hotel.checkin}
                </Text>
                <Text style={{ color: '#666', fontSize: 12 }}>
                  {accmo.hotel.checkin_from}
                </Text>
              </View>
              <View>
                <Text style={{ color: '#666', fontSize: 12 }}>체크아웃</Text>
                <Text style={{ color: '#333', fontSize: 14, fontWeight: 'bold' }}>
                  {accmo.hotel.checkout}
                </Text>
                <Text style={{ color: '#666', fontSize: 12 }}>
                  {accmo.hotel.checkout_until}
                </Text>
              </View>
            </View>
            {accmo.hotel.price && (
              <Text style={{ color: '#1E88E5', fontSize: 16, fontWeight: 'bold', marginTop: 8 }}>
                {accmo.hotel.price}
              </Text>
            )}
          </>
        ) : (
          <Text style={{ color: '#666', fontSize: 14, textAlign: 'center', marginBottom: 8 }}>
            등록된 호텔 정보가 없습니다
          </Text>
        )}
        {/* 호텔 수정 버튼 */}
        <TouchableOpacity 
          style={{
            backgroundColor: '#1E88E5',
            padding: 8,
            borderRadius: 6,
            marginTop: 10,
            alignItems: 'center'
          }}
          onPress={() => {
            // 현재 선택된 호텔 정보를 초기화하고 HotelSearchScreen으로 이동
            setSelectedHotel(null);
            navigation.navigate('HotelSearch', {
              checkIn: accmo?.checkIn,
              checkOut: accmo?.checkOut
            });
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>
            {accmo?.hotel ? '호텔 수정' : '호텔 등록'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#4A6572' }}>여행 일정 수정</Text>
      <Text style={{ color: '#4A6572' }}>제목</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        style={{ borderWidth: 1, borderColor: '#E0E7FF', borderRadius: 8, padding: 8, marginBottom: 20, color: '#4A6572', backgroundColor: 'white' }}
        placeholderTextColor={'#A5B4CB'}
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
      <TouchableOpacity onPress={addDay} style={{ marginBottom: 20 }}>
        <Text style={{ color: '#6B8AFE', fontWeight: 'bold', fontSize: 16 }}>+ 날짜 추가</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        onPress={handleSave} 
        style={{
          backgroundColor: '#6B8AFE',
          padding: 15,
          borderRadius: 8,
          alignItems: 'center',
          marginBottom: 20
        }}
      >
        <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>저장</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default EditScheduleScreen; 
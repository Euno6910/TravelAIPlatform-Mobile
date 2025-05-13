import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useFlight } from '../contexts/FlightContext';

const API_URL = 'https://lngdadu778.execute-api.ap-northeast-2.amazonaws.com/Stage/api/travel/save';

const EditScheduleScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const plan = (route.params as any)?.plan;
  const { selectedFlight, setSelectedFlight } = useFlight();
  const [flight, setFlight] = useState(plan?.flight_info);

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
      const planId = plan.planId || plan.id;
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_id: planId,
          title: title,
          data: days,
          flight_info: flight // 항공편 정보도 함께 저장
        })
      });
      const result = await response.json();
      if (result.success) {
        Alert.alert('저장 완료', '여행 일정이 저장되었습니다.', [
          { text: '확인', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('저장 실패', result.message || '저장에 실패했습니다.');
      }
    } catch (e: any) {
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
        {flight && flight.itineraries ? (
          <>
            {/* 출국편 */}
            <Text style={{ color: '#1E88E5', fontWeight: 'bold', fontSize: 15 }}>
              ✈️ {flight.itineraries[0]?.segments[0]?.departure?.iataCode}
              {" → "}
              {flight.itineraries[0]?.segments[0]?.arrival?.iataCode}
              {"  "}
              {flight.itineraries[0]?.segments[0]?.departure?.at?.slice(0, 10)}
              {" "}
              {flight.itineraries[0]?.segments[0]?.departure?.at?.slice(11, 16)}
            </Text>
            {/* 귀국편(왕복일 때) */}
            {flight.itineraries[1] && (
              <Text style={{ color: '#1E88E5', fontWeight: 'bold', fontSize: 15, marginTop: 2 }}>
                ✈️ {flight.itineraries[1]?.segments[0]?.departure?.iataCode}
                {" → "}
                {flight.itineraries[1]?.segments[0]?.arrival?.iataCode}
                {"  "}
                {flight.itineraries[1]?.segments[0]?.departure?.at?.slice(0, 10)}
                {" "}
                {flight.itineraries[1]?.segments[0]?.departure?.at?.slice(11, 16)}
              </Text>
            )}
            {/* 총 요금 */}
            {flight.price?.grandTotal && (
              <Text style={{ color: '#333', fontSize: 13, marginTop: 2 }}>
                총 요금: {Number(flight.price.grandTotal).toLocaleString()}원
              </Text>
            )}
          </>
        ) : (
          <Text style={{ color: '#666', fontSize: 14, textAlign: 'center', marginBottom: 8 }}>
            등록된 항공편 정보가 없습니다
          </Text>
        )}
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
            // 현재 선택된 항공편 정보를 초기화하고 FlightSearchScreen으로 이동
            setSelectedFlight(null);
            navigation.navigate('FlightSearch');
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>
            {flight && flight.itineraries ? '항공편 수정' : '항공편 등록'}
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
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, ScrollView, Alert, TouchableOpacity, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Auth } from 'aws-amplify';

//모든 일정관리 화면을 수정하여 저장 하는 화면
const API_URL = 'https://9b5hbw9u25.execute-api.ap-northeast-2.amazonaws.com/Stage/mobile/save_mobile';//SavePlanFunction

const PlanEditScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const plan = (route.params as any)?.plan;

  // plan 파싱 및 days/title 추출 (문자열/객체 모두 대응)
  let travelInfo: any = {};
  try {
    let rawPlan = plan;
    if (typeof rawPlan === 'string') rawPlan = JSON.parse(rawPlan);
    if (rawPlan?.itinerary_schedules && typeof rawPlan.itinerary_schedules === 'string') {
      try {
        const parsed = JSON.parse(rawPlan.itinerary_schedules);
        travelInfo.days = Object.values(parsed);
      } catch (e) {}
    }
    if (rawPlan?.plan_data) {
      if (typeof rawPlan.plan_data === 'string') {
        const match = rawPlan.plan_data.match(/```json\s*([\s\S]*?)\s*```/);
        const jsonStr = match ? match[1] : rawPlan.plan_data;
        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed.days) travelInfo.days = parsed.days;
          if (parsed.title) travelInfo.title = parsed.title;
        } catch (e) {}
      } else if (typeof rawPlan.plan_data === 'object' && rawPlan.plan_data !== null) {
        if (rawPlan.plan_data.days) travelInfo.days = rawPlan.plan_data.days;
        if (rawPlan.plan_data.title) travelInfo.title = rawPlan.plan_data.title;
      }
    }
    if (!travelInfo.days && rawPlan.days) travelInfo.days = rawPlan.days;
    if (!travelInfo.title && rawPlan.title) travelInfo.title = rawPlan.title;
    travelInfo = { ...rawPlan, ...travelInfo };
  } catch (e: any) {
    travelInfo = {};
  }

  const [title, setTitle] = useState(travelInfo.name || travelInfo.title || '');
  const [days, setDays] = useState<any[]>(travelInfo.days || []);
  const [flightInfos, setFlightInfos] = useState(plan?.flightInfos || plan?.flight_info || []);
  const [accommodationInfos, setAccommodationInfos] = useState(plan?.accommodationInfos || plan?.accmo_info || []);

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

  // 저장 핸들러 (Lambda 수정 기능 활용)
  const handleSave = async () => {
    try {
      const session = await Auth.currentSession();
      const token = session.getIdToken().getJwtToken();
      const planId = plan.plan_id || plan.planId || plan.id;
      const formattedData = days.reduce((acc, day, index) => {
        acc[index + 1] = {
          title: day.title,
          date: day.date,
          schedules: day.schedules || []
        };
        return acc;
      }, {});
      const requestData = {
        plan_id: planId,
        update_type: 'plan_data',
        title: title,
        data: formattedData,
        flightInfos: flightInfos,
        accommodationInfos: accommodationInfos
      };
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
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        throw new Error('서버 응답을 처리할 수 없습니다.');
      }
      if (result.success) {
        Alert.alert('수정 완료', '여행 계획이 성공적으로 수정되었습니다.', [
          { text: '확인', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('수정 실패', result.message || '수정에 실패했습니다.');
      }
    } catch (e: any) {
      Alert.alert('오류', e.message || '수정 중 오류가 발생했습니다.');
    }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 20, backgroundColor: '#F8F9FF' }} contentContainerStyle={{ paddingBottom: 40 }}>
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

export default PlanEditScreen; 
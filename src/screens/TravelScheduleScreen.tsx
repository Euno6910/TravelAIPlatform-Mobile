import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { RouteProp } from '@react-navigation/native';

//마이페이지 - 여행계획
type TravelScheduleScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'TravelSchedule'>;
  route: RouteProp<RootStackParamList, 'TravelSchedule'>;
};

// 구글맵 검색 함수
const openGoogleMaps = (lat?: number, lng?: number, location?: string) => {
  let url = '';
  if (lat && lng) {
    url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  } else if (location) {
    url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
  }
  if (url) Linking.openURL(url);
};

const TravelScheduleScreen: React.FC<TravelScheduleScreenProps> = ({ navigation, route }) => {
  // 실제 데이터 사용
  const plans = route.params?.plans || [];

  const getStatus = (start: string, end: string) => {
    const today = new Date();
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (endDate < today) return '여행 완료';
    if (startDate > today) return '여행 예정';
    return '여행 중';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '여행 예정':
        return '#4CAF50';
      case '여행 완료':
        return '#9E9E9E';
      case '여행 중':
        return '#1E88E5';
      default:
        return '#1E88E5';
    }
  };

  const [expandedDayIdxMap, setExpandedDayIdxMap] = useState<{ [planId: string]: number | null }>({});

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>일정 관리</Text>
        <View style={styles.placeholderView} />
      </View>

      <ScrollView style={styles.content}>
        {plans.length === 0 ? (
          <Text style={{ textAlign: 'center', color: '#999', marginTop: 40 }}>저장된 여행 일정이 없습니다.</Text>
        ) : (
          plans.map((plan: any) => {
            // plan_data가 Gemini 응답 객체로 온다고 가정
            let planData = plan.plan_data;

            // Gemini 응답에서 여행 정보 추출
            let travelInfo: any = {};
            try {
              // 1. text 추출
              const text = planData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
              // 2. 코드블록에서 JSON만 추출
              const match = text.match(/```json\s*([\s\S]*?)\s*```/);
              const jsonStr = match ? match[1] : text;
              // 3. JSON 파싱
              travelInfo = JSON.parse(jsonStr);
            } catch (e) {
              travelInfo = {};
            }

            const title = travelInfo.title || '-';
            const destination = travelInfo.destination || '-'; // destination 필드가 없을 수 있음
            // days 배열에서 시작일, 종료일 추출
            const startDate = travelInfo.days?.[0]?.date || '';
            const endDate = travelInfo.days?.[travelInfo.days?.length - 1]?.date || '';
            const status = getStatus(startDate, endDate);

            return (
              <View key={plan.planId || plan.id} style={styles.scheduleCard}>
                <View style={styles.scheduleInfo}>
                  <Text style={styles.destination}>{title}</Text>
                  {/* 목적지(destination) 필드가 없을 수 있으니 조건부 렌더링 */}
                  {destination !== '-' && <Text style={styles.date}>{destination}</Text>}
                  <Text style={styles.date}>{startDate} ~ {endDate}</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(status) + '20' }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: getStatusColor(status) }
                    ]}>{status}</Text>
                  </View>
                </View>
                {/* 날짜별 큰 블럭: days -> schedules */}
                {travelInfo.days?.map((day: any, idx: number) => (
                  <View key={idx} style={styles.dayBlock}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f0f6ff', borderRadius: 10, padding: 12, marginBottom: 4 }}>
                      <View>
                        <Text style={styles.dayTitle}>{day.date}</Text>
                        <Text style={styles.daySubTitle}>{day.title}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.expandButton}
                        onPress={() => setExpandedDayIdxMap(prev => ({
                          ...prev,
                          [plan.planId]: prev[plan.planId] === idx ? null : idx
                        }))}
                      >
                        <Text style={styles.expandButtonText}>{expandedDayIdxMap[plan.planId] === idx ? '닫기' : '확대'}</Text>
                      </TouchableOpacity>
                    </View>
                    {/* 아코디언 상세 일정: schedules */}
                    {expandedDayIdxMap[plan.planId] === idx && (
                      <View style={{ marginTop: 10 }}>
                        {day.schedules?.map((schedule: any, aIdx: number) => (
                          <TouchableOpacity
                            key={aIdx}
                            style={styles.activityBlock}
                            onPress={() => openGoogleMaps(schedule.lat, schedule.lng, schedule.address)}
                          >
                            <Text style={styles.activityText}>
                              {schedule.time} - {schedule.name}
                            </Text>
                            {schedule.notes && (
                              <Text style={styles.activityDesc}>{schedule.notes}</Text>
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => navigation.navigate('EditSchedule', { plan })}
                  >
                    <Text style={[styles.actionButtonText, styles.editButtonText]}>수정</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => {
                      // 일정 삭제 구현 예정
                      console.log('Delete schedule:', travelInfo);
                    }}
                  >
                    <Text style={[styles.actionButtonText, styles.deleteButtonText]}>삭제</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    fontSize: 24,
    color: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholderView: {
    width: 24,
  },
  content: {
    flex: 1,
    padding: 18,
  },
  scheduleCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 22,
    marginBottom: 28,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  scheduleInfo: {
    gap: 5,
  },
  destination: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
    gap: 10,
  },
  actionButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  editButton: {
    borderColor: '#1E88E5',
    backgroundColor: '#fff',
    marginRight: 10,
  },
  editButtonText: {
    color: '#1E88E5',
    fontWeight: 'bold',
  },
  deleteButton: {
    borderColor: '#FF5252',
  },
  deleteButtonText: {
    color: '#FF5252',
  },
  dayBlock: {
    marginTop: 18,
    marginBottom: 10,
    backgroundColor: '#eaf3fb',
    borderRadius: 12,
    padding: 0,
  },
  dayTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1E88E5',
  },
  daySubTitle: {
    fontSize: 14,
    color: '#333',
    marginTop: 2,
  },
  activityBlock: {
    borderWidth: 2,
    borderColor: '#1E88E5',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#f8faff',
  },
  activityText: {
    fontSize: 16,
    color: '#1E88E5',
    fontWeight: 'bold',
  },
  activityDesc: {
    fontSize: 13,
    color: '#333',
    marginTop: 4,
  },
  expandButton: {
    borderWidth: 2,
    borderColor: '#1E88E5',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 6,
    marginLeft: 10,
    backgroundColor: '#fff',
  },
  expandButtonText: {
    color: '#1E88E5',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default TravelScheduleScreen; 
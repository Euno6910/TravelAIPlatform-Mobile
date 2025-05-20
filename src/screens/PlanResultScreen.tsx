import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
//홈스크린 챗봇으로 대체(미사용)
//여행 계획 결과 화면 - 여행 계획 결과 확인, 계획 수정 링크 클릭 시 계획 생성 화면으로 이동, 저장 버튼 클릭 시 홈 화면으로 이동
interface PlanResultScreenProps {
  navigation: any;
  route: {
    params: {
      destination: string;
      startDate: string;
      endDate: string;
      interests: string[];
      budget: string;
    };
  };
}

interface ItineraryDay {
  day: number;
  date: string;
  activities: {
    time: string;
    title: string;
    description: string;
    type: 'attraction' | 'food' | 'accommodation' | 'transport';
  }[];
}

const PlanResultScreen: React.FC<PlanResultScreenProps> = ({ navigation, route }) => {
  const { destination, startDate, endDate, interests, budget } = route.params;
  const [isLoading, setIsLoading] = useState(true);
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);

  useEffect(() => {
    // 실제 구현에서는 서버 API 호출로 AI 생성 결과를 받아올 것입니다
    // 여기서는 데모 목적으로 가짜 데이터를 활용합니다
    const timer = setTimeout(() => {
      // 가짜 여행 계획 데이터 생성
      const fakePlan = generateFakeItinerary(destination, startDate, endDate);
      setItinerary(fakePlan);
      setIsLoading(false);
    }, 3000); // 3초 후 로딩 완료

    return () => clearTimeout(timer);
  }, [destination, startDate, endDate]);

  // 임시 가짜 데이터 생성 함수
  const generateFakeItinerary = (destination: string, startDate: string, endDate: string): ItineraryDay[] => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const result: ItineraryDay[] = [];
    
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      
      const dayPlan: ItineraryDay = {
        day: i + 1,
        date: currentDate.toISOString().split('T')[0],
        activities: [
          {
            time: '09:00',
            title: `${destination}의 아침`,
            description: '호텔 조식 후 출발 준비',
            type: 'food'
          },
          {
            time: '10:30',
            title: `${destination} 주요 명소 방문`,
            description: '현지 유명 관광지 관람 및 사진 촬영',
            type: 'attraction'
          },
          {
            time: '13:00',
            title: '현지 맛집에서 점심',
            description: '현지 특산물을 활용한 전통 요리 체험',
            type: 'food'
          },
          {
            time: '15:00',
            title: '문화 체험 활동',
            description: '현지 문화 체험 프로그램 참여',
            type: 'attraction'
          },
          {
            time: '18:30',
            title: '저녁 식사',
            description: '인기 레스토랑에서 저녁 식사',
            type: 'food'
          },
          {
            time: '20:00',
            title: '휴식',
            description: '호텔 복귀 및 휴식',
            type: 'accommodation'
          }
        ]
      };
      
      result.push(dayPlan);
    }
    
    return result;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'attraction': return '🏛️';
      case 'food': return '🍽️';
      case 'accommodation': return '🏨';
      case 'transport': return '🚗';
      default: return '📌';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingTitle}>AI가 최적의 여행 계획을 생성하고 있습니다</Text>
        <ActivityIndicator size="large" color="#1E88E5" style={styles.spinner} />
        <Text style={styles.loadingText}>
          {destination}의 여행 일정을 {interests.join(', ')} 관심사에 맞춰 준비하고 있습니다.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>여행 계획</Text>
        <TouchableOpacity onPress={() => {}}>
          <Text style={styles.shareButton}>공유</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tripDetails}>
        <Text style={styles.destination}>{destination}</Text>
        <Text style={styles.dates}>{startDate} ~ {endDate}</Text>
        <View style={styles.interestTags}>
          {interests.map(interest => (
            <View key={interest} style={styles.interestTag}>
              <Text style={styles.interestTagText}>{interest}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView style={styles.itineraryContainer}>
        {itinerary.map((day) => (
          <View key={day.day} style={styles.dayContainer}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayNumber}>DAY {day.day}</Text>
              <Text style={styles.dayDate}>{day.date}</Text>
            </View>
            
            <View style={styles.activitiesContainer}>
              {day.activities.map((activity, index) => (
                <View key={index} style={styles.activityItem}>
                  <View style={styles.activityTimeContainer}>
                    <Text style={styles.activityTime}>{activity.time}</Text>
                    {index < day.activities.length - 1 && <View style={styles.timeConnector} />}
                  </View>
                  
                  <View style={styles.activityContent}>
                    <View style={styles.activityIconContainer}>
                      <Text style={styles.activityIcon}>{getActivityIcon(activity.type)}</Text>
                    </View>
                    <View style={styles.activityDetails}>
                      <Text style={styles.activityTitle}>{activity.title}</Text>
                      <Text style={styles.activityDescription}>{activity.description}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => navigation.navigate('PlanCreation')}
        >
          <Text style={styles.editButtonText}>계획 수정하기</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={() => {
            // 저장 로직 구현
            navigation.navigate('Home');
          }}
        >
          <Text style={styles.saveButtonText}>저장하기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  spinner: {
    marginVertical: 30,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
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
  shareButton: {
    fontSize: 16,
    color: '#1E88E5',
  },
  tripDetails: {
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  destination: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  dates: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  interestTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  interestTag: {
    backgroundColor: '#e0e0e0',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8,
    marginTop: 5,
  },
  interestTagText: {
    fontSize: 12,
    color: '#333',
  },
  itineraryContainer: {
    flex: 1,
    padding: 15,
  },
  dayContainer: {
    marginBottom: 25,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E88E5',
    marginRight: 10,
  },
  dayDate: {
    fontSize: 16,
    color: '#666',
  },
  activitiesContainer: {
    paddingLeft: 10,
  },
  activityItem: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  activityTimeContainer: {
    width: 60,
    alignItems: 'center',
  },
  activityTime: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  timeConnector: {
    width: 2,
    height: 50,
    backgroundColor: '#e0e0e0',
    marginTop: 5,
  },
  activityContent: {
    flex: 1,
    flexDirection: 'row',
    borderLeftWidth: 0,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  activityIcon: {
    fontSize: 20,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  activityDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  editButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E88E5',
  },
  editButtonText: {
    color: '#1E88E5',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#1E88E5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default PlanResultScreen; 
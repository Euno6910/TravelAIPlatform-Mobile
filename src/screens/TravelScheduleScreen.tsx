import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

//마이페이지 - 여행계획
type TravelScheduleScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'TravelSchedule'>;
};

const TravelScheduleScreen: React.FC<TravelScheduleScreenProps> = ({ navigation }) => {
  // 임시 더미 데이터
  const schedules = [
    {
      id: '1',
      destination: '도쿄',
      date: '2024-05-15 ~ 2024-05-20',
      status: '여행 예정',
    },
    {
      id: '2',
      destination: '파리',
      date: '2024-03-10 ~ 2024-03-17',
      status: '여행 완료',
    },
    {
      id: '3',
      destination: '방콕',
      date: '2024-07-01 ~ 2024-07-05',
      status: '여행 예정',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case '여행 예정':
        return '#4CAF50';
      case '여행 완료':
        return '#9E9E9E';
      default:
        return '#1E88E5';
    }
  };

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
        {schedules.map((schedule) => (
          <TouchableOpacity
            key={schedule.id}
            style={styles.scheduleCard}
            onPress={() => {
              // 일정 상세 보기 구현 예정
              console.log('Schedule details:', schedule);
            }}
          >
            <View style={styles.scheduleInfo}>
              <Text style={styles.destination}>{schedule.destination}</Text>
              <Text style={styles.date}>{schedule.date}</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(schedule.status) + '20' }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: getStatusColor(schedule.status) }
                ]}>{schedule.status}</Text>
              </View>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.editButton]}
                onPress={() => {
                  // 일정 수정 구현 예정
                  console.log('Edit schedule:', schedule);
                }}
              >
                <Text style={styles.actionButtonText}>수정</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => {
                  // 일정 삭제 구현 예정
                  console.log('Delete schedule:', schedule);
                }}
              >
                <Text style={[styles.actionButtonText, styles.deleteButtonText]}>삭제</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    padding: 15,
  },
  scheduleCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
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
  },
  deleteButton: {
    borderColor: '#FF5252',
  },
  deleteButtonText: {
    color: '#FF5252',
  },
});

export default TravelScheduleScreen; 
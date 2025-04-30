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

//마이페이지 - 장바구니
type TravelCartScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'TravelCart'>;
};

const TravelCartScreen: React.FC<TravelCartScreenProps> = ({ navigation }) => {
  // 임시 더미 데이터
  const savedPlans = [
    {
      id: '1',
      destination: '도쿄',
      date: '2024-05-15 ~ 2024-05-20',
      status: '저장됨',
    },
    {
      id: '2',
      destination: '파리',
      date: '2024-06-10 ~ 2024-06-17',
      status: '임시저장',
    },
    {
      id: '3',
      destination: '방콕',
      date: '2024-07-01 ~ 2024-07-05',
      status: '저장됨',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>여행 계획 보관함</Text>
        <View style={styles.placeholderView} />
      </View>

      <ScrollView style={styles.content}>
        {savedPlans.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={styles.planCard}
            onPress={() => {
              // 저장된 계획 상세 보기 구현 예정
              console.log('Plan details:', plan);
            }}
          >
            <View style={styles.planInfo}>
              <Text style={styles.destination}>{plan.destination}</Text>
              <Text style={styles.date}>{plan.date}</Text>
              <View style={[
                styles.statusBadge,
                plan.status === '저장됨' ? styles.savedStatus : styles.tempStatus
              ]}>
                <Text style={styles.statusText}>{plan.status}</Text>
              </View>
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
  planCard: {
    backgroundColor: '#f8f8f8',
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
  planInfo: {
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
  savedStatus: {
    backgroundColor: '#e3f2fd',
  },
  tempStatus: {
    backgroundColor: '#fff3e0',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default TravelCartScreen; 
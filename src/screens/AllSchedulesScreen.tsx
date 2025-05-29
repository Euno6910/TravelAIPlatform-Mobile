import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Auth } from 'aws-amplify';

//사용자의 모든 여행 일정을 목록 형태로 보여주는 화면(모든 일정 관리)
type AllSchedulesScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AllSchedules'>;
};

type Plan = {
  plan_id: string;
  name: string;
  last_updated: string;
  paid_plan: boolean;
  is_shared_with_me: boolean;
  original_owner: string;
};

const AllSchedulesScreen: React.FC<AllSchedulesScreenProps> = ({ navigation }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllPlans();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchAllPlans();
    });
    return unsubscribe;
  }, []);

  const fetchAllPlans = async () => {
    try {
      setLoading(true);
      const session = await Auth.currentSession();
      const token = session.getIdToken().getJwtToken();

      const response = await fetch(
        'https://9b5hbw9u25.execute-api.ap-northeast-2.amazonaws.com/Stage/travel/checklist', //checklistfunction
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      
      if (data.success) {
        const mappedPlans = data.plans.map((plan: any) => ({
          plan_id: plan.plan_id,
          name: plan.name,
          last_updated: plan.last_updated,
          paid_plan: plan.paid_plan,
          is_shared_with_me: plan.is_shared_with_me,
          original_owner: plan.original_owner
        }));
        setPlans(mappedPlans);
      } else {
        throw new Error(data.message || '일정을 불러오는데 실패했습니다.');
      }
    } catch (error: any) {
      console.error('일정 로드 실패:', error);
      Alert.alert('오류', '일정을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>모든 일정</Text>
        <View style={styles.placeholderView} />
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E88E5" />
          </View>
        ) : plans.length === 0 ? (
          <Text style={styles.emptyText}>저장된 일정이 없습니다.</Text>
        ) : (
          plans.map((plan) => (
            <TouchableOpacity
              key={plan.plan_id}
              style={styles.planCard}
              onPress={() => navigation.navigate('DetailedSchedule', { planId: plan.plan_id })}
            >
              <View style={styles.planHeader}>
                <Text style={styles.planName}>{plan.name}</Text>
                {plan.is_shared_with_me && (
                  <View style={styles.sharedBadge}>
                    <Text style={styles.sharedText}>공유됨</Text>
                  </View>
                )}
              </View>
              <Text style={styles.planDate}>
                마지막 수정: {formatDate(plan.last_updated)}
              </Text>
              <Text style={styles.planOwner}>
                {plan.is_shared_with_me ? `공유자: ${plan.original_owner}` : '내 일정'}
              </Text>
            </TouchableOpacity>
          ))
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
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 40,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  sharedBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  sharedText: {
    color: '#1E88E5',
    fontSize: 12,
    fontWeight: '500',
  },
  planDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  planOwner: {
    fontSize: 14,
    color: '#1E88E5',
  },
});

export default AllSchedulesScreen; 
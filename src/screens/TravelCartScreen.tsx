import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { RouteProp } from '@react-navigation/native';
import { Auth } from 'aws-amplify';

//마이페이지 - 장바구니 - 여행계획 결제
type TravelCartScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'TravelCart'>;
  route: RouteProp<RootStackParamList, 'TravelCart'>;
};

const TravelCartScreen: React.FC<TravelCartScreenProps> = ({ navigation, route }) => {
  // plan 객체를 navigation param으로 받음
  const plan = (route.params as any)?.plan;

  // 항공권/호텔 정보 추출
  let flight = null;
  let hotel = null;
  let flightPrice = 0;
  let hotelPrice = 0;
  if (plan) {
    // 1. flight_info_1, flight_info_2 ... (문자열 JSON)
    const flightInfos = Object.keys(plan)
      .filter(key => key.startsWith('flight_info_'))
      .map(key => {
        try { return JSON.parse(plan[key]); } catch { return null; }
      })
      .filter(Boolean);
    // 2. 기존 flightInfos 배열도 병합
    if (Array.isArray(plan.flightInfos)) flightInfos.push(...plan.flightInfos);
    if (Array.isArray(plan.flight_info)) flightInfos.push(...plan.flight_info);
    if (flightInfos.length > 0) {
      flight = flightInfos[0];
      flightPrice = Number(flight?.price?.grandTotal || 0);
    }
    // 3. accmo_info_1, accmo_info_2 ... (문자열 JSON)
    const accommodationInfos = Object.keys(plan)
      .filter(key => key.startsWith('accmo_info_'))
      .map(key => {
        try { return JSON.parse(plan[key]); } catch { return null; }
      })
      .filter(Boolean);
    // 4. 기존 accommodationInfos 배열도 병합
    if (Array.isArray(plan.accommodationInfos)) accommodationInfos.push(...plan.accommodationInfos);
    if (Array.isArray(plan.accmo_info)) accommodationInfos.push(...plan.accmo_info);
    if (accommodationInfos.length > 0) {
      hotel = accommodationInfos[0]?.hotel || accommodationInfos[0];
      hotelPrice = Number((hotel?.price || '0').toString().replace(/[^\d]/g, ''));
    }
  }
  const totalPrice = flightPrice + hotelPrice;

  // 결제 처리 함수
  const handlePayment = async () => {
    try {
      const session = await Auth.currentSession();
      const token = session.getIdToken().getJwtToken();
      const planId = plan.plan_id || plan.planId || plan.id;
      const response = await fetch(
        'https://9b5hbw9u25.execute-api.ap-northeast-2.amazonaws.com/Stage/mobile/save_mobile',//SavePlanFunction
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            plan_id: planId,
            update_type: 'paid_plan',
            paid_plan: 1
          })
        }
      );
      const result = await response.json();
      if (result.success) {
        Alert.alert('결제 완료', '결제가 성공적으로 처리되었습니다.', [
          { text: '확인', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('결제 실패', result.message || '결제에 실패했습니다.');
      }
    } catch (e: any) {
      Alert.alert('오류', e.message || '결제 중 오류가 발생했습니다.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>여행 계획 결제</Text>
        <View style={styles.placeholderView} />
      </View>

      <ScrollView style={styles.content}>
        {/* 항공권 정보 카드 */}
        {flight && (
          <View style={{ backgroundColor: '#f0f8ff', borderRadius: 8, padding: 15, marginBottom: 18 }}>
            <Text style={{ color: '#1E88E5', fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>✈️ 항공권 정보</Text>
            <Text style={{ color: '#333', fontSize: 15, marginBottom: 2 }}>
              {flight.itineraries?.[0]?.segments?.[0]?.departure?.iataCode} → {flight.itineraries?.[0]?.segments?.[0]?.arrival?.iataCode}
            </Text>
            <Text style={{ color: '#666', fontSize: 14, marginBottom: 2 }}>
              출발: {flight.itineraries?.[0]?.segments?.[0]?.departure?.at?.slice(0, 16)}
            </Text>
            {flight.price?.grandTotal && (
              <Text style={{ color: '#1E88E5', fontWeight: 'bold', fontSize: 16, marginTop: 6 }}>
                {Number(flight.price.grandTotal).toLocaleString()}원
              </Text>
            )}
          </View>
        )}
        {/* 호텔 정보 카드 */}
        {hotel && (
          <View style={{ backgroundColor: '#fff', borderRadius: 8, padding: 15, marginBottom: 18, elevation: 2 }}>
            <Text style={{ color: '#1E88E5', fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>🏨 호텔 정보</Text>
            <Text style={{ color: '#333', fontSize: 15, marginBottom: 2 }}>{hotel.hotel_name}</Text>
            <Text style={{ color: '#666', fontSize: 14, marginBottom: 2 }}>{hotel.address}</Text>
            {hotel.price && (
              <Text style={{ color: '#1E88E5', fontWeight: 'bold', fontSize: 16, marginTop: 6 }}>
                {hotel.price}
              </Text>
            )}
          </View>
        )}
      </ScrollView>
      {/* 결제하기 버튼 */}
      <TouchableOpacity
        style={{
          backgroundColor: '#1E88E5',
          padding: 18,
          borderRadius: 8,
          alignItems: 'center',
          margin: 18,
        }}
        onPress={handlePayment}
      >
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>총 {totalPrice.toLocaleString()}원 결제하기</Text>
      </TouchableOpacity>
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
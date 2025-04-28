import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Auth } from 'aws-amplify';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, UserAttributes } from '../navigation/AppNavigator';

// API URL 설정
const API_URL = process.env.REACT_APP_API_URL?.replace(/\/$/, '') || 'https://lngdadu778.execute-api.ap-northeast-2.amazonaws.com/prod';
const MY_PAGE_API_URL = `${API_URL}/api/user/mypage`;

type MyPageScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MyPage'>;

const MyPageScreen = ({ navigation }: { navigation: MyPageScreenNavigationProp }) => {
  const [userInfo, setUserInfo] = useState<UserAttributes | null>(null);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const session = await Auth.currentSession();
      const token = session.getIdToken().getJwtToken();

      const response = await fetch(MY_PAGE_API_URL, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setUserInfo({
          name: data.user.name,
          email: data.user.email,
          birthdate: data.user.birthdate,
          phone_number: data.user.phoneNumber,
        });
      } else {
        throw new Error('사용자 정보 가져오기 실패');
      }
    } catch (error: any) {
      console.error('사용자 정보 조회 실패:', error);
      Alert.alert('오류', '사용자 정보를 불러오는데 실패했습니다.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>마이페이지</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        {userInfo && (
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>이름</Text>
              <Text style={styles.value}>{userInfo.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>이메일</Text>
              <Text style={styles.value}>{userInfo.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>생년월일</Text>
              <Text style={styles.value}>{userInfo.birthdate}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>전화번호</Text>
              <Text style={styles.value}>{userInfo.phone_number}</Text>
            </View>
          </View>
        )}

        {userInfo && (
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfile', { userInfo })}
          >
            <Text style={styles.editButtonText}>프로필 수정</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: { fontSize: 24, color: '#333', width: 40 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  headerRight: { width: 40 },
  content: { flex: 1, padding: 20 },
  infoContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  label: { fontSize: 16, color: '#666', flex: 1 },
  value: { fontSize: 16, color: '#333', flex: 2, textAlign: 'right' },
  editButton: {
    backgroundColor: '#1E88E5',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  editButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default MyPageScreen;

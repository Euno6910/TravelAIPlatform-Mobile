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
import { RootStackParamList } from '../navigation/AppNavigator';

type MyPageScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MyPage'>;

interface UserAttributes {
  name: string;
  email: string;
  birthdate: string;
  phone_number: string;
}

const MyPageScreen = ({ navigation }: { navigation: MyPageScreenNavigationProp }) => {
  const [userInfo, setUserInfo] = useState<UserAttributes | null>(null);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const user = await Auth.currentAuthenticatedUser();
      const attributes = user.attributes;
      setUserInfo({
        name: attributes.name || '',
        email: attributes.email || '',
        birthdate: attributes.birthdate || '',
        phone_number: attributes.phone_number || '',
      });
    } catch (error) {
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

        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => Alert.alert('알림', '프로필 수정 기능은 곧 추가될 예정입니다.')}
        >
          <Text style={styles.editButtonText}>프로필 수정</Text>
        </TouchableOpacity>
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
    width: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
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
  label: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  value: {
    fontSize: 16,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  editButton: {
    backgroundColor: '#1E88E5',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MyPageScreen; 
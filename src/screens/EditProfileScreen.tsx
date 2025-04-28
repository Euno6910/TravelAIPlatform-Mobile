import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import { Auth } from 'aws-amplify';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

// ✅ API 엔드포인트 설정 (네 API 주소 넣어줘야 함)
const API_URL = process.env.REACT_APP_API_URL?.replace(/\/$/, '') || 'https://lngdadu778.execute-api.ap-northeast-2.amazonaws.com/prod';
const USER_PROFILE_API_URL = `${API_URL}/api/user/profile`;

// ✅ 타입 정확히 지정
type EditProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

const EditProfileScreen = ({ navigation, route }: EditProfileScreenProps) => {
  const { userInfo } = route.params;

  const [name, setName] = useState(userInfo.name);
  const [email, setEmail] = useState(userInfo.email);
  const [birthdate, setBirthdate] = useState(userInfo.birthdate);
  const [phoneNumber, setPhoneNumber] = useState(userInfo.phone_number);

  const handleSave = async () => {
    try {
      if (!name.trim() || !email.trim() || !birthdate.trim() || !phoneNumber.trim()) {
        Alert.alert('입력 오류', '모든 필드를 입력해주세요.');
        return;
      }

      const user = await Auth.currentAuthenticatedUser();

      // ✅ 1단계: Cognito 사용자 속성 업데이트
      await Auth.updateUserAttributes(user, {
        'name': name.trim(),
        'email': email.trim(),
        'birthdate': birthdate.trim(),
        'phone_number': phoneNumber.trim(),
      });

      // ✅ 2단계: Lambda 호출로 DynamoDB 업데이트
      const token = user.signInUserSession.idToken.jwtToken;

      const response = await fetch(USER_PROFILE_API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          email,
          birthdate,
          phoneNumber,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '프로필 업데이트 실패');
      }

      Alert.alert('성공', '프로필이 성공적으로 수정되었습니다.');
      navigation.goBack();
    } catch (error: any) {
      console.error('프로필 수정 오류:', error);
      Alert.alert('오류', error.message || '프로필 수정 중 오류가 발생했습니다.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>프로필 수정</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>이름</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>이메일</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>생년월일</Text>
          <TextInput style={styles.input} value={birthdate} onChangeText={setBirthdate} placeholder="YYYY-MM-DD" />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>전화번호</Text>
          <TextInput style={styles.input} value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>저장하기</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#1E88E5' },
  inputContainer: { marginBottom: 15 },
  label: { fontSize: 16, marginBottom: 5, color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 20,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#1E88E5',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default EditProfileScreen;

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Auth } from 'aws-amplify';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, UserAttributes } from '../navigation/AppNavigator';

//마이페이지 화면 - 사용자 정보 조회, 프로필 수정과 회원탈퇴, 계획 관리의 게이트
// API URL 설정
const API_URL = process.env.REACT_APP_API_URL?.replace(/\/$/, '') || 'https://9b5hbw9u25.execute-api.ap-northeast-2.amazonaws.com/Stage';//MyPageFunction
const MY_PAGE_API_URL = `${API_URL}/user/mypage`;

type MyPageScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MyPage'>;

const MyPageScreen = ({ navigation }: { navigation: MyPageScreenNavigationProp }) => {
  const [userInfo, setUserInfo] = useState<UserAttributes | null>(null);
  const [travelPlans, setTravelPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  
  // 회원탈퇴 관련 상태
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

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

  const loadTravelPlans = async () => {
    try {
      setLoading(true);
      const session = await Auth.currentSession();
      const token = session.getIdToken().getJwtToken();

      const response = await fetch(
        'https://9b5hbw9u25.execute-api.ap-northeast-2.amazonaws.com/Stage/mobile/load_mobile',//LoadPlanFunction
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ newest: true }),
        }
      );

      const data = await response.json();
      
      if (response.ok && data.plan) {
        navigation.navigate('TravelSchedule', { plans: data.plan });
      } else {
        Alert.alert('알림', '여행 계획을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('여행 계획 로드 실패:', error);
      Alert.alert('오류', '여행 계획을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!password) {
      Alert.alert('오류', '비밀번호를 입력해주세요.');
      return;
    }

    try {
      // 비밀번호 검증
      await Auth.signIn(userInfo?.email || '', password);
      
      // 이메일 인증 코드 발송
      await Auth.verifyUserAttribute(
        await Auth.currentAuthenticatedUser(),
        'email'
      );
      setShowDeleteModal(false);
      setShowVerificationModal(true);
    } catch (error: any) {
      Alert.alert('오류', '비밀번호가 일치하지 않습니다.');
    }
  };

  const handleVerifyAndDelete = async () => {
    if (!verificationCode) {
      Alert.alert('오류', '인증 코드를 입력해주세요.');
      return;
    }

    try {
      setIsVerifying(true);
      
      // 현재 로그인된 사용자 정보 가져오기
      const currentUser = await Auth.currentAuthenticatedUser();
      const email = currentUser.attributes.email;
      
      // 이메일 인증 코드 확인
      await Auth.verifyUserAttributeSubmit(
        currentUser,
        'email',
        verificationCode
      );

      // 회원탈퇴 API 호출
      const response = await fetch(
        'https://j0jnhscmhk.execute-api.ap-northeast-2.amazonaws.com/default/deleteUserProfile',//deleteUserProfile
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (data.success) {
        Alert.alert('회원탈퇴 완료', '회원탈퇴가 완료되었습니다.', [
          {
            text: '확인',
            onPress: async () => {
              await Auth.signOut();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            },
          },
        ]);
      } else {
        throw new Error(data.message || '회원탈퇴 실패');
      }
    } catch (error: any) {
      Alert.alert('오류', error.message || '회원탈퇴 중 오류가 발생했습니다.');
    } finally {
      setIsVerifying(false);
      setShowVerificationModal(false);
    }
  };

  const handleSchedulePress = () => {
    setShowScheduleModal(true);
  };

  const handleAISchedule = () => {
    setShowScheduleModal(false);
    loadTravelPlans();
  };

  const handleAllSchedule = () => {
    setShowScheduleModal(false);
    navigation.navigate('AllSchedules');
  };

  const NavigationButton = ({ title, icon, onPress }: { title: string; icon: string; onPress: () => void }) => (
    <TouchableOpacity style={styles.navButton} onPress={onPress}>
      <Text style={styles.navButtonIcon}>{icon}</Text>
      <Text style={styles.navButtonText}>{title}</Text>
    </TouchableOpacity>
  );

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

        <View style={styles.navigationContainer}>
          <NavigationButton
            title="일정 관리"
            icon="📅"
            onPress={handleSchedulePress}
          />
          <NavigationButton
            title="프로필 수정"
            icon="👤"
            onPress={() => navigation.navigate('EditProfile', { userInfo: userInfo! })}
          />
        </View>

        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => setShowDeleteModal(true)}
        >
          <Text style={styles.deleteButtonText}>회원탈퇴</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 비밀번호 입력 모달 */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>회원탈퇴</Text>
            <Text style={styles.modalText}>
              정말 탈퇴하시겠습니까?{'\n'}
              탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.
            </Text>
            <TextInput
              style={[styles.modalInput, { color: '#222' }]}
              placeholder="비밀번호를 입력하세요"
              placeholderTextColor="#222"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowDeleteModal(false);
                  setPassword('');
                }}
              >
                <Text style={styles.modalButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleDeleteAccount}
              >
                <Text style={styles.modalButtonText}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 인증 코드 입력 모달 */}
      <Modal
        visible={showVerificationModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>이메일 인증</Text>
            <Text style={styles.modalText}>
              이메일로 발송된 인증 코드를 입력해주세요.
            </Text>
            <TextInput
              style={[styles.modalInput, { color: '#222' }]}
              placeholder="인증 코드를 입력하세요"
              placeholderTextColor="#222"
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="number-pad"
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowVerificationModal(false);
                  setVerificationCode('');
                }}
              >
                <Text style={styles.modalButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleVerifyAndDelete}
                disabled={isVerifying}
              >
                <Text style={styles.modalButtonText}>
                  {isVerifying ? '처리중...' : '확인'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 일정관리 옵션 모달 */}
      <Modal
        visible={showScheduleModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>일정 관리</Text>
            <TouchableOpacity 
              style={[styles.modalButton, styles.scheduleButton]}
              onPress={handleAISchedule}
            >
              <Text style={styles.modalButtonText}>AI가 만든 일정 관리</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.scheduleButton]}
              onPress={handleAllSchedule}
            >
              <Text style={styles.modalButtonText}>저장한 일정 관리</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowScheduleModal(false)}
            >
              <Text style={[styles.modalButtonText, { color: '#222' }]}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  navButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  navButtonIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalInput: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 15,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  confirmButton: {
    backgroundColor: '#FF3B30',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scheduleButton: {
    backgroundColor: '#1E88E5',
    marginBottom: 10,
  },
});

export default MyPageScreen;
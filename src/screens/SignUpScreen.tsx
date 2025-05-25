import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { Auth } from 'aws-amplify';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

//회원가입 화면 - 이메일, 이름, 생년월일, 전화번호, 비밀번호, 비밀번호 확인 입력, 회원가입 버튼 클릭 시 회원가입 처리, 이메일 인증 코드 입력 시 인증 완료 처리, 로그인 링크 클릭 시 로그인 화면으로 이동 
type SignUpScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SignUp'>;

const SignUpScreen = ({ navigation }: { navigation: SignUpScreenNavigationProp }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword || !name || !birthdate || !phoneNumber) {
      Alert.alert('입력 오류', '모든 필드를 입력해주세요.');
      return;
    }

    // 전화번호 형식 검증 (+82로 시작하는 번호)
    const phoneRegex = /^\+82\d{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      Alert.alert('전화번호 오류', '올바른 전화번호 형식이 아닙니다.\n예: +8210xxxxxxxx');
      return;
    }

    // 생년월일 형식 검증 (YYYY-MM-DD)
    const birthdateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!birthdateRegex.test(birthdate)) {
      Alert.alert('생년월일 오류', '올바른 생년월일 형식이 아닙니다.\n예: 2002-10-17');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('비밀번호 오류', '비밀번호가 일치하지 않습니다.');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      Alert.alert('비밀번호 오류', 
        '비밀번호는 다음 조건을 만족해야 합니다:\n\n' +
        '- 8자 이상\n' +
        '- 대문자 포함\n' +
        '- 소문자 포함\n' +
        '- 숫자 포함\n' +
        '- 특수문자 포함'
      );
      return;
    }

    // 회원가입 확인 팝업
    Alert.alert(
      '회원가입 확인',
      `다음 정보로 회원가입을 진행하시겠습니까?\n\n이름: ${name}\n이메일: ${email}\n생년월일: ${birthdate}\n전화번호: ${phoneNumber}`,
      [
        {
          text: '취소',
          style: 'cancel'
        },
        {
          text: '확인',
          onPress: async () => {
            try {
              await Auth.signUp({
                username: email,
                password,
                attributes: {
                  email,
                  name,
                  birthdate,
                  phone_number: phoneNumber
                }
              });
              setIsConfirming(true);
              Alert.alert('인증 코드 발송', '입력하신 이메일로 인증 코드가 발송되었습니다.');
            } catch (error: unknown) {
              if (error instanceof Error) {
                Alert.alert('회원가입 실패', error.message);
              }
            }
          }
        }
      ]
    );
  };

  const handleConfirmSignUp = async () => {
    if (!verificationCode) {
      Alert.alert('입력 오류', '인증 코드를 입력해주세요.');
      return;
    }

    try {
      await Auth.confirmSignUp(email, verificationCode);
      Alert.alert('회원가입 완료', 'WINDROAD에 오신 것을 환영합니다!', [
        {
          text: '로그인하기',
          onPress: () => navigation.navigate('Login')
        }
      ]);
    } catch (error: unknown) {
      if (error instanceof Error) {
        Alert.alert('인증 실패', error.message);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backButton}>←</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.logoContainer}>
            <Text style={styles.logo}>WINDROAD</Text>
            <Text style={styles.subtitle}>AI와 함께하는 스마트한 여행 계획</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>
              {isConfirming ? '이메일 인증' : '회원가입'}
            </Text>

            {!isConfirming ? (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>이름</Text>
                  <TextInput
                    style={[styles.input, { color: '#222' }]}
                    placeholder="이름을 입력하세요"
                    placeholderTextColor="#222"
                    value={name}
                    onChangeText={setName}
                    keyboardType="default"
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="none"
                    multiline={false}
                    clearButtonMode="while-editing"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>이메일</Text>
                  <TextInput
                    style={[styles.input, { color: '#222' }]}
                    placeholder="이메일을 입력하세요"
                    placeholderTextColor="#222"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>생년월일</Text>
                  <TextInput
                    style={[styles.input, { color: '#222' }]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#222"
                    value={birthdate}
                    onChangeText={setBirthdate}
                    keyboardType="numbers-and-punctuation"
                    maxLength={10}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>전화번호</Text>
                  <TextInput
                    style={[styles.input, { color: '#222' }]}
                    placeholder="+8210xxxxxxxx"
                    placeholderTextColor="#222"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    maxLength={13}
                    onFocus={() => {
                      if (!phoneNumber) setPhoneNumber('+8210');
                    }}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>비밀번호</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TextInput
                      style={[styles.input, { color: '#222', flex: 1 }]}
                      placeholder="비밀번호를 입력하세요"
                      placeholderTextColor="#222"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <Text style={{ fontSize: 18, marginLeft: 8 }}>
                        {showPassword ? '🙈' : '👁️'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.passwordGuide}>
                    비밀번호는 8자 이상이며, 대문자, 소문자, 숫자, 특수문자를 포함해야 합니다.
                  </Text>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>비밀번호 확인</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TextInput
                      style={[styles.input, { color: '#222', flex: 1 }]}
                      placeholder="비밀번호를 다시 입력하세요"
                      placeholderTextColor="#222"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                      <Text style={{ fontSize: 18, marginLeft: 8 }}>
                        {showConfirmPassword ? '🙈' : '👁️'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.signUpButton}
                  onPress={handleSignUp}
                >
                  <Text style={styles.signUpButtonText}>가입하기</Text>
                </TouchableOpacity>

                <View style={styles.loginContainer}>
                  <Text style={styles.loginText}>이미 계정이 있으신가요?</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.loginLink}>로그인</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>인증 코드</Text>
                  <TextInput
                    style={[styles.input, { color: '#222' }]}
                    placeholder="이메일로 받은 인증 코드를 입력하세요"
                    placeholderTextColor="#222"
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    keyboardType="number-pad"
                  />
                </View>

                <TouchableOpacity 
                  style={styles.submitButton}
                  onPress={handleConfirmSignUp}
                >
                  <Text style={styles.submitButtonText}>인증 완료</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 200,
  },
  keyboardView: {
    width: '100%',
  },
  header: {
    padding: 15,
  },
  backButton: {
    fontSize: 24,
    color: '#333',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E88E5',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingBottom: 150,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: '#000',
  },
  passwordGuide: {
    fontSize: 11,
    color: '#666',
    marginTop: 3,
    lineHeight: 14,
  },
  signUpButton: {
    backgroundColor: '#1E88E5',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 15,
    width: '100%',
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#1E88E5',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    width: '100%',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  loginText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {
    color: '#1E88E5',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
});

export default SignUpScreen;

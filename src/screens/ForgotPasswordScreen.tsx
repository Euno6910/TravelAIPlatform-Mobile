import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Auth } from 'aws-amplify';

const ForgotPasswordScreen = ({ navigation }: { navigation: any }) => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email) {
      Alert.alert('오류', '이메일을 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      await Auth.forgotPassword(email);
      setStep('code');
      Alert.alert('인증 코드 발송', '입력하신 이메일로 인증 코드가 발송되었습니다.');
    } catch (error: any) {
      Alert.alert('오류', error.message || '인증 코드 발송에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!code || !newPassword) {
      Alert.alert('오류', '인증 코드와 새 비밀번호를 모두 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      await Auth.forgotPasswordSubmit(email, code, newPassword);
      Alert.alert('비밀번호 변경 완료', '비밀번호가 성공적으로 변경되었습니다.', [
        {
          text: '로그인하기',
          onPress: () => navigation.navigate('Login'),
        },
      ]);
    } catch (error: any) {
      Alert.alert('오류', error.message || '비밀번호 변경에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.innerContainer}>
          <Text style={styles.title}>비밀번호 재설정</Text>
          {step === 'email' ? (
            <>
              <Text style={styles.label}>이메일</Text>
              <TextInput
                style={[styles.input, { color: '#222' }]}
                placeholder="이메일을 입력하세요"
                placeholderTextColor="#222"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.button} onPress={handleSendCode} disabled={loading}>
                <Text style={styles.buttonText}>{loading ? '처리중...' : '인증 코드 받기'}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>인증 코드</Text>
              <TextInput
                style={[styles.input, { color: '#222' }]}
                placeholder="이메일로 받은 인증 코드를 입력하세요"
                placeholderTextColor="#222"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
              />
              <Text style={styles.label}>새 비밀번호</Text>
              <TextInput
                style={[styles.input, { color: '#222' }]}
                placeholder="새 비밀번호를 입력하세요"
                placeholderTextColor="#222"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
              <Text style={styles.passwordGuide}>
                비밀번호는 8자 이상이며, 대문자, 소문자, 숫자, 특수문자를 포함해야 합니다.
              </Text>
              <TouchableOpacity style={styles.button} onPress={handleResetPassword} disabled={loading}>
                <Text style={styles.buttonText}>{loading ? '처리중...' : '비밀번호 변경'}</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← 뒤로가기</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  innerContainer: { flex: 1, justifyContent: 'center', padding: 30 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 30, textAlign: 'center' },
  label: { fontSize: 16, color: '#333', marginBottom: 8 },
  input: { backgroundColor: '#f5f5f5', padding: 15, borderRadius: 10, fontSize: 16, marginBottom: 20 },
  button: { backgroundColor: '#1E88E5', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  backButton: { alignItems: 'center', marginTop: 30 },
  backButtonText: { color: '#1E88E5', fontSize: 16 },
  passwordGuide: {
    fontSize: 11,
    color: '#666',
    marginTop: 3,
    lineHeight: 14,
    marginBottom: 10,
  },
});

export default ForgotPasswordScreen; 
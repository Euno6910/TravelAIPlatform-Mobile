import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Modal,
  Linking,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Auth } from 'aws-amplify';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Calendar } from 'react-native-calendars';

//앱의 메인 화면 - 로그인 상태 확인, 로그인 화면 이동, 로그아웃 기능, 로그인 시 마이페이지 이동
type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen = ({ navigation }: { navigation: HomeScreenNavigationProp }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [selectedDates, setSelectedDates] = useState('날짜를 선택하세요');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{type: 'user' | 'ai', text: string}>>([
    { type: 'ai', text: '안녕하세요! 저는 당신의 여행 계획을 도와줄 AI 어시스턴트입니다. 여행 날짜와 인원을 선택하고, 어떤 여행을 계획하고 계신지 말씀해주세요.' }
  ]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState('');
  const [selectedEndDate, setSelectedEndDate] = useState('');
  const [isSelectingEndDate, setIsSelectingEndDate] = useState(false);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const user = await Auth.currentAuthenticatedUser();
      setIsLoggedIn(true);
      setUserName(user.attributes.name || user.attributes.email);
    } catch (error) {
      setIsLoggedIn(false);
      setUserName('');
    }
  };

  const handleLogout = async () => {
    try {
      await Auth.signOut();
      setIsLoggedIn(false);
      setUserName('');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    // 사용자 메시지와 여행 정보를 함께 전송
    const messageWithInfo = `[여행 정보]\n날짜: ${selectedDates}\n성인: ${adults}명\n어린이: ${children}명\n\n${userInput}`;
    
    setChatMessages(prev => [...prev, { type: 'user', text: messageWithInfo }]);
    setIsTyping(true);
    setUserInput('');

    try {
      // Auth 토큰 가져오기 및 로깅
      let token;
      let userEmail;
      try {
        const session = await Auth.currentSession();
        token = session.getIdToken().getJwtToken();
        userEmail = session.getIdToken().payload.email;
        
        // 토큰 정보 로깅
        console.log('세션 정보:', {
          email: userEmail,
          tokenExpiration: new Date(session.getIdToken().getExpiration() * 1000).toISOString()
        });
        
        if (!userEmail) {
          throw new Error('이메일 정보를 찾을 수 없습니다.');
        }
      } catch (authError: any) {
        console.error('인증 토큰 가져오기 실패:', authError);
        setChatMessages(prev => [...prev, { 
          type: 'ai', 
          text: '로그인이 필요하거나 세션이 만료되었습니다. 다시 로그인해주세요.' 
        }]);
        setIsTyping(false);
        return;
      }

      // API 요청 데이터 준비
      const requestData = {
        query: userInput,
        startDate: selectedDates.split(' ~ ')[0] || '2024-05-01',
        endDate: selectedDates.split(' ~ ')[1] || '2024-05-03',
        adults: adults,
        children: children,
        email: userEmail  // 이메일 정보 추가
      };

      console.log('API 요청 데이터:', requestData);

      const response = await fetch('https://lngdadu778.execute-api.ap-northeast-2.amazonaws.com/Stage/api/travel/python-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      const responseText = await response.text();
      console.log('Raw API 응답:', responseText);

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON 파싱 에러:', parseError);
        // Gemini 응답에서 JSON 문자열 추출 시도
        const match = responseText.match(/```json\n([\s\S]*?)\n```/);
        if (match && match[1]) {
          try {
            data = JSON.parse(match[1]);
          } catch (secondParseError) {
            console.error('두 번째 JSON 파싱 시도 실패:', secondParseError);
            throw new Error('서버 응답을 처리할 수 없습니다.');
          }
        } else {
          throw new Error('서버 응답을 처리할 수 없습니다.');
        }
      }

      if (data.plan?.candidates?.[0]?.content?.parts?.[0]?.text) {
        const geminiResponse = data.plan.candidates[0].content.parts[0].text;
        try {
          // JSON 문자열 추출 시도
          const match = geminiResponse.match(/```json\n([\s\S]*?)\n```/);
          const jsonStr = match ? match[1] : geminiResponse;
          
          const planData = JSON.parse(jsonStr);
          let formattedResponse = `🎯 ${planData.title}\n\n`;
          formattedResponse += `📍 목적지: ${planData.destination}\n`;
          formattedResponse += `📅 기간: ${planData.duration}\n\n`;
          
          // 일정 정보 추가
          planData.itinerary?.forEach((day: any) => {
            formattedResponse += `Day ${day.day} (${day.date})\n`;
            formattedResponse += `${day.title}\n`;
            day.activities?.forEach((activity: any) => {
              formattedResponse += `• ${activity.time} - ${activity.title}\n`;
              if (activity.description) formattedResponse += `  ${activity.description}\n`;
            });
            formattedResponse += '\n';
          });

          // 팁 추가
          if (planData.tips?.length > 0) {
            formattedResponse += '\n💡 여행 팁:\n';
            planData.tips.forEach((tip: string) => {
              formattedResponse += `• ${tip}\n`;
            });
          }

          setChatMessages(prev => [...prev, { 
            type: 'ai', 
            text: formattedResponse
          }]);
        } catch (parseError) {
          console.error('여행 계획 JSON 파싱 에러:', parseError);
          // JSON 파싱 실패시 원본 텍스트 표시
          setChatMessages(prev => [...prev, { 
            type: 'ai', 
            text: geminiResponse.replace(/```json\n|\n```/g, '')
          }]);
        }
      } else {
        throw new Error('예상치 못한 응답 형식입니다.');
      }
    } catch (error: any) {
      console.error('API 호출 실패:', error);
      setChatMessages(prev => [...prev, { 
        type: 'ai', 
        text: `죄송합니다. 오류가 발생했습니다: ${error.message}` 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleDateSelect = (date: string) => {
    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      setSelectedStartDate(date);
      setSelectedEndDate('');
      setIsSelectingEndDate(true);
    } else {
      if (new Date(date) < new Date(selectedStartDate)) {
        setSelectedStartDate(date);
        setSelectedEndDate('');
      } else {
        setSelectedEndDate(date);
        setIsSelectingEndDate(false);
        setSelectedDates(`${selectedStartDate} ~ ${date}`);
        setShowDatePicker(false);
      }
    }
  };

  const getMarkedDates = () => {
    const marked: any = {};
    if (selectedStartDate) {
      marked[selectedStartDate] = {
        selected: true,
        startingDay: true,
        color: '#1E88E5',
      };
    }
    if (selectedEndDate) {
      marked[selectedEndDate] = {
        selected: true,
        endingDay: true,
        color: '#1E88E5',
      };
    }
    return marked;
  };

  const handleManualPlan = () => {
    navigation.navigate('ManualPlan');
  };

  // 구글맵 메인 화면으로 오픈하는 함수
  const openGoogleMapsMain = () => {
    Linking.openURL('https://www.google.com/maps');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView>
          <View style={styles.header}>
            <Text style={styles.logo}>바람길</Text>
            <View style={styles.headerRight}>
              {isLoggedIn ? (
                <>
                  <TouchableOpacity 
                    style={styles.headerButton}
                    onPress={() => navigation.navigate('MyPage')}
                  >
                    <Text style={styles.headerButtonText}>마이페이지</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.headerButton}
                    onPress={handleLogout}
                  >
                    <Text style={styles.headerButtonText}>로그아웃</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity 
                  style={styles.headerButton}
                  onPress={() => navigation.navigate('Login')}
                >
                  <Text style={styles.headerButtonText}>로그인</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.travelInfoContainer}>
            <TouchableOpacity 
              style={styles.infoButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.infoButtonText}>{selectedDates}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.infoButton}
              onPress={() => setShowGuestPicker(true)}
            >
              <Text style={styles.infoButtonText}>성인 {adults}명 · 어린이 {children}명</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.chatScrollView}>
            <View style={styles.chatContainer}>
              {chatMessages.map((message, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.messageBubble,
                    message.type === 'user' ? styles.userMessageBubble : styles.aiMessageBubble
                  ]}
                >
                  <Text style={[
                    styles.messageText,
                    message.type === 'user' ? styles.userMessageText : styles.aiMessageText
                  ]}>
                    {message.text}
                  </Text>
                </View>
              ))}
              {isTyping && (
                <View style={styles.typingIndicator}>
                  <Text style={styles.typingText}>AI가 응답을 작성 중입니다...</Text>
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.userInputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.userInputField}
                placeholder="여행 계획에 대해 자유롭게 입력해주세요..."
                placeholderTextColor="#999"
                value={userInput}
                onChangeText={setUserInput}
                multiline
              />
              <TouchableOpacity 
                style={styles.sendButton}
                onPress={handleSendMessage}
              >
                <Text style={styles.sendButtonText}>전송</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.sectionTitle}>
            <Text style={styles.titleText}>AI 여행의 시작</Text>
          </View>

          <View style={styles.featureContainer}>
            <FeatureItem 
              icon="🤖" 
              title="AI가 일정을 생성" 
              description="인공지능이 데이터를 기반으로 최적의 일정을 제안합니다." 
            />
            <FeatureItem 
              icon="✍️" 
              title="직접 여행 계획 생성" 
              description="AI의 도움 없이 나만의 스타일로 여행 계획을 작성해보세요." 
            />
            <FeatureItem 
              icon="📝" 
              title="여행 계획 저장" 
              description="생성된 여행 계획을 저장하고 언제든지 확인할 수 있습니다." 
            />
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.planButton}
              onPress={handleManualPlan}
            >
              <Text style={styles.planButtonText}>✍️ 직접 여행 계획 작성하기</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.mapButton}
              onPress={openGoogleMapsMain}
            >
              <Text style={styles.mapButtonText}>🗺️ 지도</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <Modal
          visible={showDatePicker}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { height: 'auto' }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>날짜 선택</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => {
                    setShowDatePicker(false);
                    setSelectedStartDate('');
                    setSelectedEndDate('');
                    setIsSelectingEndDate(false);
                  }}
                >
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>

              <Calendar
                onDayPress={(day) => handleDateSelect(day.dateString)}
                markedDates={getMarkedDates()}
                minDate={new Date().toISOString().split('T')[0]}
                markingType="period"
                theme={{
                  todayTextColor: '#1E88E5',
                  selectedDayBackgroundColor: '#1E88E5',
                  selectedDayTextColor: '#fff',
                  arrowColor: '#1E88E5',
                }}
              />

              <View style={styles.dateSelectionInfo}>
                <Text style={styles.dateSelectionText}>
                  {isSelectingEndDate ? '체크아웃 날짜를 선택해주세요' : '체크인 날짜를 선택해주세요'}
                </Text>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showGuestPicker}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { height: 'auto' }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>인원 선택</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowGuestPicker(false)}
                >
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.guestPickerContainer}>
                <View style={styles.guestPickerRow}>
                  <Text style={styles.guestPickerLabel}>성인</Text>
                  <View style={styles.guestPickerControls}>
                    <TouchableOpacity 
                      style={[styles.guestPickerButton, adults <= 1 && styles.guestPickerButtonDisabled]}
                      onPress={() => adults > 1 && setAdults(adults - 1)}
                    >
                      <Text style={styles.guestPickerButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.guestPickerCount}>{adults}</Text>
                    <TouchableOpacity 
                      style={styles.guestPickerButton}
                      onPress={() => setAdults(adults + 1)}
                    >
                      <Text style={styles.guestPickerButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.guestPickerRow}>
                  <Text style={styles.guestPickerLabel}>어린이</Text>
                  <View style={styles.guestPickerControls}>
                    <TouchableOpacity 
                      style={[styles.guestPickerButton, children <= 0 && styles.guestPickerButtonDisabled]}
                      onPress={() => children > 0 && setChildren(children - 1)}
                    >
                      <Text style={styles.guestPickerButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.guestPickerCount}>{children}</Text>
                    <TouchableOpacity 
                      style={styles.guestPickerButton}
                      onPress={() => setChildren(children + 1)}
                    >
                      <Text style={styles.guestPickerButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.applyButton}
                onPress={() => setShowGuestPicker(false)}
              >
                <Text style={styles.applyButtonText}>적용하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

interface FeatureItemProps {
  icon: string;
  title: string;
  description: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ icon, title, description }) => {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E88E5',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 15,
    padding: 8,
    borderRadius: 5,
    backgroundColor: '#1E88E5',
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  travelInfoContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  infoButtonText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  chatScrollView: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  chatContainer: {
    padding: 15,
  },
  messageBubble: {
    padding: 15,
    borderRadius: 20,
    marginBottom: 10,
    maxWidth: '80%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  userMessageBubble: {
    backgroundColor: '#1E88E5',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 5,
  },
  aiMessageBubble: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 5,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  userMessageText: {
    color: '#fff',
  },
  aiMessageText: {
    color: '#333',
  },
  userInputContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  inputWrapper: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    padding: 10,
    alignItems: 'center',
  },
  userInputField: {
    flex: 1,
    minHeight: 40,
    color: '#333',
    fontSize: 16,
    paddingHorizontal: 15,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#1E88E5',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginLeft: 10,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  startButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 10,
  },
  startButtonText: {
    color: '#1E88E5',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    padding: 20,
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  featureContainer: {
    flexDirection: 'column',
    paddingHorizontal: 20,
  },
  featureItem: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
  },
  featureIcon: {
    fontSize: 30,
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    padding: 20,
    marginBottom: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  dateSelectionInfo: {
    padding: 15,
    alignItems: 'center',
  },
  dateSelectionText: {
    fontSize: 16,
    color: '#666',
  },
  guestPickerContainer: {
    paddingVertical: 10,
  },
  guestPickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  guestPickerLabel: {
    fontSize: 16,
    color: '#333',
  },
  guestPickerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  guestPickerButton: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    borderWidth: 1,
    borderColor: '#1E88E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestPickerButtonDisabled: {
    borderColor: '#ccc',
  },
  guestPickerButtonText: {
    fontSize: 20,
    color: '#1E88E5',
  },
  guestPickerCount: {
    fontSize: 16,
    color: '#333',
    minWidth: 30,
    textAlign: 'center',
  },
  applyButton: {
    backgroundColor: '#1E88E5',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  keyboardView: {
    flex: 1,
  },
  typingIndicator: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  typingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  planButton: {
    backgroundColor: '#1E88E5',
    padding: 18,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  planButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  mapButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1E88E5',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
  },
  mapButtonText: {
    color: '#1E88E5',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default HomeScreen; 
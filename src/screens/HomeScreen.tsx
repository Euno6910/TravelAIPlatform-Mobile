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
} from 'react-native';
import { Auth } from 'aws-amplify';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

//앱의 메인 화면 - 로그인 상태 확인, 로그인 화면 이동, 로그아웃 기능, 로그인 시 마이페이지 이동
type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen = ({ navigation }: { navigation: HomeScreenNavigationProp }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [destination, setDestination] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [selectedDates, setSelectedDates] = useState('날짜를 선택하세요');
  const [guestCount, setGuestCount] = useState('성인 2명 · 아동 0명 · 객실 1개');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

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

  const handleSearch = () => {
    // 검색 로직 구현 예정
    console.log('Search:', { destination, selectedDates, guestCount });
  };

  const updateGuestCount = () => {
    setGuestCount(`성인 ${adults}명 · 아동 ${children}명 · 객실 ${rooms}개`);
    setShowGuestPicker(false);
  };

  return (
    <SafeAreaView style={styles.container}>
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

        <View style={styles.searchContainer}>
          <Text style={styles.searchTitle}>최신 리뷰를 읽고 최저가를 찾으세요</Text>
          <View style={styles.searchBox}>
            <View style={styles.searchInputContainer}>
              <Text style={styles.searchLabel}>어디로 향하시나요?</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="호텔 이름 또는 여행지"
                value={destination}
                onChangeText={setDestination}
              />
            </View>
            
            <TouchableOpacity 
              style={styles.searchInputContainer}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.searchLabel}>체크인 날짜</Text>
              <Text style={styles.searchInputText}>{selectedDates}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.searchInputContainer}
              onPress={() => setShowGuestPicker(true)}
            >
              <Text style={styles.searchLabel}>인원 & 객실</Text>
              <Text style={styles.searchInputText}>{guestCount}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.searchButton}
              onPress={handleSearch}
            >
              <Text style={styles.searchButtonText}>호텔 검색</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.mainBanner}>
          <View style={styles.chatContainer}>
            <View style={styles.aiMessageBubble}>
              <Text style={styles.aiMessageText}>안녕하세요! 저는 당신의 여행 계획을 도와줄 AI 어시스턴트입니다. 어떤 여행을 계획하고 계신가요?</Text>
              {isTyping && (
                <View style={styles.typingIndicator}>
                  <Text style={styles.typingText}>AI가 응답을 작성 중입니다...</Text>
                </View>
              )}
            </View>
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
                  onPress={() => {
                    // TODO: AI API 연동
                    setIsTyping(true);
                    setTimeout(() => {
                      setIsTyping(false);
                      setUserInput('');
                    }, 2000);
                  }}
                >
                  <Text style={styles.sendButtonText}>전송</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity 
                style={styles.startButton}
                onPress={() => navigation.navigate('PlanCreation')}
              >
                <Text style={styles.startButtonText}>여행 계획 시작하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.sectionTitle}>
          <Text style={styles.titleText}>AI 여행의 시작</Text>
        </View>

        <View style={styles.featureContainer}>
          <FeatureItem 
            icon="✍️" 
            title="테스트를 통해 취향 분석" 
            description="간단한 테스트로 당신의 여행 취향을 분석합니다." 
          />
          <FeatureItem 
            icon="🤖" 
            title="AI가 일정을 생성" 
            description="인공지능이 데이터를 기반으로 최적의 일정을 제안합니다." 
          />
          <FeatureItem 
            icon="🗺️" 
            title="지도로 보는 여행 계획" 
            description="생성된 일정을 지도에서 확인하고 수정할 수 있습니다." 
          />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.planButton}
            onPress={() => navigation.navigate('PlanCreation')}
          >
            <Text style={styles.planButtonText}>지금 바로 AI와 함께 여행 계획 시작하기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showDatePicker}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>날짜 선택</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.calendarContainer}>
              <View style={styles.monthSelector}>
                <TouchableOpacity>
                  <Text style={styles.monthArrow}>←</Text>
                </TouchableOpacity>
                <Text style={styles.monthText}>2024년 4월</Text>
                <TouchableOpacity>
                  <Text style={styles.monthArrow}>→</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.weekDays}>
                <Text style={styles.weekDay}>일</Text>
                <Text style={styles.weekDay}>월</Text>
                <Text style={styles.weekDay}>화</Text>
                <Text style={styles.weekDay}>수</Text>
                <Text style={styles.weekDay}>목</Text>
                <Text style={styles.weekDay}>금</Text>
                <Text style={styles.weekDay}>토</Text>
              </View>

              <View style={styles.daysContainer}>
                {/* 날짜 그리드는 실제 구현 시 동적으로 생성 */}
                {Array.from({ length: 30 }, (_, i) => (
                  <TouchableOpacity 
                    key={i + 1}
                    style={styles.dayButton}
                  >
                    <Text style={styles.dayText}>{i + 1}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity 
              style={styles.applyButton}
              onPress={() => {
                setSelectedDates('2024-04-15 ~ 2024-04-20');
                setShowDatePicker(false);
              }}
            >
              <Text style={styles.applyButtonText}>적용하기</Text>
            </TouchableOpacity>
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
              <Text style={styles.modalTitle}>인원 & 객실</Text>
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
                <Text style={styles.guestPickerLabel}>아동</Text>
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

              <View style={styles.guestPickerRow}>
                <Text style={styles.guestPickerLabel}>객실</Text>
                <View style={styles.guestPickerControls}>
                  <TouchableOpacity 
                    style={[styles.guestPickerButton, rooms <= 1 && styles.guestPickerButtonDisabled]}
                    onPress={() => rooms > 1 && setRooms(rooms - 1)}
                  >
                    <Text style={styles.guestPickerButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.guestPickerCount}>{rooms}</Text>
                  <TouchableOpacity 
                    style={styles.guestPickerButton}
                    onPress={() => setRooms(rooms + 1)}
                  >
                    <Text style={styles.guestPickerButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.applyButton}
              onPress={updateGuestCount}
            >
              <Text style={styles.applyButtonText}>적용하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  searchContainer: {
    backgroundColor: '#f8f8f8',
    padding: 20,
  },
  searchTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  searchBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  searchInputContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 12,
  },
  searchLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  searchInput: {
    fontSize: 16,
    color: '#333',
  },
  searchInputText: {
    fontSize: 16,
    color: '#333',
  },
  searchButton: {
    backgroundColor: '#1E88E5',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mainBanner: {
    backgroundColor: '#1E88E5',
    padding: 30,
    alignItems: 'center',
  },
  chatContainer: {
    width: '100%',
    maxWidth: 500,
  },
  aiMessageBubble: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  aiMessageText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
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
  userInputContainer: {
    alignItems: 'center',
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 10,
    marginBottom: 15,
    width: '100%',
    alignItems: 'center',
  },
  userInputField: {
    flex: 1,
    minHeight: 40,
    color: '#333',
    fontSize: 16,
    paddingHorizontal: 15,
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
  planButton: {
    backgroundColor: '#1E88E5',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  planButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
  calendarContainer: {
    flex: 1,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthArrow: {
    fontSize: 24,
    color: '#1E88E5',
    padding: 10,
  },
  monthText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  weekDay: {
    width: 40,
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayButton: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 16,
    color: '#333',
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
});

export default HomeScreen; 
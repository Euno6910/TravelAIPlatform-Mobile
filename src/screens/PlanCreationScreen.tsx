import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';

interface PlanCreationScreenProps {
  navigation: any;
}

const PlanCreationScreen: React.FC<PlanCreationScreenProps> = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [budget, setBudget] = useState('');

  const interestOptions = [
    '자연', '역사', '문화', '음식', '쇼핑', 
    '모험', '휴식', '야외활동', '사진', '건축'
  ];

  const handleNextStep = () => {
    if (step === 1) {
      if (!destination.trim()) {
        Alert.alert('오류', '목적지를 입력해주세요.');
        return;
      }
      if (!startDate.trim() || !endDate.trim()) {
        Alert.alert('오류', '여행 날짜를 입력해주세요.');
        return;
      }
    } else if (step === 2) {
      if (interests.length === 0) {
        Alert.alert('오류', '최소 한 개 이상의 관심사를 선택해주세요.');
        return;
      }
    } else if (step === 3) {
      if (!budget.trim()) {
        Alert.alert('오류', '예산을 입력해주세요.');
        return;
      }
      // 마지막 단계에서 계획 생성 결과 화면으로 이동
      navigation.navigate('PlanResult', {
        destination,
        startDate,
        endDate,
        interests,
        budget
      });
      return;
    }
    setStep(step + 1);
  };

  const handleBackStep = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  };

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(item => item !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>여행지 및 일정</Text>
            <Text style={styles.inputLabel}>목적지</Text>
            <TextInput
              style={styles.input}
              placeholder="여행하고 싶은 도시나 나라를 입력하세요"
              value={destination}
              onChangeText={setDestination}
            />
            
            <Text style={styles.inputLabel}>출발 날짜</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={startDate}
              onChangeText={setStartDate}
            />
            
            <Text style={styles.inputLabel}>도착 날짜</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={endDate}
              onChangeText={setEndDate}
            />
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>관심사 선택</Text>
            <Text style={styles.stepDescription}>여행 중 꼭 경험하고 싶은 활동을 선택해주세요.</Text>
            
            <View style={styles.interestsContainer}>
              {interestOptions.map((interest) => (
                <TouchableOpacity
                  key={interest}
                  style={[
                    styles.interestItem,
                    interests.includes(interest) && styles.interestItemSelected
                  ]}
                  onPress={() => toggleInterest(interest)}
                >
                  <Text 
                    style={[
                      styles.interestItemText,
                      interests.includes(interest) && styles.interestItemTextSelected
                    ]}
                  >
                    {interest}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>예산 설정</Text>
            <Text style={styles.stepDescription}>여행 예산을 입력해주세요.</Text>
            
            <Text style={styles.inputLabel}>총 예산 (원)</Text>
            <TextInput
              style={styles.input}
              placeholder="예: 1,000,000"
              value={budget}
              onChangeText={setBudget}
              keyboardType="numeric"
            />
            
            <Text style={styles.budgetNote}>
              예산에 맞는 숙소, 식당, 관광지를 추천해드립니다.
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackStep}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>새 여행 계획 만들기</Text>
        <View style={styles.placeholderView} />
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(step / 3) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>단계 {step}/3</Text>
      </View>

      <ScrollView style={styles.content}>
        {renderStepContent()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={handleNextStep}
        >
          <Text style={styles.nextButtonText}>
            {step === 3 ? '여행 계획 생성하기' : '다음'}
          </Text>
        </TouchableOpacity>
      </View>
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
  progressContainer: {
    padding: 15,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1E88E5',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 10,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  interestItem: {
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    margin: 5,
  },
  interestItemSelected: {
    backgroundColor: '#1E88E5',
  },
  interestItemText: {
    color: '#333',
    fontSize: 14,
  },
  interestItemTextSelected: {
    color: '#fff',
  },
  budgetNote: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 15,
  },
  footer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  nextButton: {
    backgroundColor: '#1E88E5',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PlanCreationScreen; 
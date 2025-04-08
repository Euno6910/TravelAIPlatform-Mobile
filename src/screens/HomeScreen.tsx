import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';

interface HomeScreenProps {
  navigation: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.logo}>바람길</Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginText}>로그인</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mainBanner}>
          <Text style={styles.mainTitle}>AI와 함께하는</Text>
          <Text style={styles.mainTitle}>스마트한 여행 계획</Text>
          <Text style={styles.subTitle}>
            인공지능이 여러분의 취향에 맞는 최적의 여행 일정을 계획해드립니다.
          </Text>
          <TouchableOpacity 
            style={styles.startButton}
            onPress={() => navigation.navigate('PlanCreation')}
          >
            <Text style={styles.startButtonText}>시작하기</Text>
          </TouchableOpacity>
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

        <View style={styles.navigationButtons}>
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.navButtonText}>로그인 화면으로</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => navigation.navigate('PlanCreation')}
          >
            <Text style={styles.navButtonText}>계획 생성 화면으로</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E88E5',
  },
  loginButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  loginText: {
    fontSize: 16,
    color: '#333',
  },
  mainBanner: {
    backgroundColor: '#1E88E5',
    padding: 30,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 16,
    color: '#fff',
    marginTop: 15,
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
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
  navigationButtons: {
    padding: 20,
    backgroundColor: '#f9f9f9',
    marginBottom: 30,
  },
  navButton: {
    backgroundColor: '#FF5722',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen; 
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
  Share,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { RouteProp } from '@react-navigation/native';
import { requestNotificationPermission, scheduleNotification, showNotification } from '../utils/notification';

//마이페이지 - 여행계획
type TravelScheduleScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'TravelSchedule'>;
  route: RouteProp<RootStackParamList, 'TravelSchedule'>;
};

// 구글맵 검색 함수
const openGoogleMaps = (lat?: number, lng?: number, location?: string, name?: string) => {
  let url = '';
  if (lat && lng) {
    const searchQuery = name ? `${name} ${lat},${lng}` : `${lat},${lng}`;
    url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`;
  } else if (location) {
    const searchQuery = name ? `${name} ${location}` : location;
    url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`;
  }
  if (url) Linking.openURL(url);
};

interface WeatherData {
  city: {
    name: string;
    country: string;
  };
  forecasts: Array<{
    dt: number;
    main: {
      temp: number;
      feels_like: number;
      humidity: number;
    };
    weather: Array<{
      main: string;
      description: string;
      icon: string;
    }>;
    wind: {
      speed: number;
    };
  }>;
}

const TravelScheduleScreen: React.FC<TravelScheduleScreenProps> = ({ navigation, route }) => {
  // 실제 데이터 사용
  const plans = route.params?.plans || [];
  const flight = plans[0]?.flight_info;
  const accmo = plans[0]?.accmo_info; // 숙박 정보 추가

  const getStatus = (start: string, end: string) => {
    const today = new Date();
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (endDate < today) return '여행 완료';
    if (startDate > today) return '여행 예정';
    return '여행 중';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '여행 예정':
        return '#4CAF50';
      case '여행 완료':
        return '#9E9E9E';
      case '여행 중':
        return '#1E88E5';
      default:
        return '#1E88E5';
    }
  };

  const [expandedDayIdxMap, setExpandedDayIdxMap] = useState<{ [planId: string]: number | null }>({});
  const [expandedFlight, setExpandedFlight] = useState<{ [planId: string]: boolean }>({});
  const [expandedHotel, setExpandedHotel] = useState<{ [planId: string]: boolean }>({});
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  useEffect(() => {
    const setupNotifications = async () => {
      const hasPermission = await requestNotificationPermission();
      if (hasPermission && plans.length > 0) {
        plans.forEach((plan: any) => {
          let planData = plan.plan_data;
          let travelInfo: any = {};
          try {
            const text = planData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const match = text.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = match ? match[1] : text;
            travelInfo = JSON.parse(jsonStr);
          } catch (e) {
            travelInfo = {};
          }

          // 기존: 여행 시작일 알림 (앱 켜면 바로)
          const title = travelInfo.title || '-';
          const startDate = travelInfo.days?.[0]?.date || '';
          if (startDate) {
            const dateObj = new Date(startDate);
            const month = dateObj.getMonth() + 1;
            const day = dateObj.getDate();
            showNotification(
              '여행 알림',
              `${month}월 ${day}일에  '${title}'이 예정되어 있습니다.`
            );
          }

          // 각 일정별 1시간 전 알림
          travelInfo.days?.forEach((day: any) => {
            day.schedules?.forEach((schedule: any) => {
              if (!schedule.time || !schedule.name) return;
              const [hour, minute] = schedule.time.split(':').map(Number);
              const dateObj = new Date(day.date);
              dateObj.setHours(hour, minute, 0, 0);
              // 1시간 전
              const oneHourBefore = new Date(dateObj.getTime() - 60 * 60 * 1000);
              const msg = `${schedule.time} ${schedule.name} 일정이 1시간 뒤 시작됩니다!`;
              const now = new Date();
              const delay = oneHourBefore.getTime() - now.getTime();
              if (delay > 0) {
                setTimeout(() => {
                  showNotification('여행 알림', msg);
                }, delay);
              }
            });
          });
        });
      }
    };
    setupNotifications();
  }, [plans]);

  // 날씨 정보 가져오기
  const fetchWeatherData = async (lat: number, lon: number) => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const response = await fetch(
        'https://lngdadu778.execute-api.ap-northeast-2.amazonaws.com/Stage/api/weatherAPI',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ lat, lon }),
        }
      );

      if (!response.ok) {
        throw new Error('날씨 정보를 가져오는데 실패했습니다.');
      }

      const data = await response.json();
      setWeatherData(data);
    } catch (error) {
      setWeatherError('날씨 정보를 가져올 수 없습니다.');
      console.error('날씨 정보 조회 실패:', error);
    } finally {
      setWeatherLoading(false);
    }
  };

  // 첫 번째 일정의 위치 정보로 날씨 조회
  useEffect(() => {
    if (plans.length > 0) {
      const plan = plans[0];
      let travelInfo: any = {};
      try {
        const text = plan.plan_data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const match = text.match(/```json\s*([\s\S]*?)\s*```/);
        const jsonStr = match ? match[1] : text;
        travelInfo = JSON.parse(jsonStr);
      } catch (e) {
        travelInfo = {};
      }

      if (travelInfo.days?.[0]?.schedules?.[0]?.lat && travelInfo.days?.[0]?.schedules?.[0]?.lng) {
        fetchWeatherData(
          travelInfo.days[0].schedules[0].lat,
          travelInfo.days[0].schedules[0].lng
        );
      }
    }
  }, [plans]);

  // 날씨 정보를 텍스트로 변환
  const getWeatherText = () => {
    if (weatherLoading) return '날씨 정보 로딩 중...';
    if (weatherError) return '날씨 정보를 가져올 수 없습니다.';
    if (!weatherData || !weatherData.forecasts.length) return '날씨 정보 없음';

    const currentWeather = weatherData.forecasts[0];
    return `${weatherData.city.name} 현재 날씨: ${currentWeather.main.temp}°C, ${currentWeather.weather[0].description}`;
  };

  // 날짜별 날씨 예보 가져오기
  const getWeatherForDate = (date: string) => {
    if (!weatherData || !weatherData.forecasts.length) return null;

    const targetDate = new Date(date);
    const targetDateStr = targetDate.toISOString().split('T')[0];

    const forecast = weatherData.forecasts.find(f => {
      const forecastDate = new Date(f.dt * 1000);
      return forecastDate.toISOString().split('T')[0] === targetDateStr;
    });

    return forecast;
  };

  // 날씨 아이콘 선택 (한글+영문 description 모두 대응)
  const getWeatherIcon = (weatherMain: string, description: string) => {
    const desc = description.toLowerCase();
    // 맑음
    if (weatherMain.toLowerCase() === 'clear') return '☀️';
    // 구름
    if (weatherMain.toLowerCase() === 'clouds') {
      if (desc.includes('few clouds') || desc.includes('구름 조금')) return '🌤️';
      if (desc.includes('scattered clouds')) return '⛅';
      if (desc.includes('broken clouds') || desc.includes('overcast clouds') || desc.includes('흐림')) return '☁️';
      return '⛅';
    }
    // 비
    if (weatherMain.toLowerCase() === 'rain') {
      if (desc.includes('light rain') || desc.includes('실 비')) return '🌦️';
      if (desc.includes('moderate rain') || desc.includes('보통 비')) return '🌧️';
      if (desc.includes('heavy rain') || desc.includes('강한 비')) return '⛈️';
      if (desc.includes('shower rain') || desc.includes('소나기')) return '🌧️';
      return '🌧️';
    }
    // 눈
    if (weatherMain.toLowerCase() === 'snow') {
      if (desc.includes('light snow') || desc.includes('가벼운 눈')) return '🌨️';
      if (desc.includes('heavy snow') || desc.includes('강한 눈')) return '❄️';
      if (desc.includes('sleet') || desc.includes('진눈깨비')) return '🌨️';
      return '❄️';
    }
    // 천둥번개
    if (weatherMain.toLowerCase() === 'thunderstorm') return '⛈️';
    // 이슬비
    if (weatherMain.toLowerCase() === 'drizzle') return '🌦️';
    // 안개/연무
    if (weatherMain.toLowerCase() === 'mist' || weatherMain.toLowerCase() === 'fog') return '🌫️';
    return '🌤️';
  };

  // 일정 공유하기
  const sharePlan = async (plan: any) => {
    try {
      let travelInfo: any = {};
      try {
        const text = plan.plan_data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const match = text.match(/```json\s*([\s\S]*?)\s*```/);
        const jsonStr = match ? match[1] : text;
        travelInfo = JSON.parse(jsonStr);
      } catch (e) {
        travelInfo = {};
      }

      const title = travelInfo.title || '-';
      const destination = travelInfo.destination || '';
      const startDate = travelInfo.days?.[0]?.date || '';
      const endDate = travelInfo.days?.[travelInfo.days?.length - 1]?.date || '';
      
      let shareText = `✈️ 여행 일정 공유\n\n`;
      shareText += `제목: ${title}\n`;
      if (destination) shareText += `여행지: ${destination}\n`;
      if (startDate && endDate) shareText += `기간: ${startDate} ~ ${endDate}\n\n`;

      // 날씨 정보 추가
      if (weatherData) {
        shareText += `※ 날씨 정보는 오늘로부터 5일 뒤까지의 예보만 제공됩니다.\n`;
        shareText += `🌤️ 현재 날씨 정보\n`;
        shareText += `${weatherData.city.name} 현재 날씨: ${weatherData.forecasts[0].main.temp}°C\n`;
        shareText += `${weatherData.forecasts[0].weather[0].description}\n\n`;
      }

      // 항공 정보
      if (plan.flight_info) {
        shareText += `✈️ 항공 정보\n`;
        const flight = plan.flight_info;
        if (flight.itineraries?.[0]) {
          shareText += `출국: ${flight.itineraries[0].segments[0]?.departure?.iataCode} → ${flight.itineraries[0].segments[0]?.arrival?.iataCode}\n`;
          shareText += `날짜: ${flight.itineraries[0].segments[0]?.departure?.at?.slice(0, 10)}\n`;
          shareText += `항공사: ${flight.itineraries[0].segments[0]?.carrierCode} ${flight.itineraries[0].segments[0]?.number}\n\n`;
        }
        if (flight.itineraries?.[1]) {
          shareText += `귀국: ${flight.itineraries[1].segments[0]?.departure?.iataCode} → ${flight.itineraries[1].segments[0]?.arrival?.iataCode}\n`;
          shareText += `날짜: ${flight.itineraries[1].segments[0]?.departure?.at?.slice(0, 10)}\n`;
          shareText += `항공사: ${flight.itineraries[1].segments[0]?.carrierCode} ${flight.itineraries[1].segments[0]?.number}\n\n`;
        }
      }

      // 호텔 정보
      if (plan.accmo_info?.hotel) {
        const hotel = plan.accmo_info.hotel;
        shareText += `🏨 호텔 정보\n`;
        shareText += `호텔명: ${hotel.hotel_name}\n`;
        shareText += `주소: ${hotel.address}\n`;
        if (hotel.checkin) shareText += `체크인: ${hotel.checkin}\n`;
        if (hotel.checkout) shareText += `체크아웃: ${hotel.checkout}\n\n`;
      }

      // 일정 정보
      if (travelInfo.days) {
        shareText += `📅 상세 일정\n`;
        travelInfo.days.forEach((day: any) => {
          shareText += `\n[${day.date}] ${day.title}\n`;
          if (day.schedules) {
            day.schedules.forEach((schedule: any) => {
              shareText += `- ${schedule.time || ''} ${schedule.name || ''}\n`;
              if (schedule.notes) shareText += `  ${schedule.notes}\n`;
            });
          }
        });
      }

      await Share.share({
        message: shareText,
        title: title
      });
    } catch (error) {
      Alert.alert('공유 실패', '일정을 공유하는데 실패했습니다.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>일정 관리</Text>
        <View style={styles.placeholderView} />
      </View>

      <ScrollView style={styles.content}>
        {plans.length === 0 ? (
          <Text style={{ textAlign: 'center', color: '#999', marginTop: 40 }}>저장된 여행 일정이 없습니다.</Text>
        ) : (
          plans.map((plan: any) => {
            // plan_data가 Gemini 응답 객체로 온다고 가정
            let planData = plan.plan_data;

            // Gemini 응답에서 여행 정보 추출
            let travelInfo: any = {};
            try {
              // 1. text 추출
              const text = planData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
              // 2. 코드블록에서 JSON만 추출
              const match = text.match(/```json\s*([\s\S]*?)\s*```/);
              const jsonStr = match ? match[1] : text;
              // 3. JSON 파싱
              travelInfo = JSON.parse(jsonStr);
            } catch (e) {
              travelInfo = {};
            }

            const title = travelInfo.title || '-';
            const destination = travelInfo.destination || '-'; // destination 필드가 없을 수 있음
            // days 배열에서 시작일, 종료일 추출
            const startDate = travelInfo.days?.[0]?.date || '';
            const endDate = travelInfo.days?.[travelInfo.days?.length - 1]?.date || '';
            const status = getStatus(startDate, endDate);
            // 다양한 위치에서 항공편 정보 탐색
            let flightSummary = null;
            if (flight && flight.itineraries) {
              flightSummary = (
                <View style={{ backgroundColor: '#f0f8ff', borderRadius: 8, padding: 15, marginBottom: 10 }}>
                  {/* 출국편 */}
                  <View style={styles.flightSection}>
                    <Text style={styles.flightTitle}>✈️ 출국편</Text>
                    <View style={styles.flightInfo}>
                      <View style={styles.flightRoute}>
                        <Text style={styles.flightCode}>{flight.itineraries[0]?.segments[0]?.departure?.iataCode}</Text>
                        <Text style={styles.flightArrow}>→</Text>
                        <Text style={styles.flightCode}>{flight.itineraries[0]?.segments[0]?.arrival?.iataCode}</Text>
                      </View>
                      <View style={styles.flightTime}>
                        <Text style={styles.flightDateTime}>
                          {flight.itineraries[0]?.segments[0]?.departure?.at?.slice(0, 10)}
                          {" "}
                          {flight.itineraries[0]?.segments[0]?.departure?.at?.slice(11, 16)}
                        </Text>
                        <Text style={styles.flightDuration}>
                          {flight.itineraries[0]?.duration?.slice(2).toLowerCase()}
                        </Text>
                      </View>
                      <Text style={styles.flightAirline}>
                        {flight.itineraries[0]?.segments[0]?.carrierCode} 
                        {flight.itineraries[0]?.segments[0]?.number}
                      </Text>
                    </View>
                  </View>

                  {/* 귀국편(왕복일 때) */}
                  {flight.itineraries[1] && (
                    <View style={[styles.flightSection, { marginTop: 12, borderTopWidth: 1, borderTopColor: '#e0e0e0', paddingTop: 12 }]}>
                      <Text style={styles.flightTitle}>✈️ 귀국편</Text>
                      <View style={styles.flightInfo}>
                        <View style={styles.flightRoute}>
                          <Text style={styles.flightCode}>{flight.itineraries[1]?.segments[0]?.departure?.iataCode}</Text>
                          <Text style={styles.flightArrow}>→</Text>
                          <Text style={styles.flightCode}>{flight.itineraries[1]?.segments[0]?.arrival?.iataCode}</Text>
                        </View>
                        <View style={styles.flightTime}>
                          <Text style={styles.flightDateTime}>
                            {flight.itineraries[1]?.segments[0]?.departure?.at?.slice(0, 10)}
                            {" "}
                            {flight.itineraries[1]?.segments[0]?.departure?.at?.slice(11, 16)}
                          </Text>
                          <Text style={styles.flightDuration}>
                            {flight.itineraries[1]?.duration?.slice(2).toLowerCase()}
                          </Text>
                        </View>
                        <Text style={styles.flightAirline}>
                          {flight.itineraries[1]?.segments[0]?.carrierCode} 
                          {flight.itineraries[1]?.segments[0]?.number}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* 총 요금 */}
                  {flight.price?.grandTotal && (
                    <View style={styles.priceSection}>
                      <Text style={styles.flightPriceLabel}>총 요금</Text>
                      <Text style={styles.flightPriceValue}>
                        {Number(flight.price.grandTotal).toLocaleString()}원
                      </Text>
                    </View>
                  )}
                </View>
              );
            }

            // 숙박 정보 표시
            let accmoSummary = null;
            if (accmo) {
              const hotel = accmo.hotel;
              accmoSummary = (
                <View style={styles.accmoCard}>
                  {hotel.main_photo_url && (
                    <Image
                      source={{ uri: hotel.main_photo_url }}
                      style={styles.accmoImage}
                      resizeMode="cover"
                    />
                  )}
                  <View style={styles.accmoInfo}>
                    <View style={styles.accmoHeader}>
                      <Text style={styles.accmoName}>{hotel.hotel_name}</Text>
                      {hotel.review_score && (
                        <View style={styles.reviewScore}>
                          <Text style={styles.reviewScoreText}>{hotel.review_score}</Text>
                          <Text style={styles.reviewScoreWord}>{hotel.review_score_word}</Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.accmoDetails}>
                      <Text style={styles.accmoAddress}>{hotel.address}</Text>
                      <Text style={styles.accmoCity}>{hotel.city}</Text>
                      
                      <View style={styles.checkInOutContainer}>
                        <View style={styles.checkInOut}>
                          <Text style={styles.checkInOutLabel}>체크인</Text>
                          <Text style={styles.checkInOutValue}>{hotel.checkin}</Text>
                          <Text style={styles.checkInOutTime}>{hotel.checkin_from}</Text>
                        </View>
                        <View style={styles.checkInOut}>
                          <Text style={styles.checkInOutLabel}>체크아웃</Text>
                          <Text style={styles.checkInOutValue}>{hotel.checkout}</Text>
                          <Text style={styles.checkInOutTime}>{hotel.checkout_until}</Text>
                        </View>
                      </View>

                      {hotel.price && (
                        <View style={styles.priceContainer}>
                          <Text style={styles.priceLabel}>객실 요금</Text>
                          <Text style={styles.priceValue}>{hotel.price}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            }

            return (
              <View key={plan.planId || plan.id} style={styles.scheduleCard}>
                {/* 항공편 정보 */}
                {flightSummary && (
                  <View style={styles.expandableSection}>
                    <TouchableOpacity 
                      style={styles.expandableHeader}
                      onPress={() => setExpandedFlight(prev => ({
                        ...prev,
                        [plan.planId]: !prev[plan.planId]
                      }))}
                    >
                      <Text style={styles.expandableTitle}>✈️ 항공편 정보</Text>
                      <Text style={styles.expandableIcon}>
                        {expandedFlight[plan.planId] ? '▼' : '▶'}
                      </Text>
                    </TouchableOpacity>
                    {expandedFlight[plan.planId] && flightSummary}
                  </View>
                )}

                {/* 호텔 정보 */}
                {accmoSummary && (
                  <View style={styles.expandableSection}>
                    <TouchableOpacity 
                      style={styles.expandableHeader}
                      onPress={() => setExpandedHotel(prev => ({
                        ...prev,
                        [plan.planId]: !prev[plan.planId]
                      }))}
                    >
                      <Text style={styles.expandableTitle}>🏨 호텔 정보</Text>
                      <Text style={styles.expandableIcon}>
                        {expandedHotel[plan.planId] ? '▼' : '▶'}
                      </Text>
                    </TouchableOpacity>
                    {expandedHotel[plan.planId] && accmoSummary}
                  </View>
                )}
                <View style={styles.scheduleInfo}>
                  <Text style={styles.destination}>{title}</Text>
                  {/* 목적지(destination) 필드가 없을 수 있으니 조건부 렌더링 */}
                  {destination !== '-' && <Text style={styles.date}>{destination}</Text>}
                  <Text style={styles.date}>{startDate} ~ {endDate}</Text>
                  
                  {/* 현재 날씨 정보 표시 */}
                  <View style={styles.weatherContainer}>
                    <Text style={{ color: '#888', fontSize: 12, textAlign: 'center', marginBottom: 2 }}>※ 날씨 정보는 오늘로부터 5일 뒤까지의 예보만 제공됩니다.</Text>
                    {weatherData && weatherData.forecasts.length > 0 && (
                      <Text style={styles.weatherText}>
                        {getWeatherIcon(
                          weatherData.forecasts[0].weather[0].main,
                          weatherData.forecasts[0].weather[0].description
                        )} {getWeatherText()}
                      </Text>
                    )}
                    {(!weatherData || weatherData.forecasts.length === 0) && (
                      <Text style={styles.weatherText}>{getWeatherText()}</Text>
                    )}
                  </View>

                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(status) + '20' }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: getStatusColor(status) }
                    ]}>{status}</Text>
                  </View>
                </View>
                {/* 날짜별 큰 블럭: days -> schedules */}
                {travelInfo.days?.map((day: any, idx: number) => {
                  const weather = getWeatherForDate(day.date);
                  return (
                    <View key={idx} style={styles.dayBlock}>
                      <View style={{ position: 'relative', backgroundColor: '#f0f6ff', borderRadius: 10, padding: 12, marginBottom: 4 }}>
                        <View style={{ paddingRight: 90 }}>
                          <Text style={styles.dayTitle}>{day.date}</Text>
                          <Text style={styles.daySubTitle}>{day.title}</Text>
                          {weather && (
                            <View style={styles.dayWeather}>
                              <Text style={styles.dayWeatherText}>
                                {getWeatherIcon(weather.weather[0].main, weather.weather[0].description)} {weather.main.temp}°C
                              </Text>
                              <Text style={styles.dayWeatherDesc}>{weather.weather[0].description}</Text>
                            </View>
                          )}
                        </View>
                        <TouchableOpacity
                          style={[styles.expandButton, { position: 'absolute', top: 12, right: 12 }]}
                          onPress={() => setExpandedDayIdxMap(prev => ({
                            ...prev,
                            [plan.planId]: prev[plan.planId] === idx ? null : idx
                          }))}
                        >
                          <Text style={styles.expandButtonText}>{expandedDayIdxMap[plan.planId] === idx ? '닫기' : '확대'}</Text>
                        </TouchableOpacity>
                      </View>
                      {/* 아코디언 상세 일정: schedules */}
                      {expandedDayIdxMap[plan.planId] === idx && (
                        <View style={{ marginTop: 10 }}>
                          {day.schedules?.map((schedule: any, aIdx: number) => (
                            <TouchableOpacity
                              key={aIdx}
                              style={styles.activityBlock}
                              onPress={() => openGoogleMaps(schedule.lat, schedule.lng, schedule.address, schedule.name)}
                            >
                              <Text style={styles.activityText}>
                                {schedule.time} - {schedule.name}
                              </Text>
                              {schedule.notes && (
                                <Text style={styles.activityDesc}>{schedule.notes}</Text>
                              )}
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })}
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.shareButton]}
                    onPress={() => sharePlan(plan)}
                  >
                    <Text style={[styles.actionButtonText, styles.shareButtonText]}>공유하기</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => navigation.navigate('EditSchedule', { plan })}
                  >
                    <Text style={[styles.actionButtonText, styles.editButtonText]}>수정하여 일정에 저장</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fa',
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
  content: {
    flex: 1,
    padding: 18,
  },
  scheduleCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 22,
    marginBottom: 28,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  scheduleInfo: {
    gap: 5,
  },
  destination: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
    gap: 10,
  },
  actionButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  editButton: {
    borderColor: '#1E88E5',
    backgroundColor: '#fff',
    marginRight: 10,
  },
  editButtonText: {
    color: '#1E88E5',
    fontWeight: 'bold',
  },
  dayBlock: {
    marginTop: 18,
    marginBottom: 10,
    backgroundColor: '#eaf3fb',
    borderRadius: 12,
    padding: 0,
  },
  dayTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1E88E5',
  },
  daySubTitle: {
    fontSize: 14,
    color: '#333',
    marginTop: 2,
  },
  activityBlock: {
    borderWidth: 2,
    borderColor: '#1E88E5',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#f8faff',
  },
  activityText: {
    fontSize: 16,
    color: '#1E88E5',
    fontWeight: 'bold',
  },
  activityDesc: {
    fontSize: 13,
    color: '#333',
    marginTop: 4,
  },
  expandButton: {
    borderWidth: 2,
    borderColor: '#1E88E5',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 6,
    marginLeft: 10,
    backgroundColor: '#fff',
  },
  expandButtonText: {
    color: '#1E88E5',
    fontWeight: 'bold',
    fontSize: 16,
  },
  accmoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  accmoImage: {
    width: '100%',
    height: 200,
  },
  accmoInfo: {
    padding: 16,
  },
  accmoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  accmoName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  reviewScore: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignItems: 'center',
  },
  reviewScoreText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviewScoreWord: {
    color: '#fff',
    fontSize: 12,
  },
  accmoDetails: {
    gap: 8,
  },
  accmoAddress: {
    fontSize: 14,
    color: '#666',
  },
  accmoCity: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  checkInOutContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
  },
  checkInOut: {
    flex: 1,
  },
  checkInOutLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  checkInOutValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  checkInOutTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  priceContainer: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E88E5',
  },
  flightSection: {
    marginBottom: 8,
  },
  flightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E88E5',
    marginBottom: 8,
  },
  flightInfo: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
  },
  flightRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  flightCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  flightArrow: {
    fontSize: 16,
    color: '#666',
    marginHorizontal: 10,
  },
  flightTime: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  flightDateTime: {
    fontSize: 14,
    color: '#666',
  },
  flightDuration: {
    fontSize: 13,
    color: '#1E88E5',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  flightAirline: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  flightPriceLabel: {
    fontSize: 14,
    color: '#666',
  },
  flightPriceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E88E5',
  },
  expandableSection: {
    marginBottom: 10,
  },
  expandableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  expandableTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E88E5',
  },
  expandableIcon: {
    fontSize: 16,
    color: '#1E88E5',
  },
  weatherContainer: {
    backgroundColor: '#e3f2fd',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  weatherText: {
    color: '#1E88E5',
    fontSize: 14,
    textAlign: 'center',
  },
  dayWeather: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayWeatherText: {
    fontSize: 14,
    color: '#1E88E5',
    fontWeight: '500',
  },
  dayWeatherDesc: {
    fontSize: 13,
    color: '#666',
  },
  shareButton: {
    borderColor: '#4CAF50',
    backgroundColor: '#fff',
    marginRight: 10,
  },
  shareButtonText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});

export default TravelScheduleScreen; 
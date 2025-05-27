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
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { RouteProp } from '@react-navigation/native';
import { Auth } from 'aws-amplify';
import { requestNotificationPermission, showNotification } from '../utils/notification';

// 상세 일정 화면
type DetailedScheduleScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DetailedSchedule'>;
  route: RouteProp<RootStackParamList, 'DetailedSchedule'>;
};

// API 응답 타입 수정
interface ApiPlanResponse {
  success: boolean;
  plan: any; 
  flightInfos?: any[];
  accommodationInfos?: any[];
  is_shared_with_me?: boolean;
  original_owner?: string;
  message?: string; // message 속성 추가
  // 기타 필요한 필드들...
}

// 타입 에러 수정을 위한 인터페이스 추가
interface TravelInfo {
  days?: any[];
  [key: string]: any;
}

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

// 삭제 후 부모 화면 새로고침을 위한 헬퍼
function tryRefreshParent(navigation: any) {
  // navigation.goBack() 전에 부모의 focus 이벤트에 새로고침 트리거
  if (navigation.canGoBack()) {
    const parent = navigation.getParent && navigation.getParent();
    if (parent && parent.emit) {
      parent.emit('refresh');
    }
  }
}

// title에서 5/31 등 날짜 추출 함수
const extractDateFromTitle = (title?: string, baseYear?: number) => {
  if (!title) return '';
  const match = title.match(/^([0-9]{1,2})\/([0-9]{1,2})/);
  if (match) {
    const month = match[1].padStart(2, '0');
    const day = match[2].padStart(2, '0');
    const year = baseYear || new Date().getFullYear();
    return `${year}-${month}-${day}`;
  }
  return '';
};

// title에서 날짜(5/31 등) 제거 후 나머지 제목만 반환
const getTitleWithoutDate = (title?: string) => {
  if (!title) return '';
  // 앞부분 날짜(5/31 등)와 공백, 콜론, 일차 등 제거
  return title.replace(/^([0-9]{1,2}\/[0-9]{1,2})[\s:·-]*|^[0-9]{1,2}일차[\s:·-]*/g, '').trim();
};

// daysArray에서 가장 앞의 연도 추출
const getBaseYear = (daysArray: any[]) => {
  for (const day of daysArray) {
    if (day.date && /^\d{4}-\d{2}-\d{2}$/.test(day.date)) {
      return Number(day.date.slice(0, 4));
    }
  }
  return new Date().getFullYear();
};

const DetailedScheduleScreen: React.FC<DetailedScheduleScreenProps> = ({ navigation, route }) => {
  const { planId } = route.params;
  const [loading, setLoading] = useState(true);
  const [detailedPlan, setDetailedPlan] = useState<ApiPlanResponse | null>(null);
  const [travelInfo, setTravelInfo] = useState<TravelInfo | null>(null); 
  const [flightSummaries, setFlightSummaries] = useState<React.ReactNode[]>([]); 
  const [accmoSummaries, setAccmoSummaries] = useState<React.ReactNode[]>([]); 
  const [daysArray, setDaysArray] = useState<any[]>([]); // 일정 데이터를 저장할 새로운 상태 추가

  const [expandedDayIdxMap, setExpandedDayIdxMap] = useState<{ [dayKey: string]: boolean }>({});
  const [expandedFlight, setExpandedFlight] = useState<{ [flightKey: string]: boolean }>({});
  const [expandedHotel, setExpandedHotel] = useState<{ [hotelKey: string]: boolean }>({});

  useEffect(() => {
    fetchDetailedPlan();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchDetailedPlan();
    });
    return unsubscribe;
  }, [planId]);

  const fetchDetailedPlan = async () => {
    setLoading(true);
    try {
      const session = await Auth.currentSession();
      const token = session.getIdToken().getJwtToken();

      const response = await fetch(
        'https://lngdadu778.execute-api.ap-northeast-2.amazonaws.com/Stage/api/travel/checkplan',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ plan_id: planId }),
        }
      );

      let data: ApiPlanResponse;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error('서버 응답을 파싱할 수 없습니다.');
      }

      if (response.ok && data.success && data.plan) {
        setDetailedPlan(data);
        console.log("Set detailedPlan with:", data);
        
        let parsedTravelInfo: TravelInfo = {};
        let parsedDays: any[] = [];

        try {
          if (data.plan.itinerary_schedules) {
            const parsedSchedules = JSON.parse(data.plan.itinerary_schedules);
            parsedDays = Object.values(parsedSchedules);
          }
          else if (data.plan.plan_data) {
            const planDataField = data.plan.plan_data;
            if (typeof planDataField === 'string') {
              const match = planDataField.match(/```json\s*([\s\S]*?)\s*```/);
              const jsonStr = match ? match[1] : planDataField;
              if (jsonStr) {
                parsedTravelInfo = JSON.parse(jsonStr);
                if (parsedTravelInfo.days) {
                  parsedDays = parsedTravelInfo.days;
                }
              }
            } else if (typeof planDataField === 'object' && planDataField !== null) {
              if (planDataField?.candidates?.[0]?.content?.parts?.[0]?.text) {
                const geminiText = planDataField.candidates[0].content.parts[0].text;
                const match = geminiText.match(/```json\s*([\s\S]*?)\s*```/);
                const jsonStr = match ? match[1] : geminiText;
                if (jsonStr) {
                  parsedTravelInfo = JSON.parse(jsonStr);
                  if (parsedTravelInfo.days) {
                    parsedDays = parsedTravelInfo.days;
                  }
                }
              } else {
                parsedTravelInfo = planDataField as TravelInfo;
                if (parsedTravelInfo.days) {
                  parsedDays = parsedTravelInfo.days;
                }
              }
            }
          }
          if (parsedDays.length === 0) {
            parsedDays = Object.values(parsedTravelInfo);
          }
        } catch (e) {
        }

        setTravelInfo(parsedTravelInfo);
        setDaysArray(parsedDays);

        if (data.flightInfos && data.flightInfos.length > 0) {
          const summaries = data.flightInfos.map((flight, index) => buildFlightSummary(flight, `flight-${index}`));
          setFlightSummaries(summaries);
        }

        if (data.accommodationInfos && data.accommodationInfos.length > 0) {
          const summaries = data.accommodationInfos.map((accmo, index) => buildAccmoSummary(accmo, `accmo-${index}`));
          setAccmoSummaries(summaries);
        }

      } else {
        throw new Error(data.message || '상세 일정을 불러오는데 실패했습니다.');
      }
    } catch (error: any) {
      Alert.alert('오류', error.message || '상세 일정을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (!travelInfo || !daysArray.length) return;

    const setupNotifications = async () => {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) return;

      const rawTitle = travelInfo.name || travelInfo.title || detailedPlan?.plan?.name || '';
      const tripName = rawTitle && rawTitle.trim() !== '' ? rawTitle : '제목 없음';
      const startDate = daysArray[0]?.date || '';
      if (startDate) {
        const dateObj = new Date(startDate);
        const month = dateObj.getMonth() + 1;
        const day = dateObj.getDate();
        showNotification(
          '여행 알림',
          `${month}월 ${day}일에 '${tripName}'이 예정되어 있습니다.`
        );
      }

      daysArray.forEach((day: any) => {
        day.schedules?.forEach((schedule: any) => {
          if (!schedule.time || !schedule.name) return;
          const [hour, minute] = schedule.time.split(':').map(Number);
          const dateObj = new Date(day.date);
          dateObj.setHours(hour, minute, 0, 0);
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
    };

    setupNotifications();
  }, [travelInfo, daysArray]);

  const getStatus = (start?: string, end?: string) => {
    if (!start || !end) return '';
    const today = new Date();
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (endDate < today) return '여행 완료';
    if (startDate > today) return '여행 예정';
    return '여행 중';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '여행 예정': return '#4CAF50';
      case '여행 완료': return '#9E9E9E';
      case '여행 중': return '#1E88E5';
      default: return '#757575';
    }
  };

  const buildFlightSummary = (flight: any, key: string) => {
    if (!flight || !flight.itineraries) return null;
    return (
      <View key={key} style={{ backgroundColor: '#f0f8ff', borderRadius: 8, padding: 15, marginBottom: 10 }}>
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
  };

  const buildAccmoSummary = (accmo: any, key: string) => {
    if (!accmo || !accmo.hotel) return null;
    const hotel = accmo.hotel;
    return (
      <View key={key} style={styles.accmoCard}>
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
                <Text style={styles.checkInOutValue}>{hotel.checkin || accmo.checkIn}</Text>
                <Text style={styles.checkInOutTime}>{hotel.checkin_from}</Text>
              </View>
              <View style={styles.checkInOut}>
                <Text style={styles.checkInOutLabel}>체크아웃</Text>
                <Text style={styles.checkInOutValue}>{hotel.checkout || accmo.checkOut}</Text>
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
  };

  // 호텔/항공 정보가 하나라도 있으면 결제 UI 노출 (null 체크 포함)
  const hasFlight = !!detailedPlan && (
    (Array.isArray(detailedPlan.flightInfos) && detailedPlan.flightInfos.length > 0) ||
    (detailedPlan.plan && Object.keys(detailedPlan.plan).some(key => key.startsWith('flight_info_')))
  );
  const hasHotel = !!detailedPlan && (
    (Array.isArray(detailedPlan.accommodationInfos) && detailedPlan.accommodationInfos.length > 0) ||
    (detailedPlan.plan && Object.keys(detailedPlan.plan).some(key => key.startsWith('accmo_info_')))
  );
  const hasPaymentTarget = hasFlight || hasHotel;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>일정 상세</Text>
          <View style={styles.placeholderView} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#1E88E5" />
        </View>
      </SafeAreaView>
    );
  }

  if (!detailedPlan || !travelInfo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>일정 상세</Text>
          <View style={styles.placeholderView} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#666', fontSize: 16 }}>일정 정보를 불러오지 못했습니다.</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  const title = travelInfo.title || detailedPlan.plan.name || '제목 없음';
  const destination = travelInfo.destination || '';
  const startDate = travelInfo.days?.[0]?.date || '';
  const endDate = travelInfo.days?.[travelInfo.days?.length - 1]?.date || '';
  const status = getStatus(startDate, endDate);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>일정 상세</Text>
        <View style={styles.placeholderView} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.scheduleCard}>
          {flightSummaries.map((summary, index) => (
            <View key={`flight-summary-${index}`} style={styles.expandableSection}>
              <TouchableOpacity 
                style={styles.expandableHeader}
                onPress={() => setExpandedFlight(prev => ({ ...prev, [`flight-${index}`]: !prev[`flight-${index}`] }))}
              >
                <Text style={styles.expandableTitle}>✈️ 항공편 정보 {index + 1}</Text>
                <Text style={styles.expandableIcon}>
                  {expandedFlight[`flight-${index}`] ? '▼' : '▶'}
                </Text>
              </TouchableOpacity>
              {expandedFlight[`flight-${index}`] && summary}
            </View>
          ))}

          {accmoSummaries.map((summary, index) => (
            <View key={`accmo-summary-${index}`} style={styles.expandableSection}>
              <TouchableOpacity 
                style={styles.expandableHeader}
                onPress={() => setExpandedHotel(prev => ({ ...prev, [`accmo-${index}`]: !prev[`accmo-${index}`] }))}
              >
                <Text style={styles.expandableTitle}>🏨 호텔 정보 {index + 1}</Text>
                <Text style={styles.expandableIcon}>
                  {expandedHotel[`accmo-${index}`] ? '▼' : '▶'}
                </Text>
              </TouchableOpacity>
              {expandedHotel[`accmo-${index}`] && summary}
            </View>
          ))}

          {/* 결제 완료 뱃지: 호텔/항공 정보가 하나라도 있고 paid_plan=1일 때만 노출 */}
          {hasPaymentTarget && detailedPlan && detailedPlan.plan?.paid_plan === 1 && (
            <View style={{
              backgroundColor: '#e3f2fd',
              borderRadius: 8,
              alignItems: 'center',
              paddingVertical: 10,
              marginBottom: 18,
              marginTop: 4,
            }}>
              <Text style={{ color: '#1E88E5', fontWeight: 'bold', fontSize: 16 }}>결제 완료</Text>
            </View>
          )}

          {/* 결제하기 버튼: 호텔/항공 정보가 하나라도 있고 미결제(paid_plan=0)일 때만 노출 */}
          {hasPaymentTarget && detailedPlan && detailedPlan.plan?.paid_plan === 0 && (
            <TouchableOpacity
              style={{
                backgroundColor: '#1E88E5',
                padding: 14,
                borderRadius: 8,
                alignItems: 'center',
                marginBottom: 18,
                marginTop: 4,
              }}
              onPress={() => navigation.navigate('TravelCart', { plan: detailedPlan.plan })}
            >
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>결제하기</Text>
            </TouchableOpacity>
          )}

          <View style={styles.scheduleInfo}>
            <Text style={styles.destination}>{title}</Text>
            {destination && <Text style={styles.date}>{destination}</Text>}
            {(startDate && endDate) && <Text style={styles.date}>{startDate} ~ {endDate}</Text>}
            {status && (
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(status) }]}>{status}</Text>
              </View>
            )}
            {detailedPlan.is_shared_with_me && (
              <Text style={styles.sharedInfoText}>공유받은 일정 (소유자: {detailedPlan.original_owner})</Text>
            )}
          </View>

          {daysArray.map((day, idx) => (
            <View key={idx} style={styles.dayBlock}>
              <View style={styles.dayHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dayTitle}>{
                    day.date || extractDateFromTitle(day.title, getBaseYear(daysArray)) || ''
                  }</Text>
                  <Text style={styles.daySubTitle}>{getTitleWithoutDate(day.title)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.expandButton}
                  onPress={() => setExpandedDayIdxMap(prev => ({
                    ...prev,
                    [idx]: prev[idx] === true ? false : true
                  }))}
                >
                  <Text style={styles.expandButtonText}>{expandedDayIdxMap[idx] ? '닫기' : '확대'}</Text>
                </TouchableOpacity>
              </View>
              {expandedDayIdxMap[idx] && (
                <View>
                  {day.schedules?.map((schedule: any, aIdx: number) => (
                    <TouchableOpacity
                      key={aIdx}
                      style={styles.activityBlock}
                      onPress={() => openGoogleMaps(schedule.lat, schedule.lng, schedule.address, schedule.name)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.activityText}>
                        {schedule.time} - {schedule.name}
                      </Text>
                      {schedule.notes && (
                        <Text style={styles.activityDesc}>{schedule.notes}</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                  {(!day.schedules || day.schedules.length === 0) && (
                    <Text style={styles.noScheduleText}>스케줄 없음</Text>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>

        {typeof detailedPlan.plan?.plan_data === 'string' && !travelInfo.days && daysArray.length === 0 && (
          <View style={styles.rawPlanDataContainer}>
            <Text style={styles.rawPlanDataTitle}>AI 추천 원문:</Text>
            <Text style={styles.rawPlanDataText}>{detailedPlan.plan.plan_data}</Text>
          </View>
        )}

        <View style={[styles.actionButtons, { marginTop: 16, marginBottom: 24 }]}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]}
            onPress={() => {
              navigation.navigate('PlanEdit', {
                plan: detailedPlan.plan
              });
            }}
          >
            <Text style={[styles.actionButtonText, styles.editButtonText]}>수정</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={async () => {
              Alert.alert(
                "삭제 확인",
                "정말로 이 여행 계획을 삭제하시겠습니까?",
                [
                  { text: "취소", style: "cancel" },
                  { text: "삭제", style: "destructive", onPress: async () => {
                      try {
                        const session = await Auth.currentSession();
                        const token = session.getIdToken().getJwtToken();
                        const response = await fetch(
                          'https://lngdadu778.execute-api.ap-northeast-2.amazonaws.com/Stage/api/travel/deleteplan',
                          {
                            method: 'DELETE',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ plan_id: detailedPlan.plan.plan_id })
                          }
                        );
                        const result = await response.json();
                        if (result.success) {
                          Alert.alert("삭제 완료", "여행 계획이 성공적으로 삭제되었습니다.", [
                            { text: "확인", onPress: () => {
                                tryRefreshParent(navigation);
                                navigation.goBack();
                              }
                            }
                          ]);
                        } else {
                          const err = result.message || "삭제에 실패했습니다.";
                          Alert.alert("삭제 실패", err);
                        }
                      } catch (e) {
                        const err = e as any;
                        Alert.alert("오류", err.message || "삭제 중 오류가 발생했습니다.");
                      }
                    }
                  }
                ]
              );
            }}
          >
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>삭제</Text>
          </TouchableOpacity>
        </View>
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
    marginBottom: 15,
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
  sharedInfoText: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 5,
    fontStyle: 'italic',
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
  deleteButton: {
    borderColor: '#FF5252',
  },
  deleteButtonText: {
    color: '#FF5252',
  },
  dayBlock: {
    backgroundColor: '#eaf3fb',
    borderRadius: 14,
    marginBottom: 18,
    padding: 0,
    borderWidth: 0,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eaf3fb',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#b3d4fc',
  },
  dayTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1E88E5',
  },
  daySubTitle: {
    fontSize: 13,
    color: '#333',
    marginTop: 2,
  },
  expandButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#1E88E5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginLeft: 16,
  },
  expandButtonText: {
    color: '#1E88E5',
    fontWeight: 'bold',
    fontSize: 15,
  },
  activityBlock: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1E88E5',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    marginHorizontal: 6,
    marginTop: 8,
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  activityText: {
    fontSize: 15,
    color: '#1E88E5',
    fontWeight: 'bold',
  },
  activityDesc: {
    fontSize: 13,
    color: '#333',
    marginTop: 4,
  },
  noScheduleText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 12,
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
  rawPlanDataContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  rawPlanDataTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 8,
  },
  rawPlanDataText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
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
});

export default DetailedScheduleScreen; 
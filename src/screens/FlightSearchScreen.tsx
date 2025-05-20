import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert, Switch, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFlight } from '../contexts/FlightContext';
import { Picker } from '@react-native-picker/picker';
import { Calendar } from 'react-native-calendars';
import Modal from 'react-native-modal';

const API_ENDPOINT = 'https://lngdadu778.execute-api.ap-northeast-2.amazonaws.com/Stage/api/amadeus/FlightOffersSearch';
const AUTOCOMPLETE_ENDPOINT = 'https://lngdadu778.execute-api.ap-northeast-2.amazonaws.com/Stage/api/amadeus/Airport_CitySearch';

const FlightSearchScreen = () => {
  const navigation = useNavigation();
  const { setSelectedFlight } = useFlight();

  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [adults, setAdults] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [travelClass, setTravelClass] = useState('ECONOMY');
  const [nonStop, setNonStop] = useState(false);

  // 자동완성 관련 상태
  const [originQuery, setOriginQuery] = useState('');
  const [originSuggestions, setOriginSuggestions] = useState<any[]>([]);
  const [originLoading, setOriginLoading] = useState(false);
  const [destinationQuery, setDestinationQuery] = useState('');
  const [destinationSuggestions, setDestinationSuggestions] = useState<any[]>([]);
  const [destinationLoading, setDestinationLoading] = useState(false);

  // 캘린더 관련 상태
  const [showCalendar, setShowCalendar] = useState<'departure' | 'return' | null>(null);
  const [calendarStartDate, setCalendarStartDate] = useState(departureDate);

  // 자동완성 API 호출 함수
  const fetchSuggestions = async (query: string, setSuggestions: any, setLoading: any) => {
    if (!query || query.length < 1) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const url = `${AUTOCOMPLETE_ENDPOINT}?subType=AIRPORT,CITY&keyword=${encodeURIComponent(query)}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.data) {
        setSuggestions(data.data);
      } else {
        setSuggestions([]);
      }
    } catch (e) {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // 출발지 자동완성 핸들러
  const handleOriginChange = (text: string) => {
    setOriginQuery(text);
    setOrigin(text); // 입력값도 IATA 코드 입력란에 반영
    fetchSuggestions(text, setOriginSuggestions, setOriginLoading);
  };
  // 도착지 자동완성 핸들러
  const handleDestinationChange = (text: string) => {
    setDestinationQuery(text);
    setDestination(text);
    fetchSuggestions(text, setDestinationSuggestions, setDestinationLoading);
  };

  const handleOriginSelect = (item: any) => {
    setOrigin(item.iataCode);
    setOriginQuery(`${item.iataCode} - ${item.name} (${item.address?.cityName || ''})`);
    setOriginSuggestions([]);
  };
  const handleDestinationSelect = (item: any) => {
    setDestination(item.iataCode);
    setDestinationQuery(`${item.iataCode} - ${item.name} (${item.address?.cityName || ''})`);
    setDestinationSuggestions([]);
  };

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    setResults([]);
    try {
      const body = {
        originLocationCode: origin,
        destinationLocationCode: destination,
        departureDate,
        returnDate: returnDate || undefined,
        adults: parseInt(adults, 10),
        currencyCode: 'KRW',
        max: 10,
        travelClass,
        nonStop,
      };
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error('API 호출 실패');
      const data = await response.json();
      if (data.data) {
        setResults(data.data);
      } else {
        setError('검색 결과가 없습니다.');
      }
    } catch (e: any) {
      setError(e.message || '오류 발생');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (flight: any) => {
    setSelectedFlight(flight);
    Alert.alert('항공권 선택됨', '선택한 항공권이 여행 일정에 반영됩니다.');
    navigation.goBack();
  };

  // 캘린더 날짜 선택 핸들러
  const handleCalendarSelect = (date: string) => {
    if (showCalendar === 'departure') {
      setDepartureDate(date);
      setShowCalendar(null);
    } else if (showCalendar === 'return') {
      setReturnDate(date);
      setShowCalendar(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>항공권 검색</Text>
      <View style={styles.searchContainer}>
        <View style={styles.formRow}>
          <View style={styles.searchColumn}>
            <Text style={styles.fieldLabel}>출발지</Text>
            <TextInput
              style={styles.input}
              value={originQuery || origin}
              onChangeText={handleOriginChange}
              placeholder="도시/공항명/IATA"
              placeholderTextColor="#666"
              autoCorrect={false}
              autoCapitalize="characters"
            />
            {originLoading ? (
              <ActivityIndicator size="small" color="#1E88E5" style={{ marginTop: 4 }} />
            ) : originSuggestions.length > 0 ? (
              <View style={styles.suggestionBox}>
                <FlatList
                  data={originSuggestions}
                  keyExtractor={item => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => handleOriginSelect(item)} style={styles.suggestionItem}>
                      <Text style={styles.suggestionText}>{item.iataCode} - {item.name}</Text>
                    </TouchableOpacity>
                  )}
                  keyboardShouldPersistTaps="handled"
                />
              </View>
            ) : null}
          </View>
          <View style={styles.searchColumn}>
            <Text style={styles.fieldLabel}>도착지</Text>
            <TextInput
              style={styles.input}
              value={destinationQuery || destination}
              onChangeText={handleDestinationChange}
              placeholder="도시/공항명/IATA"
              placeholderTextColor="#666"
              autoCorrect={false}
              autoCapitalize="characters"
            />
            {destinationLoading ? (
              <ActivityIndicator size="small" color="#1E88E5" style={{ marginTop: 4 }} />
            ) : destinationSuggestions.length > 0 ? (
              <View style={styles.suggestionBox}>
                <FlatList
                  data={destinationSuggestions}
                  keyExtractor={item => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => handleDestinationSelect(item)} style={styles.suggestionItem}>
                      <Text style={styles.suggestionText}>{item.iataCode} - {item.name}</Text>
                    </TouchableOpacity>
                  )}
                  keyboardShouldPersistTaps="handled"
                />
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.formRow}>
          <View style={styles.dateColumn}>
            <Text style={styles.fieldLabel}>출국일</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowCalendar('departure')}
              activeOpacity={0.8}
            >
              <Text style={styles.dateText}>
                {departureDate || '선택'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.dateColumn}>
            <Text style={styles.fieldLabel}>귀국일(선택사항)</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowCalendar('return')}
              activeOpacity={0.8}
            >
              <Text style={styles.dateText}>
                {returnDate || '선택'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.guestColumn}>
            <Text style={styles.fieldLabel}>인원</Text>
            <TextInput 
              style={styles.input} 
              value={adults} 
              onChangeText={setAdults} 
              placeholder="인원" 
              placeholderTextColor="#666" 
              keyboardType="numeric" 
            />
          </View>
        </View>

        <View style={styles.formRow}>
          <View style={styles.classColumn}>
            <Text style={styles.fieldLabel}>좌석 등급</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={travelClass}
                onValueChange={setTravelClass}
                style={styles.picker}
                itemStyle={styles.pickerItem}
                mode={Platform.OS === 'ios' ? 'dialog' : 'dropdown'}
              >
                <Picker.Item label="이코노미" value="ECONOMY" />
                <Picker.Item label="프리미엄 이코노미" value="PREMIUM_ECONOMY" />
                <Picker.Item label="비즈니스" value="BUSINESS" />
                <Picker.Item label="퍼스트" value="FIRST" />
              </Picker>
            </View>
          </View>
          <View style={styles.nonstopColumn}>
            <Text style={styles.fieldLabel}>직항만</Text>
            <Switch 
              value={nonStop} 
              onValueChange={setNonStop} 
              thumbColor={nonStop ? '#1E88E5' : '#ccc'} 
              trackColor={{ true: '#90caf9', false: '#ccc' }} 
            />
          </View>
        </View>

        <TouchableOpacity 
          style={styles.searchButton} 
          onPress={handleSearch} 
          disabled={loading}
        >
          <Text style={styles.searchButtonText}>
            {loading ? '검색 중...' : '항공권 검색'}
          </Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <FlatList
        data={results}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          // 출발/도착 시간 표시
          const dep = item.itineraries[0].segments[0].departure;
          const arr = item.itineraries[0].segments[item.itineraries[0].segments.length-1].arrival;
          return (
            <TouchableOpacity style={styles.resultItem} onPress={() => handleSelect(item)}>
              <Text style={styles.resultText}>
                {dep.iataCode} → {arr.iataCode}
              </Text>
              <Text style={styles.resultSubText}>
                출발: {dep.at.replace('T', ' ')} | 도착: {arr.at.replace('T', ' ')}
              </Text>
              <Text style={styles.resultSubText}>
                {item.price.total} {item.price.currency} | {item.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin || ''}
              </Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={loading ? null : <Text style={{ color: '#888', marginTop: 20 }}>검색 결과가 없습니다.</Text>}
        style={{ width: '100%', marginTop: 20, zIndex: 1 }}
      />
      {loading && <ActivityIndicator size="large" color="#1E88E5" style={{ marginTop: 20 }} />}
      {/* 캘린더 모달 */}
      <Modal
        isVisible={!!showCalendar}
        onBackdropPress={() => setShowCalendar(null)}
        style={{ justifyContent: 'flex-end', margin: 0 }}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { height: 'auto' }]}> 
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>날짜 선택</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowCalendar(null)}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            <Calendar
              onDayPress={day => handleCalendarSelect(day.dateString)}
              markedDates={showCalendar === 'departure' && departureDate ? { [departureDate]: { selected: true, selectedColor: '#1E88E5' } } :
                            showCalendar === 'return' && returnDate ? { [returnDate]: { selected: true, selectedColor: '#1E88E5' } } : {}}
              minDate={new Date().toISOString().split('T')[0]}
              theme={{
                todayTextColor: '#1E88E5',
                selectedDayBackgroundColor: '#1E88E5',
                selectedDayTextColor: '#fff',
                arrowColor: '#1E88E5',
              }}
            />
            <View style={styles.dateSelectionInfo}>
              <Text style={styles.dateSelectionText}>
                {showCalendar === 'departure' ? '출국일을 선택하세요' : '귀국일을 선택하세요'}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    padding: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E88E5',
    marginBottom: 12,
    textAlign: 'center',
  },
  formRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  searchColumn: {
    flex: 1,
  },
  dateColumn: {
    flex: 1,
  },
  guestColumn: {
    width: 80,
  },
  classColumn: {
    flex: 1,
  },
  nonstopColumn: {
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: {
    fontSize: 12,
    color: '#333',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    padding: 8,
    backgroundColor: '#fff',
    height: 36,
    fontSize: 14,
    color: '#000',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    backgroundColor: '#fff',
    height: 36,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#000',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    backgroundColor: '#fff',
    height: 36,
    justifyContent: 'center',
  },
  picker: {
    height: 36,
    color: '#000',
  },
  pickerItem: {
    fontSize: 14,
    color: '#000',
  },
  searchButton: {
    backgroundColor: '#1E88E5',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
  },
  resultItem: {
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
  },
  resultText: {
    color: '#1E88E5',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultSubText: {
    color: '#333',
    fontSize: 13,
    marginTop: 2,
  },
  suggestionBox: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#1E88E5',
    borderRadius: 6,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  suggestionItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionText: {
    fontSize: 13,
    color: '#333',
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
});

export default FlightSearchScreen; 
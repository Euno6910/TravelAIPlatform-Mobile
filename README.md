# Wind Road Mobile - AI 맞춤형 여행 일정 생성 앱

## 프로젝트 개요

Wind Road Mobile은 Wind Road 플랫폼의 모바일 버전으로, React Native를 기반으로 개발된 크로스 플랫폼 모바일 애플리케이션입니다. 사용자는 언제 어디서나 AI 기반의 맞춤형 여행 계획을 생성하고 관리할 수 있으며, 실시간으로 항공편과 숙소 정보를 확인할 수 있습니다.

## 주요 기능

* **AI 기반 맞춤형 여행 일정 생성**: Gemini AI를 활용한 개인화된 여행 계획 생성
* **실시간 항공편 및 숙소 정보**: Amadeus API와 Booking.com API를 통한 실시간 정보 제공
* **현실적인 동선 고려**: 실제 장소 및 이동 시간을 고려한 현실적인 여행 계획 수립
* **사용자 계정 연동 및 일정 저장**: 생성된 여행 일정 저장, 수정, 삭제 기능 
또한 사용자 계정에 안전하게 저장하고 언제든지 다시 확인 가능
* **지도 연동**: Google Maps를 통한 장소 검색 및 경로 안내
* **푸시 알림**: 여행 일정 관련 알림 서비스
* **사용자 인증**: AWS Cognito를 통한 안전한 사용자 인증
* **웹 플랫폼**: 웹 환경에서도 다양한 기능을 사용 
--> https://github.com/jinw00ch01/TravelAIPlatform

## 기술 스택

### 프론트엔드
* React Native
* TypeScript
* React Navigation
* AWS Amplify
* React Native Calendars
* @notifee/react-native (푸시 알림)
* 그 외 라이브러리: AsyncStorage, NetInfo, Picker, Gesture Handler 등

### 백엔드 연동
* AWS Lambda
* AWS API Gateway
* AWS DynamoDB
* AWS Cognito

### AI/ML 서비스
* Google Gemini API

### 데이터베이스
* AWS DynamoDB

### 외부 API
* Google Gemini API
* Amadeus Self-Service APIs
* Booking.com API
* Google Maps API

### 개발 도구 및 환경
* Visual Studio Code
* Android Studio
* AWS Management Console
* Windows
* Node.js (v18 이상)
* npm/yarn
* React Native CLI

## 프로젝트 구조

```
TravelAIPlatform-Mobile/
├── src/
│   ├── screens/            # 화면 컴포넌트
│   ├── navigation/         # 네비게이션 설정
│   ├── contexts/          # React Context 관련 파일
│   ├── utils/             # 유틸리티 함수
│   └── awsConfig.ts       # AWS 설정 파일
├── android/               # Android 네이티브 코드
├── ios/                   # iOS 네이티브 코드 (추후 개발)
├── package.json          # 프로젝트 의존성
└── README.md             # 프로젝트 문서
```

## 설치 및 실행 방법

### 사전 요구사항
* Node.js (v18 이상)
* npm 또는 yarn
* React Native CLI
* Android Studio (Android 개발용)
* AWS CLI 및 Amplify CLI

### 1. 프로젝트 클론
```bash
git clone https://github.com/Euno6910/TravelAIPlatform-Mobile.git
cd TravelAIPlatform-Mobile
```

### 2. 의존성 설치
```bash
npm install
# 또는
yarn install
```

-->

### 3. 환경 변수 설정
루트 디렉토리의 `src` 폴더 내 또는 프로젝트 설정에 따라 적절한 위치에 `.env` 파일을 생성하고 다음 내용을 입력합니다. (프론트엔드용)
```env
REACT_APP_API_URL=[배포된 백엔드 API Gateway Endpoint URL]
REACT_APP_COGNITO_REGION=[AWS Cognito Region, 예: ap-northeast-2]
REACT_APP_COGNITO_USER_POOL_ID=[Cognito User Pool ID]
REACT_APP_COGNITO_APP_CLIENT_ID=[Cognito App Client ID]
REACT_APP_MAPBOX_API_KEY=[Mapbox API Key]

# Google Gemini API 키 (프론트엔드에서 직접 호출 시. 백엔드 호출 권장)
# REACT_APP_GEMINI_API_KEY=[Gemini API Key] 
```

### 4. 앱 실행
```bash
# Android
npm run android
# 또는
yarn android

```

## 주요 화면 구성

1. **로그인/회원가입**: AWS Cognito를 통한 사용자 인증
2. **홈**: 여행 계획 생성 및 관리 메인 화면
3. **여행 계획 생성**: AI 기반 여행 계획 생성 프로세스
4. **일정 관리**: 저장된 여행 계획 목록 및 상세 정보
5. **마이페이지**: 사용자 프로필 및 설정

## 배포 방법

### 1. Android 앱 빌드 및 배포

#### 개발용 APK 빌드
```bash
# Android APK 빌드
cd android
./gradlew assembleDebug

# 빌드된 APK는 다음 경로에서 찾을 수 있습니다:
# android/app/build/outputs/apk/debug/app-debug.apk
```

#### 배포용 APK 빌드
1. `android/app/build.gradle` 파일에서 서명 설정이 필요합니다:
```gradle
android {
    signingConfigs {
        release {
            storeFile file("your-key.keystore")
            storePassword "your-store-password"
            keyAlias "your-key-alias"
            keyPassword "your-key-password"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

2. APK 빌드 실행:
```bash
cd android
./gradlew assembleRelease

# 빌드된 APK는 다음 경로에서 찾을 수 있습니다:
# android/app/build/outputs/apk/release/app-release.apk
```

#### Google Play Store 배포용 AAB 빌드
AAB(Android App Bundle)는 Google Play Store에서 사용하는 새로운 앱 배포 형식입니다. 사용자의 기기에 맞는 최적화된 버전만 다운로드되므로 앱 크기가 더 작아지고 설치가 빨라집니다.

```bash
cd android
./gradlew bundleRelease

# 빌드된 AAB는 다음 경로에서 찾을 수 있습니다:
# android/app/build/outputs/bundle/release/app-release.aab
```

> **참고**: 
> - 개발용 APK는 디버그 모드로 빌드되어 보안이 취약할 수 있습니다.
> - 배포용 APK/AAB는 반드시 서명 설정이 필요합니다.
> - Google Play Store 배포는 AAB 형식을 권장합니다.
> - AAB는 Google Play Store에서만 사용 가능하며, 직접 APK 배포 시에는 APK 형식을 사용해야 합니다.

### 2. 백엔드 배포 (AWS Management Console)

본 프로젝트의 백엔드 Lambda 함수 및 API Gateway는 AWS Management Console을 통해 직접 구성하고 배포합니다.

**Lambda 함수 배포:**
1.  AWS Lambda 콘솔에 접속합니다.
2.  새 함수를 생성하거나 기존 함수를 업데이트합니다.
3.  런타임 (예: Node.js 20.x, Python 3.x 등)을 선택합니다.
4.  함수 코드는 위 "백엔드 의존성 설치 및 패키징" 섹션에서 설명한 방법으로 준비된 ZIP 파일을 업로드하거나, 콘솔 내 편집기를 사용하여 작성/수정합니다.
5.  필요한 환경 변수, IAM 역할 (적절한 권한 포함), 메모리, 제한 시간 등을 설정합니다.

**API Gateway 설정:**
1.  Amazon API Gateway 콘솔에 접속합니다.
2.  REST API 또는 HTTP API를 생성하거나 기존 API를 선택합니다.
3.  리소스 (예: `/users`, `/travel-plans/{planId}`) 및 HTTP 메서드 (예: GET, POST, PUT, DELETE)를 정의합니다.
4.  각 메서드의 통합 요청 유형으로 "Lambda 함수"를 선택하고, 해당 기능을 수행하는 Lambda 함수를 지정합니다.
5.  필요에 따라 요청/응답 템플릿 매핑, 권한 부여 (예: Cognito 사용자 풀 권한 부여자 연동) 등을 설정합니다.
6.  API를 특정 스테이지(예: `dev`, `v1`, `prod`)로 배포하고, 생성된 호출 URL을 확인합니다. 이 URL이 프론트엔드의 `.env` 파일에 `REACT_APP_API_URL` 값으로 사용됩니다.

## API 엔드포인트

API Gateway를 통한한 엔드포인트입니다. 

*   `POST /api/AeroDataBox/GetAirportInfo` - 공항 명칭 가져오는 함수 (IATA 또는 ICAO 코드로 검색된 공항 정보, 이름, 위치, 행정 정보, 고도 등)
*   `POST /api/Booking-com/SearchHotelsByCoordinates` - Booking.com API의 SearchHotelsByCoordinates 기능과 Room List Of the Hotel을 호출하는 함수
*   `GET /api/amadeus/AirlineCodeLookup` - 항공사의 IATA 또는 ICAO 코드를 사용하여 해당 항공사의 정식 명칭(Business Name) 및 일반 명칭(Common Name)을 조회하는 함수
*   `GET /api/amadeus/Airport_CitySearch` - 사용자가 입력한 키워드(문자열)와 일치하는 공항 및/또는 도시 목록을 검색하는 함수
*   `POST /api/amadeus/FlightOffersPrice` - Flight Offers Search API를 통해 받은 특정 항공편 제안(Flight Offer)의 실시간 가격과 좌석 유효성을 확인하고 최종 확정하는 함수
*   `POST /api/amadeus/FlightOffersSearch` - 사용자가 지정한 조건(출발/도착지, 날짜, 승객 수, 선호 클래스 등)에 맞는 항공편 상품을 검색하는 함수
*   `POST /api/amadeus/Flight_Inspiration_Search` - 특정 도시에서 출발하는 가장 저렴한 항공권의 목적지를 찾아 사용자의 여행 계획 영감(Inspiration)을 돕는 함수. 어디로 가야 할지 정하지 못한 사용자에게 가격 기준으로 여행지를 추천하는 데 사용함.
*   `POST /api/amadeus/Flight_Most_Traveled_Destinations` - 특정 도시에서 출발한 여행객들이 실제로 가장 많이 방문한(이동한) 목적지를 파악하여 현지 여행 트렌드에 대한 통찰력을 제공하는 함수
*   `POST /api/amadeus/Tours_and_Activities ` - 전 세계 여러 장소의 액티비티, 관광 투어, 당일 여행, 박물관 티켓 등을 검색하고 예약(외부 링크 제공)할 수 있도록 지원하는 함수
*   `POST /api/travel/LoadPlanFunction_NEW`
*   `POST /api/travel/checklist`
*   `POST /api/travel/checkplan`
*   `POST /api/travel/modify_python`
*   `POST /api/travel/save`
*   `GET /api/user/mypage`
*   `PUT /api/user/profile`

## 기대 효과

1.  **효율적인 여행 계획**: 외부 API(항공, 숙박)와 Google Gemini AI의 결합으로, 사용자는 분산된 정보를 일일이 탐색할 필요 없이 한 곳에서 모든 여행 계획을 효율적으로 완성할 수 있습니다.
2.  **합리적인 여행 준비**: 실시간 항공권 및 호텔 정보를 반영한 AI 추천은 최적의 가격과 조건을 제시하여 합리적인 여행 준비를 가능하게 하며, 숨겨진 장소 발견의 기회도 제공합니다.
3.  **시간 및 노력 절약**: 복잡한 예약 과정과 일정 조율의 어려움을 AI가 자동 처리함으로써 사용자의 시간과 노력을 절약하고, 여행 자체에 더 집중할 수 있는 환경을 조성하여 여행 만족도를 크게 향상시킵니다.

## 개발자

### 모바일 플랫폼
* **이은호**: 모바일 어플리케이션 버전 개발, 백엔드 로직 구현 및 배포

### 웹 플랫폼
* **최진우**: 항공편 및 숙박 관련 기능 구현(백엔드 로직 구현 및 배포, UI 설계 및 구축, 외부 API 연동), DB 설계 및 구축, AI 모듈 개발
* **민동현**: 숙박 및 지도 관련 기능 구현(백엔드 로직 구현 및 배포, UI 설계 및 구축, 외부 API연동)
* **유관호**: 콘텐츠 및 항공편 관련 기능 구현(백엔드 로직 구현 및 배포, UI 설계 및 구축, 외부 API 연동)
* **황지환**: AI 모듈 개발, 서버 데이터 구조 설계, DB 설계 및 구축, 백엔드 로직 구현 및 배포

## 라이센스

ISC

## 연락처

* **팀명**: 바람길(Wind Road)
* **문의**: 2071394@hansung.ac.kr

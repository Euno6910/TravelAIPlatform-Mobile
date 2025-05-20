export type RootStackParamList = {
  Home: undefined;
  EditSchedule: {
    plan?: any;
    selectedHotel?: {
      hotel_id: string;
      hotel_name: string;
      address: string;
      review_score: number;
      price: number;
      checkin: string;
      checkout: string;
    };
  };
  HotelSearch: {
    currentHotel?: any;
    checkIn?: string;
    checkOut?: string;
  };
  // ... 다른 화면들의 파라미터 타입도 필요에 따라 추가
}; 
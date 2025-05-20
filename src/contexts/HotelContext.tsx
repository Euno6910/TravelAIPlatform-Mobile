import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface SelectedHotel {
  hotel_id: string;
  hotel_name: string;
  address: string;
  price: string;
  original_price?: string;
  review_score: number;
  main_photo_url: string;
  city: string;
  checkin: string;
  checkout: string;
  adults: number;
  children: number;
}

interface HotelContextType {
  selectedHotel: SelectedHotel | null;
  setSelectedHotel: (hotel: SelectedHotel | null) => void;
}

const HotelContext = createContext<HotelContextType>({
  selectedHotel: null,
  setSelectedHotel: () => {},
});

export const useHotel = () => useContext(HotelContext);

export const HotelProvider = ({ children }: { children: ReactNode }) => {
  const [selectedHotel, setSelectedHotel] = useState<SelectedHotel | null>(null);

  return (
    <HotelContext.Provider value={{ selectedHotel, setSelectedHotel }}>
      {children}
    </HotelContext.Provider>
  );
}; 
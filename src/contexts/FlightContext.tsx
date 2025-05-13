import React, { createContext, useState, useContext, ReactNode } from 'react';

interface FlightContextType {
  selectedFlight: any;
  setSelectedFlight: React.Dispatch<React.SetStateAction<any>>;
}

const FlightContext = createContext<FlightContextType | undefined>(undefined);

export const FlightProvider = ({ children }: { children: ReactNode }) => {
  const [selectedFlight, setSelectedFlight] = useState<any>(null);
  return (
    <FlightContext.Provider value={{ selectedFlight, setSelectedFlight }}>
      {children}
    </FlightContext.Provider>
  );
};

export const useFlight = () => {
  const context = useContext(FlightContext);
  if (!context) throw new Error('useFlight must be used within a FlightProvider');
  return context;
}; 
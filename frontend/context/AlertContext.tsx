// context/AlertContext.tsx
import React, { createContext, useContext, useState, ReactNode } from "react";

type Alert = {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  timestamp: string;
  read: boolean;
};

type AlertContextType = {
  alerts: Alert[];
  setAlerts: React.Dispatch<React.SetStateAction<Alert[]>>;
};

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  return (
    <AlertContext.Provider value={{ alerts, setAlerts }}>
      {children}
    </AlertContext.Provider>
  );
}

export function useAlerts() {
  const context = useContext(AlertContext);
  if (!context) throw new Error("useAlerts must be used inside AlertProvider");
  return context;
}

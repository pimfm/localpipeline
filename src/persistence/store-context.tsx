import React, { createContext, useContext, useMemo } from "react";
import { TimeStore } from "./time-store.js";

const StoreContext = createContext<TimeStore | null>(null);

interface StoreProviderProps {
  children: React.ReactNode;
  store?: TimeStore;
}

export function StoreProvider({ children, store: injectedStore }: StoreProviderProps) {
  const store = useMemo(() => injectedStore ?? new TimeStore(), [injectedStore]);
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useTimeStore(): TimeStore {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useTimeStore must be used within StoreProvider");
  return store;
}

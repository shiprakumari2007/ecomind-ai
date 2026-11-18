import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [config, setConfig] = useState({
    electricity_rate: 0.15,
    carbon_factor: 0.72,
    currency: 'USD',
    has_gemini_key: false,
    record_count: 0,
    date_range_start: null,
    date_range_end: null,
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [notification, setNotification] = useState(null);

  const refreshData = () => setRefreshKey((k) => k + 1);

  const fetchConfig = async () => {
    try {
      setLoadingConfig(true);
      const data = await api.getSettings();
      setConfig(data);
    } catch (err) {
      console.warn('Could not fetch app config from backend:', err);
    } finally {
      setLoadingConfig(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [refreshKey]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const formatCurrency = (val) => {
    const symbol = config.currency === 'EUR' ? '€' : config.currency === 'GBP' ? '£' : config.currency === 'INR' ? '₹' : '$';
    return `${symbol}${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <AppContext.Provider
      value={{
        config,
        refreshData,
        loadingConfig,
        notification,
        showNotification,
        formatCurrency,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);

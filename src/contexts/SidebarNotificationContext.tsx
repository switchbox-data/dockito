import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SidebarNotificationContextType {
  showNotification: (docketGovId: string) => void;
  animatingFavorite: string | null;
}

const SidebarNotificationContext = createContext<SidebarNotificationContextType | undefined>(undefined);

export const SidebarNotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [animatingFavorite, setAnimatingFavorite] = useState<string | null>(null);

  const showNotification = (docketGovId: string) => {
    setAnimatingFavorite(docketGovId);
    
    // Clear the animation after 2 seconds
    setTimeout(() => {
      setAnimatingFavorite(null);
    }, 2000);
  };

  return (
    <SidebarNotificationContext.Provider
      value={{
        showNotification,
        animatingFavorite,
      }}
    >
      {children}
    </SidebarNotificationContext.Provider>
  );
};

export const useSidebarNotification = () => {
  const context = useContext(SidebarNotificationContext);
  if (context === undefined) {
    console.error('useSidebarNotification called outside of SidebarNotificationProvider');
    return {
      showNotification: () => {},
      animatingFavorite: null,
    };
  }
  return context;
};
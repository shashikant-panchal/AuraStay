import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialMockData } from '../data/mockData';
import { mockRooms, mockReservations, mockFnbOrders, mockStaffUsers, mockOtaChannels } from '../data/suiteData';

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem('aurastay_suite_data');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not load from localStorage, using initial mock data', e);
    }
    return initialMockData;
  });

  // Current view: 'master-service-home' or 'revenue-dashboard' or other module views
  const [currentView, setCurrentView] = useState('master-service-home');
  const [subModuleTitle, setSubModuleTitle] = useState('');

  // Revenue Dashboard active tab
  const [activeTab, setActiveTab] = useState('overview');
  const [frontOfficeSubTab, setFrontOfficeSubTab] = useState('dashboard');

  // Rooms & Operations state
  const [rooms, setRooms] = useState(mockRooms);
  const [reservations, setReservations] = useState(mockReservations);
  const [fnbOrders, setFnbOrders] = useState(mockFnbOrders);
  const [staffUsers, setStaffUsers] = useState(mockStaffUsers);
  const [otaChannels, setOtaChannels] = useState(mockOtaChannels);

  // Modals state
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [isSetBudgetModalOpen, setIsSetBudgetModalOpen] = useState(false);
  const [isEvaluateGroupModalOpen, setIsEvaluateGroupModalOpen] = useState(false);
  const [isApplyOverrideModalOpen, setIsApplyOverrideModalOpen] = useState(false);
  const [isMonitoringModalOpen, setIsMonitoringModalOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateReservationModalOpen, setIsCreateReservationModalOpen] = useState(false);
  
  // Popover state for Master Service Home cards
  const [activePopoverModule, setActivePopoverModule] = useState(null);

  const [notificationMessage, setNotificationMessage] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Keyboard shortcut Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync data to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('aurastay_suite_data', JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [data]);

  const showNotification = (msg) => {
    setNotificationMessage(msg);
    setTimeout(() => setNotificationMessage(null), 4000);
  };

  const refreshData = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showNotification('AuraStay Suite updated with latest property synchronization.');
    }, 600);
  };

  const resetToDefaults = () => {
    setData(initialMockData);
    setRooms(mockRooms);
    setReservations(mockReservations);
    setFnbOrders(mockFnbOrders);
    setCurrentView('master-service-home');
    localStorage.removeItem('aurastay_suite_data');
    showNotification('Suite reset to official AuraStay demo state.');
  };

  const navigateTo = (view, subItem = '') => {
    setCurrentView(view);
    setSubModuleTitle(subItem);
    setActivePopoverModule(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Change room status (Housekeeping)
  const updateRoomStatus = (roomNumber, newStatus) => {
    setRooms(prev => prev.map(r => r.roomNumber === roomNumber ? { ...r, status: newStatus } : r));
    showNotification(`Room ${roomNumber} status set to ${newStatus}`);
  };

  // Add reservation
  const addReservation = (newRes) => {
    const resId = `BSE-B-${860 + reservations.length + 1}`;
    const reservation = {
      id: resId,
      ...newRes,
      status: 'CONFIRMED',
      payment: 'PENDING'
    };
    setReservations([reservation, ...reservations]);
    showNotification(`Reservation ${resId} created for ${newRes.guest}`);
    setIsCreateReservationModalOpen(false);
  };

  // Revenue actions
  const handleReviewAction = (actionId, status, note = '') => {
    setData(prev => {
      const updatedItems = prev.todayActions.items.map(item => {
        if (item.id === actionId) return { ...item, status, note };
        return item;
      });
      return {
        ...prev,
        todayActions: { ...prev.todayActions, items: updatedItems }
      };
    });
    showNotification(`Recommendation marked as ${status}.`);
    setIsEvidenceModalOpen(false);
  };

  const updateMonthlyBudget = (updatedMonthlyList, newTarget) => {
    setData(prev => {
      const currentNov = updatedMonthlyList.find(m => m.month === 'Nov')?.budget || newTarget;
      const achievement = Number(((prev.budgetForecast.mtdRevenue / currentNov) * 100).toFixed(2));
      return {
        ...prev,
        budgetForecast: {
          ...prev.budgetForecast,
          revenueTarget: currentNov,
          revenueAchievement: achievement,
          monthlyComparison: updatedMonthlyList
        }
      };
    });
    showNotification('Monthly accommodation budgets saved.');
    setIsSetBudgetModalOpen(false);
  };

  const addForecastOverride = (override) => {
    const newOverride = {
      id: 'ovr-' + Date.now(),
      createdAt: new Date().toISOString(),
      ...override
    };
    setData(prev => {
      const updatedForecast = prev.demandForecast.occupancyForecast.map(item => {
        if (item.date >= override.fromDate && item.date <= override.toDate) {
          return {
            ...item,
            forecast: Number(override.adjustedOccupancy),
            explanation: `Overridden (${override.reason}): ${override.adjustedOccupancy}%`
          };
        }
        return item;
      });
      return {
        ...prev,
        demandForecast: {
          ...prev.demandForecast,
          accuracy: {
            ...prev.demandForecast.accuracy,
            manualOverridesEvaluated: prev.demandForecast.accuracy.manualOverridesEvaluated + 1
          },
          manualOverrides: [newOverride, ...(prev.demandForecast.manualOverrides || [])],
          occupancyForecast: updatedForecast
        }
      };
    });
    showNotification(`Manual override applied: ${override.adjustedOccupancy}%`);
    setIsApplyOverrideModalOpen(false);
  };

  const saveOverbookingPolicy = (policy) => {
    setData(prev => ({
      ...prev,
      displacement: { ...prev.displacement, overbookingPolicy: { ...policy } }
    }));
    showNotification(`Overbooking policy saved: ${policy.enabled ? 'Enabled (' + policy.maxExtraRooms + ' max rooms)' : 'Disabled'}.`);
  };

  const saveGroupEvaluation = (evaluation) => {
    const newEval = {
      id: 'eval-' + Date.now(),
      timestamp: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      ...evaluation
    };
    setData(prev => ({
      ...prev,
      displacement: {
        ...prev.displacement,
        savedEvaluations: [newEval, ...prev.displacement.savedEvaluations]
      }
    }));
    showNotification(`Group Opportunity "${evaluation.groupName}" recorded.`);
    setIsEvaluateGroupModalOpen(false);
  };

  const toggleConfigRequirement = (catName, itemTitle) => {
    setData(prev => {
      const updatedCategories = prev.configuration.categories.map(cat => {
        if (cat.name === catName) {
          const updatedItems = cat.items.map(it => {
            if (it.title === itemTitle) {
              const nextStatus = it.status === 'Configured' ? 'Action needed' : 'Configured';
              return { ...it, status: nextStatus };
            }
            return it;
          });
          return { ...cat, items: updatedItems };
        }
        return cat;
      });

      let configuredCount = 0;
      let totalCount = 0;
      updatedCategories.forEach(c => {
        c.items.forEach(it => {
          totalCount++;
          if (it.status === 'Configured') configuredCount++;
        });
      });

      const score = Math.round((configuredCount / totalCount) * 100);
      return {
        ...prev,
        configuration: {
          ...prev.configuration,
          readinessScore: score,
          readinessRatio: `${configuredCount} of ${totalCount} requirements`,
          categories: updatedCategories
        }
      };
    });
    showNotification(`Updated requirement: ${itemTitle}`);
  };

  return (
    <DashboardContext.Provider value={{
      data,
      currentView,
      setCurrentView,
      subModuleTitle,
      setSubModuleTitle,
      navigateTo,
      activeTab,
      setActiveTab,
      rooms,
      reservations,
      fnbOrders,
      staffUsers,
      otaChannels,
      updateRoomStatus,
      addReservation,
      isGlossaryOpen,
      setIsGlossaryOpen,
      isConfigOpen,
      setIsConfigOpen,
      isEvidenceModalOpen,
      setIsEvidenceModalOpen,
      isSetBudgetModalOpen,
      setIsSetBudgetModalOpen,
      isEvaluateGroupModalOpen,
      setIsEvaluateGroupModalOpen,
      isApplyOverrideModalOpen,
      setIsApplyOverrideModalOpen,
      isMonitoringModalOpen,
      setIsMonitoringModalOpen,
      isTourOpen,
      setIsTourOpen,
      isSearchOpen,
      setIsSearchOpen,
      isCreateReservationModalOpen,
      setIsCreateReservationModalOpen,
      frontOfficeSubTab,
      setFrontOfficeSubTab,
      activePopoverModule,
      setActivePopoverModule,
      notificationMessage,
      showNotification,
      isRefreshing,
      refreshData,
      resetToDefaults,
      handleReviewAction,
      updateMonthlyBudget,
      addForecastOverride,
      saveOverbookingPolicy,
      saveGroupEvaluation,
      toggleConfigRequirement
    }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) throw new Error('useDashboard must be used within DashboardProvider');
  return context;
}

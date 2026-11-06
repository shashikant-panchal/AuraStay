import React from 'react';
import { useDashboard } from './context/DashboardContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import TabBar from './components/TabBar';
import MasterServiceHome from './components/MasterServiceHome';
import DashboardView from './components/views/DashboardView';
import OverviewTab from './components/tabs/OverviewTab';
import PickupPaceTab from './components/tabs/PickupPaceTab';
import SegmentationTab from './components/tabs/SegmentationTab';
import BudgetForecastTab from './components/tabs/BudgetForecastTab';
import DemandForecastTab from './components/tabs/DemandForecastTab';
import DisplacementTab from './components/tabs/DisplacementTab';
import FrontOfficeView from './components/views/FrontOfficeView';
import ReservationManagementView from './components/views/ReservationManagementView';
import FoodBeveragesView from './components/views/FoodBeveragesView';
import HousekeepingView from './components/views/HousekeepingView';
import ChannelManagerView from './components/views/ChannelManagerView';
import ReportsView from './components/views/ReportsView';
import AccountsFinanceView from './components/views/AccountsFinanceView';
import StaffAdminView from './components/views/StaffAdminView';
import RatePlansView from './components/views/RatePlansView';
import AriGridView from './components/views/AriGridView';
import GuestsView from './components/views/GuestsView';
import StockManagementView from './components/views/StockManagementView';
import ServicesView from './components/views/ServicesView';
import RevenueInsightsView from './components/views/RevenueInsightsView';
import AuditLogsView from './components/views/AuditLogsView';
import RestaurantPosView from './components/views/RestaurantPosView';
import ProductSetupView from './components/views/ProductSetupView';
import GlossaryModal from './components/modals/GlossaryModal';
import ConfigurationModal from './components/modals/ConfigurationModal';
import EvidenceModal from './components/modals/EvidenceModal';
import SetBudgetModal from './components/modals/SetBudgetModal';
import EvaluateGroupModal from './components/modals/EvaluateGroupModal';
import MonitoringModal from './components/modals/MonitoringModal';
import TourModal from './components/modals/TourModal';
import QuickSearchModal from './components/modals/QuickSearchModal';
import CreateReservationModal from './components/modals/CreateReservationModal';
import CreateRoomModal from './components/modals/CreateRoomModal';
import NotificationToast from './components/NotificationToast';
import ErrorBoundary from './components/ErrorBoundary';
import { LogOut } from 'lucide-react';

export default function App() {
  const { currentView, activeTab, showNotification } = useDashboard();

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'master-service-home':
        return <MasterServiceHome />;
      case 'revenue-dashboard':
        return (
          <div className="space-y-6">
            <TabBar />
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'pickup-pace' && <PickupPaceTab />}
            {activeTab === 'segmentation' && <SegmentationTab />}
            {activeTab === 'budget-forecast' && <BudgetForecastTab />}
            {activeTab === 'demand-forecast' && <DemandForecastTab />}
            {activeTab === 'displacement' && <DisplacementTab />}
          </div>
        );
      case 'front-office':
        return <FrontOfficeView />;
      case 'reservation-management':
        return <ReservationManagementView />;
      case 'food-beverages':
      case 'restaurant-pos':
        return <RestaurantPosView />;
      case 'product-setup':
        return <ProductSetupView />;
      case 'housekeeping':
        return <HousekeepingView />;
      case 'channel-manager':
        return <ChannelManagerView />;
      case 'revenue-insights':
        return <RevenueInsightsView />;
      case 'audit-logs':
        return <AuditLogsView />;
      case 'reports':
        return <ReportsView />;
      case 'rate-plans':
      case 'promotions':
        return <RatePlansView />;
      case 'ari-grid':
        return <AriGridView />;
      case 'guests':
      case 'guest-crm':
      case 'reputation-management':
        return <GuestsView />;
      case 'stock-management':
        return <StockManagementView />;
      case 'services':
        return <ServicesView />;
      case 'account-finance':
        return <AccountsFinanceView />;
      case 'staff-admin':
      case 'hr-payroll':
        return <StaffAdminView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#f3f6f9] flex text-slate-800 selection:bg-indigo-500 selection:text-white font-sans antialiased">
        {/* Left Dark Sidebar with Hover Expand & Pinned Mode */}
        <Sidebar />

        {/* Main Container Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header />

          <main className="flex-1 p-4 sm:p-6 max-w-[1600px] w-full mx-auto">
            <ErrorBoundary>
              {renderContent()}
            </ErrorBoundary>
          </main>

          {/* Bottom Dark Blue Footer Bar (Matching Screenshot) */}
          <footer className="bg-[#0b1a30] text-white px-6 py-2.5 flex items-center justify-between border-t border-slate-800 shrink-0 select-none">
            <button
              onClick={() => showNotification('Connected to AuraStay Local Node & Cloud Sync')}
              className="flex items-center space-x-2 px-3.5 py-1.5 bg-[#132644] hover:bg-[#1a335c] text-white text-xs font-semibold rounded-lg border border-slate-700/80 transition"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-300 rotate-180" />
              <span>Go AuraStay local</span>
            </button>

            <div className="flex items-center space-x-2 text-xs">
              <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[#0b1a30] font-black text-xs shadow-xs">
                a
              </div>
              <div className="text-right leading-none">
                <span className="text-slate-400 text-xs">Powered by </span>
                <span className="font-bold text-white text-xs">AuraStay</span>
              </div>
            </div>
          </footer>
        </div>

        {/* Modals & Dialogs */}
        <ErrorBoundary>
          <GlossaryModal />
          <ConfigurationModal />
          <EvidenceModal />
          <SetBudgetModal />
          <EvaluateGroupModal />
          <MonitoringModal />
          <TourModal />
          <QuickSearchModal />
          <CreateReservationModal />
          <CreateRoomModal />
          <NotificationToast />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
}

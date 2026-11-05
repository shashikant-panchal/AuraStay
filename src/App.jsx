import React from 'react';
import { useDashboard } from './context/DashboardContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import TabBar from './components/TabBar';
import MasterServiceHome from './components/MasterServiceHome';
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
import NightAuditView from './components/views/NightAuditView';
import GuestsView from './components/views/GuestsView';
import StockManagementView from './components/views/StockManagementView';
import ServicesView from './components/views/ServicesView';
import GlossaryModal from './components/modals/GlossaryModal';
import ConfigurationModal from './components/modals/ConfigurationModal';
import EvidenceModal from './components/modals/EvidenceModal';
import SetBudgetModal from './components/modals/SetBudgetModal';
import EvaluateGroupModal from './components/modals/EvaluateGroupModal';
import MonitoringModal from './components/modals/MonitoringModal';
import TourModal from './components/modals/TourModal';
import QuickSearchModal from './components/modals/QuickSearchModal';
import CreateReservationModal from './components/modals/CreateReservationModal';
import NotificationToast from './components/NotificationToast';

export default function App() {
  const { currentView, activeTab } = useDashboard();

  const renderContent = () => {
    switch (currentView) {
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
        return <FoodBeveragesView />;
      case 'housekeeping':
        return <HousekeepingView />;
      case 'channel-manager':
        return <ChannelManagerView />;
      case 'reports':
        return <ReportsView />;
      case 'rate-plans':
        return <RatePlansView />;
      case 'ari-grid':
        return <AriGridView />;
      case 'night-audit':
        return <NightAuditView />;
      case 'guests':
        return <GuestsView />;
      case 'stock-management':
        return <StockManagementView />;
      case 'services':
        return <ServicesView />;
      case 'account-finance':
        return <AccountsFinanceView />;
      case 'staff-admin':
        return <StaffAdminView />;
      default:
        return <MasterServiceHome />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f6f9] flex text-slate-800 selection:bg-indigo-500 selection:text-white font-sans antialiased">
      {/* Left Dark Sidebar with Hover Expand & Pinned Mode */}
      <Sidebar />

      {/* Main Container Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 p-4 sm:p-6 max-w-[1600px] w-full mx-auto">
          {renderContent()}
        </main>

        {/* Bottom Dark Blue Footer Bar */}
        <footer className="bg-[#121c33] text-white px-6 py-3 flex items-center justify-between border-t border-slate-800 shrink-0">
          <a
            href="https://aurastay.io"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-1.5 bg-[#1b2b48] hover:bg-[#223558] text-white text-xs font-semibold rounded-lg border border-slate-700/80 transition"
          >
            Go AuraStay local
          </a>

          <div className="flex items-center space-x-2 text-xs">
            <div className="w-7 h-7 rounded-full bg-linear-to-tr from-[#00b4db] via-[#6a11cb] to-[#9c27b0] flex items-center justify-center text-white font-extrabold text-sm shadow">
              b
            </div>
            <div className="text-right leading-none">
              <div className="text-[10px] text-slate-400">Powered by</div>
              <div className="font-bold text-white text-xs">Bookone Suite</div>
            </div>
          </div>
        </footer>
      </div>

      {/* Modals & Dialogs */}
      <GlossaryModal />
      <ConfigurationModal />
      <EvidenceModal />
      <SetBudgetModal />
      <EvaluateGroupModal />
      <MonitoringModal />
      <TourModal />
      <QuickSearchModal />
      <CreateReservationModal />
      <NotificationToast />
    </div>
  );
}

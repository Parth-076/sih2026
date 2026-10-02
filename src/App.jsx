import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import InspectionWorkspace from './components/InspectionWorkspace';
import NewInspection from './components/NewInspection';

export default function App() {
  // Only user uploaded inspections are presented
  const [inspections, setInspections] = useState(() => {
    try {
      const saved = localStorage.getItem('label_check_user_inspections');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currentInspectionId, setCurrentInspectionId] = useState(null);
  const [activeView, setActiveView] = useState('new'); // Opens New Inspection page 1st by default!

  const currentInspection = inspections.find(i => i.id === currentInspectionId) || (inspections.length > 0 ? inspections[0] : null);

  const handleSelectInspection = (id) => {
    setCurrentInspectionId(id);
    setActiveView('workspace');
  };

  const handleNewInspectionClick = () => {
    setActiveView('new');
  };

  const handleInspectionCreated = (newInspection) => {
    const updated = [newInspection, ...inspections];
    setInspections(updated);
    try {
      localStorage.setItem('label_check_user_inspections', JSON.stringify(updated));
    } catch (e) {
      console.warn("Could not persist to local storage:", e);
    }
    setCurrentInspectionId(newInspection.id);
    setActiveView('workspace');
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Left Sidebar */}
      <Sidebar
        inspections={inspections}
        currentInspectionId={currentInspectionId}
        onSelectInspection={handleSelectInspection}
        onNewInspectionClick={handleNewInspectionClick}
        activeView={activeView}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          currentInspectionId={activeView === 'workspace' && currentInspection ? currentInspection.id : null}
          onRefresh={handleRefresh}
        />

        <main className="flex-1 overflow-y-auto">
          {activeView === 'workspace' && currentInspection ? (
            <InspectionWorkspace
              inspection={currentInspection}
              onBackToNew={() => setActiveView('new')}
              onNewInspection={handleNewInspectionClick}
            />
          ) : (
            <NewInspection
              onInspectionCreated={handleInspectionCreated}
            />
          )}
        </main>
      </div>
    </div>
  );
}

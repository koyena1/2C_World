import React, { useState } from 'react';
import { Toast } from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';
import { BulkImportHub } from './BulkImportHub';
import { ImportTypeWorkspace } from './ImportTypeWorkspace';
import { 
  ALL_IMPORT_TYPES, 
  INITIAL_IMPORT_LOGS, 
  ExtendedImportLog,
  ImportTypeDefinition
} from '../../data/mockBulkImportData';
import { useTheme } from '../../hooks/useTheme';

export const BulkImportView: React.FC = () => {
  const { isDark } = useTheme();
  // Navigation state: null means on the Hub screen, string means selected import type ID
  const [selectedImportTypeId, setSelectedImportTypeId] = useState<string | null>(null);
  const [importLogs, setImportLogs] = useState<ExtendedImportLog[]>(INITIAL_IMPORT_LOGS);
  const { message: toastMessage, showToast } = useToast();

  const handleSelectImportType = (typeId: string) => {
    setSelectedImportTypeId(typeId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToHub = () => {
    setSelectedImportTypeId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddImportLog = (newLog: ExtendedImportLog) => {
    setImportLogs([newLog, ...importLogs]);
  };

  const currentImportType: ImportTypeDefinition | undefined = ALL_IMPORT_TYPES.find(
    t => t.id === selectedImportTypeId
  );

  return (
    <div className={`flex-1 flex flex-col transition-colors duration-150 ${
      isDark ? 'text-slate-100' : 'text-slate-900'
    }`}>
      {/* Toast Notification */}
      <Toast message={toastMessage} />

      {/* Screen Render: Hub vs Dedicated Workspace */}
      {!selectedImportTypeId || !currentImportType ? (
        <BulkImportHub
          onSelectImportType={handleSelectImportType}
          onShowToast={showToast}
        />
      ) : (
        <ImportTypeWorkspace
          importType={currentImportType}
          onBackToHub={handleBackToHub}
          onSwitchImportType={handleSelectImportType}
          onShowToast={showToast}
          importLogs={importLogs}
          onAddImportLog={handleAddImportLog}
        />
      )}
    </div>
  );
};

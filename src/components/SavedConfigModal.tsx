import React, { useState } from 'react';
import { SavedConfiguration } from '../types';

interface SavedConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedConfigs: SavedConfiguration[];
  onLoad: (config: SavedConfiguration) => void;
  onDelete: (configId: string) => void;
  onSave: (name: string) => void;
}

const SavedConfigModal: React.FC<SavedConfigModalProps> = ({
  isOpen,
  onClose,
  savedConfigs,
  onLoad,
  onDelete,
  onSave
}) => {
  const [configName, setConfigName] = useState('');
  const [activeTab, setActiveTab] = useState<'save' | 'load'>('save');

  if (!isOpen) return null;

  const handleSave = () => {
    if (configName.trim()) {
      onSave(configName.trim());
      setConfigName('');
      setActiveTab('load');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content saved-config-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Team Configurations</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-tabs">
          <button
            className={`tab-button ${activeTab === 'save' ? 'active' : ''}`}
            onClick={() => setActiveTab('save')}
          >
            Save Current
          </button>
          <button
            className={`tab-button ${activeTab === 'load' ? 'active' : ''}`}
            onClick={() => setActiveTab('load')}
          >
            Load Saved ({savedConfigs.length})
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'save' && (
            <div className="save-config-section">
              <h3>Save Current Configuration</h3>
              <p className="save-description">
                Save your current team arrangement to load it later
              </p>
              <div className="save-form">
                <input
                  type="text"
                  className="config-name-input"
                  placeholder="Enter a name for this configuration"
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSave()}
                  maxLength={50}
                />
                <button
                  className="btn btn-save"
                  onClick={handleSave}
                  disabled={!configName.trim()}
                >
                  Save Configuration
                </button>
              </div>
            </div>
          )}

          {activeTab === 'load' && (
            <div className="load-config-section">
              <h3>Saved Configurations</h3>
              {savedConfigs.length === 0 ? (
                <div className="no-configs">
                  <p>No saved configurations yet.</p>
                  <p>Save your current team arrangement to access it later.</p>
                </div>
              ) : (
                <div className="config-list">
                  {savedConfigs.map((config) => (
                    <div key={config.id} className="config-item">
                      <div className="config-info">
                        <div className="config-name">{config.name}</div>
                        <div className="config-date">{formatDate(config.date)}</div>
                        <div className="config-stats">
                          {config.teams.filter(t => t.players.length > 0).length} teams •
                          {config.teams.reduce((sum, t) => sum + t.players.length, 0)} assigned players
                        </div>
                      </div>
                      <div className="config-actions">
                        <button
                          className="btn btn-load"
                          onClick={() => {
                            onLoad(config);
                            onClose();
                          }}
                        >
                          Load
                        </button>
                        <button
                          className="btn btn-delete"
                          onClick={() => {
                            if (window.confirm(`Delete "${config.name}"?`)) {
                              onDelete(config.id);
                            }
                          }}
                          title="Delete configuration"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedConfigModal;
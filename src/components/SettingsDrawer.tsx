import { useState, useEffect } from 'react';
import { X, Settings, Globe, Key, Cpu, Thermometer, Hash, FileText, Palette, Wifi } from 'lucide-react';
import clsx from 'clsx';
import type { ChatSettings } from '../lib/types';
import { DEFAULT_SETTINGS, TEMPERATURE_MARKS, MAX_TOKENS_OPTIONS } from '../lib/constants';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ChatSettings;
  onUpdateSettings: (settings: ChatSettings) => void;
}

export function SettingsDrawer({ isOpen, onClose, settings, onUpdateSettings }: SettingsDrawerProps) {
  const [localSettings, setLocalSettings] = useState<ChatSettings>(settings);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
    setHasChanges(false);
  }, [settings, isOpen]);

  const handleChange = (key: keyof ChatSettings, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    setHasChanges(true);
  };

  const handleSave = () => {
    onUpdateSettings(localSettings);
    setHasChanges(false);
    onClose();
  };

  const handleReset = () => {
    setLocalSettings(DEFAULT_SETTINGS);
    setHasChanges(true);
  };

  const handleCancel = () => {
    setLocalSettings(settings);
    setHasChanges(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-900 z-50 shadow-xl transform transition-transform">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Configuración
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* API Configuration */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                <Globe className="h-4 w-4" />
                <span>Configuración de API</span>
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  URL Base de API
                </label>
                <input
                  type="url"
                  value={localSettings.apiBaseUrl}
                  onChange={(e) => handleChange('apiBaseUrl', e.target.value)}
                  placeholder="http://localhost:1234/v1"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                  <Key className="h-4 w-4" />
                  <span>API Key (opcional)</span>
                </label>
                <input
                  type="password"
                  value={localSettings.apiKey}
                  onChange={(e) => handleChange('apiKey', e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                  <Cpu className="h-4 w-4" />
                  <span>Modelo</span>
                </label>
                <input
                  type="text"
                  value={localSettings.model}
                  onChange={(e) => handleChange('model', e.target.value)}
                  placeholder="lmstudio-community/Meta-Llama-3-8B-Instruct"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                />
              </div>

              <div className="flex items-center space-x-3">
                <Wifi className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.useProxy}
                    onChange={(e) => handleChange('useProxy', e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500/20"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Usar proxy Firebase (para CORS)
                  </span>
                </label>
              </div>
            </div>

            {/* Model Parameters */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                <Thermometer className="h-4 w-4" />
                <span>Parámetros del Modelo</span>
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Temperatura: {localSettings.temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={localSettings.temperature}
                  onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {TEMPERATURE_MARKS.map(mark => (
                    <span key={mark.value}>{mark.label}</span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                  <Hash className="h-4 w-4" />
                  <span>Máximo de Tokens</span>
                </label>
                <select
                  value={localSettings.maxTokens}
                  onChange={(e) => handleChange('maxTokens', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                >
                  {MAX_TOKENS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Prompt del Sistema</span>
                </label>
                <textarea
                  value={localSettings.systemPrompt}
                  onChange={(e) => handleChange('systemPrompt', e.target.value)}
                  placeholder="Descripción del comportamiento del asistente..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors resize-none"
                />
              </div>
            </div>

            {/* Theme */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                <Palette className="h-4 w-4" />
                <span>Apariencia</span>
              </h3>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="theme"
                    value="light"
                    checked={localSettings.theme === 'light'}
                    onChange={(e) => handleChange('theme', e.target.value)}
                    className="text-primary-600 focus:ring-primary-500/20"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Claro</span>
                </label>
                
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="theme"
                    value="dark"
                    checked={localSettings.theme === 'dark'}
                    onChange={(e) => handleChange('theme', e.target.value)}
                    className="text-primary-600 focus:ring-primary-500/20"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Oscuro</span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-6 space-y-3">
            <div className="flex space-x-3">
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className={clsx(
                  "flex-1 py-2 px-4 rounded-lg font-medium transition-colors",
                  hasChanges
                    ? "bg-primary-600 hover:bg-primary-700 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                )}
              >
                Guardar cambios
              </button>
              
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-2 px-4 text-sm text-warning-600 dark:text-warning-400 hover:bg-warning-50 dark:hover:bg-warning-900/10 rounded-lg transition-colors"
            >
              Restaurar valores por defecto
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
import React from 'react';
import { GeneratorConfig } from '../utils/csharpGenerator';
import { Settings, Database, Cpu, Key } from 'lucide-react';

interface Props {
  config: GeneratorConfig;
  onChange: (key: keyof GeneratorConfig, value: any) => void;
}

export const ConfigForm: React.FC<Props> = ({ config, onChange }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 text-xl font-semibold text-blue-400">
        <Settings className="w-6 h-6" />
        <h2>Configuration</h2>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Qdrant Config */}
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-center space-x-2 mb-4 text-white">
            <Database className="w-5 h-5 text-green-400" />
            <h3 className="font-medium">Qdrant Settings</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Qdrant URL</label>
              <input
                type="text"
                value={config.qdrantUrl}
                onChange={(e) => onChange('qdrantUrl', e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                placeholder="http://localhost:6333"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Collection Name</label>
              <input
                type="text"
                value={config.collectionName}
                onChange={(e) => onChange('collectionName', e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Distance Metric</label>
              <select
                value={config.distanceMetric}
                onChange={(e) => onChange('distanceMetric', e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Cosine">Cosine</option>
                <option value="Euclid">Euclidean</option>
                <option value="Dot">Dot Product</option>
              </select>
            </div>
          </div>
        </div>

        {/* Gemini Config */}
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-center space-x-2 mb-4 text-white">
            <Cpu className="w-5 h-5 text-purple-400" />
            <h3 className="font-medium">Embedding Settings</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Gemini API Key (for Unity)</label>
              <div className="relative">
                <input
                  type="password"
                  value={config.geminiApiKey}
                  onChange={(e) => onChange('geminiApiKey', e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 pl-9"
                  placeholder="AIza..."
                />
                <Key className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
              </div>
              <p className="text-xs text-gray-500 mt-1">This key will be embedded in the generated Unity script so it works immediately.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Gemini Model</label>
              <select
                value={config.embeddingModel}
                onChange={(e) => onChange('embeddingModel', e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="text-embedding-004">text-embedding-004 (Recommended)</option>
                <option value="embedding-001">embedding-001 (Legacy)</option>
              </select>
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-400 mb-1">Processing Chunk Size (Chars)</label>
               <input
                type="number"
                value={config.chunkSize}
                onChange={(e) => onChange('chunkSize', parseInt(e.target.value))}
                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { analyzeSchema } from '../services/geminiService';
import { Sparkles, Loader2, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  collectionName: string;
}

export const GeminiAdvisor: React.FC<Props> = ({ collectionName }) => {
  const [description, setDescription] = useState('');
  const [existingSchema, setExistingSchema] = useState('');
  const [showSchemaInput, setShowSchemaInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const handleAnalyze = async () => {
    if (!description.trim()) return;
    setLoading(true);
    const result = await analyzeSchema(description, collectionName, existingSchema);
    setSuggestions(result.suggestions || []);
    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-lg p-6 border border-indigo-700 shadow-xl">
      <div className="flex items-center space-x-2 mb-4">
        <Sparkles className="w-6 h-6 text-yellow-300" />
        <h2 className="text-xl font-bold text-white">Gemini Schema Advisor</h2>
      </div>

      <p className="text-gray-300 text-sm mb-4">
        Describe your Unity project, and Gemini will suggest optimizations for your Qdrant index.
      </p>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-xs font-medium text-indigo-200 mb-1">Project Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="E.g. A tactical RPG with procedural generation..."
            className="w-full bg-gray-800/50 border border-indigo-500/30 rounded px-4 py-2 text-white focus:outline-none focus:border-indigo-400"
          />
        </div>

        <div>
          <button 
            onClick={() => setShowSchemaInput(!showSchemaInput)}
            className="flex items-center text-xs text-indigo-300 hover:text-white transition-colors focus:outline-none"
          >
            {showSchemaInput ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
            {showSchemaInput ? "Hide Existing Schema" : "Add Existing Schema (Optional)"}
          </button>
          
          {showSchemaInput && (
            <div className="mt-2 animate-in fade-in slide-in-from-top-2">
              <textarea
                value={existingSchema}
                onChange={(e) => setExistingSchema(e.target.value)}
                placeholder='Paste your JSON schema or payload structure here...'
                className="w-full h-24 bg-gray-800/50 border border-indigo-500/30 rounded px-4 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-400 resize-none"
              />
            </div>
          )}
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading || !description}
          className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-700 text-white px-4 py-2 rounded font-medium flex items-center justify-center transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
          {loading ? "Analyzing..." : "Analyze with Gemini"}
        </button>
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-3 border-t border-indigo-700/50 pt-4">
          <h3 className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">Optimization Suggestions</h3>
          {suggestions.map((s, idx) => (
            <div key={idx} className="bg-white/10 rounded p-3 flex items-start space-x-3">
               <ArrowRight className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
               <div>
                 <h4 className="font-semibold text-white text-sm">{s.title}</h4>
                 <p className="text-xs text-indigo-100 leading-relaxed mt-1">{s.reasoning}</p>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
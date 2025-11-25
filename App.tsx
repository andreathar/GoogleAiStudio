import React, { useState, useEffect } from 'react';
import { ConfigForm } from './components/ConfigForm';
import { GeminiAdvisor } from './components/GeminiAdvisor';
import { generateUnityScript, GeneratorConfig } from './utils/csharpGenerator';
import { generateDockerCompose } from './utils/dockerGenerator';
import { Code, Copy, Check, Download, Box, FileCode } from 'lucide-react';

const App: React.FC = () => {
  const [config, setConfig] = useState<GeneratorConfig>({
    qdrantUrl: 'http://localhost:6333',
    collectionName: 'unity_code_graph',
    embeddingModel: 'text-embedding-004',
    distanceMetric: 'Cosine',
    chunkSize: 1000,
    geminiApiKey: ''
  });

  const [activeTab, setActiveTab] = useState<'script' | 'docker'>('script');
  const [generatedCode, setGeneratedCode] = useState('');
  const [dockerCode, setDockerCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setGeneratedCode(generateUnityScript(config));
    
    // Extract port from URL if possible, generic fallback
    let port = 6333;
    try {
      const url = new URL(config.qdrantUrl);
      if (url.port) port = parseInt(url.port);
    } catch (e) { /* ignore */ }
    setDockerCode(generateDockerCompose(port));
  }, [config]);

  const handleConfigChange = (key: keyof GeneratorConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const currentCode = activeTab === 'script' ? generatedCode : dockerCode;
  const currentFileName = activeTab === 'script' ? 'QdrantIndexerWindow.cs' : 'docker-compose.yml';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = () => {
    const element = document.createElement("a");
    const file = new Blob([currentCode], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = currentFileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-blue-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Code className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                Unity Qdrant Indexer
              </h1>
              <p className="text-xs text-gray-400">Powered by Gemini Embeddings</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
             <a href="https://ai.google.dev" target="_blank" rel="noreferrer" className="text-sm text-gray-400 hover:text-white transition-colors">
               Gemini API
             </a>
             <a href="https://qdrant.tech" target="_blank" rel="noreferrer" className="text-sm text-gray-400 hover:text-white transition-colors">
               Qdrant Docs
             </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Col: Config & AI */}
        <div className="lg:col-span-5 space-y-8">
          <ConfigForm config={config} onChange={handleConfigChange} />
          
          <div className="border-t border-gray-800 pt-8">
            <GeminiAdvisor collectionName={config.collectionName} />
          </div>

          <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4 text-sm text-blue-200">
            <h4 className="font-semibold mb-2 flex items-center">
              <span className="bg-blue-500 rounded-full w-4 h-4 flex items-center justify-center text-xs text-white mr-2">i</span>
              Instructions
            </h4>
            <ol className="list-decimal list-inside space-y-2 opacity-80">
              <li>Configure your Qdrant URL and Collection name.</li>
              <li>Use the Gemini Advisor to verify your strategy.</li>
              <li>Download the Unity script and place in <code>Editor/</code> folder.</li>
              <li>Open <code>Tools &gt; AI &gt; Qdrant Indexer</code> in Unity.</li>
              <li>(Optional) Use the Docker tab to set up Qdrant locally.</li>
            </ol>
          </div>
        </div>

        {/* Right Col: Code Viewer */}
        <div className="lg:col-span-7 flex flex-col h-[calc(100vh-140px)] sticky top-24">
          
          {/* Tabs */}
          <div className="bg-gray-900 rounded-t-lg border-x border-t border-gray-700 flex items-center px-2 pt-2 gap-2">
            <button
              onClick={() => setActiveTab('script')}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === 'script' 
                  ? 'bg-[#1e1e1e] text-white border-t border-blue-500' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>Unity Script</span>
            </button>
            <button
              onClick={() => setActiveTab('docker')}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === 'docker' 
                  ? 'bg-[#1e1e1e] text-white border-t border-purple-500' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}
            >
              <Box className="w-4 h-4" />
              <span>Docker Setup</span>
            </button>
          </div>

          <div className="bg-[#1e1e1e] border-x border-gray-700 p-4 flex items-center justify-between border-b border-gray-800">
             <div className="flex items-center space-x-2">
               <div className="w-3 h-3 rounded-full bg-red-500" />
               <div className="w-3 h-3 rounded-full bg-yellow-500" />
               <div className="w-3 h-3 rounded-full bg-green-500" />
               <span className="ml-3 text-sm font-mono text-gray-400 opacity-60">
                 {currentFileName}
               </span>
             </div>
             <div className="flex space-x-2">
               <button 
                  onClick={copyToClipboard}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors border border-gray-600"
               >
                 {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                 <span>{copied ? "Copied" : "Copy"}</span>
               </button>
               <button 
                  onClick={downloadFile}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-sm text-white transition-colors"
               >
                 <Download className="w-4 h-4" />
                 <span>Download</span>
               </button>
             </div>
          </div>
          
          <div className="flex-1 bg-[#1e1e1e] border-x border-b border-gray-700 rounded-b-lg overflow-auto p-4 custom-scrollbar">
            <pre className="font-mono text-sm leading-relaxed text-gray-300">
              <code>{currentCode}</code>
            </pre>
          </div>
        </div>

      </main>
    </div>
  );
};

export default App;
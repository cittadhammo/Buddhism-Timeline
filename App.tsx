import React, { useState, useCallback, useRef, useEffect } from 'react';
import BuddhistChart from './components/BuddhistChart';
import { initialData } from './data/buddhistData';
import { HistoricalEvent } from './types';
import { fetchHistoricalDetails, generateSpeech } from './services/geminiService';

const App: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<HistoricalEvent | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Audio state
  const [audioLoading, setAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Stop audio when component unmounts or node changes
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [selectedNode]);

  const handleNodeClick = useCallback((node: HistoricalEvent) => {
    stopAudio(); // Ensure audio stops when switching nodes
    setSelectedNode(node);
    setAiAnalysis(""); // Reset previous analysis
    setSidebarOpen(true);
  }, []);

  const handleAskGemini = async () => {
    if (!selectedNode) return;
    setLoadingAi(true);
    const analysis = await fetchHistoricalDetails(selectedNode.name, selectedNode.description || "A key figure or event in Buddhism.");
    setAiAnalysis(analysis);
    setLoadingAi(false);
  };

  // Helper to decode base64
  const decodeBase64 = (base64: string): Uint8Array => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const handleReadAloud = async () => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    if (!aiAnalysis) return;

    setAudioLoading(true);
    try {
      const audioDataBase64 = await generateSpeech(aiAnalysis);
      if (audioDataBase64) {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }

        const audioCtx = audioContextRef.current;
        const audioBytes = decodeBase64(audioDataBase64);
        
        // Decode audio data (raw PCM or encoded depends on API, but standard decodeAudioData handles headers if present)
        // Note: The Gemini Live API returns raw PCM, but the generateContent TTS usually returns wav/mp3 wrapped or needs standard decoding.
        // Let's try standard decoding first as it's robust.
        
        // However, if the API returns raw PCM without headers, we might need manual float conversion.
        // The prompt examples for generateContent TTS imply usage of `decodeAudioData`.
        
        // Fix for potential raw data or context issues:
        // If decodeAudioData fails, it might be raw PCM. But 'gemini-2.5-flash-preview-tts' usually returns standard playable formats.
        
        // Actually, the prompt says "The audio bytes returned by the API is raw PCM data... it contains no header information".
        // We must manually construct the buffer.
        
        const pcmData = new Int16Array(audioBytes.buffer);
        const channels = 1;
        const sampleRate = 24000;
        const frameCount = pcmData.length;
        const audioBuffer = audioCtx.createBuffer(channels, frameCount, sampleRate);
        
        const channelData = audioBuffer.getChannelData(0);
        for (let i = 0; i < frameCount; i++) {
          channelData[i] = pcmData[i] / 32768.0;
        }

        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        
        source.onended = () => {
          setIsPlaying(false);
          audioSourceRef.current = null;
        };

        source.start();
        audioSourceRef.current = source;
        setIsPlaying(true);
      }
    } catch (e) {
      console.error("Audio playback error:", e);
    } finally {
      setAudioLoading(false);
    }
  };

  const stopAudio = () => {
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
    }
    setIsPlaying(false);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-stone-100 font-sans">
      {/* Header */}
      <header className="flex-none h-16 bg-stone-900 text-stone-100 flex items-center px-6 shadow-md z-20">
        <div className="text-2xl font-serif tracking-wider mr-4">☸ Buddhism Timeline</div>
        <div className="text-sm text-stone-400 border-l border-stone-700 pl-4">
          Visualizing the History of Buddhism
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Chart Container */}
        <div className="flex-1 relative z-0">
          <BuddhistChart 
            data={initialData} 
            onNodeClick={handleNodeClick} 
            selectedId={selectedNode?.id || null}
          />
        </div>

        {/* Sidebar Panel (Slide-over) */}
        <div 
          className={`
            absolute top-0 right-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 z-10 border-l border-stone-200
            ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
          `}
        >
          {selectedNode ? (
            <div className="flex flex-col h-full">
              {/* Sidebar Header */}
              <div className="p-6 bg-stone-50 border-b border-stone-200 flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-serif text-stone-800 mb-1">{selectedNode.name}</h2>
                  <div className="text-sm font-bold text-amber-600">
                    {selectedNode.year < 0 ? `${Math.abs(selectedNode.year)} BCE` : `${selectedNode.year} CE`}
                    {selectedNode.endYear && ` – ${selectedNode.endYear} CE`}
                  </div>
                  <div className="text-xs text-stone-500 uppercase tracking-wide mt-1">
                    {initialData.countries.find(c => c.id === selectedNode.countryId)?.name}
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setSidebarOpen(false);
                    setSelectedNode(null);
                  }}
                  className="text-stone-400 hover:text-stone-700 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Basic Description */}
                <div>
                  <h3 className="text-sm font-bold text-stone-400 uppercase mb-2">Summary</h3>
                  <p className="text-stone-700 leading-relaxed">
                    {selectedNode.description || "No detailed description available."}
                  </p>
                </div>

                {/* AI Insight Section */}
                <div className="bg-stone-50 rounded-lg p-4 border border-stone-200">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold text-stone-800 flex items-center">
                      <span className="mr-2">✨</span> Gemini Insight
                    </h3>
                    <div className="flex gap-2">
                      {aiAnalysis && (
                        <button 
                          onClick={handleReadAloud}
                          disabled={audioLoading}
                          className={`text-xs px-2 py-1 rounded shadow transition-colors flex items-center gap-1 ${isPlaying ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'}`}
                        >
                          {audioLoading ? (
                             <span className="animate-pulse">Loading Audio...</span>
                          ) : isPlaying ? (
                             <>
                               <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                               Stop
                             </>
                          ) : (
                             <>
                               <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                               Listen
                             </>
                          )}
                        </button>
                      )}
                      
                      {!aiAnalysis && !loadingAi && (
                        <button 
                          onClick={handleAskGemini}
                          className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded shadow transition-colors"
                        >
                          Analyze with AI
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {loadingAi && (
                    <div className="flex items-center space-x-2 text-stone-500 text-sm animate-pulse">
                      <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      <span>Consulting the archives...</span>
                    </div>
                  )}

                  {aiAnalysis && (
                    <div className="prose prose-sm prose-stone text-stone-600 leading-relaxed">
                      {aiAnalysis}
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stone-100">
                  <div>
                    <span className="block text-xs text-stone-400">Type</span>
                    <span className="block text-sm font-medium capitalize">{selectedNode.type}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-stone-400">Impact Level</span>
                    <div className="flex space-x-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <div 
                          key={i} 
                          className={`w-2 h-2 rounded-full ${i < ((selectedNode.importance || 5) / 2) ? 'bg-amber-400' : 'bg-stone-200'}`} 
                        />
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ) : (
             <div className="flex items-center justify-center h-full text-stone-400">
               Select an item to view details
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
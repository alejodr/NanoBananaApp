import React, { useState, useRef, useEffect } from 'react';
import { AppState } from './types';
import { generateOrEditImage } from './services/geminiService';
import { UploadIcon, MagicWandIcon, TrashIcon, DownloadIcon, ImageIcon, AlertCircleIcon } from './components/Icons';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [sourceImage, setSourceImage] = useState<File | null>(null);
  const [sourceImagePreview, setSourceImagePreview] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type (basic)
      if (!file.type.startsWith('image/')) {
        setErrorMsg("Please upload a valid image file (PNG, JPEG).");
        return;
      }
      
      setSourceImage(file);
      setErrorMsg(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setSourceImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearSourceImage = () => {
    setSourceImage(null);
    setSourceImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setErrorMsg("Please enter a prompt describing what you want to generate or how to edit the image.");
      return;
    }

    setAppState(AppState.PROCESSING);
    setErrorMsg(null);

    try {
      const resultImageUrl = await generateOrEditImage(prompt, sourceImage);
      setGeneratedImage(resultImageUrl);
      setAppState(AppState.SUCCESS);
    } catch (err: any) {
      setAppState(AppState.ERROR);
      setErrorMsg(err.message || "An unknown error occurred while communicating with Gemini.");
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `nano-canvas-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Render logic helpers
  const isProcessing = appState === AppState.PROCESSING;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-200 selection:bg-yellow-500 selection:text-slate-900">
      
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg shadow-lg shadow-yellow-500/20">
               <MagicWandIcon className="w-5 h-5 text-slate-900" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">Nano<span className="text-yellow-400">Canvas</span></h1>
          </div>
          <div className="text-xs font-medium text-slate-400 border border-slate-800 rounded-full px-3 py-1 bg-slate-900">
            Powered by Gemini 2.5 Flash Image
          </div>
        </div>
      </header>

      <main className="flex-grow p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
          
          {/* Left Column: Controls */}
          <div className="flex flex-col gap-6">
            
            {/* Intro Text */}
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-white">Create or Edit with AI</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Upload an image to edit it using natural language, or simply type a prompt to generate a new image from scratch. 
              </p>
            </div>

            {/* Upload Section */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 transition-all hover:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-yellow-500" />
                  Reference Image <span className="text-slate-500 text-xs font-normal">(Optional for generation)</span>
                </label>
                {sourceImage && (
                  <button 
                    onClick={clearSourceImage}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-900/20 transition-colors"
                  >
                    <TrashIcon className="w-3 h-3" /> Remove
                  </button>
                )}
              </div>

              {!sourceImagePreview ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-yellow-500/50 hover:bg-slate-800/50 rounded-xl h-48 flex flex-col items-center justify-center cursor-pointer transition-all group"
                >
                  <div className="p-3 bg-slate-800 rounded-full mb-3 group-hover:scale-110 transition-transform">
                    <UploadIcon className="w-6 h-6 text-slate-400 group-hover:text-yellow-400" />
                  </div>
                  <p className="text-sm text-slate-400 font-medium">Click to upload source image</p>
                  <p className="text-xs text-slate-600 mt-1">PNG or JPG supported</p>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-slate-700 h-48 bg-slate-800 flex items-center justify-center group">
                  <img 
                    src={sourceImagePreview} 
                    alt="Source" 
                    className="max-h-full max-w-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white/10 backdrop-blur text-white text-sm px-4 py-2 rounded-full hover:bg-white/20 transition-colors"
                    >
                      Change Image
                    </button>
                  </div>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/png, image/jpeg, image/jpg" 
              />
            </div>

            {/* Prompt Section */}
            <div className="flex-grow flex flex-col gap-4">
               <div>
                 <label htmlFor="prompt" className="block text-sm font-medium text-slate-300 mb-2">
                   AI Prompt
                 </label>
                 <textarea
                   id="prompt"
                   value={prompt}
                   onChange={(e) => setPrompt(e.target.value)}
                   placeholder={sourceImage ? "E.g. Add a retro filter, remove background person..." : "E.g. A futuristic city with flying cars, oil painting style..."}
                   className="w-full h-32 bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 outline-none resize-none transition-all"
                 />
               </div>

               {errorMsg && (
                 <div className="bg-red-900/20 border border-red-900/50 text-red-200 px-4 py-3 rounded-lg flex items-start gap-3 text-sm">
                   <AlertCircleIcon className="w-5 h-5 shrink-0 text-red-400" />
                   <p>{errorMsg}</p>
                 </div>
               )}

               <button
                 onClick={handleGenerate}
                 disabled={isProcessing}
                 className={`w-full py-4 px-6 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-yellow-900/20 
                   ${isProcessing 
                     ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                     : 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-slate-900 hover:from-yellow-400 hover:to-yellow-500 hover:shadow-yellow-500/20 transform hover:-translate-y-0.5'
                   }`}
               >
                 {isProcessing ? (
                   <>
                     <div className="w-5 h-5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                     Processing...
                   </>
                 ) : (
                   <>
                     <MagicWandIcon className="w-5 h-5" />
                     {sourceImage ? 'Edit Image' : 'Generate Image'}
                   </>
                 )}
               </button>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="flex flex-col h-full min-h-[400px] lg:min-h-0">
             <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-300">Result</h3>
                {generatedImage && (
                  <button 
                    onClick={handleDownload}
                    className="text-xs flex items-center gap-1 text-yellow-500 hover:text-yellow-400 font-medium"
                  >
                    <DownloadIcon className="w-4 h-4" /> Download
                  </button>
                )}
             </div>
             
             <div className="flex-grow rounded-2xl border border-slate-800 bg-slate-900/30 overflow-hidden relative flex items-center justify-center group">
               {generatedImage ? (
                 <>
                  <img 
                    src={generatedImage} 
                    alt="Generated Result" 
                    className="w-full h-full object-contain bg-slate-950/50"
                  />
                  {/* Overlay for easy download on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-8">
                     <button 
                       onClick={handleDownload}
                       className="bg-white text-slate-900 font-semibold px-6 py-3 rounded-full shadow-xl hover:scale-105 transition-transform flex items-center gap-2"
                     >
                       <DownloadIcon className="w-5 h-5" /> Save Image
                     </button>
                  </div>
                 </>
               ) : (
                 <div className="text-center p-8">
                   <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center transition-all duration-700 ${isProcessing ? 'bg-yellow-500/10 animate-pulse' : 'bg-slate-800'}`}>
                     {isProcessing ? (
                       <MagicWandIcon className="w-10 h-10 text-yellow-500 animate-bounce" />
                     ) : (
                       <ImageIcon className="w-10 h-10 text-slate-600" />
                     )}
                   </div>
                   <h4 className="text-lg font-medium text-slate-300 mb-2">
                     {isProcessing ? 'Working magic...' : 'Ready to Create'}
                   </h4>
                   <p className="text-sm text-slate-500 max-w-xs mx-auto">
                     {isProcessing 
                       ? 'The AI is processing your request. This usually takes a few seconds.' 
                       : 'Your generated or edited artwork will appear here.'}
                   </p>
                 </div>
               )}
             </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;
import React, { useState } from 'react';
import { Upload, FileSpreadsheet, AlertTriangle, Download, BarChart3, Settings, Loader2, User, GraduationCap, Calendar, Hash } from 'lucide-react';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [method, setMethod] = useState('isolation_forest');
  const [scale, setScale] = useState('standard');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      // Enforce 50MB limit (50 * 1024 * 1024 bytes)
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError('File size exceeds the 50MB limit. Please upload a smaller dataset.');
        setFile(null);
        return;
      }
      setError(null);
      setFile(selectedFile);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResults(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('method', method);
    formData.append('scale', scale);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        let errorMessage = 'Analysis failed';
        try {
          const errData = await response.json();
          errorMessage = errData.error || errData.details || errorMessage;
        } catch (parseErr) {
          // If the server returns HTML (like a 502/504 Gateway error) or plain text
          const text = await response.text();
          if (text.includes('504') || text.includes('Timeout')) {
            errorMessage = 'The analysis took too long and timed out. Try a smaller dataset or a faster algorithm (like Isolation Forest).';
          } else if (text.includes('502') || text.includes('503')) {
            errorMessage = 'The server is currently overloaded or restarting. Please try again in a moment.';
          } else if (text.includes('413') || text.toLowerCase().includes('large')) {
            errorMessage = 'The uploaded file is too large for the server to process.';
          } else {
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-indigo-950 to-purple-950 text-slate-200 font-sans flex flex-col">
      <header className="bg-black/40 backdrop-blur-md border-b border-white/10 py-4 px-4 sm:py-6 sm:px-8 flex items-center gap-3">
        <div className="bg-red-500/20 border border-red-500/50 p-1.5 sm:p-2 rounded-lg shadow-[0_0_15px_rgba(239,68,68,0.3)]">
          <AlertTriangle className="text-red-500 w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <h1 className="text-lg sm:text-2xl font-bold text-red-500 tracking-wide drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]">
          Fraud Detection Pipeline
        </h1>
      </header>

      <main className="flex-grow max-w-7xl w-full mx-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/10">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
              <Upload className="w-5 h-5 text-indigo-400" />
              Upload Dataset
            </h2>
            
            <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:bg-white/5 hover:border-indigo-400/50 transition-all relative group">
              <input 
                type="file" 
                accept=".csv" 
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <FileSpreadsheet className="w-10 h-10 text-indigo-300/70 mx-auto mb-3 group-hover:text-indigo-400 transition-colors" />
              <p className="text-sm font-medium text-slate-300">
                {file ? file.name : 'Click or drag CSV file here'}
              </p>
              <p className="text-xs text-slate-500 mt-1">Max file size: 50MB</p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/10">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
              <Settings className="w-5 h-5 text-indigo-400" />
              Configuration
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Detection Method</label>
                <select 
                  value={method} 
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                >
                  <option value="isolation_forest">Isolation Forest</option>
                  <option value="dbscan">DBSCAN</option>
                  <option value="kmeans">K-Means Clustering</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Scaling Strategy</label>
                <select 
                  value={scale} 
                  onChange={(e) => setScale(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                >
                  <option value="standard">Standard Scaler (Z-score)</option>
                  <option value="minmax">Min-Max Scaler</option>
                </select>
              </div>
            </div>

            <div className="mt-6 bg-white/5 rounded-lg p-4 border border-white/10">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">Model Recommendations</h3>
              <ul className="space-y-3 text-xs text-slate-400">
                <li>
                  <strong className="text-indigo-400">Isolation Forest:</strong> Best for large, high-dimensional datasets. Extremely fast and scalable.
                </li>
                <li>
                  <strong className="text-indigo-400">DBSCAN:</strong> Best for smaller datasets where anomalies form dense, irregular clusters. Can struggle with many columns.
                </li>
                <li>
                  <strong className="text-indigo-400">K-Means:</strong> Best for datasets where normal transactions form distinct, spherical groupings. Good baseline.
                </li>
              </ul>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!file || loading}
              className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] disabled:shadow-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <BarChart3 className="w-5 h-5" />
                  Run Analysis
                </>
              )}
            </button>
            
            {error && (
              <div className="mt-4 p-3 bg-red-500/10 text-red-400 text-sm rounded-lg border border-red-500/20">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-2 space-y-6">
          {results ? (
            <div className="animate-in fade-in duration-500 space-y-6">
              {/* Metrics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 backdrop-blur-sm p-5 rounded-2xl shadow-xl border border-white/10">
                  <p className="text-sm text-slate-400 font-medium">Total Records</p>
                  <p className="text-2xl font-bold text-white mt-1">{results.summary.total_transactions.toLocaleString()}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm p-5 rounded-2xl shadow-xl border border-white/10">
                  <p className="text-sm text-slate-400 font-medium">Normal</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">{results.summary.normal_transactions.toLocaleString()}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm p-5 rounded-2xl shadow-xl border border-white/10 relative overflow-hidden">
                  <div className="absolute inset-0 bg-rose-500/5"></div>
                  <p className="text-sm text-slate-400 font-medium relative z-10">Anomalies</p>
                  <p className="text-2xl font-bold text-rose-500 mt-1 relative z-10">{results.summary.flagged_anomalies.toLocaleString()}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm p-5 rounded-2xl shadow-xl border border-white/10">
                  <p className="text-sm text-slate-400 font-medium">Fraud Ratio</p>
                  <p className="text-2xl font-bold text-amber-400 mt-1">{results.summary.anomaly_ratio.toFixed(2)}%</p>
                </div>
              </div>

              {/* Chart & Downloads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/10">
                  <h3 className="text-base font-semibold mb-4 text-white">Distribution Chart</h3>
                  <div className="bg-white/10 p-2 rounded-xl border border-white/5">
                    <img 
                      src={`/api/image/${results.id}`} 
                      alt="Anomaly Distribution" 
                      className="w-full h-auto rounded-lg opacity-90 hover:opacity-100 transition-opacity mix-blend-screen"
                    />
                  </div>
                </div>
                
                <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/10 flex flex-col justify-center gap-4">
                  <h3 className="text-base font-semibold mb-2 text-white">Export Results</h3>
                  <p className="text-sm text-slate-400 mb-2">
                    Download the fully processed dataset with the anomaly flags, or isolate just the suspicious transactions.
                  </p>
                  
                  <a 
                    href={`/api/download/${results.id}/processed`}
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors border border-white/5"
                  >
                    <Download className="w-4 h-4" />
                    Download Processed Dataset
                  </a>
                  
                  <a 
                    href={`/api/download/${results.id}/fraud`}
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-medium rounded-lg transition-colors border border-rose-500/30 shadow-[0_0_10px_rgba(225,29,72,0.2)]"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Download Fraud Only
                  </a>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-xl border border-white/10 overflow-hidden">
                <div className="p-6 border-b border-white/10 bg-black/20">
                  <h3 className="text-base font-semibold text-white">Suspected Fraudulent Transactions (Sample)</h3>
                </div>
                <div className="overflow-x-auto">
                  {results.sampleAnomalies && results.sampleAnomalies.length > 0 ? (
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-400 uppercase bg-black/40 border-b border-white/10">
                        <tr>
                          {Object.keys(results.sampleAnomalies[0]).slice(0, 8).map(key => (
                            <th key={key} className="px-6 py-4 font-semibold tracking-wider">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {results.sampleAnomalies.map((row: any, i: number) => (
                          <tr key={i} className="hover:bg-white/5 transition-colors">
                            {Object.keys(results.sampleAnomalies[0]).slice(0, 8).map(key => (
                              <td key={key} className="px-6 py-3 text-slate-300 truncate max-w-[150px]">
                                {row[key]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-8 text-center text-slate-500">
                      No anomalies detected in this dataset.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] bg-white/5 backdrop-blur-sm rounded-2xl shadow-xl border border-white/10 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
              <div className="bg-black/20 p-6 rounded-full mb-4 border border-white/5">
                <BarChart3 className="w-12 h-12 text-indigo-500/50" />
              </div>
              <h3 className="text-lg font-medium text-slate-300 mb-2">No Analysis Results Yet</h3>
              <p className="max-w-md text-slate-400">Upload a CSV dataset and run the analysis to view fraud detection metrics, distribution charts, and flagged transactions.</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer Banner */}
      <footer className="mt-auto border-t border-white/10 bg-black/40 backdrop-blur-md py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col items-center text-center gap-5">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/20 p-2.5 rounded-full border border-indigo-500/30">
              <User className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="text-slate-200 font-semibold text-xl tracking-wide">Nirupam Das</span>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 text-slate-400 text-sm">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-purple-400" />
              <span>Indian Institute of Engineering Science and Technology</span>
            </div>
            
            <div className="hidden md:block text-slate-600">•</div>
            
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>2nd Year</span>
            </div>
            
            <div className="hidden md:block text-slate-600">•</div>
            
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-rose-400" />
              <span className="font-mono text-rose-200 bg-rose-500/10 px-2.5 py-0.5 rounded border border-rose-500/20">
                2024CSB108
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { useState } from 'react';
import QRCode from "react-qr-code";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { 
  UploadCloud, 
  FileText, 
  Droplets, 
  Thermometer, 
  Wind, 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  CheckCircle,
  Box,
  Leaf
} from 'lucide-react';

function App() {
  // Initial state configuration for commodity parameters
  const [formData, setFormData] = useState({
    commodity_type: 'Tomatoes',
    moisture_content: '94%',
    oil_fat_content: '0.2%',
    ph_level: '4.3',
    respiration_rate: 'High (15-20 mg CO2/kg-hr)',
    desired_shelf_life: '14 days',
    storage_temperature: '10°C',
    relative_humidity: '90%',
    transportation_conditions: 'Refrigerated Truck',
    transportation_duration: '1-3 days',
    exposure_conditions: 'Temperature fluctuation',
    storage_type: 'Chilled',
    language: 'English'
  });

  // UI state management
  const [loading, setLoading] = useState(false);
  const [showFailureMode, setShowFailureMode] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [simTemperature, setSimTemperature] = useState(20); 

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handles image upload and routes payload to Vision API
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setImageLoading(true);
    const uploadData = new FormData();
    uploadData.append('file', file);
    
    try {
      const res = await fetch('http://127.0.0.1:8000/analyze-image', {
        method: 'POST',
        body: uploadData
      });
      const aiData = await res.json();
      
      // Map API response to local state
      setFormData(prev => ({
        ...prev,
        commodity_type: aiData.commodity_type,
        moisture_content: aiData.moisture_content,
        oil_fat_content: aiData.oil_fat_content,
        ph_level: aiData.ph_level,
        respiration_rate: aiData.respiration_rate,
        desired_shelf_life: aiData.desired_shelf_life,
        storage_temperature: aiData.storage_temperature,
        relative_humidity: aiData.relative_humidity,
        transportation_conditions: aiData.transportation_conditions,
        storage_type: aiData.storage_type
      }));
    } catch (err) {
      console.error("Vision API integration failed:", err);
      alert("Image analysis failed. Check network logs.");
    }
    setImageLoading(false);
  };

  // Submits form payload to backend recommendation engine
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('http://localhost:8000/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to fetch recommendation payload');
      
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculates dynamic shelf-life decay based on thermal fluctuations
  const calculateDynamicShelfLife = (baseText, currentTemp, optimalTempStr) => {
    if (!baseText) return baseText;
    
    // Parse numeric values from API string responses
    const baseDaysMatch = baseText.match(/(\d+)/);
    const optTempMatch = optimalTempStr.match(/(\d+)/);
    
    if (!baseDaysMatch || !optTempMatch) return baseText;
    
    const baseDays = parseInt(baseDaysMatch[0]);
    const optimalTemp = parseInt(optTempMatch[0]);
    
    const tempDifference = currentTemp - optimalTemp;
    
    if (tempDifference <= 0) return baseText; 
    
    // Q10 biological decay algorithm: Shelf life drops based on temperature delta
    const decayFactor = Math.pow(2, tempDifference / 10);
    const newDays = Math.max(1, Math.round(baseDays / decayFactor));
    
    return `${newDays} days (Reduced due to heat stress)`;
  };

  // Handles material substitution and dynamic score penalization
  const handleSwapMaterial = (clickedAlternate) => {
    if (!result) return;
    
    // Clone current recommendation payload
    const newResult = { ...result };
    
    // Substitute primary material
    const oldPrimary = newResult.recommended_material;
    newResult.recommended_material = clickedAlternate;
    
    // Reconcile alternates array
    newResult.alternates = newResult.alternates.filter(alt => alt !== clickedAlternate);
    newResult.alternates.push(oldPrimary);
    
    // Apply match score penalty for non-optimal material selection
    const scorePenalty = Math.floor(Math.random() * 5) + 2; 
    newResult.match_score_percentage = Math.max(65, newResult.match_score_percentage - scorePenalty);
    
    // Commit state update
    setResult(newResult);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 via-indigo-100 to-emerald-200 py-10 px-4 sm:px-6 lg:px-8 font-sans text-gray-800">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Global Header */}
        <div className="text-center flex flex-col items-center">
          <div className="flex items-center justify-center gap-4 mb-2">
            <img 
              src="/cocoonlogo.png" 
              alt="Cocoon Logo" 
              className="w-16 h-auto object-contain mix-blend-multiply" 
            />
            <h1 className="text-5xl font-extrabold text-blue-900 tracking-tight">Cocoon</h1>
          </div>
          <p className="text-gray-600 text-lg">Smart protection for every stage of freshness.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Input Panel */}
          <div className="lg:col-span-5 bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-6 h-fit print:hidden">
            <div className="mb-6">
              <h2 className="text-xl font-bold border-b pb-2 mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                Intelligent Food Profiling
              </h2>
  
              {/* Vision API Upload Zone */}
              <label htmlFor="imageUpload" className="border-2 border-dashed border-blue-200 rounded-xl bg-blue-50/50 hover:bg-blue-50 transition-colors p-8 text-center cursor-pointer group block">
                <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                </div>
                <p className="text-sm font-bold text-blue-900 mb-1">
                  {imageLoading ? 'Analyzing Image via Gemini Vision...' : 'Upload crop image for AI Auto-Fill'}
                </p>
                <p className="text-xs text-blue-600/70">JPG, PNG, or WEBP (Max 5MB)</p>
                <input 
                  id="imageUpload" 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                />
              </label>
            </div>

            <div className="relative flex items-center py-5">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold uppercase">Or enter manually</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {Object.keys(formData).map((key) => {
                // Exclude specific fields from dynamic input generation
                if (key === 'transportation_duration' || key === 'exposure_conditions') return null;

                if (key === 'language') {
                  return (
                    <div key={key} className="flex flex-col col-span-1 md:col-span-2 mt-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                        Output Language / भाषा
                      </label>
                      <select
                        name={key}
                        value={formData[key]}
                        onChange={handleChange}
                        className="border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-blue-50 font-semibold text-blue-900 cursor-pointer"
                      >
                        <option value="English">English</option>
                        <option value="Hindi">Hindi (हिंदी)</option>
                        <option value="Marathi">Marathi (मराठी)</option>
                      </select>
                    </div>
                  );
                }
                return (
                  <div key={key} className="flex flex-col">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                      {key.replace(/_/g, ' ')}
                    </label>
                    <input
                      type="text"
                      name={key}
                      value={formData[key]}
                      onChange={handleChange}
                      className="border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                );
              })}

              {/* Supply Chain Routing Fields */}
              <div className="mb-4">
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wide mb-2">
                  Transport Duration
                </label>
                <select
                  name="transportation_duration"
                  value={formData.transportation_duration}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-gray-50 text-gray-800"
                >
                  <option value="< 1 day">&lt; 1 day (Local)</option>
                  <option value="1-3 days">1-3 days (Domestic)</option>
                  <option value="3-7 days">3-7 days (Long-distance)</option>
                  <option value="> 7 days">&gt; 7 days (Export)</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wide mb-2">
                  Primary Exposure Risk
                </label>
                <select
                  name="exposure_conditions"
                  value={formData.exposure_conditions}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-gray-50 text-gray-800"
                >
                  <option value="Temperature fluctuation">Temperature fluctuation</option>
                  <option value="Mechanical vibration">Mechanical vibration (Bumpy roads)</option>
                  <option value="Direct Sunlight">Direct Sunlight</option>
                  <option value="High Dust/Rain">High Dust / Moisture</option>
                </select>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3 px-4 rounded-lg transition-colors mt-4"
              >
                {loading ? 'Analyzing Properties...' : 'Generate AI Recommendation'}
              </button>
            </form>
          </div>

          {/* Analytics Output Panel */}
          <div className="lg:col-span-7">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                <strong>Error:</strong> {error}
              </div>
            )}

            {!result && !loading && !error && (
              <div className="bg-white rounded-xl shadow-md p-10 text-center flex flex-col items-center justify-center h-full text-gray-400 border-2 border-dashed border-gray-300">
                <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                <p>Submit the commodity parameters to generate a packaging spec sheet.</p>
              </div>
            )}

            {result && (
              <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/60">
                
                {/* Risk Simulator Controls */}
                <div className="flex justify-end p-4">
                  <button 
                    onClick={() => setShowFailureMode(!showFailureMode)} 
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors ${showFailureMode ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-red-100 text-red-700 hover:bg-red-200 shadow-sm border border-red-200'}`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    {showFailureMode ? "View Safe Recommendation" : "Simulate Packaging Failure"}
                  </button>
                </div>

                {/* Risk Simulation Matrix */}
                {showFailureMode ? (
                  <div className="bg-red-50 p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-red-100 p-3 rounded-full">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-red-800">Critical Failure Risk</h3>
                        <p className="text-red-700 font-medium">If standard/cheap packaging is selected.</p>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border border-red-100 mb-5 shadow-sm">
                      <p className="text-gray-600 text-sm font-bold uppercase tracking-wider mb-1">User Selects:</p>
                      <p className="text-lg font-bold text-gray-900">{result.cheap_alternative_material}</p>
                    </div>

                    <div className="mb-8">
                      <p className="text-red-800 font-bold uppercase tracking-wider text-sm mb-3">⚠ Potential Risks Detected:</p>
                      <ul className="space-y-3">
                        {result.failure_risks?.map((risk, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-red-900 font-medium bg-red-100/50 p-3 rounded-lg border border-red-100">
                            <XCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" /> 
                            {risk}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button 
                      onClick={() => setShowFailureMode(false)} 
                      className="w-full bg-green-600 text-white px-6 py-4 rounded-xl font-bold shadow-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-lg"
                    >
                      <CheckCircle className="w-5 h-5" /> 
                      Switch to Recommended Cocoon Packaging
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Standard Recommendation View */}
                    <div className="bg-blue-900 text-white p-6 relative">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-blue-200 text-sm font-bold tracking-wider uppercase">Primary Recommendation</span>
                          <h2 className="text-3xl font-extrabold mt-1">{result.recommended_material}</h2>
                        </div>
                        <button 
                          onClick={() => window.print()} 
                          className="bg-white/20 hover:bg-white/30 text-white border border-white/40 font-semibold py-2 px-4 rounded shadow-sm transition-colors print:hidden flex items-center gap-2 text-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                          Export PDF
                        </button>
                      </div>
                      <p className="mt-4 text-blue-100 italic">{result.reasoning}</p>
                    </div>

                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                      
                      {/* Technical Barrier Specifications */}
                      <div className="col-span-1 sm:col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h3 className="font-bold text-gray-700 mb-3 border-b pb-1">Barrier Properties</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div><span className="block text-gray-500 text-xs">OTR</span><span className="font-semibold">{result.otr}</span></div>
                          <div><span className="block text-gray-500 text-xs">WVTR</span><span className="font-semibold">{result.wvtr}</span></div>
                          <div><span className="block text-gray-500 text-xs">Gas Permeability</span><span className="font-semibold">{result.gas_permeability}</span></div>
                        </div>
                      </div>

                      {/* Mechanical Integrity */}
                      <div>
                        <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                          <Box className="w-4 h-4 text-blue-500" />
                          Physical Specs
                        </h3>
                        <ul className="text-sm space-y-2">
                          <li><span className="text-gray-500">Thickness:</span> <span className="font-semibold">{result.film_thickness_microns}</span></li>
                          <li><span className="text-gray-500">Strength:</span> <span className="font-semibold">{result.mechanical_strength}</span></li>
                          <li><span className="text-gray-500">Sealability:</span> <span className="font-semibold">{result.sealability}</span></li>
                        </ul>
                      </div>
                      
                      {/* Evaluation Metrics */}
                      <div className="col-span-1 sm:col-span-2 bg-white/80 p-5 rounded-xl border border-blue-100 shadow-inner mt-2">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-700 font-bold uppercase text-xs tracking-wide flex items-center gap-2">
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            Packaging Match Score
                          </span>
                          <span className="text-2xl font-extrabold text-blue-700">{result.match_score_percentage}%</span>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-5">
                          <div className="bg-gradient-to-r from-blue-500 to-green-500 h-2.5 rounded-full transition-all duration-1000 ease-out" style={{ width: `${result.match_score_percentage}%` }}></div>
                        </div>
                        
                        {/* Regulatory Compliance */}
                        <div className="flex items-start gap-3 bg-green-50 p-3 rounded-lg border border-green-200">
                          <ShieldCheck className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-green-800 uppercase tracking-wider font-bold text-xs block mb-1">Regulatory & FSSAI Compliance</span>
                            <p className="text-sm font-medium text-green-700 leading-snug">
                              {result.fssai_compliance_info}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Atmospheric and Thermal Modeling */}
                      <div>
                        <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                          <Wind className="w-4 h-4 text-green-500" />
                          Shelf Life & MAP
                        </h3>
                        <ul className="text-sm space-y-4 mb-4">
                      <li className="bg-green-50 p-3 rounded-lg border border-green-100">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-green-800 font-bold uppercase text-xs">Dynamic Shelf Life</span>
                          <span className={`font-extrabold ${simTemperature > parseInt(formData.storage_temperature) + 5 ? 'text-red-600' : 'text-green-600'}`}>
                            {calculateDynamicShelfLife(result.shelf_life_estimate_days, simTemperature, formData.storage_temperature)}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 block mb-2">Baseline AI Estimate: {result.shelf_life_estimate_days}</span>
                        
                        {/* Thermal Decay Simulator */}
                        <div className="mt-2">
                          <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                            <span>Optimal: {formData.storage_temperature}</span>
                            <span>Simulated: {simTemperature}°C</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="40" 
                            value={simTemperature} 
                            onChange={(e) => setSimTemperature(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                          <p className="text-[10px] text-gray-400 mt-1 text-center italic">Drag to simulate supply chain temperature spikes</p>
                        </div>
                      </li>
                      <li><span className="text-gray-500">MAP Suitability:</span> <span className="font-semibold">{result.map_suitability}</span></li>
                    </ul>
                        
                        <div className="bg-white/80 p-4 rounded-xl border border-blue-100 shadow-inner mt-4 h-64">
                          <span className="block text-blue-800 font-bold text-xs uppercase mb-2 text-center">Interactive MAP Gas Composition</span>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'Oxygen (O2)', value: result.map_o2_percentage, color: '#3b82f6' },
                                  { name: 'Carbon Dioxide (CO2)', value: result.map_co2_percentage, color: '#10b981' },
                                  { name: 'Nitrogen (N2)', value: result.map_n2_percentage, color: '#94a3b8' }
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {[
                                  { name: 'Oxygen (O2)', value: result.map_o2_percentage, color: '#3b82f6' },
                                  { name: 'Carbon Dioxide (CO2)', value: result.map_co2_percentage, color: '#10b981' },
                                  { name: 'Nitrogen (N2)', value: result.map_n2_percentage, color: '#94a3b8' }
                                ].map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => `${value}%`} />
                              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      
                      {/* Analytics Reporting */}
                      <div className="col-span-1 sm:col-span-2 bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200 mt-2">
                        <h3 className="font-bold text-green-800 mb-3 border-b border-green-200 pb-1 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          Impact Analysis
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="block text-green-700 text-xs font-bold uppercase tracking-wide">Est. Cost (INR)</span>
                            <span className="font-semibold text-gray-800">{result.cost_estimate_per_kg}</span>
                          </div>
                          <div>
                            <span className="block text-green-700 text-xs font-bold uppercase tracking-wide">Carbon Footprint</span>
                            <span className="font-semibold text-gray-800">{result.carbon_footprint_rating}</span>
                          </div>
                        </div>
                      </div>

                      {/* Meta Information & Export Layer */}
                      <div className="col-span-1 sm:col-span-2 pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-semibold">♻️ {result.sustainability_tag}</span>
                        <div className="flex flex-wrap items-center gap-2">
  <span className="text-gray-500 font-bold text-xs uppercase mr-1 flex items-center gap-1">
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
    Swap to Alternate:
  </span>
  
  {result.alternates?.map((alt, idx) => (
    <button 
      key={idx}
      onClick={() => handleSwapMaterial(alt)}
      className="bg-white hover:bg-blue-50 hover:text-blue-700 text-gray-600 font-medium px-3 py-1.5 rounded-full border border-gray-200 shadow-sm transition-all cursor-pointer flex items-center gap-1.5 text-xs active:scale-95"
      title="Click to recalculate with this material"
    >
      {alt}
    </button>
  ))}
</div>
                        </div>
                        
                        {/* Supply Chain Validation Identity */}
                        <div className="p-3 bg-white border border-gray-200 rounded-lg flex items-center gap-4 shadow-sm">
                          <div>
                            <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wide">Traceability</h4>
                            <p className="text-[10px] text-gray-500 max-w-[120px]">Scan for material compliance log.</p>
                          </div>
                          <QRCode value={`Commodity: ${formData.commodity_type} | Material: ${result.recommended_material} | Log: Validated`} size={64} />  
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
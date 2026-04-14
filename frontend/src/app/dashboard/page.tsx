"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Leaf, 
  Bell, 
  LogOut, 
  Plus, 
  FileText, 
  Download, 
  Cpu, 
  AlertTriangle, 
  Activity, 
  BarChart3,
  Thermometer,
  Droplets,
  CheckCircle2,
  XCircle,
  RefreshCw,
  User as UserIcon,
  Waves,
  Terminal,
  Loader2
} from "lucide-react";

import { fetchWithAuth } from "@/lib/api";
import { removeToken, getToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Modal } from "@/components/Modal";
import { Toast, ToastType } from "@/components/Toast";



// --- Components ---

function ArrowRight({ className }: { className?: string }) {
    return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>;
}

function StatCard({ title, value, icon: Icon, colorClass }: any) {
  return (
    <motion.div 
      whileHover={{ y: -5, transition: { duration: 0.2 } }} 
      className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-green-50 flex items-center justify-between group overflow-hidden relative"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-50 to-transparent -mr-12 -mt-12 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500" />
      
      <div className="relative z-10">
        <p className="text-sm font-medium text-gray-400 mb-1">{title}</p>
        <h3 className="text-3xl font-black text-gray-800">{value}</h3>
      </div>
      
      <div className={`p-4 rounded-2xl ${colorClass} relative z-10 group-hover:rotate-12 transition-transform`}>
        <Icon className="w-6 h-6" />
      </div>
    </motion.div>
  );
}

function DeviceCard({ name, status, crop_type, location, isSelected }: any) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`p-5 rounded-[2rem] border transition-all duration-300 flex justify-between items-center group cursor-pointer ${
        isSelected 
          ? "bg-green-600 border-green-600 shadow-xl shadow-green-100 text-white" 
          : "bg-white border-gray-50 shadow-sm hover:shadow-md text-gray-800"
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-2xl transition-colors ${
          isSelected ? "bg-white/20 text-white" : "bg-green-50 text-green-600"
        }`}>
          <Cpu className="w-5 h-5" />
        </div>
        <div>
          <h4 className={`font-black uppercase text-xs tracking-widest ${isSelected ? "text-white" : "text-gray-800"}`}>{name}</h4>
          <p className={`text-[10px] font-bold ${isSelected ? "text-green-100" : "text-gray-400"}`}>Loc: {location} · {crop_type}</p>
        </div>
      </div>
      <div className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${
        isSelected
          ? "bg-white/20 text-white"
          : (status === "online" ? "bg-green-100 text-green-700 animate-pulse" : "bg-red-50 text-red-600")
      }`}>
        <div className={`w-1.5 h-1.5 rounded-full ${
          isSelected ? "bg-white" : (status === "online" ? "bg-green-600" : "bg-red-600")
        }`} />
        {status}
      </div>
    </motion.div>
  );
}


function MiniChart({ data, color = "#10b981", label, height = 60 }: { data: number[], color?: string, label: string, height?: number }) {
  if (!data || data.length === 0) return <div className="h-20 flex items-center justify-center text-gray-300 italic">No data available</div>;

  const max = Math.max(...data, 100);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * 100;
    const y = 100 - ((d - min) / range) * 100;
    return `${x},${y}`;
  }).join(" ");
  
  const area = `0,100 ${points} 100,100`;

  return (
    <div className="relative w-full mt-2" style={{ height }}>
      <div className="absolute -top-1 right-0 flex flex-col items-end gap-0 pr-1">
         <span className="text-base font-black text-gray-800 leading-tight">{data[data.length-1]?.toFixed(1)}</span>
         <span className="text-[8px] font-bold text-gray-300 uppercase tracking-wider">{label}</span>
      </div>
      <svg viewBox="0 0 100 100" className="w-full h-full preserve-3d" preserveAspectRatio="none">

        <defs>
          <linearGradient id={`${label}-gradient`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <motion.polygon 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          points={area} 
          fill={`url(#${label}-gradient)`}
        />
        <motion.polyline 
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5 }}
          points={points} 
          fill="none" 
          stroke={color} 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        
        {/* Real-time dot */}
        <motion.circle
          cx={100}
          cy={100 - ((data[data.length-1] - min) / range) * 100}
          r="3"
          fill={color}
          initial={{ scale: 0 }}
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      </svg>
    </div>
  );
}


// --- Main Dashboard ---

export default function Dashboard() {
  const router = useRouter();
  const [summary, setSummary] = useState<any>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [recentReadings, setRecentReadings] = useState<any[]>([]);
  const [sensorReadings, setSensorReadings] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);



  // Modal & Toast States
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
    message: "",
    type: "info",
    isVisible: false,
  });

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type, isVisible: true });
  };



  const fetchDashboardData = async () => {
    setIsRefreshing(true);
    try {
      // Fetch data from backend only
      const token = getToken();
      if (!token) {
        console.error('No authentication token found. Please login first.');
        router.push('/auth');
        return;
      }

      try {
        // Fetch real data from backend
        const [summaryRes, devicesRes] = await Promise.all([
          fetchWithAuth("/api/analytics/summary"),
          fetchWithAuth("/api/devices/")
        ]);

        if (!summaryRes.ok) {
          throw new Error(`Analytics API failed: ${summaryRes.status}`);
        }
        if (!devicesRes.ok) {
          throw new Error(`Devices API failed: ${devicesRes.status}`);
        }

        const summaryData = await summaryRes.json();
        const devicesData = await devicesRes.json();

        console.log('Successfully fetched backend data');
        setSummary(summaryData.data);
        setDevices(devicesData.data);
        
        // Use either the selected device or the first device in the list
        const activeDevice = selectedDeviceId || (devicesData.data.length > 0 ? devicesData.data[0].device_id : null);
        
        if (activeDevice) {
          if (!selectedDeviceId) setSelectedDeviceId(activeDevice);
          
          // Fetch history, alerts, and create new prediction in parallel
          const [historyRes, alertsRes, predictionRes] = await Promise.all([
            fetchWithAuth(`/api/sensors/history/${activeDevice}?limit=10`),
            fetchWithAuth(`/api/sensors/alerts/${activeDevice}`),
            fetchWithAuth(`/api/predictions/recompute/${activeDevice}`, { method: "POST" })
          ]);
          
          if (historyRes.ok) {
            const historyJson = await historyRes.json();

            const readings = (historyJson.data || []).reverse();
            setSensorReadings(readings);
            setRecentReadings(readings.map((r: any) => r.temperature));
          }

          if (alertsRes.ok) {
            const alertsJson = await alertsRes.json();
            setAlerts(alertsJson.data || []);
          }

          if (predictionRes.ok) {
            const predJson = await predictionRes.json();
            setPrediction(predJson.data);
          }
        }


      } catch (error) {
        console.error('Failed to fetch data from backend:', error);
        throw error; // Let the error boundary handle it
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };


  useEffect(() => {
    // Check if user is authenticated before fetching data
    const token = getToken();
    if (!token) {
      console.error('No authentication token found. Redirecting to login.');
      router.push('/auth');
      return;
    }
    
    fetchDashboardData();
    
    // Auto-refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [selectedDeviceId]);

  const handleLogout = () => {
    removeToken();
    router.push("/auth");
  };

  const handleRegisterDevice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsActionLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = {
        device_id: formData.get("device_id"),
        name: formData.get("name"),
        crop_type: formData.get("crop_type"),
        location: formData.get("location"),
    };

    try {
        const res = await fetchWithAuth("/api/devices/register", {
            method: "POST",
            body: JSON.stringify(data),
        });
        if (res.ok) {
            showToast("Device registered successfully!", "success");
            setIsRegisterModalOpen(false);
            // After registration, select the new device automatically
            setSelectedDeviceId(data.device_id as string);
            fetchDashboardData();
        } else {
            const err = await res.json();
            showToast(err.message || "Registration failed", "error");
        }
    } catch (err) {
        showToast("Network error occurred", "error");
    } finally {
        setIsActionLoading(false);
    }
  };

  const handleExportData = async () => {

    if (!selectedDeviceId) return;
    setIsActionLoading(true);
    try {
        const res = await fetchWithAuth(`/api/sensors/history/${selectedDeviceId}?limit=50`);
        if (res.ok) {
            const json = await res.json();
            const data = json.data || [];
            if (data.length === 0) {
                showToast("No data to export", "info");
                return;
            }
            // Convert to CSV with sanitization
            const cleanData = data.map((item: any) => {
                const { _id, ...rest } = item;
                return rest;
            });
            const headers = Object.keys(cleanData[0]).join(",");
            const rows = cleanData.map((row: any) => 
                Object.values(row).map(val => `"${val}"`).join(",")
            ).join("\n");
            const csv = `${headers}\n${rows}`;

            
            const blob = new Blob([csv], { type: "text/csv" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `CropSense_Export_${selectedDeviceId}.csv`;
            a.click();
            showToast("Sensor data exported successfully", "success");
        }
    } catch (err) {
        showToast("Export failed", "error");
    } finally {
        setIsActionLoading(false);
    }
  };

  const handleDeviceSelect = async (deviceId: string, deviceName: string) => {
    setSelectedDeviceId(deviceId);
    showToast(`Monitoring ${deviceName}`, "info");
    
    // Trigger new prediction computation for the selected device
    try {
      const predictionRes = await fetchWithAuth(`/api/predictions/recompute/${deviceId}`, { method: "POST" });
      if (predictionRes.ok) {
        const predJson = await predictionRes.json();
        setPrediction(predJson.data);
        console.log(`New prediction computed for ${deviceId}: ${predJson.data.health_score}%`);
        showToast(`Health score updated: ${predJson.data.health_score}%`, "success");
      }
    } catch (error) {
      console.error('Failed to compute prediction:', error);
      showToast("Failed to update health score", "error");
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-10">
        <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
            <Leaf className="w-12 h-12 text-green-500" />
        </motion.div>
        <p className="mt-4 text-green-700 font-bold tracking-widest animate-pulse">GROWING YOUR DATA...</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#f8faf7] text-gray-800 p-4 md:p-10 font-sans selection:bg-green-200">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <div className="bg-green-600 p-2 rounded-xl shadow-lg shadow-green-200">
               <Leaf className="text-white w-6 h-6" />
             </div>
             <h1 className="text-3xl font-black tracking-tighter text-gray-900 uppercase">
                Crop<span className="text-green-600 underline decoration-green-300 decoration-4 underline-offset-4">Sense</span>
             </h1>
          </div>
          <p className="text-gray-400 font-medium ml-1">Real-time farm intelligent monitoring</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={fetchDashboardData}
            className={`p-3 rounded-xl transition-colors ${isRefreshing ? "bg-green-100 text-green-600" : "bg-gray-50 text-gray-400 hover:bg-gray-100"}`}
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
          </motion.button>
          
          <button className="relative p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 transition-colors group">
            <Bell className="w-5 h-5 group-hover:rotate-12" />
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full" />
          </button>
          
          <div className="h-8 w-[1px] bg-gray-100 mx-1" />
          
          <div className="flex items-center gap-3 hover:bg-gray-50 py-1 px-3 rounded-xl transition-colors cursor-pointer group">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md group-hover:scale-110 transition-transform">
               <UserIcon className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Administrator</p>
               <button onClick={handleLogout} className="text-sm font-black text-red-500 flex items-center gap-1 hover:text-red-600 group">
                  Logout <LogOut className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
               </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard 
            title="Total Devices" 
            value={summary?.total_devices || 0} 
            icon={Cpu} 
            colorClass="bg-blue-50 text-blue-500" 
        />
        <StatCard 
            title="Avg Health Score" 
            value={`${summary?.avg_health_score || 0}%`} 
            icon={Activity} 
            colorClass="bg-green-50 text-green-500" 
        />
        <StatCard 
            title="Soil Moisture" 
            value={`${summary?.avg_soil_moisture || 0}%`} 
            icon={Droplets} 
            colorClass="bg-indigo-50 text-indigo-500" 
        />
        <StatCard 
            title="Total Alerts" 
            value={alerts.length} 
            icon={AlertTriangle} 
            colorClass="bg-rose-50 text-rose-500" 
        />

      </div>

      {/* Middle Section: Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 group transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-orange-50 rounded-lg text-orange-500"><Thermometer className="w-4 h-4" /></div>
                        <h3 className="font-black text-gray-800 uppercase tracking-widest text-[11px]">Temp Trend</h3>
                    </div>
                </div>
                <MiniChart data={recentReadings} color="#f97316" label="Celsius" height={70} />
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 group transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-blue-50 rounded-lg text-blue-500"><Droplets className="w-4 h-4" /></div>
                        <h3 className="font-black text-gray-800 uppercase tracking-widest text-[11px]">Humidity Trend</h3>
                    </div>
                </div>
                <MiniChart data={sensorReadings.length > 0 ? sensorReadings.map((r: any) => r.humidity) : []} color="#3b82f6" label="Percent" height={70} />
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 group transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-500"><Waves className="w-4 h-4" /></div>
                        <h3 className="font-black text-gray-800 uppercase tracking-widest text-[11px]">Moisture Trend</h3>
                    </div>
                </div>
                <MiniChart data={sensorReadings.length > 0 ? sensorReadings.map((r: any) => r.soil_moisture) : []} color="#6366f1" label="Percent" height={70} />
            </div>

            <div className="bg-white md:col-span-2 lg:col-span-3 rounded-2xl p-5 shadow-sm border border-gray-100 overflow-hidden relative group transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-green-50 rounded-lg text-green-500"><BarChart3 className="w-5 h-5" /></div>
                        <h3 className="font-black text-gray-800 uppercase tracking-widest text-[11px]">Live System Health</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Real-time ML</span>
                    </div>
                </div>
                <MiniChart data={sensorReadings.length > 0 ? sensorReadings.map((r: any) => r.health_score) : []} color="#10b981" label="Health %" height={100} />
            </div>

        </div>

        {/* Sidebar: Alerts & Actions */}
        <div className="flex flex-col gap-8">
            {/* Quick Actions */}
            <div className="bg-green-900 rounded-[2.5rem] p-8 shadow-2xl text-white">
                <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                   Quick Actions <div className="w-2 h-2 bg-green-400 rounded-full animate-ping" />
                </h3>
                <div className="grid grid-cols-1 gap-4">
                   <button 
                    onClick={() => setIsRegisterModalOpen(true)}
                    className="flex items-center gap-4 bg-white/10 hover:bg-white/20 p-4 rounded-2xl transition-all border border-white/5 active:scale-95 group text-left"
                   >
                      <div className="p-2 bg-green-500 rounded-xl"><Plus className="w-5 h-5" /></div>
                      <span className="font-bold">Register Device</span>
                   </button>
                   <button 
                    onClick={() => setIsReportModalOpen(true)}
                    className="flex items-center gap-4 bg-white/10 hover:bg-white/20 p-4 rounded-2xl transition-all border border-white/5 active:scale-95 group text-left"
                   >
                      <div className="p-2 bg-blue-500 rounded-xl"><FileText className="w-5 h-5" /></div>
                      <span className="font-bold">Generate Reports</span>
                   </button>
                                      <button 
                    onClick={handleExportData}
                    className="flex items-center gap-4 bg-white/10 hover:bg-white/20 p-4 rounded-2xl transition-all border border-white/5 active:scale-95 group text-left"
                   >
                      <div className="p-2 bg-orange-500 rounded-xl"><Download className="w-5 h-5" /></div>
                      <span className="font-bold">Export Sensor Data</span>
                   </button>

                </div>

            </div>

            {/* Notifications / Alerts */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex-grow">
                <h3 className="font-black text-gray-800 uppercase tracking-widest text-sm mb-6 flex items-center justify-between">
                   AI Analysis & Predictions
                   <span className="bg-green-50 text-green-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Live Engine</span>
                </h3>
                                {prediction ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center gap-6 p-6 bg-gray-50 rounded-[2rem]">
                            <div className="relative w-24 h-24 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="48" cy="48" r="38" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-100" />
                                    <circle cx="48" cy="48" r="38" stroke="currentColor" strokeWidth="8" fill="transparent" 
                                        strokeDasharray={238.64} 
                                        strokeDashoffset={238.64 - (238.64 * (prediction.health_score || 0)) / 100} 
                                        className="text-green-500 transition-all duration-1000" 
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute flex flex-col items-center justify-center">
                                    <span className="text-xl font-black text-gray-800 leading-none">{prediction.health_score}%</span>
                                    <span className="text-[7px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">Health</span>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-black text-gray-800 uppercase tracking-tighter text-lg">Health Score</h4>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Predicted for {selectedDeviceId}</p>
                            </div>
                        </div>

                        <div className="p-6 bg-green-600 rounded-[2rem] text-white shadow-xl shadow-green-100 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-20"><Activity className="w-12 h-12" /></div>
                            <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-black uppercase tracking-widest text-[10px] opacity-80">AI ADVICE</h4>
                                {prediction.is_partial && (
                                    <span className="bg-white/20 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">Manual Data</span>
                                )}
                            </div>
                            <p className="font-bold text-sm leading-relaxed relative z-10 italic mb-4">
                                "{prediction.recommendation || 'Analyzing environmental conditions...'}"
                            </p>
                            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-white/20 relative z-10">
                                <div className="text-[9px] font-black uppercase tracking-widest opacity-60">Engine: {prediction.model_used || 'GPT-Crop'}</div>
                                <div className="text-[9px] font-black uppercase tracking-widest opacity-60 text-right">Confidence: High</div>
                            </div>
                        </div>

                    </motion.div>
                ) : (
                    <div className="text-center py-10 px-6">
                        <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-gray-300">
                            <Activity className="w-8 h-8 animate-pulse" />
                        </div>
                        <h4 className="font-black text-gray-800 uppercase tracking-tighter mb-1">Intelligence Idle</h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                            No sensor history detected for this device. Connect hardware via Serial Bridge to trigger automated analysis.
                        </p>
                    </div>
                )}
            </div>

            {/* Hardware Status Indicator */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mt-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${sensorReadings.length > 0 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-gray-300'} animate-pulse`} />
                        <div>
                           <p className="text-[10px] font-black text-gray-800 uppercase tracking-widest">Serial Bridge</p>
                           <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                               {sensorReadings.length > 0 ? 'Data Flowing (COM3)' : 'Waiting for Input'}
                           </p>
                        </div>
                    </div>
                    <Terminal className="w-4 h-4 text-gray-400" />
                </div>
            </div>


            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex-grow mt-6">
                <h3 className="font-black text-gray-800 uppercase tracking-widest text-sm mb-6 flex items-center justify-between">
                   Recent Incidents 
                   {alerts.length > 0 && (
                       <span className={`px-3 py-1 rounded-full text-[10px] font-black ${
                           alerts.some(a => a.severity === 'critical') ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500'
                       }`}>
                           {alerts.length} ACTIVE
                       </span>
                   )}
                </h3>
                <div className="space-y-4">
                   {alerts.length === 0 ? (
                       <div className="text-center py-8">
                           <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                               <CheckCircle2 className="w-6 h-6 text-green-500" />
                           </div>
                           <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">System Clear</p>
                       </div>
                   ) : (
                       alerts.map((alert, idx) => (
                           <motion.div 
                            key={idx}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`flex gap-4 p-4 rounded-2xl border transition-all hover:translate-x-2 ${
                                alert.severity === 'critical' ? 'bg-rose-50/50 border-rose-100' : 'bg-amber-50/50 border-amber-100'
                            }`}
                           >
                               <div className="p-2 h-fit bg-white rounded-xl shadow-sm">
                                   <AlertTriangle className={`${alert.severity === 'critical' ? 'text-rose-500' : 'text-amber-500'} w-5 h-5`} />
                               </div>
                               <div>
                                  <p className="font-black text-gray-800 text-sm tracking-tight">{alert.type}: {alert.device_id}</p>
                                  <p className={`text-[10px] font-bold ${alert.severity === 'critical' ? 'text-rose-400' : 'text-amber-500'}`}>
                                      {alert.message}
                                  </p>
                               </div>
                           </motion.div>
                       ))
                   )}
                </div>
            </div>


        </div>
      </div>

      {/* Bottom Section: Active Devices List */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
               <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Active Sensor Network</h3>
               <p className="text-gray-400 font-medium">Monitoring your devices in 4 locations</p>
            </div>
            <button className="bg-gray-50 text-gray-800 font-bold px-6 py-3 rounded-2xl hover:bg-gray-100 transition-all flex items-center gap-2">
                Manage Devices <ArrowRight className="w-4 h-4" />
            </button>
         </div>
         
         {devices.length === 0 ? (
             <div className="bg-gray-50 rounded-3xl p-12 text-center border-2 border-dashed border-gray-200">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                   <Plus className="w-8 h-8 text-gray-300" />
                </div>
                <h4 className="text-xl font-bold text-gray-400">No Devices Linked</h4>
                <p className="text-gray-400 max-w-xs mx-auto mt-2 italic text-sm">Get started by registering your first IoT sensor to begin real-time monitoring.</p>
             </div>
         ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                 {devices.map((device, idx) => (
                    <div key={idx} onClick={() => handleDeviceSelect(device.device_id, device.name || device.device_id)}>
                        <DeviceCard 
                            name={device.name || device.device_id} 
                            status={device.status || "online"} 
                            crop_type={device.crop_type}
                            location={device.location}
                            isSelected={selectedDeviceId === device.device_id}
                        />
                    </div>
                 ))}
             </div>

         )}
      </div>

      {/* Sub-footer Message */}
      <footer className="mt-10 text-center text-gray-400 text-xs font-medium pb-4">
          © 2024 CropSense Intelligent Systems • All sensors reporting via secure IoT gateway
      </footer>

      </div>

      {/* --- Modals & Overlays --- */}

      <Modal 
        isOpen={isRegisterModalOpen} 
        onClose={() => setIsRegisterModalOpen(false)} 
        title="Register New Sensor"
      >
        <form className="space-y-4" onSubmit={handleRegisterDevice}>

            <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Device ID</label>
                <input name="device_id" required className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3 focus:ring-2 focus:ring-green-500 transition-all outline-none" placeholder="e.g. SENSOR-99" />
            </div>
            <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Device Name</label>
                <input name="name" required className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3 focus:ring-2 focus:ring-green-500 transition-all outline-none" placeholder="e.g. North Hub" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Crop Type</label>
                    <select 
                      name="crop_type" 
                      required 
                      className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3 focus:ring-2 focus:ring-green-500 transition-all outline-none appearance-none cursor-pointer font-bold text-sm"
                    >
                        <option value="Wheat">Wheat</option>
                        <option value="Rice">Rice</option>
                        <option value="Corn">Corn (Maize)</option>
                        <option value="Pulses">Pulses</option>
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Location</label>
                    <input name="location" required className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3 focus:ring-2 focus:ring-green-500 transition-all outline-none" placeholder="Sector 1" />
                </div>
            </div>
            <button 
                type="submit" 
                disabled={isActionLoading}
                className="w-full bg-gray-900 text-white font-black py-4 rounded-3xl hover:bg-green-600 transition-all shadow-xl shadow-gray-200 uppercase tracking-widest disabled:opacity-50"
            >
                {isActionLoading ? "Processing..." : "Register Device"}
            </button>
        </form>
      </Modal>

      <Modal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        title="Comprehensive Crop Health Report"
      >
        <div className="space-y-6">
            <div className="flex justify-between items-center p-6 bg-gray-50 rounded-3xl border border-gray-100">
                <div>
                    <h4 className="font-black text-gray-800 uppercase tracking-tighter">Unified Summary</h4>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{selectedDeviceId} · {new Date().toLocaleDateString()}</p>
                </div>
                <div className="p-3 bg-green-500 text-white rounded-2xl shadow-lg shadow-green-100">
                    <Leaf className="w-6 h-6" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-white border border-gray-100 rounded-3xl">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Health Score</p>
                    <p className="text-2xl font-black text-green-600">{prediction?.health_score || '--'}%</p>
                </div>
                <div className="p-5 bg-white border border-gray-100 rounded-3xl">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Active Alerts</p>
                    <p className="text-2xl font-black text-rose-500">{alerts.length}</p>
                </div>
            </div>

            <div className="p-6 bg-gray-900 rounded-3xl text-white">
                <h5 className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-3 flex items-center gap-2">
                    <Activity className="w-3 h-3" /> System Recommendation
                </h5>
                <p className="font-bold text-sm leading-relaxed italic">
                    "{prediction?.recommendation || 'Gathering more data points for a detailed analysis...'}"
                </p>
            </div>

            <div className="space-y-3">
                <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Key Metrics</h5>
                <div className="space-y-2">
                    {sensorReadings.slice(0, 3).map((r, i) => (
                        <div key={i} className="flex justify-between items-center p-3 text-xs font-bold text-gray-600 border-b border-gray-50">
                            <span>Reading #{i+1}</span>
                            <span className="text-gray-900">{r.temperature}°C / {r.humidity}%</span>
                        </div>
                    ))}
                </div>
            </div>

            <button 
                onClick={() => {
                    window.print();
                    showToast("Report print ready", "success");
                }}
                className="w-full bg-gray-100 text-gray-900 font-black py-4 rounded-3xl hover:bg-gray-200 transition-all uppercase tracking-widest text-xs"
            >
                Download PDF / Print
            </button>
        </div>
      </Modal>

      <Toast 
        message={toast.message} 
        type={toast.type} 
        isVisible={toast.isVisible} 
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
      />

    </ErrorBoundary>
  );
}



"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Leaf, 
  LogOut, 
  Cpu,
  RefreshCw,
  Loader2,
  Thermometer,
  Droplets,
  AlertCircle,
  CheckCircle2,
  Plus,
  Activity,
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  Settings,
  Waves,
} from "lucide-react";
import { fetchWithAuth } from "@/lib/api";
import { removeToken, getToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Modal } from "@/components/Modal";
import { Toast, ToastType } from "@/components/Toast";
import { TrendChart } from "@/components/TrendChart";
import { ReportGenerator } from "@/components/ReportGenerator";

const CROP_TYPES = [
  { id: "rice", name: "Rice", emoji: "🌾" },
  { id: "wheat", name: "Wheat", emoji: "🌾" },
  { id: "maize", name: "Maize", emoji: "🌽" },
  { id: "vegetables", name: "Vegetables", emoji: "🥕" },
  { id: "pulses", name: "Pulses", emoji: "🫘" },
];

// --- Premium Stat Card Component ---
function StatCard({ title, value, icon: Icon, colorClass, delay = 0 }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -8, scale: 1.02 }} 
      className="bg-white/90 backdrop-blur-2xl rounded-[2.5rem] p-8 shadow-sm border border-green-50 flex flex-col justify-between group overflow-hidden relative min-h-[180px]"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-50 to-transparent -mr-16 -mt-16 rounded-full opacity-30 group-hover:scale-150 transition-transform duration-700" />
      
      <div className="flex justify-between items-start relative z-10">
        <div className={`p-4 rounded-2xl ${colorClass} shadow-sm group-hover:shadow-lg transition-all duration-500`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex flex-col items-end">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{title}</p>
          <div className="w-12 h-1 bg-gray-50 rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "60%" }}
                    className="h-full bg-green-500/20"
                />
          </div>
        </div>
      </div>
      
      <div className="relative z-10 mt-6">
        <h3 className="text-4xl font-black text-gray-900 tracking-tighter">{value || "—"}</h3>
      </div>
    </motion.div>
  );
}

// --- Device Card Component ---
function DeviceCard({ device, name, status, crop_type, location, isSelected, onSelect }: any) {
  const resolvedDeviceId = device?.device_id || "";
  const resolvedName =
    device?.device_name ||
    device?.name ||
    name ||
    resolvedDeviceId ||
    "Unknown Device";
  const resolvedType = device?.device_type || device?.crop_type || crop_type || "unknown";
  
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect && resolvedDeviceId && onSelect(resolvedDeviceId)}
      className={`relative w-full p-6 rounded-[2rem] border-2 transition-all duration-500 text-left overflow-hidden ${
        isSelected 
          ? "bg-gray-900 border-gray-900 shadow-2xl shadow-gray-200 text-white" 
          : "bg-white border-gray-50 shadow-sm hover:shadow-xl hover:border-green-100 text-gray-800"
      }`}
    >
      {isSelected && (
          <motion.div 
            layoutId="active-bg"
            className="absolute inset-0 bg-gradient-to-br from-green-600 to-green-800 opacity-90 -z-10"
          />
      )}
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-2xl transition-colors duration-500 ${
          isSelected ? "bg-white/20 text-white" : "bg-green-50 text-green-600"
        }`}>
          <Cpu className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-black text-xs uppercase tracking-[0.15em] mb-1">{resolvedName}</h3>
          <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-green-400" : "bg-green-500"} animate-pulse`} />
                <p className={`text-[10px] font-bold uppercase tracking-widest ${isSelected ? "text-green-100" : "text-gray-400"}`}>
                    {resolvedType} • online
                </p>
          </div>
        </div>
        {isSelected && <CheckCircle2 className="w-5 h-5 text-green-300" />}
      </div>
    </motion.button>
  );
}

// --- Main Dashboard ---
function DashboardContent() {
  const router = useRouter();
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [sensorReadings, setSensorReadings] = useState<any[]>([]);
  const [prediction, setPrediction] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddingDevice, setIsAddingDevice] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
    message: "", type: "info", isVisible: false,
  });
  const selectedDeviceIdRef = useRef<string | null>(null);
  const fetchRequestIdRef = useRef(0);

  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ message, type, isVisible: true });
  }, []);

  useEffect(() => {
    selectedDeviceIdRef.current = selectedDeviceId;
  }, [selectedDeviceId]);

  const formatMetric = (value: unknown, suffix: string, digits: number = 1) => {
    if (typeof value !== "number" || Number.isNaN(value)) return "—";
    return `${value.toFixed(digits)}${suffix}`;
  };

  const fetchDashboardData = useCallback(async (overrideDeviceId?: string) => {
    const requestId = ++fetchRequestIdRef.current;
    try {
      setIsRefreshing(true);
      const token = getToken();
      if (!token) {
        router.push("/auth");
        return;
      }

      const [devicesRes, summaryRes] = await Promise.all([
        fetchWithAuth("/api/devices/"),
        fetchWithAuth("/api/analytics/summary"),
      ]);

      if (!devicesRes.ok) throw new Error("Failed to fetch devices");
      const devicesData = await devicesRes.json();
      const deviceList = devicesData.data || [];
      if (requestId !== fetchRequestIdRef.current) return;
      setDevices(deviceList);

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        if (requestId !== fetchRequestIdRef.current) return;
        setSummary(summaryData.data || null);
      }

      let activeDeviceId: string | null = overrideDeviceId || null;
      if (!activeDeviceId) {
        const activeRes = await fetchWithAuth("/api/sessions/get-active-device");
        if (activeRes.ok) {
          const activeData = await activeRes.json();
          activeDeviceId = activeData.data?.active_device_id || null;
        }
      }

      if (!activeDeviceId) {
        activeDeviceId = selectedDeviceIdRef.current || (deviceList.length > 0 ? deviceList[0].device_id : null);
      }

      if (activeDeviceId) {
        if (activeDeviceId !== selectedDeviceIdRef.current) {
          setSelectedDeviceId(activeDeviceId);
          selectedDeviceIdRef.current = activeDeviceId;
        }

        const [historyRes, alertsRes] = await Promise.all([
          fetchWithAuth(`/api/sensors/history/${activeDeviceId}?limit=20`),
          fetchWithAuth(`/api/sensors/alerts/${activeDeviceId}?limit=20`),
        ]);

        if (historyRes.ok) {
          const historyData = await historyRes.json();
          if (requestId !== fetchRequestIdRef.current) return;
          const readings = (historyData.data || []).reverse();
          setSensorReadings(readings);

          if (readings.length > 0) {
            const predRes = await fetchWithAuth(`/api/predictions/recompute/${activeDeviceId}`, {
              method: "POST"
            });
            if (predRes.ok) {
              const predData = await predRes.json();
              if (requestId !== fetchRequestIdRef.current) return;
              setPrediction(predData.data);
            }
          }
        }

        if (alertsRes.ok) {
          const alertsData = await alertsRes.json();
          if (requestId !== fetchRequestIdRef.current) return;
          setAlerts(alertsData.data || []);
        }
      }
    } catch (error: any) {
      console.error("Dashboard data fetch failed:", error);
      showToast("Failed to load dashboard", "error");
    } finally {
      if (requestId === fetchRequestIdRef.current) {
        setLoading(false);
        setTimeout(() => setIsRefreshing(false), 500); // Smooth transition
      }
    }
  }, [router, showToast]);

  const handleSelectDevice = async (deviceId: string) => {
    const previousDeviceId = selectedDeviceIdRef.current;
    try {
      setSelectedDeviceId(deviceId);
      selectedDeviceIdRef.current = deviceId;
      const setActiveRes = await fetchWithAuth("/api/sessions/set-active-device", {
        method: "POST",
        body: JSON.stringify({ device_id: deviceId })
      });
      if (!setActiveRes.ok) throw new Error("Failed to set active device");
      const deviceName = devices.find(d => d.device_id === deviceId)?.device_name || deviceId;
      showToast(`${deviceName} activated!`, "success");
      await fetchDashboardData(deviceId);
    } catch (error) {
      showToast("Failed to switch device", "error");
      setSelectedDeviceId(previousDeviceId);
      selectedDeviceIdRef.current = previousDeviceId;
    }
  };

  const handleAddDevice = async (cropType: string) => {
    setIsAddingDevice(true);
    try {
      const response = await fetchWithAuth("/api/devices/create", {
        method: "POST",
        body: JSON.stringify({ crop_type: cropType }),
      });
      if (!response.ok) throw new Error("Failed to create device");
      const newDeviceData = await response.json();
      showToast("Device created successfully!", "success");
      setIsAddModalOpen(false);
      setTimeout(() => {
        if (newDeviceData.data?.device_id) {
          handleSelectDevice(newDeviceData.data.device_id);
        } else {
          fetchDashboardData();
        }
      }, 300);
    } catch (error: any) {
      showToast(error.message || "Failed to add device", "error");
    } finally {
      setIsAddingDevice(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => fetchDashboardData(), 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}>
          <Loader2 className="w-12 h-12 text-green-600" />
        </motion.div>
      </div>
    );
  }

  const latestReading = sensorReadings[sensorReadings.length - 1];
  const totalAlertCount = alerts.reduce(
    (count, row) => count + (Array.isArray(row?.alerts) ? row.alerts.length : 0),
    0
  );

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-12 font-sans selection:bg-green-100 selection:text-green-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-16">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-green-600 rounded-3xl shadow-xl shadow-green-100">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Market Dashboard</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Real-time Precision Agriculture Engine</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-2 rounded-[2rem] shadow-sm border border-gray-100">
          <button 
            onClick={() => fetchDashboardData()}
            className="p-3 hover:bg-gray-50 rounded-2xl transition-all duration-300 relative group"
            title="Refresh Analysis"
          >
            <RefreshCw className={`w-5 h-5 text-gray-500 ${isRefreshing ? "animate-spin text-green-600" : "group-hover:rotate-180"}`} />
          </button>
          <div className="w-px h-6 bg-gray-100" />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              removeToken();
              router.push("/auth");
            }}
            className="flex items-center gap-3 px-6 py-3 bg-red-50 hover:bg-red-100 rounded-2xl text-red-600 font-black text-xs uppercase tracking-widest transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar - Devices */}
        <div className="lg:col-span-3 space-y-8">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Active Assets</h2>
            <motion.button
              whileHover={{ rotate: 90 }}
              onClick={() => setIsAddModalOpen(true)}
              className="p-1.5 bg-green-100 text-green-600 rounded-lg"
            >
              <Plus className="w-4 h-4" />
            </motion.button>
          </div>
          
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {devices.map(device => (
              <DeviceCard
                key={device.device_id}
                device={device}
                isSelected={selectedDeviceId === device.device_id}
                onSelect={handleSelectDevice}
              />
            ))}
            {devices.length === 0 && (
              <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">No Devices</p>
                <Plus className="w-8 h-8 text-gray-200 mx-auto" />
              </div>
            )}
          </div>

          <ReportGenerator 
            device={devices.find(d => d.device_id === selectedDeviceId)}
            latestReading={latestReading}
            prediction={prediction}
            summary={summary}
          />
        </div>

        {/* Main Panel */}
        <div className="lg:col-span-9 space-y-8">
          {/* KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <StatCard 
              title="Current Temp" 
              value={formatMetric(latestReading?.temperature, "°C")} 
              icon={Thermometer} 
              colorClass="bg-rose-50 text-rose-500"
              delay={0.1}
            />
            <StatCard 
              title="Air Humidity" 
              value={formatMetric(latestReading?.humidity, "%")} 
              icon={Waves} 
              colorClass="bg-blue-50 text-blue-500"
              delay={0.2}
            />
            <StatCard 
              title="Soil Moisture" 
              value={formatMetric(latestReading?.soil_moisture, "%")} 
              icon={Droplets} 
              colorClass="bg-cyan-50 text-cyan-500"
              delay={0.3}
            />
            <StatCard 
              title="Global Health" 
              value={formatMetric(prediction?.health_score, "%", 0)} 
              icon={Activity} 
              colorClass="bg-emerald-50 text-emerald-500"
              delay={0.4}
            />
          </div>

          {/* Large Trend Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/90 backdrop-blur-xl rounded-[3rem] p-10 shadow-sm border border-green-50"
          >
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Environmental Trends</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Last 24 Analysis Cycle</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-rose-500" />
                        <span className="text-[10px] uppercase font-black text-gray-500">Temp</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-[10px] uppercase font-black text-gray-500">Humid</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-cyan-500" />
                        <span className="text-[10px] uppercase font-black text-gray-500">Soil</span>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
              <TrendChart data={sensorReadings} dataKey="temperature" label="Temp" color="#f43f5e" unit="°C" />
              <TrendChart data={sensorReadings} dataKey="humidity" label="Humid" color="#3b82f6" unit="%" />
              <TrendChart data={sensorReadings} dataKey="soil_moisture" label="Soil" color="#06b6d4" unit="%" />
            </div>
          </motion.div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* AI Insight Card */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gray-900 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-125 transition-transform duration-1000">
                <BrainCircuit className="w-48 h-48 text-white" />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-white/10 rounded-2xl text-green-400">
                    <BrainCircuit className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">AI Predictions</h3>
                </div>

                {prediction ? (
                  <div className="space-y-8">
                    <div className="flex flex-wrap gap-3">
                      <div className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3" />
                        {prediction.irrigation_needed === 1 ? "Irrigation Required" : "Moisture Optimal"}
                      </div>
                      <div className="px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-[10px] font-black uppercase tracking-widest">
                        ML Model Active
                      </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] uppercase font-black text-white/40 tracking-[0.2em]">Rule-Based Verdict</span>
                        </div>
                        <p className="text-lg text-white font-medium leading-relaxed italic">
                        "{prediction.recommendation || "System is aggregating environmental data patterns."}"
                        </p>
                    </div>
                    
                    <div className="pt-6 border-t border-white/10 grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] uppercase font-bold text-white/40 mb-1">Health Score Logic</p>
                            <p className="text-xs font-black text-green-400">Deterministic Rules</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-white/40 mb-1">Irrigation Engine</p>
                            <p className="text-xs font-black text-blue-400">Logistic Regression</p>
                        </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-white/40 text-sm font-medium animate-pulse">Initializing neural pattern matching...</div>
                )}
              </div>
            </motion.div>

            {/* System Status / Summary */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white rounded-[3rem] p-10 shadow-sm border border-gray-100"
            >
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-gray-50 rounded-2xl text-gray-500 border border-gray-100">
                        <Settings className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Fleet Analytics</h3>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Global Assets</p>
                        <p className="text-2xl font-black text-gray-900">{summary?.total_devices || "0"}</p>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Critical Alerts</p>
                        <p className="text-2xl font-black text-rose-500">{totalAlertCount}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-[10px] uppercase font-black text-gray-400 tracking-widest pl-1">Live Telemetry Log</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                        {sensorReadings.slice(-5).reverse().map((r, i) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-gray-50/50 rounded-xl border border-gray-50">
                                <span className="text-[10px] font-black text-gray-400">{new Date(r.timestamp).toLocaleTimeString()}</span>
                                <span className="text-[10px] font-bold text-gray-700">{r.temperature.toFixed(1)}°C • {r.humidity.toFixed(1)}% • {r.soil_moisture.toFixed(1)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
          </div>
        </div>
      </div>

      <AddDeviceModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddDevice={handleAddDevice}
        isLoading={isAddingDevice}
      />

      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}

// --- Add Device Modal (Updated styling) ---
function AddDeviceModal({ isOpen, onClose, onAddDevice, isLoading }: any) {
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl"
      >
        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-8">Deploy New Sensor</h2>
        
        <div className="grid grid-cols-2 gap-3 mb-8">
          {CROP_TYPES.map(crop => (
            <motion.button
              key={crop.id}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCrop(crop.id)}
              className={`p-6 rounded-3xl border-2 transition-all duration-300 text-left ${
                selectedCrop === crop.id
                  ? "bg-green-600 border-green-600 text-white shadow-lg shadow-green-100"
                  : "bg-white border-gray-100 text-gray-800 hover:border-green-200 shadow-sm"
              }`}
            >
              <div className="text-3xl mb-3">{crop.emoji}</div>
              <div className="text-[10px] font-black uppercase tracking-widest leading-none">{crop.name}</div>
            </motion.button>
          ))}
        </div>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl font-black text-[10px] uppercase tracking-widest text-gray-500 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onAddDevice(selectedCrop)}
            disabled={!selectedCrop || isLoading}
            className="flex-1 p-4 bg-gray-900 hover:bg-green-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-gray-200 hover:shadow-green-100 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
            <span>{isLoading ? "Provisioning..." : "Initialize"}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  );
}



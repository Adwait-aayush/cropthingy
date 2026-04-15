"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
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

const ALERT_META: Record<string, { title: string; message: string; severity: "critical" | "warning" }> = {
  temperature_high: {
    title: "High Temperature",
    message: "Temperature is above the safe range for this crop.",
    severity: "critical",
  },
  temperature_low: {
    title: "Low Temperature",
    message: "Temperature is below the expected operational range.",
    severity: "warning",
  },
  humidity_low: {
    title: "Low Humidity",
    message: "Humidity dropped under the recommended threshold.",
    severity: "warning",
  },
  soil_moisture_low: {
    title: "Low Soil Moisture",
    message: "Soil moisture is too low. Irrigation may be required.",
    severity: "critical",
  },
  soil_moisture_high: {
    title: "High Soil Moisture",
    message: "Soil moisture is above normal. Check drainage conditions.",
    severity: "warning",
  },
};

function formatAlertCode(code: string): string {
  return code
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}


// --- Main Dashboard ---

export default function Dashboard() {
  const router = useRouter();
  const [summary, setSummary] = useState<any>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [availableDevices, setAvailableDevices] = useState<any[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [recentReadings, setRecentReadings] = useState<any[]>([]);
  const [sensorReadings, setSensorReadings] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isFetchingRef = useRef(false);



  // Modal & Toast States
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
    message: "",
    type: "info",
    isVisible: false,
  });

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type, isVisible: true });
  };

  const incidentItems = useMemo(() => {
    return alerts.flatMap((reading: any, readingIdx: number) => {
      const alertCodes: string[] = Array.isArray(reading?.alerts) ? reading.alerts : [];

      return alertCodes.map((code, codeIdx) => {
        const meta = ALERT_META[code] || {
          title: formatAlertCode(code),
          message: "Threshold anomaly detected in latest reading.",
          severity: "warning" as const,
        };

        return {
          id: `${reading.id || readingIdx}-${codeIdx}`,
          title: meta.title,
          message: meta.message,
          severity: meta.severity,
          deviceId: reading.device_id || "Unknown Device",
          timestamp: reading.timestamp,
        };
      });
    });
  }, [alerts]);

  const latestIncident = incidentItems[0] || null;

  const fetchAvailableDevices = async () => {
    setIsLoadingAvailable(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/devices/available`);
      if (response.ok) {
        const json = await response.json();
        setAvailableDevices(json.data || []);
      } else {
        showToast("Failed to load available devices", "error");
      }
    } catch (err) {
      showToast("Error loading devices", "error");
    } finally {
      setIsLoadingAvailable(false);
    }
  };

  const handleClaimDevice = async (deviceId: string) => {
    setIsActionLoading(true);
    try {
      const res = await fetchWithAuth("/api/devices/claim", {
        method: "POST",
        body: JSON.stringify({ device_id: deviceId }),
      });
      if (res.ok) {
        showToast("Device claimed successfully!", "success");
        setIsClaimModalOpen(false);
        await fetchDashboardData();
        // Auto-select the newly claimed device
        setSelectedDeviceId(deviceId);
      } else {
        const err = await res.json();
        showToast(err.message || "Failed to claim device", "error");
      }
    } catch (err) {
      showToast("Network error occurred", "error");
    } finally {
      setIsActionLoading(false);
    }
  };




  const fetchDashboardData = useCallback(async (options: { silent?: boolean } = {}) => {
    if (isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    if (!options.silent) {
      setIsRefreshing(true);
    }

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
      }
    } finally {
      setLoading(false);
      if (!options.silent) {
        setIsRefreshing(false);
      }
      isFetchingRef.current = false;
    }
  }, [router, selectedDeviceId]);


  useEffect(() => {
    // Check if user is authenticated before fetching data
    const token = getToken();
    if (!token) {
      console.error('No authentication token found. Redirecting to login.');
      router.push('/auth');
      return;
    }
    
    fetchDashboardData();

    // Poll every 2 seconds for near-live updates when tab is visible.
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void fetchDashboardData({ silent: true });
      }
    }, 2000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void fetchDashboardData({ silent: true });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchDashboardData, router]);

  const handleLogout = () => {
    removeToken();
    router.push("/auth");
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
      <div className="min-h-screen bg-[#f8faf7] text-gray-800 px-4 py-5 md:px-8 md:py-8 xl:px-10 font-sans selection:bg-green-200">
      <div className="mx-auto w-full max-w-[1500px]">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
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
            onClick={() => {
              void fetchDashboardData();
            }}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-8">
        <div className="lg:col-span-7 xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-5">
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

            <div className="bg-white md:col-span-2 rounded-2xl p-5 shadow-sm border border-gray-100 overflow-hidden relative group transition-all hover:shadow-md">
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
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-5">
            {/* Quick Actions */}
            <div className="bg-green-900 rounded-3xl p-6 shadow-xl text-white">
               <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                   Quick Actions <div className="w-2 h-2 bg-green-400 rounded-full animate-ping" />
                </h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                   <button 
                    onClick={() => {
                      setIsClaimModalOpen(true);
                      fetchAvailableDevices();
                    }}
                  className="flex items-center gap-3 bg-white/10 hover:bg-white/20 p-3 rounded-2xl transition-all border border-white/5 active:scale-95 group text-left"
                   >
                      <div className="p-2 bg-green-500 rounded-xl"><Plus className="w-5 h-5" /></div>
                   <span className="font-bold text-sm">Claim Device</span>
                   </button>
                   <button 
                    onClick={() => setIsReportModalOpen(true)}
                  className="flex items-center gap-3 bg-white/10 hover:bg-white/20 p-3 rounded-2xl transition-all border border-white/5 active:scale-95 group text-left"
                   >
                      <div className="p-2 bg-blue-500 rounded-xl"><FileText className="w-5 h-5" /></div>
                   <span className="font-bold text-sm">Generate Reports</span>
                   </button>
                                      <button 
                    onClick={handleExportData}
                  className="flex items-center gap-3 bg-white/10 hover:bg-white/20 p-3 rounded-2xl transition-all border border-white/5 active:scale-95 group text-left"
                   >
                      <div className="p-2 bg-orange-500 rounded-xl"><Download className="w-5 h-5" /></div>
                   <span className="font-bold text-sm">Export Sensor Data</span>
                   </button>

                </div>

            </div>

            {/* Notifications / Alerts */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex-grow">
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

                            <div className="flex-1">
                                <h4 className="font-black text-gray-800 uppercase tracking-tighter text-lg">Combined Analysis</h4>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-4">Predicted for {selectedDeviceId}</p>
                                
                                <div className={`px-4 py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all ${
                                    prediction.irrigation_needed === 1 
                                        ? 'bg-red-100 text-red-700 border-l-4 border-red-500' 
                                        : 'bg-blue-100 text-blue-700 border-l-4 border-blue-500'
                                }`}>
                                    💧 Irrigation: {prediction.irrigation_needed === 1 ? 'NEEDED' : 'SUFFICIENT'}
                                </div>
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
                                <div className="text-[9px] font-black uppercase tracking-widest opacity-60">Health: {prediction.model_used || 'GPT-Crop'}</div>
                                <div className="text-[9px] font-black uppercase tracking-widest opacity-60 text-right">Irrigation: {prediction.irrigation_model || 'N/A'}</div>
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
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
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


            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-black text-gray-800 uppercase tracking-widest text-sm mb-6 flex items-center justify-between">
                 Latest Incident
                 {latestIncident && (
                       <span className={`px-3 py-1 rounded-full text-[10px] font-black ${
                     latestIncident.severity === "critical" ? "bg-rose-50 text-rose-500" : "bg-amber-50 text-amber-500"
                       }`}>
                     ACTIVE
                       </span>
                   )}
                </h3>
                <div className="space-y-4">
                 {!latestIncident ? (
                       <div className="text-center py-8">
                           <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                               <CheckCircle2 className="w-6 h-6 text-green-500" />
                           </div>
                           <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">System Clear</p>
                       </div>
                   ) : (
                       <motion.div 
                        key={latestIncident.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`group flex gap-4 p-4 rounded-2xl border transition-all hover:translate-x-1 hover:shadow-sm ${
                            latestIncident.severity === "critical" ? "bg-rose-50/60 border-rose-100" : "bg-amber-50/60 border-amber-100"
                        }`}
                       >
                           <div className="p-2 h-fit bg-white rounded-xl shadow-sm group-hover:scale-105 transition-transform">
                               <AlertTriangle className={`${latestIncident.severity === "critical" ? "text-rose-500" : "text-amber-500"} w-5 h-5`} />
                           </div>
                           <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3 mb-1">
                                <p className="font-black text-gray-800 text-sm tracking-tight truncate">{latestIncident.title}</p>
                                <span className={`shrink-0 px-2 py-1 rounded-full text-[9px] uppercase tracking-widest font-black ${
                                  latestIncident.severity === "critical" ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"
                                }`}>
                                  {latestIncident.severity}
                                </span>
                              </div>
                              <p className="text-[11px] font-semibold text-gray-600 leading-relaxed mb-2">
                                  {latestIncident.message}
                              </p>
                              <div className="flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                <span className="truncate">{latestIncident.deviceId}</span>
                                <span>{latestIncident.timestamp ? new Date(latestIncident.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Now"}</span>
                              </div>
                           </div>
                       </motion.div>
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
        </div>

      {/* --- Modals & Overlays --- */}

      <Modal 
        isOpen={isClaimModalOpen} 
        onClose={() => setIsClaimModalOpen(false)} 
        title="Claim Available Device"
      >
        {isLoadingAvailable ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin mb-4" />
            <p className="text-gray-400 font-bold">Loading available devices...</p>
          </div>
        ) : availableDevices.length === 0 ? (
          <div className="text-center py-12 px-6">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Cpu className="w-8 h-8 text-gray-300" />
            </div>
            <h4 className="font-black text-gray-800 mb-1">No Devices Available</h4>
            <p className="text-xs text-gray-400 font-bold">All devices have been claimed. Check back soon for new deployments.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-4">Select a device to claim:</p>
            {availableDevices.map((device) => (
              <motion.button
                key={device.device_id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleClaimDevice(device.device_id)}
                disabled={isActionLoading}
                className="w-full text-left p-4 bg-gray-50 hover:bg-green-50 border-2 border-gray-100 hover:border-green-200 rounded-2xl transition-all disabled:opacity-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-black text-gray-800 uppercase tracking-tight">{device.device_id}</h4>
                    <p className="text-sm font-bold text-gray-600">{device.name}</p>
                    <div className="flex gap-3 mt-2">
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold uppercase tracking-widest">{device.crop_type}</span>
                      <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-bold uppercase tracking-widest">{device.location}</span>
                    </div>
                  </div>
                  {isActionLoading ? (
                    <Loader2 className="w-5 h-5 text-green-600 animate-spin ml-2" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-gray-300 ml-2" />
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        )}
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



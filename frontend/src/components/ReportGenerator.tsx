import React, { useRef, useState } from 'react';
import { FileDown, Loader2, CheckCircle2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReportGeneratorProps {
  device: any;
  latestReading: any;
  prediction: any;
  summary: any;
}

export function ReportGenerator({ device, latestReading, prediction, summary }: ReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const generatePDF = async () => {
    if (!reportRef.current) return;
    
    setIsGenerating(true);
    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`CropSense_Report_${device?.device_name || 'Device'}_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`);
      
      setIsDone(true);
      setTimeout(() => setIsDone(false), 3000);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-sm border border-green-100 flex flex-col justify-between h-full relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8">
        <div className="w-24 h-24 bg-green-50 rounded-full blur-3xl opacity-50" />
      </div>

      <div>
        <h3 className="text-xl font-black text-gray-800 mb-2">Generate Report</h3>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Export a comprehensive analysis of your crop's current health, sensor readings, and AI insights as a professional PDF document.
        </p>
      </div>

      <button
        onClick={generatePDF}
        disabled={isGenerating || !latestReading}
        className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold transition-all ${
          isDone 
            ? "bg-green-100 text-green-700" 
            : "bg-gray-900 text-white hover:bg-green-600 shadow-lg shadow-gray-200 hover:shadow-green-100 active:scale-95"
        } disabled:opacity-50 disabled:pointer-events-none`}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Generating...</span>
          </>
        ) : isDone ? (
          <>
            <CheckCircle2 className="w-5 h-5" />
            <span>Downloaded!</span>
          </>
        ) : (
          <>
            <FileDown className="w-5 h-5" />
            <span>Download PDF</span>
          </>
        )}
      </button>

      {/* Hidden Report Template */}
      <div className="hidden">
        <div ref={reportRef} className="p-20 bg-white text-gray-900 w-[800px]">
          <div className="flex justify-between items-center mb-12 border-b-4 border-green-600 pb-8">
            <div>
              <h1 className="text-5xl font-black text-gray-900 uppercase tracking-tighter">
                Crop<span className="text-green-600">Sense</span>
              </h1>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-2">Precision Intelligence Report</p>
            </div>
            <div className="text-right">
              <p className="font-black text-sm uppercase">Date: {new Date().toLocaleDateString()}</p>
              <p className="text-gray-500 text-xs">Device: {device?.device_id || 'N/A'}</p>
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-2xl font-black mb-6 uppercase tracking-tight text-gray-800">Operational Summary</h2>
            <div className="grid grid-cols-2 gap-8">
              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-2">Active Crop</p>
                <p className="text-2xl font-black uppercase text-gray-800">{device?.crop_type || 'Unknown'}</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-2">Device Name</p>
                <p className="text-2xl font-black uppercase text-gray-800">{device?.device_name || device?.device_id}</p>
              </div>
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-2xl font-black mb-6 uppercase tracking-tight text-gray-800">Latest Environmental Vitals</h2>
            <div className="grid grid-cols-3 gap-6">
              {[
                { label: 'Temperature', value: latestReading?.temperature, unit: '°C' },
                { label: 'Humidity', value: latestReading?.humidity, unit: '%' },
                { label: 'Soil Moisture', value: latestReading?.soil_moisture, unit: '%' }
              ].map((vital, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border-2 border-green-50">
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">{vital.label}</p>
                  <p className="text-3xl font-black text-gray-800">{vital.value?.toFixed(1)}{vital.unit}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-2xl font-black mb-6 uppercase tracking-tight text-gray-800">AI Predictive Insights</h2>
            <div className="bg-green-50 p-8 rounded-[2.5rem] border border-green-100 relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                    <div className="px-4 py-1.5 bg-green-600 text-white text-[10px] font-black uppercase rounded-full">
                        Health Score: {prediction?.health_score}%
                    </div>
                </div>
                <h4 className="text-lg font-bold text-green-800 mb-2">Recommended Action:</h4>
                <p className="text-green-700 italic leading-relaxed">
                  "{prediction?.recommendation || 'No critical actions required at this time.'}"
                </p>
              </div>
            </div>
          </div>

          <div className="mt-20 pt-8 border-t border-gray-100 text-center">
            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.4em]">
              Verified by CropSense Intelligence Engine System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

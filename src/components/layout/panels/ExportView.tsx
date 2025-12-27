import React, { useState } from 'react';
import { audioEngine } from '@/audio/context';
import { Download, CheckCircle, Loader2 } from 'lucide-react';

export const ExportView: React.FC = () => {
    const [isExporting, setIsExporting] = useState(false);
    const [isComplete, setIsComplete] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        setIsComplete(false);
        try {
            await audioEngine.renderOffline();
            setIsComplete(true);
        } catch (error) {
            console.error('Export failed', error);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-4 text-center py-10">
            <h3 className="text-lg font-semibold text-slate-200">Export Project</h3>
            <p className="text-sm text-slate-400 max-w-xs mx-auto mb-6">
                Render your project to a 32-bit Float WAV file. Processing happens faster than realtime.
            </p>

            {isComplete ? (
                <div className="flex flex-col items-center gap-2 text-green-400 animate-in fade-in">
                    <CheckCircle size={48} />
                    <span className="font-bold">Export Complete!</span>
                    <button 
                        onClick={() => setIsComplete(false)}
                        className="text-xs text-slate-500 hover:text-slate-300 mt-2 underline"
                    >
                        Export Another
                    </button>
                </div>
            ) : (
                <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="bg-primary hover:bg-blue-600 disabled:bg-slate-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all flex items-center gap-3 mx-auto"
                >
                    {isExporting ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            Rendering...
                        </>
                    ) : (
                        <>
                            <Download size={20} />
                            Start Offline Render
                        </>
                    )}
                </button>
            )}
        </div>
    );
};

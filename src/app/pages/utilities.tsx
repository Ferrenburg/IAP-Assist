import { Download, Upload, Copy, Trash2, FileText, Database } from 'lucide-react';
import { useTheme } from '../../contexts/theme-context';

export function Utilities() {
  const { resolvedTheme } = useTheme();
  const lightMode = resolvedTheme === 'light';

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 ${lightMode ? 'text-slate-900' : 'text-white'}`}>
          Utilities
        </h1>
        <p className={lightMode ? 'text-slate-600' : 'text-slate-400'}>
          Tools and utilities for managing your IAP data
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Import/Export */}
        <div className={`rounded-lg p-6 ${
          lightMode
            ? 'bg-white border border-slate-300'
            : 'bg-slate-900 border border-slate-700'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${lightMode ? 'text-slate-900' : 'text-white'}`}>
                Import & Export
              </h2>
              <p className={`text-sm ${lightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                Backup and restore your data
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors">
              <Upload className="w-4 h-4" />
              Import Data
            </button>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
              <Download className="w-4 h-4" />
              Export All Data
            </button>
          </div>
        </div>

        {/* Bulk Operations */}
        <div className={`rounded-lg p-6 ${
          lightMode
            ? 'bg-white border border-slate-300'
            : 'bg-slate-900 border border-slate-700'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <Copy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Bulk Operations</h2>
              <p className="text-sm text-slate-400">Manage multiple items at once</p>
            </div>
          </div>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors">
              <Copy className="w-4 h-4" />
              Bulk Copy Periods
            </button>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors">
              <Trash2 className="w-4 h-4" />
              Bulk Delete
            </button>
          </div>
        </div>

        {/* PDF Management */}
        <div className={`rounded-lg p-6 ${
          lightMode
            ? 'bg-white border border-slate-300'
            : 'bg-slate-900 border border-slate-700'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">PDF Tools</h2>
              <p className="text-sm text-slate-400">Work with PDF documents</p>
            </div>
          </div>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors">
              <FileText className="w-4 h-4" />
              Batch Export Forms
            </button>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors">
              <Download className="w-4 h-4" />
              Download All PDFs
            </button>
          </div>
        </div>

        {/* Data Cleanup */}
        <div className={`rounded-lg p-6 ${
          lightMode
            ? 'bg-white border border-slate-300'
            : 'bg-slate-900 border border-slate-700'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Data Cleanup</h2>
              <p className="text-sm text-slate-400">Remove old or unused data</p>
            </div>
          </div>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors">
              <Trash2 className="w-4 h-4" />
              Clear Old Periods
            </button>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors">
              <Trash2 className="w-4 h-4" />
              Reset All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

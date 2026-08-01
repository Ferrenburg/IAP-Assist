import { Download, Upload, Copy, Trash2, FileText, Database } from 'lucide-react';
import { useTheme } from '../../contexts/theme-context';

export function Utilities() {
  const { resolvedTheme } = useTheme();
  const lightMode = resolvedTheme === 'light';

  const cardClass = lightMode
    ? 'bg-card border border-border'
    : 'bg-slate-900 border border-slate-700';
  const headingClass = lightMode ? 'text-foreground' : 'text-white';
  const subTextClass = lightMode ? 'text-muted-foreground' : 'text-slate-400';
  const neutralButtonClass = lightMode
    ? 'bg-muted hover:bg-accent text-foreground'
    : 'bg-slate-700 hover:bg-slate-600 text-white';

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 ${headingClass}`}>
          Utilities
        </h1>
        <p className={subTextClass}>
          Tools and utilities for managing your IAP data
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Import/Export */}
        <div className={`rounded-lg p-6 ${cardClass}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-sage rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${headingClass}`}>
                Import & Export
              </h2>
              <p className={`text-sm ${subTextClass}`}>
                Backup and restore your data
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-sage hover:bg-sage-hover text-white rounded-lg font-medium transition-colors">
              <Upload className="w-4 h-4" />
              Import Data
            </button>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-mustard hover:bg-mustard-hover text-foreground rounded-lg font-medium transition-colors">
              <Download className="w-4 h-4" />
              Export All Data
            </button>
          </div>
        </div>

        {/* Bulk Operations */}
        <div className={`rounded-lg p-6 ${cardClass}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-coral rounded-lg flex items-center justify-center">
              <Copy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${headingClass}`}>Bulk Operations</h2>
              <p className={`text-sm ${subTextClass}`}>Manage multiple items at once</p>
            </div>
          </div>
          <div className="space-y-3">
            <button className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${neutralButtonClass}`}>
              <Copy className="w-4 h-4" />
              Bulk Copy Periods
            </button>
            <button className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${neutralButtonClass}`}>
              <Trash2 className="w-4 h-4" />
              Bulk Delete
            </button>
          </div>
        </div>

        {/* PDF Management */}
        <div className={`rounded-lg p-6 ${cardClass}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blush rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-coral" />
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${headingClass}`}>PDF Tools</h2>
              <p className={`text-sm ${subTextClass}`}>Work with PDF documents</p>
            </div>
          </div>
          <div className="space-y-3">
            <button className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${neutralButtonClass}`}>
              <FileText className="w-4 h-4" />
              Batch Export Forms
            </button>
            <button className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${neutralButtonClass}`}>
              <Download className="w-4 h-4" />
              Download All PDFs
            </button>
          </div>
        </div>

        {/* Data Cleanup */}
        <div className={`rounded-lg p-6 ${cardClass}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-mustard rounded-lg flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${headingClass}`}>Data Cleanup</h2>
              <p className={`text-sm ${subTextClass}`}>Remove old or unused data</p>
            </div>
          </div>
          <div className="space-y-3">
            <button className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${neutralButtonClass}`}>
              <Trash2 className="w-4 h-4" />
              Clear Old Periods
            </button>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-coral hover:bg-coral-hover text-white rounded-lg font-medium transition-colors">
              <Trash2 className="w-4 h-4" />
              Reset All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

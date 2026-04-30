import { useState } from 'react';
import { FileText, Users, Briefcase, Radio, Heart, Cloud, Calendar, ListChecks, File, Package } from 'lucide-react';
import { useTheme } from '../../contexts/theme-context';

export function Templates() {
  const { resolvedTheme } = useTheme();
  const lightMode = resolvedTheme === 'light';
  const [activeCategory, setActiveCategory] = useState('command');

  const categories = [
    { id: 'command', label: 'Command', icon: Briefcase },
    { id: 'personnel', label: 'Personnel', icon: Users },
    { id: 'operations', label: 'Operations', icon: Briefcase },
    { id: 'radio', label: 'Radio', icon: Radio },
    { id: 'safety', label: 'Safety', icon: Heart },
    { id: 'weather', label: 'Weather', icon: Cloud },
    { id: 'meetings', label: 'Meetings', icon: Calendar },
    { id: 'actions', label: 'Actions', icon: ListChecks },
    { id: 'iap-cover', label: 'IAP Cover', icon: File },
    { id: 'assembly', label: 'Assembly', icon: Package },
  ];

  return (
    <div className={`h-full flex ${lightMode ? 'bg-slate-100' : 'bg-slate-800'}`}>
      {/* Left Sidebar - Categories */}
      <div className={`w-64 border-r flex flex-col ${
        lightMode
          ? 'bg-white border-slate-300'
          : 'bg-slate-900 border-slate-700'
      }`}>
        <div className={`p-4 border-b ${lightMode ? 'border-slate-300' : 'border-slate-700'}`}>
          <h2 className={`text-lg font-semibold ${lightMode ? 'text-slate-900' : 'text-white'}`}>
            Templates
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1 ${
                  activeCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : lightMode
                    ? 'text-slate-700 hover:bg-slate-100'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {category.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white capitalize">{activeCategory.replace('-', ' ')} Templates</h1>
            <p className="text-sm text-slate-400">0 templates</p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            + New
          </button>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-800 rounded-lg mb-4">
              <FileText className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No templates yet</h3>
            <p className="text-slate-400 mb-4">Click "New" to create your first template</p>
          </div>
        </div>

        {/* Right Panel - Template Details */}
        <div className="w-96 border-l border-slate-700 bg-slate-900 flex items-center justify-center">
          <div className="text-center p-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-800 rounded-lg mb-4">
              <FileText className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Select a template to edit</h3>
            <p className="text-sm text-slate-400">or click "New" to create one</p>
          </div>
        </div>
      </div>
    </div>
  );
}

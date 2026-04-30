import { useState } from 'react';
import { Target, Users, Heart, Radio, Package, Layers } from 'lucide-react';
import { useTheme } from '../../contexts/theme-context';

export function Defaults() {
  const { resolvedTheme } = useTheme();
  const lightMode = resolvedTheme === 'light';
  const [activeTab, setActiveTab] = useState('incident-objectives');

  const tabs = [
    { id: 'incident-objectives', label: 'Incident Objectives', icon: Target },
    { id: 'lifeline-objectives', label: 'Lifeline Objectives', icon: Layers },
    { id: 'personnel-contacts', label: 'Personnel Contacts', icon: Users },
    { id: 'medical-defaults', label: 'Medical Defaults', icon: Heart },
    { id: 'radio-channels', label: 'Radio Channels', icon: Radio },
    { id: 'resources', label: 'Resources', icon: Package },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className={`text-3xl font-bold mb-2 ${lightMode ? 'text-slate-900' : 'text-white'}`}>
          Defaults Management
        </h1>
        <p className={lightMode ? 'text-slate-600' : 'text-slate-400'}>
          Manage default templates and personnel contacts for quick data entry.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : lightMode
                  ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className={`rounded-lg p-6 ${
        lightMode
          ? 'bg-white border border-slate-300'
          : 'bg-slate-900 border border-slate-700'
      }`}>
        {activeTab === 'incident-objectives' && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Incident Objectives Library</h2>
            <p className="text-slate-400 mb-6">Create reusable incident objectives that can be quickly selected when filling out ICS 202 forms.</p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">Add New Objective</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter objective text (e.g., 'Ensure life safety of all personnel and civilians')"
                  className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                  Add
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">Tip: Press Shift+Enter to add objective</p>
            </div>

            <div className="text-center py-12 text-slate-400">
              No objectives created yet. Add your first objective to get started.
            </div>
          </div>
        )}

        {activeTab === 'lifeline-objectives' && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Community Lifeline Objectives Library</h2>
            <p className="text-slate-400 mb-6">Create reusable objectives for each community lifeline that can be quickly loaded when filling out lifeline forms.</p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">Community Lifeline</label>
              <select className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white mb-4">
                <option>Safety and Security</option>
                <option>Food, Water, Shelter</option>
                <option>Health and Medical</option>
                <option>Energy</option>
                <option>Communications</option>
                <option>Transportation</option>
                <option>Hazardous Materials</option>
              </select>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter objective text (e.g., 'Ensure 24/7 law enforcement presence at critical facilities')"
                  className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                  Add
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">Filter by Lifeline</label>
              <select className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white">
                <option>All Lifelines</option>
                <option>Safety and Security</option>
                <option>Food, Water, Shelter</option>
                <option>Health and Medical</option>
              </select>
            </div>

            <div className="text-center py-12 text-slate-400">
              No objectives created yet. Add your first objective to get started.
            </div>
          </div>
        )}

        {activeTab === 'personnel-contacts' && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Personnel Defaults</h2>
            <p className="text-slate-400 mb-6">Manage your personnel contacts for quick assignment to roles.</p>

            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-200">
                <strong>Name Format Recommendation:</strong> For consistent alphabetical sorting, please enter names as <code className="bg-blue-800 px-1 rounded">Last, First Middle</code>
              </p>
              <p className="text-xs text-blue-300 mt-1">Examples: Smith, John | Garcia Lopez, Maria | Johnson, Robert Jr.</p>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-4 text-sm font-medium text-slate-300">
              <div>Name (Last, First)</div>
              <div>Agency</div>
              <div>Phone</div>
              <div>Email</div>
            </div>

            <div className="flex gap-4 mb-4">
              <input
                type="text"
                placeholder="Start typing to add..."
                className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Agency/Organization"
                className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="tel"
                placeholder="(xxx) xxx-xxxx"
                className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                placeholder="someone@example.com"
                className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="text-center py-12 text-slate-400">
              No personnel contacts saved. Add your first contact above.
            </div>
          </div>
        )}

        {activeTab === 'medical-defaults' && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Medical Defaults (ICS 206)</h2>
            <p className="text-slate-400 mb-6">Save default medical resources that can be quickly selected when creating operational periods.</p>

            <div className="flex gap-2 mb-6 border-b border-slate-700">
              <button className="px-4 py-2 text-sm font-medium text-blue-400 border-b-2 border-blue-400">
                Medical Aid Stations
              </button>
              <button className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white">
                Transportation
              </button>
              <button className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white">
                Hospitals
              </button>
            </div>

            <div className="text-center py-12 text-slate-400">
              <p className="mb-2">No medical aid stations saved</p>
              <p className="text-sm">Click "Add Station" to create one.</p>
              <button className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                + Add Station
              </button>
            </div>
          </div>
        )}

        {activeTab === 'radio-channels' && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Radio Channel Defaults (ICS 205)</h2>
            <p className="text-slate-400 mb-6">Save default radio channels that can be quickly loaded into the Radio Communications form.</p>

            <div className="text-center py-12 text-slate-400">
              <p className="mb-2">No radio channels saved</p>
              <p className="text-sm">Click "Add Channel" to create one.</p>
              <button className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                + Add Channel
              </button>
            </div>
          </div>
        )}

        {activeTab === 'resources' && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Resources Assigned</h2>
            <p className="text-slate-400 mb-6">Create default resource entries for quick assignment in Operations assignments.</p>

            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-6">
              <p className="text-sm font-semibold text-blue-200 mb-2">How to Use Resource Defaults</p>
              <ul className="text-xs text-blue-300 space-y-1 list-disc list-inside">
                <li>Add commonly used resources here to save time when creating assignments</li>
                <li>When adding resources in the Operations tab, you can load from these defaults</li>
                <li>Loaded defaults can be edited directly in the Operations tab as needed</li>
                <li>Resource Identifier examples: E-101, ENG-13, IA-SCC-413, or TBD (to be determined)</li>
                <li>Number of persons should include the leader</li>
                <li>Contact can be radio frequency, phone, pager, or other contact method</li>
              </ul>
            </div>

            <div className="text-center py-12 text-slate-400">
              <p className="mb-2">No default resources configured yet.</p>
              <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                + Add Your First Resource
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

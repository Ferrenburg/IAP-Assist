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

  const headingClass = lightMode ? 'text-foreground' : 'text-white';
  const bodyTextClass = lightMode ? 'text-muted-foreground' : 'text-slate-400';
  const labelClass = lightMode ? 'text-foreground' : 'text-slate-300';
  const inputClass = lightMode
    ? 'bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage'
    : 'bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500';
  const infoBoxClass = lightMode
    ? 'bg-blush/40 border border-blush'
    : 'bg-blue-900/30 border border-blue-700';
  const infoTextClass = lightMode ? 'text-foreground' : 'text-blue-200';
  const infoSubTextClass = lightMode ? 'text-muted-foreground' : 'text-blue-300';

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className={`text-3xl font-bold mb-2 ${headingClass}`}>
          Defaults Management
        </h1>
        <p className={bodyTextClass}>
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
                  ? 'bg-sage text-white'
                  : lightMode
                  ? 'bg-muted text-foreground/80 hover:bg-accent'
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
          ? 'bg-card border border-border'
          : 'bg-slate-900 border border-slate-700'
      }`}>
        {activeTab === 'incident-objectives' && (
          <div>
            <h2 className={`text-xl font-semibold mb-2 ${headingClass}`}>Incident Objectives Library</h2>
            <p className={`mb-6 ${bodyTextClass}`}>Create reusable incident objectives that can be quickly selected when filling out ICS 202 forms.</p>

            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${labelClass}`}>Add New Objective</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter objective text (e.g., 'Ensure life safety of all personnel and civilians')"
                  className={`flex-1 px-4 py-2 ${inputClass}`}
                />
                <button className="bg-sage hover:bg-sage-hover text-white px-6 py-2 rounded-lg font-medium transition-colors">
                  Add
                </button>
              </div>
              <p className={`text-xs mt-1 ${bodyTextClass}`}>Tip: Press Shift+Enter to add objective</p>
            </div>

            <div className={`text-center py-12 ${bodyTextClass}`}>
              No objectives created yet. Add your first objective to get started.
            </div>
          </div>
        )}

        {activeTab === 'lifeline-objectives' && (
          <div>
            <h2 className={`text-xl font-semibold mb-2 ${headingClass}`}>Community Lifeline Objectives Library</h2>
            <p className={`mb-6 ${bodyTextClass}`}>Create reusable objectives for each community lifeline that can be quickly loaded when filling out lifeline forms.</p>

            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${labelClass}`}>Community Lifeline</label>
              <select className={`w-full px-4 py-2 mb-4 ${inputClass}`}>
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
                  className={`flex-1 px-4 py-2 ${inputClass}`}
                />
                <button className="bg-sage hover:bg-sage-hover text-white px-6 py-2 rounded-lg font-medium transition-colors">
                  Add
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${labelClass}`}>Filter by Lifeline</label>
              <select className={`w-full px-4 py-2 ${inputClass}`}>
                <option>All Lifelines</option>
                <option>Safety and Security</option>
                <option>Food, Water, Shelter</option>
                <option>Health and Medical</option>
              </select>
            </div>

            <div className={`text-center py-12 ${bodyTextClass}`}>
              No objectives created yet. Add your first objective to get started.
            </div>
          </div>
        )}

        {activeTab === 'personnel-contacts' && (
          <div>
            <h2 className={`text-xl font-semibold mb-2 ${headingClass}`}>Personnel Defaults</h2>
            <p className={`mb-6 ${bodyTextClass}`}>Manage your personnel contacts for quick assignment to roles.</p>

            <div className={`rounded-lg p-4 mb-6 ${infoBoxClass}`}>
              <p className={`text-sm ${infoTextClass}`}>
                <strong>Name Format Recommendation:</strong> For consistent alphabetical sorting, please enter names as{' '}
                <code className={lightMode ? 'bg-blush px-1 rounded' : 'bg-blue-800 px-1 rounded'}>Last, First Middle</code>
              </p>
              <p className={`text-xs mt-1 ${infoSubTextClass}`}>Examples: Smith, John | Garcia Lopez, Maria | Johnson, Robert Jr.</p>
            </div>

            <div className={`grid grid-cols-4 gap-4 mb-4 text-sm font-medium ${labelClass}`}>
              <div>Name (Last, First)</div>
              <div>Agency</div>
              <div>Phone</div>
              <div>Email</div>
            </div>

            <div className="flex gap-4 mb-4">
              <input
                type="text"
                placeholder="Start typing to add..."
                className={`flex-1 px-4 py-2 ${inputClass}`}
              />
              <input
                type="text"
                placeholder="Agency/Organization"
                className={`flex-1 px-4 py-2 ${inputClass}`}
              />
              <input
                type="tel"
                placeholder="(xxx) xxx-xxxx"
                className={`flex-1 px-4 py-2 ${inputClass}`}
              />
              <input
                type="email"
                placeholder="someone@example.com"
                className={`flex-1 px-4 py-2 ${inputClass}`}
              />
            </div>

            <div className={`text-center py-12 ${bodyTextClass}`}>
              No personnel contacts saved. Add your first contact above.
            </div>
          </div>
        )}

        {activeTab === 'medical-defaults' && (
          <div>
            <h2 className={`text-xl font-semibold mb-2 ${headingClass}`}>Medical Defaults (ICS 206)</h2>
            <p className={`mb-6 ${bodyTextClass}`}>Save default medical resources that can be quickly selected when creating operational periods.</p>

            <div className={`flex gap-2 mb-6 border-b ${lightMode ? 'border-border' : 'border-slate-700'}`}>
              <button className={`px-4 py-2 text-sm font-medium border-b-2 ${lightMode ? 'text-sage border-sage' : 'text-blue-400 border-blue-400'}`}>
                Medical Aid Stations
              </button>
              <button className={`px-4 py-2 text-sm font-medium ${lightMode ? 'text-muted-foreground hover:text-foreground' : 'text-slate-400 hover:text-white'}`}>
                Transportation
              </button>
              <button className={`px-4 py-2 text-sm font-medium ${lightMode ? 'text-muted-foreground hover:text-foreground' : 'text-slate-400 hover:text-white'}`}>
                Hospitals
              </button>
            </div>

            <div className={`text-center py-12 ${bodyTextClass}`}>
              <p className="mb-2">No medical aid stations saved</p>
              <p className="text-sm">Click "Add Station" to create one.</p>
              <button className="mt-4 bg-sage hover:bg-sage-hover text-white px-4 py-2 rounded-lg font-medium transition-colors">
                + Add Station
              </button>
            </div>
          </div>
        )}

        {activeTab === 'radio-channels' && (
          <div>
            <h2 className={`text-xl font-semibold mb-2 ${headingClass}`}>Radio Channel Defaults (ICS 205)</h2>
            <p className={`mb-6 ${bodyTextClass}`}>Save default radio channels that can be quickly loaded into the Radio Communications form.</p>

            <div className={`text-center py-12 ${bodyTextClass}`}>
              <p className="mb-2">No radio channels saved</p>
              <p className="text-sm">Click "Add Channel" to create one.</p>
              <button className="mt-4 bg-sage hover:bg-sage-hover text-white px-4 py-2 rounded-lg font-medium transition-colors">
                + Add Channel
              </button>
            </div>
          </div>
        )}

        {activeTab === 'resources' && (
          <div>
            <h2 className={`text-xl font-semibold mb-2 ${headingClass}`}>Resources Assigned</h2>
            <p className={`mb-6 ${bodyTextClass}`}>Create default resource entries for quick assignment in Operations assignments.</p>

            <div className={`rounded-lg p-4 mb-6 ${infoBoxClass}`}>
              <p className={`text-sm font-semibold mb-2 ${infoTextClass}`}>How to Use Resource Defaults</p>
              <ul className={`text-xs space-y-1 list-disc list-inside ${infoSubTextClass}`}>
                <li>Add commonly used resources here to save time when creating assignments</li>
                <li>When adding resources in the Operations tab, you can load from these defaults</li>
                <li>Loaded defaults can be edited directly in the Operations tab as needed</li>
                <li>Resource Identifier examples: E-101, ENG-13, IA-SCC-413, or TBD (to be determined)</li>
                <li>Number of persons should include the leader</li>
                <li>Contact can be radio frequency, phone, pager, or other contact method</li>
              </ul>
            </div>

            <div className={`text-center py-12 ${bodyTextClass}`}>
              <p className="mb-2">No default resources configured yet.</p>
              <button className="mt-4 bg-sage hover:bg-sage-hover text-white px-4 py-2 rounded-lg font-medium transition-colors">
                + Add Your First Resource
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

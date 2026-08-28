'use client';

import { useState } from 'react';
import { Target, Users, Heart, Radio, Package, Layers } from 'lucide-react';
import { ObjectivesTab } from '../components/defaults/objectives-tab';
import { LifelineTab } from '../components/defaults/lifeline-tab';
import { PersonnelTab } from '../components/defaults/personnel-tab';
import { MedicalTab } from '../components/defaults/medical-tab';
import { RadioTab } from '../components/defaults/radio-tab';
import { ResourcesTab } from '../components/defaults/resources-tab';

const TABS = [
  { id: 'incident-objectives', label: 'Incident Objectives', icon: Target, Panel: ObjectivesTab },
  { id: 'lifeline-objectives', label: 'Lifeline Objectives', icon: Layers, Panel: LifelineTab },
  { id: 'personnel-contacts', label: 'Personnel Contacts', icon: Users, Panel: PersonnelTab },
  { id: 'medical-defaults', label: 'Medical Defaults', icon: Heart, Panel: MedicalTab },
  { id: 'radio-channels', label: 'Radio Channels', icon: Radio, Panel: RadioTab },
  { id: 'resources', label: 'Resources', icon: Package, Panel: ResourcesTab },
];

export function Defaults() {
  const [activeTab, setActiveTab] = useState(TABS[0].id);

  // Only the active panel mounts, so each tab's useOrgDefaults fetch fires on
  // first visit rather than issuing six requests on page load.
  const ActivePanel = TABS.find((t) => t.id === activeTab)?.Panel ?? ObjectivesTab;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-foreground">Defaults Management</h1>
        <p className="text-muted-foreground">
          Manage reusable defaults and personnel contacts for quick data entry. These are saved for
          your whole organization and available in every incident.
        </p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-current={active ? 'page' : undefined}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-colors active:scale-95 ${
                active ? 'bg-sage text-white' : 'bg-muted text-foreground/80 hover:bg-accent'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-lg p-6 bg-card border border-border">
        <ActivePanel />
      </div>
    </div>
  );
}

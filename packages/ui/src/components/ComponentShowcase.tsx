import React, { useState } from 'react';
import { Button } from '../primitives/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../primitives/tabs';
import { StatCard } from './StatCard';
import { PlaylistCard } from './PlaylistCard';
import { PlanCard } from './PlanCard';
import { EmptyState } from './EmptyState';
import { TextInput } from './TextInput';
import { TagSelector } from './TagSelector';
import { EnergySlider } from './EnergySlider';

interface Tag {
  id: string;
  label: string;
  color?: string;
}
import { ToggleSwitch } from './ToggleSwitch';
import { showToast } from './ToastAlert';
import { ConfirmModal } from './ConfirmModal';
import { EditModal } from './EditModal';
import { AddLocationModal } from './AddLocationModal';
import { 
  Music, 
  Users, 
  TrendingUp, 
  Clock,
  Mail,
  Plus,
  Trash2
} from 'lucide-react';

export const ComponentShowcase: React.FC = () => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [energyValue, setEnergyValue] = useState(50);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [isEnabled, setIsEnabled] = useState(false);

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-foreground mb-2">Component Showcase</h1>
        <p className="text-muted-foreground">
          All reusable components in the Lyra design system
        </p>
      </div>

      <Tabs defaultValue="cards" className="space-y-6">
        <TabsList className="bg-secondary/50 p-1 rounded-lg border border-border">
          <TabsTrigger value="cards">Cards</TabsTrigger>
          <TabsTrigger value="forms">Form Components</TabsTrigger>
          <TabsTrigger value="modals">Modals</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        {/* Cards Tab */}
        <TabsContent value="cards" className="space-y-8">
          {/* Stat Cards */}
          <div>
            <h2 className="text-foreground mb-4">Stat Cards</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Total Users"
                value="2,543"
                change={12.5}
                trend="up"
                icon={Users}
                variant="default"
              />
              <StatCard
                title="Hours Streamed"
                value="12,489"
                change={-3.2}
                trend="down"
                icon={Clock}
                subtitle="This month"
                variant="gradient"
              />
              <StatCard
                title="Active Playlists"
                value="47"
                icon={Music}
                variant="default"
              />
            </div>
          </div>

          {/* Playlist Cards */}
          <div>
            <h2 className="text-foreground mb-4">Playlist Cards</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <PlaylistCard
                id="1"
                title="Morning Café Vibes"
                description="Smooth jazz and acoustic melodies perfect for morning coffee"
                duration="2h 15m"
                trackCount={24}
                tags={['Jazz', 'Acoustic', 'Relaxing']}
                onPlay={() => showToast.info({ title: 'Playing playlist' })}
                onViewDetails={() => {}}
              />
              <PlaylistCard
                id="2"
                title="Workout Energy"
                description="High-energy electronic beats for your fitness routine"
                duration="1h 30m"
                trackCount={18}
                tags={['Electronic', 'High Energy']}
                onPlay={() => showToast.info({ title: 'Playing playlist' })}
                onViewDetails={() => {}}
              />
              <PlaylistCard
                id="3"
                title="Evening Chill"
                duration="3h 00m"
                trackCount={32}
                tags={['Ambient', 'Chill']}
                onPlay={() => showToast.info({ title: 'Playing playlist' })}
                variant="compact"
              />
            </div>
          </div>

          {/* Plan Cards */}
          <div>
            <h2 className="text-foreground mb-4">Plan Cards</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <PlanCard
                name="Starter"
                price={49}
                period="/month"
                description="Perfect for single locations"
                features={[
                  'Up to 50 hours/month',
                  '5 custom playlists',
                  'Basic analytics',
                  'Email support'
                ]}
              />
              <PlanCard
                name="Professional"
                price={149}
                period="/month"
                description="For growing businesses"
                features={[
                  'Up to 200 hours/month',
                  'Unlimited playlists',
                  'Advanced analytics',
                  'Priority support',
                  'Multi-location'
                ]}
                recommended={true}
                current={true}
              />
              <PlanCard
                name="Enterprise"
                price={null}
                period="Custom"
                description="For large organizations"
                features={[
                  'Unlimited hours',
                  'Unlimited playlists',
                  'White-label solution',
                  'Dedicated manager',
                  'Custom AI training'
                ]}
              />
            </div>
          </div>

          {/* Empty States */}
          <div>
            <h2 className="text-foreground mb-4">Empty States</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <EmptyState
                icon={Music}
                title="No playlists yet"
                description="Create your first AI-generated playlist to get started"
                actionLabel="Create Playlist"
                onAction={() => showToast.info({ title: 'Creating playlist' })}
                variant="default"
              />
              <EmptyState
                icon={TrendingUp}
                title="No analytics data"
                description="Start streaming music to see analytics and insights"
                variant="gradient"
              />
            </div>
          </div>
        </TabsContent>

        {/* Form Components Tab */}
        <TabsContent value="forms" className="space-y-8">
          {/* Text Input */}
          <div className="bg-card rounded-[16px] p-6 border border-border space-y-6">
            <h2 className="text-foreground">Text Inputs</h2>
            
            <TextInput
              label="Email Address"
              type="email"
              placeholder="you@company.com"
              icon={<Mail className="w-4 h-4" />}
              helperText="We'll never share your email"
            />

            <TextInput
              label="Organization Name"
              type="text"
              placeholder="Acme Coffee Co."
              error="This field is required"
            />

            <TextInput
              label="Disabled Input"
              type="text"
              value="Cannot edit this"
              disabled
            />
          </div>

          {/* Tag Selector */}
          <div className="bg-card rounded-[16px] p-6 border border-border">
            <h2 className="text-foreground mb-6">Tag Selector</h2>
            <TagSelector
              label="Select Music Genres"
              maxTags={5}
              onTagsChange={setSelectedTags}
              placeholder="Choose up to 5 genres for your playlist"
            />
          </div>

          {/* Energy Slider */}
          <div className="bg-card rounded-[16px] p-6 border border-border space-y-6">
            <h2 className="text-foreground mb-6">Energy Sliders</h2>
            
            <EnergySlider
              label="Energy Level"
              value={energyValue}
              onChange={setEnergyValue}
              icon="energy"
            />

            <EnergySlider
              label="Volume"
              value={70}
              icon="volume"
            />

            <EnergySlider
              label="Tempo"
              value={80}
              icon="tempo"
              showLabels={false}
            />
          </div>

          {/* Toggle Switches */}
          <div className="bg-card rounded-[16px] p-6 border border-border space-y-4">
            <h2 className="text-foreground mb-4">Toggle Switches</h2>
            
            <ToggleSwitch
              label="Email Notifications"
              description="Receive email updates about your playlists"
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
              variant="coral"
            />

            <ToggleSwitch
              label="Auto-generate Playlists"
              description="Automatically create new playlists based on listening habits"
              checked={false}
            />

            <ToggleSwitch
              label="Disabled Option"
              description="This setting cannot be changed"
              checked={true}
              disabled
            />
          </div>
        </TabsContent>

        {/* Modals Tab */}
        <TabsContent value="modals" className="space-y-6">
          <div className="bg-card rounded-[16px] p-6 border border-border">
            <h2 className="text-foreground mb-4">Modal Dialogs</h2>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setShowConfirm(true)}
                className="bg-gradient-coral text-white hover:opacity-90"
              >
                Show Confirm Modal
              </Button>

              <Button
                onClick={() => setShowEdit(true)}
                variant="outline"
              >
                Show Edit Modal
              </Button>

              <Button
                onClick={() => setShowAddLocation(true)}
                variant="outline"
              >
                Show Add Location Modal
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback" className="space-y-6">
          <div className="bg-card rounded-[16px] p-6 border border-border">
            <h2 className="text-foreground mb-4">Toast Notifications</h2>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => showToast.success({ 
                  title: 'Success!', 
                  description: 'Your playlist has been created.' 
                })}
                className="bg-green-500 text-white hover:bg-green-600"
              >
                Show Success Toast
              </Button>

              <Button
                onClick={() => showToast.error({ 
                  title: 'Error', 
                  description: 'Failed to generate playlist. Please try again.' 
                })}
                className="bg-red-500 text-white hover:bg-red-600"
              >
                Show Error Toast
              </Button>

              <Button
                onClick={() => showToast.warning({ 
                  title: 'Warning', 
                  description: "You've used 90% of your monthly hours." 
                })}
                className="bg-yellow-500 text-white hover:bg-yellow-600"
              >
                Show Warning Toast
              </Button>

              <Button
                onClick={() => showToast.info({ 
                  title: 'New Feature', 
                  description: 'Check out our updated playlist builder!' 
                })}
                className="bg-gradient-coral text-white hover:opacity-90"
              >
                Show Info Toast
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {showConfirm && (
        <ConfirmModal
          title="Delete Playlist"
          message="Are you sure you want to delete this playlist? This action cannot be undone."
          onConfirm={() => {
            showToast.success({ title: 'Playlist deleted' });
            setShowConfirm(false);
          }}
          onCancel={() => setShowConfirm(false)}
          variant="destructive"
          confirmLabel="Delete"
        />
      )}

      {showEdit && (
        <EditModal
          title="Edit Organization"
          fields={[
            { name: 'name', label: 'Organization Name', value: 'Acme Coffee Co.' },
            { name: 'email', label: 'Email', value: 'hello@acme.com', type: 'email' },
            { name: 'website', label: 'Website', value: 'https://acme.com', type: 'url' },
            { name: 'description', label: 'Description', value: 'A cozy coffee shop', type: 'textarea' }
          ]}
          onClose={() => setShowEdit(false)}
          onSave={(data) => {
            showToast.success({ title: 'Changes saved' });
            setShowEdit(false);
          }}
        />
      )}

      {showAddLocation && (
        <AddLocationModal
          onClose={() => setShowAddLocation(false)}
          onAdd={(location) => {
            showToast.success({ 
              title: 'Location added', 
              description: `${location.name} has been added to your organization.` 
            });
            setShowAddLocation(false);
          }}
        />
      )}
    </div>
  );
};

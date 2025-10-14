import React, { useState } from 'react';
import { Button } from '../primitives/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../primitives/tabs';
import { EditModal } from './EditModal';
import { AddLocationModal } from './AddLocationModal';
import { ConfirmModal } from './ConfirmModal';
import { Building2, Users, MapPin, Bell, Shield, Palette, Trash2, Plus } from 'lucide-react';

export const Settings: React.FC = () => {
  const [showEditOrg, setShowEditOrg] = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const teamMembers = [
    { id: '1', name: 'Sarah Johnson', email: 'sarah@coffeeshop.com', role: 'Owner', avatar: '👩‍💼' },
    { id: '2', name: 'Mike Chen', email: 'mike@coffeeshop.com', role: 'Manager', avatar: '👨‍💼' },
    { id: '3', name: 'Emma Davis', email: 'emma@coffeeshop.com', role: 'Staff', avatar: '👩' }
  ];

  const locations = [
    { id: '1', name: 'Downtown Coffee Shop', address: '123 Main St, New York, NY', status: 'Active' },
    { id: '2', name: 'Uptown Café', address: '456 Park Ave, New York, NY', status: 'Active' },
    { id: '3', name: 'Brooklyn Branch', address: '789 Brooklyn Rd, Brooklyn, NY', status: 'Inactive' }
  ];

  const handleDelete = (id: string, type: string) => {
    setSelectedItem(id);
    setShowDeleteConfirm(true);
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization, team, and preferences
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="organization" className="space-y-6">
        <TabsList className="bg-secondary/50 p-1 rounded-lg border border-border">
          <TabsTrigger value="organization" className="data-[state=active]:bg-gradient-coral data-[state=active]:text-white">
            <Building2 className="w-4 h-4 mr-2" />
            Organization
          </TabsTrigger>
          <TabsTrigger value="team" className="data-[state=active]:bg-gradient-coral data-[state=active]:text-white">
            <Users className="w-4 h-4 mr-2" />
            Team Members
          </TabsTrigger>
          <TabsTrigger value="locations" className="data-[state=active]:bg-gradient-coral data-[state=active]:text-white">
            <MapPin className="w-4 h-4 mr-2" />
            Locations
          </TabsTrigger>
          <TabsTrigger value="preferences" className="data-[state=active]:bg-gradient-coral data-[state=active]:text-white">
            <Palette className="w-4 h-4 mr-2" />
            Preferences
          </TabsTrigger>
        </TabsList>

        {/* Organization Tab */}
        <TabsContent value="organization" className="space-y-6">
          <div className="bg-card rounded-[16px] p-6 border border-border">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-foreground mb-2">Organization Details</h3>
                <p className="text-muted-foreground">
                  Update your organization information
                </p>
              </div>
              <Button 
                onClick={() => setShowEditOrg(true)}
                className="bg-gradient-coral text-white hover:opacity-90"
              >
                Edit Details
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-muted-foreground mb-1 block">Organization Name</label>
                  <p className="text-foreground">Downtown Coffee Shop</p>
                </div>
                <div>
                  <label className="text-muted-foreground mb-1 block">Industry</label>
                  <p className="text-foreground">Café & Coffee Shop</p>
                </div>
                <div>
                  <label className="text-muted-foreground mb-1 block">Website</label>
                  <p className="text-foreground">www.downtowncoffee.com</p>
                </div>
                <div>
                  <label className="text-muted-foreground mb-1 block">Support Email</label>
                  <p className="text-foreground">support@downtowncoffee.com</p>
                </div>
              </div>

              <div>
                <label className="text-muted-foreground mb-1 block">Brand Description</label>
                <p className="text-foreground">
                  A cozy neighborhood coffee shop serving artisanal coffee and homemade pastries 
                  with a warm, welcoming atmosphere perfect for remote work and casual meetings.
                </p>
              </div>
            </div>
          </div>

          {/* Brand Identity */}
          <div className="bg-card rounded-[16px] p-6 border border-border">
            <h3 className="text-foreground mb-4">Brand Identity</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-muted-foreground mb-2 block">Primary Color</label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-[#6B4423] border-2 border-border"></div>
                  <span className="text-foreground">#6B4423</span>
                </div>
              </div>
              <div>
                <label className="text-muted-foreground mb-2 block">Secondary Color</label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-[#D4A574] border-2 border-border"></div>
                  <span className="text-foreground">#D4A574</span>
                </div>
              </div>
              <div>
                <label className="text-muted-foreground mb-2 block">Accent Color</label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-[#8B6F47] border-2 border-border"></div>
                  <span className="text-foreground">#8B6F47</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Team Members Tab */}
        <TabsContent value="team" className="space-y-6">
          <div className="bg-card rounded-[16px] p-6 border border-border">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-foreground mb-2">Team Members</h3>
                <p className="text-muted-foreground">
                  Manage who has access to your Lyra account
                </p>
              </div>
              <Button className="bg-gradient-coral text-white hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" />
                Invite Member
              </Button>
            </div>

            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 rounded-lg hover:bg-secondary/30 transition-colors border border-transparent hover:border-border"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-coral flex items-center justify-center">
                      <span className="text-xl">{member.avatar}</span>
                    </div>
                    <div>
                      <p className="text-foreground">{member.name}</p>
                      <p className="text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <select className="px-3 py-2 rounded-lg bg-input-background border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
                      <option value="owner" selected={member.role === 'Owner'}>Owner</option>
                      <option value="manager" selected={member.role === 'Manager'}>Manager</option>
                      <option value="staff" selected={member.role === 'Staff'}>Staff</option>
                    </select>
                    {member.role !== 'Owner' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(member.id, 'member')}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Locations Tab */}
        <TabsContent value="locations" className="space-y-6">
          <div className="bg-card rounded-[16px] p-6 border border-border">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-foreground mb-2">Locations</h3>
                <p className="text-muted-foreground">
                  Manage your business locations
                </p>
              </div>
              <Button 
                onClick={() => setShowAddLocation(true)}
                className="bg-gradient-coral text-white hover:opacity-90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Location
              </Button>
            </div>

            <div className="space-y-3">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className="flex items-center justify-between p-4 rounded-lg hover:bg-secondary/30 transition-colors border border-transparent hover:border-border"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-coral flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-foreground">{location.name}</p>
                      <p className="text-muted-foreground">{location.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full border ${
                      location.status === 'Active'
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}>
                      {location.status}
                    </span>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(location.id, 'location')}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <div className="bg-card rounded-[16px] p-6 border border-border">
            <h3 className="text-foreground mb-4">Notifications</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/20">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-foreground">Playlist Generation Complete</p>
                    <p className="text-muted-foreground">Get notified when AI finishes creating your playlist</p>
                  </div>
                </div>
                <input type="checkbox" defaultChecked className="toggle" />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/20">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-foreground">Monthly Usage Reports</p>
                    <p className="text-muted-foreground">Receive monthly analytics and insights</p>
                  </div>
                </div>
                <input type="checkbox" defaultChecked className="toggle" />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/20">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-foreground">Billing Updates</p>
                    <p className="text-muted-foreground">Important billing and payment notifications</p>
                  </div>
                </div>
                <input type="checkbox" defaultChecked className="toggle" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-[16px] p-6 border border-border">
            <h3 className="text-foreground mb-4">Privacy & Security</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/20">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-foreground">Two-Factor Authentication</p>
                    <p className="text-muted-foreground">Add an extra layer of security</p>
                  </div>
                </div>
                <Button variant="outline" className="border-border">
                  Enable
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/20">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-foreground">Session Management</p>
                    <p className="text-muted-foreground">View and manage active sessions</p>
                  </div>
                </div>
                <Button variant="outline" className="border-border">
                  Manage
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {showEditOrg && (
        <EditModal
          title="Edit Organization"
          fields={[
            { name: 'orgName', label: 'Organization Name', value: 'Downtown Coffee Shop' },
            { name: 'industry', label: 'Industry', value: 'Café & Coffee Shop' },
            { name: 'website', label: 'Website', value: 'www.downtowncoffee.com' },
            { name: 'email', label: 'Support Email', value: 'support@downtowncoffee.com' }
          ]}
          onClose={() => setShowEditOrg(false)}
          onSave={(data) => {
            console.log('Saving:', data);
            setShowEditOrg(false);
          }}
        />
      )}

      {showAddLocation && (
        <AddLocationModal
          onClose={() => setShowAddLocation(false)}
          onAdd={(location) => {
            console.log('Adding location:', location);
            setShowAddLocation(false);
          }}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmModal
          title="Confirm Delete"
          message="Are you sure you want to delete this item? This action cannot be undone."
          onConfirm={() => {
            console.log('Deleting:', selectedItem);
            setShowDeleteConfirm(false);
            setSelectedItem(null);
          }}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setSelectedItem(null);
          }}
        />
      )}
    </div>
  );
};

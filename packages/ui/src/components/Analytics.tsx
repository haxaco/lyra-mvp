import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../primitives/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../primitives/tabs';
import { Badge } from '../primitives/badge';
import { Button } from '../primitives/button';
import { 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Clock, 
  SkipForward, 
  Heart, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Music,
  Download,
  Calendar,
  Filter
} from 'lucide-react';

const streamingData = [
  { name: 'Mon', hours: 8.5, skips: 12, likes: 45 },
  { name: 'Tue', hours: 9.2, skips: 8, likes: 52 },
  { name: 'Wed', hours: 7.8, skips: 15, likes: 38 },
  { name: 'Thu', hours: 10.1, skips: 6, likes: 61 },
  { name: 'Fri', hours: 12.4, skips: 4, likes: 78 },
  { name: 'Sat', hours: 11.8, skips: 7, likes: 69 },
  { name: 'Sun', hours: 9.6, skips: 9, likes: 54 }
];

const genreData = [
  { name: 'Ambient', value: 35, color: '#8b5cf6' },
  { name: 'Lo-fi', value: 28, color: '#3b82f6' },
  { name: 'Jazz', value: 18, color: '#10b981' },
  { name: 'Electronic', value: 12, color: '#f59e0b' },
  { name: 'Pop', value: 7, color: '#ef4444' }
];

const customerSatisfactionData = [
  { time: '9 AM', satisfaction: 92 },
  { time: '10 AM', satisfaction: 88 },
  { time: '11 AM', satisfaction: 94 },
  { time: '12 PM', satisfaction: 89 },
  { time: '1 PM', satisfaction: 85 },
  { time: '2 PM', satisfaction: 91 },
  { time: '3 PM', satisfaction: 96 },
  { time: '4 PM', satisfaction: 93 },
  { time: '5 PM', satisfaction: 87 }
];

const monthlySpendData = [
  { month: 'Jan', amount: 85 },
  { month: 'Feb', amount: 92 },
  { month: 'Mar', amount: 78 },
  { month: 'Apr', amount: 89 },
  { month: 'May', amount: 94 },
  { month: 'Jun', amount: 87 }
];

const keyMetrics = [
  {
    title: 'Total Hours Streamed',
    value: '127.5',
    change: '+12%',
    changeType: 'positive' as const,
    icon: Clock,
    description: 'This month'
  },
  {
    title: 'Skip Rate',
    value: '4.2%',
    change: '-18%',
    changeType: 'positive' as const,
    icon: SkipForward,
    description: 'Lower is better'
  },
  {
    title: 'Customer Likes',
    value: '1,247',
    change: '+28%',
    changeType: 'positive' as const,
    icon: Heart,
    description: 'Total interactions'
  },
  {
    title: 'Monthly Cost',
    value: '$89',
    change: '-5%',
    changeType: 'positive' as const,
    icon: DollarSign,
    description: 'Current billing period'
  }
];

const topPlaylists = [
  { name: 'Morning Energy', plays: 342, duration: '28.5h', satisfaction: 96 },
  { name: 'Lunch Vibes', plays: 298, duration: '24.2h', satisfaction: 94 },
  { name: 'Afternoon Focus', plays: 256, duration: '31.1h', satisfaction: 91 },
  { name: 'Evening Chill', plays: 189, duration: '18.7h', satisfaction: 93 },
  { name: 'Weekend Flow', plays: 167, duration: '22.3h', satisfaction: 89 }
];

export const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('7d');

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-lyra p-8 rounded-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2 text-foreground">Analytics Dashboard</h2>
            <p className="text-muted-foreground text-lg">
              Track your music performance and customer engagement
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Actions */}
        <div className="flex items-center justify-end">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {keyMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{metric.title}</p>
                    <h3 className="text-2xl font-semibold mt-1">{metric.value}</h3>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge 
                        variant={metric.changeType === 'positive' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {metric.change}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{metric.description}</span>
                    </div>
                  </div>
                  <Icon className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <Tabs defaultValue="streaming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="streaming">Streaming</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="cost">Cost Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="streaming" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Streaming Hours</CardTitle>
                <CardDescription>Total hours of music played each day</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={streamingData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="hours" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.1}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Genre Distribution</CardTitle>
                <CardDescription>Most popular music genres this week</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={genreData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {genreData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {genreData.map((genre, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: genre.color }}
                      />
                      <span>{genre.name}</span>
                      <span className="text-muted-foreground">{genre.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Skip Rate Trends</CardTitle>
                <CardDescription>Daily skip rates - lower is better</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={streamingData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="skips" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Satisfaction</CardTitle>
                <CardDescription>Hourly satisfaction scores throughout the day</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={customerSatisfactionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis domain={[80, 100]} />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="satisfaction" 
                      stroke="#10b981" 
                      fill="#10b981" 
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Playlists */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Playlists</CardTitle>
              <CardDescription>Your most successful playlists this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPlaylists.map((playlist, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Music className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{playlist.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {playlist.plays} plays • {playlist.duration}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <Heart className="w-4 h-4 text-red-500" />
                        <span className="font-medium">{playlist.satisfaction}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">satisfaction</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cost" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Spending</CardTitle>
              <CardDescription>Your Lyra subscription costs over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlySpendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="amount" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Cost Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Plan</p>
                    <h3 className="text-xl font-semibold">Business Pro</h3>
                    <p className="text-sm text-muted-foreground">Up to 10 locations</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Cost per Hour</p>
                    <h3 className="text-xl font-semibold">$0.70</h3>
                    <p className="text-sm text-green-600">-8% from last month</p>
                  </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Projected Next Month</p>
                    <h3 className="text-xl font-semibold">$92</h3>
                    <p className="text-sm text-muted-foreground">Based on current usage</p>
                  </div>
                  <Calendar className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
};
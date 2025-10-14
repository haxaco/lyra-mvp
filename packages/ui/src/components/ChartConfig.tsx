import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Lyra Brand Color Palette for Charts
export const CHART_COLORS = {
  primary: '#FF6F61',      // Coral Pink
  secondary: '#E6B8C2',    // Blush
  tertiary: '#F5CBA7',     // Warm Nude
  accent: '#FF8A80',       // Electric Salmon
  muted: '#D4A59A',        // Warm Coral
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
};

export const CHART_GRADIENT_COLORS = ['#FF6F61', '#E6B8C2', '#F5CBA7', '#FF8A80', '#D4A59A'];

// Example: Line Chart Component
interface LineChartExampleProps {
  data: Array<{ name: string; value: number; [key: string]: any }>;
  dataKey?: string;
  title?: string;
}

export const LineChartExample: React.FC<LineChartExampleProps> = ({
  data,
  dataKey = 'value',
  title
}) => {
  return (
    <div className="space-y-4">
      {title && <h3 className="text-foreground">{title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(43, 43, 43, 0.1)" />
          <XAxis 
            dataKey="name" 
            stroke="#6B5B5B"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6B5B5B"
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--foreground)'
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={CHART_COLORS.primary}
            strokeWidth={3}
            dot={{ fill: CHART_COLORS.primary, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Example: Bar Chart Component
interface BarChartExampleProps {
  data: Array<{ name: string; value: number; [key: string]: any }>;
  dataKey?: string;
  title?: string;
}

export const BarChartExample: React.FC<BarChartExampleProps> = ({
  data,
  dataKey = 'value',
  title
}) => {
  return (
    <div className="space-y-4">
      {title && <h3 className="text-foreground">{title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(43, 43, 43, 0.1)" />
          <XAxis 
            dataKey="name" 
            stroke="#6B5B5B"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6B5B5B"
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--foreground)'
            }}
          />
          <Legend />
          <Bar 
            dataKey={dataKey} 
            fill="url(#colorGradient)"
            radius={[8, 8, 0, 0]}
          />
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={1} />
              <stop offset="100%" stopColor={CHART_COLORS.accent} stopOpacity={0.8} />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Example: Pie Chart Component
interface PieChartExampleProps {
  data: Array<{ name: string; value: number }>;
  title?: string;
}

export const PieChartExample: React.FC<PieChartExampleProps> = ({
  data,
  title
}) => {
  return (
    <div className="space-y-4">
      {title && <h3 className="text-foreground">{title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(props: any) => `${props.name} ${(props.percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={CHART_GRADIENT_COLORS[index % CHART_GRADIENT_COLORS.length]} 
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--foreground)'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// Example Data
export const sampleLineChartData = [
  { name: 'Mon', value: 120 },
  { name: 'Tue', value: 150 },
  { name: 'Wed', value: 180 },
  { name: 'Thu', value: 140 },
  { name: 'Fri', value: 200 },
  { name: 'Sat', value: 250 },
  { name: 'Sun', value: 220 },
];

export const sampleBarChartData = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 5000 },
  { name: 'Apr', value: 4500 },
  { name: 'May', value: 6000 },
  { name: 'Jun', value: 5500 },
];

export const samplePieChartData = [
  { name: 'Jazz', value: 400 },
  { name: 'Pop', value: 300 },
  { name: 'Rock', value: 300 },
  { name: 'Electronic', value: 200 },
  { name: 'Classical', value: 150 },
];

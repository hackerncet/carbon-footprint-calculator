import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { fetchDashboard, fetchFootprints, deleteFootprint } from '../services/api.ts';
import GoalsWidget from '../components/GoalsWidget.tsx';
import { DashboardSummaryResponse, FootprintEntry } from '@carbon/shared';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Line, 
  ComposedChart
} from 'recharts';
import { Trash2, Activity, Info, Zap, Car, Utensils, Trash } from 'lucide-react';

interface DashboardProps {
  onStatsUpdate: (points: number, streak: number) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  energy: '#00d2ff',     // Cyan
  transport: '#ffb300',  // Amber
  food: 'hsl(158, 92%, 43%)', // Emerald
  waste: '#a855f7'       // Purple
};

import type { LucideIcon } from 'lucide-react';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  energy: Zap,
  transport: Car,
  food: Utensils,
  waste: Trash
};

export default function Dashboard({ onStatsUpdate }: DashboardProps) {
  const { user, getIdToken, reloadUser } = useAuth();
  const [data, setData] = useState<DashboardSummaryResponse | null>(null);
  const [recentEntries, setRecentEntries] = useState<FootprintEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [dashData, logs] = await Promise.all([
        fetchDashboard(getIdToken, user),
        fetchFootprints(getIdToken, user)
      ]);
      
      setData(dashData);
      setRecentEntries(logs.slice(0, 5)); // Keep only recent 5 entries
      
      // Update global states in layout
      onStatsUpdate(dashData.kpis.pointsEarned, dashData.kpis.activeStreak);
      setError('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch dashboard metrics.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    try {
      setLoading(true);
      setError('');
      if (reloadUser) {
        await reloadUser();
      }
      await loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch dashboard metrics.';
      setError(message);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this footprint log entry?')) return;
    try {
      await deleteFootprint(getIdToken, user, id);
      await loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete log entry.';
      alert(message);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-muted)' }} role="status">Analyzing your footprint logs...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div role="alert" style={{ padding: '24px', color: 'var(--danger)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h2>Something went wrong</h2>
        <p>{error}</p>
        <button onClick={handleRetry} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Retry</button>
      </div>
    );
  }

  const { kpis, breakdown, monthlyHistory } = data;

  // Generate dynamic, AI-like recommendation text based on highest emission categories
  const getCoachAdvice = () => {
    const sorted = [...breakdown].sort((a, b) => b.value - a.value);
    const highest = sorted[0];

    if (!highest || highest.value === 0) {
      return {
        title: "Start Logging!",
        advice: "You haven't logged any carbon entries yet. Head over to the Calculator to map out your footprint!",
        color: 'var(--primary)'
      };
    }

    switch (highest.category) {
      case 'energy':
        return {
          title: "Optimize Home Energy Usage",
          advice: "Home energy accounts for the majority of your footprint. Consider washing clothes at 30°C, installing smart power strips to kill vampire draws, or checking insulation.",
          color: CATEGORY_COLORS.energy
        };
      case 'transport':
        return {
          title: "Greener Commute Strategies",
          advice: "Transport is your biggest carbon output. Try swapping 1-2 car trips a week for public transport, walking/cycling, or combining journeys.",
          color: CATEGORY_COLORS.transport
        };
      case 'food':
        return {
          title: "Plant-Based Dietary Swaps",
          advice: "Food emissions are leading your profile. Beef has a carbon index of 27x other proteins. Replacing beef with poultry or plant-based meals once a week makes a massive dent.",
          color: CATEGORY_COLORS.food
        };
      case 'waste':
        return {
          title: "Zero Waste & Composting",
          advice: "Landfill waste produces methane. Try setting up separate recycling bins or composting organic waste. Recycled waste has a 95% lower footprint than landfill.",
          color: CATEGORY_COLORS.waste
        };
      default:
        return {
          title: "Maintain Balance",
          advice: "You're doing great! Keep tracking daily to unlock streak bonuses and complete active eco-challenges.",
          color: 'var(--primary)'
        };
    }
  };

  const advice = getCoachAdvice();

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.8px' }}>ZeroGrid Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>Welcome back, {user?.displayName || 'Grid Member'}. Here is your current carbon profile.</p>
        </div>
        <button onClick={loadData} className="btn btn-secondary">Sync Dashboard</button>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '24px'
      }}>
        <div className="card-glass" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Monthly Footprint</span>
          <span style={{ fontSize: '2rem', fontWeight: 800, color: kpis.totalCarbonThisMonthKg > 400 ? 'var(--danger)' : 'var(--primary)' }}>
            {kpis.totalCarbonThisMonthKg} <span style={{ fontSize: '1rem', fontWeight: 600 }}>kg CO2e</span>
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target: &lt; 400.0 kg</span>
        </div>

        <div className="card-glass" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>ZeroGrid Points</span>
          <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent)' }}>
            {kpis.pointsEarned} <span style={{ fontSize: '1rem', fontWeight: 600 }}>pts</span>
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Exchange points for offsets</span>
        </div>

        <div className="card-glass" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Streak</span>
          <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--danger)' }}>
            {kpis.activeStreak} <span style={{ fontSize: '1rem', fontWeight: 600 }}>days</span>
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Log entries daily to grow streak</span>
        </div>

        <div className="card-glass" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Challenges Won</span>
          <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--secondary)' }}>
            {kpis.challengesCompleted} <span style={{ fontSize: '1rem', fontWeight: 600 }}>won</span>
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Redeem awards & level up</span>
        </div>
      </div>

      {/* Main Charts & Coach Recommendations Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.7fr 1fr',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Historical Trends Area Chart */}
        <div className="card-glass" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Emissions & Offsets History</h2>
          <div style={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: 0,
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: 0
          }}>
            <table>
              <caption>Historical monthly emissions and offsets data table</caption>
              <thead>
                <tr>
                  <th scope="col">Month</th>
                  <th scope="col">Emissions (kg CO2e)</th>
                  <th scope="col">Offsets Bought (kg CO2e)</th>
                  <th scope="col">Paris Target Limit (kg CO2e)</th>
                </tr>
              </thead>
              <tbody>
                {monthlyHistory.map(h => (
                  <tr key={h.month}>
                    <td>{h.month}</td>
                    <td>{h.carbonKg} kg</td>
                    <td>{h.offsetKg} kg</td>
                    <td>{h.targetKg} kg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ width: '100%', height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="month" stroke="var(--text-muted)" style={{ fontSize: '0.8rem' }} />
                <YAxis stroke="var(--text-muted)" style={{ fontSize: '0.8rem' }} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'var(--bg-card)', 
                    borderColor: 'var(--border-color)', 
                    borderRadius: '8px',
                    color: 'var(--text-main)' 
                  }} 
                />
                <Legend style={{ fontSize: '0.85rem' }} />
                <Bar dataKey="carbonKg" name="Log Footprint (kg)" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="offsetKg" name="Offsets Bought (kg)" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="targetKg" name="Paris Target Limit" stroke="#ef4444" strokeWidth={2} dot={false} strokeDasharray="4 4" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category breakdown (Pie Chart) */}
        <div className="card-glass" style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Emission Breakdown</h2>
          <div style={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: 0,
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: 0
          }}>
            <table>
              <caption>Carbon footprint breakdown by category data table</caption>
              <thead>
                <tr>
                  <th scope="col">Category</th>
                  <th scope="col">Emissions (kg CO2e)</th>
                  <th scope="col">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map(b => (
                  <tr key={b.category}>
                    <td>{b.category}</td>
                    <td>{b.value} kg</td>
                    <td>{b.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ width: '100%', height: '200px', display: 'flex', justifyContent: 'center' }}>
            {breakdown.some(b => b.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={breakdown.filter(b => b.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="category"
                  >
                    {breakdown.filter(b => b.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.category]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} kg CO2e`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No footprint logs recorded yet.
              </div>
            )}
          </div>
          {/* Detailed breakdown list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {breakdown.map(b => {
              const Icon = CATEGORY_ICONS[b.category] || Activity;
              return (
                <div key={b.category} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      backgroundColor: `${CATEGORY_COLORS[b.category]}20`,
                      color: CATEGORY_COLORS[b.category],
                      padding: '6px',
                      borderRadius: '8px',
                      display: 'flex'
                    }}>
                      <Icon size={14} />
                    </div>
                    <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{b.category}</span>
                  </div>
                  <div style={{ fontWeight: 700 }}>
                    {b.value} kg <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.8rem' }}>({b.percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Coach, Goals & Recent History Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Eco Coach Smart Advice */}
        <div className="card-glass" style={{
          borderLeft: `4px solid ${advice.color}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={20} color="var(--primary)" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Grid Intelligence</h2>
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: advice.color }}>{advice.title}</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>{advice.advice}</p>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.8rem',
            color: 'var(--primary)',
            background: 'var(--primary-glow)',
            padding: '8px 12px',
            borderRadius: '6px',
            fontWeight: 600,
            marginTop: '10px'
          }}>
            <Info size={14} />
            <span>Switch to the Calculator tab to log new records.</span>
          </div>
        </div>

        {/* Goals Budget Progress Widget */}
        <GoalsWidget
          goals={data.goals || []}
          currentBreakdown={breakdown}
          totalThisMonth={kpis.totalCarbonThisMonthKg}
          onGoalUpdated={loadData}
        />

        {/* Recent logs table */}
        <div className="card-glass" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Recent Activities</h2>
            <Link to="/calculator" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Log New Entry</Link>
          </div>
          
          {recentEntries.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No carbon logs saved. Start by running your first calculation!
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px 8px' }}>Date</th>
                    <th style={{ padding: '12px 8px' }}>Category</th>
                    <th style={{ padding: '12px 8px' }}>Detail</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right' }}>Emissions</th>
                    <th style={{ padding: '12px 8px', width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {recentEntries.map(entry => {
                    const Icon = CATEGORY_ICONS[entry.category] || Activity;
                    interface FootprintMetadata {
                      subCategory?: string;
                      notes?: string;
                      calculatedUnit?: string;
                    }
                    const meta = (typeof entry.metadata === 'string'
                      ? JSON.parse(entry.metadata)
                      : entry.metadata) as FootprintMetadata | null | undefined;
                    return (
                      <tr key={entry.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '12px 8px', fontWeight: 500 }}>{entry.entryDate}</td>
                        <td style={{ padding: '12px 8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              backgroundColor: `${CATEGORY_COLORS[entry.category]}20`,
                              color: CATEGORY_COLORS[entry.category],
                              padding: '6px',
                              borderRadius: '6px',
                              display: 'flex'
                            }}>
                              <Icon size={14} />
                            </div>
                            <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{entry.category}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>
                          {meta?.subCategory ? (
                            <span style={{ textTransform: 'capitalize' }}>
                              {meta.subCategory.replace('_', ' ')}: {entry.inputValue} {entry.inputUnit}
                            </span>
                          ) : (
                            `${entry.inputValue} ${entry.inputUnit}`
                          )}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700, color: 'var(--danger)' }}>
                          +{entry.carbonCo2eKg} kg
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            aria-label={`Delete ${entry.category} log entry`}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '4px',
                              display: 'flex',
                              transition: 'color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

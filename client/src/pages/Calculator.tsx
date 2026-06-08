import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { createFootprint, fetchDashboard } from '../services/api.ts';
import { EMISSION_FACTORS } from '@carbon/shared';
import { 
  Zap, 
  Car, 
  Utensils, 
  Trash, 
  HelpCircle,
  AlertCircle,
  CheckCircle,
  Flame,
  Trophy
} from 'lucide-react';

interface CalculatorProps {
  onStatsUpdate: (points: number, streak: number) => void;
}

const SUB_CATEGORIES = {
  energy: [
    { value: 'electricity', label: 'Electricity (Grid)', unit: 'kWh' },
    { value: 'natural_gas', label: 'Natural Gas', unit: 'kWh' },
  ],
  transport: [
    { value: 'petrol_car', label: 'Petrol Car', unit: 'km' },
    { value: 'diesel_car', label: 'Diesel Car', unit: 'km' },
    { value: 'electric_car', label: 'Electric Car', unit: 'km' },
    { value: 'bus', label: 'Bus Transit', unit: 'km' },
    { value: 'train', label: 'Train/Subway', unit: 'km' },
    { value: 'flight_short', label: 'Flight (Short haul &lt; 3h)', unit: 'km' },
    { value: 'flight_long', label: 'Flight (Long haul &gt; 3h)', unit: 'km' },
  ],
  food: [
    { value: 'beef', label: 'Beef consumption', unit: 'kg' },
    { value: 'poultry', label: 'Poultry & Pork', unit: 'kg' },
    { value: 'vegetarian', label: 'Vegetarian meals weight', unit: 'kg' },
    { value: 'vegan', label: 'Vegan meals weight', unit: 'kg' },
  ],
  waste: [
    { value: 'landfill', label: 'Landfill / General Waste', unit: 'kg' },
    { value: 'recycled', label: 'Recycled / Composted Waste', unit: 'kg' },
  ],
};

type Category = 'energy' | 'transport' | 'food' | 'waste';

export default function Calculator({ onStatsUpdate }: CalculatorProps) {
  const { user, getIdToken } = useAuth();
  const [activeTab, setActiveTab] = useState<Category>('energy');
  const [subCategory, setSubCategory] = useState('electricity');
  const [inputValue, setInputValue] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  
  const [successData, setSuccessData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Automatically select first subcategory when tab changes
  useEffect(() => {
    const defaultSub = SUB_CATEGORIES[activeTab][0].value;
    setSubCategory(defaultSub);
    setInputValue('');
    setNotes('');
    setSuccessData(null);
  }, [activeTab]);

  // Compute live calculations reactively as derived state to prevent extra render passes
  const livePreview = useMemo(() => {
    if (inputValue === '' || isNaN(inputValue) || inputValue <= 0) {
      return null;
    }

    // Attempt local calculation for instant zero-latency feedback
    try {
      let factor = 0;
      if (activeTab === 'energy') {
        factor = EMISSION_FACTORS.energy[subCategory as keyof typeof EMISSION_FACTORS.energy] || 0;
      } else if (activeTab === 'transport') {
        factor = EMISSION_FACTORS.transport[subCategory as keyof typeof EMISSION_FACTORS.transport] || 0;
      } else if (activeTab === 'food') {
        factor = EMISSION_FACTORS.food[subCategory as keyof typeof EMISSION_FACTORS.food] || 0;
      } else if (activeTab === 'waste') {
        factor = EMISSION_FACTORS.waste[subCategory as keyof typeof EMISSION_FACTORS.waste] || 0;
      }
      return parseFloat((inputValue * factor).toFixed(2));
    } catch (e) {
      return null;
    }
  }, [inputValue, subCategory, activeTab]);

  const activeSubConfig = SUB_CATEGORIES[activeTab].find(s => s.value === subCategory);
  const currentUnit = activeSubConfig?.unit || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue === '' || inputValue <= 0) {
      setError('Please enter a valid amount greater than zero.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccessData(null);

      const payload = {
        entryDate: new Date().toISOString().split('T')[0], // Today's date YYYY-MM-DD
        category: activeTab,
        inputValue: Number(inputValue),
        inputUnit: currentUnit,
        subCategory,
        notes: notes.trim()
      };

      const result = await createFootprint(getIdToken, user, payload);
      setSuccessData(result);
      
      // Reset inputs
      setInputValue('');
      setNotes('');

      // Refresh layout points and streak widget
      if (result.gamification) {
        try {
          const dashData = await fetchDashboard(getIdToken, user);
          onStatsUpdate(dashData.kpis.pointsEarned, dashData.kpis.activeStreak);
        } catch (dashboardErr) {
          console.error('Failed to update stats after footprint entry:', dashboardErr);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to log footprint entry.');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'energy', label: 'Home Energy', icon: Zap },
    { id: 'transport', label: 'Transport', icon: Car },
    { id: 'food', label: 'Diet & Food', icon: Utensils },
    { id: 'waste', label: 'Waste', icon: Trash },
  ];

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      <div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.8px' }}>Carbon Calculator</h1>
        <p style={{ color: 'var(--text-muted)' }}>Input your daily metrics to log your carbon output and earn ZeroGrid Points.</p>
      </div>

      {/* Categories Tabs Navigation */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-color)',
        gap: '4px',
        overflowX: 'auto',
        paddingBottom: '2px'
      }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Category)}
              aria-selected={isActive}
              role="tab"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Form container */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', alignItems: 'start' }}>
        <form onSubmit={handleSubmit} className="card-glass" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Subcategory dropdown */}
          <div className="form-group">
            <label className="form-label" htmlFor="subcategory-select">Select Type</label>
            <select
              id="subcategory-select"
              className="form-select"
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
            >
              {SUB_CATEGORIES[activeTab].map(item => (
                <option key={item.value} value={item.value} dangerouslySetInnerHTML={{ __html: item.label }} />
              ))}
            </select>
          </div>

          {/* Amount input */}
          <div className="form-group">
            <label className="form-label" htmlFor="value-input">
              Amount ({currentUnit})
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="value-input"
                className="form-input"
                type="number"
                step="any"
                min="0.01"
                required
                placeholder={`e.g. 50`}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value === '' ? '' : Number(e.target.value))}
              />
              <span style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                fontWeight: 600
              }} dangerouslySetInnerHTML={{ __html: currentUnit }}>
              </span>
            </div>
          </div>

          {/* Optional Notes */}
          <div className="form-group">
            <label className="form-label" htmlFor="notes-input">Notes (Optional)</label>
            <input
              id="notes-input"
              className="form-input"
              type="text"
              placeholder="e.g. Weekly grocery run, commute to office"
              maxLength={200}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--danger)',
              background: 'rgba(239, 68, 68, 0.1)',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '0.85rem'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', height: '48px' }}
          >
            {loading ? 'Submitting Log...' : 'Save Log Entry'}
          </button>
        </form>

        {/* Live Preview / Calculations display sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Carbon live index preview */}
          <div className="card-glass" style={{
            background: 'linear-gradient(135deg, var(--primary-glow) 0%, rgba(18, 18, 22, 0.2) 100%)',
            borderColor: 'var(--primary)',
            borderRadius: '8px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            padding: '32px 24px'
          }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Calculated Impact
            </span>
            <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>
              {livePreview !== null ? livePreview : '0.00'}
              <span style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '6px' }}>kg CO2e</span>
            </span>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Based on standard conversion factors. 1 kg CO2e is equivalent to driving approx 6 km in a petrol car.
            </p>
          </div>

          {/* Quick reference guide */}
          <div className="card-glass" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontWeight: 700, fontSize: '0.95rem' }}>
              <HelpCircle size={16} />
              <span>Reference Guidelines</span>
            </div>
            <ul style={{ paddingLeft: '16px', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong>Electricity</strong>: Average home uses about 300 kWh per month.</li>
              <li><strong>Petrol Car</strong>: Standard commute averages 20–30 km daily.</li>
              <li><strong>Diet (Beef)</strong>: A single beef burger patty (~150g) yields ~4 kg CO2e.</li>
              <li><strong>Recycling</strong>: Recycling saves 95% of greenhouse emissions vs landfill.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Gamification Success Toast Modal */}
      {successData && (
        <div className="animate-fade-in" style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          maxWidth: '380px',
          background: 'var(--bg-card)',
          backdropFilter: 'var(--glass-blur)',
          border: '1px solid var(--primary)',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          zIndex: 1000
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={22} color="var(--primary)" />
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>Emissions Logged successfully!</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Carbon Footprint:</span>
              <strong style={{ color: 'var(--danger)' }}>+{successData.entry.carbonCo2eKg} kg CO2e</strong>
            </div>
            
            {successData.gamification.pointsAwarded > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--accent)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Trophy size={14} /> Points Earned:
                </span>
                <strong>+{successData.gamification.pointsAwarded} pts</strong>
              </div>
            )}

            {successData.gamification.streakUpdated && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--danger)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Flame size={14} /> Streak Updated:
                </span>
                <strong>Active daily streak incremented!</strong>
              </div>
            )}

            {successData.gamification.completedChallenges.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '6px', paddingTop: '6px' }}>
                <div style={{ fontWeight: 700, color: 'var(--success)', marginBottom: '4px' }}>Challenges Completed!</div>
                <ul style={{ listStyle: 'inside', color: 'var(--text-muted)', paddingLeft: '4px' }}>
                  {successData.gamification.completedChallenges.map((title: string) => (
                    <li key={title}>{title}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <button 
            onClick={() => setSuccessData(null)}
            className="btn btn-secondary" 
            style={{ width: '100%', padding: '6px', fontSize: '0.8rem' }}
          >
            Dismiss
          </button>
        </div>
      )}

    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { fetchDashboard, fetchOffsetsHistory, purchaseOffset } from '../services/api.ts';
import { SIMULATED_PROJECTS } from '@carbon/shared';
import { OffsetPurchase } from '@carbon/shared';
import { 
  Trophy, 
  ShoppingBag, 
  MapPin, 
  Globe, 
  TreePine, 
  Wind, 
  Droplet,
  Download,
  AlertCircle
} from 'lucide-react';

interface OffsetMarketplaceProps {
  onStatsUpdate: (points: number, streak: number) => void;
}

const PROJECT_ICONS: Record<string, any> = {
  amazon_reforestation: TreePine,
  wind_energy_texas: Wind,
  clean_water_uganda: Droplet
};

const PROJECT_COLORS: Record<string, string> = {
  amazon_reforestation: '#10b981', // Emerald
  wind_energy_texas: '#0ea5e9',    // Sky
  clean_water_uganda: '#06b6d4'    // Cyan
};

export default function OffsetMarketplace({ onStatsUpdate }: OffsetMarketplaceProps) {
  const { user, getIdToken } = useAuth();
  const [points, setPoints] = useState(0);
  const [history, setHistory] = useState<OffsetPurchase[]>([]);
  
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [offsetValue, setOffsetValue] = useState<number | ''>('');
  const [certificateData, setCertificateData] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashData, purchaseHistory] = await Promise.all([
        fetchDashboard(getIdToken, user),
        fetchOffsetsHistory(getIdToken, user)
      ]);
      
      setPoints(dashData.user.points);
      setHistory(purchaseHistory);
      onStatsUpdate(dashData.user.points, dashData.user.currentStreak);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch marketplace data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setOffsetValue('');
    setError('');
    setCertificateData(null);
  };

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || offsetValue === '' || offsetValue <= 0) {
      setError('Please enter a valid offset weight.');
      return;
    }

    const project = SIMULATED_PROJECTS.find(p => p.id === selectedProjectId);
    if (!project) return;

    const pointsCost = Math.round(Number(offsetValue) * project.factor);
    if (points < pointsCost) {
      setError(`Insufficient ZeroGrid Points. Cost: ${pointsCost} pts, Balance: ${points} pts`);
      return;
    }

    try {
      setBuying(true);
      setError('');

      const result = await purchaseOffset(getIdToken, user, {
        projectId: selectedProjectId,
        offsetAmountCo2eKg: Number(offsetValue)
      });

      // Generate certificate for local preview
      setCertificateData({
        certificateId: result.purchase.id,
        userName: user?.displayName || user?.email?.split('@')[0] || 'Eco Warrior',
        projectName: project.name,
        offsetAmount: Number(offsetValue),
        purchasedDate: new Date().toLocaleDateString(),
        pointsCost
      });

      // Sync user data / points
      setPoints(result.user.points);
      setSelectedProjectId(null);
      setOffsetValue('');

      // Refresh list
      const purchaseHistory = await fetchOffsetsHistory(getIdToken, user);
      setHistory(purchaseHistory);

      onStatsUpdate(result.user.points, result.user.currentStreak);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Offset purchase failed.');
    } finally {
      setBuying(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-muted)' }}>Opening Eco Marketplace...</div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.8px' }}>Carbon Offsets</h1>
          <p style={{ color: 'var(--text-muted)' }}>Neutralize your carbon footprint by investing earned ZeroGrid Points into green projects.</p>
        </div>
        
        {/* Points indicator */}
        <div className="card-glass" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 24px',
          background: 'var(--primary-glow)',
          borderColor: 'var(--primary)',
          borderRadius: '12px'
        }}>
          <Trophy size={20} color="var(--primary)" />
          <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            {points} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>pts available</span>
          </span>
        </div>
      </div>

      {/* Grid: Projects list & Purchase console */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Projects list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {SIMULATED_PROJECTS.map(project => {
            const Icon = PROJECT_ICONS[project.id] || Globe;
            const color = PROJECT_COLORS[project.id] || 'var(--primary)';
            const isSelected = selectedProjectId === project.id;

            return (
              <div 
                key={project.id}
                className="card-glass"
                style={{
                  display: 'flex',
                  gap: '20px',
                  cursor: 'pointer',
                  border: isSelected ? `2px solid ${color}` : '1px solid var(--border-color)',
                  background: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                  transform: isSelected ? 'scale(1.01)' : 'none'
                }}
                onClick={() => handleSelectProject(project.id)}
              >
                <div style={{
                  backgroundColor: `${color}15`,
                  color,
                  width: '64px',
                  height: '64px',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Icon size={32} />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{project.name}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        <MapPin size={12} />
                        <span>{project.region}</span>
                        <span>•</span>
                        <span>{project.type}</span>
                      </div>
                    </div>
                    <span style={{
                      backgroundColor: 'var(--primary-glow)',
                      color: 'var(--primary)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '8px'
                    }}>
                      {project.factor} pts / kg CO2e
                    </span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{project.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Purchase Console Side Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {selectedProjectId ? (
            <form onSubmit={handlePurchase} className="card-glass" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Invest Points</h2>
              
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Investing in: <strong>{SIMULATED_PROJECTS.find(p => p.id === selectedProjectId)?.name}</strong>
              </div>

              {/* Offset value input */}
              <div className="form-group">
                <label className="form-label" htmlFor="offset-input">Amount of Carbon to offset (kg)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="offset-input"
                    className="form-input"
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 50"
                    value={offsetValue}
                    onChange={(e) => setOffsetValue(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                  <span style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    fontWeight: 600
                  }}>
                    kg
                  </span>
                </div>
              </div>

              {/* Points calculation details */}
              {offsetValue !== '' && offsetValue > 0 && (
                <div style={{
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'var(--border-color)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Calculated Cost:</span>
                    <strong style={{ color: 'var(--accent)' }}>
                      {Math.round(Number(offsetValue) * (SIMULATED_PROJECTS.find(p => p.id === selectedProjectId)?.factor || 0))} pts
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Your Balance:</span>
                    <span>{points} pts</span>
                  </div>
                </div>
              )}

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

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedProjectId(null)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={buying}
                  className="btn btn-primary"
                  style={{ flex: 1.5 }}
                >
                  {buying ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </form>
          ) : (
            <div className="card-glass" style={{
              textAlign: 'center',
              padding: '30px 20px',
              color: 'var(--text-muted)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              alignItems: 'center'
            }}>
              <ShoppingBag size={36} color="var(--primary)" />
              <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>Select a Project</div>
              <p style={{ fontSize: '0.8rem' }}>Click on any of the listed offset projects to allocate your ZeroGrid Points.</p>
            </div>
          )}
        </div>
      </div>

      {/* Generated Certificate Display (Mock PDF) */}
      {certificateData && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', marginTop: '16px' }} className="print-certificate-area">
          <div className="card-glass" style={{
            width: '100%',
            maxWidth: '700px',
            border: '6px double var(--primary)',
            background: 'var(--bg-card)',
            padding: '40px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            position: 'relative',
            boxShadow: 'var(--shadow-md)'
          }}>
            {/* Corner styling */}
            <div style={{ position: 'absolute', top: '10px', left: '10px', color: 'var(--primary)' }}><TreePine size={24} /></div>
            <div style={{ position: 'absolute', top: '10px', right: '10px', color: 'var(--primary)' }}><Wind size={24} /></div>

            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '2px', textTransform: 'uppercase' }}>
                Eco Coach Certification
              </span>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'serif', marginTop: '10px' }}>
                Certificate of Carbon Offset
              </h2>
            </div>

            <p style={{ fontSize: '1rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>
              This certifies that
            </p>

            <h3 style={{ fontSize: '1.8rem', fontWeight: 700, textDecoration: 'underline', color: 'var(--text-main)' }}>
              {certificateData.userName}
            </h3>

            <p style={{ fontSize: '0.95rem', maxWidth: '520px', margin: '0 auto', lineHeight: '1.6', color: 'var(--text-muted)' }}>
              has successfully neutralized a total of <strong style={{ color: 'var(--primary)' }}>{certificateData.offsetAmount} kg</strong> of carbon dioxide equivalent (CO2e) emissions by investing <strong>{certificateData.pointsCost} ZeroGrid Points</strong> into the simulated project:
            </p>

            <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {certificateData.projectName}
            </h4>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '20px',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              marginTop: '10px'
            }}>
              <div>
                Date: <strong>{certificateData.purchasedDate}</strong>
              </div>
              <div>
                Certificate ID: <strong style={{ fontFamily: 'monospace' }}>{certificateData.certificateId.substring(0, 18)}...</strong>
              </div>
            </div>

            {/* Signature Seal */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                border: '2px dashed var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
                fontWeight: 800,
                fontSize: '0.8rem',
                transform: 'rotate(-10deg)'
              }}>
                APPROVED
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handlePrint} className="btn btn-primary">
              <Download size={18} /> Print Certificate
            </button>
            <button onClick={() => setCertificateData(null)} className="btn btn-secondary">
              Close Preview
            </button>
          </div>
        </div>
      )}

      {/* History table */}
      <div className="card-glass" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Offset History</h2>
        {history.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            You haven't purchased any carbon offset allocations yet. Log activities to earn points!
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 8px' }}>Date</th>
                  <th style={{ padding: '12px 8px' }}>Project</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right' }}>Points Cost</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right' }}>Offset Amount</th>
                </tr>
              </thead>
              <tbody>
                {history.map(item => {
                  const project = SIMULATED_PROJECTS.find(p => p.id === item.projectId);
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 8px' }}>
                        {new Date(item.purchasedAt * 1000).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px 8px', fontWeight: 600 }}>
                        {project?.name || item.projectId}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', color: 'var(--accent)', fontWeight: 600 }}>
                        -{item.costSimulatedCurrency} pts
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', color: 'var(--primary)', fontWeight: 700 }}>
                        -{item.offsetAmountCo2eKg} kg CO2e
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
  );
}

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { saveGoal } from '../services/api.ts';
import { UserGoal } from '@carbon/shared';
import { Target, Plus, ShieldAlert, CheckCircle } from 'lucide-react';

interface GoalsWidgetProps {
  goals: UserGoal[];
  currentBreakdown: { category: string; value: number }[];
  totalThisMonth: number;
  onGoalUpdated: () => void;
}

export default function GoalsWidget({ goals, currentBreakdown, totalThisMonth, onGoalUpdated }: GoalsWidgetProps) {
  const { getIdToken, user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState('total');
  const [targetValue, setTargetValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

  const getCurrentEmissions = (cat: string) => {
    if (cat === 'total') return totalThisMonth;
    const found = currentBreakdown.find(b => b.category === cat);
    return found ? found.value : 0;
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetValue || parseFloat(targetValue) <= 0) {
      setError('Please enter a positive budget target.');
      return;
    }

    try {
      setError('');
      setSuccess('');
      setSubmitting(true);

      await saveGoal(getIdToken, user, {
        category,
        targetValue: parseFloat(targetValue),
        targetMonth: currentMonthStr
      });

      setSuccess('Eco budget set successfully!');
      setTargetValue('');
      setShowForm(false);
      onGoalUpdated();

      // Clear success alert after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save eco budget.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card-glass" style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Target size={20} color="var(--primary)" />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Monthly Carbon Budgets</h2>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-secondary"
          aria-expanded={showForm}
          style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <Plus size={14} />
          {showForm ? 'Cancel' : 'Set Budget'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSaveGoal} style={{
          background: 'var(--border-color)',
          padding: '16px',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="goal-category" style={{ fontSize: '0.8rem' }}>Category</label>
            <select
              id="goal-category"
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ padding: '8px 12px', fontSize: '0.9rem' }}
            >
              <option value="total">Total Monthly Footprint</option>
              <option value="energy">Home Energy</option>
              <option value="transport">Transport</option>
              <option value="food">Diet / Food</option>
              <option value="waste">Waste</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="goal-value" style={{ fontSize: '0.8rem' }}>Monthly Limit (kg CO2e)</label>
            <input
              id="goal-value"
              className="form-input"
              type="number"
              required
              min="1"
              placeholder="e.g. 300"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              style={{ padding: '8px 12px', fontSize: '0.9rem' }}
            />
          </div>

          {error && <div role="alert" aria-live="assertive" style={{ fontSize: '0.75rem', color: '#ef4444' }}>{error}</div>}

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{ width: '100%', height: '36px', fontSize: '0.85rem' }}
          >
            {submitting ? 'Saving...' : 'Save Carbon Goal'}
          </button>
        </form>
      )}

      {success && (
        <div role="status" aria-live="polite" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: '#10b981',
          fontSize: '0.8rem',
          background: 'rgba(16,185,129,0.08)',
          padding: '8px 12px',
          borderRadius: '8px'
        }}>
          <CheckCircle size={14} />
          <span>{success}</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} role="region" aria-label="Monthly Goals Progress">
        {goals.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No budgets configured for this month. Set a budget limit to track your carbon reduction targets!
          </div>
        ) : (
          goals.map(goal => {
            const current = getCurrentEmissions(goal.category);
            const percentage = Math.min(Math.round((current / goal.targetValue) * 100), 200);
            const isExceeded = current > goal.targetValue;
            
            // Choose warning colors based on percentage
            let barColor = 'var(--primary)'; // Green
            if (percentage > 100) barColor = '#ef4444'; // Red
            else if (percentage > 80) barColor = '#f59e0b'; // Orange

            return (
              <div key={goal.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ textTransform: 'capitalize', fontWeight: 700 }}>
                    {goal.category === 'total' ? 'Total Footprint' : goal.category} Budget
                  </span>
                  <span style={{ fontWeight: 600, color: isExceeded ? '#ef4444' : 'var(--text-main)' }}>
                    {current.toFixed(1)} / {goal.targetValue.toFixed(0)} kg ({percentage}%)
                  </span>
                </div>
                
                {/* Progress bar tracks */}
                <div
                  role="progressbar"
                  aria-valuenow={Math.min(percentage, 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${goal.category === 'total' ? 'Total Footprint' : goal.category} budget: ${percentage}%`}
                  style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: 'var(--border-color)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                >
                  <div style={{
                    width: `${Math.min(percentage, 100)}%`,
                    height: '100%',
                    backgroundColor: barColor,
                    borderRadius: '4px',
                    transition: 'width 0.3s ease, background-color 0.3s ease'
                  }}></div>
                </div>

                {isExceeded && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '0.7rem', fontWeight: 600 }}>
                    <ShieldAlert size={12} />
                    <span>Exceeded budget by {(current - goal.targetValue).toFixed(1)} kg!</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

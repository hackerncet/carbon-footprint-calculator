import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { fetchChallenges, fetchAchievements, fetchDashboard } from '../services/api.ts';
import { ECO_CHALLENGES } from '@carbon/shared';
import { UserChallenge, UserAchievement } from '@carbon/shared';
import { 
  Trophy, 
  Flame, 
  Lock, 
  Star, 
  Calendar,
  Zap,
  Car,
  Utensils,
  Trash,
  Activity
} from 'lucide-react';

interface GamificationProps {
  onStatsUpdate: (points: number, streak: number) => void;
}

const BADGES_CONFIG = [
  {
    id: 'first_calculation',
    title: 'First Step Logged',
    description: 'Logged your very first carbon calculation entry.',
    iconColor: '#3b82f6',
  },
  {
    id: 'streak_7',
    title: 'Weekly Warrior',
    description: 'Logged footprint logs for 7 consecutive days.',
    iconColor: '#ef4444',
  },
  {
    id: 'streak_30',
    title: 'Habit Builder',
    description: 'Logged footprint logs for 30 consecutive days.',
    iconColor: '#f59e0b',
  },
  {
    id: 'challenge_conqueror',
    title: 'Challenge Master',
    description: 'Completed your first ZeroGrid challenge.',
    iconColor: '#10b981',
  },
  {
    id: 'carbon_offset_champion',
    title: 'Carbon Neutral Patron',
    description: 'Purchased your first simulated carbon offset project.',
    iconColor: '#8b5cf6',
  }
];

const CATEGORY_ICONS: Record<string, any> = {
  energy: Zap,
  transport: Car,
  food: Utensils,
  waste: Trash
};

export default function Gamification({ onStatsUpdate }: GamificationProps) {
  const { user, getIdToken } = useAuth();
  const [challenges, setChallenges] = useState<UserChallenge[]>([]);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [userChallengesList, userAchievementsList, dashData] = await Promise.all([
        fetchChallenges(getIdToken, user),
        fetchAchievements(getIdToken, user),
        fetchDashboard(getIdToken, user)
      ]);

      setChallenges(userChallengesList);
      setAchievements(userAchievementsList);
      setPoints(dashData.user.points);
      setStreak(dashData.user.currentStreak);

      onStatsUpdate(dashData.user.points, dashData.user.currentStreak);
    } catch (err: any) {
      console.error('Failed to fetch gamification profile details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-muted)' }}>Syncing milestones...</div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header Banner */}
      <div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.8px' }}>Grid Challenges</h1>
        <p style={{ color: 'var(--text-muted)' }}>Complete grid targets, maintain calculations consistency, and unlock badges.</p>
      </div>

      {/* Stats Quickbar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px'
      }}>
        <div className="card-glass" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            color: 'var(--accent)',
            padding: '16px',
            borderRadius: '16px'
          }}>
            <Trophy size={32} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total ZeroGrid Points</div>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>{points} pts</div>
          </div>
        </div>

        <div className="card-glass" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            color: 'var(--danger)',
            padding: '16px',
            borderRadius: '16px'
          }}>
            <Flame size={32} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Daily Streak</div>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>{streak} days</div>
          </div>
        </div>
      </div>

      {/* Main challenges block */}
      <div className="card-glass" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Active Grid Challenges</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {ECO_CHALLENGES.map(challenge => {
            const userChallenge = challenges.find(c => c.challengeId === challenge.id);
            const isCompleted = userChallenge?.status === 'completed';
            const progress = userChallenge?.progress || 0;
            const percentage = Math.min((progress / challenge.target) * 100, 100);
            const Icon = CATEGORY_ICONS[challenge.category] || Activity;

            return (
              <div 
                key={challenge.id}
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: '14px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px',
                  background: isCompleted ? 'rgba(16, 185, 129, 0.04)' : 'transparent',
                  borderColor: isCompleted ? 'rgba(16, 185, 129, 0.2)' : 'var(--border-color)',
                  transition: 'all 0.25s'
                }}
              >
                <div>
                  {/* Title & Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        backgroundColor: isCompleted ? 'rgba(16, 185, 129, 0.15)' : 'var(--border-color)',
                        color: isCompleted ? 'var(--success)' : 'var(--text-muted)',
                        padding: '8px',
                        borderRadius: '10px'
                      }}>
                        <Icon size={18} />
                      </div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{challenge.title}</h3>
                    </div>
                    {isCompleted ? (
                      <span style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        color: 'var(--success)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '4px 8px',
                        borderRadius: '20px'
                      }}>Completed</span>
                    ) : (
                      <span style={{
                        backgroundColor: 'var(--primary-glow)',
                        color: 'var(--primary)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '4px 8px',
                        borderRadius: '20px'
                      }}>+{challenge.pointsReward} pts</span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{challenge.description}</p>
                </div>

                {/* Progress bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                    <span>Progress</span>
                    <span>{progress} / {challenge.target}</span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: 'var(--border-color)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${percentage}%`,
                      height: '100%',
                      backgroundColor: isCompleted ? 'var(--success)' : 'var(--primary)',
                      borderRadius: '4px',
                      transition: 'width 0.4s ease-out'
                    }}></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badge gallery */}
      <div className="card-glass" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Badges Gallery</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '20px'
        }}>
          {BADGES_CONFIG.map(badge => {
            const hasBadge = achievements.some(a => a.badgeId === badge.id);
            const achievementDetails = achievements.find(a => a.badgeId === badge.id);
            
            return (
              <div 
                key={badge.id}
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '24px 16px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  opacity: hasBadge ? 1 : 0.4,
                  background: hasBadge ? 'var(--bg-card-hover)' : 'transparent',
                  transition: 'transform 0.2s, opacity 0.2s'
                }}
              >
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: hasBadge ? `${badge.iconColor}15` : 'var(--border-color)',
                  color: hasBadge ? badge.iconColor : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: hasBadge ? `0 8px 20px -6px ${badge.iconColor}` : 'none'
                }}>
                  {hasBadge ? <Star size={32} fill={badge.iconColor} /> : <Lock size={28} />}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{badge.title}</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>{badge.description}</p>
                </div>

                {hasBadge && achievementDetails && (
                  <span style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginTop: '4px'
                  }}>
                    <Calendar size={12} />
                    {new Date(achievementDetails.awardedAt * 1000).toLocaleDateString()}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { User, Rating } from '../types';
import { ratingService } from '../services/ratings/ratingService';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

type SkillLevel = 'newbie' | 'intermediate' | 'advanced';
type SatisfactionLevel = 'bad' | 'ok' | 'great';

interface PlayerRating {
  playerId: string;
  skill: SkillLevel;
  satisfaction: SatisfactionLevel;
  stars: number;
  comment?: string;
}

interface RatingModalProps {
  eventId: string;
  players: User[];
  currentUserId: string;
  onClose: () => void;
  onSubmitted?: () => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  eventId,
  players,
  currentUserId,
  onClose,
  onSubmitted,
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [ratings, setRatings] = useState<Record<string, PlayerRating>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submittedRatings, setSubmittedRatings] = useState<Rating[]>([]);

  // Filter out current user from players to rate
  const playersToRate = players.filter(p => p.id !== currentUserId);

  useEffect(() => {
    // Check if user has already submitted ratings
    const checkExistingRatings = async () => {
      try {
        const existing = await ratingService.getUserRatingsForEvent(eventId, currentUserId);
        if (existing.length > 0) {
          setHasSubmitted(true);
          setSubmittedRatings(existing);
          // Pre-fill ratings
          const prefill: Record<string, PlayerRating> = {};
          existing.forEach(rating => {
            // Convert numeric skill to skill level if needed
            let skillLevel: SkillLevel = 'advanced';
            if (typeof rating.skill === 'number') {
              if (rating.skill <= 2) skillLevel = 'newbie';
              else if (rating.skill >= 4) skillLevel = 'advanced';
              else skillLevel = 'intermediate';
            } else if (rating.skill && ['newbie', 'intermediate', 'advanced'].includes(rating.skill as string)) {
              skillLevel = rating.skill as SkillLevel;
            }
            
            // Convert numeric satisfaction to satisfaction level if needed
            let satisfactionLevel: SatisfactionLevel = 'great';
            if (typeof rating.satisfaction === 'number') {
              if (rating.satisfaction <= 2) satisfactionLevel = 'bad';
              else if (rating.satisfaction >= 4) satisfactionLevel = 'great';
              else satisfactionLevel = 'ok';
            } else if (rating.satisfaction && ['bad', 'ok', 'great'].includes(rating.satisfaction as string)) {
              satisfactionLevel = rating.satisfaction as SatisfactionLevel;
            }
            
            prefill[rating.ratedUserId] = {
              playerId: rating.ratedUserId,
              skill: skillLevel,
              satisfaction: satisfactionLevel,
              stars: rating.stars,
              comment: rating.comment,
            };
          });
          setRatings(prefill);
        }
      } catch (error) {
        console.error('Error checking existing ratings:', error);
      }
    };

    checkExistingRatings();
  }, [eventId, currentUserId]);

  // Initialize ratings for all players
  useEffect(() => {
    if (playersToRate.length > 0 && !hasSubmitted) {
      setRatings(prev => {
        const initialRatings: Record<string, PlayerRating> = {};
        let hasNewPlayers = false;
        
        playersToRate.forEach(player => {
          if (!prev[player.id]) {
            hasNewPlayers = true;
            initialRatings[player.id] = {
              playerId: player.id,
              skill: 'advanced',
              satisfaction: 'great',
              stars: 5,
              comment: '',
            };
          }
        });
        
        // Only update if there are new players to initialize
        return hasNewPlayers ? { ...prev, ...initialRatings } : prev;
      });
    }
  }, [playersToRate.length, hasSubmitted]); // Use length instead of the array itself

  // Map skill level to number for calculation
  const skillLevelToNumber = (level: SkillLevel): number => {
    switch (level) {
      case 'newbie': return 1;
      case 'intermediate': return 3;
      case 'advanced': return 5;
      default: return 3;
    }
  };

  // Map satisfaction level to number for calculation
  const satisfactionLevelToNumber = (level: SatisfactionLevel): number => {
    switch (level) {
      case 'bad': return 1;
      case 'ok': return 3;
      case 'great': return 5;
      default: return 3;
    }
  };

  const updateRating = (playerId: string, field: 'skill' | 'satisfaction' | 'stars' | 'comment', value: number | string | SkillLevel | SatisfactionLevel) => {
    setRatings(prev => {
      const current = prev[playerId] || {
        playerId,
        skill: 'advanced' as SkillLevel,
        satisfaction: 'great' as SatisfactionLevel,
        stars: 5,
        comment: '',
      };
      
      const updated = {
        ...current,
        [field]: value,
      };
      
      // Auto-calculate stars as average of skill (converted to number) and satisfaction (converted to number)
      if (field === 'skill' || field === 'satisfaction') {
        const skillNum = field === 'skill' 
          ? skillLevelToNumber(value as SkillLevel)
          : skillLevelToNumber(updated.skill);
        const satisfactionNum = field === 'satisfaction'
          ? satisfactionLevelToNumber(value as SatisfactionLevel)
          : satisfactionLevelToNumber(updated.satisfaction);
        updated.stars = Math.round((skillNum + satisfactionNum) / 2);
      }
      
      return {
        ...prev,
        [playerId]: updated,
      };
    });
  };

  const handleSubmit = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const ratingsToSubmit: Omit<Rating, 'id' | 'createdAt'>[] = Object.values(ratings).map(rating => ({
        eventId,
        raterId: currentUserId,
        ratedUserId: rating.playerId,
        stars: rating.stars,
        skill: rating.skill,
        satisfaction: rating.satisfaction,
        tags: [],
        comment: rating.comment || undefined,
      }));

      await ratingService.submitRatings(ratingsToSubmit);
      setHasSubmitted(true);
      onSubmitted?.();
    } catch (error) {
      console.error('Error submitting ratings:', error);
      alert(t('ratings.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating: React.FC<{
    value: number;
    onChange: (value: number) => void;
    label: string;
  }> = ({ value, onChange, label }) => (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-bold text-slate-400">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onChange(star);
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95 ${
              star <= value
                ? 'bg-yellow-500 text-white hover:bg-yellow-400'
                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}
            style={{ pointerEvents: 'auto' }}
          >
            <span className="material-symbols-outlined text-base pointer-events-none">star</span>
          </button>
        ))}
      </div>
    </div>
  );

  if (playersToRate.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-surface rounded-xl p-6 max-w-md w-full border border-white/10">
          <h3 className="text-lg font-bold mb-2">{t('ratings.ratePlayers')}</h3>
          <p className="text-slate-400 text-sm mb-4">Không có người chơi nào để đánh giá.</p>
          <button
            onClick={onClose}
            className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-2.5 rounded-lg"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-surface rounded-xl p-4 max-w-2xl w-full border border-white/10 my-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{t('ratings.ratePlayers')}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {hasSubmitted ? (
          <div className="space-y-4">
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 text-center">
              <span className="material-symbols-outlined text-green-400 text-4xl mb-2">check_circle</span>
              <p className="text-green-400 font-bold">{t('ratings.submitted')}</p>
            </div>
            <button
              onClick={onClose}
              className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-2.5 rounded-lg"
            >
              Đóng
            </button>
          </div>
        ) : (
          <div className="space-y-6 max-h-[60vh] overflow-y-auto" style={{ pointerEvents: 'auto' }}>
            {playersToRate.map(player => (
              <div
                key={player.id}
                className="bg-background/50 rounded-lg p-4 border border-white/5"
              >
                <div className="flex items-center gap-3 mb-4">
                  {player.avatar ? (
                    <img
                      src={player.avatar}
                      alt={player.firstName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary">
                        {player.firstName[0]}{player.lastName[0]}
                      </span>
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold">
                      {player.firstName} {player.lastName}
                    </h4>
                    {player.userId && (
                      <p className="text-xs text-slate-400">{player.userId}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Skill Level Selection */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold text-slate-400">{t('ratings.skill')}</span>
                    <div className="flex gap-2">
                      {(['newbie', 'intermediate', 'advanced'] as SkillLevel[]).map(level => {
                        const isSelected = ratings[player.id]?.skill === level;
                        const getIcon = () => {
                          switch (level) {
                            case 'newbie': return 'trending_up';
                            case 'intermediate': return 'trending_flat';
                            case 'advanced': return 'emoji_events';
                            default: return 'star';
                          }
                        };
                        return (
                          <button
                            key={level}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              updateRating(player.id, 'skill', level);
                            }}
                            className={`flex-1 px-3 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              isSelected
                                ? 'bg-primary text-white hover:bg-primary-hover'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                            style={{ pointerEvents: 'auto' }}
                          >
                            <span className="material-symbols-outlined text-base">
                              {getIcon()}
                            </span>
                            {t(`ratings.skillLevel.${level}`)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Satisfaction Level Selection */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold text-slate-400">{t('ratings.satisfaction')}</span>
                    <div className="flex gap-2">
                      {(['bad', 'ok', 'great'] as SatisfactionLevel[]).map(level => {
                        const isSelected = ratings[player.id]?.satisfaction === level;
                        const getIcon = () => {
                          switch (level) {
                            case 'bad': return 'sentiment_dissatisfied';
                            case 'ok': return 'sentiment_neutral';
                            case 'great': return 'sentiment_very_satisfied';
                            default: return 'star';
                          }
                        };
                        const getIconColor = () => {
                          if (isSelected) {
                            return 'text-white';
                          }
                          switch (level) {
                            case 'bad': return 'text-red-400';
                            case 'ok': return 'text-yellow-400';
                            case 'great': return 'text-green-400';
                            default: return 'text-slate-300';
                          }
                        };
                        return (
                          <button
                            key={level}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              updateRating(player.id, 'satisfaction', level);
                            }}
                            className={`flex-1 px-3 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              isSelected
                                ? level === 'bad'
                                  ? 'bg-red-500 text-white hover:bg-red-400'
                                  : level === 'great'
                                  ? 'bg-green-500 text-white hover:bg-green-400'
                                  : 'bg-primary text-white hover:bg-primary-hover'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                            style={{ pointerEvents: 'auto' }}
                          >
                            <span className={`material-symbols-outlined text-base ${getIconColor()}`}>
                              {getIcon()}
                            </span>
                            {t(`ratings.satisfactionLevel.${level}`)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold text-slate-400">{t('ratings.optionalComment')}</span>
                    <textarea
                      value={ratings[player.id]?.comment || ''}
                      onChange={(e) => updateRating(player.id, 'comment', e.target.value)}
                      placeholder={t('ratings.commentPlaceholder')}
                      className="w-full bg-background/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary resize-none"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex gap-2 pt-2">
              <button
                onClick={onClose}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-lg"
              >
                {t('ratings.skip')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-primary hover:bg-primary-hover text-white font-bold py-2.5 rounded-lg disabled:opacity-50"
              >
                {isSubmitting ? t('common.loading') : t('ratings.submit')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

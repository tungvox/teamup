import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Header, Avatar, Badge } from '../components/Layout';
import { useEvents } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import { useMessages } from '../context/MessageContext';
import { sportsService } from '../services/supabaseService';
import { userService } from '../services/userService';
import { Event, User } from '../types';

// Lazy load LocationPicker to avoid blocking form rendering
const LocationPicker = lazy(() => import('../components/LocationPicker').then(module => ({ default: module.LocationPicker })));

interface Sport {
  id: string;
  name: string;
  icon: string;
}

export const CreateEvent: React.FC = () => {
  const navigate = useNavigate();
  const { createEvent } = useEvents();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [sport, setSport] = useState('Tennis');
  const [sports, setSports] = useState<Sport[]>([]);
  const [sportsLoading, setSportsLoading] = useState(true);
  const [date, setDate] = useState('');
  
  // Format date to show day of week and dd/mm/yyyy format
  const getFormattedDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00'); // Add time to avoid timezone issues
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[date.getDay()];
    const [year, month, day] = dateString.split('-');
    return `${dayName}, ${day}/${month}/${year}`;
  };
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [showEndTime, setShowEndTime] = useState(false);
  const [duration, setDuration] = useState<number>(60); // Duration in minutes, default 60 (1 hour)
  const [location, setLocation] = useState('');
  const [locationCoords, setLocationCoords] = useState<{ lat?: number; lng?: number }>({});
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [maxPlayersDisplay, setMaxPlayersDisplay] = useState<string>('10');
  const [competitive, setCompetitive] = useState(false);
  const [skillLevel, setSkillLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced' | 'All'>('All');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | undefined>(undefined);
  const [priceDisplay, setPriceDisplay] = useState<string>('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadSports = async () => {
      try {
        const sportsData = await sportsService.getAllSports();
        setSports(sportsData);
        // Set default sport to first sport (Tennis)
        if (sportsData.length > 0 && sport === 'Tennis') {
          setSport(sportsData[0].name);
        }
      } catch (err) {
        console.error('Error loading sports:', err);
        // Fallback to default sports
        setSports([
          { id: '1', name: 'Tennis', icon: 'sports_tennis' },
          { id: '2', name: 'Pickleball', icon: 'sports_tennis' },
          { id: '3', name: 'Badminton', icon: 'sports_tennis' },
        ]);
      } finally {
        setSportsLoading(false);
      }
    };
    loadSports();
  }, []);

  const getSportIcon = (sportName: string) => {
    const sport = sports.find(s => s.name === sportName);
    if (sport) return sport.icon;
    // Fallback icons
    const iconMap: Record<string, string> = {
      'Tennis': 'sports_tennis',
      'Pickleball': 'sports_tennis',
      'Badminton': 'sports_tennis',
      'Basketball': 'sports_basketball',
      'Soccer': 'sports_soccer',
      'Volleyball': 'sports_volleyball',
    };
    return iconMap[sportName] || 'sports';
  };

  const handleCreate = async () => {
    setError('');

    if (!title.trim()) {
      setError('Please enter an event name');
      return;
    }
    if (!date) {
      setError('Please select a date');
      return;
    }
    if (!time) {
      setError('Please select a time');
      return;
    }
    if (!location.trim()) {
      setError('Please enter a location');
      return;
    }
    if (maxPlayers < 2) {
      setError('Must have at least 2 players');
      return;
    }

    setIsLoading(true);
    try {
      const newEvent = await createEvent({
        title: title.trim(),
        sport,
        description: description.trim() || undefined,
        date,
        time,
        endTime: showEndTime && endTime ? endTime : undefined,
        location: location.trim(),
        maxPlayers,
        skillLevel,
        competitive,
        price: price !== undefined && price > 0 ? price : undefined,
      });
      navigate(`/event/created`, { state: { eventId: newEvent.id, event: newEvent } });
    } catch (err: any) {
      setError(err.message || 'Failed to create event');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex items-center justify-between px-4 py-3 bg-background/90 border-b border-white/10">
        <button onClick={() => navigate(-1)} className="text-primary font-medium">Cancel</button>
        <h1 className="font-bold">Create Event</h1>
        <div className="w-10"></div>
      </div>
      
      <main className="flex-1 overflow-y-auto p-4 space-y-6 max-w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl mx-auto w-full">
        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <div>
          <h2 className="text-lg font-bold mb-3">Sport Type</h2>
          {sportsLoading ? (
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-white/10 text-slate-400 animate-pulse">
                <span className="material-symbols-outlined text-[20px]">sports_tennis</span>
                <span className="font-medium">Loading...</span>
              </div>
            </div>
          ) : (
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
              {sports.map(s => (
                <button 
                  key={s.id}
                  onClick={() => setSport(s.name)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg shrink-0 transition-all ${
                    sport === s.name 
                      ? 'bg-primary text-white shadow-primary/20' 
                      : 'bg-surface border border-white/10 text-slate-400'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {s.icon || getSportIcon(s.name)}
                  </span>
                  <span className="font-medium">{s.name}</span>
              </button>
            ))}
          </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-400 ml-1 mb-1 block">Event Name</label>
            <input 
              type="text" 
              placeholder="e.g. Downtown Hoop Session" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-surface rounded-xl px-4 h-12 outline-none border border-white/10 focus:border-primary transition-colors text-white" 
            />
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-3">When & Where</h3>
            <div className="bg-surface rounded-xl overflow-hidden border border-white/10 divide-y divide-white/5">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><span className="material-symbols-outlined text-[20px]">calendar_today</span></div>
                  <div className="flex flex-col">
                  <span className="font-medium">Date</span>
                    {date && (
                      <span className="text-xs text-slate-500">{getFormattedDate(date)}</span>
                    )}
                </div>
                </div>
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="bg-transparent text-primary font-medium outline-none [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  style={{
                    colorScheme: 'dark'
                  }}
                />
              </div>
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500"><span className="material-symbols-outlined text-[20px]">schedule</span></div>
                  <span className="font-medium">Time</span>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="time" 
                    value={time}
                    onChange={(e) => {
                      setTime(e.target.value);
                      // Update end time if duration is set
                      if (e.target.value && showEndTime && duration) {
                        const [hours, minutes] = e.target.value.split(':').map(Number);
                        const endDate = new Date();
                        endDate.setHours(hours, minutes);
                        endDate.setMinutes(endDate.getMinutes() + duration);
                        setEndTime(`${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`);
                      }
                    }}
                    className="bg-white/5 px-2 py-1 rounded text-sm text-white border-none outline-none [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    style={{
                      colorScheme: 'dark'
                    }}
                  />
                  {showEndTime && (
                    <>
                  <span className="text-slate-500 text-sm">to</span>
                      <input 
                        type="time"
                        className="bg-white/5 px-2 py-1 rounded text-sm text-white border-none outline-none [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                        style={{
                          colorScheme: 'dark'
                        }} 
                        value={endTime}
                        onChange={(e) => {
                          setEndTime(e.target.value);
                          // Calculate duration from start and end time
                          if (time && e.target.value) {
                            const [startHours, startMinutes] = time.split(':').map(Number);
                            const [endHours, endMinutes] = e.target.value.split(':').map(Number);
                            const start = new Date();
                            start.setHours(startHours, startMinutes);
                            const end = new Date();
                            end.setHours(endHours, endMinutes);
                            // Handle next day case
                            if (end < start) {
                              end.setDate(end.getDate() + 1);
                            }
                            const diffMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
                            if (diffMinutes > 0) {
                              setDuration(diffMinutes);
                            }
                          }
                        }}
                      />
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowEndTime(!showEndTime);
                      if (!showEndTime) {
                        // Set default end time (1 hour after start time)
                        if (time) {
                          const [hours, minutes] = time.split(':').map(Number);
                          const endDate = new Date();
                          endDate.setHours(hours, minutes);
                          endDate.setMinutes(endDate.getMinutes() + duration);
                          setEndTime(`${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`);
                        } else {
                          // If no start time, set default duration
                          setDuration(60);
                        }
                      } else {
                        setEndTime('');
                      }
                    }}
                    className="text-primary text-xs font-medium hover:text-primary-hover ml-2"
                  >
                    {showEndTime ? 'Remove' : '+ End time'}
                  </button>
                </div>
              </div>
              {showEndTime && (
                <div className="flex items-center justify-between p-4 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500"><span className="material-symbols-outlined text-[20px]">timer</span></div>
                    <span className="font-medium">Duration</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={duration}
                      onChange={(e) => {
                        const newDuration = parseInt(e.target.value);
                        setDuration(newDuration);
                        // Update end time based on duration
                        if (time) {
                          const [hours, minutes] = time.split(':').map(Number);
                          const endDate = new Date();
                          endDate.setHours(hours, minutes);
                          endDate.setMinutes(endDate.getMinutes() + newDuration);
                          setEndTime(`${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`);
                        }
                      }}
                      className="bg-white/5 px-3 py-1 rounded text-sm text-white border-none outline-none [&>option]:text-black [&>option]:bg-white"
                    >
                      <option value={30} className="text-black">30 min</option>
                      <option value={60} className="text-black">1 hour</option>
                      <option value={90} className="text-black">1.5 hours</option>
                      <option value={120} className="text-black">2 hours</option>
                      <option value={180} className="text-black">3 hours</option>
                      <option value={240} className="text-black">4 hours</option>
                      <option value={300} className="text-black">5 hours</option>
                      <option value={360} className="text-black">6 hours</option>
                      <option value={420} className="text-black">7 hours</option>
                      <option value={480} className="text-black">8 hours</option>
                      <option value={540} className="text-black">9 hours</option>
                      <option value={600} className="text-black">10 hours</option>
                    </select>
                </div>
              </div>
              )}
              <div className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500"><span className="material-symbols-outlined text-[20px]">location_on</span></div>
                    <span className="font-medium">Location</span>
                  </div>
                </div>
                <Suspense fallback={
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Search for a location or enter address..."
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-surface rounded-xl px-4 h-12 outline-none border border-white/10 focus:border-primary transition-colors text-white placeholder:text-slate-400 mb-3"
                    />
                    <div className="rounded-lg overflow-hidden border border-white/10 h-48 bg-slate-800 flex items-center justify-center">
                      <div className="text-center text-slate-400">
                        <span className="material-symbols-outlined text-4xl mb-2 block animate-pulse">map</span>
                        <p className="text-sm">Loading map...</p>
                  </div>
                </div>
                  </div>
                }>
                  <LocationPicker
                    location={location}
                    onLocationChange={(address, lat, lng) => {
                      setLocation(address);
                      if (lat && lng) {
                        setLocationCoords({ lat, lng });
                      }
                    }}
                  />
                </Suspense>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-3">Details</h3>
            <div className="bg-surface rounded-xl p-4 border border-white/10">
              <div>
                <label className="text-sm font-medium text-slate-400 mb-2 block">Total Spots</label>
                <input 
                  type="text"
                  inputMode="numeric"
                  value={maxPlayersDisplay}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    
                    // Allow empty input for deletion
                    if (inputValue === '') {
                      setMaxPlayersDisplay('');
                      return;
                    }
                    
                    // Only allow digits
                    const digitsOnly = inputValue.replace(/[^\d]/g, '');
                    if (digitsOnly === '') {
                      setMaxPlayersDisplay('');
                      return;
                    }
                    
                    const value = parseInt(digitsOnly);
                    if (!isNaN(value)) {
                      setMaxPlayersDisplay(digitsOnly);
                      if (value >= 2 && value <= 50) {
                        setMaxPlayers(value);
                      } else if (value > 50) {
                        setMaxPlayers(50);
                        setMaxPlayersDisplay('50');
                      }
                    }
                  }}
                  onBlur={(e) => {
                    // Ensure value is within range on blur
                    const value = parseInt(e.target.value);
                    if (isNaN(value) || e.target.value === '' || value < 2) {
                      setMaxPlayers(2);
                      setMaxPlayersDisplay('2');
                    } else if (value > 50) {
                      setMaxPlayers(50);
                      setMaxPlayersDisplay('50');
                    } else {
                      setMaxPlayers(value);
                      setMaxPlayersDisplay(value.toString());
                    }
                  }}
                  className="w-full bg-white/5 px-4 py-2 rounded-lg text-white border border-white/10 focus:border-primary outline-none"
                />
                </div>
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div>
                  <label className="text-sm font-medium text-slate-400 mb-2 block">Skill Level</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Beginner', 'Intermediate', 'Advanced', 'All'] as const).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setSkillLevel(level)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          skillLevel === level
                            ? 'bg-primary text-white'
                            : 'bg-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
              </div>
              </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-400 mb-2 block">Price (Optional)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="0"
                      value={priceDisplay}
                      tabIndex={0}
                      autoComplete="off"
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        
                        // Allow empty input
                        if (inputValue === '') {
                          setPriceDisplay('');
                          setPrice(undefined);
                          return;
                        }
                        
                        // Remove all non-digit characters (including commas)
                        const rawValue = inputValue.replace(/[^\d]/g, '');
                        
                        if (rawValue === '') {
                          setPriceDisplay('');
                          setPrice(undefined);
                        } else {
                          // Parse as number
                          const numValue = parseInt(rawValue, 10);
                          if (!isNaN(numValue) && numValue >= 0) {
                            setPrice(numValue);
                            // Show raw number while typing (format on blur)
                            setPriceDisplay(rawValue);
                          }
                        }
                      }}
                      onBlur={() => {
                        // Format with commas when user leaves the field
                        if (price !== undefined && price > 0) {
                          setPriceDisplay(price.toLocaleString('en-US'));
                        } else {
                          setPriceDisplay('');
                          setPrice(undefined);
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                      className="flex-1 bg-white/5 px-4 py-2 rounded-lg text-white border border-white/10 focus:border-primary outline-none cursor-text relative z-10"
                    />
                    <span className="text-slate-400 text-sm">VND</span>
                    {price !== undefined && price > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setPrice(undefined);
                          setPriceDisplay('');
                        }}
                        className="text-slate-500 hover:text-white"
                      >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                      </button>
                    )}
                  </div>
              </div>

                <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Competitive Mode</p>
                  <p className="text-xs text-slate-500">Only matching skill levels can join</p>
                </div>
                  <button
                    type="button"
                    onClick={() => setCompetitive(!competitive)}
                    className={`w-12 h-7 rounded-full relative transition-colors ${
                      competitive ? 'bg-primary' : 'bg-white/10'
                    }`}
                  >
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                      competitive ? 'left-6' : 'left-1'
                    }`}></div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-3">Description <span className="text-slate-500 text-sm font-normal">(Optional)</span></h3>
            <div className="bg-surface rounded-xl p-4 border border-white/10">
              <textarea
                placeholder="Add details about your event... (e.g. rules, what to bring, special instructions)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="w-full bg-transparent text-white placeholder:text-slate-500 outline-none resize-none"
              />
            </div>
          </div>
        </div>
      </main>
      
      <div className="p-4 bg-background border-t border-white/10 max-w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl mx-auto w-full">
        <button 
          onClick={handleCreate}
          disabled={isLoading}
          className="w-full h-14 bg-primary disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-lg shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">add_circle</span> 
          {isLoading ? 'Creating...' : 'Create Event'}
        </button>
      </div>
    </div>
  );
};

export const EventCreated: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getEvent, events } = useEvents();
  const [event, setEvent] = useState<Event | null>((location.state as any)?.event || null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEvent = () => {
      const eventId = (location.state as any)?.eventId;
      const eventFromState = (location.state as any)?.event;
      
      // If event was passed directly in state, use it
      if (eventFromState) {
        setEvent(eventFromState);
        setIsLoading(false);
        return;
      }
      
      // Otherwise, try to get it from the events list
      if (eventId) {
        // Try to get event immediately
        let eventData = getEvent(eventId);
        
        if (eventData) {
          setEvent(eventData);
          setIsLoading(false);
        } else {
          // If not found, wait a bit and try again (events might still be loading)
          const timeout = setTimeout(() => {
            const eventData = getEvent(eventId);
            if (eventData) {
              setEvent(eventData);
            }
            setIsLoading(false);
          }, 500);
          
          return () => clearTimeout(timeout);
        }
      } else {
        setIsLoading(false);
      }
    };
    loadEvent();
  }, [location.state, getEvent, events]);

  const spotsLeft = event ? event.maxPlayers - event.currentPlayers : 0;

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-background justify-center items-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background justify-between pb-10 pt-10 px-6">
      <div className="flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-primary/30 mb-6 relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
          <span className="material-symbols-outlined text-4xl">check_circle</span>
        </div>
        <h1 className="text-4xl font-extrabold mb-2">Game On!</h1>
        <p className="text-slate-400 mb-4">Your squad is ready to be assembled. Event created successfully!</p>
        {event?.code && (
          <div className="bg-primary/10 border-2 border-primary/30 rounded-xl px-6 py-4 mb-4">
            <p className="text-xs text-slate-400 mb-2">Event Code</p>
            <div className="flex items-center gap-3">
              <code className="text-2xl font-bold text-primary tracking-wider">{event.code}</code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(event.code);
                  // You could add a toast notification here
                }}
                className="p-2 rounded-lg bg-primary/20 hover:bg-primary/30 transition-colors"
                title="Copy code"
              >
                <span className="material-symbols-outlined text-sm">content_copy</span>
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">Share this code with others to let them find your event</p>
          </div>
        )}
      </div>

      <div className="w-full bg-surface border border-white/10 rounded-xl overflow-hidden shadow-2xl">
        <div className="h-40 relative">
          <img src="https://images.unsplash.com/photo-1575361204480-aadea25e6e68" className="w-full h-full object-cover" alt="Event" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent"></div>
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur px-3 py-1 rounded-full flex items-center gap-1 border border-white/10">
            <span className="material-symbols-outlined text-green-400 text-xs">group</span>
            <span className="text-[10px] font-bold uppercase">
              {spotsLeft > 0 ? `${spotsLeft} ${spotsLeft === 1 ? 'Spot' : 'Spots'} Open` : 'Full'}
            </span>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold leading-tight">Sunday Morning Football</h2>
              <p className="text-primary text-sm">Touchdown Titans</p>
            </div>
            <div className="bg-gradient-to-r from-yellow-400 to-green-400 p-[1px] rounded-lg">
              <div className="bg-black/80 px-2 py-1 rounded-[7px]">
                <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-green-400">GOLD LEAGUE</span>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400"><span className="material-symbols-outlined text-sm">calendar_month</span></div>
              <div><p className="text-xs text-slate-400">Date & Time</p><p className="font-medium text-sm">Oct 24, 10:00 AM</p></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400"><span className="material-symbols-outlined text-sm">location_on</span></div>
              <div><p className="text-xs text-slate-400">Location</p><p className="font-medium text-sm">Central Park Field 3</p></div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/5 rounded-lg p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <Avatar src="https://i.pravatar.cc/150?u=p1" size="w-8 h-8" className="ring-2 ring-background" />
            <Avatar src="https://i.pravatar.cc/150?u=p2" size="w-8 h-8" className="ring-2 ring-background" />
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs ring-2 ring-background">+</div>
          </div>
          <span className="text-sm font-medium">Invite your crew</span>
        </div>
        <button className="w-8 h-8 rounded-full bg-primary flex items-center justify-center"><span className="material-symbols-outlined text-sm">arrow_forward</span></button>
      </div>

      <div className="space-y-3 w-full">
        {event && (
          <button onClick={() => navigate(`/event/${event.id}`)} className="w-full py-4 bg-primary rounded-xl font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">visibility</span> View Event Details
          </button>
        )}
        <button onClick={() => navigate('/home')} className="w-full py-4 bg-transparent border border-white/20 rounded-xl font-medium hover:bg-white/5">Return to Dashboard</button>
      </div>
    </div>
  );
};

export const OrganizerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getEvent, events, approveRequest, denyRequest, getEventRequests } = useEvents();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [players, setPlayers] = useState<User[]>([]);
  const [pendingRequestUsers, setPendingRequestUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEvent = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      const eventData = getEvent(id);
      if (eventData) {
        // Only update if the new event has the same or more players (to preserve optimistic updates)
        setEvent(prevEvent => {
          if (prevEvent) {
            // If current event has more players, keep it (optimistic update)
            if (prevEvent.players.length > eventData.players.length) {
              // Keep optimistic update and load its players
              loadPlayers(prevEvent.players);
              return prevEvent;
            }
            // If current event has the same players, use the one from context (more reliable)
            if (prevEvent.players.length === eventData.players.length) {
              loadPlayers(eventData.players);
              return eventData;
            }
            // If prevEvent has fewer players, use the new one
            loadPlayers(eventData.players);
            return eventData;
          }
          // No previous event, use the new one
          loadPlayers(eventData.players);
          return eventData;
        });
        
        loadPendingRequestsForEvent(id);
      }
      setIsLoading(false);
    };

    loadEvent();
  }, [id, getEvent, events, getEventRequests]);

  const loadPlayers = async (playerIds: string[]) => {
    if (playerIds.length === 0) {
      setPlayers([]);
      return;
    }

    try {
      const playerProfiles = await userService.getUsers(playerIds);
      setPlayers(playerProfiles);
    } catch (error) {
      console.error('Error loading players:', error);
      setPlayers([]);
    }
  };

  const loadPendingRequestsForEvent = async (eventId: string) => {
    try {
      const requests = await getEventRequests(eventId);
      if (requests.length === 0) {
        setPendingRequestUsers([]);
        return;
      }
      
      const userIds = requests.map(r => r.userId);
      const requestProfiles = await userService.getUsers(userIds);
      setPendingRequestUsers(requestProfiles);
    } catch (error) {
      console.error('Error loading pending requests:', error);
      setPendingRequestUsers([]);
    }
  };

  const handleApprove = async (userId: string) => {
    if (!event || !id) return;
    try {
      // Optimistically update the event state
      const updatedPlayers = [...event.players, userId];
      const updatedEvent = {
        ...event,
        players: updatedPlayers,
        currentPlayers: updatedPlayers.length,
        status: updatedPlayers.length >= event.maxPlayers ? 'full' : event.status,
      };
      setEvent(updatedEvent);
      loadPlayers(updatedPlayers);
      
      // Remove from pending requests optimistically
      const updatedPendingUsers = pendingRequestUsers.filter(u => u.id !== userId);
      setPendingRequestUsers(updatedPendingUsers);
      
      // Call the approve function
      await approveRequest(id, userId);
      
      // Reload from context to ensure we have the latest data
      // Wait a bit longer and check multiple times to ensure context has updated
      const checkAndUpdate = (attempts = 0) => {
        const contextEvent = getEvent(id);
        if (contextEvent && contextEvent.players.includes(userId)) {
          // Context has the updated player, use it
          setEvent(contextEvent);
          loadPlayers(contextEvent.players);
          loadPendingRequestsForEvent(id);
        } else if (attempts < 5) {
          // Context not updated yet, try again
          setTimeout(() => checkAndUpdate(attempts + 1), 200);
        } else {
          // After multiple attempts, check events array directly
          const foundEvent = events.find(e => e.id === id);
          if (foundEvent && foundEvent.players.includes(userId)) {
            setEvent(foundEvent);
            loadPlayers(foundEvent.players);
          }
          loadPendingRequestsForEvent(id);
        }
      };
      
      setTimeout(() => checkAndUpdate(), 300);
    } catch (error: any) {
      console.error('Error approving request:', error);
      // Revert optimistic update on error
      const originalEvent = getEvent(id) || event;
      setEvent(originalEvent);
      loadPlayers(originalEvent.players);
      loadPendingRequestsForEvent(id);
      const errorMessage = error?.message || error?.toString() || 'Failed to approve request';
      alert(`Failed to approve request: ${errorMessage}`);
    }
  };

  const handleDeny = async (userId: string) => {
    if (!event || !id) return;
    try {
      await denyRequest(id, userId);
      // Reload pending requests
      loadPendingRequestsForEvent(id);
    } catch (error) {
      console.error('Error denying request:', error);
      alert('Failed to deny request');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background pb-20 items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col min-h-screen bg-background pb-20 items-center justify-center">
        <div className="text-white">Event not found</div>
        <button onClick={() => navigate(-1)} className="mt-4 text-primary">Go Back</button>
      </div>
    );
  }

  const spotsLeft = event.maxPlayers - event.currentPlayers;
  const progressPercentage = (event.currentPlayers / event.maxPlayers) * 100;

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center"><span className="material-symbols-outlined">arrow_back_ios_new</span></button>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-primary"><span className="material-symbols-outlined">share</span></button>
            <button onClick={() => navigate(`/event/edit/${event.id}`)} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-primary"><span className="material-symbols-outlined">edit</span></button>
          </div>
        </div>
        <div className="px-5 pb-4">
          <h1 className="text-2xl font-extrabold leading-tight">{event.title}</h1>
          <div className="flex items-center gap-1 text-slate-400 text-sm mt-1">
            <span className="material-symbols-outlined text-[16px]">location_on</span> {event.location} • {formatTime(event.time)}
          </div>
        </div>
      </div>

      <div className="p-5 space-y-6">
        <div className="bg-surface border border-white/5 p-5 rounded-2xl">
          <div className="flex justify-between items-end mb-3">
            <span className="font-bold">Roster Status</span>
            <span className="text-sm text-slate-400">{event.currentPlayers}/{event.maxPlayers} Confirmed</span>
          </div>
          <div className="h-3 bg-white/5 rounded-full overflow-hidden mb-2">
            <div 
              className="h-full bg-gradient-to-r from-yellow-400 to-green-400 transition-all"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-500">
            {spotsLeft === 0 
              ? 'Event is full!' 
              : spotsLeft === 1
              ? '1 spot remaining. Promote your event to fill up fast!'
              : `${spotsLeft} spots remaining. Promote your event to fill up fast!`}
          </p>
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xl font-bold flex items-center gap-2">Pending Requests <span className="text-primary text-base">({pendingRequestUsers.length})</span></h3>
            {pendingRequestUsers.length > 0 && (
              <button className="text-sm text-primary font-bold">View All</button>
            )}
          </div>
          <div className="space-y-3">
            {pendingRequestUsers.length === 0 ? (
              <div className="bg-surface p-4 rounded-2xl border border-white/5 text-center text-slate-400 text-sm">
                No pending requests
              </div>
            ) : (
              pendingRequestUsers.map((requestUser) => (
                <div key={requestUser.id} className="bg-surface p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar 
                      src={requestUser.avatar || `https://i.pravatar.cc/150?u=${requestUser.id}`} 
                      size="w-10 h-10"
                    />
                    <div>
                      <p className="font-semibold text-sm">{requestUser.firstName} {requestUser.lastName}</p>
                      <p className="text-xs text-slate-400">Level {requestUser.level}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(requestUser.id)}
                      className="px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg font-bold text-green-400 hover:bg-green-500/20 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleDeny(requestUser.id)}
                      className="px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg font-bold text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      Deny
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xl font-bold flex items-center gap-2">Confirmed Players <span className="text-slate-400 text-base font-normal">({event.currentPlayers})</span></h3>
            {players.length > 0 && (
              <button className="text-sm text-primary font-bold flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">chat</span> Message All</button>
            )}
          </div>
          <div className="bg-surface rounded-3xl border border-white/5 divide-y divide-white/5">
            {players.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-sm">
                No players yet
              </div>
            ) : (
              players.slice(0, 4).map((player, i) => (
                <div key={player.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Avatar 
                      src={player.avatar || `https://i.pravatar.cc/150?u=${player.id}`} 
                      size="w-10 h-10"
                    />
                    <div>
                      <p className="font-semibold text-sm">{player.firstName} {player.lastName}</p>
                      <p className="text-xs text-slate-400">Level {player.level}</p>
                    </div>
                  </div>
                  <div className="px-2 py-1 rounded text-xs font-bold flex items-center gap-1 bg-green-500/10 text-green-500">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    Confirmed
                  </div>
                </div>
              ))
            )}
          </div>
          {players.length > 4 && (
            <button className="w-full py-3 text-primary font-bold text-sm mt-2">View All {players.length} Players</button>
          )}
        </div>
      </div>
    </div>
  );
};

export const EventDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { getEvent, requestToJoin, leaveEvent, events, getUserPendingRequest, getUserEventRequest } = useEvents();
  const { getOrCreateChat } = useMessages();
  const [event, setEvent] = useState<Event | null>(null);
  const [players, setPlayers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);

  useEffect(() => {
    const loadEvent = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      try {
        const eventData = getEvent(id);
        if (eventData) {
          setEvent(eventData);
          loadPlayers(eventData.players);
          
          // Check if user has a pending request
          // If user is in players list, they're approved/joined, so no pending request
          if (user) {
            if (eventData.players.includes(user.id)) {
              setHasPendingRequest(false);
            } else {
              try {
                const pendingRequest = await getUserPendingRequest(id);
                setHasPendingRequest(!!pendingRequest);
              } catch (error) {
                console.error('Error checking pending request:', error);
                setHasPendingRequest(false);
              }
            }
          } else {
            setHasPendingRequest(false);
          }
        } else {
          // If event not found in context, try to find it in events array
          const foundEvent = events.find(e => e.id === id);
          if (foundEvent) {
            setEvent(foundEvent);
            loadPlayers(foundEvent.players);
            
            // Check if user has a pending request
            // If user is in players list, they're approved/joined, so no pending request
            if (user) {
              if (foundEvent.players.includes(user.id)) {
                setHasPendingRequest(false);
              } else {
                try {
                  const pendingRequest = await getUserPendingRequest(id);
                  setHasPendingRequest(!!pendingRequest);
                } catch (error) {
                  console.error('Error checking pending request:', error);
                  setHasPendingRequest(false);
                }
              }
            } else {
              setHasPendingRequest(false);
            }
          }
        }
      } catch (error) {
        console.error('Error loading event:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEvent();
  }, [id, getEvent, events, user, getUserPendingRequest]);

  const loadPlayers = async (playerIds: string[]) => {
    if (playerIds.length === 0) {
      setPlayers([]);
      return;
    }

    try {
      const playerProfiles = await userService.getUsers(playerIds);
      setPlayers(playerProfiles);
    } catch (error) {
      console.error('Error loading players:', error);
      setPlayers([]);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatTimeRange = (startTime: string, endTime?: string) => {
    if (endTime) {
      return `${formatTime(startTime)} - ${formatTime(endTime)}`;
    }
    return formatTime(startTime);
  };

  const getSportIcon = (sport: string) => {
    const iconMap: Record<string, string> = {
      'Tennis': 'sports_tennis',
      'Pickleball': 'sports_tennis',
      'Badminton': 'sports_tennis',
      'Basketball': 'sports_basketball',
      'Soccer': 'sports_soccer',
      'Volleyball': 'sports_volleyball',
    };
    return iconMap[sport] || 'sports';
  };

  const handleGetDirections = () => {
    if (event?.location) {
      const encodedLocation = encodeURIComponent(event.location);
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedLocation}`, '_blank');
    }
  };

  const handleJoin = async () => {
    console.log('handleJoin called', { event: !!event, user: !!user, eventId: event?.id, userId: user?.id });
    
    if (!event || !user) {
      console.error('Cannot request: missing event or user', { event: !!event, user: !!user });
      return;
    }
    
    setIsJoining(true);
    try {
      console.log('Requesting to join event:', event.id, 'User:', user.id);
      
      // Optimistically update the UI
      setHasPendingRequest(true);
      console.log('Set hasPendingRequest to true');
      
      await requestToJoin(event.id);
      console.log('Successfully requested to join event - database updated');
      
      // Verify the request was created
      setTimeout(async () => {
        try {
          const pendingRequest = await getUserPendingRequest(event.id);
          console.log('Verified pending request:', pendingRequest);
          setHasPendingRequest(!!pendingRequest);
        } catch (error) {
          console.error('Error verifying pending request:', error);
        }
      }, 500);
    } catch (err: any) {
      console.error('Error requesting to join event:', err);
      // Revert optimistic update on error
      setHasPendingRequest(false);
      alert(err.message || 'Failed to request to join event');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!event || !user) return;
    
    setIsJoining(true);
    try {
      await leaveEvent(event.id);
      // Reload event data
      const updatedEvent = getEvent(event.id);
      if (updatedEvent) {
        setEvent(updatedEvent);
        loadPlayers(updatedEvent.players);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to leave event');
    } finally {
      setIsJoining(false);
    }
  };

  const handleChat = async () => {
    if (!event || !user) return;
    
    try {
      // Get or create chat with organizer
      const chatId = await getOrCreateChat(event.organizerId);
      navigate(`/chat/${chatId}`);
    } catch (err) {
      console.error('Failed to open chat:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="text-white">Event not found</div>
      </div>
    );
  }

  const spotsLeft = event.maxPlayers - event.currentPlayers;
  const isJoined = user && event.players.includes(user.id);
  const isOrganizer = user && event.organizerId === user.id;
  const isFull = spotsLeft === 0;

  return (
    <div className="bg-background min-h-screen flex flex-col relative pb-24">
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 py-3 bg-white/10 backdrop-blur-md border-b border-white/5">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center backdrop-blur"><span className="material-symbols-outlined">arrow_back</span></button>
        <h2 className="font-bold text-lg">Event Details</h2>
        <button className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center backdrop-blur"><span className="material-symbols-outlined text-[20px]">ios_share</span></button>
      </div>

      <div className="relative w-full h-[300px] shrink-0">
        <img 
          src={event.image || `https://images.unsplash.com/photo-1551972873-b7e8754e8e26`} 
          className="w-full h-full object-cover" 
          alt={event.title} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
        <button 
          onClick={handleGetDirections}
          className="absolute bottom-6 right-4 bg-white text-black px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 shadow-lg hover:bg-white/90 transition-colors"
        >
          <span className="material-symbols-outlined text-primary text-[20px]">directions</span> Get Directions
        </button>
      </div>

      <div className="-mt-6 bg-background rounded-t-[24px] relative px-5 pt-8 pb-4 border-t border-white/5">
        <div className="flex gap-2 mb-2">
          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
            event.status === 'open' 
              ? 'bg-green-500/20 text-green-500 border border-green-500/20'
              : event.status === 'full'
              ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/20'
              : 'bg-red-500/20 text-red-500 border border-red-500/20'
          }`}>
            {event.status === 'open' ? 'Open' : event.status === 'full' ? 'Full' : event.status}
          </span>
        </div>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold leading-tight flex-1">{event.title}</h1>
          {event.code && (
            <div className="bg-primary/10 border-2 border-primary/30 rounded-xl px-4 py-2 ml-4">
              <p className="text-xs text-slate-400 mb-1">Event Code</p>
              <div className="flex items-center gap-2">
                <code className="text-lg font-bold text-primary tracking-wider">{event.code}</code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(event.code);
                    // You could add a toast notification here
                  }}
                  className="p-1 rounded-lg bg-primary/20 hover:bg-primary/30 transition-colors"
                  title="Copy code"
                >
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined">calendar_month</span>
            </div>
            <div>
              <p className="font-bold">{formatDate(event.date)}</p>
              <p className="text-sm text-slate-400">{formatTimeRange(event.time, event.endTime)}</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined">location_on</span>
            </div>
            <div>
              <p className="font-bold">{event.location}</p>
              {event.locationDetails && (
                <p className="text-sm text-slate-400">{event.locationDetails}</p>
              )}
            </div>
          </div>
          {event.price && event.price > 0 && (
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined">payments</span>
              </div>
              <div>
                <p className="font-bold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(event.price)}</p>
                <p className="text-sm text-slate-400">Event fee</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3 mt-6">
          {event.price && event.price > 0 && (
          <div className="bg-surface border border-white/5 rounded-lg px-3 py-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400 text-[20px]">payments</span>
              <span className="text-sm font-semibold text-slate-300">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(event.price)}
              </span>
          </div>
          )}
          <div className="bg-surface border border-white/5 rounded-lg px-3 py-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400 text-[20px]">leaderboard</span>
            <span className="text-sm font-semibold text-slate-300">{event.skillLevel}</span>
          </div>
          {event.competitive && (
          <div className="bg-gradient-to-br from-yellow-400 to-green-400 text-black rounded-lg px-3 py-2 flex items-center gap-2 font-bold shadow-lg shadow-green-500/20">
            <span className="material-symbols-outlined text-[20px]">local_fire_department</span>
              <span className="text-sm">Competitive</span>
          </div>
          )}
        </div>

        <div className="h-px bg-white/5 w-full my-6"></div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Current Roster</h3>
            <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-bold">
              {event.currentPlayers}/{event.maxPlayers} Players
            </span>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {players.map((player, idx) => {
              const isOrganizerPlayer = player.id === event.organizerId;
              return (
                <div key={player.id} className="flex flex-col items-center gap-2 min-w-[60px]">
                <div className="relative">
                    <Avatar 
                      src={player.avatar || `https://i.pravatar.cc/150?u=${player.id}`} 
                      size="w-16 h-16" 
                      className={isOrganizerPlayer ? 'border-yellow-400' : ''} 
                    />
                    {isOrganizerPlayer && (
                      <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-black text-[10px] font-bold px-1.5 rounded border border-white">
                        HOST
                </div>
                    )}
              </div>
                  <span className="text-xs font-medium text-slate-300 text-center">
                    {player.firstName} {player.lastName}
                  </span>
                </div>
              );
            })}
            {!isFull && (
            <div className="flex flex-col items-center gap-2 min-w-[60px]">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-600 bg-white/5 flex items-center justify-center text-slate-500">
                <span className="material-symbols-outlined">person_add</span>
              </div>
              <span className="text-xs font-medium text-slate-500">Open</span>
            </div>
            )}
          </div>
          
          <div className="flex gap-3 mt-6">
            <button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: event.title,
                    text: `Join me for ${event.sport} on ${formatDate(event.date)}!`,
                    url: window.location.href,
                  });
                }
              }}
              className="flex-1 bg-surface border border-white/10 h-12 rounded-lg font-bold text-primary flex items-center justify-center gap-2 hover:bg-white/5 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">ios_share</span> Invite Friends
            </button>
            {!isOrganizer && (
              <button 
                onClick={handleChat}
                className="flex-1 bg-primary/10 border border-primary/20 h-12 rounded-lg font-bold text-primary flex items-center justify-center gap-2 hover:bg-primary/20 transition-colors"
              >
              <span className="material-symbols-outlined text-[20px]">chat</span> Team Chat
            </button>
            )}
          </div>
        </div>

        {event.description && (
        <div className="mt-8 mb-4">
          <h3 className="text-lg font-bold mb-2">About the Game</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{event.description}</p>
        </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-5 bg-surface/90 backdrop-blur-md border-t border-white/10 z-30 max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-2">
          {event.price && event.price > 0 && !isOrganizer && (
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total</span>
              <span className="text-xl font-bold">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(event.price)}
              </span>
          </div>
          )}
          {!isOrganizer ? (
            <button 
              onClick={isJoined ? handleLeave : handleJoin}
              disabled={isJoining || (isFull && !isJoined) || hasPendingRequest || !user}
              className={`flex-1 h-14 rounded-xl font-bold text-lg shadow-lg transition-all active:scale-[0.98] ${
                isJoined
                  ? 'bg-red-500/20 text-red-400 border border-red-500/20 hover:bg-red-500/30'
                  : hasPendingRequest
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 cursor-not-allowed'
                  : isFull
                  ? 'bg-slate-500/20 text-slate-400 border border-slate-500/20 cursor-not-allowed'
                  : 'bg-primary hover:bg-primary-hover text-white shadow-primary/20'
              }`}
            >
              {isJoining ? 'Loading...' : isJoined ? 'Leave Event' : hasPendingRequest ? 'Requested' : isFull ? 'Event Full' : 'Request to Join'}
            </button>
          ) : (
            <button 
              onClick={() => navigate(`/event/manage/${event.id}`)}
              className="flex-1 h-14 bg-primary hover:bg-primary-hover rounded-xl font-bold text-lg shadow-lg shadow-primary/20 transition-all active:scale-[0.98] text-white"
            >
              Manage Event
            </button>
          )}
        </div>
        {!isFull && !isOrganizer && (
        <p className="text-center text-[10px] text-slate-500">Your spot is held for 10 mins after request</p>
        )}
      </div>
    </div>
  );
};

export const EditEvent: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col min-h-screen bg-background text-white">
      <Header title="Edit Event" rightAction={<button className="text-primary font-bold">Save</button>} />
      
      <main className="flex-1 p-4 space-y-6">
        <div className="relative h-40 rounded-xl overflow-hidden group">
          <img src="https://images.unsplash.com/photo-1546519638-68e109498ffc" className="w-full h-full object-cover" alt="banner" />
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute bottom-4 left-4">
            <span className="bg-gradient-to-r from-yellow-400 to-green-400 text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Basketball</span>
            <h2 className="text-2xl font-bold mt-1">Sunday Morning Hoops</h2>
            <p className="text-sm opacity-90">Oct 24 • 10:00 AM</p>
          </div>
          <button className="absolute top-3 right-3 p-2 bg-black/40 backdrop-blur rounded-full"><span className="material-symbols-outlined text-sm">edit</span></button>
        </div>

        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">The Basics</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">EVENT NAME</label>
              <div className="relative">
                <input type="text" defaultValue="Sunday Morning Hoops" className="w-full bg-surface border border-white/10 rounded-lg h-12 px-4 focus:border-primary outline-none" />
                <span className="absolute right-4 top-3 text-slate-400 material-symbols-outlined text-[20px]">edit</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-2 block">SPORT TYPE</label>
              <div className="flex gap-3 overflow-x-auto no-scrollbar">
                <div className="w-20 h-20 bg-surface rounded-xl border-2 border-primary flex flex-col items-center justify-center text-primary relative overflow-hidden">
                  <div className="absolute inset-0 bg-primary/10"></div>
                  <span className="material-symbols-outlined text-3xl mb-1">sports_basketball</span>
                  <span className="text-xs font-bold">Hoops</span>
                  <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(57,255,20,0.6)]"></div>
                </div>
                {['Soccer', 'Tennis', 'Volleyball', 'Run'].map((s, i) => (
                  <div key={i} className="w-20 h-20 bg-surface rounded-xl border border-white/10 flex flex-col items-center justify-center text-slate-400 hover:border-white/30 transition-colors">
                    <span className="material-symbols-outlined text-3xl mb-1">{i===0?'sports_soccer':i===1?'sports_tennis':i===2?'sports_volleyball':'directions_run'}</span>
                    <span className="text-xs font-medium">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Logistics</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">DATE</label>
              <div className="bg-surface border border-white/10 rounded-lg h-12 flex items-center px-4 justify-between">
                <span>Oct 24, 2023</span>
                <span className="material-symbols-outlined text-primary text-[20px]">calendar_today</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">TIME</label>
              <div className="bg-surface border border-white/10 rounded-lg h-12 flex items-center px-4 justify-between">
                <span>10:00 AM</span>
                <span className="material-symbols-outlined text-primary text-[20px]">schedule</span>
              </div>
            </div>
          </div>
          <div className="relative rounded-xl overflow-hidden border border-white/10">
            <div className="flex items-center gap-3 p-3 bg-surface border-b border-white/5">
              <span className="material-symbols-outlined text-primary">location_on</span>
              <span className="flex-1">Central Park Courts</span>
              <span className="material-symbols-outlined text-slate-400">search</span>
            </div>
            <div className="h-32 relative">
              <img src="https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83" className="w-full h-full object-cover opacity-60" alt="map" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center animate-pulse ring-4 ring-primary/30 text-white"><span className="material-symbols-outlined text-sm">location_on</span></div>
              </div>
              <div className="absolute bottom-2 right-2 bg-surface/90 backdrop-blur text-[10px] font-bold px-2 py-1 rounded">Change Location</div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase">Roster Limit</h3>
            <span className="text-primary font-bold">10 Spots</span>
          </div>
          <div className="bg-surface border border-white/10 rounded-xl p-5">
            <div className="flex justify-between text-xs text-slate-400 font-bold mb-4"><span>Min: 2</span><span>Max: 50</span></div>
            <div className="relative h-2 bg-white/10 rounded-full mb-3">
              <div className="absolute left-0 top-0 h-full w-[20%] bg-gradient-to-r from-yellow-400 to-green-400 rounded-full"></div>
              <div className="absolute left-[20%] top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-white border-2 border-primary rounded-full shadow cursor-grab flex items-center justify-center"><div className="w-2 h-2 bg-primary rounded-full"></div></div>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1"><span className="material-symbols-outlined text-sm">info</span> Current signups: 4 players</p>
          </div>
        </div>

        <div className="pt-4 flex flex-col gap-3">
          <button className="w-full h-12 bg-primary rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20"><span className="material-symbols-outlined">save</span> Save Changes</button>
          <button className="w-full h-12 bg-transparent border border-white/10 rounded-xl font-bold text-slate-300">Cancel</button>
          <button className="w-full h-12 flex items-center justify-center gap-2 text-danger font-bold text-sm hover:bg-danger/5 rounded-xl"><span className="material-symbols-outlined">delete</span> Delete Event</button>
        </div>
      </main>
    </div>
  );
};
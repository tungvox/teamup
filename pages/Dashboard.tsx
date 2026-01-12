import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, Badge } from "../components/Layout";
import { EventsMapView } from "../components/EventsMapView";
import { useAuth } from "../context/AuthContext";
import { useEvents } from "../context/EventContext";
import { useMessages } from "../context/MessageContext";
import { userService } from "../services/userService";
import { User } from "../types";
import { sportsService, getUserByUserId, sendFriendRequest, acceptFriendRequest, removeFriend } from "../services/supabaseService";
import { isValidUserId } from "../utils/userId";

interface Sport {
  id: string;
  name: string;
  icon: string;
}

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { events, searchEvents, joinEvent } = useEvents();
  const { unreadCount } = useMessages();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("Bà Rịa - Vũng Tàu");
  const [eventPlayersMap, setEventPlayersMap] = useState<Record<string, User[]>>({});
  const [sports, setSports] = useState<Sport[]>([]);
  const [sportsLoading, setSportsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'map'>('calendar');
  const [showCalendar, setShowCalendar] = useState<boolean>(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [mapViewDate, setMapViewDate] = useState<string>(new Date().toISOString().split('T')[0]); // Default to today
  const [showMonthYearPicker, setShowMonthYearPicker] = useState<boolean>(false);
  const monthYearPickerRef = useRef<HTMLDivElement>(null);

  // Helper function to normalize Vietnamese text (remove diacritics and normalize)
  const normalizeVietnamese = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  };

  // Helper function to check if location matches city
  const locationMatchesCity = (eventLocation: string, cityName: string): boolean => {
    const normalizedLocation = normalizeVietnamese(eventLocation);
    
    // Find the city object to get both Vietnamese and English names
    const city = vietnamCities.find(c => c.name === cityName || c.english === cityName);
    if (!city) {
      // Fallback: try to match with the provided cityName directly
      const normalizedCity = normalizeVietnamese(cityName);
      return normalizedLocation.includes(normalizedCity);
    }
    
    // Normalize both Vietnamese and English names
    const normalizedVietnameseName = normalizeVietnamese(city.name);
    const normalizedEnglishName = normalizeVietnamese(city.english);
    
    // Check if either Vietnamese or English name appears in location
    if (normalizedLocation.includes(normalizedVietnameseName) || normalizedLocation.includes(normalizedEnglishName)) {
      return true;
    }
    
    // For compound city names, check if key parts match
    const vietnameseParts = normalizedVietnameseName.split(/[\s-]+/).filter(part => part.length >= 2);
    const englishParts = normalizedEnglishName.split(/[\s-]+/).filter(part => part.length >= 2);
    
    // Check Vietnamese parts
    if (vietnameseParts.length >= 2) {
      const matchingParts = vietnameseParts.filter(part => normalizedLocation.includes(part));
      if (matchingParts.length >= 2) return true;
    }
    
    // Check English parts
    if (englishParts.length >= 2) {
      const matchingParts = englishParts.filter(part => normalizedLocation.includes(part));
      if (matchingParts.length >= 2) return true;
    }
    
    return false;
  };

  // Vietnamese cities list with Vietnamese names and coordinates
  const vietnamCities = [
    { name: "Thành phố Hồ Chí Minh", english: "Ho Chi Minh City", lat: 10.8231, lng: 106.6297 },
    { name: "Hà Nội", english: "Hanoi", lat: 21.0285, lng: 105.8542 },
    { name: "Đà Nẵng", english: "Da Nang", lat: 16.0544, lng: 108.2022 },
    { name: "Hải Phòng", english: "Hai Phong", lat: 20.8449, lng: 106.6881 },
    { name: "Cần Thơ", english: "Can Tho", lat: 10.0452, lng: 105.7469 },
    { name: "Vũng Tàu", english: "Vung Tau", lat: 10.3460, lng: 107.0843 },
    { name: "Nha Trang", english: "Nha Trang", lat: 12.2388, lng: 109.1967 },
    { name: "Huế", english: "Hue", lat: 16.4637, lng: 107.5909 },
    { name: "Đà Lạt", english: "Da Lat", lat: 11.9404, lng: 108.4583 },
    { name: "Quy Nhơn", english: "Quy Nhon", lat: 13.7820, lng: 109.2197 },
    { name: "Phan Thiết", english: "Phan Thiet", lat: 10.9376, lng: 108.1581 },
    { name: "Vinh", english: "Vinh", lat: 18.6734, lng: 105.6924 },
    { name: "Thái Nguyên", english: "Thai Nguyen", lat: 21.5928, lng: 105.8442 },
    { name: "Biên Hòa", english: "Bien Hoa", lat: 10.9447, lng: 106.8243 },
    { name: "Long Xuyên", english: "Long Xuyen", lat: 10.3865, lng: 105.4351 },
    { name: "Rạch Giá", english: "Rach Gia", lat: 10.0124, lng: 105.0809 },
    { name: "Mỹ Tho", english: "My Tho", lat: 10.3600, lng: 106.3600 },
    { name: "Cà Mau", english: "Ca Mau", lat: 9.1769, lng: 105.1500 },
    { name: "Bạc Liêu", english: "Bac Lieu", lat: 9.2942, lng: 105.7278 },
    { name: "Sóc Trăng", english: "Soc Trang", lat: 9.6025, lng: 105.9739 },
    { name: "Trà Vinh", english: "Tra Vinh", lat: 9.9347, lng: 106.3453 },
    { name: "Bến Tre", english: "Ben Tre", lat: 10.2415, lng: 106.3759 },
    { name: "Tây Ninh", english: "Tay Ninh", lat: 11.3131, lng: 106.0963 },
    { name: "Bình Dương", english: "Binh Duong", lat: 11.3254, lng: 106.4774 },
    { name: "Đồng Nai", english: "Dong Nai", lat: 10.9574, lng: 106.8429 },
    { name: "Bà Rịa - Vũng Tàu", english: "Ba Ria - Vung Tau", lat: 10.4963, lng: 107.1684 },
    { name: "Khánh Hòa", english: "Khanh Hoa", lat: 12.2388, lng: 109.1967 },
    { name: "Lâm Đồng", english: "Lam Dong", lat: 11.9404, lng: 108.4583 },
    { name: "Bình Thuận", english: "Binh Thuan", lat: 10.9376, lng: 108.1581 },
    { name: "Bình Phước", english: "Binh Phuoc", lat: 11.6476, lng: 106.6056 },
    { name: "Đồng Tháp", english: "Dong Thap", lat: 10.3600, lng: 106.3600 },
    { name: "An Giang", english: "An Giang", lat: 10.3865, lng: 105.4351 },
    { name: "Kiên Giang", english: "Kien Giang", lat: 10.0124, lng: 105.0809 }
  ];

  // Close month/year picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (monthYearPickerRef.current && !monthYearPickerRef.current.contains(event.target as Node)) {
        setShowMonthYearPicker(false);
      }
    };

    if (showMonthYearPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMonthYearPicker]);

  // Check if search query is a valid event code format
  const isCodeSearch = useMemo(() => {
    return searchQuery && /^[A-Z]{3}\d{3}$/i.test(searchQuery.trim());
  }, [searchQuery]);

  // Only show code search results, no regular search
  const isValidCodeFormat = useMemo(() => {
    return searchQuery && /^[A-Z]{3}\d{3}$/i.test(searchQuery.trim());
  }, [searchQuery]);

  // Get event found by code
  const codeEvent = useMemo(() => {
    if (!isCodeSearch) return null;
    return events.find(e => e.code?.toUpperCase() === searchQuery.trim().toUpperCase() && e.status === 'open');
  }, [isCodeSearch, searchQuery, events]);

  // Memoize filteredEvents to prevent unnecessary recalculations
  const filteredEvents = useMemo(() => {
    // If searching by code, don't show other events in the list
    if (searchQuery) {
      return [];
    }

    const now = new Date();
    let result: typeof events = [];

    if (selectedFilter) {
      result = events.filter((e) => e.status === "open" && e.sport === selectedFilter);
    } else {
      result = events.filter((e) => e.status === "open");
    }

    // Filter by location if selected
    if (selectedLocation) {
      result = result.filter((e) => {
        return locationMatchesCity(e.location, selectedLocation);
      });
    }

    // Filter by date if in map view mode
    if (viewMode === 'map' && mapViewDate) {
      result = result.filter((e) => {
        return e.date === mapViewDate;
      });
      // In map view, include past events (they will be shown with grey markers)
      return result
        .sort((a, b) => {
          // Sort by date and time (earliest first)
          const dateTimeA = new Date(`${a.date}T${a.time}`).getTime();
          const dateTimeB = new Date(`${b.date}T${b.time}`).getTime();
          return dateTimeA - dateTimeB;
        });
    }

    // Filter out past events and sort by start time (for non-map views)
    return result
      .filter((e) => {
        // Check if event is upcoming or happening (not past)
        const eventDateTime = new Date(`${e.date}T${e.time}`);
        const eventEndTime = e.endTime ? new Date(`${e.date}T${e.endTime}`) : null;
        
        // If event has an end time, check if it hasn't ended yet
        if (eventEndTime) {
          return eventEndTime >= now;
        }
        // If no end time, check if start time hasn't passed (or is happening now)
        return eventDateTime >= now;
      })
      .sort((a, b) => {
        // Sort by date and time (earliest first)
        const dateTimeA = new Date(`${a.date}T${a.time}`).getTime();
        const dateTimeB = new Date(`${b.date}T${b.time}`).getTime();
        return dateTimeA - dateTimeB;
      })
      .slice(0, 10); // Limit to 10 events
  }, [searchQuery, selectedFilter, selectedLocation, viewMode, mapViewDate, events]);

  // Load sports from database
  useEffect(() => {
    const loadSports = async () => {
      try {
        const sportsData = await sportsService.getAllSports();
        setSports(sportsData);
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

  // Load player data for all events - use event IDs as dependency to prevent unnecessary refetches
  const filteredEventIds = useMemo(() => {
    const eventIds = [...filteredEvents.map(e => e.id)];
    // Include code event if it exists
    if (codeEvent) {
      eventIds.push(codeEvent.id);
    }
    return eventIds.sort().join(',');
  }, [filteredEvents, codeEvent]);

  useEffect(() => {
    let cancelled = false;

    const loadEventPlayers = async () => {
      // Use the current filteredEvents from closure (it's memoized, so safe)
      const currentEvents = [...filteredEvents];
      // Include code event if it exists
      if (codeEvent && !currentEvents.find(e => e.id === codeEvent.id)) {
        currentEvents.push(codeEvent);
      }
      
      if (currentEvents.length === 0) {
        if (!cancelled) {
          setEventPlayersMap({});
        }
        return;
      }

      const map: Record<string, User[]> = {};
      
      // Get all unique player IDs from all events
      const allPlayerIds = new Set<string>();
      currentEvents.forEach(event => {
        event.players.forEach(playerId => allPlayerIds.add(playerId));
      });

      if (allPlayerIds.size === 0) {
        if (!cancelled) {
          setEventPlayersMap({});
        }
        return;
      }

      // Fetch user profiles for all players (with batching to prevent blocking)
      const playerPromises = Array.from(allPlayerIds).map(async (playerId) => {
        if (cancelled) return null;
        try {
          const player = await userService.getUserProfile(playerId);
          return player;
        } catch (error) {
          console.error(`Error loading player ${playerId}:`, error);
          return null;
        }
      });

      const players = (await Promise.all(playerPromises)).filter((p): p is User => p !== null);
      
      if (cancelled) return;
      
      const playersById = new Map(players.map(p => [p.id, p]));

      // Map players to their events
      currentEvents.forEach(event => {
        map[event.id] = event.players
          .map(playerId => playersById.get(playerId))
          .filter((p): p is User => p !== undefined);
      });

      if (!cancelled) {
        setEventPlayersMap(map);
      }
    };

    // Use requestIdleCallback or setTimeout to prevent blocking the UI
    const timeoutId = setTimeout(() => {
      loadEventPlayers();
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [filteredEventIds, filteredEvents, codeEvent]);

  const formatEventTime = (date: string, time: string) => {
    const eventDate = new Date(`${date}T${time}`);
    const now = new Date();
    const diff = eventDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return `Today, ${time}`;
    if (days === 1) return `Tomorrow, ${time}`;
    return `${new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })}, ${time}`;
  };

  const handleJoinEvent = useCallback(async (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await joinEvent(eventId);
    } catch (err: any) {
      alert(err.message || "Failed to join event");
    }
  }, [joinEvent]);

  // Calendar functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days: (Date | null)[] = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const calendarDays = getDaysInMonth(currentMonth);
  
  const getEventsForDate = (date: Date | null): typeof events => {
    if (!date) return [];
    const now = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    let result = events
      .filter(e => {
        if (e.date !== dateStr || e.status !== 'open') return false;
        // Filter out past events
        const eventDateTime = new Date(`${e.date}T${e.time}`);
        return eventDateTime >= now;
      });

    // Filter by location if selected
    if (selectedLocation) {
      result = result.filter((e) => {
        const locationLower = e.location.toLowerCase();
        const selectedLocationLower = selectedLocation.toLowerCase();
        return locationLower.includes(selectedLocationLower);
      });
    }
    
    return result.sort((a, b) => {
      // Sort by time (earliest first)
      const timeA = a.time.split(':').map(Number);
      const timeB = b.time.split(':').map(Number);
      const minutesA = timeA[0] * 60 + timeA[1];
      const minutesB = timeB[0] * 60 + timeB[1];
      return minutesA - minutesB;
    });
  };

  const getDayEvents = (date: Date): typeof events => {
    const now = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    let result = events
      .filter(e => {
        if (e.date !== dateStr || e.status !== 'open') return false;
        // Filter out past events
        const eventDateTime = new Date(`${e.date}T${e.time}`);
        return eventDateTime >= now;
      });

    // Filter by location if selected
    if (selectedLocation) {
      result = result.filter((e) => {
        const locationLower = e.location.toLowerCase();
        const selectedLocationLower = selectedLocation.toLowerCase();
        return locationLower.includes(selectedLocationLower);
      });
    }
    
    return result.sort((a, b) => {
      // Sort by time (earliest first)
      const timeA = a.time.split(':').map(Number);
      const timeB = b.time.split(':').map(Number);
      const minutesA = timeA[0] * 60 + timeA[1];
      const minutesB = timeB[0] * 60 + timeB[1];
      return minutesA - minutesB;
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const selectMonth = (monthIndex: number) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(monthIndex);
      return newDate;
    });
    setShowMonthYearPicker(false);
  };

  const selectYear = (year: number) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setFullYear(year);
      return newDate;
    });
    setShowMonthYearPicker(false);
  };

  // Generate year range (current year ± 10 years)
  const getYearRange = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 10; i <= currentYear + 10; i++) {
      years.push(i);
    }
    return years;
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDay(new Date());
    setShowMonthYearPicker(false);
  };

  const isToday = (date: Date | null): boolean => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const formatDayHeader = (date: Date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const dayNum = date.getDate();
    const year = date.getFullYear();
    const today = new Date();
    const isTodayDate = date.toDateString() === today.toDateString();
    
    if (isTodayDate) {
      return `Today, ${monthName} ${dayNum}, ${year}`;
    }
    return `${dayName}, ${monthName} ${dayNum}, ${year}`;
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Memoize day events for selected day to prevent re-computation
  const dayEventsForSelectedDay = useMemo(() => {
    if (!selectedDay) return [];
    const year = selectedDay.getFullYear();
    const month = String(selectedDay.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDay.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return events
      .filter(e => e.date === dateStr && e.status === 'open')
      .sort((a, b) => {
        const timeA = a.time.split(':').map(Number);
        const timeB = b.time.split(':').map(Number);
        const minutesA = timeA[0] * 60 + timeA[1];
        const minutesB = timeB[0] * 60 + timeB[1];
        return minutesA - minutesB;
      });
  }, [selectedDay, events]);

  return (
    <div className="flex flex-col pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-white/5 px-5 lg:px-8 xl:px-12 pt-8 lg:pt-6 xl:pt-5 pb-4 lg:pb-3 xl:pb-2">
        <div className="flex items-center gap-3 mb-4 lg:mb-3 xl:mb-2">
          <Avatar
            src={user?.avatar || `https://i.pravatar.cc/150?u=${user?.id}`}
          />
          <div>
            <p className="text-xs font-medium text-text-secondary">
              Welcome back,
            </p>
            <h2 className="text-lg font-bold leading-tight">
              {user ? `${user.firstName} ${user.lastName}` : "User"}
            </h2>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <button 
                onClick={() => navigate("/settings/notifications")}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-white hover:bg-surface-light/10 transition-colors"
              >
                <span className="material-symbols-outlined">notifications</span>
                {unreadCount > 0 && (
                <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-danger border border-surface"></span>
                )}
              </button>
            </div>
          </div>
        </div>

      </header>

      <div className="px-5 lg:px-8 xl:px-12 py-6 lg:py-4 xl:py-3 w-full">
        <div className="flex items-center justify-between mb-4 lg:mb-3 xl:mb-2">
          <h1 className="text-2xl lg:text-xl xl:text-lg font-extrabold">Find your game</h1>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-surface rounded-lg p-1 border border-white/5">
              <button
                onClick={() => {
                  setViewMode('calendar');
                  setShowCalendar(true);
                  setSelectedDay(null);
                }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'calendar'
                    ? 'bg-primary text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-lg">calendar_month</span>
                  <span className="hidden sm:inline">Calendar</span>
                </span>
              </button>
              <button
                onClick={() => {
                  setViewMode('map');
                  setShowCalendar(false);
                  setSelectedDay(null);
                }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'map'
                    ? 'bg-primary text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-lg">map</span>
                  <span className="hidden sm:inline">Map</span>
                </span>
              </button>
            </div>
          </div>
        </div>
        <div className="relative group mb-6 lg:mb-4 xl:mb-3">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
            <span className="material-symbols-outlined">search</span>
          </div>
          <input
            className="block w-full rounded-2xl lg:rounded-xl xl:rounded-lg border-none bg-surface py-3.5 lg:py-3 xl:py-2.5 pl-12 lg:pl-10 xl:pl-8 pr-4 text-base lg:text-sm xl:text-sm font-medium placeholder:text-slate-500 focus:ring-2 focus:ring-primary/50 text-white uppercase tracking-wider"
            placeholder="Enter event code (e.g., ABC123)"
            type="text"
            value={searchQuery}
            onChange={(e) => {
              // Only allow alphanumeric characters, max 6 characters
              const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
              setSearchQuery(value);
            }}
            pattern="[A-Z]{3}[0-9]{3}"
            maxLength={6}
          />
        </div>

        {/* Event found by code - show directly under search */}
        {searchQuery && (
          <div className="mb-4">
            {isValidCodeFormat ? (
              codeEvent ? (
                (() => {
                  const eventPlayers = eventPlayersMap[codeEvent.id] || [];
                  const spotsLeft = codeEvent.maxPlayers - codeEvent.currentPlayers;
                  const isJoined = user && codeEvent.players.includes(user.id);

                  return (
                    <div
                      onClick={() => navigate(`/event/${codeEvent.id}`)}
                      className="group relative flex flex-col gap-3 lg:gap-2 xl:gap-2 rounded-2xl lg:rounded-xl xl:rounded-lg bg-primary/10 border-2 border-primary/30 p-4 lg:p-3 xl:p-3 hover:border-primary/50 transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4 lg:gap-3 xl:gap-2">
                          <div className="flex h-14 w-14 lg:h-12 lg:w-12 xl:h-10 xl:w-10 shrink-0 items-center justify-center rounded-xl lg:rounded-lg xl:rounded-md bg-primary/20 text-primary border border-primary/30">
                            <span className="material-symbols-outlined text-3xl lg:text-2xl xl:text-xl">
                              {codeEvent.sport === "Basketball"
                                ? "sports_basketball"
                                : codeEvent.sport === "Soccer"
                                ? "sports_soccer"
                                : codeEvent.sport === "Tennis"
                                ? "sports_tennis"
                                : "sports"}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-base font-bold text-white">
                                {codeEvent.title}
                              </h4>
                              <Badge type="neon" className="text-xs">
                                Code: {codeEvent.code}
                              </Badge>
                            </div>
                            <div className="mt-1 flex items-center gap-3 text-xs font-medium text-slate-300 flex-wrap">
                              <div className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">
                                  location_on
                                </span>
                                {codeEvent.location}
                              </div>
                              <div className="h-1 w-1 rounded-full bg-slate-500"></div>
                              <div className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">
                                  schedule
                                </span>
                                {formatEventTime(codeEvent.date, codeEvent.time)}
                              </div>
                              {codeEvent.price && (
                                <>
                                  <div className="h-1 w-1 rounded-full bg-slate-500"></div>
                                  <div className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">
                                      payments
                                    </span>
                                    <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(codeEvent.price)}</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <Badge type={spotsLeft === 1 ? "neon" : "slate"}>
                          {spotsLeft === 1
                            ? "Last Spot!"
                            : `${codeEvent.currentPlayers}/${codeEvent.maxPlayers} Players`}
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center justify-between border-t border-primary/20 pt-3">
                        <div className="flex items-center -space-x-2">
                          {eventPlayers.map((player, idx) => (
                            <Avatar
                              key={player.id}
                              src={
                                player.avatar ||
                                `https://i.pravatar.cc/150?u=${player.id}`
                              }
                              size="h-7 w-7"
                              className="border-surface"
                            />
                          ))}
                          {codeEvent.players.length > 3 && (
                            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface bg-slate-700 text-[10px] font-bold">
                              +{codeEvent.players.length - 3}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={(e) => handleJoinEvent(codeEvent.id, e)}
                          disabled={isJoined || spotsLeft === 0}
                          className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isJoined
                            ? "Joined"
                            : spotsLeft === 0
                            ? "Full"
                            : "Join Game"}
                        </button>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="rounded-xl bg-surface border border-white/10 p-4 text-center">
                  <span className="material-symbols-outlined text-4xl text-slate-400 mb-2 block">search_off</span>
                  <p className="text-sm text-slate-300 font-medium">Event not found</p>
                  <p className="text-xs text-slate-500 mt-1">No event found with code: {searchQuery.trim().toUpperCase()}</p>
                </div>
              )
            ) : (
              <div className="rounded-xl bg-surface border border-yellow-500/30 p-4 text-center">
                <span className="material-symbols-outlined text-4xl text-yellow-400 mb-2 block">info</span>
                <p className="text-sm text-slate-300 font-medium">Invalid code format</p>
                <p className="text-xs text-slate-500 mt-1">Please enter a 6-character code (e.g., ABC123)</p>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 lg:gap-2 xl:gap-2 overflow-x-auto pb-4 lg:pb-3 xl:pb-2 no-scrollbar">
          <button
            key="all"
            onClick={() => setSelectedFilter("")}
            className={`flex shrink-0 items-center gap-2 rounded-full px-5 lg:px-4 xl:px-3 py-2.5 lg:py-2 xl:py-1.5 text-sm lg:text-xs xl:text-xs font-bold transition-all active:scale-95 ${
              selectedFilter === ""
                ? "bg-white text-black"
                : "bg-surface text-slate-300 border border-white/5"
            }`}
          >
            All
          </button>
          {sportsLoading ? (
            <div className="flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold bg-surface text-slate-300 border border-white/5 animate-pulse">
              Loading...
            </div>
          ) : (
            sports.map((sport) => {
              const getSportIcon = (sportName: string) => {
                const sportData = sports.find(s => s.name === sportName);
                if (sportData) return sportData.icon;
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

              return (
                <button
                  key={sport.id}
                  onClick={() => setSelectedFilter(sport.name)}
                  className={`flex shrink-0 items-center gap-2 rounded-full px-5 lg:px-4 xl:px-3 py-2.5 lg:py-2 xl:py-1.5 text-sm lg:text-xs xl:text-xs font-bold transition-all active:scale-95 ${
                    selectedFilter === sport.name
                      ? "bg-white text-black"
                      : "bg-surface text-slate-300 border border-white/5"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] lg:text-[16px] xl:text-[14px]">
                    {sport.icon || getSportIcon(sport.name)}
                  </span>
                  {sport.name}
                </button>
              );
            })
          )}
        </div>

        {/* Location Filter - Only show in calendar mode */}
        {viewMode === 'calendar' && (
          <div className="mb-4 lg:mb-3 xl:mb-2">
            <label className="text-sm font-medium text-slate-400 mb-2 block">Lọc theo địa điểm</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full bg-surface rounded-xl px-4 h-12 outline-none border border-white/10 focus:border-primary transition-colors text-white"
            >
              {vietnamCities.map((city) => (
                <option key={city.name} value={city.name}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Map View */}
        {viewMode === 'map' && (
          <div className="mt-4">
            {/* Location Filter for Map View */}
            <div className="mb-4 lg:mb-3 xl:mb-2">
              <label className="text-sm font-medium text-slate-400 mb-2 block">Lọc theo địa điểm</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full bg-surface rounded-xl px-4 h-12 outline-none border border-white/10 focus:border-primary transition-colors text-white"
              >
                {vietnamCities.map((city) => (
                  <option key={city.name} value={city.name}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
            {/* Date Filter for Map View */}
            <div className="mb-4 lg:mb-3 xl:mb-2">
              <label className="text-sm font-medium text-slate-400 mb-2 block">Chọn ngày</label>
              <input
                type="date"
                value={mapViewDate}
                onChange={(e) => setMapViewDate(e.target.value)}
                className="w-full bg-surface rounded-xl px-4 h-12 outline-none border border-white/10 focus:border-primary transition-colors text-white [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                style={{
                  colorScheme: 'dark'
                }}
              />
            </div>
            <EventsMapView
              events={filteredEvents}
              onEventClick={(event) => navigate(`/event/${event.id}`)}
              centerLocation={(() => {
                const selectedCity = vietnamCities.find(city => city.name === selectedLocation);
                return selectedCity ? { lat: selectedCity.lat, lng: selectedCity.lng } : null;
              })()}
            />
          </div>
        )}

        {/* Day View - Under sport type selection */}
        {selectedDay && viewMode === 'calendar' && (
          <div className="px-0 pb-4 lg:pb-3 xl:pb-2 mt-4 lg:mt-3 xl:mt-2">
            <div className="mb-4 lg:mb-3 xl:mb-2 flex items-center justify-between">
              <div>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-2 lg:mb-1 xl:mb-1"
                >
                  <span className="material-symbols-outlined text-xl lg:text-lg xl:text-base">arrow_back</span>
                  <span className="text-sm lg:text-xs xl:text-xs font-medium">Back to Calendar</span>
                </button>
                <h2 className="text-2xl lg:text-xl xl:text-lg font-bold">{formatDayHeader(selectedDay)}</h2>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const prevDay = new Date(selectedDay);
                    prevDay.setDate(prevDay.getDate() - 1);
                    setSelectedDay(prevDay);
                  }}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button
                  onClick={() => {
                    const nextDay = new Date(selectedDay);
                    nextDay.setDate(nextDay.getDate() + 1);
                    setSelectedDay(nextDay);
                  }}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
                <button
                  onClick={() => setSelectedDay(new Date())}
                  className="px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20 transition-colors"
                >
                  Today
                </button>
              </div>
            </div>

            <div className="space-y-3 lg:space-y-2 xl:space-y-2">
              {dayEventsForSelectedDay.length === 0 ? (
                <div className="text-center py-12 lg:py-8 xl:py-6 text-slate-400">
                  <span className="material-symbols-outlined text-4xl lg:text-3xl xl:text-2xl mb-2 block">event_busy</span>
                  <p>No events scheduled for this day</p>
                </div>
              ) : (
                dayEventsForSelectedDay.map((event) => {
                  const eventPlayers = eventPlayersMap[event.id] || [];
                  const [hours, minutes] = event.time.split(':');
                  const hour = parseInt(hours, 10);
                  const displayHour = hour % 12 || 12;
                  const ampm = hour >= 12 ? 'PM' : 'AM';
                  
                  // Compute endTime explicitly
                  let endTime: string | null = null;
                  if (event.endTime) {
                    const [endHours, endMinutes] = event.endTime.split(':');
                    const endHour = parseInt(endHours, 10);
                    const endDisplayHour = endHour % 12 || 12;
                    const endAmpm = endHour >= 12 ? 'PM' : 'AM';
                    endTime = `${endDisplayHour}:${endMinutes} ${endAmpm}`;
                  }

                  const borderColor = 'border-primary/50';
                  const bgColor = 'bg-primary/10';
                  const accentColor = 'bg-primary';

                  return (
                    <div
                      key={event.id}
                      onClick={() => navigate(`/event/${event.id}`)}
                      className={`${bgColor} ${borderColor} border-l-4 rounded-lg lg:rounded-md xl:rounded-md p-4 lg:p-3 xl:p-2.5 cursor-pointer hover:opacity-80 transition-opacity`}
                    >
                      <div className="flex gap-4 lg:gap-3 xl:gap-2">
                        <div className="flex flex-col items-center min-w-[60px] lg:min-w-[50px] xl:min-w-[45px]">
                          <div className={`${accentColor} w-1 h-full rounded-full`}></div>
                          <div className="text-center mt-2 lg:mt-1 xl:mt-1">
                            <div className="text-lg lg:text-base xl:text-sm font-bold">{displayHour}:{minutes}</div>
                            <div className="text-xs lg:text-[10px] xl:text-[10px] text-slate-400">{ampm}</div>
                            {endTime && (
                              <>
                                <div className="text-xs lg:text-[10px] xl:text-[10px] text-slate-500 my-1">-</div>
                                <div className="text-sm lg:text-xs xl:text-[10px] font-medium">{endTime}</div>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2 lg:mb-1 xl:mb-1">
                            <div>
                              <h3 className="text-lg lg:text-base xl:text-sm font-bold mb-1 lg:mb-0.5 xl:mb-0.5">{event.title}</h3>
                              <div className="flex items-center gap-2 text-sm text-slate-400">
                                <span className="material-symbols-outlined text-base">
                                  location_on
                                </span>
                                <span>{event.location}</span>
                              </div>
                            </div>
                            <Badge>{event.sport}</Badge>
                          </div>
                          {event.description && (
                            <p className="text-sm text-slate-300 mb-2 line-clamp-2">{event.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-slate-400">
                            {event.price && (
                              <div className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-base">payments</span>
                                <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(event.price)}</span>
                              </div>
                            )}
                            {event.skillLevel && event.skillLevel !== 'All' && (
                              <div className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-base">trending_up</span>
                                <span>{event.skillLevel}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-base">group</span>
                              <span>{event.currentPlayers}/{event.maxPlayers} players</span>
                            </div>
                          </div>
                          {eventPlayers.length > 0 && (
                            <div className="mt-3 flex items-center gap-2">
                              <div className="flex -space-x-2">
                                {eventPlayers.slice(0, 5).map((player) => (
                                  <Avatar
                                    key={player.id}
                                    src={player.avatar || `https://i.pravatar.cc/150?u=${player.id}`}
                                    size="h-6 w-6"
                                    className="border-surface"
                                  />
                                ))}
                                {eventPlayers.length > 5 && (
                                  <div className="h-6 w-6 rounded-full bg-white/10 border-2 border-surface flex items-center justify-center text-[8px]">
                                    +{eventPlayers.length - 5}
                                  </div>
                                )}
                              </div>
                              <span className="text-xs text-slate-400">
                                {eventPlayers.length} {eventPlayers.length === 1 ? 'player' : 'players'} joined
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Calendar - Under sport type selection */}
        {viewMode === 'calendar' && showCalendar && !selectedDay && (
          <div className="px-0 pb-4 lg:pb-3 xl:pb-2 mt-4 lg:mt-3 xl:mt-2">
            {/* Calendar Navigation */}
            <div className="flex items-center justify-between mb-4 lg:mb-3 xl:mb-2 relative" ref={monthYearPickerRef}>
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 lg:p-1.5 xl:p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <span className="material-symbols-outlined text-2xl lg:text-xl xl:text-lg">chevron_left</span>
              </button>
              <div className="flex items-center gap-2 lg:gap-1.5 xl:gap-1">
                <button
                  onClick={() => setShowMonthYearPicker(!showMonthYearPicker)}
                  className="text-xl lg:text-lg xl:text-base font-bold hover:text-primary transition-colors flex items-center gap-1"
                >
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  <span className="material-symbols-outlined text-base lg:text-sm xl:text-xs">arrow_drop_down</span>
                </button>
                <button 
                  onClick={goToToday}
                  className="px-3 lg:px-2 xl:px-1.5 py-1 lg:py-0.5 xl:py-0.5 rounded-lg bg-primary/10 text-primary text-xs lg:text-[10px] xl:text-[10px] font-bold hover:bg-primary/20 transition-colors"
                >
                  Today
                </button>
              </div>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 lg:p-1.5 xl:p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <span className="material-symbols-outlined text-2xl lg:text-xl xl:text-lg">chevron_right</span>
              </button>

              {/* Month/Year Picker Dropdown */}
              {showMonthYearPicker && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-surface border border-white/10 rounded-xl shadow-2xl p-4 min-w-[280px] max-h-[400px] overflow-y-auto">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-slate-300 mb-2">Select Year</h3>
                    <div className="grid grid-cols-4 gap-2">
                      {getYearRange().map((year) => (
                        <button
                          key={year}
                          onClick={() => selectYear(year)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            currentMonth.getFullYear() === year
                              ? 'bg-primary text-white'
                              : 'bg-surface-light/50 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-300 mb-2">Select Month</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {monthNames.map((month, index) => (
                        <button
                          key={index}
                          onClick={() => selectMonth(index)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            currentMonth.getMonth() === index
                              ? 'bg-primary text-white'
                              : 'bg-surface-light/50 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          {month}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Calendar Grid Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2 lg:mb-1.5 xl:mb-1">
              {dayNames.map(day => (
                <div key={day} className="text-center text-xs lg:text-[10px] xl:text-[10px] font-bold text-slate-400 py-2 lg:py-1.5 xl:py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => {
                const dayEvents = getEventsForDate(date);
                const isTodayDate = isToday(date);
                
                return (
                  <div
                    key={index}
                    className={`min-h-[80px] lg:min-h-[70px] xl:min-h-[60px] border border-white/5 rounded-lg lg:rounded-md xl:rounded-md p-1.5 lg:p-1 xl:p-0.5 ${
                      date ? 'bg-surface/50 hover:bg-surface transition-colors cursor-pointer' : 'bg-transparent'
                    } ${isTodayDate ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
                    onClick={() => date && setSelectedDay(date)}
                  >
                    {date && (
                      <>
                        <div className={`text-xs lg:text-[10px] xl:text-[9px] font-bold mb-1 lg:mb-0.5 xl:mb-0.5 ${
                          isTodayDate ? 'text-primary' : date.getMonth() === currentMonth.getMonth() ? 'text-white' : 'text-slate-500'
                        }`}>
                          {date.getDate()}
                        </div>
                        <div className="space-y-0.5 lg:space-y-0.5 xl:space-y-0.5">
                          {dayEvents.slice(0, 3).map((event) => {
                            return (
                              <div
                                key={event.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/event/${event.id}`);
                                }}
                                className="bg-primary/20 border-primary/30 border rounded px-1.5 lg:px-1 xl:px-0.5 py-0.5 lg:py-0.5 xl:py-0.5 text-[10px] lg:text-[8px] xl:text-[7px] font-medium truncate cursor-pointer hover:opacity-80 transition-opacity text-primary"
                                title={event.title}
                              >
                                <span className="truncate">{event.title}</span>
                              </div>
                            );
                          })}
                          {dayEvents.length > 3 && (
                            <div className="text-[10px] lg:text-[8px] xl:text-[7px] text-slate-400 px-1.5 lg:px-1 xl:px-0.5">
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const MyEvents: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { myEvents, events, getUserPendingRequest } = useEvents();
  const { getOrCreateChat } = useMessages();
  const [eventPlayersMap, setEventPlayersMap] = useState<Record<string, User[]>>({});

  // Separate events into three categories
  // Use all events, not just myEvents, to ensure we catch all created events
  // Memoize these to prevent infinite loops
  const createdEvents = useMemo(() => 
    events.filter(e => e.organizerId === user?.id),
    [events, user?.id]
  );
  
  const joinedEvents = useMemo(() => 
    events.filter(e => 
      e.organizerId !== user?.id && 
      e.players.includes(user?.id || '')
    ),
    [events, user?.id]
  );
  
  // Requested events: events that user requested to join but haven't been accepted yet
  // Note: We check for pending requests using the event_requests table via getUserPendingRequest
  const [requestedEventIds, setRequestedEventIds] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    const loadRequestedEvents = async () => {
      if (!user) {
        setRequestedEventIds(new Set());
        return;
      }
      
      const requestedIds = new Set<string>();
      for (const event of events) {
        if (event.organizerId !== user.id && 
            !event.players.includes(user.id) && 
            event.status === 'open') {
          try {
            const pendingRequest = await getUserPendingRequest(event.id);
            if (pendingRequest) {
              requestedIds.add(event.id);
            }
          } catch (error) {
            console.error(`Error checking request for event ${event.id}:`, error);
          }
        }
      }
      setRequestedEventIds(requestedIds);
    };
    
    loadRequestedEvents();
  }, [events, user, getUserPendingRequest]);
  
  const requestedEvents = useMemo(() => 
    events.filter(e => 
      e.organizerId !== user?.id && 
      !e.players.includes(user?.id || '') &&
      requestedEventIds.has(e.id) &&
      e.status === 'open'
    ),
    [events, user?.id, requestedEventIds]
  );

  // Get upcoming events (future dates) and past events separately
  // Memoize these to prevent infinite loops in useEffect
  const now = useMemo(() => new Date(), []);
  
  const upcomingCreated = useMemo(() => {
    return createdEvents
      .filter(e => {
        const eventDate = new Date(`${e.date}T${e.time}`);
        return eventDate >= now;
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });
  }, [createdEvents, now]);

  const pastCreated = useMemo(() => {
    return createdEvents
      .filter(e => {
        const eventDate = new Date(`${e.date}T${e.time}`);
        return eventDate < now;
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateB.getTime() - dateA.getTime();
      });
  }, [createdEvents, now]);

  const upcomingJoined = useMemo(() => {
    return joinedEvents
      .filter(e => {
        const eventDate = new Date(`${e.date}T${e.time}`);
        return eventDate >= now;
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });
  }, [joinedEvents, now]);

  const upcomingRequested = useMemo(() => {
    return requestedEvents
      .filter(e => {
        const eventDate = new Date(`${e.date}T${e.time}`);
        return eventDate >= now;
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });
  }, [requestedEvents, now]);

  // Load player data for events
  useEffect(() => {
    const loadEventPlayers = async () => {
      const map: Record<string, User[]> = {};
      const allPlayerIds = new Set<string>();
      
      [...upcomingCreated, ...pastCreated, ...upcomingJoined, ...upcomingRequested].forEach(event => {
        event.players.forEach(playerId => allPlayerIds.add(playerId));
      });

      if (allPlayerIds.size === 0) {
        setEventPlayersMap({});
        return;
      }

      const playerPromises = Array.from(allPlayerIds).map(async (playerId) => {
        try {
          return await userService.getUserProfile(playerId);
        } catch (error) {
          console.error(`Error loading player ${playerId}:`, error);
          return null;
        }
      });

      const players = (await Promise.all(playerPromises)).filter((p): p is User => p !== null);
      const playersById = new Map(players.map(p => [p.id, p]));

      [...upcomingCreated, ...pastCreated, ...upcomingJoined, ...upcomingRequested].forEach(event => {
        map[event.id] = event.players
          .map(playerId => playersById.get(playerId))
          .filter((p): p is User => p !== undefined);
      });

      setEventPlayersMap(map);
    };

    if (upcomingCreated.length > 0 || pastCreated.length > 0 || upcomingJoined.length > 0 || upcomingRequested.length > 0) {
      loadEventPlayers();
    }
  }, [upcomingCreated, pastCreated, upcomingJoined, upcomingRequested]);


  const formatEventTime = (date: string, time: string) => {
    const eventDate = new Date(`${date}T${time}`);
    const now = new Date();
    const diff = eventDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return `Today, ${time}`;
    if (days === 1) return `Tomorrow, ${time}`;
    return `${new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })}, ${time}`;
  };

  const formatShortDate = (date: string, time: string) => {
    const eventDate = new Date(`${date}T${time}`);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${days[eventDate.getDay()]}, ${displayHour}:${minutes} ${ampm}`;
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

  const handleMessagePlayers = async (event: Event, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !event.players.length) return;
    
    // For now, message the organizer. In a full implementation, this could open a group chat
    try {
      const chatId = await getOrCreateChat(event.organizerId);
      navigate(`/chat/${chatId}`);
    } catch (err) {
      console.error('Failed to open chat:', err);
    }
  };


  return (
    <div className="flex flex-col pb-24">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-white/5 px-5 pt-8 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-extrabold tracking-tight">My Events</h1>
        </div>
      </header>


      <div className="px-5 py-6 space-y-6 w-full border-t border-white/5 mt-4">
        {(upcomingCreated.length > 0 || pastCreated.length > 0) && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                Created Events{" "}
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                  {upcomingCreated.length + pastCreated.length}
                </span>
              </h2>
            </div>

            {upcomingCreated.length > 0 && (
              <>
                {upcomingCreated.map((event) => {
              const eventPlayers = eventPlayersMap[event.id] || [];
              const spotsLeft = event.maxPlayers - event.currentPlayers;
              
              return (
                <div
                  key={event.id}
                  onClick={() => navigate(`/event/manage/${event.id}`)}
                  className="bg-surface rounded-2xl p-4 border border-white/5 hover:border-primary/30 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-3">
                      <Badge type="gold">Created</Badge>
                      <Badge>{event.sport}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">
                        {event.title}
                      </h3>
                      <div className="space-y-1 text-sm text-slate-400">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-sm">
                            event
                          </span>{" "}
                          {formatEventTime(event.date, event.time)}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-sm">
                            location_on
                          </span>{" "}
                          {event.location}
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button 
                          onClick={(e) => handleMessagePlayers(event, e)}
                          className="flex-1 bg-primary h-9 rounded-lg text-sm font-bold shadow-lg shadow-primary/20"
                        >
                          Message Players
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/event/manage/${event.id}`);
                          }}
                          className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center"
                        >
                          <span className="material-symbols-outlined text-sm">
                            more_horiz
                          </span>
                        </button>
                      </div>
                    </div>
                    <div
                      className="w-24 h-32 rounded-xl bg-cover bg-center relative overflow-hidden"
                      style={{
                        backgroundImage: event.image 
                          ? `url(${event.image})`
                          : "url(https://images.unsplash.com/photo-1519861531473-920026393112)",
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                      <div className="absolute bottom-2 right-2 text-right">
                        <div className="text-white font-bold text-xs">{event.currentPlayers}/{event.maxPlayers}</div>
                        <div className="text-[9px] text-slate-300">Players</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
              </>
            )}

            {pastCreated.length > 0 && (
              <>
                <div className="mt-6 mb-2">
                  <h3 className="text-sm font-bold text-slate-400">Past Events</h3>
                </div>
                {pastCreated.map((event) => {
              const eventPlayers = eventPlayersMap[event.id] || [];
              const spotsLeft = event.maxPlayers - event.currentPlayers;
              
              return (
                <div
                  key={event.id}
                  onClick={() => navigate(`/event/manage/${event.id}`)}
                  className="bg-surface rounded-2xl p-4 border border-white/5 hover:border-primary/30 transition-all cursor-pointer group opacity-60"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-3">
                      <Badge type="gold">Created</Badge>
                      <Badge>{event.sport}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">
                        {event.title}
                      </h3>
                      <div className="space-y-1 text-sm text-slate-400">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-sm">
                            event
                          </span>{" "}
                          {formatEventTime(event.date, event.time)}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-sm">
                            location_on
                          </span>{" "}
                          {event.location}
                        </div>
                      </div>
                    </div>
                    <div
                      className="w-24 h-32 rounded-xl bg-cover bg-center relative overflow-hidden"
                      style={{
                        backgroundImage: event.image 
                          ? `url(${event.image})`
                          : "url(https://images.unsplash.com/photo-1519861531473-920026393112)",
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                      <div className="absolute bottom-2 right-2 text-right">
                        <div className="text-white font-bold text-xs">{event.currentPlayers}/{event.maxPlayers}</div>
                        <div className="text-[9px] text-slate-300">Players</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
              </>
            )}
          </>
        )}

        {upcomingRequested.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                Requested Events{" "}
                <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 text-xs">
                  {upcomingRequested.length}
                </span>
              </h2>
            </div>

            {upcomingRequested.map((event) => {
              const eventPlayers = eventPlayersMap[event.id] || [];
              
              return (
                <div
                  key={event.id}
                  onClick={() => navigate(`/event/${event.id}`)}
                  className="bg-surface rounded-2xl p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition-all cursor-pointer flex gap-4 items-center"
                >
                  <div
                    className="w-16 h-16 rounded-xl bg-cover bg-center shrink-0 flex items-center justify-center"
                    style={{
                      backgroundImage: event.image 
                        ? `url(${event.image})`
                        : "url(https://images.unsplash.com/photo-1622279457486-62dcc4a431d6)",
                    }}
                  >
                    {!event.image && (
                      <span className="material-symbols-outlined text-3xl text-white/50">
                        {getSportIcon(event.sport)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold">{event.title}</h3>
                      <Badge type="neon">Pending</Badge>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">
                        location_on
                      </span>{" "}
                      {event.location} • {formatShortDate(event.date, event.time)}
                    </div>
                    <div className="mt-2 flex justify-end">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/event/${event.id}`);
                        }}
                        className="text-xs font-bold text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {upcomingJoined.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                Joined Events{" "}
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                  {upcomingJoined.length}
                </span>
              </h2>
            </div>

            {upcomingJoined.map((event) => {
              const eventPlayers = eventPlayersMap[event.id] || [];
              
              return (
                <div
                  key={event.id}
                  onClick={() => navigate(`/event/${event.id}`)}
                  className="bg-surface rounded-2xl p-4 border border-white/5 hover:border-primary/30 transition-all cursor-pointer flex gap-4 items-center"
                >
                  <div
                    className="w-16 h-16 rounded-xl bg-cover bg-center shrink-0 flex items-center justify-center"
                    style={{
                      backgroundImage: event.image 
                        ? `url(${event.image})`
                        : "url(https://images.unsplash.com/photo-1622279457486-62dcc4a431d6)",
                    }}
                  >
                    {!event.image && (
                      <span className="material-symbols-outlined text-3xl text-white/50">
                        {getSportIcon(event.sport)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold">{event.title}</h3>
                      <Badge type="neon">Joined</Badge>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">
                        location_on
                      </span>{" "}
                      {event.location} • {formatShortDate(event.date, event.time)}
                    </div>
                    {eventPlayers.length > 0 && (
                      <div className="mt-2 flex justify-between items-center">
                        <div className="flex -space-x-2">
                          {eventPlayers.slice(0, 3).map((player) => (
                            <Avatar
                              key={player.id}
                              src={player.avatar || `https://i.pravatar.cc/150?u=${player.id}`}
                              size="h-5 w-5"
                              className="border-surface"
                            />
                          ))}
                          {eventPlayers.length > 3 && (
                            <div className="h-5 w-5 rounded-full bg-white/10 border-2 border-surface flex items-center justify-center text-[8px]">
                              +{eventPlayers.length - 3}
                            </div>
                          )}
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/event/${event.id}`);
                          }}
                          className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full"
                        >
                          View Details
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {createdEvents.length === 0 && joinedEvents.length === 0 && requestedEvents.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <p>No events yet. Create or join an event to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export const Messages: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { chats, getOrCreateChat } = useMessages();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChats = chats.filter((chat) => {
    if (!searchQuery) return true;
    // In a real app, would search through message content and participant names
    return true;
  });

  const handleChatClick = async (otherUserId: string) => {
    try {
      const chatId = await getOrCreateChat(otherUserId);
      navigate(`/chat/${chatId}`);
    } catch (err) {
      console.error("Failed to open chat", err);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="flex flex-col h-full bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-white/5 pt-8 px-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-extrabold">Messages</h1>
          <button className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined">edit_square</span>
          </button>
        </div>
        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
            <span className="material-symbols-outlined text-[20px]">
              search
            </span>
          </span>
          <input
            type="text"
            placeholder="Search teammates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-slate-500 border border-white/5 focus:border-primary/50 outline-none"
          />
        </div>
      </header>

      <div className="flex gap-4 px-5 py-4 overflow-x-auto no-scrollbar border-b border-white/5">
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="w-[60px] h-[60px] rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center bg-surface text-slate-400">
            <span className="material-symbols-outlined">add</span>
          </div>
          <span className="text-xs text-slate-400">My Status</span>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1 shrink-0">
            <div
              className={`w-[60px] h-[60px] rounded-full p-[2px] ${
                i === 1
                  ? "bg-gradient-to-tr from-primary to-[#39FF14]"
                  : "bg-surface border border-white/10"
              }`}
            >
              <img
                src={`https://i.pravatar.cc/150?u=${i + 10}`}
                className="w-full h-full rounded-full object-cover border-2 border-background"
                alt=""
              />
            </div>
            <span className="text-xs text-white">Name</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col">
        {filteredChats.length === 0 ? (
          <div className="text-center py-12 text-slate-400 px-5">
            <p>No messages yet. Start a conversation!</p>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const otherParticipantId = chat.participants.find(
              (p) => p !== user?.id
            );
            const otherUser = otherParticipantId
              ? userService.getUser(otherParticipantId)
              : undefined;

            if (!otherUser) return null;

            return (
              <div
                key={chat.id}
                onClick={() => navigate(`/chat/${chat.id}`)}
                className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 cursor-pointer transition-colors relative"
              >
                <Avatar
                  src={
                    otherUser.avatar ||
                    `https://i.pravatar.cc/150?u=${otherUser.id}`
                  }
                  size="h-14 w-14"
                />
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-0.5">
                    <h3 className="font-bold text-white truncate">
                      {otherUser.firstName} {otherUser.lastName}
                    </h3>
                    {chat.lastMessage && (
                      <span className="text-xs text-slate-500">
                        {formatTime(chat.lastMessage.timestamp)}
                      </span>
                    )}
            </div>
            <div className="flex justify-between items-center">
                    <p className="text-sm text-slate-400 font-medium truncate pr-4">
                      {chat.lastMessage?.content || "No messages yet"}
                    </p>
                    {chat.unreadCount > 0 && (
              <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0"></div>
                    )}
            </div>
          </div>
        </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading, signOut } = useAuth();
  const { events } = useEvents();
  const { getOrCreateChat } = useMessages();
  const [friends, setFriends] = useState<User[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [sports, setSports] = useState<Sport[]>([]);

  // Load sports for display
  useEffect(() => {
    const loadSports = async () => {
      try {
        const sportsData = await sportsService.getAllSports();
        setSports(sportsData);
      } catch (err) {
        console.error('Error loading sports:', err);
      }
    };
    loadSports();
  }, []);

  // Get friends - load from user.friends array
  useEffect(() => {
    const loadFriends = async () => {
      if (!user || !user.friends || user.friends.length === 0) {
        setFriends([]);
        setFriendsLoading(false);
        return;
      }

      try {
        // Load friend profiles from user.friends array
        const friendPromises = user.friends.map(async (friendId) => {
          try {
            return await userService.getUserProfile(friendId);
          } catch (error) {
            console.error(`Error loading friend ${friendId}:`, error);
            return null;
          }
        });

        const loadedFriends = (await Promise.all(friendPromises))
          .filter((f): f is User => f !== null);

        setFriends(loadedFriends);
      } catch (error) {
        console.error('Error loading friends:', error);
        setFriends([]);
      } finally {
        setFriendsLoading(false);
      }
    };

    loadFriends();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex flex-col bg-background min-h-screen pb-24 items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col bg-background min-h-screen pb-24 items-center justify-center">
        <div className="text-white">No user data available</div>
      </div>
    );
  }

  const fullName = `${user.firstName} ${user.lastName}`.trim() || 'User';
  const reliability = user.stats?.reliability || 100;
  const matches = user.stats?.matches || 0;
  const mvps = user.stats?.mvps || 0;
  const level = user.level || 1;

  return (
    <div className="flex flex-col bg-background min-h-screen pb-24">
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md px-4 py-3 flex justify-between items-center">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-bold">Profile</h1>
        <button 
          onClick={() => navigate('/settings/notifications')}
          className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center"
        >
          <span className="material-symbols-outlined">settings</span>
        </button>
      </header>

      <div className="flex flex-col items-center pt-6 px-4">
        <div className="relative mb-4">
          <div className="absolute -inset-1 bg-gradient-to-tr from-yellow-400 via-green-400 to-primary opacity-70 blur rounded-full"></div>
          <div className="relative">
            <Avatar
              src={user.avatar || `https://i.pravatar.cc/150?u=${user.id}`}
              size="w-28 h-28"
              className="border-4 border-background"
            />
          </div>
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-yellow-600 border border-white/20 px-3 py-1 rounded-full flex items-center gap-1 shadow-lg whitespace-nowrap">
            <span className="material-symbols-outlined text-[14px] text-white">
              military_tech
            </span>
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">
              Level {level}
            </span>
          </div>
        </div>
        <h2 className="text-2xl font-extrabold mt-4 text-center">
          {fullName}
        </h2>
        {user.userId && (
          <div className="flex items-center justify-center gap-2 text-slate-400 text-sm mt-1">
            <code className="text-primary font-mono">{user.userId}</code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(user.userId);
              }}
              className="p-1 rounded-lg bg-primary/20 hover:bg-primary/30 transition-colors"
              title="Copy user ID"
            >
              <span className="material-symbols-outlined text-xs">content_copy</span>
            </button>
          </div>
        )}
        {user.location && (
          <div className="flex items-center gap-1 text-slate-400 text-sm mt-1">
            <span className="material-symbols-outlined text-[16px] text-primary">
              location_on
            </span>{" "}
            {user.location}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 px-4 mt-8">
        <div className="bg-surface p-3 rounded-xl flex flex-col items-center border border-white/5">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
            Matches
          </span>
          <span className="text-2xl font-bold mt-1">{matches}</span>
        </div>
        <div className="bg-surface p-3 rounded-xl flex flex-col items-center border border-primary/30 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-yellow-400"></div>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
            Reliability
          </span>
          <span className="text-2xl font-bold mt-1">{reliability}%</span>
        </div>
        <div className="bg-surface p-3 rounded-xl flex flex-col items-center border border-white/5">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
            MVPs
          </span>
          <span className="text-2xl font-bold mt-1">{mvps}</span>
        </div>
      </div>

      {user.sports && user.sports.length > 0 && (
        <div className="mt-8 px-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">Favorite Sports</h3>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {user.sports.map((sport, i) => {
              const getSportIcon = (sportName: string) => {
                const sportData = sports.find(s => s.name === sportName);
                if (sportData) return sportData.icon;
                return 'sports';
              };
              
              return (
                <div
                  key={i}
                  className="flex flex-col items-center gap-2 min-w-[80px]"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center shadow-lg border-2 border-primary/30">
                    <span className="material-symbols-outlined text-3xl text-primary">
                      {getSportIcon(sport)}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 text-center">
                    {sport}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Friend Section */}
      <div className="mt-6 px-4">
        <h3 className="font-bold text-lg mb-4">Add Friend</h3>
        <AddFriendSection currentUser={user} />
      </div>

      {/* Friend Requests Section */}
      {user.friendRequests && user.friendRequests.length > 0 && (
        <div className="mt-6 px-4">
          <h3 className="font-bold text-lg mb-4">Friend Requests ({user.friendRequests.length})</h3>
          <FriendRequestsSection currentUser={user} onUpdate={() => window.location.reload()} />
        </div>
      )}

      <div className="mt-6 px-4">
        <h3 className="font-bold text-lg mb-4">Friends ({user.friends?.length || 0})</h3>
        {friendsLoading ? (
          <div className="text-center text-slate-400 py-4">Loading friends...</div>
        ) : (!user.friends || user.friends.length === 0) ? (
          <div className="text-center text-slate-400 py-4">No friends yet. Add friends using their user ID!</div>
        ) : (
          <div className="space-y-3">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center justify-between p-3 bg-surface rounded-xl border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar 
                      src={friend.avatar || `https://i.pravatar.cc/150?u=${friend.id}`} 
                      size="w-10 h-10"
                    />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{friend.firstName} {friend.lastName}</p>
                    <p className="text-xs text-slate-400">{friend.userId || `Level ${friend.level || 1}`}</p>
                  </div>
                </div>
                <button 
                  onClick={async () => {
                    if (user) {
                      try {
                        const chatId = await getOrCreateChat([user.id, friend.id]);
                        navigate(`/chat/${chatId}`);
                      } catch (error) {
                        console.error('Error creating chat:', error);
                      }
                    }
                  }}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-primary"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    chat
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 px-4">
        <button
          onClick={async () => {
            try {
              await signOut();
              navigate('/');
            } catch (error) {
              console.error('Error signing out:', error);
            }
          }}
          className="w-full py-4 bg-red-500/10 border-2 border-red-500/30 rounded-xl font-bold text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">logout</span>
          Logout
        </button>
      </div>
    </div>
  );
};

// Add Friend Component
const AddFriendSection: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [searchUserId, setSearchUserId] = useState("");
  const [searchedUser, setSearchedUser] = useState<User | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSearch = async () => {
    if (!searchUserId.trim()) {
      setError("Please enter a user ID");
      return;
    }

    if (!isValidUserId(searchUserId.trim())) {
      setError("Invalid user ID format. Use format: username#1234");
      return;
    }

    setIsSearching(true);
    setError("");
    setSuccess("");
    setSearchedUser(null);

    try {
      const user = await getUserByUserId(searchUserId.trim());
      if (user) {
        if (user.id === currentUser.id) {
          setError("You cannot add yourself as a friend");
        } else {
          setSearchedUser(user);
        }
      } else {
        setError("User not found");
      }
    } catch (err: any) {
      setError(err.message || "Error searching for user");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async () => {
    if (!searchedUser) return;

    try {
      await sendFriendRequest(currentUser.id, searchedUser.id);
      setSuccess("Friend request sent!");
      setSearchedUser(null);
      setSearchUserId("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Error sending friend request");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={searchUserId}
          onChange={(e) => setSearchUserId(e.target.value)}
          placeholder="Enter user ID (e.g., johndoe#1234)"
          className="flex-1 bg-surface rounded-xl px-4 h-12 outline-none border border-white/10 focus:border-primary transition-colors text-white"
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="px-4 py-2 bg-primary rounded-xl font-bold text-white hover:bg-primary/80 transition-colors disabled:opacity-50"
        >
          {isSearching ? "Searching..." : "Search"}
        </button>
      </div>
      
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm">
          {success}
        </div>
      )}

      {searchedUser && (
        <div className="bg-surface p-4 rounded-xl border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar 
              src={searchedUser.avatar || `https://i.pravatar.cc/150?u=${searchedUser.id}`}
              size="w-12 h-12"
            />
            <div>
              <p className="font-bold">{searchedUser.firstName} {searchedUser.lastName}</p>
              <p className="text-xs text-slate-400">{searchedUser.userId}</p>
            </div>
          </div>
          <button
            onClick={handleSendRequest}
            className="px-4 py-2 bg-primary rounded-lg font-bold text-white hover:bg-primary/80 transition-colors"
          >
            Send Request
          </button>
        </div>
      )}

      {currentUser.userId && (
        <div className="mt-4 p-3 bg-primary/10 border border-primary/30 rounded-xl">
          <p className="text-xs text-slate-400 mb-1">Your User ID</p>
          <div className="flex items-center gap-2">
            <code className="text-sm font-bold text-primary">{currentUser.userId}</code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(currentUser.userId);
                setSuccess("User ID copied!");
                setTimeout(() => setSuccess(""), 2000);
              }}
              className="p-1 rounded-lg bg-primary/20 hover:bg-primary/30 transition-colors"
              title="Copy user ID"
            >
              <span className="material-symbols-outlined text-sm">content_copy</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Friend Requests Component
const FriendRequestsSection: React.FC<{ currentUser: User; onUpdate: () => void }> = ({ currentUser, onUpdate }) => {
  const [loadingRequests, setLoadingRequests] = useState<Record<string, boolean>>({});
  const [requestUsers, setRequestUsers] = useState<User[]>([]);

  useEffect(() => {
    const loadRequestUsers = async () => {
      if (!currentUser.friendRequests || currentUser.friendRequests.length === 0) {
        setRequestUsers([]);
        return;
      }

      try {
        const users = await Promise.all(
          currentUser.friendRequests.map(async (userId) => {
            try {
              return await userService.getUserProfile(userId);
            } catch {
              return null;
            }
          })
        );
        setRequestUsers(users.filter((u): u is User => u !== null));
      } catch (error) {
        console.error('Error loading friend requests:', error);
      }
    };

    loadRequestUsers();
  }, [currentUser.friendRequests]);

  const handleAccept = async (friendId: string) => {
    setLoadingRequests(prev => ({ ...prev, [friendId]: true }));
    try {
      await acceptFriendRequest(currentUser.id, friendId);
      onUpdate();
    } catch (error) {
      console.error('Error accepting friend request:', error);
    } finally {
      setLoadingRequests(prev => ({ ...prev, [friendId]: false }));
    }
  };

  return (
    <div className="space-y-3">
      {requestUsers.map((user) => (
        <div
          key={user.id}
          className="bg-surface p-4 rounded-xl border border-white/5 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Avatar 
              src={user.avatar || `https://i.pravatar.cc/150?u=${user.id}`}
              size="w-12 h-12"
            />
            <div>
              <p className="font-bold">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-slate-400">{user.userId}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleAccept(user.id)}
              disabled={loadingRequests[user.id]}
              className="px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg font-bold text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50"
            >
              Accept
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Friends Component
const FriendsSection: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const navigate = useNavigate();
  const { getOrCreateChat } = useMessages();
  const [friends, setFriends] = useState<User[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);

  useEffect(() => {
    const loadFriends = async () => {
      if (!currentUser.friends || currentUser.friends.length === 0) {
        setFriends([]);
        setLoadingFriends(false);
        return;
      }

      try {
        const friendUsers = await Promise.all(
          currentUser.friends.map(async (friendId) => {
            try {
              return await userService.getUserProfile(friendId);
            } catch {
              return null;
            }
          })
        );
        setFriends(friendUsers.filter((u): u is User => u !== null));
      } catch (error) {
        console.error('Error loading friends:', error);
      } finally {
        setLoadingFriends(false);
      }
    };

    loadFriends();
  }, [currentUser.friends]);

  const handleRemoveFriend = async (friendId: string) => {
    if (!confirm('Remove this friend?')) return;
    
    try {
      await removeFriend(currentUser.id, friendId);
      setFriends(prev => prev.filter(f => f.id !== friendId));
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  if (loadingFriends) {
    return <div className="text-center text-slate-400 py-4">Loading friends...</div>;
  }

  return (
    <div className="space-y-3">
      {friends.map((friend) => (
        <div
          key={friend.id}
          className="bg-surface p-4 rounded-xl border border-white/5 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Avatar 
              src={friend.avatar || `https://i.pravatar.cc/150?u=${friend.id}`}
              size="w-12 h-12"
            />
            <div>
              <p className="font-bold">{friend.firstName} {friend.lastName}</p>
              <p className="text-xs text-slate-400">{friend.userId}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                try {
                  const chatId = await getOrCreateChat([currentUser.id, friend.id]);
                  navigate(`/chat/${chatId}`);
                } catch (error) {
                  console.error('Error creating chat:', error);
                }
              }}
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-primary"
            >
              <span className="material-symbols-outlined text-[18px]">chat</span>
            </button>
            <button
              onClick={() => handleRemoveFriend(friend.id)}
              className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20"
            >
              <span className="material-symbols-outlined text-[18px]">person_remove</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

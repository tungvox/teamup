import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Avatar, Badge, resolveSignedAvatarUrl } from "../components/Layout";
import { EventsMapView } from "../components/EventsMapView";
import { useAuth } from "../context/AuthContext";
import { useEvents } from "../context/EventContext";
import { useMessages } from "../context/MessageContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { userService } from "../services/userService";
import { User, EventRequest, Event } from "../types";
import {
  sportsService,
  getUserByUserId,
  sendFriendRequest,
  acceptFriendRequest,
  denyFriendRequest,
  removeFriend,
} from "../services/supabaseService";
import { isValidUserId } from "../utils/userId";
import { supabase } from "../lib/supabase";
import { ratingService } from "../services/ratings/ratingService";
import { getTierInfo, calculateTier, Tier } from "../utils/tierSystem";
import { calculateAndUpdateTier } from "../services/users/userProfileService";
import { settingsService } from "../services/settingsService";

interface Sport {
  id: string;
  name: string;
  name_vi?: string | null;
  icon: string;
}

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { events, joinEvent } = useEvents();
  const { unreadCount } = useMessages();
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("");
  const [selectedLocation, setSelectedLocation] =
    useState<string>("Bà Rịa - Vũng Tàu");
  const [eventPlayersMap, setEventPlayersMap] = useState<
    Record<string, User[]>
  >({});
  const [sports, setSports] = useState<Sport[]>([]);
  const [sportsLoading, setSportsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"calendar" | "map">("calendar");
  const [showCalendar, setShowCalendar] = useState<boolean>(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [friendsOnly, setFriendsOnly] = useState(false);
  const [mapViewDate, setMapViewDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  ); // Default to today
  const [showMonthYearPicker, setShowMonthYearPicker] =
    useState<boolean>(false);
  const monthYearPickerRef = useRef<HTMLDivElement>(null);

  // Initialize selected location from user profile if available
  useEffect(() => {
    if (user?.location) {
      setSelectedLocation(user.location);
    }
  }, [user?.location]);

  // Load saved sport filter (database when logged in, else localStorage)
  useEffect(() => {
    if (user?.id) {
      settingsService.getSportFilter(user.id).then((saved) => {
        setSelectedFilter(saved ?? "");
      });
    } else {
      const saved = localStorage.getItem("teamup_sport_filter");
      setSelectedFilter(saved ?? "");
    }
  }, [user?.id]);

  // Load friends' events only setting from database
  useEffect(() => {
    if (user?.id) {
      settingsService.getFriendsEventsOnly(user.id).then((saved) => {
        setFriendsOnly(saved);
      });
    } else {
      const saved = localStorage.getItem("teamup_friends_events_only");
      setFriendsOnly(saved === "true");
    }
  }, [user?.id]);

  // Persist sport filter when it changes
  const handleSportFilterChange = useCallback(
    (value: string) => {
      setSelectedFilter(value);
      if (user?.id) {
        settingsService.saveSportFilter(user.id, value).catch((err) =>
          console.error("Failed to save sport filter:", err),
        );
      } else {
        localStorage.setItem("teamup_sport_filter", value);
      }
    },
    [user?.id],
  );

  // Helper function to normalize Vietnamese text (remove diacritics and normalize)
  const normalizeVietnamese = (text: string): string => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();
  };

  // Helper function to check if location matches city
  const locationMatchesCity = (
    eventLocation: string,
    cityName: string,
  ): boolean => {
    const normalizedLocation = normalizeVietnamese(eventLocation);

    // Find the city object to get both Vietnamese and English names
    const city = vietnamCities.find(
      (c) => c.name === cityName || c.english === cityName,
    );
    if (!city) {
      // Fallback: try to match with the provided cityName directly
      const normalizedCity = normalizeVietnamese(cityName);
      return normalizedLocation.includes(normalizedCity);
    }

    // Normalize both Vietnamese and English names
    const normalizedVietnameseName = normalizeVietnamese(city.name);
    const normalizedEnglishName = normalizeVietnamese(city.english);

    // Check if either Vietnamese or English name appears in location
    if (
      normalizedLocation.includes(normalizedVietnameseName) ||
      normalizedLocation.includes(normalizedEnglishName)
    ) {
      return true;
    }

    // For compound city names, check if key parts match
    const vietnameseParts = normalizedVietnameseName
      .split(/[\s-]+/)
      .filter((part) => part.length >= 2);
    const englishParts = normalizedEnglishName
      .split(/[\s-]+/)
      .filter((part) => part.length >= 2);

    // Check Vietnamese parts
    if (vietnameseParts.length >= 2) {
      const matchingParts = vietnameseParts.filter((part) =>
        normalizedLocation.includes(part),
      );
      if (matchingParts.length >= 2) return true;
    }

    // Check English parts
    if (englishParts.length >= 2) {
      const matchingParts = englishParts.filter((part) =>
        normalizedLocation.includes(part),
      );
      if (matchingParts.length >= 2) return true;
    }

    return false;
  };

  // Vietnamese cities list with Vietnamese names and coordinates
  const vietnamCities = [
    {
      name: "Thành phố Hồ Chí Minh",
      english: "Ho Chi Minh City",
      lat: 10.8231,
      lng: 106.6297,
    },
    { name: "Hà Nội", english: "Hanoi", lat: 21.0285, lng: 105.8542 },
    { name: "Đà Nẵng", english: "Da Nang", lat: 16.0544, lng: 108.2022 },
    { name: "Hải Phòng", english: "Hai Phong", lat: 20.8449, lng: 106.6881 },
    { name: "Cần Thơ", english: "Can Tho", lat: 10.0452, lng: 105.7469 },
    { name: "Vũng Tàu", english: "Vung Tau", lat: 10.346, lng: 107.0843 },
    { name: "Nha Trang", english: "Nha Trang", lat: 12.2388, lng: 109.1967 },
    { name: "Huế", english: "Hue", lat: 16.4637, lng: 107.5909 },
    { name: "Đà Lạt", english: "Da Lat", lat: 11.9404, lng: 108.4583 },
    { name: "Quy Nhơn", english: "Quy Nhon", lat: 13.782, lng: 109.2197 },
    { name: "Phan Thiết", english: "Phan Thiet", lat: 10.9376, lng: 108.1581 },
    { name: "Vinh", english: "Vinh", lat: 18.6734, lng: 105.6924 },
    {
      name: "Thái Nguyên",
      english: "Thai Nguyen",
      lat: 21.5928,
      lng: 105.8442,
    },
    { name: "Biên Hòa", english: "Bien Hoa", lat: 10.9447, lng: 106.8243 },
    { name: "Long Xuyên", english: "Long Xuyen", lat: 10.3865, lng: 105.4351 },
    { name: "Rạch Giá", english: "Rach Gia", lat: 10.0124, lng: 105.0809 },
    { name: "Mỹ Tho", english: "My Tho", lat: 10.36, lng: 106.36 },
    { name: "Cà Mau", english: "Ca Mau", lat: 9.1769, lng: 105.15 },
    { name: "Bạc Liêu", english: "Bac Lieu", lat: 9.2942, lng: 105.7278 },
    { name: "Sóc Trăng", english: "Soc Trang", lat: 9.6025, lng: 105.9739 },
    { name: "Trà Vinh", english: "Tra Vinh", lat: 9.9347, lng: 106.3453 },
    { name: "Bến Tre", english: "Ben Tre", lat: 10.2415, lng: 106.3759 },
    { name: "Tây Ninh", english: "Tay Ninh", lat: 11.3131, lng: 106.0963 },
    { name: "Bình Dương", english: "Binh Duong", lat: 11.3254, lng: 106.4774 },
    { name: "Đồng Nai", english: "Dong Nai", lat: 10.9574, lng: 106.8429 },
    {
      name: "Bà Rịa - Vũng Tàu",
      english: "Ba Ria - Vung Tau",
      lat: 10.4963,
      lng: 107.1684,
    },
    { name: "Khánh Hòa", english: "Khanh Hoa", lat: 12.2388, lng: 109.1967 },
    { name: "Lâm Đồng", english: "Lam Dong", lat: 11.9404, lng: 108.4583 },
    { name: "Bình Thuận", english: "Binh Thuan", lat: 10.9376, lng: 108.1581 },
    { name: "Bình Phước", english: "Binh Phuoc", lat: 11.6476, lng: 106.6056 },
    { name: "Đồng Tháp", english: "Dong Thap", lat: 10.36, lng: 106.36 },
    { name: "An Giang", english: "An Giang", lat: 10.3865, lng: 105.4351 },
    { name: "Kiên Giang", english: "Kien Giang", lat: 10.0124, lng: 105.0809 },
  ];

  // Close month/year picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        monthYearPickerRef.current &&
        !monthYearPickerRef.current.contains(event.target as Node)
      ) {
        setShowMonthYearPicker(false);
      }
    };

    if (showMonthYearPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
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
    return events.find(
      (e) =>
        e.code?.toUpperCase() === searchQuery.trim().toUpperCase() &&
        e.status === "open",
    );
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
      result = events.filter(
        (e) => e.status === "open" && e.sport === selectedFilter,
      );
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
    if (viewMode === "map" && mapViewDate) {
      result = result.filter((e) => {
        return e.date === mapViewDate;
      });
      // In map view, only show upcoming or currently happening events (no past events)
      return result
        .filter((e) => {
          const eventDateTime = new Date(`${e.date}T${e.time}`);
          const eventEndTime = e.endTime
            ? new Date(`${e.date}T${e.endTime}`)
            : null;

          // If event has an end time, show if it hasn't ended yet
          if (eventEndTime) {
            return eventEndTime >= now;
          }
          // If no end time, show if start time hasn't passed yet
          return eventDateTime >= now;
        })
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
        const eventEndTime = e.endTime
          ? new Date(`${e.date}T${e.endTime}`)
          : null;

        // If event has an end time, show if it hasn't ended yet
        // (this includes events that are currently happening and events that haven't started)
        if (eventEndTime) {
          return eventEndTime >= now;
        }
        // If no end time, show if start time hasn't passed yet
        // (events without end time are considered single-point events)
        return eventDateTime >= now;
      })
      .sort((a, b) => {
        // Sort by date and time (earliest first)
        const dateTimeA = new Date(`${a.date}T${a.time}`).getTime();
        const dateTimeB = new Date(`${b.date}T${b.time}`).getTime();
        return dateTimeA - dateTimeB;
      })
      .slice(0, 10); // Limit to 10 events
  }, [
    searchQuery,
    selectedFilter,
    selectedLocation,
    viewMode,
    mapViewDate,
    events,
  ]);

  // Load sports from database
  useEffect(() => {
    const loadSports = async () => {
      try {
        const sportsData = await sportsService.getAllSports();
        setSports(sportsData);
      } catch (err) {
        console.error("Error loading sports:", err);
        // Fallback to default sports
        setSports([
          { id: "1", name: "Tennis", icon: "sports_tennis" },
          { id: "2", name: "Pickleball", icon: "sports_tennis" },
          { id: "3", name: "Badminton", icon: "sports_tennis" },
        ]);
      } finally {
        setSportsLoading(false);
      }
    };
    loadSports();
  }, []);

  // Load player data for all events - use event IDs as dependency to prevent unnecessary refetches
  const filteredEventIds = useMemo(() => {
    const eventIds = [...filteredEvents.map((e) => e.id)];
    // Include code event if it exists
    if (codeEvent) {
      eventIds.push(codeEvent.id);
    }
    return eventIds.sort().join(",");
  }, [filteredEvents, codeEvent]);

  useEffect(() => {
    let cancelled = false;

    const loadEventPlayers = async () => {
      // Use the current filteredEvents from closure (it's memoized, so safe)
      const currentEvents = [...filteredEvents];
      // Include code event if it exists
      if (codeEvent && !currentEvents.find((e) => e.id === codeEvent.id)) {
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
      currentEvents.forEach((event) => {
        event.players.forEach((playerId) => allPlayerIds.add(playerId));
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

      const players = (await Promise.all(playerPromises)).filter(
        (p): p is User => p !== null,
      );

      if (cancelled) return;

      const playersById = new Map(players.map((p) => [p.id, p]));

      // Map players to their events
      currentEvents.forEach((event) => {
        map[event.id] = event.players
          .map((playerId) => playersById.get(playerId))
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

  const formatEventTime = (date: string, time: string, endTime?: string) => {
    const eventDate = new Date(`${date}T${time}`);
    const now = new Date();
    const diff = eventDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    const formatTimeForEvent = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(":");
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? t("date.time.pm") : t("date.time.am");
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    };

    const timeStr = endTime
      ? `${formatTimeForEvent(time)} - ${formatTimeForEvent(endTime)}`
      : formatTimeForEvent(time);
    const dayNames = [
      t("date.days.sunday"),
      t("date.days.monday"),
      t("date.days.tuesday"),
      t("date.days.wednesday"),
      t("date.days.thursday"),
      t("date.days.friday"),
      t("date.days.saturday"),
    ];
    const dayName = dayNames[eventDate.getDay()];

    if (days === 0) return `${t("date.today")} (${dayName}), ${timeStr}`;
    if (days === 1) return `${t("date.tomorrow")} (${dayName}), ${timeStr}`;
    const dateObj = new Date(date);
    const monthNames = [
      t("date.months.january"),
      t("date.months.february"),
      t("date.months.march"),
      t("date.months.april"),
      t("date.months.may"),
      t("date.months.june"),
      t("date.months.july"),
      t("date.months.august"),
      t("date.months.september"),
      t("date.months.october"),
      t("date.months.november"),
      t("date.months.december"),
    ];
    const monthName = monthNames[dateObj.getMonth()];
    return `${dayName}, ${dateObj.getDate()} ${monthName}, ${timeStr}`;
  };

  const handleJoinEvent = useCallback(
    async (eventId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await joinEvent(eventId);
      } catch (err: any) {
        alert(err.message || "Failed to join event");
      }
    },
    [joinEvent],
  );

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
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    let result = events.filter((e) => {
      if (e.date !== dateStr || e.status !== "open") return false;

      // Filter by sport if selected
      if (selectedFilter && e.sport !== selectedFilter) return false;

      // Check if event is upcoming or happening (not past)
      const eventDateTime = new Date(`${e.date}T${e.time}`);
      const eventEndTime = e.endTime
        ? new Date(`${e.date}T${e.endTime}`)
        : null;

      // If event has an end time, show if it hasn't ended yet
      if (eventEndTime) {
        return eventEndTime >= now;
      }
      // If no end time, show if start time hasn't passed yet
      return eventDateTime >= now;
    });

    // Filter by location if selected (use smart city matching)
    if (selectedLocation) {
      result = result.filter((e) =>
        locationMatchesCity(e.location, selectedLocation),
      );
    }

    return result.sort((a, b) => {
      // Sort by time (earliest first)
      const timeA = a.time.split(":").map(Number);
      const timeB = b.time.split(":").map(Number);
      const minutesA = timeA[0] * 60 + timeA[1];
      const minutesB = timeB[0] * 60 + timeB[1];
      return minutesA - minutesB;
    });
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const selectMonth = (monthIndex: number) => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(monthIndex);
      return newDate;
    });
    setShowMonthYearPicker(false);
  };

  const selectYear = (year: number) => {
    setCurrentMonth((prev) => {
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
    const days = [
      t("date.days.sunday"),
      t("date.days.monday"),
      t("date.days.tuesday"),
      t("date.days.wednesday"),
      t("date.days.thursday"),
      t("date.days.friday"),
      t("date.days.saturday"),
    ];
    const months = [
      t("date.months.january"),
      t("date.months.february"),
      t("date.months.march"),
      t("date.months.april"),
      t("date.months.may"),
      t("date.months.june"),
      t("date.months.july"),
      t("date.months.august"),
      t("date.months.september"),
      t("date.months.october"),
      t("date.months.november"),
      t("date.months.december"),
    ];
    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const dayNum = date.getDate();
    const year = date.getFullYear();
    const today = new Date();
    const isTodayDate = date.toDateString() === today.toDateString();

    if (isTodayDate) {
      return `${t("date.today")}, ${dayNum} ${monthName} ${year}`;
    }
    return `${dayName}, ${dayNum} ${monthName} ${year}`;
  };

  const monthNames = [
    t("date.months.january"),
    t("date.months.february"),
    t("date.months.march"),
    t("date.months.april"),
    t("date.months.may"),
    t("date.months.june"),
    t("date.months.july"),
    t("date.months.august"),
    t("date.months.september"),
    t("date.months.october"),
    t("date.months.november"),
    t("date.months.december"),
  ];
  const dayNames = [
    t("date.days.short.sun"),
    t("date.days.short.mon"),
    t("date.days.short.tue"),
    t("date.days.short.wed"),
    t("date.days.short.thu"),
    t("date.days.short.fri"),
    t("date.days.short.sat"),
  ];

  // Memoize day events for selected day to prevent re-computation
  const dayEventsForSelectedDay = useMemo(() => {
    if (!selectedDay) return [];
    const now = new Date();
    const year = selectedDay.getFullYear();
    const month = String(selectedDay.getMonth() + 1).padStart(2, "0");
    const day = String(selectedDay.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;
    return events
      .filter((e) => {
        if (e.date !== dateStr || e.status !== "open") return false;

        // Filter by sport if selected
        if (selectedFilter && e.sport !== selectedFilter) return false;

        // Filter by location if selected (use smart city matching)
        if (
          selectedLocation &&
          !locationMatchesCity(e.location, selectedLocation)
        ) {
          return false;
        }

        // Check if event is upcoming or happening (not past)
        const eventDateTime = new Date(`${e.date}T${e.time}`);
        const eventEndTime = e.endTime
          ? new Date(`${e.date}T${e.endTime}`)
          : null;

        // If event has an end time, show if it hasn't ended yet
        if (eventEndTime) {
          if (eventEndTime < now) return false;
        } else {
          if (eventDateTime < now) return false;
        }

        // Friends only: show only events where organizer or at least one player is a friend
        if (friendsOnly && user?.friends?.length) {
          const friendIds = new Set(user.friends);
          const organizerIsFriend = friendIds.has(e.organizerId);
          const hasFriendPlayer = e.players.some((p) => friendIds.has(p));
          if (!organizerIsFriend && !hasFriendPlayer) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = a.time.split(":").map(Number);
        const timeB = b.time.split(":").map(Number);
        const minutesA = timeA[0] * 60 + timeA[1];
        const minutesB = timeB[0] * 60 + timeB[1];
        return minutesA - minutesB;
      });
  }, [selectedDay, events, selectedFilter, selectedLocation, friendsOnly, user?.friends]);

  return (
    <div className="flex flex-col pb-24 lg:pb-4">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-white/5 px-5 pt-4 pb-3 lg:px-6 lg:py-2">
        <div className="flex items-center justify-end gap-2 mb-2 lg:gap-1.5 lg:mb-1">
          <div className="text-right">
            <p className="text-[10px] font-medium text-text-secondary lg:text-[9px]">
              {t("common.welcome")},
            </p>
            <h2 className="text-sm font-bold leading-tight lg:text-xs">
              {user ? `${user.firstName} ${user.lastName}` : t("common.user")}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
            aria-label={t("nav.profile")}
          >
            <Avatar
              src={
                user?.avatar ||
                (user?.id ? `https://i.pravatar.cc/150?u=${user.id}` : "")
              }
            />
          </button>
        </div>
      </header>

      <div className="px-5 py-4 w-full lg:px-6 lg:py-3">
        <div className="lg:max-w-7xl lg:mx-auto lg:w-full">
          <div className="flex items-center justify-between mb-3 lg:mb-2">
            <h1 className="text-lg font-extrabold lg:text-base">
              {t("home.findYourGame")}
            </h1>
            <div className="flex items-center gap-2 lg:gap-1.5">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-surface rounded-lg p-0.5 border border-white/5 lg:rounded">
                <button
                  onClick={() => {
                    setViewMode("calendar");
                    setShowCalendar(true);
                    setSelectedDay(null);
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all lg:px-2 lg:py-0.5 lg:text-[11px] ${
                    viewMode === "calendar"
                      ? "bg-primary text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-1 lg:gap-0.5">
                    <span className="material-symbols-outlined text-base lg:text-sm">
                      calendar_month
                    </span>
                    <span className="hidden sm:inline lg:text-[11px]">
                      {t("home.calendar")}
                    </span>
                  </span>
                </button>
                <button
                  onClick={() => {
                    setViewMode("map");
                    setShowCalendar(false);
                    setSelectedDay(null);
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all lg:px-2 lg:py-0.5 lg:text-[11px] ${
                    viewMode === "map"
                      ? "bg-primary text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-1 lg:gap-0.5">
                    <span className="material-symbols-outlined text-base lg:text-sm">
                      map
                    </span>
                    <span className="hidden sm:inline lg:text-[11px]">
                      {t("home.map")}
                    </span>
                  </span>
                </button>
              </div>
            </div>
          </div>
          <div className="relative group mb-4 lg:mb-3">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 lg:pl-2">
              <span className="material-symbols-outlined text-base lg:text-sm">
                search
              </span>
            </div>
            <input
              className={`block w-full rounded-xl bg-surface py-2.5 pl-10 pr-4 text-sm font-medium placeholder:text-slate-500 focus:ring-2 focus:ring-primary/50 uppercase tracking-wider lg:py-2 lg:pl-8 lg:pr-3 lg:text-xs ${
                theme === "light"
                  ? "border border-slate-300 text-slate-900"
                  : "border-none text-white"
              }`}
              placeholder={t("events.enterEventCode")}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                // Only allow alphanumeric characters, max 6 characters
                const value = e.target.value
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, "")
                  .slice(0, 6);
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
                    const spotsLeft =
                      codeEvent.maxPlayers - codeEvent.currentPlayers;
                    const isJoined =
                      user && codeEvent.players.includes(user.id);

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
                                  {formatEventTime(
                                    codeEvent.date,
                                    codeEvent.time,
                                    codeEvent.endTime,
                                  )}
                                </div>
                                {codeEvent.price && (
                                  <>
                                    <div className="h-1 w-1 rounded-full bg-slate-500"></div>
                                    <div className="flex items-center gap-1">
                                      <span className="material-symbols-outlined text-[14px]">
                                        payments
                                      </span>
                                      <span>
                                        {new Intl.NumberFormat("vi-VN", {
                                          style: "currency",
                                          currency: "VND",
                                        }).format(codeEvent.price)}
                                      </span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <Badge type={spotsLeft === 1 ? "neon" : "slate"}>
                            {spotsLeft === 1
                              ? t("events.lastSpot")
                              : `${codeEvent.currentPlayers}/${
                                  codeEvent.maxPlayers
                                } ${t("events.players")}`}
                          </Badge>
                        </div>
                        <div className="mt-1 flex items-center justify-between border-t border-primary/20 pt-3">
                          <div className="flex items-center -space-x-2">
                            {eventPlayers.map((player) => (
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
                              ? t("events.joined")
                              : spotsLeft === 0
                                ? t("events.full")
                                : t("events.join")}
                          </button>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="rounded-xl bg-surface border border-white/10 p-4 text-center">
                    <span className="material-symbols-outlined text-4xl text-slate-400 mb-2 block">
                      search_off
                    </span>
                    <p className="text-sm text-slate-300 font-medium">
                      Event not found
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      No event found with code:{" "}
                      {searchQuery.trim().toUpperCase()}
                    </p>
                  </div>
                )
              ) : (
                <div className="rounded-xl bg-surface border border-yellow-500/30 p-4 text-center">
                  <span className="material-symbols-outlined text-4xl text-yellow-400 mb-2 block">
                    info
                  </span>
                  <p className="text-sm text-slate-300 font-medium">
                    Invalid code format
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Please enter a 6-character code (e.g., ABC123)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Sport filter: dropdown on narrow screens, horizontal chips on md+ */}
          <div className="lg:hidden mb-3">
            <select
              value={selectedFilter}
              onChange={(e) => handleSportFilterChange(e.target.value)}
              className="w-full bg-surface rounded-lg px-3 h-10 outline-none border border-white/10 focus:border-primary transition-colors text-white text-sm font-medium"
            >
              <option value="">{t("home.allSports")}</option>
              {sportsLoading ? (
                <option disabled>{t("common.loading")}</option>
              ) : (
                sports.map((sport) => {
                  const displayName =
                    language === "vi" && sport.name_vi
                      ? sport.name_vi
                      : sport.name;
                  return (
                    <option key={sport.id} value={sport.name}>
                      {displayName}
                    </option>
                  );
                })
              )}
            </select>
          </div>
          <div className="hidden lg:flex gap-1.5 overflow-x-auto pb-3 no-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <button
              key="all"
              type="button"
              onClick={() => handleSportFilterChange("")}
              className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all active:scale-95 relative z-10 ${
                selectedFilter === ""
                  ? theme === "light"
                    ? "bg-primary text-white shadow-md ring-2 ring-primary/30"
                    : "bg-white text-black"
                  : "bg-surface text-slate-300 border border-white/5"
              }`}
            >
              {t("home.allSports")}
            </button>
            {sportsLoading ? (
              <div className="flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold bg-surface text-slate-300 border border-white/5 animate-pulse">
                {t("common.loading")}
              </div>
            ) : (
              sports.map((sport) => {
                const getSportIcon = (sportName: string) => {
                  const sportData = sports.find((s) => s.name === sportName);
                  if (sportData) return sportData.icon;
                  const iconMap: Record<string, string> = {
                    Tennis: "sports_tennis",
                    Pickleball: "sports",
                    Badminton: "sports_handball",
                    Basketball: "sports_basketball",
                    Football: "sports_soccer",
                    Running: "directions_run",
                    Volleyball: "sports_volleyball",
                  };
                  return iconMap[sportName] || "sports";
                };
                const displayName =
                  language === "vi" && sport.name_vi
                    ? sport.name_vi
                    : sport.name;
                const iconName =
                  sport.icon || getSportIcon(sport.name);
                const isSelected = selectedFilter === sport.name;

                return (
                  <button
                    key={sport.id}
                    type="button"
                    onClick={() => handleSportFilterChange(sport.name)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all active:scale-95 relative z-10 ${
                      isSelected
                        ? theme === "light"
                          ? "bg-primary text-white shadow-md ring-2 ring-primary/30"
                          : "bg-white text-black"
                        : "bg-surface text-slate-300 border border-white/5"
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {iconName}
                    </span>
                    {displayName}
                  </button>
                );
              })
            )}
          </div>

          {user?.friends && user.friends.length > 0 && (
            <label className="flex items-center gap-2 mb-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={friendsOnly}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setFriendsOnly(checked);
                  if (user?.id) {
                    settingsService.saveFriendsEventsOnly(user.id, checked).catch((err) =>
                      console.error("Failed to save friends events only:", err),
                    );
                  }
                }}
                className="w-4 h-4 rounded border-white/20 bg-surface accent-primary focus:ring-primary/50 focus:ring-2"
              />
              <span className="text-sm font-medium text-slate-300">
                {t("home.friendsOnly")}
              </span>
            </label>
          )}

          {/* Location Filter - Only show in calendar mode */}
          {viewMode === "calendar" && (
            <div className="mb-3">
              <label className="text-xs font-medium text-slate-400 mb-1.5 block">
                {t("home.filterByLocation")}
              </label>
              <select
                value={selectedLocation}
                onChange={async (e) => {
                  const value = e.target.value;
                  setSelectedLocation(value);
                  if (user && user.location !== value) {
                    try {
                      await updateUser({ location: value });
                    } catch (err) {
                      console.error("Failed to save location preference:", err);
                    }
                  }
                }}
                className="w-full bg-surface rounded-lg px-3 h-9 outline-none border border-white/10 focus:border-primary transition-colors text-white text-sm"
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
          {viewMode === "map" && (
            <div className="mt-3">
              {/* Location Filter for Map View */}
              <div className="mb-3">
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">
                  Lọc theo địa điểm
                </label>
                <select
                  value={selectedLocation}
                  onChange={async (e) => {
                    const value = e.target.value;
                    setSelectedLocation(value);
                    if (user && user.location !== value) {
                      try {
                        await updateUser({ location: value });
                      } catch (err) {
                        console.error(
                          "Failed to save location preference:",
                          err,
                        );
                      }
                    }
                  }}
                  className="w-full bg-surface rounded-lg px-3 h-9 outline-none border border-white/10 focus:border-primary transition-colors text-white text-sm"
                >
                  {vietnamCities.map((city) => (
                    <option key={city.name} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* Date Filter for Map View */}
              <div className="mb-3">
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">
                  Chọn ngày
                </label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={
                      mapViewDate
                        ? (() => {
                            const [year, month, day] = mapViewDate.split("-");
                            const date = new Date(
                              parseInt(year),
                              parseInt(month) - 1,
                              parseInt(day),
                            );
                            const dayNames = [
                              "Sunday",
                              "Monday",
                              "Tuesday",
                              "Wednesday",
                              "Thursday",
                              "Friday",
                              "Saturday",
                            ];
                            const dayName = dayNames[date.getDay()];
                            return `${dayName}, ${day}/${month}/${year}`;
                          })()
                        : ""
                    }
                    onClick={(e) => {
                      const dateInput = e.currentTarget
                        .nextElementSibling as HTMLInputElement;
                      if (typeof dateInput?.showPicker === "function") {
                        dateInput.showPicker();
                      } else {
                        dateInput?.click?.();
                      }
                    }}
                    className="w-full bg-surface rounded-lg px-3 h-9 outline-none border border-white/10 focus:border-primary transition-colors text-white text-sm cursor-pointer"
                    placeholder="dd/mm/yyyy"
                  />
                  <input
                    type="date"
                    value={mapViewDate}
                    onChange={(e) => setMapViewDate(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    style={{
                      colorScheme: "dark",
                    }}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-base">
                      calendar_month
                    </span>
                  </span>
                </div>
              </div>
              <EventsMapView
                events={filteredEvents}
                onEventClick={(event) => navigate(`/event/${event.id}`)}
                centerLocation={(() => {
                  const selectedCity = vietnamCities.find(
                    (city) => city.name === selectedLocation,
                  );
                  return selectedCity
                    ? { lat: selectedCity.lat, lng: selectedCity.lng }
                    : null;
                })()}
              />
            </div>
          )}

          {/* Day View - Under sport type selection */}
          {selectedDay && viewMode === "calendar" && (
            <div className="px-0 pb-3 mt-3" key={`day-view-${selectedFilter}`}>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <button
                    onClick={() => setSelectedDay(null)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-white/10 hover:bg-white/5 hover:border-primary/30 text-primary font-bold text-sm transition-all mb-2"
                  >
                    <span className="material-symbols-outlined text-base">
                      arrow_back
                    </span>
                    <span>{t("home.backToCalendar")}</span>
                  </button>
                  <h2 className="text-lg font-bold">
                    {formatDayHeader(selectedDay)}
                  </h2>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => {
                      const prevDay = new Date(selectedDay);
                      prevDay.setDate(prevDay.getDate() - 1);
                      setSelectedDay(prevDay);
                    }}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">
                      chevron_left
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      const nextDay = new Date(selectedDay);
                      nextDay.setDate(nextDay.getDate() + 1);
                      setSelectedDay(nextDay);
                    }}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">
                      chevron_right
                    </span>
                  </button>
                  <button
                    onClick={() => setSelectedDay(new Date())}
                    className="px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors"
                  >
                    {t("date.today")}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {dayEventsForSelectedDay.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <span className="material-symbols-outlined text-3xl mb-2 block">
                      event_busy
                    </span>
                    <p className="text-sm">{t("events.noEventsScheduled")}</p>
                  </div>
                ) : (
                  dayEventsForSelectedDay.map((event) => {
                    const now = new Date();
                    const eventPlayers = eventPlayersMap[event.id] || [];
                    const hostPlayer =
                      eventPlayers.find((p) => p.id === event.organizerId) ||
                      null;
                    const [hours, minutes] = event.time.split(":");
                    const hour = parseInt(hours, 10);
                    const displayHour = hour % 12 || 12;
                    const ampm =
                      hour >= 12 ? t("date.time.pm") : t("date.time.am");

                    // Compute end time and range display
                    let endTime: string | null = null;
                    let endDisplayHour: number | null = null;
                    let endMinutesStr: string | null = null;
                    let endAmpm: string | null = null;
                    let samePeriod = false;
                    if (event.endTime) {
                      const [endHours, endMins] = event.endTime.split(":");
                      const endHour = parseInt(endHours, 10);
                      endDisplayHour = endHour % 12 || 12;
                      endMinutesStr = endMins;
                      endAmpm = endHour >= 12 ? t("date.time.pm") : t("date.time.am");
                      endTime = `${endDisplayHour}:${endMins} ${endAmpm}`;
                      samePeriod = (hour >= 12) === (endHour >= 12);
                    }

                    const isCreated = event.organizerId === user?.id;
                    const isJoined =
                      user && event.players.includes(user.id) && !isCreated;

                    // Determine if event is currently happening (same logic as happeningJoined)
                    const eventStart = new Date(`${event.date}T${event.time}`);
                    const eventEnd = event.endTime
                      ? new Date(`${event.date}T${event.endTime}`)
                      : null;
                    const isHappening =
                      eventEnd != null
                        ? eventStart <= now && eventEnd >= now
                        : eventStart <= now &&
                          eventStart >=
                            new Date(now.getTime() - 2 * 60 * 60 * 1000);

                    const isLight = theme === "light";

                    return (
                      <div
                        key={event.id}
                        onClick={() => navigate(`/event/${event.id}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            navigate(`/event/${event.id}`);
                          }
                        }}
                        className={`rounded-xl border transition-all duration-200 cursor-pointer group relative overflow-hidden p-3.5 lg:p-3
                          focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background
                          ${isHappening ? "border-l-4 border-l-emerald-500" : ""}
                          ${isHappening
                            ? isLight
                              ? "bg-emerald-50/90 border-emerald-200 hover:border-emerald-300 shadow-sm"
                              : "bg-emerald-950/40 border-emerald-500/40 hover:border-emerald-400/50"
                            : isLight
                              ? "bg-white border-slate-200/90 hover:border-primary/30 hover:shadow-md shadow-sm"
                              : "bg-surface border-white/10 hover:border-primary/30"
                          }`}
                      >
                        <div className="flex flex-col gap-2 lg:gap-1.5">
                            {/* Row 1: Title + happening badge + code + badges + sport */}
                            <div className="flex flex-wrap items-center gap-2 min-w-0">
                              <h3 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-1 truncate flex-1 min-w-0 lg:text-xs">
                                {event.title}
                              </h3>
                              {isHappening && (
                                <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-medium shrink-0 ${
                                  isLight
                                    ? "bg-emerald-500/15 text-emerald-700 border border-emerald-400/40"
                                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                                }`}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden />
                                  {t("events.filter.happening")}
                                </span>
                              )}
                              {event.code && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(event.code);
                                  }}
                                  className="inline-flex items-center gap-0.5 rounded bg-primary/15 border border-primary/40 px-1.5 py-0.5 font-semibold text-primary hover:bg-primary/25 text-[10px] lg:text-[9px] shrink-0"
                                  title={t("events.copyCode") || "Copy code"}
                                >
                                  {event.code}
                                  <span className="material-symbols-outlined text-[10px] lg:text-[8px]">content_copy</span>
                                </button>
                              )}
                              {isCreated && (
                                <Badge type="gold" className="text-[10px] px-1.5 py-0 lg:text-[9px] shrink-0">
                                  {t("events.created")}
                                </Badge>
                              )}
                              {isJoined && (
                                <Badge type="neon" className="text-[10px] px-1.5 py-0 lg:text-[9px] shrink-0">
                                  {t("events.joinedBadge")}
                                </Badge>
                              )}
                              <Badge type="primary" className="text-[10px] px-1.5 py-0 lg:text-[9px] shrink-0 ml-auto">
                                {language === "vi"
                                  ? (sports.find((s) => s.name === event.sport)?.name_vi ?? event.sport)
                                  : event.sport}
                              </Badge>
                            </div>
                            {/* Row 2: Time (below title) */}
                            <div className="inline-flex rounded-lg px-2 py-1 text-center lg:px-1.5 lg:py-0.5">
                              <span className={`text-sm font-semibold tabular-nums leading-tight lg:text-xs ${isHappening ? "text-emerald-600" : "text-primary"} ${isLight && !isHappening ? "text-amber-800" : ""}`}>
                                {endTime && samePeriod && endDisplayHour != null && endMinutesStr != null ? (
                                  <>
                                    {displayHour}:{minutes}
                                    <span className={`font-medium ${isLight ? "text-slate-600" : "text-slate-400"}`}> {ampm}</span>
                                    <span className="text-slate-500 font-normal mx-0.5">–</span>
                                    {endDisplayHour}:{endMinutesStr}
                                    <span className={`font-medium ml-0.5 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                                      {ampm}
                                    </span>
                                  </>
                                ) : endTime && !samePeriod ? (
                                  <>
                                    {displayHour}:{minutes} {ampm}
                                    <span className="text-slate-500 font-normal mx-0.5">–</span>
                                    {endDisplayHour}:{endMinutesStr} {endAmpm}
                                  </>
                                ) : (
                                  <>
                                    {displayHour}:{minutes}
                                    <span className={`font-medium ml-0.5 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                                      {ampm}
                                    </span>
                                  </>
                                )}
                              </span>
                            </div>
                            {/* Row 3: Location • Organizer (single line) */}
                            <div className={`flex flex-wrap items-center gap-x-2 gap-y-0 text-[11px] lg:text-[10px] mb-1 lg:mb-0.5 ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                              <span className="flex items-center gap-1 min-w-0 shrink">
                                <span className="material-symbols-outlined text-xs shrink-0 text-primary">location_on</span>
                                <span className="truncate">{event.location}</span>
                              </span>
                              {hostPlayer && (
                                <>
                                  <span className="text-slate-500 shrink-0">•</span>
                                  <span className="flex items-center gap-1.5 shrink-0">
                                    <Avatar
                                      src={hostPlayer.avatar || `https://i.pravatar.cc/150?u=${hostPlayer.id}`}
                                      size="h-6 w-6 lg:h-5 lg:w-5"
                                      alt={hostPlayer.firstName || "Host"}
                                      className="border-surface shrink-0"
                                    />
                                    <span className={`font-semibold ${isLight ? "text-amber-700" : "text-amber-300"}`}>{t("events.host")}</span>
                                    <span className={`truncate max-w-[80px] lg:max-w-[60px] ${isLight ? "text-slate-700" : "text-slate-200"}`}>
                                      {hostPlayer.firstName} {hostPlayer.lastName}
                                    </span>
                                  </span>
                                </>
                              )}
                            </div>
                            {/* Row 4: Price + skill + players + avatars (single line) */}
                            <div className="flex flex-wrap items-center gap-1.5">
                              {event.price && (
                                <div className={`flex items-center gap-0.5 rounded px-1.5 py-0.5 ${isLight ? "bg-green-100 border border-green-400/60" : "bg-green-500/10 border border-green-500/30"}`}>
                                  <span className={`material-symbols-outlined text-xs ${isLight ? "text-green-600" : "text-green-400"}`}>payments</span>
                                  <span className={`text-[10px] font-semibold lg:text-[9px] ${isLight ? "text-green-700" : "text-green-400"}`}>
                                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(event.price)}
                                  </span>
                                </div>
                              )}
                              {event.skillLevel && event.skillLevel !== "All" && (
                                <div className={`flex items-center gap-0.5 rounded px-1.5 py-0.5 ${isLight ? "bg-purple-100 border border-purple-400/60" : "bg-purple-500/10 border border-purple-500/30"}`}>
                                  <span className={`material-symbols-outlined text-xs ${isLight ? "text-purple-600" : "text-purple-400"}`}>trending_up</span>
                                  <span className={`text-[10px] font-semibold lg:text-[9px] ${isLight ? "text-purple-700" : "text-purple-400"}`}>
                                    {t(`events.skillLevel.${event.skillLevel.toLowerCase()}`)}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-0.5 bg-primary/10 border border-primary/20 rounded px-1.5 py-0.5">
                                <span className="material-symbols-outlined text-xs text-primary">group</span>
                                <span className="text-[10px] font-semibold text-primary lg:text-[9px]">{event.currentPlayers}/{event.maxPlayers}</span>
                              </div>
                              {eventPlayers.length > 0 && (
                                <div className="flex items-center gap-1 ml-auto">
                                  <div className="flex -space-x-2.5">
                                    {eventPlayers.slice(0, 4).map((player) => (
                                      <Avatar
                                        key={player.id}
                                        src={player.avatar || `https://i.pravatar.cc/150?u=${player.id}`}
                                        size="h-7 w-7 lg:h-6 lg:w-6"
                                        className="border-surface"
                                      />
                                    ))}
                                    {eventPlayers.length > 4 && (
                                      <div className="h-7 w-7 rounded-full bg-white/10 border-2 border-surface flex items-center justify-center text-[9px] font-bold text-slate-300 lg:h-6 lg:w-6 lg:text-[8px]">
                                        +{eventPlayers.length - 4}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            {event.description && (
                              <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 lg:text-[9px] lg:mt-0.5">
                                {event.description}
                              </p>
                            )}
                            {eventPlayers.length > 0 && (
                              <span className="sr-only">
                                {eventPlayers.length}{" "}
                                {eventPlayers.length === 1
                                  ? t("events.playerJoined")
                                  : t("events.playersJoined")}
                              </span>
                            )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Calendar - Under sport type selection */}
          {viewMode === "calendar" && showCalendar && !selectedDay && (
            <div className="px-0 pb-3 mt-3">
              {/* Calendar Navigation */}
              <div
                className="flex items-center justify-between mb-3 relative"
                ref={monthYearPickerRef}
              >
                <button
                  onClick={() => navigateMonth("prev")}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">
                    chevron_left
                  </span>
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowMonthYearPicker(!showMonthYearPicker)}
                    className="text-base font-bold hover:text-primary transition-colors flex items-center gap-1"
                  >
                    {monthNames[currentMonth.getMonth()]}{" "}
                    {currentMonth.getFullYear()}
                    <span className="material-symbols-outlined text-sm">
                      arrow_drop_down
                    </span>
                  </button>
                  <button
                    onClick={goToToday}
                    className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors"
                  >
                    {t("date.today")}
                  </button>
                </div>
                <button
                  onClick={() => navigateMonth("next")}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">
                    chevron_right
                  </span>
                </button>

                {/* Month/Year Picker Dropdown */}
                {showMonthYearPicker && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-surface border border-white/10 rounded-xl shadow-2xl p-4 min-w-[280px] max-h-[400px] overflow-y-auto">
                    <div className="mb-4">
                      <h3 className="text-sm font-bold text-slate-300 mb-2">
                        Select Year
                      </h3>
                      <div className="grid grid-cols-4 gap-2">
                        {getYearRange().map((year) => (
                          <button
                            key={year}
                            onClick={() => selectYear(year)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              currentMonth.getFullYear() === year
                                ? "bg-primary text-white"
                                : "bg-surface-light/50 text-slate-300 hover:bg-white/10"
                            }`}
                          >
                            {year}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-300 mb-2">
                        Select Month
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        {monthNames.map((month, index) => (
                          <button
                            key={index}
                            onClick={() => selectMonth(index)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              currentMonth.getMonth() === index
                                ? "bg-primary text-white"
                                : "bg-surface-light/50 text-slate-300 hover:bg-white/10"
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
                {dayNames.map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs lg:text-[10px] xl:text-[10px] font-bold text-slate-400 py-2 lg:py-1.5 xl:py-1"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days Grid */}
              <div
                className="grid grid-cols-7 gap-1"
                key={`calendar-${selectedFilter}`}
              >
                {calendarDays.map((date, index) => {
                  const dayEvents = getEventsForDate(date);
                  const isTodayDate = isToday(date);

                  return (
                    <div
                      key={index}
                      className={`border border-white/5 rounded-lg p-1 ${
                        date
                          ? "bg-surface/50 hover:bg-surface transition-colors cursor-pointer"
                          : "bg-transparent"
                      } ${
                        isTodayDate
                          ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
                          : ""
                      }`}
                      style={{
                        minHeight:
                          date && dayEvents.length > 0
                            ? 40 + Math.min(dayEvents.length, 3) * 14
                            : 60,
                      }}
                      onClick={() => date && setSelectedDay(date)}
                    >
                      {date && (
                        <>
                          <div
                            className={`text-[10px] font-bold mb-0.5 ${
                              isTodayDate
                                ? "text-primary"
                                : date.getMonth() === currentMonth.getMonth()
                                  ? "text-white"
                                  : "text-slate-500"
                            }`}
                          >
                            {date.getDate()}
                          </div>
                          <div className="space-y-0.5">
                            {dayEvents.slice(0, 3).map((event) => {
                              return (
                                <div
                                  key={event.id}
                                  className="bg-primary/20 border-primary/30 border rounded px-1 py-0.5 text-[9px] font-medium truncate text-primary"
                                  title={event.title}
                                >
                                  <span className="truncate">
                                    {event.title}
                                  </span>
                                </div>
                              );
                            })}
                            {dayEvents.length > 3 && (
                              <div className="bg-primary/10 border border-dashed border-primary/40 rounded px-1 py-0.5 text-[7px] font-medium text-primary/80 flex items-center justify-center">
                                +{dayEvents.length - 3}
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
    </div>
  );
};

export const MyEvents: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    events,
    getUserPendingRequest,
    getUserInvitations,
    getEvent,
    getEventRequests,
    approveRequest,
    denyRequest,
  } = useEvents();
  useMessages();
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const [eventPlayersMap, setEventPlayersMap] = useState<
    Record<string, User[]>
  >({});
  const [activeTab, setActiveTab] = useState<
    | "upcoming-joined"
    | "happening"
    | "past-joined"
    | "created"
    | "invited"
    | "requested"
  >("upcoming-joined");
  const [createdFilter, setCreatedFilter] = useState<
    "all" | "upcoming" | "happening" | "past"
  >("all");
  const [upcomingFilter, setUpcomingFilter] = useState<
    "all" | "created" | "joined"
  >("all");
  const [pastFilter, setPastFilter] = useState<"all" | "created" | "joined">(
    "all",
  );
  const [requestedFilter, setRequestedFilter] = useState<"my" | "other">("my");
  const [invitations, setInvitations] = useState<EventRequest[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(true);
  const [otherRequests, setOtherRequests] = useState<
    Array<{ event: Event; request: EventRequest; requester: User }>
  >([]);
  const [loadingOtherRequests, setLoadingOtherRequests] = useState(true);
  const [selectedSportFilter, setSelectedSportFilter] = useState<string>("");
  const [sports, setSports] = useState<Sport[]>([]);
  const [sportsLoading, setSportsLoading] = useState(true);

  // Separate events into three categories
  // Use all events, not just myEvents, to ensure we catch all created events
  // Memoize these to prevent infinite loops
  const createdEvents = useMemo(
    () => events.filter((e) => e.organizerId === user?.id),
    [events, user?.id],
  );

  const joinedEvents = useMemo(
    () =>
      events.filter(
        (e) => e.organizerId !== user?.id && e.players.includes(user?.id || ""),
      ),
    [events, user?.id],
  );

  // Requested events: events that user requested to join but haven't been accepted yet
  // Note: We check for pending requests using the event_requests table via getUserPendingRequest
  const [requestedEventIds, setRequestedEventIds] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    const loadRequestedEvents = async () => {
      if (!user) {
        setRequestedEventIds(new Set());
        return;
      }

      const requestedIds = new Set<string>();
      for (const event of events) {
        if (
          event.organizerId !== user.id &&
          !event.players.includes(user.id) &&
          event.status === "open"
        ) {
          try {
            const pendingRequest = await getUserPendingRequest(event.id);
            if (pendingRequest) {
              requestedIds.add(event.id);
            }
          } catch (error) {
            console.error(
              `Error checking request for event ${event.id}:`,
              error,
            );
          }
        }
      }
      setRequestedEventIds(requestedIds);
    };

    loadRequestedEvents();
  }, [events, user, getUserPendingRequest]);

  const requestedEvents = useMemo(
    () =>
      events.filter(
        (e) =>
          e.organizerId !== user?.id &&
          !e.players.includes(user?.id || "") &&
          requestedEventIds.has(e.id) &&
          e.status === "open",
      ),
    [events, user?.id, requestedEventIds],
  );

  // Get upcoming events (future dates) and past events separately
  // Memoize these to prevent infinite loops in useEffect
  const now = useMemo(() => new Date(), []);

  const upcomingCreated = useMemo(() => {
    return createdEvents
      .filter((e) => {
        // Filter by sport if selected
        if (selectedSportFilter && e.sport !== selectedSportFilter)
          return false;
        const eventDate = new Date(`${e.date}T${e.time}`);
        return eventDate >= now;
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });
  }, [createdEvents, now, selectedSportFilter]);

  const pastCreated = useMemo(() => {
    return createdEvents
      .filter((e) => {
        // Filter by sport if selected
        if (selectedSportFilter && e.sport !== selectedSportFilter)
          return false;
        const start = new Date(`${e.date}T${e.time}`);
        const end = e.endTime ? new Date(`${e.date}T${e.endTime}`) : null;
        // Past created events should be fully finished (not currently happening)
        if (end) {
          return end < now;
        }
        // For events without end time, treat as past only if clearly before now
        return start < new Date(now.getTime() - 2 * 60 * 60 * 1000);
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateB.getTime() - dateA.getTime();
      });
  }, [createdEvents, now, selectedSportFilter]);

  const upcomingJoined = useMemo(() => {
    // Include both joined events and created events (owner is also a participant)
    const allUpcomingEvents = [...joinedEvents, ...createdEvents]
      .filter((e) => {
        // Filter by sport if selected
        if (selectedSportFilter && e.sport !== selectedSportFilter)
          return false;
        const start = new Date(`${e.date}T${e.time}`);
        const end = e.endTime ? new Date(`${e.date}T${e.endTime}`) : null;
        // Upcoming = starts in the future (not yet started)
        return start > now && (!end || end > now);
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });

    // Remove duplicates (in case an event appears in both arrays)
    const uniqueEvents = Array.from(
      new Map(allUpcomingEvents.map((e) => [e.id, e])).values(),
    );

    return uniqueEvents;
  }, [joinedEvents, createdEvents, now, selectedSportFilter]);

  // Events currently happening (now is between start and end, or after start when no endTime)
  const happeningJoined = useMemo(() => {
    const allHappeningEvents = [...joinedEvents, ...createdEvents]
      .filter((e) => {
        if (selectedSportFilter && e.sport !== selectedSportFilter)
          return false;
        const start = new Date(`${e.date}T${e.time}`);
        const end = e.endTime ? new Date(`${e.date}T${e.endTime}`) : null;
        if (end) {
          return start <= now && end >= now;
        }
        return (
          start <= now && start >= new Date(now.getTime() - 2 * 60 * 60 * 1000)
        ); // heuristic window for events without endTime
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });

    const uniqueEvents = Array.from(
      new Map(allHappeningEvents.map((e) => [e.id, e])).values(),
    );

    return uniqueEvents;
  }, [joinedEvents, createdEvents, now, selectedSportFilter]);

  const pastJoined = useMemo(() => {
    // Include both past joined events and past created events (owner is also a participant)
    const allPastEvents = [...joinedEvents, ...createdEvents]
      .filter((e) => {
        // Filter by sport if selected
        if (selectedSportFilter && e.sport !== selectedSportFilter)
          return false;
        const start = new Date(`${e.date}T${e.time}`);
        const end = e.endTime ? new Date(`${e.date}T${e.endTime}`) : null;
        // Past = event fully finished, not happening now or in future
        if (end) {
          return end < now;
        }
        // For events without end time, treat as past only if clearly before now
        return start < new Date(now.getTime() - 2 * 60 * 60 * 1000);
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateB.getTime() - dateA.getTime();
      });

    // Remove duplicates (in case an event appears in both arrays)
    const uniqueEvents = Array.from(
      new Map(allPastEvents.map((e) => [e.id, e])).values(),
    );

    return uniqueEvents;
  }, [joinedEvents, createdEvents, now, selectedSportFilter]);

  const upcomingRequested = useMemo(() => {
    return requestedEvents
      .filter((e) => {
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

      const allEvents = [
        ...upcomingCreated,
        ...pastCreated,
        ...upcomingJoined,
        ...pastJoined,
        ...upcomingRequested,
        ...happeningJoined,
        ...otherRequests.map((r) => r.event),
      ];

      allEvents.forEach((event) => {
        // Add organizer as a player if not already in the list
        if (event.organizerId && !event.players.includes(event.organizerId)) {
          allPlayerIds.add(event.organizerId);
        }
        event.players.forEach((playerId) => allPlayerIds.add(playerId));
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

      const players = (await Promise.all(playerPromises)).filter(
        (p): p is User => p !== null,
      );
      const playersById = new Map(players.map((p) => [p.id, p]));

      allEvents.forEach((event) => {
        map[event.id] = event.players
          .map((playerId) => playersById.get(playerId))
          .filter((p): p is User => p !== undefined);
      });

      setEventPlayersMap(map);
    };

    if (
      upcomingCreated.length > 0 ||
      pastCreated.length > 0 ||
      upcomingJoined.length > 0 ||
      pastJoined.length > 0 ||
      upcomingRequested.length > 0 ||
      happeningJoined.length > 0 ||
      otherRequests.length > 0
    ) {
      loadEventPlayers();
    }
  }, [
    upcomingCreated,
    pastCreated,
    upcomingJoined,
    pastJoined,
    upcomingRequested,
    happeningJoined,
    otherRequests,
  ]);

  const formatEventTime = (date: string, time: string, endTime?: string) => {
    const eventDate = new Date(`${date}T${time}`);
    const now = new Date();
    const diff = eventDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    const formatTimeForEvent = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(":");
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? t("date.time.pm") : t("date.time.am");
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    };

    const timeStr = endTime
      ? `${formatTimeForEvent(time)} - ${formatTimeForEvent(endTime)}`
      : formatTimeForEvent(time);
    const dayNames = [
      t("date.days.sunday"),
      t("date.days.monday"),
      t("date.days.tuesday"),
      t("date.days.wednesday"),
      t("date.days.thursday"),
      t("date.days.friday"),
      t("date.days.saturday"),
    ];
    const dayName = dayNames[eventDate.getDay()];

    if (days === 0) return `${t("date.today")} (${dayName}), ${timeStr}`;
    if (days === 1) return `${t("date.tomorrow")} (${dayName}), ${timeStr}`;
    const dateObj = new Date(date);
    const monthNames = [
      t("date.months.january"),
      t("date.months.february"),
      t("date.months.march"),
      t("date.months.april"),
      t("date.months.may"),
      t("date.months.june"),
      t("date.months.july"),
      t("date.months.august"),
      t("date.months.september"),
      t("date.months.october"),
      t("date.months.november"),
      t("date.months.december"),
    ];
    const monthName = monthNames[dateObj.getMonth()];
    return `${dayName}, ${dateObj.getDate()} ${monthName}, ${timeStr}`;
  };

  // Load sports
  useEffect(() => {
    const loadSports = async () => {
      try {
        const sportsData = await sportsService.getAllSports();
        setSports(sportsData);
      } catch (err) {
        console.error("Error loading sports:", err);
      } finally {
        setSportsLoading(false);
      }
    };

    loadSports();
  }, []);

  // Load saved sport filter (synced with Home)
  useEffect(() => {
    if (user?.id) {
      settingsService.getSportFilter(user.id).then((saved) => {
        setSelectedSportFilter(saved ?? "");
      });
    } else {
      const saved = localStorage.getItem("teamup_sport_filter");
      setSelectedSportFilter(saved ?? "");
    }
  }, [user?.id]);

  // Persist sport filter when it changes (synced with Home)
  const handleMyEventsSportFilterChange = useCallback(
    (value: string) => {
      setSelectedSportFilter(value);
      if (user?.id) {
        settingsService.saveSportFilter(user.id, value).catch((err) =>
          console.error("Failed to save sport filter:", err),
        );
      } else {
        localStorage.setItem("teamup_sport_filter", value);
      }
    },
    [user?.id],
  );

  // Load invitations
  useEffect(() => {
    const loadInvitations = async () => {
      if (!user) {
        setInvitations([]);
        setLoadingInvitations(false);
        return;
      }

      try {
        const invs = await getUserInvitations();
        setInvitations(invs);
      } catch (error) {
        console.error("Error loading invitations:", error);
        setInvitations([]);
      } finally {
        setLoadingInvitations(false);
      }
    };

    loadInvitations();
  }, [user, getUserInvitations]);

  // Load requests from other people (requests to join events the user created)
  useEffect(() => {
    const loadOtherRequests = async () => {
      if (!user) {
        setOtherRequests([]);
        setLoadingOtherRequests(false);
        return;
      }

      try {
        const userCreatedEvents = events.filter(
          (e) => e.organizerId === user.id,
        );
        const allRequests: Array<{
          event: Event;
          request: EventRequest;
          requester: User;
        }> = [];

        for (const event of userCreatedEvents) {
          try {
            const requests = await getEventRequests(event.id);
            for (const request of requests) {
              if (request.status === "pending") {
                try {
                  const requester = await userService.getUserProfile(
                    request.userId,
                  );
                  if (requester) {
                    allRequests.push({ event, request, requester });
                  }
                } catch (error) {
                  console.error(
                    `Error loading requester ${request.userId}:`,
                    error,
                  );
                }
              }
            }
          } catch (error) {
            console.error(
              `Error loading requests for event ${event.id}:`,
              error,
            );
          }
        }

        // Sort by request creation date (newest first)
        allRequests.sort(
          (a, b) =>
            new Date(b.request.createdAt).getTime() -
            new Date(a.request.createdAt).getTime(),
        );

        setOtherRequests(allRequests);
      } catch (error) {
        console.error("Error loading other requests:", error);
        setOtherRequests([]);
      } finally {
        setLoadingOtherRequests(false);
      }
    };

    loadOtherRequests();
  }, [user, events, getEventRequests]);

  // Get invited events from invitations
  const invitedEvents = useMemo(() => {
    return invitations
      .map((inv) => getEvent(inv.eventId))
      .filter((e): e is Event => e !== undefined)
      .filter((e) => {
        // If the user has already joined this event, don't show it as an invitation
        if (user && e.players.includes(user.id)) {
          return false;
        }
        // Filter by sport if selected
        if (selectedSportFilter && e.sport !== selectedSportFilter)
          return false;
        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });
  }, [invitations, getEvent, selectedSportFilter, user]);

  // Group other requests by event ID
  const groupedOtherRequests = useMemo(() => {
    const grouped = new Map<
      string,
      Array<{ event: Event; request: EventRequest; requester: User }>
    >();

    otherRequests.forEach((item) => {
      const eventId = item.event.id;
      if (!grouped.has(eventId)) {
        grouped.set(eventId, []);
      }
      grouped.get(eventId)!.push(item);
    });

    return Array.from(grouped.values());
  }, [otherRequests]);

  // Unified Event Card Component
  const EventCard: React.FC<{
    event: Event;
    variant?: "default" | "past" | "created" | "invited" | "requested";
    onClick?: () => void;
    showActions?: boolean;
  }> = ({ event, variant = "default", onClick, showActions = true }) => {
    const eventPlayers = eventPlayersMap[event.id] || [];
    const spotsLeft = event.maxPlayers - event.currentPlayers;
    const isPast = variant === "past";
    // Check if event is created by user (either from variant or by checking organizerId)
    const isCreated = variant === "created" || event.organizerId === user?.id;
    const isInvited =
      variant === "invited" && !(user && event.players.includes(user.id));
    const isRequested =
      variant === "requested" || requestedEventIds.has(event.id);
    const isLight = theme === "light";

    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick?.();
          }
        }}
        className={`rounded-xl border transition-all duration-200 cursor-pointer group relative overflow-hidden p-3.5 lg:p-3
          focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background
          ${isPast
            ? "opacity-60 border-white/5 bg-surface"
            : isInvited
              ? "border-yellow-500/20 hover:border-yellow-500/40 bg-surface"
              : isLight
                ? "bg-white border-slate-200/90 hover:border-primary/30 hover:shadow-md shadow-sm"
                : "bg-surface border-white/10 hover:border-primary/30"
          }`}
      >
        {/* Settings Button - Top Right */}
        {showActions && !isPast && isCreated && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/event/manage/${event.id}`);
            }}
            className="absolute top-2 right-2 w-7 h-7 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors z-10 lg:top-1.5 lg:right-1.5 lg:w-6 lg:h-6"
          >
            <span className="material-symbols-outlined text-sm lg:text-xs">
              settings
            </span>
          </button>
        )}
        <div className="flex gap-3 lg:gap-2">
          {/* Event Image/Icon */}
          <div className="shrink-0 relative">
            {/* Hidden badge to set container width */}
            <div className="invisible">
              <Badge>
                {language === "vi"
                  ? (sports.find((s) => s.name === event.sport)?.name_vi ?? event.sport)
                  : event.sport}
              </Badge>
            </div>
            {/* Image - matches badge width */}
            <div
              className="absolute top-0 left-0 w-full rounded-lg bg-cover bg-center flex items-center justify-center overflow-hidden"
              style={{
                aspectRatio: "1 / 1",
                backgroundImage: event.image
                  ? `url(${event.image})`
                  : `url(https://i.pravatar.cc/150?u=${event.organizerId})`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            </div>
            {/* Sport Badge Overlay - top left corner */}
            <div className="absolute top-0 left-0 z-10">
              <Badge>
                {language === "vi"
                  ? (sports.find((s) => s.name === event.sport)?.name_vi ?? event.sport)
                  : event.sport}
              </Badge>
            </div>
          </div>

          {/* Event Details */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div
              className={`flex justify-between items-start mb-1.5 ${
                showActions && !isPast && isCreated ? "pr-10" : ""
              }`}
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm mb-0.5 group-hover:text-primary transition-colors line-clamp-1 lg:text-xs lg:mb-0">
                  {event.title}
                </h3>
                <div className="flex items-center gap-1.5 flex-wrap lg:gap-1">
                  {isCreated && (
                    <Badge type="gold">{t("events.created")}</Badge>
                  )}
                  {isInvited && (
                    <Badge type="neon">{t("events.invited")}</Badge>
                  )}
                  {isRequested && !isInvited && (
                    <Badge type="slate">
                      {t("events.requested") || "Đã yêu cầu"}
                    </Badge>
                  )}
                  {!isCreated && !isInvited && !isRequested && (
                    <Badge type="neon">{t("events.joinedBadge")}</Badge>
                  )}
                  {spotsLeft > 0 && !isPast && (
                    <span className="text-[10px] text-slate-400 lg:text-[9px]">
                      {spotsLeft}{" "}
                      {spotsLeft !== 1
                        ? t("events.spotsLeft")
                        : t("events.spotLeft")}
                    </span>
                  )}
                </div>
              </div>
              {isCreated && (
                <div className="text-right shrink-0 ml-2 lg:ml-1">
                  <div className="text-xs font-bold text-primary lg:text-[11px]">
                    {event.currentPlayers}/{event.maxPlayers}
                  </div>
                  <div className="text-[10px] text-slate-400 lg:text-[9px]">
                    {t("events.players")}
                  </div>
                </div>
              )}
            </div>

            {/* Event Info */}
            <div className="space-y-1 text-xs lg:space-y-0.5 lg:text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="material-symbols-outlined text-primary text-sm shrink-0">
                  event
                </span>
                <span className="truncate">
                  {formatEventTime(event.date, event.time, event.endTime)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="material-symbols-outlined text-primary text-sm shrink-0">
                  location_on
                </span>
                <span className="truncate">{event.location}</span>
              </div>
              {event.price && (
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="material-symbols-outlined text-primary text-sm shrink-0">
                    payments
                  </span>
                  <span>
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(event.price)}
                  </span>
                </div>
              )}
            </div>

            {/* Players Preview (for joined events) */}
            {!isCreated && eventPlayers.length > 0 && (
              <div className="mt-2 flex items-center gap-1.5">
                <div className="flex -space-x-1.5">
                  {eventPlayers.slice(0, 4).map((player) => (
                    <Avatar
                      key={player.id}
                      src={
                        player.avatar ||
                        `https://i.pravatar.cc/150?u=${player.id}`
                      }
                      size="h-5 w-5"
                      className="border-2 border-surface"
                    />
                  ))}
                  {eventPlayers.length > 4 && (
                    <div className="h-5 w-5 rounded-full bg-white/10 border-2 border-surface flex items-center justify-center text-[9px] font-bold">
                      +{eventPlayers.length - 4}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-400">
                  {eventPlayers.length}{" "}
                  {eventPlayers.length !== 1
                    ? t("events.players")
                    : t("events.player")}
                </span>
              </div>
            )}

            {/* Actions */}
            {showActions && !isPast && !isCreated && (
              <div className="mt-2 flex gap-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/event/${event.id}`);
                  }}
                  className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary h-7 rounded-lg text-[10px] font-bold transition-colors"
                >
                  {t("events.viewDetails")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render events based on active tab
  const renderEvents = () => {
    switch (activeTab) {
      case "upcoming-joined":
        // Filter events based on selected filter
        const filteredUpcoming = upcomingJoined.filter((event) => {
          const isCreated = event.organizerId === user?.id;
          if (upcomingFilter === "created") return isCreated;
          if (upcomingFilter === "joined") return !isCreated;
          return true; // "all"
        });

        return (
          <>
            {/* Filter Buttons */}
            <div className="flex gap-1.5 mb-3 items-center">
              <button
                onClick={() => setUpcomingFilter("all")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  upcomingFilter === "all"
                    ? "bg-primary text-white"
                    : "bg-white/5 text-slate-400 hover:bg-white/10"
                }`}
              >
                {t("events.filter.all")}
              </button>
              <button
                onClick={() => setUpcomingFilter("created")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  upcomingFilter === "created"
                    ? "bg-primary text-white"
                    : "bg-white/5 text-slate-400 hover:bg-white/10"
                }`}
              >
                {t("events.filter.created")}
              </button>
              <button
                onClick={() => setUpcomingFilter("joined")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  upcomingFilter === "joined"
                    ? "bg-primary text-white"
                    : "bg-white/5 text-slate-400 hover:bg-white/10"
                }`}
              >
                {t("events.filter.joined")}
              </button>
            </div>

            {/* Events List */}
            {filteredUpcoming.length > 0 ? (
              <div className="space-y-2">
                {filteredUpcoming.map((event) => {
                  const isCreated = event.organizerId === user?.id;
                  return (
                    <EventCard
                      key={event.id}
                      event={event}
                      variant={isCreated ? "created" : "default"}
                      onClick={() =>
                        navigate(
                          isCreated
                            ? `/event/manage/${event.id}`
                            : `/event/${event.id}`,
                        )
                      }
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400">
                <span className="material-symbols-outlined text-6xl mb-4 block opacity-50">
                  event_available
                </span>
                <p className="text-lg font-medium mb-1">
                  {t("events.noUpcoming")}
                </p>
                <p className="text-sm">
                  {upcomingFilter === "created"
                    ? t("events.noUpcomingCreated")
                    : upcomingFilter === "joined"
                      ? t("events.noUpcomingJoined")
                      : t("events.joinFromHome")}
                </p>
              </div>
            )}
          </>
        );

      case "happening":
        return (
          <>
            {happeningJoined.length > 0 ? (
              <div className="space-y-2">
                {happeningJoined.map((event) => {
                  const isCreated = event.organizerId === user?.id;
                  return (
                    <EventCard
                      key={event.id}
                      event={event}
                      variant={isCreated ? "created" : "default"}
                      onClick={() =>
                        navigate(
                          isCreated
                            ? `/event/manage/${event.id}`
                            : `/event/${event.id}`,
                        )
                      }
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400">
                <span className="material-symbols-outlined text-6xl mb-4 block opacity-50">
                  event_available
                </span>
                <p className="text-lg font-medium mb-1">
                  {t("events.noUpcoming")}
                </p>
                <p className="text-sm">{t("events.joinFromHome")}</p>
              </div>
            )}
          </>
        );

      case "past-joined":
        // Filter events based on selected filter
        const filteredPast = pastJoined.filter((event) => {
          const isCreated = event.organizerId === user?.id;
          if (pastFilter === "created") return isCreated;
          if (pastFilter === "joined") return !isCreated;
          return true; // "all"
        });

        return (
          <>
            {/* Filter Buttons */}
            <div className="flex gap-1.5 mb-3 items-center">
              <button
                onClick={() => setPastFilter("all")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  pastFilter === "all"
                    ? "bg-primary text-white"
                    : "bg-white/5 text-slate-400 hover:bg-white/10"
                }`}
              >
                {t("events.filter.all")}
              </button>
              <button
                onClick={() => setPastFilter("created")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  pastFilter === "created"
                    ? "bg-primary text-white"
                    : "bg-white/5 text-slate-400 hover:bg-white/10"
                }`}
              >
                {t("events.filter.created")}
              </button>
              <button
                onClick={() => setPastFilter("joined")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  pastFilter === "joined"
                    ? "bg-primary text-white"
                    : "bg-white/5 text-slate-400 hover:bg-white/10"
                }`}
              >
                {t("events.filter.joined")}
              </button>
            </div>

            {/* Events List */}
            {filteredPast.length > 0 ? (
              <div className="space-y-2">
                {filteredPast.map((event) => {
                  const isCreated = event.organizerId === user?.id;
                  return (
                    <EventCard
                      key={event.id}
                      event={event}
                      variant="past"
                      onClick={() =>
                        navigate(
                          isCreated
                            ? `/event/manage/${event.id}`
                            : `/event/${event.id}`,
                        )
                      }
                      showActions={false}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400">
                <span className="material-symbols-outlined text-6xl mb-4 block opacity-50">
                  history
                </span>
                <p className="text-lg font-medium mb-1">{t("events.noPast")}</p>
                <p className="text-sm">
                  {pastFilter === "created"
                    ? t("events.noPastCreated")
                    : pastFilter === "joined"
                      ? t("events.noPastJoined")
                      : t("events.pastHistory")}
                </p>
              </div>
            )}
          </>
        );

      case "created":
        // Filter events based on selected filter
        const filteredCreated = (() => {
          if (createdFilter === "upcoming") return upcomingCreated;
          if (createdFilter === "happening") return happeningJoined;
          if (createdFilter === "past") return pastCreated;
          return [...upcomingCreated, ...happeningJoined, ...pastCreated]; // "all"
        })();

        return (
          <>
            {/* Filter Buttons */}
            <div className="flex gap-1.5 mb-3">
              <button
                onClick={() => setCreatedFilter("all")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  createdFilter === "all"
                    ? "bg-primary text-white"
                    : "bg-white/5 text-slate-400 hover:bg-white/10"
                }`}
              >
                {t("events.filter.all")}
                {upcomingCreated.length + pastCreated.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
                    {upcomingCreated.length + pastCreated.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setCreatedFilter("upcoming")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  createdFilter === "upcoming"
                    ? "bg-primary text-white"
                    : "bg-white/5 text-slate-400 hover:bg-white/10"
                }`}
              >
                {t("events.filter.upcoming")}
                {upcomingCreated.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
                    {upcomingCreated.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setCreatedFilter("happening")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  createdFilter === "happening"
                    ? "bg-primary text-white"
                    : "bg-white/5 text-slate-400 hover:bg-white/10"
                } flex items-center gap-1.5`}
              >
                <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.25)]" />
                {t("events.filter.happening")}
                {happeningJoined.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
                    {happeningJoined.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setCreatedFilter("past")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  createdFilter === "past"
                    ? "bg-primary text-white"
                    : "bg-white/5 text-slate-400 hover:bg-white/10"
                }`}
              >
                {t("events.filter.past")}
                {pastCreated.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
                    {pastCreated.length}
                  </span>
                )}
              </button>
            </div>

            {/* Events List */}
            {filteredCreated.length > 0 ? (
              <div className="space-y-2">
                {filteredCreated.map((event) => {
                  const now = new Date();
                  const start = new Date(`${event.date}T${event.time}`);
                  const end = event.endTime
                    ? new Date(`${event.date}T${event.endTime}`)
                    : null;
                  // An event is considered past only if it has fully finished
                  const isPast = end
                    ? end < now
                    : start < new Date(now.getTime() - 2 * 60 * 60 * 1000);
                  return (
                    <EventCard
                      key={event.id}
                      event={event}
                      variant={isPast ? "past" : "created"}
                      onClick={() => navigate(`/event/manage/${event.id}`)}
                      showActions={!isPast}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400">
                <span className="material-symbols-outlined text-6xl mb-4 block opacity-50">
                  {createdFilter === "upcoming"
                    ? "event_available"
                    : createdFilter === "happening"
                      ? "schedule"
                      : createdFilter === "past"
                        ? "history"
                        : "add_circle_outline"}
                </span>
                <p className="text-lg font-medium mb-1">
                  {createdFilter === "upcoming"
                    ? t("events.noUpcoming")
                    : createdFilter === "happening"
                      ? t("events.noUpcoming")
                      : createdFilter === "past"
                        ? t("events.noPast")
                        : t("events.noCreatedYet")}
                </p>
                <p className="text-sm">
                  {createdFilter === "upcoming"
                    ? t("events.noUpcomingCreatedYet")
                    : createdFilter === "happening"
                      ? t("events.noUpcomingCreatedYet")
                      : createdFilter === "past"
                        ? t("events.pastCreatedAppear")
                        : t("events.createFirstEvent")}
                </p>
                {createdFilter !== "past" && (
                  <button
                    onClick={() => navigate("/event/create")}
                    className="mt-4 px-6 py-2 bg-primary hover:bg-primary-hover rounded-lg font-bold text-sm transition-colors"
                  >
                    {t("events.create")}
                  </button>
                )}
              </div>
            )}
          </>
        );

      case "invited":
        return loadingInvitations ? (
          <div className="text-center py-16 text-slate-400">
            <span className="material-symbols-outlined text-6xl mb-4 block opacity-50 animate-pulse">
              hourglass_empty
            </span>
            <p className="text-lg font-medium">
              {t("events.loadingInvitations")}
            </p>
          </div>
        ) : invitedEvents.length > 0 ? (
          <div className="space-y-2">
            {invitedEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                variant="invited"
                onClick={() => navigate(`/event/${event.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-slate-400">
            <span className="material-symbols-outlined text-6xl mb-4 block opacity-50">
              mail_outline
            </span>
            <p className="text-lg font-medium mb-1">
              {t("events.noInvitations")}
            </p>
            <p className="text-sm">{t("events.invitationsHint")}</p>
          </div>
        );

      case "requested":
        // Filter buttons
        const myRequestsCount = upcomingRequested.length;
        const otherRequestsCount = otherRequests.length;

        return (
          <>
            {/* Filter Buttons */}
            <div className="flex gap-1.5 mb-3 items-center">
              <button
                onClick={() => setRequestedFilter("my")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  requestedFilter === "my"
                    ? "bg-primary text-white"
                    : "bg-white/5 text-slate-400 hover:bg-white/10"
                }`}
              >
                {t("events.filter.myRequests") || "Yêu cầu của tôi"}
                {myRequestsCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
                    {myRequestsCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setRequestedFilter("other")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  requestedFilter === "other"
                    ? "bg-primary text-white"
                    : "bg-white/5 text-slate-400 hover:bg-white/10"
                }`}
              >
                {t("events.filter.otherRequests") || "Yêu cầu từ người khác"}
                {otherRequestsCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
                    {otherRequestsCount}
                  </span>
                )}
              </button>
            </div>

            {/* My Requests */}
            {requestedFilter === "my" && (
              <>
                {upcomingRequested.length > 0 ? (
                  <div className="space-y-2">
                    {upcomingRequested.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        variant="requested"
                        onClick={() => navigate(`/event/${event.id}`)}
                        showActions={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 text-slate-400">
                    <span className="material-symbols-outlined text-6xl mb-4 block opacity-50">
                      pending
                    </span>
                    <p className="text-lg font-medium mb-1">
                      {t("events.noMyJoinRequests") ||
                        "Không có yêu cầu của bạn"}
                    </p>
                    <p className="text-sm">
                      {t("events.myJoinRequestsHint") ||
                        "Các sự kiện bạn đã yêu cầu tham gia sẽ xuất hiện ở đây"}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Other Requests */}
            {requestedFilter === "other" && (
              <>
                {loadingOtherRequests ? (
                  <div className="text-center py-16 text-slate-400">
                    <span className="material-symbols-outlined text-6xl mb-4 block opacity-50 animate-pulse">
                      hourglass_empty
                    </span>
                    <p className="text-lg font-medium">{t("common.loading")}</p>
                  </div>
                ) : groupedOtherRequests.length > 0 ? (
                  <div className="space-y-2">
                    {groupedOtherRequests.map((requestsForEvent) => {
                      const { event } = requestsForEvent[0];
                      const requestCount = requestsForEvent.length;

                      return (
                        <div
                          key={event.id}
                          className="bg-surface rounded-xl p-3 border border-white/5 hover:border-primary/30 transition-all lg:rounded-lg lg:p-2"
                        >
                          <div className="flex gap-3 lg:gap-2">
                            {/* Event Image/Icon */}
                            <div className="shrink-0 relative w-20 h-20 lg:w-16 lg:h-16">
                              <div
                                className="absolute inset-0 rounded-lg bg-cover bg-center overflow-hidden"
                                style={{
                                  backgroundImage: event.image
                                    ? `url(${event.image})`
                                    : `url(https://i.pravatar.cc/150?u=${event.organizerId})`,
                                }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                              </div>
                            </div>

                            {/* Event Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-2 mb-1.5">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-0.5 lg:mb-0">
                                    <h3 className="font-bold text-sm line-clamp-1 lg:text-xs">
                                      {event.title}
                                    </h3>
                                    <Badge className="shrink-0">
                                      {language === "vi"
                                        ? (sports.find((s) => s.name === event.sport)?.name_vi ?? event.sport)
                                        : event.sport}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-wrap lg:gap-1">
                                    <Badge type="gold">
                                      {t("events.created")}
                                    </Badge>
                                    <span className="text-[10px] text-slate-400 lg:text-[9px]">
                                      {formatEventTime(event.date, event.time)}
                                    </span>
                                    {requestCount > 1 && (
                                      <Badge
                                        type="slate"
                                        className="text-[9px]"
                                      >
                                        {requestCount}{" "}
                                        {t("events.requests") || "yêu cầu"}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Requesters List */}
                              <div className="space-y-1.5">
                                {requestsForEvent.map(
                                  ({ request, requester }) => (
                                    <div
                                      key={request.id}
                                      className="p-1.5 bg-white/5 rounded-lg border border-white/10"
                                    >
                                      <div className="flex items-center gap-1.5 mb-1">
                                        <Avatar
                                          src={
                                            requester.avatar ||
                                            `https://i.pravatar.cc/150?u=${requester.id}`
                                          }
                                          size="w-7 h-7"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <p className="font-bold text-[11px]">
                                            {requester.firstName}{" "}
                                            {requester.lastName}
                                          </p>
                                          <p className="text-[9px] text-slate-400">
                                            {requester.userId}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex gap-1">
                                        <button
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            try {
                                              await approveRequest(
                                                event.id,
                                                request.userId,
                                              );
                                              // Reload requests
                                              setOtherRequests((prev) =>
                                                prev.filter(
                                                  (r) =>
                                                    r.request.id !== request.id,
                                                ),
                                              );
                                            } catch (error: any) {
                                              console.error(
                                                "Error approving request:",
                                                error,
                                              );
                                              alert(
                                                error.message ||
                                                  t("events.failedToApprove"),
                                              );
                                            }
                                          }}
                                          className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 h-6 rounded text-[9px] font-bold transition-colors border border-green-500/30 px-1.5"
                                        >
                                          {t("events.approve")}
                                        </button>
                                        <button
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            try {
                                              await denyRequest(
                                                event.id,
                                                request.userId,
                                              );
                                              // Reload requests
                                              setOtherRequests((prev) =>
                                                prev.filter(
                                                  (r) =>
                                                    r.request.id !== request.id,
                                                ),
                                              );
                                            } catch (error: any) {
                                              console.error(
                                                "Error denying request:",
                                                error,
                                              );
                                              alert(
                                                error.message ||
                                                  t("events.failedToDeny"),
                                              );
                                            }
                                          }}
                                          className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 h-6 rounded text-[9px] font-bold transition-colors border border-red-500/30 px-1.5"
                                        >
                                          {t("events.deny")}
                                        </button>
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>

                              {/* View Details Button */}
                              <div className="mt-1.5">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/event/manage/${event.id}`);
                                  }}
                                  className="w-full bg-primary/10 hover:bg-primary/20 text-primary h-6 rounded text-[9px] font-bold transition-colors border border-primary/30"
                                >
                                  {t("events.viewDetails")}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 text-slate-400">
                    <span className="material-symbols-outlined text-6xl mb-4 block opacity-50">
                      pending
                    </span>
                    <p className="text-lg font-medium mb-1">
                      {t("events.noOtherJoinRequests") ||
                        "Không có yêu cầu từ người khác"}
                    </p>
                    <p className="text-sm">
                      {t("events.otherJoinRequestsHint") ||
                        "Yêu cầu tham gia sự kiện của bạn sẽ xuất hiện ở đây"}
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        );

      default:
        return null;
    }
  };

  const isLight = theme === "light";
  const tabInactiveClass = isLight
    ? "bg-slate-200/70 text-slate-600 hover:bg-slate-300/70"
    : "bg-white/5 text-slate-400 hover:bg-white/10";

  return (
    <div className="flex flex-col pb-24">
      <header
        className={`sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b px-5 pt-4 pb-3 ${
          isLight ? "border-slate-200" : "border-white/5"
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <h1
            className={`text-xl font-extrabold tracking-tight ${
              isLight ? "text-slate-900" : "text-white"
            }`}
          >
            {t("events.myEvents")}
          </h1>
        </div>

        {/* Sport Filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-3 mb-2 no-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <button
            key="all"
            type="button"
            onClick={() => handleMyEventsSportFilterChange("")}
            className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
              selectedSportFilter === ""
                ? isLight
                  ? "bg-primary text-white shadow-md ring-2 ring-primary/30"
                  : "bg-white text-black"
                : "bg-surface text-slate-300 border border-white/5"
            }`}
          >
            {t("events.filter.all")}
          </button>
          {sportsLoading ? (
            <div className="flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold bg-surface text-slate-300 border border-white/5 animate-pulse">
              {t("common.loading")}
            </div>
          ) : (
            sports.map((sport) => {
              const getSportIcon = (sportName: string) => {
                const sportData = sports.find((s) => s.name === sportName);
                if (sportData) return sportData.icon;
                // Fallback icons
                const iconMap: Record<string, string> = {
                  Tennis: "sports_tennis",
                  Pickleball: "sports_tennis",
                  Badminton: "sports_tennis",
                  Basketball: "sports_basketball",
                  Soccer: "sports_soccer",
                  Volleyball: "sports_volleyball",
                };
                return iconMap[sportName] || "sports";
              };
              const sportSelected = selectedSportFilter === sport.name;
              const displayName =
                language === "vi" && sport.name_vi ? sport.name_vi : sport.name;

              return (
                <button
                  key={sport.id}
                  type="button"
                  onClick={() => handleMyEventsSportFilterChange(sport.name)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                    sportSelected
                      ? isLight
                        ? "bg-primary text-white shadow-md ring-2 ring-primary/30"
                        : "bg-white text-black"
                      : "bg-surface text-slate-300 border border-white/5"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {sport.icon || getSportIcon(sport.name)}
                  </span>
                  {displayName}
                </button>
              );
            })
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mb-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <button
            onClick={() => setActiveTab("upcoming-joined")}
            className={`px-3 py-1.5 rounded-md font-bold text-xs whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === "upcoming-joined"
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : tabInactiveClass
            }`}
          >
            <span className="material-symbols-outlined text-base">
              event_available
            </span>
            <span>{t("events.myUpcoming")}</span>
            {upcomingJoined.length > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === "upcoming-joined"
                    ? "bg-white/20 text-white"
                    : "bg-primary/20 text-primary"
                }`}
              >
                {upcomingJoined.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("happening")}
            className={`px-3 py-1.5 rounded-md font-bold text-xs whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === "happening"
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : tabInactiveClass
            }`}
          >
            <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.25)]" />
            <span className="material-symbols-outlined text-base">
              schedule
            </span>
            <span>{t("events.filter.happening")}</span>
            {happeningJoined.length > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === "happening"
                    ? "bg-white/20 text-white"
                    : "bg-primary/20 text-primary"
                }`}
              >
                {happeningJoined.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("past-joined")}
            className={`px-3 py-1.5 rounded-md font-bold text-xs whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === "past-joined"
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : tabInactiveClass
            }`}
          >
            <span className="material-symbols-outlined text-base">history</span>
            <span>{t("events.myPast")}</span>
            {pastJoined.length > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === "past-joined"
                    ? "bg-white/20 text-white"
                    : "bg-primary/20 text-primary"
                }`}
              >
                {pastJoined.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("created")}
            className={`px-3 py-1.5 rounded-md font-bold text-xs whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === "created"
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : tabInactiveClass
            }`}
          >
            <span className="material-symbols-outlined text-base">star</span>
            <span>{t("events.iCreated")}</span>
            {upcomingCreated.length + pastCreated.length > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === "created"
                    ? "bg-white/20 text-white"
                    : "bg-primary/20 text-primary"
                }`}
              >
                {upcomingCreated.length + pastCreated.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("invited")}
            className={`px-3 py-1.5 rounded-md font-bold text-xs whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === "invited"
                ? "bg-yellow-500 text-white shadow-lg shadow-yellow-500/20"
                : tabInactiveClass
            }`}
          >
            <span className="material-symbols-outlined text-base">mail</span>
            <span>{t("events.invitations")}</span>
            {invitedEvents.length > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === "invited"
                    ? "bg-white/20 text-white"
                    : "bg-yellow-500/20 text-yellow-500"
                }`}
              >
                {invitedEvents.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("requested")}
            className={`px-3 py-1.5 rounded-md font-bold text-xs whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === "requested"
                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                : tabInactiveClass
            }`}
          >
            <span className="material-symbols-outlined text-base">pending</span>
            <span>{t("events.joinRequests")}</span>
            {(upcomingRequested.length > 0 || otherRequests.length > 0) && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === "requested"
                    ? "bg-white/20 text-white"
                    : "bg-orange-500/20 text-orange-500"
                }`}
              >
                {upcomingRequested.length + otherRequests.length}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="px-5 py-6 space-y-6 w-full border-t border-white/5 mt-4">
        {renderEvents()}
      </div>
    </div>
  );
};

export const Messages: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col h-full bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-white/5 pt-8 px-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-extrabold">{t("pages.messages")}</h1>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 lg:p-6">
        <div className="text-center lg:max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center lg:w-16 lg:h-16 lg:mb-4">
            <span className="material-symbols-outlined text-4xl text-primary lg:text-3xl">
              chat_bubble
            </span>
          </div>
          <h2 className="text-2xl font-bold mb-2 lg:text-xl lg:mb-1.5">
            {t("pages.comingSoon")}
          </h2>
          <p className="text-slate-400 lg:text-sm">
            {t("pages.chatUnderDevelopment")}
          </p>
        </div>
      </main>
    </div>
  );
};

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading, signOut, refreshUser, updateUser } = useAuth();
  useEvents(); // Profile may use events/acceptInvitation via child or later
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [friends, setFriends] = useState<User[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [sports, setSports] = useState<Sport[]>([]);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarSignedUrl, setAvatarSignedUrl] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [firstNameInput, setFirstNameInput] = useState(user?.firstName || "");
  const [lastNameInput, setLastNameInput] = useState(user?.lastName || "");
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [actualMatches, setActualMatches] = useState<number>(0);
  const [averageSkill, setAverageSkill] = useState<string | null>(null);
  const [averageSatisfaction, setAverageSatisfaction] = useState<string | null>(
    null,
  );
  const [ratingCount, setRatingCount] = useState<number>(0);

  useEffect(() => {
    if (!user) return;
    setFirstNameInput(user.firstName || "");
    setLastNameInput(user.lastName || "");
  }, [user?.firstName, user?.lastName]);

  // Calculate actual matches count from events
  useEffect(() => {
    const calculateMatches = async () => {
      if (!user?.id) {
        setActualMatches(0);
        return;
      }

      try {
        // Fetch all events and filter in JavaScript to find where user is in players array
        // Events store clerk_id in the players array, so we use user.id (clerk_id)
        const { data: allEvents, error: eventsError } = await supabase
          .from("events")
          .select("id, players");

        if (eventsError) {
          console.error(
            "Error fetching events for matches calculation:",
            eventsError,
          );
          setActualMatches(user.stats?.matches || 0);
          return;
        }

        // Filter events where user's clerk_id is in the players array
        const eventsWithUser = (allEvents || []).filter((event) => {
          if (!event.players || !Array.isArray(event.players)) return false;
          return event.players.includes(user.id);
        });

        // Also count events where user has approved event_requests
        // event_requests.user_id also stores clerk_id
        const { data: approvedRequests, error: requestError } = await supabase
          .from("event_requests")
          .select("event_id")
          .eq("user_id", user.id)
          .eq("status", "approved");

        if (requestError) {
          console.error("Error fetching approved requests:", requestError);
        }

        // Combine both counts, avoiding duplicates
        const eventIdsFromPlayers = new Set(eventsWithUser.map((e) => e.id));
        const eventIdsFromRequests = new Set(
          (approvedRequests || []).map((r) => r.event_id),
        );
        const allEventIds = new Set([
          ...eventIdsFromPlayers,
          ...eventIdsFromRequests,
        ]);

        setActualMatches(allEventIds.size);
      } catch (error) {
        console.error("Error calculating matches:", error);
        setActualMatches(user.stats?.matches || 0);
      }
    };

    calculateMatches();
  }, [user?.id, user?.stats?.matches]);

  // Calculate rating analysis
  useEffect(() => {
    const calculateRatings = async () => {
      if (!user?.id) {
        setAverageSkill(null);
        setAverageSatisfaction(null);
        setRatingCount(0);
        return;
      }

      try {
        const ratings = await ratingService.getUserRatings(user.id);
        console.log(
          "Fetched ratings for user:",
          user.id,
          "Count:",
          ratings.length,
          ratings,
        );

        if (ratings.length === 0) {
          setAverageSkill(null);
          setAverageSatisfaction(null);
          setRatingCount(0);
          return;
        }

        setRatingCount(ratings.length);

        // Calculate average skill
        const skillValues: number[] = [];
        ratings.forEach((rating) => {
          if (rating.skill) {
            if (typeof rating.skill === "number") {
              skillValues.push(rating.skill);
            } else if (typeof rating.skill === "string") {
              switch (rating.skill) {
                case "newbie":
                  skillValues.push(1);
                  break;
                case "intermediate":
                  skillValues.push(3);
                  break;
                case "advanced":
                  skillValues.push(5);
                  break;
              }
            }
          }
        });

        if (skillValues.length > 0) {
          const avgSkill =
            skillValues.reduce((a, b) => a + b, 0) / skillValues.length;
          if (avgSkill <= 2) setAverageSkill("newbie");
          else if (avgSkill >= 4) setAverageSkill("advanced");
          else setAverageSkill("intermediate");
        } else {
          setAverageSkill(null);
        }

        // Calculate average satisfaction
        const satisfactionValues: number[] = [];
        ratings.forEach((rating) => {
          if (rating.satisfaction) {
            if (typeof rating.satisfaction === "number") {
              satisfactionValues.push(rating.satisfaction);
            } else if (typeof rating.satisfaction === "string") {
              switch (rating.satisfaction) {
                case "bad":
                  satisfactionValues.push(1);
                  break;
                case "ok":
                  satisfactionValues.push(3);
                  break;
                case "great":
                  satisfactionValues.push(5);
                  break;
              }
            }
          }
        });

        if (satisfactionValues.length > 0) {
          const avgSatisfaction =
            satisfactionValues.reduce((a, b) => a + b, 0) /
            satisfactionValues.length;
          if (avgSatisfaction <= 2) setAverageSatisfaction("bad");
          else if (avgSatisfaction >= 4) setAverageSatisfaction("great");
          else setAverageSatisfaction("ok");
        } else {
          setAverageSatisfaction(null);
        }
      } catch (error) {
        console.error("Error calculating ratings:", error);
        setAverageSkill(null);
        setAverageSatisfaction(null);
        setRatingCount(0);
      }
    };

    calculateRatings();
  }, [user?.id]);

  // Calculate and update tier when ratings or matches change
  useEffect(() => {
    const updateTier = async () => {
      if (!user?.id) return;

      const matches =
        actualMatches > 0 ? actualMatches : user.stats?.matches || 0;
      const reliability = user.stats?.reliability || 100;

      // Only update tier if we have enough ratings (at least 10)
      if (ratingCount >= 10 && averageSkill && averageSatisfaction) {
        try {
          const newTier = await calculateAndUpdateTier(
            user.id,
            averageSkill,
            averageSatisfaction,
            matches,
            reliability,
          );
          // Refresh user to get updated tier
          await refreshUser();
        } catch (error) {
          console.error("Error updating tier:", error);
        }
      }
    };

    updateTier();
  }, [
    user?.id,
    averageSkill,
    averageSatisfaction,
    actualMatches,
    ratingCount,
    user?.stats?.reliability,
    refreshUser,
  ]);

  // Generate signed URL for private bucket avatar (uses shared cache so image doesn't reload on tab switch)
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const url = await resolveSignedAvatarUrl(user?.avatar ?? null);
      if (!cancelled) setAvatarSignedUrl(url);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [user?.avatar]);

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Optimistic local preview
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);

    setIsUpdatingAvatar(true);

    try {
      const fileExt = file.name.split(".").pop() || "jpg";
      const filePath = `${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("photo")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Store only the storage path in avatar for private bucket
      await updateUser({ avatar: filePath });
      await refreshUser();
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      alert(error.message || "Failed to upload photo");
    } finally {
      setIsUpdatingAvatar(false);
      event.target.value = "";
    }
  };

  const handleNameSave = async () => {
    if (!user) return;
    const trimmedFirstName = firstNameInput.trim();
    const trimmedLastName = lastNameInput.trim();

    if (!trimmedFirstName) {
      alert("First name is required");
      return;
    }

    setIsUpdatingName(true);

    try {
      await updateUser({
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
      });
      setIsEditingName(false);
    } catch (error: any) {
      console.error("Error updating name:", error);
      alert(error.message || "Failed to update name");
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleNameCancel = () => {
    if (!user) return;
    setFirstNameInput(user.firstName || "");
    setLastNameInput(user.lastName || "");
    setIsEditingName(false);
  };

  // Load sports for display
  useEffect(() => {
    const loadSports = async () => {
      try {
        const sportsData = await sportsService.getAllSports();
        setSports(sportsData);
      } catch (err) {
        console.error("Error loading sports:", err);
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

        const loadedFriends = (await Promise.all(friendPromises)).filter(
          (f): f is User => f !== null,
        );

        setFriends(loadedFriends);
      } catch (error) {
        console.error("Error loading friends:", error);
        setFriends([]);
      } finally {
        setFriendsLoading(false);
      }
    };

    loadFriends();
  }, [user]);

  // Note: User profile is loaded in AuthContext and updated via real-time subscriptions
  // No need to refresh here on mount as it causes unnecessary re-renders and subscription loops

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

  const fullName = `${user.firstName} ${user.lastName}`.trim() || "User";
  const reliability = user.stats?.reliability || 100;
  const matches = actualMatches > 0 ? actualMatches : user.stats?.matches || 0;
  const mvps = user.stats?.mvps || 0;
  const level = user.level || 1;

  // Calculate tier - use stored tier or calculate from current data
  const userTier =
    (user.tier as Tier) ||
    (ratingCount >= 10 && averageSkill && averageSatisfaction
      ? calculateTier(averageSkill, averageSatisfaction, matches, reliability)
      : "bronze");
  const tierInfo = getTierInfo(userTier);

  return (
    <div className="flex flex-col bg-background min-h-screen pb-24 lg:pb-4">
      {/* Compact Header */}
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-xl border-b border-white/5 px-4 py-2.5 flex justify-between items-center lg:px-5 lg:py-2">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors lg:w-8 lg:h-8"
        >
          <span className="material-symbols-outlined text-[20px] lg:text-lg">
            arrow_back
          </span>
        </button>
        <h1 className="font-bold text-base lg:text-sm">{t("pages.profile")}</h1>
        <button
          onClick={() => navigate("/settings/notifications")}
          className="w-9 h-9 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors lg:w-8 lg:h-8"
        >
          <span className="material-symbols-outlined text-[20px] lg:text-lg">
            settings
          </span>
        </button>
      </header>

      <div className="lg:max-w-4xl lg:mx-auto lg:w-full">
        {/* Pokemon Card Style Profile */}
        <div className="mx-4 mt-4 mb-4 lg:mx-5 lg:mt-4 lg:mb-4 flex justify-center">
          <div
            className="relative rounded-2xl border-4 overflow-hidden w-full max-w-xs lg:max-w-[320px] lg:rounded-xl transition-all duration-75 ease-out shadow-2xl"
            style={
              theme === "light"
                ? {
                    background: "#f8fafc",
                    borderColor: `${tierInfo.colors.border}99`,
                    boxShadow: `0 10px 40px rgba(0, 0, 0, 0.08), 0 0 0 1px ${tierInfo.colors.border}40`,
                  }
                : {
                    background: `linear-gradient(to bottom right, ${tierInfo.colors.gradientFrom}, ${tierInfo.colors.gradientVia}, ${tierInfo.colors.gradientTo})`,
                    borderColor: `${tierInfo.colors.border}66`,
                    boxShadow: `0 10px 40px rgba(0, 0, 0, 0.5), 0 0 20px ${tierInfo.colors.primary}4D, 0 0 0 1px ${tierInfo.colors.border}33`,
                  }
            }
          >
            {/* Dark overlay for text readability (hidden in light mode) */}
            <div
              className={`absolute inset-0 pointer-events-none ${theme === "light" ? "bg-transparent" : "bg-slate-900/50"}`}
            />
            {/* Holographic effect overlay (subtle in light mode) */}
            <div
              className={`absolute inset-0 pointer-events-none ${theme === "light" ? "bg-gradient-to-br from-white/40 via-transparent to-transparent" : "bg-gradient-to-br from-white/5 via-transparent to-black/10"}`}
            />

            {/* Card Header with Name and Level */}
            <div
              className="relative px-3 pt-3 pb-1.5 border-b-2 bg-gradient-to-r lg:px-3 lg:pt-2.5 lg:pb-1.5"
              style={
                theme === "light"
                  ? {
                      borderColor: `${tierInfo.colors.border}60`,
                      background: `linear-gradient(to right, ${tierInfo.colors.primary}25, transparent, ${tierInfo.colors.primary}25)`,
                    }
                  : {
                      borderColor: `${tierInfo.colors.border}50`,
                      background: `linear-gradient(to right, ${tierInfo.colors.primary}40, transparent, ${tierInfo.colors.primary}40)`,
                    }
              }
            >
              <div className="flex items-center justify-between mb-2">
                {isEditingName ? (
                  <div className="flex-1 space-y-1.5">
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={firstNameInput}
                        onChange={(e) => setFirstNameInput(e.target.value)}
                        placeholder="First name"
                        className="flex-1 bg-background/80 rounded-md px-2 py-1.5 text-sm outline-none border-2 border-yellow-400/50 focus:border-yellow-400 transition-colors text-white font-bold lg:px-2 lg:py-1 lg:text-sm"
                      />
                      <input
                        type="text"
                        value={lastNameInput}
                        onChange={(e) => setLastNameInput(e.target.value)}
                        placeholder="Last name"
                        className="flex-1 bg-background/80 rounded-md px-2 py-1.5 text-sm outline-none border-2 border-yellow-400/50 focus:border-yellow-400 transition-colors text-white font-bold lg:px-2 lg:py-1 lg:text-sm"
                      />
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={handleNameSave}
                        disabled={isUpdatingName}
                        className="px-3 py-1.5 rounded-md bg-yellow-500 text-xs font-bold text-slate-900 hover:bg-yellow-400 transition-colors disabled:opacity-60 lg:px-2.5 lg:py-1 lg:text-xs"
                      >
                        {isUpdatingName ? "..." : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={handleNameCancel}
                        disabled={isUpdatingName}
                        className="px-3 py-1.5 rounded-md bg-surface/70 text-xs font-bold text-slate-200 hover:bg-surface/90 transition-colors disabled:opacity-60 lg:px-2.5 lg:py-1 lg:text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <h2 className="text-xl font-extrabold drop-shadow-lg lg:text-lg text-white">
                    {fullName}
                  </h2>
                )}
                <div className="flex items-center gap-2">
                  {!isEditingName && (
                    <button
                      type="button"
                      onClick={() => setIsEditingName(true)}
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-colors lg:w-6 lg:h-6"
                      style={{
                        backgroundColor: `${tierInfo.colors.primary}33`,
                        color: tierInfo.colors.primary,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `${tierInfo.colors.primary}50`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = `${tierInfo.colors.primary}33`;
                      }}
                      title="Edit name"
                    >
                      <span className="material-symbols-outlined text-[18px] lg:text-base">
                        edit
                      </span>
                    </button>
                  )}
                  {/* Tier Badge */}
                  <div
                    className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider lg:px-1.5 lg:py-0.5 lg:text-[8px]"
                    style={{
                      backgroundColor: tierInfo.colors.primary,
                      color: theme === "light" ? "#fff" : tierInfo.colors.text,
                    }}
                  >
                    {tierInfo.displayName}
                  </div>
                  {/* Level Badge */}
                  <div
                    className="border-2 px-3 py-1 rounded-full flex items-center gap-1 shadow-lg lg:px-2.5 lg:py-0.5"
                    style={{
                      background: `linear-gradient(to right, ${tierInfo.colors.primary}, ${tierInfo.colors.secondary})`,
                      borderColor: tierInfo.colors.border,
                    }}
                  >
                    <span
                      className="material-symbols-outlined text-[14px] lg:text-xs"
                      style={{ color: theme === "light" ? "#fff" : tierInfo.colors.text }}
                    >
                      military_tech
                    </span>
                    <span
                      className="text-sm font-extrabold lg:text-xs"
                      style={{ color: theme === "light" ? "#fff" : tierInfo.colors.text }}
                    >
                      LV.{level}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2 min-h-[1.5rem] lg:gap-x-2.5 lg:mt-1.5 lg:min-h-[1.25rem]">
                {user.userId && (
                  <div className={`flex items-center gap-1.5 text-xs lg:text-[11px] ${theme === "light" ? "text-slate-600" : "text-slate-300"}`}>
                    <span className={theme === "light" ? "text-slate-500" : "text-slate-400"}>ID:</span>
                    <code className={`font-mono font-bold truncate max-w-[8rem] sm:max-w-[10rem] ${theme === "light" ? "text-amber-700" : "text-yellow-400"}`}>
                      {user.userId}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(user.userId);
                      }}
                      className="p-1 rounded transition-colors flex-shrink-0"
                      style={{
                        backgroundColor: `${tierInfo.colors.primary}33`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `${tierInfo.colors.primary}50`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = `${tierInfo.colors.primary}33`;
                      }}
                      title="Copy user ID"
                    >
                      <span className={`material-symbols-outlined text-sm lg:text-xs ${theme === "light" ? "text-amber-700" : "text-yellow-400"}`}>
                        content_copy
                      </span>
                    </button>
                  </div>
                )}
                {user.location && (
                  <div className={`flex items-center gap-1 text-xs lg:text-[11px] min-w-0 ${theme === "light" ? "text-slate-600" : "text-slate-300"}`}>
                    <span className={`material-symbols-outlined flex-shrink-0 text-sm lg:text-xs ${theme === "light" ? "text-amber-700" : "text-yellow-400"}`}>
                      location_on
                    </span>
                    <span className="truncate">
                      {user.location}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Image Section - Pokemon Card Style */}
            <div className="relative px-3 py-4 lg:px-3 lg:py-3">
              <div className="flex justify-center">
                <div className="relative">
                  {/* Card-like image container */}
                  <div
                    className="relative w-52 h-52 rounded-xl border-2 bg-gradient-to-br from-slate-700 to-slate-900 p-0.5 shadow-2xl lg:w-48 lg:h-48 lg:rounded-lg"
                    style={{ borderColor: `${tierInfo.colors.border}80` }}
                  >
                    <div
                      className="absolute inset-0 rounded-[10px] lg:rounded-[6px]"
                      style={{
                        background: `linear-gradient(to bottom right, ${tierInfo.colors.primary}33, transparent, ${tierInfo.colors.secondary}33)`,
                      }}
                    ></div>
                    <div className="relative w-full h-full rounded-[10px] overflow-hidden bg-slate-800 lg:rounded-[6px]">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt={fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : avatarSignedUrl ? (
                        <img
                          src={avatarSignedUrl}
                          alt={fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : user?.avatar ? (
                        /* Signed URL still loading — don't show fallback image */
                        <div
                          className="w-full h-full bg-slate-800"
                          aria-hidden
                        />
                      ) : user?.id ? (
                        <img
                          src={`https://i.pravatar.cc/150?u=${user.id}`}
                          alt={fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : null}
                    </div>
                    {/* Camera button */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUpdatingAvatar}
                      className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-full border-[3px] border-slate-900 flex items-center justify-center transition-all shadow-lg lg:w-7 lg:h-7"
                      style={{
                        background: `linear-gradient(to bottom right, ${tierInfo.colors.primary}, ${tierInfo.colors.secondary})`,
                        color: tierInfo.colors.text,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = `linear-gradient(to bottom right, ${tierInfo.colors.secondary}, ${tierInfo.colors.primary})`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = `linear-gradient(to bottom right, ${tierInfo.colors.primary}, ${tierInfo.colors.secondary})`;
                      }}
                      title="Upload photo"
                    >
                      <span className="material-symbols-outlined text-[16px] lg:text-sm">
                        {isUpdatingAvatar ? "hourglass_top" : "photo_camera"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Section - Pokemon Card Style (same as UserProfileView) */}
            <div className="px-3 pb-3 space-y-2 lg:px-3 lg:pb-2.5 lg:space-y-1.5">
              <div className="text-center">
                <h3
                  className={`text-xs font-extrabold uppercase tracking-widest mb-1.5 lg:text-[10px] lg:mb-1 ${theme === "light" ? "text-amber-700" : "text-yellow-400"}`}
                >
                  {t("profile.matches")}
                </h3>
                <div
                  className={`rounded-lg border-2 p-2 lg:p-1.5 ${theme === "light" ? "bg-slate-100 border-slate-300" : "bg-slate-800/60"}`}
                  style={
                    theme !== "light"
                      ? { borderColor: `${tierInfo.colors.border}50` }
                      : undefined
                  }
                >
                  <div
                    className={`text-3xl font-extrabold drop-shadow-lg lg:text-2xl ${theme === "light" ? "text-amber-700" : "text-yellow-400"}`}
                  >
                    {matches}
                  </div>
                  <div
                    className={`text-[10px] uppercase tracking-wider mt-0.5 lg:text-[9px] ${theme === "light" ? "text-slate-700" : "text-white"}`}
                  >
                    Trận đấu
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 lg:gap-1.5">
                {/* Reliability Stat */}
                <div
                  className={`rounded-lg border-2 border-green-400/40 p-2 relative overflow-hidden lg:p-1.5 ${theme === "light" ? "bg-slate-100" : "bg-slate-800/60"}`}
                >
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-green-400 to-emerald-500"></div>
                  <div className="flex items-center gap-1.5 mb-1.5 lg:gap-1 lg:mb-1">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center lg:w-5 lg:h-5">
                      <span className="material-symbols-outlined text-white text-xs lg:text-[10px]">
                        verified
                      </span>
                    </div>
                    <div className="flex-1">
                      <div
                        className={`text-[10px] uppercase tracking-wider font-bold lg:text-[9px] ${theme === "light" ? "text-slate-700" : "text-white"}`}
                      >
                        {t("profile.reliability")}
                      </div>
                      <div className="text-xl font-extrabold text-green-400 lg:text-lg">
                        {reliability}%
                      </div>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500"
                      style={{ width: `${reliability}%` }}
                    ></div>
                  </div>
                </div>

                {/* MVP Stat */}
                <div
                  className={`rounded-lg border-2 border-purple-400/40 p-2 relative overflow-hidden lg:p-1.5 ${theme === "light" ? "bg-slate-100" : "bg-slate-800/60"}`}
                >
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-400 to-pink-500"></div>
                  <div className="flex items-center gap-1.5 mb-1.5 lg:gap-1 lg:mb-1">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center lg:w-5 lg:h-5">
                      <span className="material-symbols-outlined text-white text-xs lg:text-[10px]">
                        emoji_events
                      </span>
                    </div>
                    <div className="flex-1">
                      <div
                        className={`text-[10px] uppercase tracking-wider font-bold lg:text-[9px] ${theme === "light" ? "text-slate-700" : "text-white"}`}
                      >
                        {t("profile.mvps")}
                      </div>
                      <div className="text-xl font-extrabold text-purple-400 lg:text-lg">
                        {mvps}
                      </div>
                    </div>
                  </div>
                  {/* Star rating visual */}
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`material-symbols-outlined text-base ${
                          i < mvps
                            ? "text-yellow-400"
                            : theme === "light"
                              ? "text-slate-400"
                              : "text-slate-600"
                        } lg:text-sm`}
                      >
                        star
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Rating Analysis - Skill and Satisfaction */}
              <div
                className={`grid grid-cols-2 gap-2 pt-2 lg:gap-1.5 lg:pt-1.5 ${theme === "light" ? "border-t-2 border-slate-300" : "border-t-2 border-yellow-400/20"}`}
              >
                <div
                  className={`rounded-lg border-2 border-blue-400/30 p-2 flex flex-col items-center lg:p-1.5 ${theme === "light" ? "bg-slate-100" : "bg-slate-800/60"}`}
                >
                  <div className="flex items-center gap-1 mb-0.5 lg:gap-0.5 lg:mb-0.5">
                    <span className="material-symbols-outlined text-xs text-blue-400 lg:text-[10px]">
                      {averageSkill === "newbie"
                        ? "trending_up"
                        : averageSkill === "advanced"
                          ? "emoji_events"
                          : averageSkill === "intermediate"
                            ? "trending_flat"
                            : "star"}
                    </span>
                    <span
                      className={`text-[10px] uppercase tracking-wider font-bold lg:text-[9px] ${theme === "light" ? "text-slate-700" : "text-white"}`}
                    >
                      {t("profile.averageSkill")}
                    </span>
                  </div>
                  {ratingCount >= 10 && averageSkill ? (
                    <span className="text-sm font-bold text-blue-400 lg:text-xs">
                      {t(`ratings.skillLevel.${averageSkill}`)}
                    </span>
                  ) : (
                    <span
                      className={`text-sm font-bold lg:text-xs ${theme === "light" ? "text-slate-700" : "text-white"}`}
                    >
                      {ratingCount === 0
                        ? t("profile.noRatings")
                        : ratingCount < 10
                          ? t("profile.notEnoughRatings")
                          : "-"}
                    </span>
                  )}
                </div>
                <div
                  className={`rounded-lg border-2 border-orange-400/30 p-2 flex flex-col items-center lg:p-1.5 ${theme === "light" ? "bg-slate-100" : "bg-slate-800/60"}`}
                >
                  <div className="flex items-center gap-1 mb-0.5 lg:gap-0.5 lg:mb-0.5">
                    <span
                      className={`material-symbols-outlined text-xs ${
                        averageSatisfaction === "bad"
                          ? "text-red-400"
                          : averageSatisfaction === "great"
                            ? "text-green-400"
                            : averageSatisfaction === "ok"
                              ? "text-yellow-400"
                              : "text-slate-400"
                      } lg:text-[10px]`}
                    >
                      {averageSatisfaction === "bad"
                        ? "sentiment_dissatisfied"
                        : averageSatisfaction === "great"
                          ? "sentiment_very_satisfied"
                          : averageSatisfaction === "ok"
                            ? "sentiment_neutral"
                            : "sentiment_neutral"}
                    </span>
                    <span
                      className={`text-[10px] uppercase tracking-wider font-bold lg:text-[9px] ${theme === "light" ? "text-slate-700" : "text-white"}`}
                    >
                      {t("profile.averageSatisfaction")}
                    </span>
                  </div>
                  {ratingCount >= 10 && averageSatisfaction ? (
                    <span className="text-sm font-bold lg:text-xs text-orange-600">
                      {t(`ratings.satisfactionLevel.${averageSatisfaction}`)}
                    </span>
                  ) : (
                    <span
                      className={`text-sm font-bold lg:text-xs ${theme === "light" ? "text-slate-700" : "text-white"}`}
                    >
                      {ratingCount === 0
                        ? t("profile.noRatings")
                        : ratingCount < 10
                          ? t("profile.notEnoughRatings")
                          : "-"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sports - Compact Horizontal Scroll */}
        {user.sports && user.sports.length > 0 && (
          <div className="px-4 py-3 border-b border-white/5 lg:px-5 lg:py-2.5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 lg:text-xs lg:mb-2">
              Sports
            </h3>
            <div className="flex gap-2 overflow-x-auto no-scrollbar lg:gap-2">
              {user.sports.map((sport, i) => {
                const getSportIcon = (sportName: string) => {
                  const sportData = sports.find((s) => s.name === sportName);
                  if (sportData) return sportData.icon;
                  return "sports";
                };

                return (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 bg-surface/50 px-2.5 py-1.5 rounded-lg border border-white/5 flex-shrink-0 lg:px-2.5 lg:py-1.5 lg:gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary lg:text-base">
                      {getSportIcon(sport)}
                    </span>
                    <span className="text-xs font-medium text-slate-300 lg:text-xs">
                      {sport}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Friend Requests Section - Compact */}
        {user.friendRequests && user.friendRequests.length > 0 && (
          <div className="px-4 py-3 border-b border-white/5 lg:px-5 lg:py-2.5">
            <div className="flex items-center justify-between mb-2 lg:mb-2">
              <h3 className="text-sm font-bold flex items-center gap-2 lg:text-sm lg:gap-2">
                {t("profile.friendRequests")}
                <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold lg:text-[10px]">
                  {user.friendRequests.length}
                </span>
              </h3>
            </div>
            <FriendRequestsSection
              currentUser={user}
              onUpdate={async () => {
                await refreshUser();
              }}
            />
          </div>
        )}

        {/* Event Invitations Section - Compact */}
        <EventInvitationsSection />

        {/* Add Friend Section - Compact */}
        <div className="px-4 py-3 border-b border-white/5 lg:px-5 lg:py-2.5">
          <h3 className="text-sm font-bold mb-2 lg:text-sm lg:mb-2">
            {t("profile.addFriend")}
          </h3>
          <AddFriendSection currentUser={user} />
        </div>

        {/* Friends Section - Compact */}
        <div className="px-4 py-3 lg:px-5 lg:py-2.5">
          <div className="flex items-center justify-between mb-3 lg:mb-2.5">
            <h3 className="text-sm font-bold flex items-center gap-2 lg:text-sm lg:gap-2">
              {t("profile.friends")}
              {user.friends && user.friends.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold lg:text-[10px]">
                  {user.friends.length}
                </span>
              )}
            </h3>
          </div>
          {friendsLoading ? (
            <div className="text-center text-slate-400 text-xs py-3 lg:text-xs lg:py-2.5">
              {t("common.loading")}
            </div>
          ) : !user.friends || user.friends.length === 0 ? (
            <div className="text-center text-slate-400 text-xs py-3 lg:text-xs lg:py-2.5">
              {t("profile.noFriends")}
            </div>
          ) : (
            <div className="space-y-2 lg:space-y-2">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between p-2.5 bg-surface/50 rounded-lg border border-white/5 hover:border-primary/20 transition-colors lg:p-2.5"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0 lg:gap-2.5">
                    <Avatar
                      src={
                        friend.avatar ||
                        `https://i.pravatar.cc/150?u=${friend.id}`
                      }
                      size="w-9 h-9"
                      className="lg:w-9 lg:h-9"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate lg:text-sm">
                        {friend.firstName} {friend.lastName}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate lg:text-xs">
                        {friend.userId || `Level ${friend.level || 1}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0 lg:gap-1.5">
                    <button
                      onClick={() => navigate(`/profile/user/${friend.id}`)}
                      className="px-2.5 py-1.5 rounded-lg bg-primary/10 flex items-center justify-center gap-1.5 text-primary hover:bg-primary/20 transition-colors lg:px-2.5 lg:py-1.5 lg:gap-1.5"
                      title={t("profile.viewProfile")}
                    >
                      <span className="material-symbols-outlined text-[16px] lg:text-base">
                        person
                      </span>
                      <span className="text-xs font-bold lg:text-xs whitespace-nowrap">
                        {t("profile.viewProfile")}
                      </span>
                    </button>
                    <button
                      onClick={async () => {
                        if (
                          !confirm(
                            t("profile.removeFriendConfirm").replace(
                              "{name}",
                              `${friend.firstName} ${friend.lastName}`,
                            ),
                          )
                        ) {
                          return;
                        }
                        try {
                          await removeFriend(user.id, friend.id);
                        } catch (error: any) {
                          console.error("Error removing friend:", error);
                          alert(
                            error.message || t("profile.failedToRemoveFriend"),
                          );
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-red-500/10 flex items-center justify-center gap-1.5 text-red-400 hover:bg-red-500/20 transition-colors lg:px-2.5 lg:py-1.5 lg:gap-1.5"
                      title={t("profile.removeFriend")}
                    >
                      <span className="material-symbols-outlined text-[16px] lg:text-base">
                        person_remove
                      </span>
                      <span className="text-xs font-bold lg:text-xs whitespace-nowrap">
                        {t("profile.removeFriend")}
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Logout Button - Compact */}
        <div className="px-4 py-3 mt-2 lg:px-5 lg:py-2.5 lg:mt-2">
          <button
            onClick={async () => {
              try {
                await signOut();
                navigate("/");
              } catch (error) {
                console.error("Error signing out:", error);
              }
            }}
            className="w-full py-2.5 bg-red-500/10 border border-red-500/30 rounded-lg font-bold text-sm text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 lg:py-2.5 lg:text-sm lg:gap-2"
          >
            <span className="material-symbols-outlined text-[18px] lg:text-lg">
              logout
            </span>
            {t("profile.logout")}
          </button>
        </div>
      </div>
    </div>
  );
};

// Add Friend Component
const AddFriendSection: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [searchUserId, setSearchUserId] = useState("");
  const [searchedUser, setSearchedUser] = useState<User | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchedUserSkill, setSearchedUserSkill] = useState<string | null>(
    null,
  );
  const [searchedUserSatisfaction, setSearchedUserSatisfaction] = useState<
    string | null
  >(null);
  const [searchedUserRatingCount, setSearchedUserRatingCount] =
    useState<number>(0);

  const handleSearch = async () => {
    if (!searchUserId.trim()) {
      setError("Please enter a user ID");
      return;
    }

    if (!isValidUserId(searchUserId.trim())) {
      setError(t("profile.invalidUserId"));
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

          // Fetch and calculate ratings for the searched user
          try {
            const ratings = await ratingService.getUserRatings(user.id);
            setSearchedUserRatingCount(ratings.length);

            if (ratings.length >= 10) {
              // Calculate average skill
              const skillValues: number[] = [];
              ratings.forEach((rating) => {
                if (rating.skill) {
                  if (typeof rating.skill === "number") {
                    skillValues.push(rating.skill);
                  } else if (typeof rating.skill === "string") {
                    switch (rating.skill) {
                      case "newbie":
                        skillValues.push(1);
                        break;
                      case "intermediate":
                        skillValues.push(3);
                        break;
                      case "advanced":
                        skillValues.push(5);
                        break;
                    }
                  }
                }
              });

              if (skillValues.length > 0) {
                const avgSkill =
                  skillValues.reduce((a, b) => a + b, 0) / skillValues.length;
                if (avgSkill <= 2) setSearchedUserSkill("newbie");
                else if (avgSkill >= 4) setSearchedUserSkill("advanced");
                else setSearchedUserSkill("intermediate");
              } else {
                setSearchedUserSkill(null);
              }

              // Calculate average satisfaction
              const satisfactionValues: number[] = [];
              ratings.forEach((rating) => {
                if (rating.satisfaction) {
                  if (typeof rating.satisfaction === "number") {
                    satisfactionValues.push(rating.satisfaction);
                  } else if (typeof rating.satisfaction === "string") {
                    switch (rating.satisfaction) {
                      case "bad":
                        satisfactionValues.push(1);
                        break;
                      case "ok":
                        satisfactionValues.push(3);
                        break;
                      case "great":
                        satisfactionValues.push(5);
                        break;
                    }
                  }
                }
              });

              if (satisfactionValues.length > 0) {
                const avgSatisfaction =
                  satisfactionValues.reduce((a, b) => a + b, 0) /
                  satisfactionValues.length;
                if (avgSatisfaction <= 2) setSearchedUserSatisfaction("bad");
                else if (avgSatisfaction >= 4)
                  setSearchedUserSatisfaction("great");
                else setSearchedUserSatisfaction("ok");
              } else {
                setSearchedUserSatisfaction(null);
              }
            } else {
              setSearchedUserSkill(null);
              setSearchedUserSatisfaction(null);
            }
          } catch (ratingError) {
            console.error("Error fetching ratings:", ratingError);
            setSearchedUserSkill(null);
            setSearchedUserSatisfaction(null);
            setSearchedUserRatingCount(0);
          }
        }
      } else {
        setError(t("profile.userNotFound"));
        setSearchedUserSkill(null);
        setSearchedUserSatisfaction(null);
        setSearchedUserRatingCount(0);
      }
    } catch (err: any) {
      setError(err.message || t("profile.errorSearching"));
      setSearchedUserSkill(null);
      setSearchedUserSatisfaction(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async () => {
    if (!searchedUser) return;

    setError("");
    setSuccess("");

    try {
      console.log(
        "Attempting to send friend request from",
        currentUser.id,
        "to",
        searchedUser.id,
      );
      await sendFriendRequest(currentUser.id, searchedUser.id);
      setSuccess(t("profile.friendRequestSent"));
      setSearchedUser(null);
      setSearchUserId("");
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      console.error("Error sending friend request:", err);
      const errorMessage = err.message || "Error sending friend request";
      setError(errorMessage);
      // Keep error visible longer for important messages
      setTimeout(() => setError(""), 10000);
    }
  };

  return (
    <div className="space-y-2 lg:space-y-2">
      <div className="flex gap-2 lg:gap-2">
        <input
          type="text"
          value={searchUserId}
          onChange={(e) => setSearchUserId(e.target.value)}
          placeholder={t("profile.enterUserIdPlaceholder")}
          className="flex-1 bg-surface/50 rounded-lg px-3 h-9 text-sm outline-none border border-white/10 focus:border-primary transition-colors text-white lg:px-3 lg:h-9 lg:text-sm"
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
        />
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="px-3 py-1.5 bg-primary rounded-lg font-bold text-sm text-white hover:bg-primary/80 transition-colors disabled:opacity-50 lg:px-3 lg:py-1.5 lg:text-sm"
        >
          {isSearching ? "..." : t("profile.search")}
        </button>
      </div>

      {error && (
        <div className="p-2.5 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-xs lg:p-2.5 lg:text-xs">
          <div className="flex items-start gap-1.5 lg:gap-1.5">
            <span className="material-symbols-outlined text-[16px] lg:text-base">
              error
            </span>
            <div className="flex-1">
              <p className="font-bold mb-0.5 lg:mb-0.5">{error}</p>
              {error.includes("migration") && (
                <p className="text-[10px] mt-1 opacity-75 lg:text-[10px] lg:mt-0.5">
                  Run fix_friend_requests_rls.sql in Supabase SQL Editor
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="p-2 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-xs lg:p-2 lg:text-xs">
          {success}
        </div>
      )}

      {searchedUser && (
        <div className="bg-surface/50 p-2.5 rounded-lg border border-white/5 flex items-center justify-between lg:p-2.5">
          <div className="flex items-center gap-2.5 flex-1 min-w-0 lg:gap-2.5">
            <Avatar
              src={
                searchedUser.avatar ||
                `https://i.pravatar.cc/150?u=${searchedUser.id}`
              }
              size="w-9 h-9"
              className="lg:w-9 lg:h-9"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-sm truncate lg:text-sm">
                  {searchedUser.firstName} {searchedUser.lastName}
                </p>
                {/* Rating Display - Chips next to name (only if >= 10 ratings) */}
                {searchedUserRatingCount >= 10 &&
                  (searchedUserSkill || searchedUserSatisfaction) && (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {searchedUserSkill && (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 bg-surface rounded-full border border-white/10 text-[10px] font-medium lg:text-[10px] ${
                            searchedUserSkill === "newbie"
                              ? "text-blue-300"
                              : searchedUserSkill === "advanced"
                                ? "text-purple-300"
                                : "text-cyan-300"
                          }`}
                        >
                          <span
                            className={`material-symbols-outlined text-[12px] ${
                              searchedUserSkill === "newbie"
                                ? "text-blue-400"
                                : searchedUserSkill === "advanced"
                                  ? "text-purple-400"
                                  : "text-cyan-400"
                            }`}
                          >
                            {searchedUserSkill === "newbie"
                              ? "trending_up"
                              : searchedUserSkill === "advanced"
                                ? "emoji_events"
                                : "trending_flat"}
                          </span>
                          {t(`ratings.skillLevel.${searchedUserSkill}`)}
                        </span>
                      )}
                      {searchedUserSatisfaction && (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 bg-surface rounded-full border border-white/10 text-[10px] font-medium lg:text-[10px] ${
                            searchedUserSatisfaction === "bad"
                              ? "text-red-300"
                              : searchedUserSatisfaction === "great"
                                ? "text-green-300"
                                : "text-yellow-300"
                          }`}
                        >
                          <span
                            className={`material-symbols-outlined text-[12px] ${
                              searchedUserSatisfaction === "bad"
                                ? "text-red-400"
                                : searchedUserSatisfaction === "great"
                                  ? "text-green-400"
                                  : "text-yellow-400"
                            }`}
                          >
                            {searchedUserSatisfaction === "bad"
                              ? "sentiment_dissatisfied"
                              : searchedUserSatisfaction === "great"
                                ? "sentiment_very_satisfied"
                                : "sentiment_neutral"}
                          </span>
                          {t(
                            `ratings.satisfactionLevel.${searchedUserSatisfaction}`,
                          )}
                        </span>
                      )}
                    </div>
                  )}
                {searchedUserRatingCount > 0 &&
                  searchedUserRatingCount < 10 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface/50 rounded-full border border-white/10 text-[10px] font-medium text-slate-400 lg:text-[10px]">
                      {t("profile.notEnoughRatings")}
                    </span>
                  )}
              </div>
              <p className="text-[11px] text-slate-400 truncate lg:text-xs">
                {searchedUser.userId}
              </p>
            </div>
          </div>
          <div className="flex gap-1.5 flex-shrink-0 items-center lg:gap-1.5">
            {currentUser.friends?.includes(searchedUser.id) && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 font-bold text-xs lg:px-2.5 lg:py-1.5 lg:text-xs"
                title={t("profile.alreadyFriend")}
              >
                <span className="material-symbols-outlined text-[16px] lg:text-base">
                  person_check
                </span>
                {t("profile.alreadyFriend")}
              </span>
            )}
            <button
              onClick={() => navigate(`/profile/user/${searchedUser.id}`)}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors border lg:px-3 lg:py-1.5 lg:text-xs ${
                theme === "light"
                  ? "bg-slate-200/90 text-slate-800 border-slate-300 hover:bg-slate-300/90"
                  : "bg-surface/80 text-white border-white/10 hover:bg-white/10"
              }`}
              title={t("profile.viewProfile")}
            >
              {t("profile.viewProfile")}
            </button>
            {!currentUser.friends?.includes(searchedUser.id) && (
              <button
                onClick={handleSendRequest}
                className="px-3 py-1.5 bg-primary rounded-lg font-bold text-xs text-white hover:bg-primary/80 transition-colors lg:px-3 lg:py-1.5 lg:text-xs"
              >
                {t("profile.sendFriendRequest")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Friend Requests Component
const FriendRequestsSection: React.FC<{
  currentUser: User;
  onUpdate: () => void;
}> = ({ currentUser, onUpdate }) => {
  const { t } = useLanguage();
  const [loadingRequests, setLoadingRequests] = useState<
    Record<string, boolean>
  >({});
  const [requestUsers, setRequestUsers] = useState<User[]>([]);

  useEffect(() => {
    const loadRequestUsers = async () => {
      if (
        !currentUser.friendRequests ||
        currentUser.friendRequests.length === 0
      ) {
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
          }),
        );
        setRequestUsers(users.filter((u): u is User => u !== null));
      } catch (error) {
        console.error("Error loading friend requests:", error);
      }
    };

    loadRequestUsers();
  }, [currentUser.friendRequests]);

  const handleAccept = async (friendId: string) => {
    setLoadingRequests((prev) => ({ ...prev, [friendId]: true }));
    try {
      await acceptFriendRequest(currentUser.id, friendId);
      onUpdate();
    } catch (error) {
      console.error("Error accepting friend request:", error);
    } finally {
      setLoadingRequests((prev) => ({ ...prev, [friendId]: false }));
    }
  };

  const handleDeny = async (friendId: string) => {
    setLoadingRequests((prev) => ({ ...prev, [friendId]: true }));
    try {
      const { denyFriendRequest } = await import("../services/supabaseService");
      await denyFriendRequest(currentUser.id, friendId);
      // Real-time subscription will update the user object automatically
      onUpdate();
    } catch (error) {
      console.error("Error denying friend request:", error);
      alert(
        error instanceof Error
          ? error.message
          : t("profile.failedToDenyFriendRequest"),
      );
    } finally {
      setLoadingRequests((prev) => ({ ...prev, [friendId]: false }));
    }
  };

  return (
    <div className="space-y-2 lg:space-y-2">
      {requestUsers.map((user) => (
        <div
          key={user.id}
          className="bg-surface/50 p-2.5 rounded-lg border border-yellow-500/20 flex items-center justify-between lg:p-2.5"
        >
          <div className="flex items-center gap-2.5 flex-1 min-w-0 lg:gap-2.5">
            <Avatar
              src={user.avatar || `https://i.pravatar.cc/150?u=${user.id}`}
              size="w-9 h-9"
              className="lg:w-9 lg:h-9"
            />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate lg:text-sm">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[11px] text-slate-400 truncate lg:text-xs">
                {user.userId}
              </p>
            </div>
          </div>
          <div className="flex gap-1.5 flex-shrink-0 lg:gap-1.5">
            <button
              onClick={() => handleAccept(user.id)}
              disabled={loadingRequests[user.id]}
              className="px-2.5 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg font-bold text-xs text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50 lg:px-2.5 lg:py-1.5 lg:text-xs"
            >
              {loadingRequests[user.id] ? "..." : t("profile.accept")}
            </button>
            <button
              onClick={() => handleDeny(user.id)}
              disabled={loadingRequests[user.id]}
              className="px-2.5 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg font-bold text-xs text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50 lg:px-2.5 lg:py-1.5 lg:text-xs"
            >
              {loadingRequests[user.id] ? "..." : t("profile.deny")}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Event Invitations Component
const EventInvitationsSection: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { getUserInvitations, acceptInvitation, denyInvitation, getEvent } =
    useEvents();
  const [invitations, setInvitations] = useState<EventRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [denyingId, setDenyingId] = useState<string | null>(null);

  useEffect(() => {
    const loadInvitations = async () => {
      if (!user) {
        setInvitations([]);
        setLoading(false);
        return;
      }

      try {
        const invs = await getUserInvitations();
        // Filter out invitations for events the user has already joined
        const filtered = invs.filter((inv) => {
          const event = getEvent(inv.eventId);
          if (!event || !user) return true;
          return !event.players.includes(user.id);
        });
        setInvitations(filtered);
      } catch (error) {
        console.error("Error loading invitations:", error);
        setInvitations([]);
      } finally {
        setLoading(false);
      }
    };

    loadInvitations();

    // Set up real-time subscription for this component (separate from Layout.tsx)
    // Use unique channel name to avoid conflicts
    let channel: any = null;
    const setupRealtime = async () => {
      if (!user) return;

      const { supabase } = await import("../lib/supabase");
      const userId = user.id; // Capture in closure

      channel = supabase
        .channel(`event_invitations_section:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "event_requests",
          },
          (payload) => {
            console.log(
              "EventInvitationsSection: Real-time change received:",
              payload,
            );

            const newRecord = payload.new as any;
            const oldRecord = payload.old as any;

            // Filter in callback to avoid binding mismatch
            const isRelevant =
              (newRecord && newRecord.user_id === userId) ||
              (oldRecord && oldRecord.user_id === userId);

            if (!isRelevant) {
              console.log(
                "EventInvitationsSection: Change not relevant to current user, ignoring",
              );
              return;
            }

            // Check if this is an invitation-related change
            // For INSERT: new record with status 'invited'
            // For UPDATE: status changed to/from 'invited'
            // For DELETE: old record had status 'invited'
            const isNewInvitation =
              newRecord &&
              newRecord.status === "invited" &&
              newRecord.user_id === userId;
            const wasInvitation =
              oldRecord &&
              oldRecord.status === "invited" &&
              oldRecord.user_id === userId;
            const isInvitationChange = isNewInvitation || wasInvitation;

            if (isInvitationChange) {
              console.log(
                "EventInvitationsSection: Reloading invitations due to real-time update - isNewInvitation:",
                isNewInvitation,
                "wasInvitation:",
                wasInvitation,
              );
              loadInvitations();
            } else {
              console.log(
                "EventInvitationsSection: Change is relevant but not invitation-related, ignoring",
              );
            }
          },
        )
        .subscribe((_status) => {
          // Silent subscription - no logging to avoid spam
        });
    };

    setupRealtime();

    return () => {
      if (channel) {
        import("../lib/supabase").then(({ supabase }) => {
          supabase.removeChannel(channel);
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleAccept = async (eventId: string) => {
    setAcceptingId(eventId);
    try {
      await acceptInvitation(eventId);
      setInvitations((prev) => prev.filter((inv) => inv.eventId !== eventId));
      alert("Invitation accepted! You are now part of the event.");
    } catch (error: any) {
      console.error("Error accepting invitation:", error);
      alert(error.message || "Failed to accept invitation");
    } finally {
      setAcceptingId(null);
    }
  };

  const handleDeny = async (eventId: string) => {
    setDenyingId(eventId);
    try {
      await denyInvitation(eventId);
      // Reload invitations from database to ensure consistency
      const updatedInvitations = await getUserInvitations();
      const filtered =
        updatedInvitations?.filter((inv) => {
          const event = getEvent(inv.eventId);
          if (!event || !user) return true;
          return !event.players.includes(user.id);
        }) || [];
      setInvitations(filtered);
      // No alert needed - invitation is just removed
    } catch (error: any) {
      console.error("Error denying invitation:", error);
      alert(error.message || "Failed to deny invitation");
    } finally {
      setDenyingId(null);
    }
  };

  if (loading || invitations.length === 0) {
    return null; // Don't show section if no invitations
  }

  return (
    <div className="px-4 py-3 border-b border-white/5 lg:px-5 lg:py-2.5">
      <div className="flex items-center justify-between mb-2 lg:mb-2">
        <h3 className="text-sm font-bold flex items-center gap-2 lg:text-sm lg:gap-2">
          Event Invitations
          <span className="px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 text-[10px] font-bold lg:text-[10px]">
            {invitations.length}
          </span>
        </h3>
      </div>
      <div className="space-y-2 lg:space-y-2">
        {invitations.map((invitation) => {
          const event = getEvent(invitation.eventId);
          if (!event) return null;

          return (
            <div
              key={invitation.id}
              className="bg-surface/50 p-2.5 rounded-lg border border-yellow-500/20 lg:p-2.5"
            >
              <div className="flex items-start justify-between gap-2 mb-2 lg:mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate lg:text-sm">
                    {event.title}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate lg:text-xs lg:mt-0.5">
                    {event.sport} •{" "}
                    {(() => {
                      const dateObj = new Date(event.date);
                      const monthShort = [
                        t("date.months.short.jan"),
                        t("date.months.short.feb"),
                        t("date.months.short.mar"),
                        t("date.months.short.apr"),
                        t("date.months.short.may"),
                        t("date.months.short.jun"),
                        t("date.months.short.jul"),
                        t("date.months.short.aug"),
                        t("date.months.short.sep"),
                        t("date.months.short.oct"),
                        t("date.months.short.nov"),
                        t("date.months.short.dec"),
                      ][dateObj.getMonth()];
                      return `${monthShort} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;
                    })()}{" "}
                    {t("events.at")} {event.time}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate lg:text-xs">
                    {event.location}
                  </p>
                </div>
              </div>
              <div className="flex gap-1.5 lg:gap-1.5">
                <button
                  onClick={() => handleAccept(invitation.eventId)}
                  disabled={
                    acceptingId === invitation.eventId ||
                    denyingId === invitation.eventId
                  }
                  className="flex-1 px-2.5 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg font-bold text-xs text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50 lg:px-2.5 lg:py-1.5 lg:text-xs"
                >
                  {acceptingId === invitation.eventId ? "..." : "Accept"}
                </button>
                <button
                  onClick={() => handleDeny(invitation.eventId)}
                  disabled={
                    acceptingId === invitation.eventId ||
                    denyingId === invitation.eventId
                  }
                  className="flex-1 px-2.5 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg font-bold text-xs text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50 lg:px-2.5 lg:py-1.5 lg:text-xs"
                >
                  {denyingId === invitation.eventId ? "..." : "Deny"}
                </button>
                <button
                  onClick={() => navigate(`/event/${invitation.eventId}`)}
                  className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg font-bold text-xs transition-colors lg:px-2.5 lg:py-1.5 lg:text-xs"
                >
                  View
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// User Profile View - read-only profile card for friends/other users
export const UserProfileView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, refreshUser } = useAuth();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [friendActionLoading, setFriendActionLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [avatarSignedUrl, setAvatarSignedUrl] = useState<string | null>(null);
  const [sports, setSports] = useState<Sport[]>([]);
  const [actualMatches, setActualMatches] = useState(0);
  const [averageSkill, setAverageSkill] = useState<string | null>(null);
  const [averageSatisfaction, setAverageSatisfaction] = useState<string | null>(
    null,
  );
  const [ratingCount, setRatingCount] = useState(0);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    setRequestSent(false);
    let cancelled = false;
    const load = async () => {
      try {
        const user = await userService.getUserProfile(id);
        if (!cancelled) {
          setProfileUser(user);
          if (user?.avatar) {
            const url = await resolveSignedAvatarUrl(user.avatar);
            if (!cancelled) setAvatarSignedUrl(url);
          }
        }
      } catch (e) {
        if (!cancelled) setProfileUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!profileUser?.id) return;
    let cancelled = false;
    const loadMatches = async () => {
      try {
        const { data: allEvents } = await supabase
          .from("events")
          .select("id, players");
        const eventsWithUser = (allEvents || []).filter(
          (e: any) =>
            e.players &&
            Array.isArray(e.players) &&
            e.players.includes(profileUser.id),
        );
        const { data: approved } = await supabase
          .from("event_requests")
          .select("event_id")
          .eq("user_id", profileUser.id)
          .eq("status", "approved");
        const eventIds = new Set([
          ...eventsWithUser.map((e: any) => e.id),
          ...(approved || []).map((r: any) => r.event_id),
        ]);
        if (!cancelled) setActualMatches(eventIds.size);
      } catch (_) {}
    };
    loadMatches();
    return () => {
      cancelled = true;
    };
  }, [profileUser?.id]);

  useEffect(() => {
    if (!profileUser?.id) return;
    let cancelled = false;
    const loadRatings = async () => {
      try {
        const ratings = await ratingService.getUserRatings(profileUser.id);
        if (cancelled) return;
        setRatingCount(ratings.length);
        if (ratings.length === 0) {
          setAverageSkill(null);
          setAverageSatisfaction(null);
          return;
        }
        const skillValues: number[] = [];
        ratings.forEach((r: any) => {
          if (r.skill === "newbie") skillValues.push(1);
          else if (r.skill === "intermediate") skillValues.push(3);
          else if (r.skill === "advanced") skillValues.push(5);
        });
        if (skillValues.length > 0) {
          const avg =
            skillValues.reduce((a, b) => a + b, 0) / skillValues.length;
          setAverageSkill(
            avg <= 2 ? "newbie" : avg >= 4 ? "advanced" : "intermediate",
          );
        }
        const satValues: number[] = [];
        ratings.forEach((r: any) => {
          if (r.satisfaction === "bad") satValues.push(1);
          else if (r.satisfaction === "ok") satValues.push(3);
          else if (r.satisfaction === "great") satValues.push(5);
        });
        if (satValues.length > 0) {
          const avg = satValues.reduce((a, b) => a + b, 0) / satValues.length;
          setAverageSatisfaction(avg <= 2 ? "bad" : avg >= 4 ? "great" : "ok");
        }
      } catch (_) {}
    };
    loadRatings();
    return () => {
      cancelled = true;
    };
  }, [profileUser?.id]);

  useEffect(() => {
    let cancelled = false;
    sportsService.getAllSports().then((list) => {
      if (!cancelled) setSports(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col bg-background min-h-screen pb-24 items-center justify-center">
        <p className="text-slate-400">{t("common.loading")}</p>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="flex flex-col bg-background min-h-screen pb-24 items-center justify-center px-4">
        <p className="text-slate-400 mb-4">{t("profile.userNotFound")}</p>
        <button
          onClick={() => navigate("/profile")}
          className="px-4 py-2 rounded-lg bg-primary text-white font-bold"
        >
          {t("common.back")}
        </button>
      </div>
    );
  }

  const isSelf = currentUser?.id === profileUser.id;
  const isFriend = Boolean(
    currentUser?.friends?.length &&
    currentUser.friends.includes(profileUser.id),
  );
  const isRequestSent =
    requestSent ||
    Boolean(
      profileUser.friendRequests?.length &&
      profileUser.friendRequests.includes(currentUser?.id ?? ""),
    );

  const handleUnfriend = async () => {
    if (
      !currentUser ||
      !profileUser ||
      !confirm(
        t("profile.removeFriendConfirm").replace(
          "{name}",
          `${profileUser.firstName} ${profileUser.lastName}`,
        ),
      )
    )
      return;
    setFriendActionLoading(true);
    try {
      await removeFriend(currentUser.id, profileUser.id);
      await refreshUser();
    } catch (error: any) {
      console.error("Error removing friend:", error);
      alert(error.message || t("profile.failedToRemoveFriend"));
    } finally {
      setFriendActionLoading(false);
    }
  };

  const handleAddFriend = async () => {
    if (!currentUser || !profileUser) return;
    setFriendActionLoading(true);
    try {
      await sendFriendRequest(currentUser.id, profileUser.id);
      setRequestSent(true);
      await refreshUser();
    } catch (error: any) {
      console.error("Error sending friend request:", error);
      alert(error.message || t("profile.failedToSendRequest"));
    } finally {
      setFriendActionLoading(false);
    }
  };

  const handleCancelFriendRequest = async () => {
    if (!currentUser || !profileUser) return;
    setFriendActionLoading(true);
    try {
      await denyFriendRequest(profileUser.id, currentUser.id);
      setRequestSent(false);
      setProfileUser((prev) =>
        prev
          ? {
              ...prev,
              friendRequests: (prev.friendRequests || []).filter(
                (id) => id !== currentUser.id,
              ),
            }
          : null,
      );
      await refreshUser();
    } catch (error: any) {
      console.error("Error canceling friend request:", error);
      alert(error.message || t("profile.failedToRemoveFriend"));
    } finally {
      setFriendActionLoading(false);
    }
  };

  const fullName =
    `${profileUser.firstName || ""} ${profileUser.lastName || ""}`.trim() ||
    t("common.user");
  const matches = actualMatches || profileUser.stats?.matches || 0;
  const reliability = profileUser.stats?.reliability ?? 100;
  const mvps = profileUser.stats?.mvps ?? 0;
  const level = profileUser.level || 1;
  const userTier =
    (profileUser.tier as Tier) ||
    (ratingCount >= 10 && averageSkill && averageSatisfaction
      ? calculateTier(averageSkill, averageSatisfaction, matches, reliability)
      : "bronze");
  const tierInfo = getTierInfo(userTier);

  return (
    <div className="flex flex-col bg-background min-h-screen pb-24 lg:pb-4">
      <header
        className={`sticky top-0 z-40 bg-surface/95 backdrop-blur-xl border-b px-4 py-2.5 flex justify-between items-center lg:px-5 lg:py-2 ${
          theme === "light" ? "border-slate-200" : "border-white/5"
        }`}
      >
        <button
          onClick={() => navigate("/profile")}
          className="w-9 h-9 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors lg:w-8 lg:h-8"
        >
          <span
            className={`material-symbols-outlined text-[20px] lg:text-lg ${
              theme === "light" ? "text-slate-800" : "text-white"
            }`}
          >
            arrow_back
          </span>
        </button>
        <h1
          className={`font-bold text-base lg:text-sm ${
            theme === "light" ? "text-slate-900" : "text-white"
          }`}
        >
          {fullName}
        </h1>
        <div className="w-9 lg:w-8" />
      </header>

      <div className="lg:max-w-4xl lg:mx-auto lg:w-full">
        <div className="mx-4 mt-4 mb-4 lg:mx-5 lg:mt-4 lg:mb-4 flex justify-center">
          <div
            className="relative rounded-2xl border-4 overflow-hidden w-full max-w-xs lg:max-w-[320px] lg:rounded-xl transition-all duration-75 ease-out shadow-2xl"
            style={
              theme === "light"
                ? {
                    background: "#f8fafc",
                    borderColor: `${tierInfo.colors.border}99`,
                    boxShadow: `0 10px 40px rgba(0, 0, 0, 0.08), 0 0 0 1px ${tierInfo.colors.border}40`,
                  }
                : {
                    background: `linear-gradient(to bottom right, ${tierInfo.colors.gradientFrom}, ${tierInfo.colors.gradientVia}, ${tierInfo.colors.gradientTo})`,
                    borderColor: `${tierInfo.colors.border}66`,
                    boxShadow: `0 10px 40px rgba(0, 0, 0, 0.5), 0 0 20px ${tierInfo.colors.primary}4D, 0 0 0 1px ${tierInfo.colors.border}33`,
                  }
            }
          >
            <div
              className={`absolute inset-0 pointer-events-none ${theme === "light" ? "bg-transparent" : "bg-slate-900/50"}`}
            />
            <div
              className={`absolute inset-0 pointer-events-none ${theme === "light" ? "bg-gradient-to-br from-white/40 via-transparent to-transparent" : "bg-gradient-to-br from-white/5 via-transparent to-black/10"}`}
            />

            <div
              className="relative px-3 pt-3 pb-1.5 border-b-2 lg:px-3 lg:pt-2.5 lg:pb-1.5"
              style={
                theme === "light"
                  ? {
                      borderColor: `${tierInfo.colors.border}60`,
                      background: `linear-gradient(to right, ${tierInfo.colors.primary}25, transparent, ${tierInfo.colors.primary}25)`,
                    }
                  : {
                      borderColor: `${tierInfo.colors.border}50`,
                      background: `linear-gradient(to right, ${tierInfo.colors.primary}40, transparent, ${tierInfo.colors.primary}40)`,
                    }
              }
            >
              <div className="flex items-center justify-between mb-2">
                <h2
                  className={`text-xl font-extrabold drop-shadow-lg lg:text-lg ${
                    theme === "light" ? "text-slate-900" : "text-white"
                  }`}
                >
                  {fullName}
                </h2>
                <div className="flex items-center gap-2">
                  <div
                    className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider lg:px-1.5 lg:py-0.5 lg:text-[8px]"
                    style={{
                      backgroundColor: tierInfo.colors.primary,
                      color: theme === "light" ? "#fff" : tierInfo.colors.text,
                    }}
                  >
                    {tierInfo.displayName}
                  </div>
                  <div
                    className="border-2 px-3 py-1 rounded-full flex items-center gap-1 shadow-lg lg:px-2.5 lg:py-0.5"
                    style={{
                      background: `linear-gradient(to right, ${tierInfo.colors.primary}, ${tierInfo.colors.secondary})`,
                      borderColor: tierInfo.colors.border,
                    }}
                  >
                    <span
                      className="material-symbols-outlined text-[14px] lg:text-xs"
                      style={{
                        color: theme === "light" ? "#fff" : tierInfo.colors.text,
                      }}
                    >
                      military_tech
                    </span>
                    <span
                      className="text-sm font-extrabold lg:text-xs"
                      style={{
                        color: theme === "light" ? "#fff" : tierInfo.colors.text,
                      }}
                    >
                      LV.{level}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2 min-h-[1.5rem] lg:gap-x-2.5 lg:mt-1.5 lg:min-h-[1.25rem]">
                {profileUser.userId && (
                  <div
                    className={`flex items-center gap-1.5 text-xs lg:text-[11px] ${theme === "light" ? "text-slate-600" : "text-slate-300"}`}
                  >
                    <span
                      className={theme === "light" ? "text-slate-500" : "text-slate-400"}
                    >
                      ID:
                    </span>
                    <code
                      className={`font-mono font-bold truncate max-w-[8rem] sm:max-w-[10rem] ${theme === "light" ? "text-amber-700" : "text-yellow-400"}`}
                    >
                      {profileUser.userId}
                    </code>
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(profileUser.userId!)
                      }
                      className="p-1 rounded transition-colors flex-shrink-0"
                      style={{
                        backgroundColor: `${tierInfo.colors.primary}33`,
                      }}
                      title="Copy user ID"
                    >
                      <span
                        className={`material-symbols-outlined text-sm lg:text-xs ${theme === "light" ? "text-amber-700" : "text-yellow-400"}`}
                      >
                        content_copy
                      </span>
                    </button>
                  </div>
                )}
                {profileUser.location && (
                  <div
                    className={`flex items-center gap-1 text-xs lg:text-[11px] min-w-0 ${theme === "light" ? "text-slate-600" : "text-slate-300"}`}
                  >
                    <span
                      className={`material-symbols-outlined flex-shrink-0 text-sm lg:text-xs ${theme === "light" ? "text-amber-700" : "text-yellow-400"}`}
                    >
                      location_on
                    </span>
                    <span className="truncate">{profileUser.location}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="relative px-3 py-4 lg:px-3 lg:py-3">
              <div className="flex justify-center">
                <div
                  className="relative w-52 h-52 rounded-xl border-2 bg-gradient-to-br from-slate-700 to-slate-900 p-0.5 shadow-2xl lg:w-48 lg:h-48 lg:rounded-lg"
                  style={{ borderColor: `${tierInfo.colors.border}80` }}
                >
                  <div
                    className="absolute inset-0 rounded-[10px] lg:rounded-[6px]"
                    style={{
                      background: `linear-gradient(to bottom right, ${tierInfo.colors.primary}33, transparent, ${tierInfo.colors.secondary}33)`,
                    }}
                  />
                  <div className="relative w-full h-full rounded-[10px] overflow-hidden bg-slate-800 lg:rounded-[6px]">
                    {avatarSignedUrl ? (
                      <img
                        src={avatarSignedUrl}
                        alt={fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : profileUser.avatar ? (
                      <div className="w-full h-full bg-slate-800" aria-hidden />
                    ) : profileUser.id ? (
                      <img
                        src={`https://i.pravatar.cc/150?u=${profileUser.id}`}
                        alt={fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-3 pb-3 space-y-2 lg:px-3 lg:pb-2.5 lg:space-y-1.5">
              <div className="text-center">
                <h3
                  className={`text-xs font-extrabold uppercase tracking-widest mb-1.5 lg:text-[10px] lg:mb-1 ${theme === "light" ? "text-amber-700" : "text-yellow-400"}`}
                >
                  {t("profile.matches")}
                </h3>
                <div
                  className={`rounded-lg border-2 p-2 lg:p-1.5 ${theme === "light" ? "bg-slate-100 border-slate-300" : "bg-slate-800/60"}`}
                  style={
                    theme !== "light"
                      ? { borderColor: `${tierInfo.colors.border}50` }
                      : undefined
                  }
                >
                  <div
                    className={`text-3xl font-extrabold drop-shadow-lg lg:text-2xl ${theme === "light" ? "text-amber-700" : "text-yellow-400"}`}
                  >
                    {matches}
                  </div>
                  <div
                    className={`text-[10px] uppercase tracking-wider mt-0.5 lg:text-[9px] ${theme === "light" ? "text-slate-700" : "text-white"}`}
                  >
                    Trận đấu
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 lg:gap-1.5">
                <div
                  className={`rounded-lg border-2 border-green-400/40 p-2 relative overflow-hidden lg:p-1.5 ${theme === "light" ? "bg-slate-100" : "bg-slate-800/60"}`}
                >
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-green-400 to-emerald-500" />
                  <div className="flex items-center gap-1.5 mb-1.5 lg:gap-1 lg:mb-1">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center lg:w-5 lg:h-5">
                      <span className="material-symbols-outlined text-white text-xs lg:text-[10px]">
                        verified
                      </span>
                    </div>
                    <div className="flex-1">
                      <div
                        className={`text-[10px] uppercase tracking-wider font-bold lg:text-[9px] ${theme === "light" ? "text-slate-700" : "text-white"}`}
                      >
                        {t("profile.reliability")}
                      </div>
                      <div className="text-xl font-extrabold text-green-400 lg:text-lg">
                        {reliability}%
                      </div>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500"
                      style={{ width: `${reliability}%` }}
                    />
                  </div>
                </div>
                <div
                  className={`rounded-lg border-2 border-purple-400/40 p-2 relative overflow-hidden lg:p-1.5 ${theme === "light" ? "bg-slate-100" : "bg-slate-800/60"}`}
                >
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-400 to-pink-500" />
                  <div className="flex items-center gap-1.5 mb-1.5 lg:gap-1 lg:mb-1">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center lg:w-5 lg:h-5">
                      <span className="material-symbols-outlined text-white text-xs lg:text-[10px]">
                        emoji_events
                      </span>
                    </div>
                    <div className="flex-1">
                      <div
                        className={`text-[10px] uppercase tracking-wider font-bold lg:text-[9px] ${theme === "light" ? "text-slate-700" : "text-white"}`}
                      >
                        {t("profile.mvps")}
                      </div>
                      <div className="text-xl font-extrabold text-purple-400 lg:text-lg">
                        {mvps}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`material-symbols-outlined text-base ${i < mvps ? "text-yellow-400" : theme === "light" ? "text-slate-400" : "text-slate-600"} lg:text-sm`}
                      >
                        star
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div
                className={`grid grid-cols-2 gap-2 pt-2 lg:gap-1.5 lg:pt-1.5 ${theme === "light" ? "border-t-2 border-slate-300" : "border-t-2 border-yellow-400/20"}`}
              >
                <div
                  className={`rounded-lg border-2 border-blue-400/30 p-2 flex flex-col items-center lg:p-1.5 ${theme === "light" ? "bg-slate-100" : "bg-slate-800/60"}`}
                >
                  <div className="flex items-center gap-1 mb-0.5 lg:gap-0.5 lg:mb-0.5">
                    <span className="material-symbols-outlined text-xs text-blue-400 lg:text-[10px]">
                      star
                    </span>
                    <span
                      className={`text-[10px] uppercase tracking-wider font-bold lg:text-[9px] ${theme === "light" ? "text-slate-700" : "text-white"}`}
                    >
                      {t("profile.averageSkill")}
                    </span>
                  </div>
                  {ratingCount >= 10 && averageSkill ? (
                    <span className="text-sm font-bold text-blue-400 lg:text-xs">
                      {t(`ratings.skillLevel.${averageSkill}`)}
                    </span>
                  ) : (
                    <span
                      className={`text-sm font-bold lg:text-xs ${theme === "light" ? "text-slate-700" : "text-white"}`}
                    >
                      {ratingCount === 0
                        ? t("profile.noRatings")
                        : ratingCount < 10
                          ? t("profile.notEnoughRatings")
                          : "-"}
                    </span>
                  )}
                </div>
                <div
                  className={`rounded-lg border-2 border-orange-400/30 p-2 flex flex-col items-center lg:p-1.5 ${theme === "light" ? "bg-slate-100" : "bg-slate-800/60"}`}
                >
                  <div className="flex items-center gap-1 mb-0.5 lg:gap-0.5 lg:mb-0.5">
                    <span className="material-symbols-outlined text-xs text-orange-400 lg:text-[10px]">
                      sentiment_neutral
                    </span>
                    <span
                      className={`text-[10px] uppercase tracking-wider font-bold lg:text-[9px] ${theme === "light" ? "text-slate-700" : "text-white"}`}
                    >
                      {t("profile.averageSatisfaction")}
                    </span>
                  </div>
                  {ratingCount >= 10 && averageSatisfaction ? (
                    <span className="text-sm font-bold lg:text-xs text-orange-600">
                      {t(`ratings.satisfactionLevel.${averageSatisfaction}`)}
                    </span>
                  ) : (
                    <span
                      className={`text-sm font-bold lg:text-xs ${theme === "light" ? "text-slate-700" : "text-white"}`}
                    >
                      {ratingCount === 0
                        ? t("profile.noRatings")
                        : ratingCount < 10
                          ? t("profile.notEnoughRatings")
                          : "-"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {profileUser.sports && profileUser.sports.length > 0 && (
          <div className="px-4 py-3 border-b border-white/5 lg:px-5 lg:py-2.5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 lg:text-xs lg:mb-2">
              Sports
            </h3>
            <div className="flex gap-2 overflow-x-auto no-scrollbar lg:gap-2">
              {profileUser.sports.map((sport, i) => {
                const sportData = sports.find((s) => s.name === sport);
                return (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 bg-surface/50 px-2.5 py-1.5 rounded-lg border border-white/5 flex-shrink-0 lg:px-2.5 lg:py-1.5 lg:gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary lg:text-base">
                      {sportData?.icon || "sports"}
                    </span>
                    <span className="text-xs font-medium text-slate-300 lg:text-xs">
                      {sport}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!isSelf && currentUser && (
          <div className="px-4 py-3 lg:px-5 lg:py-2.5">
            {isFriend ? (
              <button
                type="button"
                onClick={handleUnfriend}
                disabled={friendActionLoading}
                className="w-full py-2.5 rounded-lg font-bold text-sm border-2 border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 lg:py-2 lg:text-sm"
              >
                <span className="material-symbols-outlined text-[18px] lg:text-base">
                  person_remove
                </span>
                {friendActionLoading ? "..." : t("profile.unfriend")}
              </button>
            ) : isRequestSent ? (
              <button
                type="button"
                onClick={handleCancelFriendRequest}
                disabled={friendActionLoading}
                className="w-full py-2.5 rounded-lg font-bold text-sm border-2 border-slate-500/50 bg-slate-500/10 text-slate-300 hover:bg-slate-500/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 lg:py-2 lg:text-sm"
              >
                {friendActionLoading ? "..." : t("profile.cancelFriendRequest")}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAddFriend}
                disabled={friendActionLoading}
                className="w-full py-2.5 rounded-lg font-bold text-sm bg-primary text-white hover:bg-primary/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 lg:py-2 lg:text-sm"
              >
                <span className="material-symbols-outlined text-[18px] lg:text-base">
                  person_add
                </span>
                {friendActionLoading ? "..." : t("profile.sendFriendRequest")}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

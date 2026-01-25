import React, { useState, useEffect, lazy, Suspense, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Header, Avatar } from "../components/Layout";
import { RatingModal } from "../components/RatingModal";
import { useEvents } from "../context/EventContext";
import { useAuth } from "../context/AuthContext";
import { useMessages } from "../context/MessageContext";
import { useLanguage } from "../context/LanguageContext";
import { sportsService } from "../services/supabaseService";
import { userService } from "../services/userService";
import { ratingService } from "../services/ratings/ratingService";
import { Event, User } from "../types";

// Lazy load LocationPicker to avoid blocking form rendering
const LocationPicker = lazy(() =>
  import("../components/LocationPicker").then((module) => ({
    default: module.LocationPicker,
  }))
);

interface Sport {
  id: string;
  name: string;
  icon: string;
}

export const CreateEvent: React.FC = () => {
  const navigate = useNavigate();
  const { createEvent } = useEvents();
  useAuth();
  const { t } = useLanguage();
  const [title, setTitle] = useState("");
  const [sport, setSport] = useState("Tennis");
  const [sports, setSports] = useState<Sport[]>([]);
  const [sportsLoading, setSportsLoading] = useState(true);
  const [date, setDate] = useState("");

  // Format date to show day of week and dd/mm/yyyy format
  const getFormattedDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString + "T00:00:00"); // Add time to avoid timezone issues
    const dayNames = [
      t('date.days.sunday'),
      t('date.days.monday'),
      t('date.days.tuesday'),
      t('date.days.wednesday'),
      t('date.days.thursday'),
      t('date.days.friday'),
      t('date.days.saturday'),
    ];
    const dayName = dayNames[date.getDay()];
    const [year, month, day] = dateString.split("-");
    return `${dayName}, ${day}/${month}/${year}`;
  };
  // Short date format for input display: dd/mm/yyyy
  const getShortDate = (dateString: string) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const [time, setTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [showEndTime, setShowEndTime] = useState(false);
  const [duration, setDuration] = useState<number>(60); // Duration in minutes, default 60 (1 hour)
  const [location, setLocation] = useState("");
  const [, setLocationCoords] = useState<{
    lat?: number;
    lng?: number;
  }>({});
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [maxPlayersDisplay, setMaxPlayersDisplay] = useState<string>("10");
  const [competitive, setCompetitive] = useState(false);
  const [skillLevel, setSkillLevel] = useState<
    "Beginner" | "Intermediate" | "Advanced" | "All"
  >("All");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | undefined>(undefined);
  const [priceDisplay, setPriceDisplay] = useState<string>("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadSports = async () => {
      try {
        const sportsData = await sportsService.getAllSports();
        setSports(sportsData);
        // Set default sport to first sport (Tennis)
        if (sportsData.length > 0 && sport === "Tennis") {
          setSport(sportsData[0].name);
        }
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

  const getSportIcon = (sportName: string) => {
    const sport = sports.find((s) => s.name === sportName);
    if (sport) return sport.icon;
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

  const handleCreate = async () => {
    setError("");

    if (!title.trim()) {
      setError(t('events.validation.eventName'));
      return;
    }
    if (!date) {
      setError(t('events.validation.date'));
      return;
    }
    if (!time) {
      setError(t('events.validation.time'));
      return;
    }
    if (!location.trim()) {
      setError(t('events.validation.location'));
      return;
    }
    if (maxPlayers < 2) {
      setError(t('events.validation.minPlayers'));
      return;
    }

    setIsLoading(true);
    try {
      // Calculate endTime from duration if not explicitly set
      let calculatedEndTime = endTime;
      if (!calculatedEndTime && time && duration) {
        const [hours, minutes] = time.split(":").map(Number);
        const endDate = new Date();
        endDate.setHours(hours, minutes);
        endDate.setMinutes(endDate.getMinutes() + duration);
        calculatedEndTime = `${String(endDate.getHours()).padStart(2, "0")}:${String(endDate.getMinutes()).padStart(2, "0")}`;
      }
      
      const newEvent = await createEvent({
        title: title.trim(),
        sport,
        description: description.trim() || undefined,
        date,
        time,
        endTime: calculatedEndTime || undefined,
        location: location.trim(),
        maxPlayers,
        skillLevel,
        competitive,
        price: price !== undefined && price > 0 ? price : undefined,
      });
      navigate(`/event/created`, {
        state: { eventId: newEvent.id, event: newEvent },
      });
    } catch (err: any) {
      setError(err.message || t('events.failedToCreate'));
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex items-center justify-between px-4 py-3 bg-background/90 border-b border-white/10 lg:px-6 lg:py-2">
        <button
          onClick={() => navigate(-1)}
          className="text-primary font-medium text-sm lg:text-base"
        >
          {t('common.cancel')}
        </button>
        <h1 className="font-bold text-base lg:text-lg">{t('events.create')}</h1>
        <div className="w-10"></div>
      </div>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 w-full lg:p-6 lg:space-y-3">
        <div className="lg:max-w-2xl lg:mx-auto lg:w-full">
        {error && (
          <div className="p-2 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm lg:p-1.5 lg:text-xs">
            {error}
          </div>
        )}

        <div>
          <h2 className="text-base font-bold mb-2 lg:text-sm lg:mb-1.5">{t('events.sportType')}</h2>
          {sportsLoading ? (
            <div className="flex gap-3 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-white/10 text-slate-400 animate-pulse">
                <span className="material-symbols-outlined text-[20px]">
                  sports_tennis
                </span>
                <span className="font-medium">{t('common.loading')}</span>
              </div>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto no-scrollbar lg:gap-2">
              {sports.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSport(s.name)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg shrink-0 transition-all lg:px-3 lg:py-1.5 lg:gap-1.5 ${
                    sport === s.name
                      ? "bg-primary text-white shadow-primary/20"
                      : "bg-surface border border-white/10 text-slate-400"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px] lg:text-[18px]">
                    {s.icon || getSportIcon(s.name)}
                  </span>
                  <span className="font-medium text-sm lg:text-xs">{s.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3 lg:space-y-2">
          <div>
            <label className="text-xs font-medium text-slate-400 ml-1 mb-1 block lg:text-[11px] lg:mb-0.5">
              {t('events.eventName')}
            </label>
            <input
              type="text"
              placeholder="e.g. Downtown Hoop Session"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-surface rounded-xl px-3 h-10 outline-none border border-white/10 focus:border-primary transition-colors text-white text-sm lg:h-9 lg:px-2.5 lg:text-xs"
            />
          </div>

          <div>
            <h3 className="text-base font-bold mb-2 lg:text-sm lg:mb-1.5">{t('events.whenWhere')}</h3>
            <div className="bg-surface rounded-xl overflow-hidden border border-white/10 divide-y divide-white/5 lg:rounded-lg">
              <div className="flex items-center justify-between p-3 lg:p-2">
                <div className="flex items-center gap-2 lg:gap-1.5">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary lg:w-6 lg:h-6 lg:rounded">
                    <span className="material-symbols-outlined text-[18px] lg:text-[16px]">
                      calendar_today
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm lg:text-xs">{t('events.date')}</span>
                    {date && (
                      <span className="text-xs text-slate-500 lg:text-[10px]">
                        {getFormattedDate(date)}
                      </span>
                    )}
                  </div>
                </div>
                <div
                  className="relative cursor-pointer"
                  onClick={() => {
                    if (dateInputRef.current) {
                      // Prefer showPicker when supported, fallback to focus
                      // @ts-ignore - showPicker is not in older TS lib DOM types
                      if (dateInputRef.current.showPicker) {
                        // @ts-ignore
                        dateInputRef.current.showPicker();
                      } else {
                        dateInputRef.current.focus();
                      }
                    }
                  }}
                >
                  {/* Visible formatted date text / placeholder */}
                  <span className={`pointer-events-none absolute inset-y-0 left-0 flex items-center pr-2 text-sm lg:text-xs font-medium ${
                    date ? "text-primary" : "text-slate-500"
                  }`}>
                    {date ? getShortDate(date) : "dd/mm/yyyy"}
                  </span>
                  {/* Native date input (text hidden, used only for picker) */}
                  <input
                    ref={dateInputRef}
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="bg-transparent text-transparent font-medium outline-none text-sm lg:text-xs [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-datetime-edit]:text-transparent [&::-webkit-datetime-edit-year-field]:text-transparent [&::-webkit-datetime-edit-month-field]:text-transparent [&::-webkit-datetime-edit-day-field]:text-transparent"
                    style={{
                      colorScheme: "dark",
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 lg:p-2">
                <div className="flex items-center gap-2 lg:gap-1.5">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 lg:w-6 lg:h-6 lg:rounded">
                    <span className="material-symbols-outlined text-[18px] lg:text-[16px]">
                      schedule
                    </span>
                  </div>
                  <span className="font-medium text-sm lg:text-xs">{t('events.time')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => {
                      setTime(e.target.value);
                      // Update end time if duration is set
                      if (e.target.value && showEndTime && duration) {
                        const [hours, minutes] = e.target.value
                          .split(":")
                          .map(Number);
                        const endDate = new Date();
                        endDate.setHours(hours, minutes);
                        endDate.setMinutes(endDate.getMinutes() + duration);
                        setEndTime(
                          `${String(endDate.getHours()).padStart(
                            2,
                            "0"
                          )}:${String(endDate.getMinutes()).padStart(2, "0")}`
                        );
                      }
                    }}
                    className="bg-white/5 px-2 py-1 rounded text-sm text-white border-none outline-none lg:px-1.5 lg:py-0.5 lg:text-xs [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    style={{
                      colorScheme: "dark",
                    }}
                  />
                  {showEndTime && (
                    <>
                      <span className="text-slate-500 text-sm lg:text-xs">to</span>
                      <input
                        type="time"
                        className="bg-white/5 px-2 py-1 rounded text-sm text-white border-none outline-none lg:px-1.5 lg:py-0.5 lg:text-xs [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                        style={{
                          colorScheme: "dark",
                        }}
                        value={endTime}
                        onChange={(e) => {
                          setEndTime(e.target.value);
                          // Calculate duration from start and end time
                          if (time && e.target.value) {
                            const [startHours, startMinutes] = time
                              .split(":")
                              .map(Number);
                            const [endHours, endMinutes] = e.target.value
                              .split(":")
                              .map(Number);
                            const start = new Date();
                            start.setHours(startHours, startMinutes);
                            const end = new Date();
                            end.setHours(endHours, endMinutes);
                            // Handle next day case
                            if (end < start) {
                              end.setDate(end.getDate() + 1);
                            }
                            const diffMinutes = Math.round(
                              (end.getTime() - start.getTime()) / (1000 * 60)
                            );
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
                          const [hours, minutes] = time.split(":").map(Number);
                          const endDate = new Date();
                          endDate.setHours(hours, minutes);
                          endDate.setMinutes(endDate.getMinutes() + duration);
                          setEndTime(
                            `${String(endDate.getHours()).padStart(
                              2,
                              "0"
                            )}:${String(endDate.getMinutes()).padStart(2, "0")}`
                          );
                        } else {
                          // If no start time, set default duration
                          setDuration(60);
                        }
                      } else {
                        setEndTime("");
                      }
                    }}
                    className="inline-flex items-center px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 hover:text-primary-hover ml-2 lg:text-[10px] lg:ml-1"
                  >
                    {showEndTime ? t('events.remove') : t('events.addEndTime')}
                  </button>
                </div>
              </div>
              {showEndTime && (
                <div className="flex items-center justify-between p-3 border-t border-white/5 lg:p-2">
                  <div className="flex items-center gap-2 lg:gap-1.5">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 lg:w-6 lg:h-6 lg:rounded">
                      <span className="material-symbols-outlined text-[18px] lg:text-[16px]">
                        timer
                      </span>
                    </div>
                    <span className="font-medium text-sm lg:text-xs">{t('events.duration')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={duration}
                      onChange={(e) => {
                        const newDuration = parseInt(e.target.value);
                        setDuration(newDuration);
                        // Update end time based on duration
                        if (time) {
                          const [hours, minutes] = time.split(":").map(Number);
                          const endDate = new Date();
                          endDate.setHours(hours, minutes);
                          endDate.setMinutes(
                            endDate.getMinutes() + newDuration
                          );
                          setEndTime(
                            `${String(endDate.getHours()).padStart(
                              2,
                              "0"
                            )}:${String(endDate.getMinutes()).padStart(2, "0")}`
                          );
                        }
                      }}
                      className="bg-white/5 px-3 py-1 rounded text-sm text-white border-none outline-none lg:px-2 lg:py-0.5 lg:text-xs [&>option]:text-black [&>option]:bg-white"
                    >
                      <option value={30} className="text-black">
                        30 min
                      </option>
                      <option value={60} className="text-black">
                        1 hour
                      </option>
                      <option value={90} className="text-black">
                        1.5 hours
                      </option>
                      <option value={120} className="text-black">
                        2 hours
                      </option>
                      <option value={180} className="text-black">
                        3 hours
                      </option>
                      <option value={240} className="text-black">
                        4 hours
                      </option>
                      <option value={300} className="text-black">
                        5 hours
                      </option>
                      <option value={360} className="text-black">
                        6 hours
                      </option>
                      <option value={420} className="text-black">
                        7 hours
                      </option>
                      <option value={480} className="text-black">
                        8 hours
                      </option>
                      <option value={540} className="text-black">
                        9 hours
                      </option>
                      <option value={600} className="text-black">
                        10 hours
                      </option>
                    </select>
                  </div>
                </div>
              )}
              <div className="p-3 lg:p-2">
                <div className="flex justify-between items-center mb-2 lg:mb-1.5">
                  <div className="flex items-center gap-2 lg:gap-1.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 lg:w-6 lg:h-6 lg:rounded">
                      <span className="material-symbols-outlined text-[18px] lg:text-[16px]">
                        location_on
                      </span>
                    </div>
                    <span className="font-medium text-sm lg:text-xs">{t('events.location')}</span>
                  </div>
                </div>
                <Suspense
                  fallback={
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder={t('events.locationPlaceholder')}
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full bg-surface rounded-xl px-3 h-10 outline-none border border-white/10 focus:border-primary transition-colors text-white placeholder:text-slate-400 mb-2 text-sm"
                      />
                      <div className="rounded-lg overflow-hidden border border-white/10 h-28 bg-slate-800 flex items-center justify-center lg:h-24 lg:rounded">
                        <div className="text-center text-slate-400">
                          <span className="material-symbols-outlined text-2xl mb-1 block animate-pulse lg:text-xl">
                            map
                          </span>
                          <p className="text-xs lg:text-[10px]">{t('events.loadingMap')}</p>
                        </div>
                      </div>
                    </div>
                  }
                >
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
            <h3 className="text-base font-bold mb-2 lg:text-sm lg:mb-1.5">{t('events.details')}</h3>
            <div className="bg-surface rounded-xl p-3 border border-white/10 lg:rounded-lg lg:p-2">
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1 block lg:text-[11px] lg:mb-0.5">
                  {t('events.totalSpots')}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={maxPlayersDisplay}
                  onChange={(e) => {
                    const inputValue = e.target.value;

                    // Allow empty input for deletion
                    if (inputValue === "") {
                      setMaxPlayersDisplay("");
                      return;
                    }

                    // Only allow digits
                    const digitsOnly = inputValue.replace(/[^\d]/g, "");
                    if (digitsOnly === "") {
                      setMaxPlayersDisplay("");
                      return;
                    }

                    const value = parseInt(digitsOnly);
                    if (!isNaN(value)) {
                      setMaxPlayersDisplay(digitsOnly);
                      if (value >= 2 && value <= 50) {
                        setMaxPlayers(value);
                      } else if (value > 50) {
                        setMaxPlayers(50);
                        setMaxPlayersDisplay("50");
                      }
                    }
                  }}
                  onBlur={(e) => {
                    // Ensure value is within range on blur
                    const value = parseInt(e.target.value);
                    if (isNaN(value) || e.target.value === "" || value < 2) {
                      setMaxPlayers(2);
                      setMaxPlayersDisplay("2");
                    } else if (value > 50) {
                      setMaxPlayers(50);
                      setMaxPlayersDisplay("50");
                    } else {
                      setMaxPlayers(value);
                      setMaxPlayersDisplay(value.toString());
                    }
                  }}
                  className="w-full bg-white/5 px-3 py-1.5 rounded-lg text-white border border-white/10 focus:border-primary outline-none text-sm lg:px-2 lg:py-1 lg:text-xs"
                />
              </div>
              <div className="space-y-3 pt-3 border-t border-white/5 lg:space-y-2 lg:pt-2">
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1.5 block lg:text-[11px] lg:mb-1">
                    {t('events.skillLevel')}
                  </label>
                  <div className="grid grid-cols-2 gap-2 lg:gap-1.5">
                    {(
                      ["Beginner", "Intermediate", "Advanced", "All"] as const
                    ).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setSkillLevel(level)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors lg:px-2.5 lg:py-1.5 lg:text-xs ${
                          skillLevel === level
                            ? "bg-primary text-white"
                            : "bg-white/5 text-slate-400 hover:bg-white/10"
                        }`}
                      >
                        {t(`events.skillLevel.${level.toLowerCase()}`)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1.5 block lg:text-[11px] lg:mb-1">
                    {t('events.price')} ({t('common.optional')})
                  </label>
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
                        if (inputValue === "") {
                          setPriceDisplay("");
                          setPrice(undefined);
                          return;
                        }

                        // Remove all non-digit characters (including commas)
                        const rawValue = inputValue.replace(/[^\d]/g, "");

                        if (rawValue === "") {
                          setPriceDisplay("");
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
                          setPriceDisplay(price.toLocaleString("en-US"));
                        } else {
                          setPriceDisplay("");
                          setPrice(undefined);
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                      className="flex-1 bg-white/5 px-3 py-1.5 rounded-lg text-white border border-white/10 focus:border-primary outline-none cursor-text relative z-10 text-sm lg:px-2 lg:py-1 lg:text-xs"
                    />
                    <span className="text-slate-400 text-xs lg:text-[10px]">VND</span>
                    {price !== undefined && price > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setPrice(undefined);
                          setPriceDisplay("");
                        }}
                        className="text-slate-500 hover:text-white"
                      >
                        <span className="material-symbols-outlined text-[20px] lg:text-[16px]">
                          close
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between lg:gap-2">
                  <div>
                    <p className="font-medium text-sm lg:text-xs">{t('events.competitive')}</p>
                    <p className="text-xs text-slate-500 lg:text-[10px]">
                      {t('events.competitiveDescription')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCompetitive(!competitive)}
                    className={`w-12 h-7 rounded-full relative transition-colors lg:w-10 lg:h-6 ${
                      competitive ? "bg-primary" : "bg-white/10"
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform lg:top-0.5 lg:w-4 lg:h-4 ${
                        competitive ? "left-6 lg:left-5" : "left-1"
                      }`}
                    ></div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-base font-bold mb-2 lg:text-sm lg:mb-1.5">
              {t('events.description')}{" "}
              <span className="text-slate-500 text-xs font-normal lg:text-[10px]">
                ({t('common.optional')})
              </span>
            </h3>
            <div className="bg-surface rounded-xl p-3 border border-white/10 lg:rounded-lg lg:p-2">
              <textarea
                placeholder={t('events.descriptionPlaceholder')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-transparent text-white placeholder:text-slate-500 outline-none resize-none text-sm lg:text-xs lg:rows-2"
              />
            </div>
          </div>
        </div>
        </div>
      </main>

      <div className="p-3 bg-background border-t border-white/10 w-full lg:p-4">
        <div className="lg:max-w-2xl lg:mx-auto lg:w-full space-y-2">
          {error && (
            <div className="p-2 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm lg:p-1.5 lg:text-xs">
              {error}
            </div>
          )}
          <button
            onClick={handleCreate}
            disabled={isLoading}
            className="w-full h-12 bg-primary disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-base shadow-lg shadow-primary/20 flex items-center justify-center gap-2 lg:h-10 lg:text-sm"
          >
            <span className="material-symbols-outlined lg:text-[18px]">add_circle</span>
            {isLoading ? t('events.creating') : t('events.create')}
          </button>
        </div>
      </div>
    </div>
  );
};

export const EventCreated: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { getEvent, events } = useEvents();
  const [event, setEvent] = useState<Event | null>(
    (location.state as any)?.event || null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
      let eventData = getEvent(eventId);

      if (eventData) {
        setEvent(eventData);
        setIsLoading(false);
        return;
      } else {
        // If not found, wait a bit and try again (events might still be loading)
        const timeout = setTimeout(() => {
          const data = getEvent(eventId);
          if (data) setEvent(data);
          setIsLoading(false);
        }, 500);
        return () => clearTimeout(timeout);
      }
    } else {
      setIsLoading(false);
      return;
    }
  }, [location.state, getEvent, events]);

  const spotsLeft = event ? event.maxPlayers - event.currentPlayers : 0;

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? t("date.time.pm") : t("date.time.am");
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatEventDate = (dateString: string, timeString: string, endTime?: string) => {
    const eventDate = new Date(`${dateString}T${timeString}`);
    const now = new Date();
    const diff = eventDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    const timeStr = endTime
      ? `${formatTime(timeString)} - ${formatTime(endTime)}`
      : formatTime(timeString);
    
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
    
    const dateObj = new Date(dateString);
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

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-background justify-center items-center">
        <div className="text-white">{t('common.loading')}</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col h-screen bg-background justify-center items-center">
        <div className="text-white">{t('events.eventNotFound')}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background justify-between pb-10 pt-10 px-6 lg:pb-4 lg:pt-4 lg:px-8 xl:pb-6 xl:pt-6">
      <div className="lg:max-w-3xl lg:mx-auto lg:w-full">
      <div className="flex flex-col items-center text-center lg:mb-4">
        <div className="w-20 h-20 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-primary/30 mb-6 relative lg:w-10 lg:h-10 lg:mb-2 xl:w-12 xl:h-12 xl:mb-2.5">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
          <span className="material-symbols-outlined text-4xl lg:text-xl xl:text-2xl">
            check_circle
          </span>
        </div>
        <h1 className="text-4xl font-extrabold mb-2 lg:text-lg lg:mb-0.5 xl:text-xl xl:mb-1">{t('events.eventCreated.gameOn')}</h1>
        <p className="text-slate-400 mb-4 lg:text-xs lg:mb-2 xl:text-xs xl:mb-2.5">
          {t('events.eventCreated.successMessage')}
        </p>
        {event?.code && (
          <div className="bg-primary/10 border-2 border-primary/30 rounded-xl px-6 py-4 mb-4 lg:px-2.5 lg:py-1.5 lg:mb-2 lg:rounded-lg lg:border lg:border-primary/30 xl:px-3 xl:py-2 xl:mb-2.5">
          <p className="text-xs text-slate-400 mb-2 lg:text-[9px] lg:mb-0.5 xl:text-[10px] xl:mb-1">{t('events.eventCode')}</p>
          <div className="flex items-center gap-3 lg:gap-1.5 xl:gap-2">
            <code className="text-2xl font-bold text-primary tracking-wider lg:text-base xl:text-lg">
              {event.code}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(event.code);
                // You could add a toast notification here
              }}
              className="p-2 rounded-lg bg-primary/20 hover:bg-primary/30 transition-colors lg:p-0.5 lg:rounded-md xl:p-1"
              title={t('events.eventCreated.copyCode')}
            >
              <span className="material-symbols-outlined text-sm lg:text-xs xl:text-xs">
                content_copy
              </span>
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2 lg:text-[9px] lg:mt-0.5 xl:text-[10px] xl:mt-1">
            {t('events.shareCode')}
          </p>
        </div>
        )}
      </div>

      <div className="w-full bg-surface border border-white/10 rounded-xl overflow-hidden shadow-2xl lg:rounded-lg">
        {event.image && (
          <div className="h-40 relative lg:h-24 xl:h-28">
            <img
              src={event.image}
              className="w-full h-full object-cover"
              alt={event.title}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent"></div>
            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur px-3 py-1 rounded-full flex items-center gap-1 border border-white/10 lg:top-2 lg:right-2 lg:px-2 lg:py-0.5 xl:top-2.5 xl:right-2.5 xl:px-2.5">
              <span className="material-symbols-outlined text-green-400 text-xs lg:text-[10px] xl:text-xs">
                group
              </span>
              <span className="text-[10px] font-bold uppercase lg:text-[9px] xl:text-[10px]">
                {spotsLeft > 0
                  ? `${spotsLeft} ${spotsLeft === 1 ? t('events.spot') : t('events.spots')} ${t('events.open')}`
                  : t('events.full')}
              </span>
            </div>
          </div>
        )}
        <div className="p-5 space-y-4 lg:p-3 lg:space-y-2 xl:p-4 xl:space-y-3">
          {!event.image && (
            <div className="flex justify-end mb-2 lg:mb-1 xl:mb-1.5">
              <div className="bg-black/60 backdrop-blur px-3 py-1 rounded-full flex items-center gap-1 border border-white/10 lg:px-2 lg:py-0.5 xl:px-2.5">
                <span className="material-symbols-outlined text-green-400 text-xs lg:text-[10px] xl:text-xs">
                  group
                </span>
                <span className="text-[10px] font-bold uppercase lg:text-[9px] xl:text-[10px]">
                  {spotsLeft > 0
                    ? `${spotsLeft} ${spotsLeft === 1 ? t('events.spot') : t('events.spots')} ${t('events.open')}`
                    : t('events.full')}
                </span>
              </div>
            </div>
          )}
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold leading-tight lg:text-sm lg:leading-snug xl:text-base">
                {event.title}
              </h2>
              <p className="text-primary text-sm lg:text-xs xl:text-sm">{event.sport}</p>
            </div>
            {event.competitive && (
              <div className="bg-gradient-to-r from-yellow-400 to-green-400 p-[1px] rounded-lg lg:rounded-md">
                <div className="bg-black/80 px-2 py-1 rounded-[7px] lg:px-1.5 lg:py-0.5 xl:px-2 xl:py-1">
                  <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-green-400 lg:text-[10px] xl:text-xs">
                    {event.skillLevel.toUpperCase()}
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="border-t border-white/10 pt-4 space-y-3 lg:pt-2 lg:space-y-2 xl:pt-3 xl:space-y-2.5">
            <div className="flex items-center gap-3 lg:gap-2 xl:gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 lg:w-6 lg:h-6 xl:w-7 xl:h-7">
                <span className="material-symbols-outlined text-sm lg:text-xs xl:text-sm">
                  calendar_month
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-400 lg:text-[10px] xl:text-xs">{t('events.dateTime')}</p>
                <p className="font-medium text-sm lg:text-xs xl:text-sm">{formatEventDate(event.date, event.time, event.endTime)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 lg:gap-2 xl:gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 lg:w-6 lg:h-6 xl:w-7 xl:h-7">
                <span className="material-symbols-outlined text-sm lg:text-xs xl:text-sm">
                  location_on
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-400 lg:text-[10px] xl:text-xs">{t('events.location')}</p>
                <p className="font-medium text-sm lg:text-xs xl:text-sm">{event.location}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/5 rounded-lg p-3 flex items-center justify-between lg:p-2 xl:p-2.5">
        <div className="flex items-center gap-3 lg:gap-2 xl:gap-2.5">
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs ring-2 ring-background lg:w-6 lg:h-6 lg:text-[10px] xl:w-7 xl:h-7">
              +
            </div>
          </div>
          <span className="text-sm font-medium lg:text-xs xl:text-sm">{t('events.eventCreated.inviteCrew')}</span>
        </div>
        <button 
          onClick={() => event && navigate(`/event/${event.id}`)}
          className="w-8 h-8 rounded-full bg-primary flex items-center justify-center lg:w-6 lg:h-6 xl:w-7 xl:h-7"
        >
          <span className="material-symbols-outlined text-sm lg:text-xs xl:text-sm">
            arrow_forward
          </span>
        </button>
      </div>

      <div className="space-y-3 w-full lg:space-y-2 xl:space-y-2.5">
        {event && (
          <button
            onClick={() => navigate(`/event/${event.id}`)}
            className="w-full py-4 bg-primary rounded-xl font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 lg:py-2 lg:text-xs lg:rounded-lg xl:py-2.5 xl:text-sm"
          >
            <span className="material-symbols-outlined lg:text-base xl:text-lg">visibility</span> {t('events.eventCreated.viewEventDetails')} {t('events.eventDetails')}
          </button>
        )}
        <button
          onClick={() => navigate("/home")}
          className="w-full py-4 bg-transparent border border-white/20 rounded-xl font-medium hover:bg-white/5 lg:py-2 lg:text-xs lg:rounded-lg xl:py-2.5 xl:text-sm"
        >
          {t('events.eventCreated.returnToDashboard')}
        </button>
      </div>
      </div>
    </div>
  );
};

export const OrganizerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getEvent, approveRequest, denyRequest, getEventRequests, inviteFriendToEvent, getEventInvitations } =
    useEvents();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [event, setEvent] = useState<Event | null>(null);
  const [players, setPlayers] = useState<User[]>([]);
  const [pendingRequestUsers, setPendingRequestUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [friends, setFriends] = useState<User[]>([]);
  const [invitingFriendId, setInvitingFriendId] = useState<string | null>(null);
  const [invitedFriendIds, setInvitedFriendIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"pending" | "confirmed">("confirmed");

  const loadEventData = async () => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    try {
      // Always fetch fresh data from database first
      const { eventService } = await import("../services/supabaseService");
      const dbEvent = await eventService.getEvent(id);
      
      if (dbEvent) {
        // Update event state, but be smart about optimistic updates
        setEvent((prevEvent) => {
          if (prevEvent) {
            // If database has fewer players, always use database (player left)
            if (dbEvent.players.length < prevEvent.players.length) {
              console.log('Player left detected, updating from database');
              loadPlayers(dbEvent.players);
              return dbEvent;
            }
            // If database has more players, use database (player joined)
            if (dbEvent.players.length > prevEvent.players.length) {
              console.log('Player joined detected, updating from database');
              loadPlayers(dbEvent.players);
              return dbEvent;
            }
            // If same number of players, check if the arrays are different
            // (in case of reordering or different players)
            const prevPlayerSet = new Set(prevEvent.players);
            const dbPlayerSet = new Set(dbEvent.players);
            const areEqual = prevEvent.players.length === dbEvent.players.length &&
              prevEvent.players.every(id => dbPlayerSet.has(id)) &&
              dbEvent.players.every(id => prevPlayerSet.has(id));
            
            if (!areEqual) {
              console.log('Players changed (same count but different), updating from database');
              loadPlayers(dbEvent.players);
              return dbEvent;
            }
            // Arrays are the same, keep current state but ensure players are loaded
            loadPlayers(dbEvent.players);
            return prevEvent;
          }
          // No previous event, use the new one
          loadPlayers(dbEvent.players);
          return dbEvent;
        });

        loadPendingRequestsForEvent(id);
      } else {
        // Fallback to context if database doesn't have it
        const eventData = getEvent(id);
        if (eventData) {
          setEvent(eventData);
          loadPlayers(eventData.players);
          loadPendingRequestsForEvent(id);
        }
      }
    } catch (error) {
      console.error('Error loading event:', error);
      // Fallback to context
      const eventData = getEvent(id);
      if (eventData) {
        setEvent(eventData);
        loadPlayers(eventData.players);
        loadPendingRequestsForEvent(id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;

    loadEventData();
    
    // Set up real-time subscription for event updates
    let channel: any = null;
    const setupRealtime = async () => {
      const { supabase } = await import("../lib/supabase");
      channel = supabase
        .channel(`event:${id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'events',
            filter: `id=eq.${id}`,
          },
          (payload) => {
            console.log('Real-time event update received:', payload);
            // Reload event data when it's updated
            loadEventData();
          }
        )
        .subscribe((status) => {
          console.log('Real-time subscription status for event:', status);
        });
    };
    setupRealtime();

    return () => {
      // Clean up real-time subscription
      import("../lib/supabase").then(({ supabase }) => {
        if (channel) {
          supabase.removeChannel(channel);
        }
      });
    };
  }, [id, getEvent, getEventRequests]);

  const loadPlayers = async (playerIds: string[]) => {
    if (playerIds.length === 0) {
      setPlayers([]);
      return;
    }

    try {
      const playerProfiles = await userService.getUsers(playerIds);
      setPlayers(playerProfiles);
    } catch (error) {
      console.error("Error loading players:", error);
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

      const userIds = requests.map((r) => r.userId);
      const requestProfiles = await userService.getUsers(userIds);
      setPendingRequestUsers(requestProfiles);
    } catch (error) {
      console.error("Error loading pending requests:", error);
      setPendingRequestUsers([]);
    }
  };

  // Load friends and invitations when invite modal opens
  useEffect(() => {
    const loadFriendsAndInvitations = async () => {
      if (!showInviteModal || !user || !user.friends || user.friends.length === 0 || !id) {
        setFriends([]);
        setInvitedFriendIds(new Set());
        return;
      }

      try {
        // Load friends
        const friendUsers = await Promise.all(
          user.friends.map(async (friendId) => {
            try {
              return await userService.getUserProfile(friendId);
            } catch {
              return null;
            }
          })
        );
        setFriends(friendUsers.filter((u): u is User => u !== null));

        // Load existing invitations for this event
        const invitations = await getEventInvitations(id);
        const invitedIds = new Set(invitations.map(inv => inv.userId));
        setInvitedFriendIds(invitedIds);
      } catch (error) {
        console.error('Error loading friends and invitations:', error);
        setFriends([]);
        setInvitedFriendIds(new Set());
      }
    };

    loadFriendsAndInvitations();
  }, [showInviteModal, user, id, getEventInvitations]);

  const handleInviteFriend = async (friendId: string) => {
    if (!event || !id || !user) return;

    // Check if event is past
    const now = new Date();
    const eventDateTime = new Date(`${event.date}T${event.time}`);
    const eventEndTime = event.endTime ? new Date(`${event.date}T${event.endTime}`) : null;
    const isPast = eventEndTime ? eventEndTime < now : eventDateTime < now;

    if (isPast) {
      alert(t('events.cannotInvitePast'));
      return;
    }

    setInvitingFriendId(friendId);
    try {
      await inviteFriendToEvent(id, friendId);
      // Update state to show "Invited" status
      setInvitedFriendIds(prev => new Set([...prev, friendId]));
    } catch (error: any) {
      console.error('Error inviting friend:', error);
      alert(error.message || t('events.failedToInvite'));
    } finally {
      setInvitingFriendId(null);
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
        status:
          updatedPlayers.length >= event.maxPlayers ? "full" : event.status,
      };
      setEvent(updatedEvent);
      loadPlayers(updatedPlayers);

      // Remove from pending requests optimistically
      const updatedPendingUsers = pendingRequestUsers.filter(
        (u) => u.id !== userId
      );
      setPendingRequestUsers(updatedPendingUsers);

      // Call the approve function
      await approveRequest(id, userId);

      // Reload directly from database to ensure we have the latest data
      const checkAndUpdate = async (attempts = 0) => {
        try {
          const { eventService } = await import("../services/supabaseService");
          const dbEvent = await eventService.getEvent(id);

          if (dbEvent && dbEvent.players.includes(userId)) {
            console.log(
              "OrganizerDashboard: Player found in database after approval"
            );
            setEvent(dbEvent);
            await loadPlayers(dbEvent.players);
            await loadPendingRequestsForEvent(id);
          } else if (attempts < 10) {
            // Try again after a delay
            setTimeout(() => checkAndUpdate(attempts + 1), 300);
          } else {
            console.warn(
              "OrganizerDashboard: Player not found after multiple attempts"
            );
            // Fallback to context
            const contextEvent = getEvent(id);
            if (contextEvent) {
              setEvent(contextEvent);
              await loadPlayers(contextEvent.players);
            }
            await loadPendingRequestsForEvent(id);
          }
        } catch (error) {
          console.error("OrganizerDashboard: Error checking update:", error);
          if (attempts < 5) {
            setTimeout(() => checkAndUpdate(attempts + 1), 300);
          }
        }
      };

      // Start checking immediately
      setTimeout(() => checkAndUpdate(), 500);
    } catch (error: any) {
      console.error("Error approving request:", error);
      // Revert optimistic update on error
      const originalEvent = getEvent(id) || event;
      setEvent(originalEvent);
      loadPlayers(originalEvent.players);
      loadPendingRequestsForEvent(id);
      const errorMessage =
        error?.message || error?.toString() || "Failed to approve request";
      alert(`${t('events.failedToApprove')}: ${errorMessage}`);
    }
  };

  const handleDeny = async (userId: string) => {
    if (!event || !id) return;
    try {
      await denyRequest(id, userId);
      // Reload pending requests
      loadPendingRequestsForEvent(id);
    } catch (error) {
      console.error("Error denying request:", error);
      alert(t('events.failedToDeny'));
    }
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? t('date.time.pm') : t('date.time.am');
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background pb-20 items-center justify-center">
        <div className="text-white">{t('common.loading')}</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col min-h-screen bg-background pb-20 items-center justify-center">
        <div className="text-white">{t('events.eventNotFound')}</div>
        <button onClick={() => navigate(-1)} className="mt-4 text-primary">
          {t('events.goBack')}
        </button>
      </div>
    );
  }

  const spotsLeft = event.maxPlayers - event.currentPlayers;

  // Check if event is past
  const isEventPast = () => {
    const now = new Date();
    const eventDateTime = new Date(`${event.date}T${event.time}`);
    const eventEndTime = event.endTime ? new Date(`${event.date}T${event.endTime}`) : null;
    
    // If event has an end time, check if it has ended
    if (eventEndTime) {
      return eventEndTime < now;
    }
    // If no end time, check if start time has passed
    return eventDateTime < now;
  };

  const formatTimeRange = (time: string, endTime?: string) => {
    if (endTime) {
      return `${formatTime(time)} - ${formatTime(endTime)}`;
    }
    return formatTime(time);
  };

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    const days = [
      t('date.days.sunday'),
      t('date.days.monday'),
      t('date.days.tuesday'),
      t('date.days.wednesday'),
      t('date.days.thursday'),
      t('date.days.friday'),
      t('date.days.saturday'),
    ];
    const months = [
      t('date.months.january'),
      t('date.months.february'),
      t('date.months.march'),
      t('date.months.april'),
      t('date.months.may'),
      t('date.months.june'),
      t('date.months.july'),
      t('date.months.august'),
      t('date.months.september'),
      t('date.months.october'),
      t('date.months.november'),
      t('date.months.december'),
    ];
    const dayName = days[date.getDay()];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${dayName}, ${day} ${month} ${year}`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 lg:pb-4">
      <div className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md">
        <div className="flex items-center justify-between px-3 py-2 lg:px-4 lg:py-1.5">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center lg:w-7 lg:h-7"
          >
            <span className="material-symbols-outlined text-base lg:text-sm">
              arrow_back_ios_new
            </span>
          </button>
          <div className="flex gap-1.5 lg:gap-1">
            <button className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-primary lg:w-7 lg:h-7">
              <span className="material-symbols-outlined text-base lg:text-sm">share</span>
            </button>
            <button
              onClick={() => navigate(`/event/edit/${event.id}`)}
              className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-primary lg:w-7 lg:h-7"
            >
              <span className="material-symbols-outlined text-base lg:text-sm">edit</span>
            </button>
          </div>
        </div>
        <div className="px-4 pb-3 lg:px-6 lg:pb-2">
          <div className="lg:max-w-4xl lg:mx-auto lg:w-full">
          <div className="flex gap-1.5 mb-2 flex-wrap">
            <span className="px-2 py-1 rounded-lg text-xs font-bold bg-primary/20 text-primary border border-primary/30">
              {event.sport}
            </span>
            {event.code && (
              <span className="px-2 py-1 rounded-lg text-xs font-bold bg-primary/20 text-primary border border-primary/30 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">tag</span>
                {event.code}
              </span>
            )}
            {event.skillLevel !== "All" && (
              <span className="px-2 py-1 rounded-lg text-xs font-bold bg-surface border border-white/10 text-slate-300">
                {t(`events.skillLevel.${event.skillLevel.toLowerCase()}`)}
              </span>
            )}
            {event.competitive && (
              <span className="px-2 py-1 rounded-lg text-xs font-bold bg-gradient-to-br from-yellow-400 to-green-400 text-black">
                {t('events.competitive')}
              </span>
            )}
          </div>
          <h1 className="text-xl font-extrabold leading-tight mb-3 text-white lg:text-lg lg:mb-2">
            {event.title}
          </h1>
          <div className="space-y-2 lg:space-y-1.5">
            <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-lg px-3 py-2 lg:px-2.5 lg:py-1.5 lg:rounded">
              <span className="material-symbols-outlined text-base text-primary lg:text-sm">calendar_month</span>
              <div className="flex-1">
                <div className="text-sm font-bold text-white lg:text-xs">{formatFullDate(event.date)}</div>
                <div className="text-xs text-slate-300 lg:text-[11px]">{formatTimeRange(event.time, event.endTime)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-surface border border-white/10 rounded-lg px-3 py-2 lg:px-2.5 lg:py-1.5 lg:rounded">
              <span className="material-symbols-outlined text-base text-slate-400 lg:text-sm">location_on</span>
              <div className="flex-1">
                <div className="text-sm font-semibold text-white lg:text-xs">{event.location}</div>
                {event.locationDetails && (
                  <div className="text-xs text-slate-400 mt-0.5 lg:text-[11px] lg:mt-0">{event.locationDetails}</div>
                )}
              </div>
            </div>
            {event.price && event.price > 0 && (
              <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 lg:px-2.5 lg:py-1.5 lg:rounded">
                <span className="material-symbols-outlined text-base text-green-400 lg:text-sm">payments</span>
                <div className="flex-1">
                  <div className="text-sm font-bold text-green-400 lg:text-xs">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(event.price)}
                  </div>
                  <div className="text-xs text-slate-400 lg:text-[11px]">{t('events.eventFee')}</div>
                </div>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3 lg:p-6 lg:space-y-2">
        <div className="lg:max-w-4xl lg:mx-auto lg:w-full">
        {/* Tab Navigation with Roster Info */}
        <div className="bg-surface border border-white/5 rounded-xl p-3 lg:rounded-lg lg:p-2">
          <div className="flex items-center justify-between mb-3 lg:mb-2">
            <div className="flex items-center gap-2 lg:gap-1.5">
              <span className="text-xs text-slate-400 lg:text-[11px]">{t('events.roster')}:</span>
              <span className="text-sm font-bold lg:text-xs">
                {event.currentPlayers}/{event.maxPlayers}
              </span>
              {spotsLeft > 0 && (
                <span className="text-[10px] text-slate-500 lg:text-[9px]">
                  ({spotsLeft} {spotsLeft === 1 ? t('events.spot') : t('events.spots')} {t('events.left')})
                </span>
              )}
            </div>
            {spotsLeft > 0 && !isEventPast() && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg flex items-center gap-1.5 transition-colors text-xs lg:px-2.5 lg:py-1 lg:text-[11px] lg:rounded"
              >
                <span className="material-symbols-outlined text-sm lg:text-xs">
                  ios_share
                </span>
                {t('events.invite')}
              </button>
            )}
          </div>
          <div className="flex gap-1.5 lg:gap-1">
            <button
              onClick={() => setActiveTab("confirmed")}
              className={`flex-1 px-3 py-2 rounded-lg font-bold text-xs transition-all lg:px-2.5 lg:py-1.5 lg:text-[11px] lg:rounded ${
                activeTab === "confirmed"
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "bg-white/5 text-slate-400 hover:bg-white/10"
              }`}
            >
              {t('events.confirmed')}
              {event.currentPlayers > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] lg:ml-1 lg:px-1 lg:py-0 lg:text-[9px] ${
                  activeTab === "confirmed"
                    ? "bg-white/20 text-white"
                    : "bg-primary/20 text-primary"
                }`}>
                  {event.currentPlayers}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`flex-1 px-3 py-2 rounded-lg font-bold text-xs transition-all lg:px-2.5 lg:py-1.5 lg:text-[11px] lg:rounded ${
                activeTab === "pending"
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "bg-white/5 text-slate-400 hover:bg-white/10"
              }`}
            >
              {t('events.pending')}
              {pendingRequestUsers.length > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] lg:ml-1 lg:px-1 lg:py-0 lg:text-[9px] ${
                  activeTab === "pending"
                    ? "bg-white/20 text-white"
                    : "bg-primary/20 text-primary"
                }`}>
                  {pendingRequestUsers.length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div>

          {/* Tab Content */}
          {activeTab === "pending" ? (
            <div className="space-y-2">
                {pendingRequestUsers.length === 0 ? (
                  <div className="bg-surface p-3 rounded-xl border border-white/5 text-center text-slate-400 text-xs lg:rounded-lg lg:p-2 lg:text-[11px]">
                    {t('events.noPendingRequests')}
                  </div>
                ) : (
                  pendingRequestUsers.map((requestUser) => (
                    <div
                      key={requestUser.id}
                      className="bg-surface p-3 rounded-xl border border-white/5 flex items-center justify-between lg:rounded-lg lg:p-2"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar
                          src={
                            requestUser.avatar ||
                            `https://i.pravatar.cc/150?u=${requestUser.id}`
                          }
                          size="w-8 h-8"
                        />
                        <div>
                          <p className="font-semibold text-xs lg:text-[11px]">
                            {requestUser.firstName} {requestUser.lastName}
                          </p>
                          <p className="text-[10px] text-slate-400 lg:text-[9px]">
                            Level {requestUser.level}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1.5 lg:gap-1">
                        <button
                          onClick={() => handleApprove(requestUser.id)}
                          className="px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg font-bold text-green-400 hover:bg-green-500/20 transition-colors text-xs lg:px-2.5 lg:py-1 lg:text-[11px] lg:rounded"
                        >
                          {t('events.approve')}
                        </button>
                        <button
                          onClick={() => handleDeny(requestUser.id)}
                          className="px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg font-bold text-red-400 hover:bg-red-500/20 transition-colors text-xs lg:px-2.5 lg:py-1 lg:text-[11px] lg:rounded"
                        >
                          {t('events.deny')}
                        </button>
                      </div>
                    </div>
                  ))
                )}
            </div>
          ) : (
            <div>
              {players.length > 0 && (
                <div className="flex justify-end mb-2">
                  <button className="text-xs text-primary font-bold flex items-center gap-1 hover:text-primary-hover transition-colors">
                    <span className="material-symbols-outlined text-sm">
                      chat
                    </span>
                    {t('events.messageAll')}
                  </button>
                </div>
              )}
              <div className="bg-surface rounded-xl border border-white/5 divide-y divide-white/5 lg:rounded-lg">
                {players.length === 0 ? (
                  <div className="p-3 text-center text-slate-400 text-xs lg:p-2 lg:text-[11px]">
                    {t('events.noPlayersYet')}
                  </div>
                ) : (
                  players.slice(0, 4).map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-3 lg:p-2"
                    >
                      <div className="flex items-center gap-2 lg:gap-1.5">
                        <Avatar
                          src={
                            player.avatar ||
                            `https://i.pravatar.cc/150?u=${player.id}`
                          }
                          size="w-8 h-8 lg:w-7 lg:h-7"
                        />
                        <div>
                          <p className="font-semibold text-xs lg:text-[11px]">
                            {player.firstName} {player.lastName}
                          </p>
                          <p className="text-[10px] text-slate-400 lg:text-[9px]">
                            Level {player.level}
                          </p>
                        </div>
                      </div>
                      <div className="px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 bg-green-500/10 text-green-500 lg:px-1 lg:py-0 lg:text-[9px]">
                        <span className="material-symbols-outlined text-xs lg:text-[10px]">
                          check_circle
                        </span>
                        {t('events.confirmed')}
                      </div>
                    </div>
                  ))
                )}
              </div>
              {players.length > 4 && (
                <button className="w-full py-2 text-primary font-bold text-xs mt-2 lg:py-1.5 lg:text-[11px] lg:mt-1.5">
                  {t('events.viewAll')} {players.length} {t('events.players')}
                </button>
              )}
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Invite Friends Modal */}
      {showInviteModal && event && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-white/10 w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-xl font-bold">Invite Friends</h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-sm lg:text-xs">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 lg:p-3">
              {friends.length === 0 ? (
                <div className="text-center text-slate-400 py-8 lg:py-6">
                  <p className="lg:text-sm">No friends to invite</p>
                  <p className="text-xs mt-2 lg:text-[11px] lg:mt-1.5">{t('events.addFriendsHint')}</p>
                </div>
              ) : (
                <div className="space-y-2 lg:space-y-1.5">
                  {friends
                    .filter(friend => {
                      const isAlreadyPlayer = event.players.includes(friend.id);
                      const hasPendingRequest = pendingRequestUsers.some(req => req.id === friend.id);
                      const hasBeenInvited = invitedFriendIds.has(friend.id);
                      return !isAlreadyPlayer && !hasPendingRequest && !hasBeenInvited;
                    })
                    .map((friend) => (
                      <div
                        key={friend.id}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 lg:p-2 lg:rounded-lg"
                      >
                        <div className="flex items-center gap-3 lg:gap-2">
                          <Avatar
                            src={friend.avatar || `https://i.pravatar.cc/150?u=${friend.id}`}
                            size="w-10 h-10 lg:w-9 lg:h-9"
                          />
                          <div>
                            <p className="font-bold text-sm lg:text-xs">{friend.firstName} {friend.lastName}</p>
                            <p className="text-xs text-slate-400 lg:text-[11px]">{friend.userId}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleInviteFriend(friend.id)}
                          disabled={invitingFriendId === friend.id || invitedFriendIds.has(friend.id)}
                          className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors disabled:cursor-not-allowed lg:px-3 lg:py-1.5 lg:text-xs lg:rounded ${
                            invitedFriendIds.has(friend.id)
                              ? 'bg-green-500/10 border border-green-500/30 text-green-400 cursor-not-allowed'
                              : invitingFriendId === friend.id
                              ? 'bg-primary/50 text-white'
                              : 'bg-primary hover:bg-primary-hover text-white'
                          }`}
                        >
                          {invitingFriendId === friend.id 
                            ? 'Sending...' 
                            : invitedFriendIds.has(friend.id)
                            ? 'Invited'
                            : 'Invite'}
                        </button>
                      </div>
                    ))}
                  {friends.filter(friend => {
                    const isAlreadyPlayer = event.players.includes(friend.id);
                    const hasPendingRequest = pendingRequestUsers.some(req => req.id === friend.id);
                    const hasBeenInvited = invitedFriendIds.has(friend.id);
                    return !isAlreadyPlayer && !hasPendingRequest && !hasBeenInvited;
                  }).length === 0 && (
                    <div className="text-center text-slate-400 py-4">
                      <p>{t('events.allFriendsInvited')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const EventDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const {
    getEvent,
    requestToJoin,
    leaveEvent,
    events,
    getUserPendingRequest,
    getUserEventRequest,
    getUserApprovedRequest,
    inviteFriendToEvent,
    getEventInvitations,
    acceptInvitation,
    denyInvitation,
  } = useEvents();
  const { getOrCreateChat } = useMessages();
  const { t } = useLanguage();
  const [event, setEvent] = useState<Event | null>(null);
  const [players, setPlayers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [hasApprovedRequest, setHasApprovedRequest] = useState(false);
  const [hasInvitedRequest, setHasInvitedRequest] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [friends, setFriends] = useState<User[]>([]);
  const [invitingFriendId, setInvitingFriendId] = useState<string | null>(null);
  const [invitedFriendIds, setInvitedFriendIds] = useState<Set<string>>(new Set());
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [hasRated, setHasRated] = useState(false);

  // Check if event is past - defined early so it's always in scope
  const isEventPast = () => {
    if (!event) return false;
    const now = new Date();
    const eventDateTime = new Date(`${event.date}T${event.time}`);
    const eventEndTime = event.endTime ? new Date(`${event.date}T${event.endTime}`) : null;
    
    // If event has an end time, check if it has ended
    if (eventEndTime) {
      return eventEndTime < now;
    }
    // If no end time, check if start time has passed
    return eventDateTime < now;
  };

  useEffect(() => {
    const loadEvent = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      try {
        // Force reload from database first to get latest data
        const { eventService } = await import("../services/supabaseService");
        let eventData: Event | null | undefined = await eventService.getEvent(id);

        // If not found in database, try context
        if (!eventData) {
          eventData = getEvent(id);
        }

        // If still not found, try events array
        if (!eventData) {
          eventData = events.find((e) => e.id === id);
        }

        if (eventData) {
          console.log(
            "EventDetails: Loaded event with players:",
            eventData.players
          );
          // Always update event and players to ensure we have latest data
          setEvent(eventData);
          await loadPlayers(eventData.players);

          // Check if user has a pending, approved, or invited request
          // If user is in players list, they're approved/joined
          if (user) {
            if (eventData.players.includes(user.id)) {
              setHasPendingRequest(false);
              setHasApprovedRequest(false);
              setHasInvitedRequest(false);
            } else {
              try {
                const userRequest = await getUserEventRequest(id);
                if (userRequest) {
                  if (userRequest.status === 'pending') {
                    setHasPendingRequest(true);
                    setHasApprovedRequest(false);
                    setHasInvitedRequest(false);
                  } else if (userRequest.status === 'invited') {
                    setHasPendingRequest(false);
                    setHasApprovedRequest(false);
                    setHasInvitedRequest(true);
                  } else if (userRequest.status === 'approved') {
                    setHasPendingRequest(false);
                    setHasApprovedRequest(true);
                    setHasInvitedRequest(false);
                    // If user has approved request but isn't in players list yet,
                    // the approval might have just happened - reload event after a short delay
                    setTimeout(async () => {
                      const refreshedEvent = getEvent(id);
                      if (
                        refreshedEvent &&
                        refreshedEvent.players.includes(user.id)
                      ) {
                        setEvent(refreshedEvent);
                        await loadPlayers(refreshedEvent.players);
                        setHasApprovedRequest(false); // Clear approved request flag since they're now in players
                      }
                    }, 1000);
                  } else {
                    setHasPendingRequest(false);
                    setHasApprovedRequest(false);
                    setHasInvitedRequest(false);
                  }
                } else {
                  // No request found, check for pending separately for backward compatibility
                  const pendingRequest = await getUserPendingRequest(id);
                  setHasPendingRequest(!!pendingRequest);
                  setHasApprovedRequest(false);
                  setHasInvitedRequest(false);
                }
              } catch (error) {
                console.error("Error checking request status:", error);
                setHasPendingRequest(false);
                setHasApprovedRequest(false);
                setHasInvitedRequest(false);
              }
            }
          } else {
            setHasPendingRequest(false);
            setHasApprovedRequest(false);
            setHasInvitedRequest(false);
          }
        } else {
          // Event not found - this shouldn't happen if we loaded from DB above
          console.warn("EventDetails: Event not found in any source");
          setHasPendingRequest(false);
          setHasApprovedRequest(false);
        }
      } catch (error) {
        console.error("Error loading event:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEvent();

    // Set up real-time subscription for event updates
    let channel: any = null;
    const setupRealtime = async () => {
      if (!id) return;
      
      const { supabase } = await import("../lib/supabase");
      channel = supabase
        .channel(`event_details:${id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'events',
            filter: `id=eq.${id}`,
          },
          async (payload) => {
            console.log('EventDetails: Real-time event update received:', payload);
            // Reload event data when it's updated
            try {
              const { eventService } = await import("../services/supabaseService");
              const dbEvent = await eventService.getEvent(id);
              if (dbEvent) {
                setEvent((prevEvent) => {
                  if (!prevEvent) {
                    setTimeout(() => loadPlayers(dbEvent.players), 0);
                    return dbEvent;
                  }

                  // Check if players array changed
                  const prevPlayerIds = [...prevEvent.players].sort().join(",");
                  const currentPlayerIds = [...dbEvent.players].sort().join(",");
                  const playersChanged =
                    prevPlayerIds !== currentPlayerIds ||
                    prevEvent.players.length !== dbEvent.players.length;

                  if (playersChanged || 
                      prevEvent.currentPlayers !== dbEvent.currentPlayers ||
                      prevEvent.status !== dbEvent.status) {
                    setTimeout(() => loadPlayers(dbEvent.players), 0);
                    return { ...dbEvent };
                  }
                  return prevEvent;
                });
              }
            } catch (error) {
              console.error("EventDetails: Error loading updated event:", error);
            }
          }
        )
        .subscribe((status) => {
          console.log('EventDetails: Real-time subscription status:', status);
        });
    };
    setupRealtime();

    return () => {
      // Clean up real-time subscription
      import("../lib/supabase").then(({ supabase }) => {
        if (channel) {
          supabase.removeChannel(channel);
        }
      });
    };
    // Only depend on id - other dependencies are stable or handled via refs/callbacks
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Reload players whenever event.players changes
  useEffect(() => {
    if (event && event.players && event.players.length > 0) {
      console.log(
        "EventDetails: event.players changed, reloading player profiles:",
        event.players
      );
      loadPlayers(event.players);
    } else if (event && (!event.players || event.players.length === 0)) {
      setPlayers([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.players ? event.players.sort().join(",") : ""]); // Use sorted join to create a stable dependency

  // Check if user has already rated players for this event
  useEffect(() => {
    const checkRatings = async () => {
      if (!event || !user) return;
      
      const eventPast = isEventPast();
      if (!eventPast) {
        setHasRated(false);
        return;
      }
      
      try {
        const existingRatings = await ratingService.getUserRatingsForEvent(event.id, user.id);
        setHasRated(existingRatings.length > 0);
      } catch (error) {
        console.error('Error checking ratings:', error);
      }
    };

    checkRatings();
  }, [event?.id, user?.id, event?.date, event?.time, event?.endTime]);

  const loadPlayers = async (playerIds: string[]) => {
    if (playerIds.length === 0) {
      setPlayers([]);
      return;
    }

    try {
      const playerProfiles = await userService.getUsers(playerIds);
      setPlayers(playerProfiles);
    } catch (error) {
      console.error("Error loading players:", error);
      setPlayers([]);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const days = [
      t('date.days.sunday'),
      t('date.days.monday'),
      t('date.days.tuesday'),
      t('date.days.wednesday'),
      t('date.days.thursday'),
      t('date.days.friday'),
      t('date.days.saturday'),
    ];
    const months = [
      t('date.months.january'),
      t('date.months.february'),
      t('date.months.march'),
      t('date.months.april'),
      t('date.months.may'),
      t('date.months.june'),
      t('date.months.july'),
      t('date.months.august'),
      t('date.months.september'),
      t('date.months.october'),
      t('date.months.november'),
      t('date.months.december'),
    ];
    const dayName = days[date.getDay()];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${dayName}, ${day} ${month} ${year}`;
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? t('date.time.pm') : t('date.time.am');
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatTimeRange = (startTime: string, endTime?: string) => {
    if (endTime) {
      return `${formatTime(startTime)} - ${formatTime(endTime)}`;
    }
    return formatTime(startTime);
  };

  const handleGetDirections = () => {
    if (event?.location) {
      const encodedLocation = encodeURIComponent(event.location);
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`,
        "_blank"
      );
    }
  };

  const handleJoin = async () => {
    console.log("handleJoin called", {
      event: !!event,
      user: !!user,
      eventId: event?.id,
      userId: user?.id,
    });

    if (!event || !user) {
      console.error("Cannot request: missing event or user", {
        event: !!event,
        user: !!user,
      });
      return;
    }

    // Prevent joining past events
    if (isEventPast()) {
      alert(t('events.cannotJoinPast'));
      return;
    }

    setIsJoining(true);
    try {
      // If user has an invitation, accept it instead of requesting
      if (hasInvitedRequest) {
        console.log("Accepting invitation to event:", event.id, "User:", user.id);
        await acceptInvitation(event.id);
        console.log("Successfully accepted invitation - database updated");
        // Reload event to get updated players list
        setTimeout(async () => {
          const { eventService } = await import("../services/supabaseService");
          const updatedEvent = await eventService.getEvent(event.id);
          if (updatedEvent) {
            setEvent(updatedEvent);
            await loadPlayers(updatedEvent.players);
            setHasInvitedRequest(false);
          }
        }, 500);
        setIsJoining(false);
        return;
      }

      console.log("Requesting to join event:", event.id, "User:", user.id);

      // Optimistically update the UI
      setHasPendingRequest(true);
      setHasApprovedRequest(false);
      setHasInvitedRequest(false);
      console.log("Set hasPendingRequest to true");

      await requestToJoin(event.id);
      console.log("Successfully requested to join event - database updated");

      // Verify the request was created
      setTimeout(async () => {
        try {
          const pendingRequest = await getUserPendingRequest(event.id);
          console.log("Verified pending request:", pendingRequest);
          setHasPendingRequest(!!pendingRequest);
          if (!pendingRequest) {
            const approvedRequest = await getUserApprovedRequest(event.id);
            setHasApprovedRequest(!!approvedRequest);
          }
        } catch (error) {
          console.error("Error verifying request status:", error);
        }
      }, 500);
    } catch (err: any) {
      console.error("Error requesting to join event:", err);
      // Revert optimistic update on error
      setHasPendingRequest(false);
      setHasApprovedRequest(false);
      alert(err.message || t('events.failedToJoin'));
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!event || !user) return;

    setIsJoining(true);
    try {
      await leaveEvent(event.id);
      
      // Reload event data from database
      const { eventService } = await import("../services/supabaseService");
      const updatedEvent = await eventService.getEvent(event.id);
      
      if (updatedEvent) {
        setEvent(updatedEvent);
        await loadPlayers(updatedEvent.players);
        // Reset request states
        setHasPendingRequest(false);
        setHasApprovedRequest(false);
        setHasInvitedRequest(false);
      } else {
        // Fallback to context
        const contextEvent = getEvent(event.id);
        if (contextEvent) {
          setEvent(contextEvent);
          await loadPlayers(contextEvent.players);
        }
      }
    } catch (err: any) {
      console.error('Error leaving event:', err);
      alert(err.message || t('events.failedToLeave'));
    } finally {
      setIsJoining(false);
    }
  };

  const handleDenyInvitation = async () => {
    if (!event || !user || !hasInvitedRequest) return;
    
    setIsJoining(true);
    try {
      console.log("Denying invitation to event:", event.id, "User:", user.id);
      await denyInvitation(event.id);
      console.log("Successfully denied invitation - database updated");
      setHasInvitedRequest(false);
      // Optionally reload event to ensure UI is in sync
      setTimeout(async () => {
        const { eventService } = await import("../services/supabaseService");
        const updatedEvent = await eventService.getEvent(event.id);
        if (updatedEvent) {
          setEvent(updatedEvent);
        }
      }, 500);
    } catch (error: any) {
      console.error("Error denying invitation:", error);
      alert(error.message || t('events.failedToDeny'));
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
      console.error("Failed to open chat:", err);
    }
  };

  // Load friends and invitations when invite modal opens
  useEffect(() => {
    const loadFriendsAndInvitations = async () => {
      if (!showInviteModal || !user || !user.friends || user.friends.length === 0 || !id) {
        setFriends([]);
        setInvitedFriendIds(new Set());
        return;
      }

      try {
        // Load friends
        const friendUsers = await Promise.all(
          user.friends.map(async (friendId) => {
            try {
              return await userService.getUserProfile(friendId);
            } catch {
              return null;
            }
          })
        );
        setFriends(friendUsers.filter((u): u is User => u !== null));

        // Load existing invitations for this event
        const invitations = await getEventInvitations(id);
        const invitedIds = new Set(invitations.map(inv => inv.userId));
        setInvitedFriendIds(invitedIds);
      } catch (error) {
        console.error('Error loading friends and invitations:', error);
        setFriends([]);
        setInvitedFriendIds(new Set());
      }
    };

    loadFriendsAndInvitations();
  }, [showInviteModal, user, id, getEventInvitations]);

  const handleInviteFriend = async (friendId: string) => {
    if (!event || !id) return;

    // Check if event is past
    const now = new Date();
    const eventDateTime = new Date(`${event.date}T${event.time}`);
    const eventEndTime = event.endTime ? new Date(`${event.date}T${event.endTime}`) : null;
    const isPast = eventEndTime ? eventEndTime < now : eventDateTime < now;

    if (isPast) {
      alert(t('events.cannotInvitePast'));
      return;
    }

    setInvitingFriendId(friendId);
    try {
      await inviteFriendToEvent(id, friendId);
      // Update state to show "Invited" status
      setInvitedFriendIds(prev => new Set([...prev, friendId]));
    } catch (error: any) {
      console.error('Error inviting friend:', error);
      alert(error.message || t('events.failedToInvite'));
    } finally {
      setInvitingFriendId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="text-white">{t('common.loading')}</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="text-white">{t('events.eventNotFound')}</div>
      </div>
    );
  }

  const spotsLeft = event.maxPlayers - event.currentPlayers;
  const isJoined = user && event.players.includes(user.id);
  const isOrganizer = user && event.organizerId === user.id;
  const isFull = spotsLeft === 0;
  // User is considered approved if they're in the players list OR have an approved request
  const isApproved = isJoined || hasApprovedRequest;

  return (
    <div className="bg-background min-h-screen flex flex-col relative pb-24">
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/5">
        <div className="w-full flex justify-between items-center px-3 py-2">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center backdrop-blur"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
          </button>
          <h2 className="font-bold text-sm">{t('events.eventDetails')}</h2>
          <button className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center backdrop-blur">
            <span className="material-symbols-outlined text-base">
              ios_share
            </span>
          </button>
        </div>
      </div>

      <div className="w-full">
        <div className="px-4 pt-16 pb-3 border-b border-white/5">
        <div className="flex gap-1.5 mb-1.5 flex-wrap">
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
              event.status === "open"
                ? "bg-green-500/20 text-green-500 border border-green-500/20"
                : event.status === "full"
                ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/20"
                : "bg-red-500/20 text-red-500 border border-red-500/20"
            }`}
          >
            {event.status === "open"
              ? t('events.open')
              : event.status === "full"
              ? t('events.full')
              : event.status}
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary border border-primary/20">
            {event.sport}
          </span>
        </div>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold leading-tight flex-1">
            {event.title}
          </h1>
          {event.code && (
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(event.code);
                // You could add a toast notification here
              }}
              className="bg-primary/10 border-2 border-primary/30 rounded-lg px-2.5 py-1.5 ml-3 text-left hover:bg-primary/15 hover:border-primary/40 transition-colors cursor-pointer"
              title={t('events.eventCreated.copyCode')}
            >
              <p className="text-[10px] text-slate-400 mb-0.5">
                {t('events.eventCode')}
              </p>
              <div className="flex items-center gap-1.5">
                <code className="text-sm font-bold text-primary tracking-wider">
                  {event.code}
                </code>
                <span className="material-symbols-outlined text-xs text-primary/90">
                  content_copy
                </span>
              </div>
            </button>
          )}
        </div>

        <div className="space-y-2.5">
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-base">calendar_month</span>
            </div>
            <div>
              <p className="font-bold text-sm">{formatDate(event.date)}</p>
              <p className="text-xs text-slate-400">
                {formatTimeRange(event.time, event.endTime)}
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-base">location_on</span>
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">{event.location}</p>
              {event.locationDetails && (
                <p className="text-xs text-slate-400">
                  {event.locationDetails}
                </p>
              )}
            </div>
            <button
              onClick={handleGetDirections}
              className="bg-white text-black px-2.5 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1.5 shadow-md hover:bg-white/90 transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-primary text-base">
                directions
              </span>
              {t('events.directions')}
            </button>
          </div>
          {event.price && event.price > 0 && (
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-base">payments</span>
              </div>
              <div>
                <p className="font-bold text-sm">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(event.price)}
                </p>
                <p className="text-xs text-slate-400">{t('events.eventFee')}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {event.price && event.price > 0 && (
            <div className="bg-surface border border-white/5 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-slate-400 text-base">
                payments
              </span>
              <span className="text-xs font-semibold text-slate-300">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(event.price)}
              </span>
            </div>
          )}
          {event.skillLevel && event.skillLevel !== "All" && (
            <div className="bg-surface border border-white/5 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-slate-400 text-base">
                leaderboard
              </span>
              <span className="text-xs font-semibold text-slate-300">
                {t(`events.skillLevel.${event.skillLevel.toLowerCase()}`)}
              </span>
            </div>
          )}
          {event.competitive && (
            <div className="bg-gradient-to-br from-yellow-400 to-green-400 text-black rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 font-bold shadow-lg shadow-green-500/20">
              <span className="material-symbols-outlined text-base">
                local_fire_department
              </span>
              <span className="text-xs">Competitive</span>
            </div>
          )}
          </div>
        </div>

        <div className="h-px bg-white/5 w-full my-4 mx-4"></div>

        <div className="px-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-bold">{t('events.currentRoster')}</h3>
            <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs font-bold">
              {event.currentPlayers}/{event.maxPlayers} {t('events.players')}
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {/* Show players from event.players array, not just loaded players state */}
            {event.players.length > 0 ? (
              event.players.map((playerId) => {
                const player = players.find((p) => p.id === playerId);
                const isOrganizerPlayer = playerId === event.organizerId;
                // If player profile not loaded yet, show placeholder
                if (!player) {
                  return (
                    <div
                      key={playerId}
                      className="flex flex-col items-center gap-1.5 min-w-[50px]"
                    >
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                          <span className="material-symbols-outlined text-slate-400 text-base">
                            person
                          </span>
                        </div>
                        {isOrganizerPlayer && (
                          <div className="absolute -bottom-0.5 -right-0.5 bg-yellow-400 text-black text-[9px] font-bold px-1 rounded border border-white">
                            {t('events.host')}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-medium text-slate-400 text-center">
                        {t('common.loading')}
                      </span>
                    </div>
                  );
                }
                return (
                  <div
                    key={player.id}
                    className="flex flex-col items-center gap-1.5 min-w-[50px]"
                  >
                    <div className="relative">
                      <Avatar
                        src={
                          player.avatar ||
                          `https://i.pravatar.cc/150?u=${player.id}`
                        }
                        size="w-12 h-12"
                        className={isOrganizerPlayer ? "border-yellow-400" : ""}
                      />
                      {isOrganizerPlayer && (
                        <div className="absolute -bottom-0.5 -right-0.5 bg-yellow-400 text-black text-[9px] font-bold px-1 rounded border border-white">
                          HOST
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-medium text-slate-300 text-center">
                      {player.firstName} {player.lastName}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-slate-400 text-xs py-3 w-full">
                No players yet
              </div>
            )}
            {!isFull && (
              <div className="flex flex-col items-center gap-1.5 min-w-[50px]">
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-600 bg-white/5 flex items-center justify-center text-slate-500">
                  <span className="material-symbols-outlined text-base">person_add</span>
                </div>
                <span className="text-[10px] font-medium text-slate-500">{t('events.open')}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            {!isEventPast() && isOrganizer && (
              <button
                onClick={() => {
                  setShowInviteModal(true);
                }}
                className="flex-1 bg-surface border border-white/10 h-10 rounded-lg font-bold text-sm text-primary flex items-center justify-center gap-1.5 hover:bg-white/5 transition-colors"
              >
                <span className="material-symbols-outlined text-base">
                  ios_share
                </span>{" "}
                {t('events.inviteFriends')}
              </button>
            )}
          </div>
        </div>

        {event.description && (
          <div className="mt-4 mb-2 px-4">
            <h3 className="text-base font-bold mb-1.5">About the Game</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              {event.description}
            </p>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-md border-t border-white/10 z-30">
        <div className="w-full p-3">
        <div className="flex items-center justify-between gap-3 mb-1.5">
          {event.price && event.price > 0 && !isOrganizer && (
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                Total
              </span>
              <span className="text-lg font-bold">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(event.price)}
              </span>
            </div>
          )}
          {!isOrganizer ? (
            hasInvitedRequest ? (
              <div className="flex gap-2 w-full">
                <button
                  onClick={handleJoin}
                  disabled={isJoining || !user || isEventPast()}
                  className="flex-1 h-11 rounded-lg font-bold text-sm shadow-lg transition-all active:scale-[0.98] bg-green-500 hover:bg-green-600 text-white shadow-green-500/20 disabled:opacity-50"
                >
                  {isJoining ? t('common.loading') : t('events.agreeToJoin')}
                </button>
                <button
                  onClick={handleDenyInvitation}
                  disabled={isJoining || !user}
                  className="flex-1 h-11 rounded-lg font-bold text-sm shadow-lg transition-all active:scale-[0.98] bg-red-500/20 text-red-400 border border-red-500/20 hover:bg-red-500/30 disabled:opacity-50"
                >
                  {isJoining ? t('common.loading') : t('events.deny')}
                </button>
              </div>
            ) : (
              <div className="flex gap-2 w-full">
                {isEventPast() && isJoined && !hasRated && (
                  <button
                    onClick={() => setShowRatingModal(true)}
                    className="flex-1 h-11 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/20 rounded-lg font-bold text-sm shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base">star</span>
                    {t('ratings.ratePlayers')}
                  </button>
                )}
                <button
                  onClick={isJoined && !isEventPast() ? handleLeave : handleJoin}
                  disabled={
                    isJoining ||
                    isFull ||
                    hasPendingRequest ||
                    !user ||
                    isEventPast()
                  }
                  className={`flex-1 h-11 rounded-lg font-bold text-sm shadow-lg transition-all active:scale-[0.98] ${
                    isEventPast()
                      ? "bg-slate-500/20 text-slate-400 border border-slate-500/20 cursor-not-allowed"
                      : isJoined
                      ? "bg-red-500/20 text-red-400 border border-red-500/20 hover:bg-red-500/30"
                      : hasPendingRequest
                      ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 cursor-not-allowed"
                      : isApproved
                      ? "bg-green-500/20 text-green-400 border border-green-500/20 cursor-not-allowed"
                      : isFull
                      ? "bg-slate-500/20 text-slate-400 border border-slate-500/20 cursor-not-allowed"
                      : "bg-primary hover:bg-primary-hover text-white shadow-primary/20"
                  }`}
                >
                  {isJoining
                    ? t('common.loading')
                    : isEventPast()
                    ? t('events.eventEnded')
                    : isJoined
                    ? t('events.leaveEvent')
                    : hasPendingRequest
                    ? t('events.requested')
                    : isApproved
                    ? t('events.approved')
                    : isFull
                    ? t('events.eventFull')
                    : t('events.requestToJoin')}
                </button>
              </div>
            )
          ) : (
            <button
              onClick={() => navigate(`/event/manage/${event.id}`)}
              className="flex-1 h-11 bg-primary hover:bg-primary-hover rounded-lg font-bold text-sm shadow-lg shadow-primary/20 transition-all active:scale-[0.98] text-white"
            >
              {t('events.manageEvent')}
            </button>
          )}
        </div>
        {!isFull && !isOrganizer && (
          <p className="text-center text-[9px] text-slate-500">
            Your spot is held for 10 mins after request
          </p>
        )}
        </div>
      </div>

      {/* Invite Friends Modal */}
      {showInviteModal && event && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-white/10 w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-xl font-bold">Invite Friends</h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {friends.length === 0 ? (
                <div className="text-center text-slate-400 py-8">
                  <p>No friends to invite</p>
                  <p className="text-xs mt-2">{t('events.addFriendsHint')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {friends
                    .filter(friend => !event.players.includes(friend.id))
                    .map((friend) => (
                      <div
                        key={friend.id}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={friend.avatar || `https://i.pravatar.cc/150?u=${friend.id}`}
                            size="w-10 h-10"
                          />
                          <div>
                            <p className="font-bold text-sm">{friend.firstName} {friend.lastName}</p>
                            <p className="text-xs text-slate-400">{friend.userId}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleInviteFriend(friend.id)}
                          disabled={invitingFriendId === friend.id || invitedFriendIds.has(friend.id)}
                          className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors disabled:cursor-not-allowed ${
                            invitedFriendIds.has(friend.id)
                              ? 'bg-green-500/10 border border-green-500/30 text-green-400 cursor-not-allowed'
                              : invitingFriendId === friend.id
                              ? 'bg-primary/50 text-white'
                              : 'bg-primary hover:bg-primary-hover text-white'
                          }`}
                        >
                          {invitingFriendId === friend.id 
                            ? 'Sending...' 
                            : invitedFriendIds.has(friend.id)
                            ? 'Invited'
                            : 'Invite'}
                        </button>
                      </div>
                    ))}
                  {friends.filter(friend => !event.players.includes(friend.id)).length === 0 && (
                    <div className="text-center text-slate-400 py-4">
                      <p>{t('events.allFriendsInEvent')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && event && user && (
        <RatingModal
          eventId={event.id}
          players={players}
          currentUserId={user.id}
          onClose={() => setShowRatingModal(false)}
          onSubmitted={() => {
            setShowRatingModal(false);
            setHasRated(true);
          }}
        />
      )}
    </div>
  );
};

export const EditEvent: React.FC = () => {
  useNavigate();
  const { t } = useLanguage();
  return (
    <div className="flex flex-col min-h-screen bg-background text-white">
      <Header
        title="Edit Event"
        rightAction={<button className="text-primary font-bold lg:text-sm">Save</button>}
      />

      <main className="flex-1 p-4 space-y-6 lg:p-6 lg:space-y-4">
        <div className="lg:max-w-2xl lg:mx-auto lg:w-full">
        <div className="relative h-40 rounded-xl overflow-hidden group lg:h-32 lg:rounded-lg">
          <img
            src="https://images.unsplash.com/photo-1546519638-68e109498ffc"
            className="w-full h-full object-cover"
            alt="banner"
          />
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute bottom-4 left-4 lg:bottom-3 lg:left-3">
            <span className="bg-gradient-to-r from-yellow-400 to-green-400 text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase lg:text-[9px] lg:px-1.5">
              Basketball
            </span>
            <h2 className="text-2xl font-bold mt-1 lg:text-xl lg:mt-0.5">Sunday Morning Hoops</h2>
            <p className="text-sm opacity-90 lg:text-xs">Oct 24 • 10:00 AM</p>
          </div>
          <button className="absolute top-3 right-3 p-2 bg-black/40 backdrop-blur rounded-full lg:top-2 lg:right-2 lg:p-1.5">
            <span className="material-symbols-outlined text-sm lg:text-xs">edit</span>
          </button>
        </div>

        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 lg:text-[11px] lg:mb-1.5">
            The Basics
          </h3>
          <div className="space-y-4 lg:space-y-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block lg:text-[11px] lg:mb-0.5">
                {t('events.eventNameLabel')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  defaultValue="Sunday Morning Hoops"
                  className="w-full bg-surface border border-white/10 rounded-lg h-12 px-4 focus:border-primary outline-none lg:h-10 lg:px-3 lg:text-sm lg:rounded"
                />
                <span className="absolute right-4 top-3 text-slate-400 material-symbols-outlined text-[20px] lg:right-3 lg:top-2.5 lg:text-base">
                  edit
                </span>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-2 block lg:text-[11px] lg:mb-1.5">
                SPORT TYPE
              </label>
              <div className="flex gap-3 overflow-x-auto no-scrollbar lg:gap-2">
                <div className="w-20 h-20 bg-surface rounded-xl border-2 border-primary flex flex-col items-center justify-center text-primary relative overflow-hidden lg:w-16 lg:h-16 lg:rounded-lg">
                  <div className="absolute inset-0 bg-primary/10"></div>
                  <span className="material-symbols-outlined text-3xl mb-1 lg:text-2xl lg:mb-0.5">
                    sports_basketball
                  </span>
                  <span className="text-xs font-bold lg:text-[11px]">Hoops</span>
                  <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(57,255,20,0.6)] lg:w-1.5 lg:h-1.5 lg:top-0.5 lg:right-0.5"></div>
                </div>
                {["Soccer", "Tennis", "Volleyball", "Run"].map((s, i) => (
                  <div
                    key={i}
                    className="w-20 h-20 bg-surface rounded-xl border border-white/10 flex flex-col items-center justify-center text-slate-400 hover:border-white/30 transition-colors lg:w-16 lg:h-16 lg:rounded-lg"
                  >
                    <span className="material-symbols-outlined text-3xl mb-1 lg:text-2xl lg:mb-0.5">
                      {i === 0
                        ? "sports_soccer"
                        : i === 1
                        ? "sports_tennis"
                        : i === 2
                        ? "sports_volleyball"
                        : "directions_run"}
                    </span>
                    <span className="text-xs font-medium lg:text-[11px]">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 lg:text-[11px] lg:mb-1.5">
            {t('events.logistics')}
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4 lg:gap-3 lg:mb-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block lg:text-[11px] lg:mb-0.5">{t('events.dateLabel')}</label>
              <div className="bg-surface border border-white/10 rounded-lg h-12 flex items-center px-4 justify-between lg:h-10 lg:px-3 lg:rounded lg:text-sm">
                <span>Oct 24, 2023</span>
                <span className="material-symbols-outlined text-primary text-[20px] lg:text-base">
                  calendar_today
                </span>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block lg:text-[11px] lg:mb-0.5">{t('events.timeLabel')}</label>
              <div className="bg-surface border border-white/10 rounded-lg h-12 flex items-center px-4 justify-between lg:h-10 lg:px-3 lg:rounded lg:text-sm">
                <span>10:00 AM</span>
                <span className="material-symbols-outlined text-primary text-[20px] lg:text-base">
                  schedule
                </span>
              </div>
            </div>
          </div>
          <div className="relative rounded-xl overflow-hidden border border-white/10 lg:rounded-lg">
            <div className="flex items-center gap-3 p-3 bg-surface border-b border-white/5 lg:gap-2 lg:p-2">
              <span className="material-symbols-outlined text-primary lg:text-base">
                location_on
              </span>
              <span className="flex-1 lg:text-sm">Central Park Courts</span>
              <span className="material-symbols-outlined text-slate-400 lg:text-base">
                search
              </span>
            </div>
            <div className="h-32 relative lg:h-24">
              <img
                src="https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83"
                className="w-full h-full object-cover opacity-60"
                alt="map"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center animate-pulse ring-4 ring-primary/30 text-white">
                  <span className="material-symbols-outlined text-sm">
                    location_on
                  </span>
                </div>
              </div>
              <div className="absolute bottom-2 right-2 bg-surface/90 backdrop-blur text-[10px] font-bold px-2 py-1 rounded">
                {t('events.changeLocation')}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2 lg:mb-1.5">
            <h3 className="text-xs font-bold text-slate-500 uppercase lg:text-[11px]">
              Roster Limit
            </h3>
            <span className="text-primary font-bold lg:text-sm">10 Spots</span>
          </div>
          <div className="bg-surface border border-white/10 rounded-xl p-5 lg:rounded-lg lg:p-3">
            <div className="flex justify-between text-xs text-slate-400 font-bold mb-4 lg:text-[11px] lg:mb-3">
              <span>Min: 2</span>
              <span>Max: 50</span>
            </div>
            <div className="relative h-2 bg-white/10 rounded-full mb-3 lg:mb-2">
              <div className="absolute left-0 top-0 h-full w-[20%] bg-gradient-to-r from-yellow-400 to-green-400 rounded-full"></div>
              <div className="absolute left-[20%] top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-white border-2 border-primary rounded-full shadow cursor-grab flex items-center justify-center lg:w-5 lg:h-5">
                <div className="w-2 h-2 bg-primary rounded-full lg:w-1.5 lg:h-1.5"></div>
              </div>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1 lg:text-[11px]">
              <span className="material-symbols-outlined text-sm lg:text-xs">info</span>{" "}
              Current signups: 4 players
            </p>
          </div>
        </div>

        <div className="pt-4 flex flex-col gap-3 lg:pt-3 lg:gap-2">
          <button className="w-full h-12 bg-primary rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 lg:h-10 lg:text-sm lg:rounded-lg">
            <span className="material-symbols-outlined lg:text-base">save</span> Save Changes
          </button>
          <button className="w-full h-12 bg-transparent border border-white/10 rounded-xl font-bold text-slate-300 lg:h-10 lg:text-sm lg:rounded-lg">
            Cancel
          </button>
          <button className="w-full h-12 flex items-center justify-center gap-2 text-danger font-bold text-sm hover:bg-danger/5 rounded-xl lg:h-10 lg:text-xs lg:rounded-lg">
            <span className="material-symbols-outlined lg:text-base">delete</span> Delete
            Event
          </button>
        </div>
        </div>
      </main>
    </div>
  );
};

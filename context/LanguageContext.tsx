import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { settingsService } from "../services/settingsService";

export type Language = "en" | "vi";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Common
    "common.welcome": "Welcome back",
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.back": "Back",
    "common.next": "Next",
    "common.done": "Done",
    "common.optional": "Optional",

    // Navigation
    "nav.home": "Home",
    "nav.myGames": "My Games",
    "nav.messages": "Messages",
    "nav.profile": "Profile",

    // Home
    "home.findYourGame": "Find events",
    "home.calendar": "Calendar",
    "home.map": "Map",
    "home.backToCalendar": "Back to Calendar",
    "home.filterByLocation": "Filter by location",

    // Settings
    "settings.title": "Settings",
    "settings.notifications": "Notification Settings",
    "settings.language": "Language",
    "settings.language.english": "English",
    "settings.language.vietnamese": "Tiếng Việt",
    "settings.pauseAll": "Pause All",
    "settings.pauseAll.desc": "Mute all notifications for 24h",
    "settings.matchActivity": "Match & Event Activity",
    "settings.gameInvites": "New Game Invites",
    "settings.scoreUpdates": "Score Updates",
    "settings.rosterChanges": "Roster Changes",
    "settings.social": "Social",
    "settings.friendRequests": "Friend Requests",
    "settings.directMessages": "Direct Messages",
    "settings.teamAnnouncements": "Team Announcements",
    "settings.quietHours": "Quiet Hours",

    // Events
    "events.create": "Create Event",
    "events.join": "Join Game",
    "events.joined": "Joined",
    "events.full": "Full",
    "events.viewDetails": "View Details",
    "events.players": "Players",
    "events.spotsLeft": "spots left",
    "events.spotLeft": "spot left",
    "events.myEvents": "My Events",
    "events.created": "Created",
    "events.invited": "Invited",
    "events.joinedBadge": "Joined",
    "events.player": "player",
    "events.playerJoined": "player joined",
    "events.playersJoined": "players joined",
    "events.lastSpot": "Last Spot!",
    "events.creating": "Creating...",
    "events.agreeToJoin": "Agree to Join",
    "events.deny": "Deny",
    "events.goBack": "Go Back",
    "events.noPlayersYet": "No players yet",
    "events.viewAll": "View All",
    "events.addFriendsHint":
      "Add friends from your profile to invite them to events",
    "events.loadingMap": "Loading map...",
    "events.sportType": "Sport Type",
    "events.eventName": "Event Name",
    "events.date": "Date",
    "events.time": "Time",
    "events.endTime": "End Time",
    "events.location": "Location",
    "events.maxPlayers": "Max Players",
    "events.description": "Description",
    "events.price": "Price",
    "events.skillLevel": "Skill Level",
    "events.competitive": "Competitive",
    "events.validation.eventName": "Please enter an event name",
    "events.validation.date": "Please select a date",
    "events.validation.time": "Please select a time",
    "events.validation.location": "Please enter a location",
    "events.validation.minPlayers": "Must have at least 2 players",
    "events.failedToCreate": "Failed to create event",
    "events.failedToApprove": "Failed to approve request",
    "events.failedToDeny": "Failed to deny invitation",
    "events.failedToJoin": "Failed to join event",
    "events.failedToInvite": "Failed to send invitation",
    "events.whenWhere": "When & Where",
    "events.details": "Details",
    "events.totalSpots": "Total Spots",
    "events.remove": "Remove",
    "events.addEndTime": "+ End time",
    "events.eventDetails": "Event Details",
    "events.eventNotFound": "Event not found",
    "events.cannotInvitePast": "Cannot invite friends to past events",
    "events.cannotJoinPast": "Cannot join past events",
    "events.open": "Open",
    "events.eventCode": "Event Code",
    "events.directions": "Directions",
    "events.eventFee": "Event fee",
    "events.manageEvent": "Manage Event",
    "events.spot": "spot",
    "events.spots": "spots",
    "events.spotOpen": "spot open",
    "events.spotsOpen": "spots open",
    "events.allFriendsInvited":
      "All your friends are already in this event or have been invited",
    "events.allFriendsInEvent": "All your friends are already in this event",
    "events.eventNameLabel": "EVENT NAME",
    "events.dateLabel": "DATE",
    "events.timeLabel": "TIME",
    "events.noEventsScheduled": "No events scheduled for this day",
    "events.shareEventText": "Join me for {sport} on {date}",
    "events.logistics": "Logistics",
    "events.locationPlaceholder": "Search for a location or enter address...",
    "events.competitiveDescription": "Only matching skill levels can join",
    "events.descriptionPlaceholder":
      "Add details about your event... (e.g. rules, what to bring, special instructions)",
    "events.enterEventCode": "Enter event code (e.g., ABC123)",
    "events.at": "at",
    "events.more": "more",
    "events.left": "left",
    "events.roster": "Roster",
    "events.eventCreated.gameOn": "Game On!",
    "events.eventCreated.successMessage": "Your squad is ready to be assembled. Event created successfully!",
    "events.eventCreated.copyCode": "Copy code",
    "events.eventCreated.inviteCrew": "Invite your crew",
    "events.eventCreated.viewEventDetails": "View",
    "events.eventCreated.returnToDashboard": "Return to Dashboard",
    "events.filter.all": "All",
    "events.filter.created": "Created",
    "events.filter.joined": "Joined",
    "events.filter.upcoming": "Upcoming",
    "events.filter.past": "Past",
    "events.filter.invited": "Invited",
    "events.myUpcoming": "Upcoming Events",
    "events.myPast": "Past Events",
    "events.iCreated": "I Created",
    "events.invitations": "Invitations",
    "events.noUpcoming": "No upcoming events",
    "events.noUpcomingCreated": "You haven't created any upcoming events",
    "events.noUpcomingJoined": "You haven't joined any upcoming events",
    "events.joinFromHome": "Join events from the home page to see them here",

    // Pages
    "pages.messages": "Messages",
    "pages.profile": "Profile",
    "pages.comingSoon": "Coming soon...",
    "pages.chatUnderDevelopment": "Chat feature is under development",

    // Onboarding
    "onboarding.activePlayers": "Active Players",
    "onboarding.proAthleteEdition": "Pro-Athlete Edition",
    "onboarding.findYourSquad": "Find Your",
    "onboarding.squad": "Squad.",
    "onboarding.dominate": "Dominate",
    "onboarding.theGame": "the Game.",
    "onboarding.description":
      "Connect with local athletes, join pickup games instantly, and track your performance stats.",
    "onboarding.localGames": "Local Games",
    "onboarding.findPlayers": "Find Players",
    "onboarding.trackStats": "Track Stats",
    "onboarding.getStartedFree": "Get Started Free",
    "onboarding.alreadyHaveAccount": "Already have an account?",
    "onboarding.logIn": "Log In",
    "onboarding.welcomeBack": "Welcome",
    "onboarding.back": "Back!",
    "onboarding.getBackOnCourt": "Let's get you back on the court.",
    "onboarding.loadingProfile": "Loading your profile...",
    "onboarding.redirecting": "Redirecting...",
    "onboarding.youreIn": "You're In!",
    "onboarding.accountCreatedSuccess": "Your account has been created successfully. Get ready to find your squad.",
    "onboarding.new": "New",
    "onboarding.proLeagueAccess": "Pro League Access",
    "onboarding.unlockedForProfile": "Unlocked for your profile",
    "onboarding.findAGame": "Find a Game",
    "onboarding.editProfile": "Edit Profile",
    "onboarding.step2Of4": "Step 2 of 4",
    "onboarding.whereDoYouPlay": "Where do you play?",
    "onboarding.setHomeBase": "Set your home base to find teams, tournaments, and matches near you.",
    "onboarding.selectCity": "Select City",
    "onboarding.confirmLocation": "Confirm Location",
    "onboarding.letsGetYouInGame": "Let's get you",
    "onboarding.inTheGame": "in the game.",
    "onboarding.createAccountToStart": "Create your account to start connecting.",

    // Date & Time
    "date.days.sunday": "Sunday",
    "date.days.monday": "Monday",
    "date.days.tuesday": "Tuesday",
    "date.days.wednesday": "Wednesday",
    "date.days.thursday": "Thursday",
    "date.days.friday": "Friday",
    "date.days.saturday": "Saturday",
    "date.months.january": "January",
    "date.months.february": "February",
    "date.months.march": "March",
    "date.months.april": "April",
    "date.months.may": "May",
    "date.months.june": "June",
    "date.months.july": "July",
    "date.months.august": "August",
    "date.months.september": "September",
    "date.months.october": "October",
    "date.months.november": "November",
    "date.months.december": "December",
    "date.months.short.jan": "Jan",
    "date.months.short.feb": "Feb",
    "date.months.short.mar": "Mar",
    "date.months.short.apr": "Apr",
    "date.months.short.may": "May",
    "date.months.short.jun": "Jun",
    "date.months.short.jul": "Jul",
    "date.months.short.aug": "Aug",
    "date.months.short.sep": "Sep",
    "date.months.short.oct": "Oct",
    "date.months.short.nov": "Nov",
    "date.months.short.dec": "Dec",
    "date.time.am": "AM",
    "date.time.pm": "PM",
    "date.today": "Today",
    "date.tomorrow": "Tomorrow",
    "date.days.short.sun": "Sun",
    "date.days.short.mon": "Mon",
    "date.days.short.tue": "Tue",
    "date.days.short.wed": "Wed",
    "date.days.short.thu": "Thu",
    "date.days.short.fri": "Fri",
    "date.days.short.sat": "Sat",
  },
  vi: {
    // Common
    "common.welcome": "Chào mừng trở lại",
    "common.loading": "Đang tải...",
    "common.error": "Lỗi",
    "common.save": "Lưu",
    "common.cancel": "Hủy",
    "common.delete": "Xóa",
    "common.edit": "Chỉnh sửa",
    "common.back": "Quay lại",
    "common.next": "Tiếp theo",
    "common.done": "Hoàn thành",
    "common.optional": "Tùy chọn",
    "common.user": "Người dùng",

    // Navigation
    "nav.home": "Trang chủ",
    "nav.myGames": "Sự kiện của tôi",
    "nav.messages": "Tin nhắn",
    "nav.profile": "Hồ sơ",

    // Home
    "home.findYourGame": "Tìm sự kiện",
    "home.calendar": "Lịch",
    "home.filterByLocation": "Lọc theo địa điểm",
    "home.map": "Bản đồ",
    "home.backToCalendar": "Quay lại lịch",

    // Settings
    "settings.title": "Cài đặt",
    "settings.notifications": "Cài đặt thông báo",
    "settings.language": "Ngôn ngữ",
    "settings.language.english": "English",
    "settings.language.vietnamese": "Tiếng Việt",
    "settings.pauseAll": "Tạm dừng tất cả",
    "settings.pauseAll.desc": "Tắt tất cả thông báo trong 24 giờ",
    "settings.matchActivity": "Hoạt động trận đấu & sự kiện",
    "settings.gameInvites": "Lời mời trò chơi mới",
    "settings.scoreUpdates": "Cập nhật điểm số",
    "settings.rosterChanges": "Thay đổi danh sách",
    "settings.social": "Xã hội",
    "settings.friendRequests": "Lời mời kết bạn",
    "settings.directMessages": "Tin nhắn trực tiếp",
    "settings.teamAnnouncements": "Thông báo đội",
    "settings.quietHours": "Giờ yên tĩnh",

    // Events
    "events.create": "Tạo sự kiện",
    "events.join": "Tham gia",
    "events.joined": "Đã tham gia",
    "events.full": "Đã đầy",
    "events.viewDetails": "Xem chi tiết",
    "events.players": "Người chơi",
    "events.spotsLeft": "chỗ còn lại",
    "events.spotLeft": "chỗ còn lại",
    "events.myEvents": "Sự kiện của tôi",
    "events.created": "Đã tạo",
    "events.invited": "Được mời",
    "events.joinedBadge": "Đã tham gia",
    "events.player": "người chơi",
    "events.playerJoined": "người chơi đã tham gia",
    "events.playersJoined": "người chơi đã tham gia",
    "events.lastSpot": "Chỗ cuối!",
    "events.creating": "Đang tạo...",
    "events.agreeToJoin": "Đồng ý tham gia",
    "events.deny": "Từ chối",
    "events.goBack": "Quay lại",
    "events.noPlayersYet": "Chưa có người chơi",
    "events.viewAll": "Xem tất cả",
    "events.addFriendsHint":
      "Thêm bạn bè từ hồ sơ của bạn để mời họ tham gia sự kiện",
    "events.loadingMap": "Đang tải bản đồ...",
    "events.sportType": "Loại thể thao",
    "events.eventName": "Tên sự kiện",
    "events.date": "Ngày",
    "events.time": "Giờ",
    "events.endTime": "Giờ kết thúc",
    "events.location": "Địa điểm",
    "events.maxPlayers": "Số người chơi tối đa",
    "events.description": "Mô tả",
    "events.price": "Giá",
    "events.skillLevel": "Trình độ",
    "events.competitive": "Cạnh tranh",
    "events.validation.eventName": "Vui lòng nhập tên sự kiện",
    "events.validation.date": "Vui lòng chọn ngày",
    "events.validation.time": "Vui lòng chọn giờ",
    "events.validation.location": "Vui lòng nhập địa điểm",
    "events.validation.minPlayers": "Phải có ít nhất 2 người chơi",
    "events.failedToCreate": "Không thể tạo sự kiện",
    "events.failedToApprove": "Không thể chấp nhận yêu cầu",
    "events.failedToDeny": "Không thể từ chối lời mời",
    "events.failedToJoin": "Không thể tham gia sự kiện",
    "events.failedToInvite": "Không thể gửi lời mời",
    "events.whenWhere": "Khi nào & Ở đâu",
    "events.details": "Chi tiết",
    "events.totalSpots": "Tổng số chỗ",
    "events.remove": "Xóa",
    "events.addEndTime": "+ Giờ kết thúc",
    "events.eventDetails": "Chi tiết sự kiện",
    "events.eventNotFound": "Không tìm thấy sự kiện",
    "events.cannotInvitePast": "Không thể mời bạn bè tham gia sự kiện đã qua",
    "events.cannotJoinPast": "Không thể tham gia sự kiện đã qua",
    "events.failedToLeave": "Không thể rời sự kiện",
    "events.skillLevel.beginner": "Người mới",
    "events.skillLevel.intermediate": "Trung bình",
    "events.skillLevel.advanced": "Nâng cao",
    "events.skillLevel.all": "Tất cả",
    "events.host": "CHỦ",
    "events.leaveEvent": "Rời sự kiện",
    "events.changeLocation": "Thay đổi địa điểm",
    "events.requestToJoin": "Yêu cầu tham gia",
    "events.pendingRequests": "Yêu cầu đang chờ",
    "events.approved": "Đã chấp nhận",
    "events.inviteFriends": "Mời bạn bè",
    "events.messageAll": "Nhắn tất cả",
    "events.requested": "Đã yêu cầu",
    "events.eventFull": "Sự kiện đã đầy",
    "events.eventEnded": "Sự kiện đã kết thúc",
    "events.pending": "Đang chờ",
    "events.confirmed": "Đã xác nhận",
    "events.invite": "Mời",
    "events.approve": "Chấp nhận",
    "events.noPendingRequests": "Không có yêu cầu đang chờ",
    "events.dateTime": "Ngày & Giờ",
    "events.shareCode":
      "Chia sẻ mã này với người khác để họ tìm thấy sự kiện của bạn",
    "events.eventCreated.gameOn": "Bắt đầu thôi!",
    "events.eventCreated.successMessage": "Đội của bạn đã sẵn sàng. Sự kiện đã được tạo thành công!",
    "events.eventCreated.copyCode": "Sao chép mã",
    "events.eventCreated.inviteCrew": "Mời đội của bạn",
    "events.eventCreated.viewEventDetails": "Xem",
    "events.eventCreated.returnToDashboard": "Quay lại Trang chủ",
    "events.filter.all": "Tất cả",
    "events.filter.created": "Đã tạo",
    "events.filter.joined": "Đã tham gia",
    "events.filter.upcoming": "Sắp tới",
    "events.filter.past": "Đã qua",
    "events.filter.invited": "Được mời",
    "events.noUpcoming": "Không có sự kiện sắp tới",
    "events.noUpcomingCreated": "Bạn chưa tạo sự kiện sắp tới nào",
    "events.noUpcomingJoined": "Bạn chưa tham gia sự kiện sắp tới nào",
    "events.joinFromHome": "Tham gia sự kiện từ trang chủ để xem chúng ở đây",
    "events.noPast": "Không có sự kiện đã qua",
    "events.noPastCreated": "Bạn chưa tạo sự kiện đã qua nào",
    "events.noPastJoined": "Bạn chưa tham gia sự kiện đã qua nào",
    "events.pastHistory": "Lịch sử sự kiện đã qua của bạn sẽ xuất hiện ở đây",
    "events.noCreated": "Bạn chưa tạo sự kiện nào",
    "events.createFirst": "Tạo sự kiện đầu tiên của bạn để bắt đầu",
    "events.noInvited": "Bạn không có lời mời sự kiện nào",
    "events.invitationsAppear": "Lời mời sự kiện sẽ xuất hiện ở đây",
    "events.noCreatedYet": "Chưa tạo sự kiện nào",
    "events.noUpcomingCreatedYet": "Bạn chưa tạo sự kiện sắp tới nào",
    "events.pastCreatedAppear":
      "Các sự kiện đã tạo trong quá khứ của bạn sẽ xuất hiện ở đây",
    "events.createFirstEvent": "Tạo sự kiện đầu tiên của bạn để bắt đầu!",
    "events.loadingInvitations": "Đang tải lời mời...",
    "events.noInvitations": "Không có lời mời",
    "events.invitationsHint":
      "Bạn sẽ thấy lời mời sự kiện ở đây khi bạn bè mời bạn",
    "events.myUpcoming": "Sự kiện sắp diễn ra",
    "events.myPast": "Sự kiện đã diễn ra",
    "events.myCreated": "Đã tạo của tôi",
    "events.myInvited": "Được mời của tôi",
    "events.iCreated": "Tôi đã tạo",
    "events.invitations": "Lời mời",
    "events.currentRoster": "Danh sách hiện tại",
    "events.open": "Mở",
    "events.eventCode": "Mã sự kiện",
    "events.directions": "Chỉ đường",
    "events.eventFee": "Phí sự kiện",
    "events.manageEvent": "Quản lý sự kiện",
    "events.spot": "chỗ",
    "events.spots": "chỗ",
    "events.spotOpen": "chỗ trống",
    "events.spotsOpen": "chỗ trống",
    "events.allFriendsInvited":
      "Tất cả bạn bè của bạn đã ở trong sự kiện này hoặc đã được mời",
    "events.allFriendsInEvent": "Tất cả bạn bè của bạn đã ở trong sự kiện này",
    "events.eventNameLabel": "TÊN SỰ KIỆN",
    "events.dateLabel": "NGÀY",
    "events.timeLabel": "GIỜ",
    "events.noEventsScheduled":
      "Không có sự kiện nào được lên lịch cho ngày này",
    "events.shareEventText": "Tham gia cùng tôi cho {sport} vào {date}",
    "events.logistics": "Hậu cần",
    "events.locationPlaceholder": "Tìm kiếm địa điểm hoặc nhập địa chỉ...",
    "events.competitiveDescription":
      "Chỉ những người có trình độ phù hợp mới có thể tham gia",
    "events.descriptionPlaceholder":
      "Thêm chi tiết về sự kiện của bạn... (ví dụ: quy tắc, những gì cần mang theo, hướng dẫn đặc biệt)",
    "events.mapUnavailable": "Bản đồ xem trước không khả dụng",
    "events.enterLocationAbove": "Nhập địa chỉ địa điểm ở trên",
    "events.enterEventCode": "Nhập mã sự kiện (ví dụ: ABC123)",
    "events.at": "lúc",
    "events.more": "thêm",
    "events.left": "còn lại",
    "events.roster": "Danh sách",

    // Pages
    "pages.messages": "Tin nhắn",
    "pages.profile": "Hồ sơ",
    "pages.comingSoon": "Sắp ra mắt...",
    "pages.chatUnderDevelopment": "Tính năng chat đang được phát triển",

    // Onboarding
    "onboarding.activePlayers": "Người chơi hoạt động",
    "onboarding.proAthleteEdition": "Phiên bản Pro-Athlete",
    "onboarding.findYourSquad": "Tìm",
    "onboarding.squad": "Đội của bạn.",
    "onboarding.dominate": "Thống trị",
    "onboarding.theGame": "Trận đấu.",
    "onboarding.description":
      "Kết nối với các vận động viên địa phương, tham gia các trận đấu ngay lập tức và theo dõi thống kê hiệu suất của bạn.",
    "onboarding.localGames": "Trận đấu địa phương",
    "onboarding.findPlayers": "Tìm người chơi",
    "onboarding.trackStats": "Theo dõi thống kê",
    "onboarding.getStartedFree": "Bắt đầu miễn phí",
    "onboarding.alreadyHaveAccount": "Đã có tài khoản?",
    "onboarding.logIn": "Đăng nhập",
    "onboarding.welcomeBack": "Chào mừng",
    "onboarding.back": "trở lại!",
    "onboarding.getBackOnCourt": "Hãy đưa bạn trở lại sân chơi.",
    "onboarding.loadingProfile": "Đang tải hồ sơ của bạn...",
    "onboarding.redirecting": "Đang chuyển hướng...",
    "onboarding.youreIn": "Bạn đã tham gia!",
    "onboarding.accountCreatedSuccess": "Tài khoản của bạn đã được tạo thành công. Hãy sẵn sàng tìm đội của bạn.",
    "onboarding.new": "Mới",
    "onboarding.proLeagueAccess": "Quyền truy cập Pro League",
    "onboarding.unlockedForProfile": "Đã mở khóa cho hồ sơ của bạn",
    "onboarding.findAGame": "Tìm trận đấu",
    "onboarding.editProfile": "Chỉnh sửa hồ sơ",
    "onboarding.step2Of4": "Bước 2/4",
    "onboarding.whereDoYouPlay": "Bạn chơi ở đâu?",
    "onboarding.setHomeBase": "Đặt căn cứ của bạn để tìm đội, giải đấu và trận đấu gần bạn.",
    "onboarding.selectCity": "Chọn thành phố",
    "onboarding.confirmLocation": "Xác nhận vị trí",
    "onboarding.letsGetYouInGame": "Hãy đưa bạn",
    "onboarding.inTheGame": "vào trận đấu.",
    "onboarding.createAccountToStart": "Tạo tài khoản của bạn để bắt đầu kết nối.",

    // Profile
    "profile.noFriends":
      "Chưa có bạn bè. Thêm bạn bè bằng ID người dùng của họ!",
    "profile.stats": "Thống kê",
    "profile.matches": "Trận đấu",
    "profile.reliability": "Độ tin cậy",
    "profile.mvps": "MVP",
    "profile.level": "Cấp độ",
    "profile.friends": "Bạn bè",
    "profile.sports": "Thể thao",
    "profile.levelPrefix": "Cấp độ",
    "profile.removeFriend": "Xóa",
    "profile.removeFriendConfirm": "Xóa {name} khỏi danh sách bạn bè của bạn?",
    "profile.failedToRemoveFriend": "Không thể xóa bạn bè. Vui lòng thử lại.",
    "profile.addFriend": "Thêm bạn bè",
    "profile.logout": "Đăng xuất",
    "profile.enterUserId": "Vui lòng nhập ID người dùng",
    "profile.invalidUserId":
      "Định dạng ID người dùng không hợp lệ. Sử dụng định dạng: username#1234",
    "profile.userNotFound": "Không tìm thấy người dùng",
    "profile.alreadyFriends": "Bạn đã là bạn bè với người dùng này",
    "profile.friendRequestSent": "Đã gửi lời mời kết bạn thành công",
    "profile.failedToSendRequest": "Không thể gửi lời mời kết bạn",
    "profile.cannotAddSelf": "Bạn không thể thêm chính mình làm bạn bè",
    "profile.errorSearching": "Lỗi khi tìm kiếm người dùng",
    "profile.errorSendingRequest": "Lỗi khi gửi lời mời kết bạn",
    "profile.enterUserIdPlaceholder":
      "Nhập ID người dùng (ví dụ: johndoe#1234)",
    "profile.search": "Tìm kiếm",
    "profile.sendRequest": "Gửi yêu cầu",
    "profile.send": "Gửi",
    "profile.yourUserId": "ID người dùng của bạn",

    // Date & Time
    "date.days.sunday": "Chủ nhật",
    "date.days.monday": "Thứ hai",
    "date.days.tuesday": "Thứ ba",
    "date.days.wednesday": "Thứ tư",
    "date.days.thursday": "Thứ năm",
    "date.days.friday": "Thứ sáu",
    "date.days.saturday": "Thứ bảy",
    "date.months.january": "Tháng 1",
    "date.months.february": "Tháng 2",
    "date.months.march": "Tháng 3",
    "date.months.april": "Tháng 4",
    "date.months.may": "Tháng 5",
    "date.months.june": "Tháng 6",
    "date.months.july": "Tháng 7",
    "date.months.august": "Tháng 8",
    "date.months.september": "Tháng 9",
    "date.months.october": "Tháng 10",
    "date.months.november": "Tháng 11",
    "date.months.december": "Tháng 12",
    "date.months.short.jan": "T1",
    "date.months.short.feb": "T2",
    "date.months.short.mar": "T3",
    "date.months.short.apr": "T4",
    "date.months.short.may": "T5",
    "date.months.short.jun": "T6",
    "date.months.short.jul": "T7",
    "date.months.short.aug": "T8",
    "date.months.short.sep": "T9",
    "date.months.short.oct": "T10",
    "date.months.short.nov": "T11",
    "date.months.short.dec": "T12",
    "date.time.am": "SA",
    "date.time.pm": "CH",
    "date.today": "Hôm nay",
    "date.tomorrow": "Ngày mai",
    "date.days.short.sun": "CN",
    "date.days.short.mon": "T2",
    "date.days.short.tue": "T3",
    "date.days.short.wed": "T4",
    "date.days.short.thu": "T5",
    "date.days.short.fri": "T6",
    "date.days.short.sat": "T7",
  },
};

const LANGUAGE_KEY = "teamup_language";

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    if (saved === "en" || saved === "vi") {
      return saved;
    }
    // Default to Vietnamese for Vietnam
    return "vi";
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load language from database when user is available
  useEffect(() => {
    const loadLanguage = async () => {
      if (user?.id) {
        try {
          const dbLanguage = await settingsService.getLanguage(user.id);
          if (dbLanguage) {
            setLanguageState(dbLanguage);
            localStorage.setItem(LANGUAGE_KEY, dbLanguage);
          }
        } catch (err) {
          console.error("Error loading language from database:", err);
        }
      }
      setIsLoading(false);
    };

    loadLanguage();
  }, [user?.id]);

  useEffect(() => {
    if (!isLoading && user?.id) {
      // Save to database when language changes
      settingsService.saveLanguage(user.id, language).catch((err) => {
        console.error("Error saving language to database:", err);
      });
    }
    localStorage.setItem(LANGUAGE_KEY, language);
  }, [language, user?.id, isLoading]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

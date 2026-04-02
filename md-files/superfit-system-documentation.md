# SuperFit — Complete Web App System Documentation
## Full-Stack Next.js SaaS Fitness Platform | Updated MVP Specification v2.0
### Senior Lead Engineer Reference Document

> **Design visual authority → see `superfit-design-system.md`**
> **This document: complete system architecture, all pages, all features, all interactions, AI code prompt.**
> **NEW in v2.0:** Everfit.io feature parity, Admin panel, Coach-only pages, fully working Timer, AI Meal Scan UI, Twitter-like Community, Messenger-like DMs, dynamic Meal Planner, smart Grocery List, guided Onboarding Calculators, expanded Settings, full Coaching discovery + sidebar expand/collapse behavior.

---

## TABLE OF CONTENTS

1. [Tech Stack & Setup](#1-tech-stack--setup)
2. [Project File Structure](#2-project-file-structure)
3. [TypeScript Type Definitions](#3-typescript-type-definitions)
4. [Zustand Store Specifications](#4-zustand-store-specifications)
5. [Calculation Engine](#5-calculation-engine)
6. [Mock Data Seeds](#6-mock-data-seeds)
7. [Sidebar Behavior — Expand/Collapse](#7-sidebar-behavior)
8. [Page Specifications — All Pages](#8-page-specifications)
   - 8.1 Onboarding (Guided Calculator Flow)
   - 8.2 Dashboard
   - 8.3 Diary (Food + Exercise + AI Scan)
   - 8.4 Hydration (with Calendar: Day/Week/Month/Year + Custom Drinks)
   - 8.5 Workout Logger & Active Session
   - 8.6 Timer Hub (ALL modes FULLY WORKING — zero "Coming Soon")
   - 8.7 Meal Planner (Weekly/Monthly/Yearly + Dynamic UX)
   - 8.8 Grocery List (Day-based, Card-type, Images)
   - 8.9 Calculators Hub (Guided, Onboarding-style)
   - 8.10 Progress (Photos + Weight Comparison)
   - 8.11 Community (Twitter-parity)
   - 8.12 Messages (Facebook Messenger-parity)
   - 8.13 Coaching Discovery + Coaching Sessions
   - 8.14 Settings (Full, with Deactivate)
   - 8.15 Coach-Only Pages (Everfit.io parity)
   - 8.16 Admin Panel (Separate Shell)
9. [Everfit.io Feature Integration](#9-everfit-feature-integration)
10. [Complete AI Code Generator Prompt](#10-complete-ai-code-generator-prompt)

---

## 1. Tech Stack & Setup

### 1.1 Package List

```bash
npx create-next-app@latest superfit --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd superfit
npx shadcn-ui@latest init  # Style: Default, Base: Neutral, CSS vars: Yes

npx shadcn-ui@latest add button card input label select slider switch tabs badge avatar \
  dialog sheet progress separator skeleton toast dropdown-menu popover command calendar \
  scroll-area accordion collapsible radio-group checkbox textarea tooltip alert \
  context-menu hover-card menubar navigation-menu resizable aspect-ratio

npm install framer-motion recharts zustand date-fns react-hook-form zod sonner \
  next-themes lucide-react class-variance-authority clsx tailwind-merge \
  react-dropzone react-image-crop @tanstack/react-query \
  react-beautiful-dnd @hello-pangea/dnd \
  emoji-picker-react react-player \
  react-intersection-observer react-virtualized-auto-sizer react-window \
  howler  # for timer sounds
```

### 1.2 Key Dependencies Explained

- **howler** — full audio engine for timer sounds (work bell, rest bell, 3-second countdown beep, round complete)
- **react-beautiful-dnd / @hello-pangea/dnd** — drag-and-drop for meal planner, timer builder, grocery list
- **react-dropzone** — file/image uploads across diary, progress photos, recipe images
- **react-image-crop** — crop uploaded images for profile and progress photos
- **react-player** — video playback in coaching page and exercise demos
- **emoji-picker-react** — emoji picker in community posts and messenger
- **react-window** — virtual scrolling for community feed, messenger history, large lists
- **@tanstack/react-query** — server state management (ready for real API, mocked in MVP)

---

## 2. Project File Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── onboarding/
│   │       ├── page.tsx               ← Multi-step guided calculator onboarding
│   │       └── components/
│   │           ├── Step1_Welcome.tsx
│   │           ├── Step2_Biometrics.tsx
│   │           ├── Step3_Goals.tsx
│   │           ├── Step4_ActivityLevel.tsx
│   │           ├── Step5_ExerciseFrequency.tsx   ← NEW: how many sessions/week etc
│   │           ├── Step6_DietaryPrefs.tsx
│   │           ├── Step7_SupplementUse.tsx
│   │           ├── Step8_HealthConditions.tsx
│   │           ├── Step9_WaterCalculator.tsx     ← NEW: water consumption calc step
│   │           ├── Step10_Results.tsx             ← show all calculated targets
│   │           └── Step11_Celebration.tsx
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx                 ← AppShell: collapsible sidebar + mobile nav
│   │   ├── page.tsx                   ← Dashboard home
│   │   ├── diary/
│   │   │   ├── page.tsx               ← Food diary + Exercise diary + AI scan
│   │   │   └── scan/page.tsx          ← AI meal scan camera UI
│   │   ├── hydration/
│   │   │   └── page.tsx               ← Full hydration with Day/Week/Month/Year calendar
│   │   ├── workouts/
│   │   │   ├── page.tsx
│   │   │   ├── log/page.tsx
│   │   │   ├── programs/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── timers/
│   │   │   └── page.tsx               ← ALL timer modes FULLY WORKING
│   │   ├── meal-planner/
│   │   │   └── page.tsx               ← Weekly/Monthly/Yearly dynamic planner
│   │   ├── grocery/
│   │   │   └── page.tsx               ← Day-based, card-type grocery list
│   │   ├── calculators/
│   │   │   ├── page.tsx               ← Hub with guided onboarding feel
│   │   │   ├── bmi/page.tsx
│   │   │   ├── protein/page.tsx
│   │   │   ├── calories/page.tsx
│   │   │   ├── creatine/page.tsx
│   │   │   ├── macros/page.tsx
│   │   │   ├── tdee/page.tsx
│   │   │   ├── body-fat/page.tsx
│   │   │   ├── one-rep-max/page.tsx
│   │   │   ├── vo2-max/page.tsx
│   │   │   ├── heart-rate-zones/page.tsx
│   │   │   ├── if-window/page.tsx
│   │   │   ├── water/page.tsx         ← NEW: dedicated water calculator
│   │   │   ├── reverse-diet/page.tsx
│   │   │   ├── ideal-weight/page.tsx
│   │   │   ├── calories-burned/page.tsx
│   │   │   └── caffeine/page.tsx
│   │   ├── progress/
│   │   │   └── page.tsx               ← Photos with weight tagging + comparison
│   │   ├── coaching/
│   │   │   ├── page.tsx               ← Coach discovery (filter by location, specialty)
│   │   │   ├── [coachId]/page.tsx     ← Coach profile + subscribe + session
│   │   │   └── my-coach/page.tsx      ← Active coaching relationship
│   │   ├── community/
│   │   │   └── page.tsx               ← Twitter-parity social feed
│   │   ├── messages/
│   │   │   └── page.tsx               ← Facebook Messenger-parity DMs
│   │   └── settings/
│   │       └── page.tsx               ← Full settings including deactivate
│   │
│   ├── coach/
│   │   ├── layout.tsx                 ← SEPARATE coach shell (different nav from user)
│   │   ├── page.tsx                   ← Coach dashboard
│   │   ├── clients/
│   │   │   ├── page.tsx               ← Client roster
│   │   │   └── [clientId]/page.tsx    ← Per-client detail
│   │   ├── programs/page.tsx          ← Build/manage programs
│   │   ├── content/page.tsx           ← Publish posts, videos, courses
│   │   ├── schedule/page.tsx          ← Availability + session booking calendar
│   │   ├── analytics/page.tsx         ← Revenue + engagement metrics
│   │   ├── broadcast/page.tsx         ← Broadcast messages to all clients
│   │   ├── forms/page.tsx             ← Create questionnaires for clients
│   │   ├── marketplace/page.tsx       ← Sell programs / courses
│   │   └── settings/page.tsx          ← Coach profile, payment, branding
│   │
│   ├── admin/
│   │   ├── layout.tsx                 ← SEPARATE admin shell
│   │   ├── page.tsx                   ← Admin dashboard
│   │   ├── users/page.tsx
│   │   ├── coaches/page.tsx
│   │   ├── content/page.tsx
│   │   ├── food-db/page.tsx
│   │   ├── analytics/page.tsx
│   │   ├── payments/page.tsx
│   │   └── settings/page.tsx
│   │
│   ├── globals.css
│   └── layout.tsx
│
├── components/
│   ├── ui/                            ← shadcn generated
│   ├── layout/
│   │   ├── AppShell.tsx
│   │   ├── Sidebar.tsx                ← Collapsible: icon-click expands, click again collapses
│   │   ├── SidebarItem.tsx
│   │   ├── MobileNav.tsx
│   │   ├── TopBar.tsx
│   │   ├── DesktopTopBar.tsx
│   │   ├── CoachShell.tsx             ← Coach-only layout wrapper
│   │   ├── AdminShell.tsx             ← Admin-only layout wrapper
│   │   └── PageWrapper.tsx
│   ├── diary/
│   │   ├── FoodDiary.tsx
│   │   ├── ExerciseDiarySection.tsx   ← Add exercises to diary
│   │   ├── MealSection.tsx
│   │   ├── FoodEntryRow.tsx
│   │   ├── FoodSearchSheet.tsx
│   │   ├── MacroSummaryBar.tsx
│   │   ├── CalendarStrip.tsx
│   │   ├── AIMealScan.tsx             ← Camera UI + image save + food add
│   │   └── AddFoodModal.tsx
│   ├── hydration/
│   │   ├── HydrationRing.tsx
│   │   ├── HydrationCalendar.tsx      ← Day/Week/Month/Year calendar view
│   │   ├── QuickAddButtons.tsx
│   │   ├── CustomDrinkModal.tsx       ← Add custom drink
│   │   ├── CaffeineMonitor.tsx        ← Caffeine tracking panel
│   │   ├── DrinkLog.tsx
│   │   └── HydrationChart.tsx
│   ├── timers/
│   │   ├── TimerHub.tsx
│   │   ├── IntervalTimer.tsx          ← Core timer engine (Howler.js sounds)
│   │   ├── TabataTimer.tsx
│   │   ├── HIITTimer.tsx
│   │   ├── EMOMTimer.tsx
│   │   ├── AMRAPTimer.tsx
│   │   ├── BoxingTimer.tsx
│   │   ├── CircuitTimer.tsx
│   │   ├── RunningTimer.tsx
│   │   ├── YogaTimer.tsx
│   │   ├── CustomTimerBuilder.tsx
│   │   ├── TimerDisplay.tsx
│   │   ├── TimerControls.tsx
│   │   ├── AdvancedTimerSettings.tsx  ← FULLY WORKING — not coming soon
│   │   └── WorkoutTimerTemplates.tsx
│   ├── meal-planner/
│   │   ├── MealPlannerCalendar.tsx    ← Week/Month/Year views
│   │   ├── MealPlannerCell.tsx        ← Individual meal slot
│   │   ├── AddMealModal.tsx           ← Rich add-meal experience
│   │   ├── RecipeCard.tsx
│   │   ├── MealCard.tsx
│   │   └── MealPlannerSidebar.tsx
│   ├── grocery/
│   │   ├── GroceryList.tsx
│   │   ├── GroceryDayView.tsx
│   │   ├── GroceryCategory.tsx        ← Card-type category with image
│   │   ├── GroceryItem.tsx
│   │   └── AddGroceryModal.tsx
│   ├── community/                     ← Twitter-parity
│   │   ├── Feed.tsx
│   │   ├── TweetComposer.tsx
│   │   ├── PostCard.tsx
│   │   ├── ReplyThread.tsx
│   │   ├── QuotePost.tsx
│   │   ├── Repost.tsx
│   │   ├── Bookmarks.tsx
│   │   ├── Trending.tsx
│   │   ├── WhoToFollow.tsx
│   │   ├── HashtagPage.tsx
│   │   ├── Notifications.tsx
│   │   ├── SearchPeople.tsx
│   │   └── UserProfile.tsx
│   ├── messages/                      ← Facebook Messenger-parity
│   │   ├── MessengerLayout.tsx
│   │   ├── ConversationList.tsx
│   │   ├── ChatWindow.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── MessageComposer.tsx
│   │   ├── EmojiPicker.tsx
│   │   ├── GifPicker.tsx
│   │   ├── FileAttachment.tsx
│   │   ├── VoiceRecorder.tsx
│   │   ├── MessageReactions.tsx
│   │   ├── GroupChatModal.tsx
│   │   ├── VideoCallUI.tsx
│   │   └── SeenReceipts.tsx
│   ├── coaching/
│   │   ├── CoachDiscovery.tsx
│   │   ├── CoachCard.tsx
│   │   ├── CoachFilters.tsx           ← Filter by location, specialty, price, rating
│   │   ├── CoachProfile.tsx
│   │   ├── CoachingSession.tsx        ← Active coaching relationship page
│   │   ├── SubscribeModal.tsx
│   │   ├── SessionBooking.tsx
│   │   └── CoachReviews.tsx
│   ├── progress/
│   │   ├── ProgressPhotoUpload.tsx    ← Upload + tag weight
│   │   ├── PhotoComparison.tsx        ← Before/After (After = always latest)
│   │   ├── WeightChart.tsx
│   │   ├── MeasurementsTracker.tsx
│   │   └── PRTracker.tsx
│   └── shared/
│       ├── PageHeader.tsx
│       ├── ProgressRing.tsx
│       ├── ThemeToggle.tsx
│       ├── LoadingSkeleton.tsx
│       ├── EmptyState.tsx
│       └── ImageUploader.tsx
│
├── store/                             ← All 10 Zustand stores
├── lib/                               ← calculations, databases, utils
├── hooks/                             ← useTimer, useSound, useCamera, etc.
└── types/index.ts
```

---

## 3. TypeScript Type Definitions

### Complete additions to `src/types/index.ts`

```typescript
// ══════════════════════════════════════════
// TIMER (FULLY IMPLEMENTED)
// ══════════════════════════════════════════
export type TimerMode =
  | 'tabata' | 'hiit' | 'emom' | 'amrap' | 'circuit'
  | 'custom' | 'round_timer' | 'countdown' | 'yoga'
  | 'boxing' | 'running' | 'pt' | 'bodyweight' | 'group_class'

export interface TimerInterval {
  id:              string
  name:            string
  durationSeconds: number
  type:            'work' | 'rest' | 'prepare' | 'transition'
  color:           string
  exerciseGifUrl?: string
  coachingCue?:    string
  soundAlert?:     'bell' | 'beep' | 'whistle' | 'custom' | 'none'
}

export interface TimerAdvancedSettings {
  prepCountdownSeconds:  number     // countdown before first interval (3–10)
  soundEnabled:          boolean
  workSound:             'bell' | 'whistle' | 'beep' | 'custom'
  restSound:             'bell' | 'whistle' | 'beep' | 'custom'
  countdownBeeps:        boolean    // last 3 seconds beep
  screenKeepAwake:       boolean
  colorPulseOnWork:      boolean    // screen color pulses on work interval
  vibrationEnabled:      boolean
  showExerciseGif:       boolean
  autoStartNextInterval: boolean
  halfwayAlert:          boolean    // plays sound at 50% of interval
  customWorkSoundUrl?:   string
  customRestSoundUrl?:   string
}

export interface TimerConfig {
  id:               string
  name:             string
  mode:             TimerMode
  intervals:        TimerInterval[]
  totalRounds:      number
  prepSeconds:      number
  restBetweenRounds: number
  advancedSettings: TimerAdvancedSettings
}

export interface TimerState {
  isRunning:          boolean
  isPaused:           boolean
  currentRound:       number
  totalRounds:        number
  currentIntervalIdx: number
  secondsRemaining:   number
  totalElapsed:       number
  phase:              'prepare' | 'work' | 'rest' | 'between_rounds' | 'complete'
  completedSets:      number
}

// ══════════════════════════════════════════
// HYDRATION (EXTENDED)
// ══════════════════════════════════════════
export type DrinkType =
  | 'water' | 'coffee' | 'tea' | 'juice' | 'sports_drink'
  | 'milk' | 'sparkling' | 'smoothie' | 'soda' | 'energy_drink'
  | 'alcohol' | 'protein_shake' | 'custom'

export interface CustomDrink {
  id:              string
  name:            string
  icon:            string           // emoji or lucide icon name
  caffeinePerMl:   number           // mg per ml (0 if none)
  hydrationFactor: number           // 0.0–1.0 (negative for alcohol)
  color:           string           // hex for UI indicator
  isDefault:       boolean
}

export type HydrationViewMode = 'day' | 'week' | 'month' | 'year'

// ══════════════════════════════════════════
// DIARY — EXTENDED (Food + Exercise)
// ══════════════════════════════════════════
export interface ExerciseDiaryEntry {
  id:            string
  exerciseId:    string
  exerciseName:  string
  sets:          number
  reps:          number
  weight:        number
  durationMins?: number
  caloriesBurned?: number
  loggedAt:      string
  date:          string
}

export interface AIMealScanResult {
  id:          string
  imageUrl:    string           // saved locally / blob URL
  scannedAt:   string
  detectedItems: {
    name:      string
    confidence: number         // 0–1
    calories:  number
    protein:   number
    carbs:     number
    fat:       number
    servingEst: string         // "1 cup", "200g" etc.
  }[]
  confirmed:   boolean         // did user confirm and log?
  addedFoods:  string[]        // food item IDs added to diary
}

// ══════════════════════════════════════════
// MEAL PLANNER (DYNAMIC)
// ══════════════════════════════════════════
export type PlannerView = 'week' | 'month' | 'year'

export interface PlannedItem {
  id:          string
  type:        'food' | 'drink' | 'recipe' | 'custom'
  name:        string
  imageUrl?:   string
  calories?:   number
  protein?:    number
  carbs?:      number
  fat?:        number
  recipe?:     Recipe
  notes?:      string
  servings?:   number
}

export interface Recipe {
  id:           string
  name:         string
  imageUrl?:    string
  description?: string
  prepMins:     number
  cookMins:     number
  servings:     number
  ingredients:  { name: string; amount: string; unit: string }[]
  instructions: string[]
  macros:       { calories: number; protein: number; carbs: number; fat: number }
  tags:         string[]         // 'high-protein', 'vegan', 'quick', etc.
  isCustom:     boolean
  authorId?:    string
}

export interface MealPlanEntry {
  id:        string
  date:      string             // YYYY-MM-DD
  mealSlot:  'breakfast' | 'morning_snack' | 'lunch' | 'afternoon_snack' | 'dinner' | 'evening_snack'
  items:     PlannedItem[]
  notes?:    string
}

// ══════════════════════════════════════════
// GROCERY LIST
// ══════════════════════════════════════════
export interface GroceryCategory {
  id:      string
  name:    string              // "Produce", "Proteins", "Dairy", or custom
  imageUrl?: string
  color:   string
}

export interface GroceryItem {
  id:         string
  name:       string
  quantity:   string           // "2 lbs", "1 dozen", "500g"
  imageUrl?:  string
  category:   string           // GroceryCategory id
  date:       string           // YYYY-MM-DD — which day this is for
  isChecked:  boolean
  price?:     number
  notes?:     string
  fromMealPlan: boolean        // auto-generated from meal planner
}

// ══════════════════════════════════════════
// PROGRESS PHOTOS (EXTENDED)
// ══════════════════════════════════════════
export interface ProgressPhoto {
  id:          string
  date:        string
  imageUrl:    string
  weight?:     number          // tagged weight on upload
  bodyFat?:    number
  notes?:      string
  isBaseline:  boolean         // "before" photo
  tags?:       string[]
}

// ══════════════════════════════════════════
// COMMUNITY (TWITTER-PARITY)
// ══════════════════════════════════════════
export type PostType = 'text' | 'image' | 'video' | 'workout' | 'meal' | 'pr' | 'poll' | 'article'

export interface CommunityPost {
  id:             string
  authorId:       string
  authorName:     string
  authorHandle:   string         // @username
  authorAvatar:   string
  isCoach:        boolean
  isVerified:     boolean
  type:           PostType
  content:        string
  mediaUrls?:     string[]       // up to 4 images
  videoUrl?:      string
  poll?:          { question: string; options: { id: string; text: string; votes: number }[]; endsAt: string }
  quotedPostId?:  string         // quote tweet
  replyToId?:     string
  replyToHandle?: string
  hashtags:       string[]
  mentions:       string[]
  likes:          number
  replies:        number
  reposts:        number
  quotes:         number
  bookmarks:      number
  views:          number
  isLiked?:       boolean
  isReposted?:    boolean
  isBookmarked?:  boolean
  isPinned?:      boolean
  postedAt:       string
  editedAt?:      string
  isDeleted?:     boolean
}

export interface CommunityProfile {
  id:             string
  name:           string
  handle:         string
  avatar:         string
  bannerImage?:   string
  bio?:           string
  location?:      string
  website?:       string
  joinDate:       string
  followingCount: number
  followersCount: number
  postsCount:     number
  isFollowing?:   boolean
  isFollowedBy?:  boolean
  isVerified:     boolean
  isCoach:        boolean
  isPinned?:      boolean
}

// ══════════════════════════════════════════
// MESSAGES (FACEBOOK MESSENGER-PARITY)
// ══════════════════════════════════════════
export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'file' | 'gif' | 'sticker' | 'reaction_event' | 'call_event' | 'workout_share' | 'food_share'

export interface Message {
  id:           string
  conversationId: string
  senderId:     string
  senderName:   string
  senderAvatar: string
  type:         MessageType
  content?:     string
  mediaUrl?:    string
  fileName?:    string
  fileSize?:    number
  reactions:    { emoji: string; userIds: string[] }[]
  replyTo?:     { id: string; content: string; senderName: string }
  seenBy:       string[]            // user IDs who have seen
  deliveredTo:  string[]
  sentAt:       string
  editedAt?:    string
  isDeleted:    boolean
  deletedFor?:  'me' | 'everyone'
}

export interface Conversation {
  id:             string
  type:           'direct' | 'group'
  name?:          string           // group name
  avatarUrl?:     string           // group avatar
  participants:   { id: string; name: string; avatar: string; role?: 'admin' | 'member' }[]
  lastMessage?:   Message
  unreadCount:    number
  isPinned:       boolean
  isMuted:        boolean
  isArchived:     boolean
  theme?:         string           // conversation color theme
  emoji?:         string           // custom conversation emoji
  nicknames?:     Record<string, string>  // userId → nickname
  createdAt:      string
  updatedAt:      string
}

// ══════════════════════════════════════════
// COACHING (EXTENDED)
// ══════════════════════════════════════════
export interface CoachLocation {
  country:  string
  city:     string
  lat?:     number
  lng?:     number
  isOnline: boolean
}

export interface CoachAvailability {
  timezone:   string
  slots:      { day: number; startHour: number; endHour: number }[]
  nextAvailable?: string
}

export interface CoachSubscriptionPlan {
  id:          string
  name:        string            // "Basic", "Premium", "Elite"
  price:       number
  currency:    string
  interval:    'month' | 'year'
  features:    string[]
  maxSessions: number | 'unlimited'
}

export interface CoachReview {
  id:         string
  clientId:   string
  clientName: string
  clientAvatar: string
  coachId:    string
  rating:     number
  content:    string
  createdAt:  string
  helpful:    number
}

// ══════════════════════════════════════════
// ADMIN
// ══════════════════════════════════════════
export type AdminRole = 'super_admin' | 'moderator' | 'support' | 'analytics'

export interface AdminUser {
  id:       string
  email:    string
  name:     string
  role:     AdminRole
  lastLogin: string
  permissions: string[]
}

export interface FlaggedContent {
  id:         string
  type:       'post' | 'comment' | 'message' | 'profile' | 'review'
  contentId:  string
  reason:     string
  reportedBy: string
  reportedAt: string
  status:     'pending' | 'reviewed' | 'removed' | 'dismissed'
  reviewedBy?: string
}

// ══════════════════════════════════════════
// SETTINGS (EXTENDED)
// ══════════════════════════════════════════
export interface AppSettings {
  theme:               'light' | 'dark' | 'system'
  unitSystem:          'metric' | 'imperial'
  language:            string
  timezone:            string
  firstDayOfWeek:      0 | 1      // 0=Sun, 1=Mon
  dateFormat:          'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'
  defaultDiaryView:    'day' | 'week'
  notifications: {
    meals:            boolean
    water:            boolean
    workouts:         boolean
    supplements:      boolean
    coaching:         boolean
    community:        boolean
    messages:         boolean
    weeklyReport:     boolean
    promotions:       boolean
    mealReminderTimes: string[]    // ["08:00", "12:00", "19:00"]
    waterInterval:    number       // minutes
  }
  privacy: {
    profileVisibility:    'public' | 'followers' | 'private'
    diaryVisibility:      'private' | 'coach' | 'public'
    weightVisibility:     'private' | 'coach'
    activityStatus:       boolean
    readReceipts:         boolean
    dataSharing:          boolean
    searchable:           boolean
  }
  integrations: {
    appleHealth:    boolean
    googleFit:      boolean
    garmin:         boolean
    fitbit:         boolean
    samsung:        boolean
    strava:         boolean
    withings:       boolean
    spotify:        boolean
  }
  accessibility: {
    fontSize:        'sm' | 'md' | 'lg' | 'xl'
    reduceMotion:    boolean
    highContrast:    boolean
  }
  account: {
    twoFactorEnabled:  boolean
    linkedSocial:      string[]    // ['google', 'apple', 'facebook']
    activeDevices:     { device: string; lastSeen: string; location: string }[]
  }
}
```

---

## 4. Zustand Store Specifications

### useTimerStore (FULLY IMPLEMENTED — NO COMING SOON)

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { TimerConfig, TimerState, TimerMode } from '@/types'
import { Howl } from 'howler'

// BUILT-IN TIMER TEMPLATES — ALL FULLY WORKING
export const TIMER_TEMPLATES: TimerConfig[] = [
  // Tabata Classic
  {
    id: 'tabata_classic', name: 'Tabata Classic', mode: 'tabata', totalRounds: 8, prepSeconds: 10, restBetweenRounds: 10,
    intervals: [
      { id: 'work', name: 'Work', durationSeconds: 20, type: 'work', color: '#22c55e', soundAlert: 'bell' },
      { id: 'rest', name: 'Rest', durationSeconds: 10, type: 'rest', color: '#525252', soundAlert: 'beep' },
    ],
    advancedSettings: { prepCountdownSeconds: 10, soundEnabled: true, workSound: 'bell', restSound: 'beep', countdownBeeps: true, screenKeepAwake: true, colorPulseOnWork: true, vibrationEnabled: true, showExerciseGif: false, autoStartNextInterval: true, halfwayAlert: false },
  },
  // HIIT 30:30
  {
    id: 'hiit_3030', name: 'HIIT 30:30', mode: 'hiit', totalRounds: 10, prepSeconds: 10, restBetweenRounds: 60,
    intervals: [
      { id: 'work', name: 'High Intensity', durationSeconds: 30, type: 'work', color: '#ef4444', soundAlert: 'whistle' },
      { id: 'rest', name: 'Recovery', durationSeconds: 30, type: 'rest', color: '#3b82f6', soundAlert: 'beep' },
    ],
    advancedSettings: { prepCountdownSeconds: 10, soundEnabled: true, workSound: 'whistle', restSound: 'beep', countdownBeeps: true, screenKeepAwake: true, colorPulseOnWork: true, vibrationEnabled: true, showExerciseGif: false, autoStartNextInterval: true, halfwayAlert: true },
  },
  // EMOM 10min
  { id: 'emom_10', name: 'EMOM 10 Minutes', mode: 'emom', totalRounds: 10, prepSeconds: 5, restBetweenRounds: 0,
    intervals: [{ id: 'min', name: 'Minute', durationSeconds: 60, type: 'work', color: '#f59e0b', soundAlert: 'bell' }],
    advancedSettings: { prepCountdownSeconds: 5, soundEnabled: true, workSound: 'bell', restSound: 'bell', countdownBeeps: true, screenKeepAwake: true, colorPulseOnWork: false, vibrationEnabled: true, showExerciseGif: false, autoStartNextInterval: true, halfwayAlert: false },
  },
  // Boxing 3min rounds
  { id: 'boxing_3min', name: 'Boxing Rounds', mode: 'boxing', totalRounds: 12, prepSeconds: 10, restBetweenRounds: 60,
    intervals: [
      { id: 'round', name: 'Round', durationSeconds: 180, type: 'work', color: '#ef4444', soundAlert: 'bell' },
      { id: 'rest', name: 'Rest', durationSeconds: 60, type: 'rest', color: '#1a1a1a', soundAlert: 'bell' },
    ],
    advancedSettings: { prepCountdownSeconds: 10, soundEnabled: true, workSound: 'bell', restSound: 'bell', countdownBeeps: true, screenKeepAwake: true, colorPulseOnWork: true, vibrationEnabled: true, showExerciseGif: false, autoStartNextInterval: true, halfwayAlert: true },
  },
  // AMRAP 10min
  { id: 'amrap_10', name: 'AMRAP 10 Minutes', mode: 'amrap', totalRounds: 1, prepSeconds: 10, restBetweenRounds: 0,
    intervals: [{ id: 'amrap', name: 'AMRAP', durationSeconds: 600, type: 'work', color: '#a855f7', soundAlert: 'bell' }],
    advancedSettings: { prepCountdownSeconds: 10, soundEnabled: true, workSound: 'bell', restSound: 'bell', countdownBeeps: true, screenKeepAwake: true, colorPulseOnWork: false, vibrationEnabled: true, showExerciseGif: false, autoStartNextInterval: false, halfwayAlert: true },
  },
  // Yoga Flow
  { id: 'yoga_flow', name: 'Yoga Flow', mode: 'yoga', totalRounds: 1, prepSeconds: 10, restBetweenRounds: 0,
    intervals: [
      { id: 'pose1', name: 'Mountain Pose', durationSeconds: 60, type: 'work', color: '#22c55e', coachingCue: 'Stand tall, feet hip-width', soundAlert: 'beep' },
      { id: 'pose2', name: 'Forward Fold', durationSeconds: 45, type: 'work', color: '#22c55e', coachingCue: 'Hinge at hips, soften knees', soundAlert: 'beep' },
      { id: 'trans1', name: 'Transition', durationSeconds: 10, type: 'transition', color: '#525252', soundAlert: 'none' },
    ],
    advancedSettings: { prepCountdownSeconds: 10, soundEnabled: true, workSound: 'beep', restSound: 'beep', countdownBeeps: false, screenKeepAwake: true, colorPulseOnWork: false, vibrationEnabled: false, showExerciseGif: true, autoStartNextInterval: true, halfwayAlert: false },
  },
]

interface TimerStoreState {
  configs:        TimerConfig[]
  activeConfig:   TimerConfig | null
  timerState:     TimerState | null
  intervalRef:    ReturnType<typeof setInterval> | null
  sounds: {
    bell:    Howl | null
    beep:    Howl | null
    whistle: Howl | null
  }
  // Actions
  loadConfig:    (configId: string) => void
  loadCustom:    (config: TimerConfig) => void
  saveConfig:    (config: TimerConfig) => void
  deleteConfig:  (configId: string) => void
  start:         () => void
  pause:         () => void
  resume:        () => void
  stop:          () => void
  skip:          () => void
  restart:       () => void
  tick:          () => void        // called every second by useTimer hook
  incrementRound:() => void        // for AMRAP manual counter
  updateAdvancedSettings: (configId: string, settings: Partial<TimerAdvancedSettings>) => void
}
```

### useHydrationStore (EXTENDED)

```typescript
// Custom drinks registry
customDrinks: CustomDrink[]
addCustomDrink: (drink: Omit<CustomDrink, 'id'>) => void
updateCustomDrink: (id: string, updates: Partial<CustomDrink>) => void
deleteCustomDrink: (id: string) => void

// View mode
viewMode: HydrationViewMode
setViewMode: (mode: HydrationViewMode) => void

// Calendar data
getDataForWeek:  (startDate: Date) => HydrationDay[]
getDataForMonth: (year: number, month: number) => HydrationDay[]
getDataForYear:  (year: number) => { month: number; avgMl: number; goalMl: number; daysHit: number }[]

// Caffeine monitoring
getTodayCaffeine: () => number
getDailyCaffeineTarget: () => number    // from user settings (default 400mg)
getCaffeineStatus: () => 'safe' | 'approaching' | 'over_limit'
getCaffeineByDrink: () => { drinkType: string; totalMg: number }[]
```

### useDiaryStore (EXTENDED — combines food + exercise)

```typescript
// Exercise diary entries
exerciseEntries: Record<string, ExerciseDiaryEntry[]>  // key: YYYY-MM-DD
addExerciseEntry:    (entry: Omit<ExerciseDiaryEntry, 'id'>) => void
removeExerciseEntry: (entryId: string, date?: string) => void
getTodayExerciseCalories: () => number

// AI scan
scanResults: AIMealScanResult[]
saveScanResult:   (result: AIMealScanResult) => void
confirmScanResult:(resultId: string, selectedItems: number[]) => void  // add to diary
getScanHistory:   () => AIMealScanResult[]
```

### useCommunityStore (TWITTER-PARITY)

```typescript
posts:       CommunityPost[]
profiles:    Record<string, CommunityProfile>
following:   string[]              // user IDs current user follows
followers:   string[]
trendingHashtags: { tag: string; count: number }[]
notifications:    CommunityNotification[]
bookmarks:        string[]         // post IDs
// Actions
createPost:        (post: Omit<CommunityPost, 'id' | 'likes' | 'replies' | 'reposts' | 'quotes' | 'views'>) => void
deletePost:        (postId: string) => void
editPost:          (postId: string, newContent: string) => void
likePost:          (postId: string) => void
unlikePost:        (postId: string) => void
repostPost:        (postId: string) => void
quotePost:         (postId: string, comment: string) => void
replyToPost:       (postId: string, content: string, mediaUrls?: string[]) => void
bookmarkPost:      (postId: string) => void
removeBookmark:    (postId: string) => void
followUser:        (userId: string) => void
unfollowUser:      (userId: string) => void
blockUser:         (userId: string) => void
reportPost:        (postId: string, reason: string) => void
pinPost:           (postId: string) => void
votePoll:          (postId: string, optionId: string) => void
getRepliesToPost:  (postId: string) => CommunityPost[]
getPostsByHashtag: (tag: string) => CommunityPost[]
searchPosts:       (query: string) => CommunityPost[]
getFollowingFeed:  () => CommunityPost[]
getExploreFeed:    () => CommunityPost[]
```

### useMessagesStore (MESSENGER-PARITY)

```typescript
conversations:       Conversation[]
messages:            Record<string, Message[]>  // key: conversationId
activeConversationId: string | null
typingUsers:         Record<string, string[]>   // key: convId → userIds typing
onlineUsers:         string[]
// Actions
sendMessage:         (convId: string, msg: Omit<Message, 'id' | 'sentAt' | 'reactions' | 'seenBy' | 'deliveredTo'>) => void
deleteMessage:       (convId: string, msgId: string, deleteFor: 'me' | 'everyone') => void
editMessage:         (convId: string, msgId: string, newContent: string) => void
addReaction:         (convId: string, msgId: string, emoji: string) => void
removeReaction:      (convId: string, msgId: string, emoji: string) => void
markAsSeen:          (convId: string) => void
createConversation:  (participantIds: string[], isGroup?: boolean, groupName?: string) => string
archiveConversation: (convId: string) => void
deleteConversation:  (convId: string) => void
pinConversation:     (convId: string) => void
muteConversation:    (convId: string, until?: string) => void
setConversationTheme:(convId: string, theme: string) => void
setNickname:         (convId: string, userId: string, nickname: string) => void
setGroupEmoji:       (convId: string, emoji: string) => void
setTyping:           (convId: string, isTyping: boolean) => void
searchMessages:      (query: string) => { convId: string; messages: Message[] }[]
forwardMessage:      (msgId: string, toConvId: string) => void
getUnreadCount:      () => number
```

---

## 5. Calculation Engine

### Water Consumption Calculator (NEW — added to calculations.ts)

```typescript
/**
 * Comprehensive water consumption calculator
 * Used in onboarding Step 9 and standalone /calculators/water
 */
export function calculateDetailedWaterNeeds(params: {
  weightKg:        number
  heightCm:        number
  age:             number
  sex:             Sex
  activityLevel:   ActivityLevel
  climate:         'cold' | 'temperate' | 'hot' | 'very_hot'
  isPregnant:      boolean
  isBreastfeeding: boolean
  caffeineIntakeMg: number     // daily caffeine — each 100mg adds ~150ml water
  alcoholUnits:    number      // per day — each unit adds ~200ml
}): {
  baseGoalMl:      number      // weight × 35ml/kg
  activityAddMl:   number      // activity bonus
  climateAddMl:    number      // heat adjustment
  pregnancyAddMl:  number      // +300ml if pregnant, +500ml if breastfeeding
  caffeineAddMl:   number      // compensation for caffeine diuresis
  alcoholAddMl:    number      // compensation for alcohol diuresis
  totalGoalMl:     number      // sum of all above
  glassesEquiv:    number      // 8oz glasses
  bottlesEquiv:    number      // 500ml bottles
  breakdown:       { label: string; ml: number; pct: number }[]
}
```

---

## 6. Mock Data Seeds

All stores seeded — no empty screens on first load. See Section 4 for store initialization. Key seeds:

- 60 food items (proteins, grains, veg, dairy, nuts, fats, supplements, beverages)
- 80 exercises (all muscle groups, all equipment types)
- 6 coaches with full profiles, location, availability, pricing, reviews
- 30 days weight history (gradual downtrend)
- 5 past workout sessions + 4 routines
- 7 days hydration history
- 6 custom drink types pre-populated (water, coffee, green tea, protein shake, juice, energy drink)
- 20 community posts across feed (tweets, workout shares, PRs, meals)
- 4 active conversations in Messages with message history
- Meal planner: current week pre-filled with sample meals
- Grocery list: current week with sample items in 5 categories

---

## 7. Sidebar Behavior — Expand/Collapse

### Exact Interaction Logic

The sidebar responds to **icon clicks** as the toggle mechanism. This is the critical behavior:

```typescript
// In Sidebar.tsx:
const [expanded, setExpanded] = useState(true)   // starts expanded on desktop
const [hoveredItem, setHoveredItem] = useState<string | null>(null)

// RULE: Clicking any navigation icon toggles expanded state
// When collapsed (64px): only icons show
// When expanded (240px): icons + labels show
// Clicking the SAME icon that triggered expand → collapses again
// Clicking ANYWHERE ELSE on the sidebar (non-icon area) while expanded → collapses

const handleIconClick = (itemId: string) => {
  if (!expanded) {
    // Sidebar is collapsed → expand it
    setExpanded(true)
    navigate(itemId)   // also navigate to the route
  } else {
    // Sidebar is expanded → navigate normally
    // If user clicks the ALREADY ACTIVE item → collapse sidebar
    if (currentActiveItem === itemId) {
      setExpanded(false)
    } else {
      navigate(itemId)
    }
  }
}

// Click on non-interactive sidebar area → collapse
const handleSidebarBackdropClick = () => {
  if (expanded) setExpanded(false)
}
```

### Animation Spec

```typescript
// Framer Motion sidebar variants
const sidebarVariants = {
  expanded:  { width: 240, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } },
  collapsed: { width: 64,  transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } },
}

// Label fade variants (text label inside each nav item)
const labelVariants = {
  expanded:  { opacity: 1, x: 0, display: 'block', transition: { delay: 0.1, duration: 0.15 } },
  collapsed: { opacity: 0, x: -10, transitionEnd: { display: 'none' } },
}

// Main content margin animation
const contentVariants = {
  expanded:  { marginLeft: 240, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } },
  collapsed: { marginLeft: 64,  transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } },
}
```

### Tooltip on Collapsed State

When sidebar is collapsed (64px), hovering over any icon shows a tooltip with the item label:

```tsx
// Each nav item when collapsed:
<Tooltip>
  <TooltipTrigger>
    <Icon size={18} />
  </TooltipTrigger>
  <TooltipContent side="right">
    {item.label}
  </TooltipContent>
</Tooltip>
```

### Mobile: Sidebar does not show — uses bottom tab nav instead (unchanged from design system)

---

## 8. Page Specifications

### 8.1 Onboarding — Guided Calculator Flow (11 Steps)

This is NOT a simple form. It feels like a guided product experience with images, coaching cues, and personality.

**Each step has:**
- A hero illustration/image (fitness-relevant, 200px)
- Step headline ("Let's get to know you")
- A subtitle explaining WHY this question matters ("This helps us calculate your exact calorie needs")
- The input(s)
- Back/Next buttons
- Green progress bar at top showing step/total

**Step 1 — Welcome:**
```
Large SF logo animation (scale from 0)
"Welcome to SuperFit" (display-xl)
"Your intelligent fitness companion"
[Name input]
[Profile photo upload — optional, circular crop]
[Get Started button — large, full-width green]
```

**Step 2 — Biometrics:**
```
Illustration: body silhouette with measurement markers
"Tell us about your body"
"We use this to calculate your exact metabolic rate"
[Sex toggle: Male | Female (pill buttons)]
[Age: NumberStepper 18–80, default 25]
[Height: dual stepper ft/in OR cm, toggle units]
[Current weight: NumberStepper]
[Goal weight: NumberStepper]
[Unit system toggle: Metric / Imperial — persists globally]
```

**Step 3 — Goals:**
```
Illustration: split image showing different physiques/goals
"What's your primary goal?"
6 goal cards in 2×3 grid:
  [Weight Loss]      [Muscle Gain]     [Body Recomposition]
  [Maintenance]      [Endurance]       [General Fitness]
Each card: icon + name + 1-line description
Single select — selected card gets green border + checkmark
```

**Step 4 — Activity Level:**
```
Illustration: spectrum from desk worker to athlete
"How active is your daily life?"
"Outside of planned exercise"
4 cards (vertical stack):
  Sedentary:     "Office job, mostly sitting, under 3,000 steps"
  Lightly Active: "Some walking, 3,000–8,000 steps"
  Moderately Active: "On your feet often, 8,000–12,000 steps"
  Very Active:    "Physical job or always moving, 12,000+ steps"
Each shows illustration + description
```

**Step 5 — Exercise Frequency (NEW):**
```
Illustration: calendar with workout days marked
"How do you currently train?"
[How many days per week do you workout?]
  → Horizontal number picker: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7
  → Dots under each number, selected dot green, larger

[Average session duration?]
  → Chips: Under 30min | 30–45min | 45–60min | 60–90min | 90min+

[Exercise types you do (multi-select chips):]
  Weight Training | HIIT | CrossFit | Running | Cycling
  Yoga/Pilates | Swimming | Sports | Boxing | Other

[Training experience level?]
  → 3 cards: Beginner | Intermediate | Advanced
  Each with description of what it means
```

**Step 6 — Dietary Preferences:**
```
Illustration: plate with various foods
"What's your eating style?"
6 cards (2×3 grid):
  Omnivore | Vegan | Vegetarian | Keto | Paleo | Mediterranean
Each: icon + name + short description

Below the grid:
[Do you have any food allergies or restrictions?]
  → Chips: Gluten-Free | Lactose-Free | Nut-Free | Shellfish-Free | None
```

**Step 7 — Supplement Use:**
```
Illustration: supplement bottles
"Do you use any supplements?"
"We'll factor this into your recommendations"
Multi-select chips:
  Protein Powder | Creatine | Pre-Workout | BCAAs
  Multivitamins | Omega-3 | Vitamin D | None
[Rate of change goal]:
  Lose 0.5 lb/week | Lose 1 lb/week | Lose 1.5 lb/week |
  Maintain | Gain 0.5 lb/week | Gain 1 lb/week
```

**Step 8 — Health Conditions (optional):**
```
Illustration: medical/health icons
"Any health considerations?"
"All information is private and used only to personalize your plan"
Multi-select chips (each shows info tooltip on hover):
  Type 2 Diabetes | Hypertension | Hypothyroidism | PCOS
  Heart Condition | Joint Issues | Pregnancy | Postpartum
  GLP-1 Medication | None of the above
[Skip this step] link
```

**Step 9 — Water Calculator (NEW dedicated step):**
```
Illustration: water drop / hydration graphics with body percentage chart
"Let's calculate your daily water needs"
"Hydration affects energy, performance, and recovery"

[Climate you live in]:
  Cold | Temperate | Hot | Very Hot
  → Each shows a city example image as icon

[Do any of these apply to you?]:
  Pregnant | Breastfeeding | High caffeine intake | Regular alcohol use
  (multi-select)

AUTO-CALCULATE button with animation →
Shows result:
  [Large blue number: "2,850 ml" with animated count-up]
  [Breakdown card]:
    Base (weight × 35ml): 2,345ml
    Activity bonus:         350ml
    Climate adjustment:     155ml
  [Glasses equivalent: 12 glasses | Bottles: 5.7 × 500ml]
  [Set as my goal] → [Next]
```

**Step 10 — Results Preview:**
```
Illustration: dashboard preview mockup (blurred)
"Your personalized plan is ready!"
Auto-calculated stat cards in 2×2 grid:
  [BMR: 1,847 kcal]    [TDEE: 2,550 kcal]
  [Daily Target: 2,050 kcal] [Protein: 140g]
Below: full macro breakdown bar (carbs/protein/fat color coded)
Hydration target: 2,850 ml
[How we calculated this] expandable accordion section
[Looks good! Let's start] primary CTA
```

**Step 11 — Celebration:**
```
Confetti animation (Framer Motion)
"You're all set, {name}! 🎉"
"Your SuperFit journey starts now"
3 feature spotlight cards:
  Track your meals → Diary
  Log workouts → Workouts
  Find a coach → Coaching
[Enter SuperFit] → redirects to dashboard
```

---

### 8.2 Dashboard

(Same as Design System v1.0 spec — Image 1 reference — plus:)
- Add "Today's AI Scan" quick action card if unsaved scans exist
- Quick link to active coaching program progress
- Water intake ring visible on dashboard (mini version)

---

### 8.3 Diary — Food + Exercise + AI Meal Scan

**Three tabs:** Food Diary | Exercise Diary | AI Scans

**Food Diary tab:**
- CalendarStrip at top (any day selectable)
- MacroSummaryBar (calories/protein/carbs/fat consumed vs goal)
- Net Calorie balance: consumed − burned from exercise = NET
- MealSections: 6 accordion slots (Breakfast/Snack/Lunch/Snack/Dinner/Snack)
- Each section: "+ Add Food" button → FoodSearchSheet
- FoodSearchSheet has tabs: Search | AI Snap | Barcode | Voice | Saved Meals | History

**Exercise Diary tab:**
- "+ Add Exercise" button → ExerciseSearchSheet
- Lists exercises logged for the day
- Each entry: exercise name, sets×reps×weight, estimated calories burned
- Calories burned column feeds back into Net Calories on food diary
- Shows today's planned workout (from workout store) as "Log This Workout" shortcut

**AI Scan tab:**
```
Camera viewfinder (full-width, 300px height):
  [Live camera preview OR upload image button]
  [Scan button — large green — triggers analysis]
  
After scan (within 1.5s loading indicator):
  [Scanned image thumbnail — 60px] + [Detected items list]
  Each detected item:
    Name | Portion estimate | [Calories] | [P/C/F chips]
    [Edit portion] input | [Remove from scan] × button
    
  [Confidence indicator] "87% confident in detection"
  Total: X kcal, Yg protein
  [Add to Meal Slot selector]: dropdown (Breakfast/Lunch/etc)
  [Save to Diary] green button — adds ALL confirmed items
  
Saved scan history (below):
  Scrollable list of past scans with thumbnail + date + total kcal
  Tap to review / re-add items
  
IMPLEMENTATION NOTE:
  In MVP, simulate AI scan: user uploads image, show a loading spinner (1.5s),
  then display mock detected food results based on a random selection from food database.
  The image is saved as a blob URL in the AIMealScanResult store entry.
  Confirmed scans appear in the AI Scans tab history WITH their thumbnail image.
  This gives full working UI/UX — the AI model can be replaced later.
```

---

### 8.4 Hydration — Full Specification

**Header:** Large animated SVG ring (current progress %)

**Date/Calendar navigation row:**
Four mode chips: **Day | Week | Month | Year** — switches the view below

**Day view:**
- Hydration ring (200px) + "X ml of Y ml" + streak badge
- Quick-add cup buttons (150 / 250 / 350 / 500ml)
- Drink type selector horizontal chip scroll (Water, Coffee, Tea, Green Tea, Juice, Sports Drink, Milk, Custom...)
  - Each shows hydration factor: "Water ×1.0", "Coffee ×0.5", etc.
- Today's drink log list: time | icon | name | amount | hydration contribution | × delete
- Caffeine Monitor card:
  ```
  [Caffeine today: 285mg / 400mg limit]
  [Progress bar in amber when 70%+, red when over]
  [By drink breakdown: Coffee 190mg, Green Tea 95mg]
  [Tip if over limit: "Consider switching to decaf after 2PM"]
  ```

**Week view:**
- 7-bar chart (Mon–Sun), each bar colored by % of goal (green/amber/red)
- Day-by-day table: date | total ml | goal | % | caffeine mg
- Weekly average card

**Month view:**
- Calendar grid (Mon–Sun columns, 4–5 rows)
- Each cell: date + mini ring showing % complete
- Color coding: deep green (100%+), medium green (75–99%), amber (50–74%), red (<50%), gray (no data)
- Tap any day → shows that day's detailed log in a side panel

**Year view:**
- 12-month summary bar chart
- Monthly average vs goal comparison
- "Best month", "Worst month", streak statistics

**Custom Drink Modal:**
```
"Add Custom Drink"
[Name input]
[Icon picker — emoji selector OR Lucide icon]
[Color picker — 12 preset colors]
[Caffeine per 100ml — slider 0–200mg]
[Hydration factor — slider 0.0–1.0 with descriptions]
  0.0: "No hydration benefit (e.g., strong alcohol)"
  0.5: "Moderate (e.g., coffee)"
  0.8: "Good (e.g., tea, juice)"
  1.0: "Full hydration (water)"
[Save as favorite] toggle
[Save Drink] button
```

---

### 8.5 Workout Logger

(Same as v1.0 spec — no changes needed here)

---

### 8.6 Timer Hub — ALL MODES FULLY WORKING

**ZERO "COMING SOON" LABELS.** Every mode, every setting, every button is functional.

#### Timer Hub Layout

**Mode selector:** Horizontal chip scroll at top
```
Tabata | HIIT | EMOM | AMRAP | Boxing | Circuit | Running | Yoga | Custom
```

**When a mode is selected:**
- Pre-fills configuration with the matching template
- Shows configuration panel below
- Shows "Start Timer" green button
- Shows "Advanced Settings" expandable section (FULLY WORKING)

#### Configuration Panel (per mode)

**Tabata:**
```
Work duration: [NumberStepper seconds, default 20]
Rest duration: [NumberStepper seconds, default 10]
Rounds: [NumberStepper, default 8]
[Prep countdown: NumberStepper seconds, default 10]
```

**HIIT:**
```
Work duration: [slider 10–120s]
Rest duration: [slider 5–120s]
Rounds: [NumberStepper]
[Rest between sets: NumberStepper seconds]
```

**EMOM:**
```
Minute length: always 60s (shown, not editable — with explanation tooltip)
Total minutes: [NumberStepper 1–60]
[Exercise name per minute] — list of N rows (N = total minutes), each with name input
```

**AMRAP:**
```
Total duration: [minutes:seconds input, e.g., 10:00]
Exercise list: dynamic list with [Add Exercise +] button
  Each: name input + optional reps/description
[Round counter style]: manual increment (user taps "+" each round)
```

**Boxing:**
```
Round duration: [NumberStepper, default 180s]
Rest duration: [NumberStepper, default 60s]
Number of rounds: [NumberStepper, default 12]
Warning bell at: [NumberStepper, 10s before end default]
```

**Circuit:**
```
Dynamic exercise list (drag to reorder):
  [+ Add Station] button
  Each station: Name input | Duration (seconds) | Rest after (seconds)
Rounds: [NumberStepper]
[Add rest station] button — inserts a rest-only row
```

**Running:**
```
Run duration: [mm:ss input]
Rest duration: [mm:ss input]  
Intervals: [NumberStepper]
Pace target: [min/km input — optional, displayed during timer]
```

**Yoga:**
```
Dynamic pose list (drag to reorder):
  [+ Add Pose] button
  Each: Name | Duration | Coaching cue text input | GIF URL (optional)
Repeat circuit: [NumberStepper, times to repeat full sequence]
```

**Custom:**
```
Timer name: [text input]
Dynamic interval list (drag to reorder):
  [+ Add Interval] button
  Each interval card:
    Name | Duration (mm:ss) | Type (Work/Rest/Transition) | Color picker | Sound selector
Rounds: [NumberStepper]
[Save as Template] button — saves to custom templates list
[Share] button — copies shareable link/code
```

#### Advanced Settings Panel (FULLY WORKING — expand/collapse)

```
╔═══════════════════════════════════════╗
║  ⚙️ Advanced Settings                ▼  ║
╠═══════════════════════════════════════╣
║  Preparation countdown: [3s|5s|10s|15s] ║
║  Sound pack: [Bell | Beep | Whistle]   ║
║  Work sound: [Bell | Beep | Whistle | Custom upload] ║
║  Rest sound: [Bell | Beep | Whistle | None] ║
║  3-second countdown beeps: [Toggle]   ║
║  Halfway alert: [Toggle]              ║
║  Screen keep-awake: [Toggle]          ║
║  Color pulse on work interval: [Toggle]║
║  Vibration (mobile): [Toggle]         ║
║  Show exercise GIF during rest: [Toggle]║
║  Auto-start next interval: [Toggle]   ║
║  Volume: [Slider 0–100%]              ║
╚═══════════════════════════════════════╝
```

**Every setting is wired to actual behavior:**
- "Color pulse" → CSS animation applied to timer ring color
- "Screen keep-awake" → calls `navigator.wakeLock.request('screen')`
- "3-second beeps" → Howler.js plays countdown tone at t-3, t-2, t-1
- "Work/Rest sounds" → Howler.js plays the selected sound on interval transition
- "Custom upload" → react-dropzone accepts .mp3/.wav, stores as blob URL
- "Vibration" → `navigator.vibrate([200])` on interval transition

#### Active Timer Full-Screen View

```
┌────────────────────────────────────────┐
│  [← Back to config]  [Mode Name]      │
│                                        │
│  Round 3 / 8                           │  ← DM Sans 500 16px, --text-secondary
│                                        │
│  ╔═══════════════════════╗             │
│  ║   LARGE SVG RING      ║             │  ← fills ~70% of screen width on mobile
│  ║   (color changes:     ║             │
│  ║    green=work         ║             │
│  ║    gray=rest          ║             │
│  ║    amber=prep         ║             │
│  ║   ring pulses on work)║             │
│  ║                       ║             │
│  ║   00:18               ║             │  ← JetBrains Mono 600 64px
│  ║   W O R K             ║             │  ← DM Sans 700 14px UPPERCASE, --accent
│  ╚═══════════════════════╝             │
│                                        │
│  [Exercise name if set]               │  ← Inter 400 15px, center
│  [Exercise GIF if enabled, 100px]     │
│                                        │
│  ⏮ Restart   ▶/⏸ Play/Pause   ⏭ Skip│  ← controls row
│                                        │
│  [AMRAP only: +1 Round counter]        │
│  [Boxing only: Round bell icon]        │
└────────────────────────────────────────┘
```

**Ring color transition:**
```typescript
// SVG stroke color changes based on phase:
const ringColor = {
  prepare:         '#f59e0b',    // amber
  work:            '#22c55e',    // green
  rest:            '#525252',    // gray
  between_rounds:  '#3b82f6',    // blue
  complete:        '#22c55e',    // green
}

// Color pulse animation (when colorPulseOnWork = true):
// CSS animation class added to ring during work phase:
@keyframes pulse-ring {
  0%, 100% { filter: drop-shadow(0 0 4px rgba(34,197,94,0.3)); }
  50%       { filter: drop-shadow(0 0 16px rgba(34,197,94,0.8)); }
}
```

#### Pre-built Template Cards

6 cards in a grid below the mode selector:
Each card shows: mode badge, name, duration/rounds, "Use This" button
Templates: Tabata Classic | HIIT 30:30 | EMOM 10min | Boxing 3min | AMRAP 10min | Yoga Flow

#### useTimer Hook (drives all timer logic)

```typescript
export function useTimer(store: TimerStoreState) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const start = () => {
    // Play prep sound
    // Set state to 'prepare' phase, start countdown
    intervalRef.current = setInterval(() => {
      store.tick()   // decrements secondsRemaining each second
    }, 1000)
  }

  const stop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    store.stop()
  }

  // tick() in store handles:
  //   - decrement secondsRemaining
  //   - if 0 → advance to next interval (play transition sound)
  //   - if last interval in round → restBetweenRounds
  //   - if last round → set phase = 'complete'
  //   - if 3s remaining AND countdownBeeps → play beep sound
  //   - if halfway AND halfwayAlert → play soft chime
}
```

---

### 8.7 Meal Planner — Very Dynamic

**Three views switchable via top tabs:** Week | Month | Year

**Week View:**
```
┌──────────────────────────────────────────────────────────────┐
│  [← Prev Week]   Feb 19 – Feb 25, 2024   [Next Week →]     │
│  [Today] button | [+ Add Template] | [Generate from Macros] │
├──────────┬──────────┬─────────────────────────────────────── │
│          │  MON 19  │  TUE 20  │  WED 21 │ THU 22 │ ...    │
├──────────┼──────────┼──────────┼─────────┼────────┼──────── │
│Breakfast │ [meal]   │ [meal]   │ [empty] │ [meal] │ ...     │
│ 08:00    │          │          │ [+ Add] │        │         │
├──────────┼──────────┼──────────┼─────────┼────────┼──────── │
│Morning   │ [empty]  │ [drink]  │ [empty] │ [meal] │ ...     │
│Snack     │ [+ Add]  │          │ [+ Add] │        │         │
│ 10:30    │          │          │         │        │         │
├──────────┼──────────┴──────────┴─────────┴────────┴──────── │
│ Lunch    │ ...similar rows for all 6 meal slots             │
│ Dinner   │                                                   │
│Eve Snack │                                                   │
└──────────┴──────────────────────────────────────────────────┘
```

Each **meal cell** in the grid:
- Shows item thumbnail (if image) or food emoji + name + calories
- Multiple items stack vertically within the cell
- "+ Add" dashed button to add to empty cell
- Click existing meal → opens edit/detail view
- Drag-and-drop to move meal to different day/slot

**Month View:**
```
Full calendar grid (4–5 week rows)
Each day cell shows:
  - Meal plan indicator: colored dot per slot filled (green=set, gray=empty)
  - Total kcal for the day if all slots are filled
  - Tap a day → opens the day's detail in a side drawer
```

**Year View:**
```
12 monthly mini-calendar cards in a grid
Each shows meal plan coverage % (% of meal slots that have something planned)
"January: 68% planned" with a circular progress ring
Tap a month → switches to month view for that month
```

**Add Meal Modal — Rich UX:**
```
Slide-up sheet (mobile) | Right-side drawer (desktop)

"Add to {MealSlot} on {DayName}"

[Search bar] ← search food DB, recipes, or custom
  Below search: tabs:
    Foods | Drinks | Recipes | My Recipes | AI Suggest

[AI Suggest tab]:
  "Suggest based on remaining macros for today"
  → Shows filtered suggestions that would complete the day's macros
  → Each suggestion: name | macros | Reason chip ("High protein", "Low carb")

[My Recipes tab]:
  Grid of recipe cards with cover image
  Each: name, macros, prep time, [Select] button
  [+ Create New Recipe] button → opens recipe builder

[Recipe Builder (in-modal)]:
  Recipe name input
  Cover image upload (react-dropzone, crop to square)
  Description textarea
  Prep time / Cook time / Servings inputs
  Ingredients list: dynamic, each row: name + amount + unit + × remove
  [+ Add Ingredient] button
  Instructions: numbered list, each with textarea + drag handle
  Tags: multi-select chips (high-protein, vegan, quick, meal-prep, etc.)
  Auto-calculated macros display as ingredients are added
  [Save Recipe] button

[Foods tab quick-add]:
  Same food search as diary but saves to meal planner
  Quantity selector + serving size

[Drinks tab]:
  Same as custom drink selector from hydration
  Add any drink: water, coffee, protein shake, juice, custom
  Shows hydration contribution (ml) alongside calories

After selecting item:
  [Servings stepper]
  [Notes for this meal] textarea
  [Save to plan] green button
  
Drag items between slots within the modal to reorder
```

---

### 8.8 Grocery List — Day-based, Card-type

**Layout: Two panels**
- Left: Date navigation + day selector
- Right: Category cards grid

**Date navigation (left panel):**
```
[← Prev Week]  Week of Feb 19  [Next Week →]
Day chips: Mon | Tue | Wed | Thu | Fri | Sat | Sun
          (19)  (20)  (21)  (22)  (23)  (24)  (25)
Active day: green chip
"From Meal Plan" badge on days that have auto-generated items
```

**Category cards grid (right panel, 2–3 per row):**

Each category is a **card**:
```
┌──────────────────────────────┐
│  [Category image 120px]      │  ← uploadable, defaults to food photo
│  🥦 Produce                  │  ← category name, editable
│  ──────────────────────────  │
│  □ Broccoli         500g     │
│  □ Spinach          200g     │
│  ☑ Bananas          4 pieces │  ← strikethrough + dim when checked
│  ──────────────────────────  │
│  [+ Add Item]    [⋮ Menu]    │
└──────────────────────────────┘
```

**Category card features:**
- Rename category on click (inline edit)
- Change cover image (react-dropzone)
- Reorder categories by drag-and-drop
- Color accent badge on category (matches category color from GroceryCategory)
- "+ Add Item" → inline input row appears
- Each item row: checkbox | item name (editable inline) | quantity (editable) | × remove | image (optional, 32px)
- Long-press an item → context menu: Edit | Add image | Duplicate | Delete
- Collapse/expand card by clicking category header

**Add Category card:**
```
Dashed border card: [+ Add Category]
Tap → modal:
  Category name input
  Cover image upload
  Color picker (12 colors)
  [Create] button
```

**Smart generate from meal plan:**
```
[Generate from this week's meal plan] button (at top)
→ Reads all PlannedItem entries for the selected week
→ Extracts all ingredients from recipes
→ Aggregates same ingredients across days
→ Creates/updates category cards with the generated items
→ Marks each item with 'fromMealPlan: true' (shows meal icon)
```

---

### 8.9 Calculators Hub — Guided, Onboarding-Style

**Hub page layout:**
```
Header: "Health Calculators"
Subtitle: "Science-backed tools to understand your body"

[Quick Guide card - first-time users only]:
  "New here? Start with the Guided Assessment"
  → Links to /onboarding/calculators (re-runs the guided onboarding flow)
  [Start Guided Setup →] button

Categories (each a section):
  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │  Body    │  │ Nutrition│  │  Training│  │  Lifestyle│
  │  BMI     │  │  Calories│  │  1RM     │  │   IF      │
  │  Body Fat│  │  Protein │  │  VO2 Max │  │  Caffeine │
  │  IBW     │  │  Macros  │  │  HR Zones│  │  Water    │
  │  ABSI    │  │  TDEE    │  │  Volume  │  │  Longevity│
  └──────────┘  └──────────┘  └──────────┘  └──────────┘
```

**Each calculator page follows this exact 3-section layout:**

```
[HERO SECTION]:
  Calculator name (h1)
  "What it measures" explanation card with illustration
  "Why it matters" 1-2 sentence blurb
  "How it's calculated" expandable accordion

[FORM SECTION]:
  Multi-step appearance (each major input group = a visual step)
  Step 1: Personal details (pre-filled from user profile if available)
  Step 2: Goal/context inputs specific to this calculator
  Step 3: [Calculate] large green button

[RESULTS SECTION]:
  (hidden until first calculation, slides in from bottom)
  Primary result: large number + unit + category badge
  Explanation card: "What this means for you"
  Recommendations card: "Next steps based on your result"
  Action links: "Update in my profile" | "View related calculators"
```

**Water Calculator page (`/calculators/water`) — NEW:**
```
FORM:
  Pre-filled from profile (weight, activity level)
  Additional questions:
  - Climate: Cold | Temperate | Hot | Very Hot (with map imagery)
  - Pregnant or breastfeeding: toggle
  - Daily caffeine: slider (0–600mg, with labels: none / low / moderate / high)
  - Daily alcohol: stepper (0–5+ drinks)
  
RESULTS:
  "Your recommended daily water intake: 2,850 ml"
  Animated water fill bar 0 → target
  Breakdown table: base + activity + climate + pregnancy + caffeine/alcohol offset
  Visual: bottles of water (number fills as you scroll past the result)
  [Set as my hydration goal] → updates useHydrationStore.dailyGoalMl
  [View hydration tracker →]
```

---

### 8.10 Progress — Photos + Weight + Comparison

**5 tabs:** Weight | Measurements | Strength | Nutrition | Photos

**Photos tab (UPDATED):**

**Upload flow:**
```
[+ Add Progress Photo] button → opens upload modal:

Step 1 — Upload:
  [Drag & drop or click to upload]
  Accepts: JPG, PNG, WebP
  After upload: image preview with crop tool (react-image-crop)
  Crop to 3:4 portrait aspect ratio (standard for physique photos)

Step 2 — Tag details:
  Date: [date picker, defaults to today]
  Current weight: [number input] kg/lbs
  Body fat %: [number input, optional]
  Position: [chips: Front | Side | Back]
  Notes: [textarea]
  Mark as baseline ("before") photo: [toggle]
  [Save Photo] green button

After save:
  Photo appears in gallery with date, weight, and tags
  Toast: "Progress photo saved! Keep it up 💪"
```

**Photo Gallery:**
```
Grid view (3 columns mobile, 4 desktop)
Each cell: photo + date chip + weight chip overlay at bottom
Sort: Newest first | Oldest first | By position
Filter chips: All | Front | Side | Back | Baseline

[Compare Mode] button (top right):
  Switches to split-screen comparison mode
```

**Compare Mode:**
```
Split screen: LEFT = baseline / selected "before" | RIGHT = latest (always the most recent photo)

LEFT panel:
  Shows earliest photo marked as baseline OR first photo if no baseline
  Below: date + weight + position label
  [Change "Before"] button → lets user select any photo as the before

RIGHT panel:
  ALWAYS shows the most recent photo (auto-selected, user cannot change right panel)
  "After" label
  Below: date + weight + position label
  Weight difference chip: "−12.5 kg" in green (or "+X kg" in red)
  Date difference chip: "143 days of progress"

[Save Comparison] → exports/downloads the side-by-side as an image
[Share to Community] → posts the comparison to community feed
```

---

### 8.11 Community — Twitter/X Parity

**Layout (desktop 3-column, mobile single column):**

```
[LEFT 260px — sticky]    [CENTER fluid]     [RIGHT 280px — sticky]
 Navigation links         Home feed          Trending topics
 Profile summary          Who to follow      Who to follow
 Post composer shortcut   Following/Explore  Suggested hashtags
                          tabs               Search refinement
```

**Main feed tabs:** For You | Following

**Post Card (full Twitter parity):**
```
┌─────────────────────────────────────────────────────────┐
│ [Avatar 40px] [Name] [@handle] · [time ago] [⋮ menu]   │
│              [Verified ✓ or Coach 🏋️ badge]             │
│                                                         │
│ [Post content text with @mentions and #hashtags linked] │
│                                                         │
│ [Media grid: 1/2/3/4 images — Twitter-style layout]    │
│ [Video player if video post]                            │
│ [Poll component if poll post]                           │
│ [Quoted post preview card if quote]                     │
│                                                         │
│ [💬 24] [🔁 12] [♡ 147] [📊 Views 4.2K] [🔖 Save] [↑] │
└─────────────────────────────────────────────────────────┘
```

**Action buttons row (full functionality):**
- 💬 Reply → opens reply composer inline
- 🔁 Repost → two options: Repost (direct) | Quote Post (add comment)
- ♡ Like → heart animates, count increments
- 📊 Views → just a counter, no click action
- 🔖 Bookmark → saves to bookmarks tab
- ↑ Share → share sheet (copy link, share to messages, share to DMs)

**Post Composer (full Twitter-style):**
```
[Avatar] [Text input: "What's on your mind?"]
         [Expandable — shows full composer on focus]
         
         [Media preview grid — up to 4 images]
         [GIF picker button]
         [Poll creator]:
           Question input
           Option 1 | Option 2 | [+ Add option up to 4]
           Duration: 1 day | 3 days | 1 week
           
         Character counter: 280 chars (circular indicator)
         
         Toolbar row:
           [📷 Image] [GIF] [📊 Poll] [😊 Emoji] [📍 Location]
           [🔁 Thread] ← creates a thread (multiple connected posts)
         
         Audience selector: Everyone | Followers | Mentioned only
         [Post] green button — disabled until content entered
```

**Reply Thread:**
- Tap reply → shows full reply chain above the composer
- Nested replies (2 levels of nesting shown inline)
- "Show more replies" expand button

**Notifications tab:**
- All interactions: likes, replies, reposts, quotes, follows, mentions
- Filtered tabs: All | Mentions | Likes | Reposts | Follows

**Bookmarks tab:**
- All bookmarked posts in chronological order
- [Remove all bookmarks] button

**Profile page (per user):**
```
[Banner image] — 3:1 ratio
[Avatar] — 70px, overlapping banner
[Follow / Following / Edit Profile button]
[Name] [Verified badge] [@handle]
[Bio text]
[Location 📍] [Website 🔗] [Join date 📅]
[Following: X] [Followers: Y]

Tabs: Posts | Replies | Highlights | Media | Likes
```

**Hashtag pages:**
- Click any #hashtag → opens hashtag feed
- Trending section shows top 10 hashtags with counts

**Search:**
- Real-time search as you type
- Results tabbed: People | Posts | Hashtags

**Blocking, Muting, Reporting — all functional:**
- Block user → removes from feed, they cannot see your posts
- Mute user → removes from feed silently, they can still see you
- Report post → reason selector + submit

---

### 8.12 Messages — Facebook Messenger Parity

**Layout (desktop):**
```
[LEFT 320px — Conversation list] [RIGHT — Active chat window]
```

**Left panel — Conversation list:**
```
[Search conversations input — real-time filter]
[+ New Message button]

Tabs: Inbox | Groups | Archived

Each conversation row:
  [Avatar 44px + online dot] [Name] [Last message preview] [Time]
  [Unread count badge] [Pinned icon if pinned]
  [Muted icon if muted]
  
Context menu (right-click / long-press):
  Pin | Mute | Archive | Delete | Mark as unread
  Ignore messages | Block
```

**Active chat window:**

**Header:**
```
[← Back (mobile)] [Avatar 36px + online status] [Name + "Active now" / "Last seen X ago"]
[Video call 📹] [Voice call 📞] [Info ℹ️] buttons
```

**Message history (virtual scroll for performance):**
```
Date dividers: "Today" / "Yesterday" / "Mon, Feb 19"
My messages: right-aligned, green bubble
Their messages: left-aligned, gray bubble

Message bubble:
  Rounded pill if short, rounded rect if long
  Consecutive messages from same sender: only last shows avatar
  [Hover: show reaction emoji row]
  [Long-press / right-click: context menu]
    React | Reply | Forward | Copy | Delete | Edit (if mine, within 15min)

Reactions:
  Displayed below the bubble
  Shows emoji + count: "😂 3  ❤️ 1  👍 2"
  Click to see who reacted

Seen receipts:
  Small avatar shown under last seen message
  "Seen" text for 1:1, avatar cluster for groups

Media messages:
  Images: thumbnail inline, click to view full-screen
  Videos: player inline with play button overlay
  Audio: waveform visualization + play/pause + duration
  Files: file icon + name + size + download button
  GIFs: auto-play (small GIF inline)

Workout share message (special type):
  Card style: workout name + stats + "View" button
  
Food share message:
  Card style: food name + calories + "Add to my diary" button
```

**Message composer:**
```
[+ button] expands to:
  [📷 Photo/Video] [📁 File] [🎵 Audio] [📍 Location] [💪 Share Workout] [🍎 Share Food]

[GIF] button → opens GIF picker (mockup: grid of static GIFs, labeled by mood)
[😊] button → opens emoji picker (full emoji keyboard, emoji-picker-react)
[🎤] press-and-hold → voice message recorder
  Waveform animation while recording
  Release to send | Swipe left to cancel

[Text input]: placeholder "Aa"
  Auto-grows vertically up to 5 lines
  Supports @mentions: @ → shows user picker
  
[Send button]: arrow icon, green, appears when content is entered
```

**Group chats:**
```
Create group:
  + New Message → select multiple contacts → "Create Group"
  Set group name (required)
  Upload group photo (optional)
  
Group header:
  Avatar cluster (3 avatars overlapping) or group photo
  Tap header → Group info panel:
    Member list (admin can add/remove)
    Change name | Change photo | Change emoji
    Leave group | Report group
    Shared media / files grid
    Custom notification settings
    
Group admin features:
  Pin messages → pinned message shown in header
  Make member admin | Remove from group
  Only admin can change group name/photo
```

**Video and Voice Calls (UI — mock functional):**
```
Video call UI:
  Full-screen with self-view in corner
  [Mute mic] [Toggle video] [End call] [Speaker]
  Call duration counter
  "Connecting..." → "Connected" state
  
Voice call UI:
  Avatar centered on colored background
  Duration counter
  [Speaker] [Mute] [End call]
```

**Message Requests:**
```
Messages from non-connections go to "Requests" tab
User can Accept or Delete
```

**Starred / Saved Messages:**
```
Star any message → appears in "Saved" list
Like a personal clipboard
```

---

### 8.13 Coaching Discovery + Active Coaching

#### Coach Discovery Page

**Layout:**
```
[Topbar search: "Search coaches by name, specialty, location..."]

[Filter sidebar (desktop) / Filter sheet (mobile)]:
  Specialty: [multi-select chips — Weight Loss, Muscle Gain, Powerlifting, etc.]
  Location: [City input OR "Online Only" toggle]
    → Shows distance filter if location permission granted: "Within 5km | 10km | 25km | Any"
  Price range: [Slider $0–$500/month]
  Rating: [Stars filter 4+/3+/all]
  Availability: [Available this week toggle]
  Language: [dropdown]
  Gender preference: [Any | Male | Female | Non-binary]
  Experience: [Beginner-friendly | Any]

[Sort by]: Recommended | Top Rated | Price Low–High | Price High–Low | Newest

[Results grid — 3 col desktop, 1 col mobile]:
  Each CoachCard:
  ┌────────────────────────────────────┐
  │ [Cover image 100% × 160px]         │
  │ [Verified ✓] [Online/Local badge]  │
  │ [Avatar 48px overlapping bottom]   │
  │ John Arnold                        │  ← DM Sans 600 16px
  │ ★ 4.9 (247 reviews)               │
  │ Cardio · Weight Loss · Strength   │  ← specialty chips
  │ 📍 Manila, PH · Online            │  ← location
  │ From $49/month                     │  ← price
  │ [View Profile]  [Message]          │
  └────────────────────────────────────┘
```

#### Coach Profile Page (`/coaching/[coachId]`)

```
[Full-width banner image, 300px height]
[Avatar 80px, overlapping bottom of banner]
[Name] [Verified badge] [Rating ★ X.X (N reviews)]

[CTA buttons row]:
  [Subscribe from $49/mo]  [Message]  [Book Free Consult]

[Tab bar: About | Programs | Posts | Reviews]

ABOUT tab:
  Bio (full text, expandable if long)
  Specialties (chips)
  Certifications (with icons)
  Languages
  Location (city + timezone)
  Years experience
  Client count: "X happy clients"
  Availability slots: "Available Mon, Wed, Fri 6PM–9PM"
  
  Video intro (react-player):
    "Watch {Name}'s introduction" — 2–3 min video card
  
  Subscription plans:
    3 plan cards (Basic / Premium / Elite):
      Price | Duration | Included features list
      [Get Started] button

PROGRAMS tab:
  Grid of purchasable programs:
    Cover image | Name | Duration | Price | [Preview] [Buy]

POSTS tab:
  Coach's public posts (same as community feed format)
  Exclusive (🔒 locked) posts visible but blurred for non-subscribers

REVIEWS tab:
  Rating breakdown (5-star histogram)
  Reviews list: avatar + name + date + ★ rating + written review
  [Write a Review] button (only if subscribed/past client)
```

#### Active Coaching Page (`/coaching/my-coach`)

```
This is where actual coaching happens after subscribing.
Three-column layout (matching Image 3 coaching layout):

LEFT COLUMN (260px):
  Coach info card: avatar + name + next session
  AI Chat card: "Ask your coach AI..." (replies based on coach's content)
  Your programs list (enrolled programs with % complete)
  Daily schedule mini-list

CENTER COLUMN (flex-1):
  Feed: coach's posts (exclusive + public)
  My workout submissions (for form check)
  Assigned programs progress cards
  Challenge/goal tracking

RIGHT COLUMN (280px):
  Streak counter (client's active streaks)
  Weekly check-in (if coach has set one)
  Nutrition history summary
  Upcoming sessions calendar
  Coach messages shortcut → opens Messages
```

---

### 8.14 Settings — Full and Real

**Sidebar navigation (desktop) / Accordion (mobile):**
Profile | Goals & Nutrition | Workout Preferences | Notifications | Privacy | Appearance | Integrations | Accessibility | Billing | Account | About

**Profile section:**
- Avatar uploader (circular, react-image-crop)
- Name, username (@handle — must be unique)
- Email, phone number
- Bio (120 char limit)
- Location (city, country — used for coach filter)
- Gender identity (display preference)
- Date of birth
- [Save Changes] button

**Goals & Nutrition:**
- Recalculate targets (re-runs onboarding formula with current data)
- Manual override: calorie goal, protein, carbs, fat (with gram/% toggle)
- Water goal (manual override of calculated value)
- Fiber target
- Number of meals per day (affects diary slot count)
- Dietary preference (re-selects)
- Health conditions (re-selects)

**Workout Preferences:**
- Default rest timer duration (per exercise type)
- Units: kg/lbs, cm/in
- Default workout duration
- Starting workout day of week
- Show/hide warm-up sets in logs

**Notifications:**
All toggle + time picker combinations:
```
Meal reminders:   [Toggle] [08:00] [12:30] [19:00] (+ Add time button)
Water reminders:  [Toggle] Every [90] minutes between [07:00]–[22:00]
Workout reminder: [Toggle] [07:30] daily
Supplement:       [Toggle] Morning [08:00] | Evening [20:00]
Coach messages:   [Toggle] (always-on recommended)
Community:        [Toggle] Likes | Replies | Follows | Mentions (per-type)
Weekly report:    [Toggle] Every [Sunday] at [09:00]
Promotional:      [Toggle]
```

**Privacy:**
- Profile visibility: Public | Followers only | Private
- Diary visibility: Private | Coach only | Followers | Public
- Weight data: Private | Coach only
- Activity status: Show when active [Toggle]
- Read receipts in messages: [Toggle]
- Searchable by email/username: [Toggle]
- Data used for platform analytics: [Toggle] + "What this means" link

**Appearance:**
- Theme: Light | Dark | System (3 radio cards with screenshots)
- Accent color: Green (default, locked) — "More colors coming soon" — NO, just green locked
- Font size: Small | Default | Large | Extra Large
- Reduce motion: [Toggle] — disables Framer Motion animations
- High contrast mode: [Toggle]
- Dashboard layout: Dense | Comfortable | Spacious

**Integrations:**
Toggle cards for each integration with status indicator:
```
Apple Health     [Connected ✓] / [Connect]
Google Fit       [Connected ✓] / [Connect]
Garmin           [Connect]
Fitbit           [Connect]
Samsung Health   [Connect]
Strava           [Connect]
Withings         [Connect]
Spotify          [Connect]
```

**Accessibility:**
- Font size override (same as appearance)
- Reduce animations
- High contrast
- Screen reader optimizations toggle
- Keyboard navigation hints toggle

**Billing:**
- Current plan card (Free / Premium / Premium+)
- Upgrade CTA
- Payment history table (date | description | amount | receipt)
- Cancel subscription (with confirmation modal)

**Account:**
- Change password
- Change email
- Two-factor authentication: [Enable 2FA]
  → QR code for authenticator app setup
  → Backup codes shown on enable
- Active sessions:
  Table: Device | Location | Last active | [Remove] button
  [Remove all other sessions] button
- Connected accounts (Google/Apple/Facebook):
  Each with [Connect] or [Disconnect] button
- Language: dropdown (all languages — English for MVP)
- Timezone: searchable dropdown
- First day of week: Sunday | Monday

**Danger Zone section (at very bottom of Account tab):**
```
╔═════════════════════════════════════════════╗
║  ⚠️ Danger Zone                              ║
╠═════════════════════════════════════════════╣
║  [Deactivate Account]                        ║
║  "Temporarily disables your account.         ║
║   You can reactivate by logging back in."    ║
║                                              ║
║  [Delete Account Permanently]                ║
║  "This action cannot be undone. All your     ║
║   data will be permanently deleted."         ║
║                                              ║
║  [Export My Data]                            ║
║  "Download all your data as a ZIP file"      ║
╚═════════════════════════════════════════════╝
```

**Deactivate flow:**
Modal → "Why are you deactivating?" (radio list, required) → "Deactivate" button → account deactivated → redirect to login with "Your account is deactivated. Log in to reactivate." message.

**Delete flow:**
Modal → "Type DELETE to confirm" input → type-matching validation → 2FA if enabled → "Permanently Delete" red button → 30-day grace period message → account queued for deletion.

---

### 8.15 Coach-Only Pages (Separate Shell — Everfit.io Parity)

**Access:** Only users with `user.isCoach === true` can access `/coach/*`
**Navigation:** Completely different from user shell — no sidebar overlap

**Coach Navigation (top horizontal nav on desktop, bottom nav on mobile):**
```
Dashboard | Clients | Programs | Content | Schedule | Messages | Analytics | Marketplace | Settings
```

#### Coach Dashboard (`/coach`)

4 metric cards: Monthly Revenue | Active Clients | Subscribers | Programs Sold

Two-panel layout:
```
LEFT (flex-1): Recent client activity feed
  Each item: [Client avatar] [Client name] [Action] [Time]
  "Sarah logged a PR! Bench press 60kg"
  "Mike completed Week 3 of Push/Pull/Legs"
  "Jennifer submitted a form check video"
  
RIGHT (280px sticky):
  Today's sessions list
  Quick actions: [+ Add Client] [+ New Program] [Go Live]
  Revenue chart (7-day bar)
```

#### Client Management (`/coach/clients`)

```
Search + filter bar:
  [Search by name] [Filter: Active | New | Inactive] [Sort: Name | Last Active | Compliance]
  
Table view (desktop) / Card list (mobile):
  Columns: Avatar+Name | Goal | Last Active | Compliance % | Weight Trend | Streak | Actions
  
  Compliance bar: green 80%+, amber 50–79%, red <50%
  Weight trend: sparkline mini-chart (7 days)
  Actions: [View] [Message] [Assign Program] [⋮]

Per-client detail page:
  Full dashboard view of the client's data:
  - Current stats (weight, calories, workouts this week)
  - Full food diary (coach can view)
  - Workout history
  - Progress photos (client has shared with coach)
  - Coach notes (private, only coach sees)
  - Assigned programs + completion %
  - Submitted form check videos
  - Check-in responses history
  [Add Note] textarea
  [Message Client] button
  [Update Program] button
```

#### Programs Builder (`/coach/programs`)

```
My Programs list:
  Grid of program cards: cover | name | duration | clients enrolled | [Edit] [Duplicate] [Sell]

Program Editor:
  Name | Description | Cover image | Duration (weeks) | Difficulty | Tags
  
  Weekly grid:
    Rows = weeks (1–16)
    Columns = days (Mon–Sun)
    Each cell: [+ Add Workout] button
    Clicking a cell → opens workout builder (same as user workout builder)
    
  Program notes: overall notes per week (shown to clients at start of each week)
  
  [Publish as Free] | [Sell for $X] | [Assign to Client]
```

#### Content Publisher (`/coach/content`)

```
Post composer (top):
  Tabs: Post | Tutorial | Course | Meal Plan | Challenge
  
  Post tab: Same rich editor as community (with added "subscribers only" toggle)
  
  Tutorial tab:
    Title input
    Video upload or YouTube link
    Description (rich text)
    PDF attachment option
    [Audience: Public | Subscribers Only]
    
  Course tab:
    Course name + description
    Module list: drag-to-reorder
    Each module: title + add lesson (video + notes)
    Price setting
    
  Content calendar:
    Monthly calendar showing published + scheduled posts
    Drag posts to reschedule
    
  Analytics per post: views | likes | comments | saves
```

#### Schedule Manager (`/coach/schedule`)

```
Calendar view (month/week toggle):
  Available slots: green
  Booked sessions: teal/blue
  Blocked time: gray

Add availability:
  Day of week checkboxes
  Time range picker
  Repeat: weekly | bi-weekly | custom

Session cards:
  Client name | Session type | Duration | [Join Call] button
  [Reschedule] [Cancel] options

Booking settings:
  Session duration options: 30min | 45min | 60min | 90min
  Buffer between sessions: 10min | 15min | 30min
  Advance booking window: 1 week | 2 weeks | 1 month
  Cancellation policy: 24h | 48h | 72h notice
```

#### Broadcast Messaging (`/coach/broadcast`)

```
Compose broadcast:
  To: [All clients] | [Program X clients] | [Custom group]
  Message composer (same as DM composer)
  [Send Now] | [Schedule]

Broadcast history table:
  Date | Recipients | Message preview | Open rate
```

#### Forms & Questionnaires (`/coach/forms`)

```
My forms list:
  Each form card: name | responses | [View Responses] [Edit] [Share Link]

Form builder:
  Form name
  Dynamic question list:
    [+ Add Question]
    Question types:
      Short text | Long text | Number | Scale (1–10) | Yes/No | Multiple choice | Date
  Send to: [All clients] | [Specific client] | [Share link]
  Schedule: [On enrollment] | [Every Monday] | [Custom date]

Responses viewer:
  Per-client responses in a timeline
  Export to CSV
```

#### Marketplace (`/coach/marketplace`)

```
My Products list:
  Programs | Courses | Bundles | Meal Plans

Product card:
  Cover | Name | Type | Price | Sales count | Rating | [Edit] [Toggle visibility]

Add Product:
  Select type
  Fill details (name, description, cover, price, content link)
  Pricing: one-time | recurring subscription
  Access: immediate | gated (requires coach approval)

Earnings panel:
  Total earned | This month | Pending payout
  [Request payout] button
  Transaction history table
```

---

### 8.16 Admin Panel (Separate Shell)

**Access:** Only users with `adminUser.role` set (not regular user or coach)
**URL:** `/admin/*`
**Authentication:** Separate admin login at `/admin/login`

**Admin Navigation (left sidebar, always expanded):**
```
Overview | Users | Coaches | Content Mod | Food DB | Exercises | Payments | Analytics | Settings
```

#### Admin Dashboard (`/admin`)

Key metrics at a glance:
```
Row 1: Total Users | Active Today (DAU) | New This Week | Monthly Revenue
Row 2: Total Coaches | Pending Verifications | Flagged Content | Support Tickets
Charts: 30-day DAU chart | Revenue chart | User growth chart
```

#### User Management (`/admin/users`)

```
Search + filter: [Name/email search] [Status: All|Active|Suspended|Deleted] [Plan: All|Free|Premium|Coach]

Table: Avatar+Name | Email | Plan | Join Date | Last Active | Status | Actions
Actions per row: [View] [Suspend] [Delete] [Impersonate (super admin only)]

User detail page:
  All profile data
  Full activity log
  All posts
  Subscription history
  Support tickets
  [Suspend account] | [Delete account] | [Give free premium]
```

#### Coach Verification (`/admin/coaches`)

```
Verification queue (pending badge):
  Each application card:
    Applicant name + profile
    Submitted certifications (images)
    Bio and credentials
    [Approve] [Reject] [Request more info] buttons
    
All coaches table:
  Name | Status | Clients | Revenue | Rating | Actions
```

#### Content Moderation (`/admin/content`)

```
Flagged content queue:
  Each flagged item:
    Content preview | Type | Reported by | Reason | Date
    [Remove] [Dismiss] [Warn User] [Ban User]
  Filter: All | Posts | Comments | Messages | Profiles

Moderation log: history of all mod actions
```

#### Food Database Admin (`/admin/food-db`)

```
Pending submissions table:
  Food name | Submitted by | Date | [Approve] [Reject] [Edit]
  
Search all food items:
  Edit any item's nutritional data
  Merge duplicate entries
  Mark as verified / unverify
```

#### Platform Analytics (`/admin/analytics`)

```
Charts:
  DAU / MAU over time
  New registrations per day
  Feature usage: diary / workouts / coaching / community (by % of DAU)
  Revenue breakdown by tier
  Top 10 coaches by revenue
  Geographic breakdown (country map chart)
  Retention cohort table
```

---

## 9. Everfit.io Feature Integration

Based on the Everfit.io screenshot showing their 4-pillar structure: **Coach | Engage | Manage | Scale**

### Coach Pillar
- ✅ Workout Programming → `/coach/programs` + Program Builder
- ✅ Meal Plans & Recipe Books → `/coach/content` meal plan publishing
- ✅ Habit Tracking → Client habit check-in system in `/coach/clients/[id]`
- ✅ On-Demand Training → Programs published to marketplace
- ✅ Everfit AI equivalent → AI suggestions in coaching page
- ✅ Sports Coaching → Specialty filter in coach discovery

### Engage Pillar
- ✅ 1-1 Messaging → Full Messenger-parity `/messages`
- ✅ Community Forum → Twitter-parity `/community`
- ✅ Broadcast Messaging → `/coach/broadcast`
- ✅ Forms & Questionnaires → `/coach/forms`

### Manage Pillar
- ✅ Data Analytics → Coach analytics at `/coach/analytics` + Admin at `/admin/analytics`
- ✅ Custom Branding → Coach profile customization (banner, color theme)
- ✅ Teams → Group coaching, group chats

### Scale Pillar
- ✅ Automation → Coach broadcast scheduling, check-in automation
- ✅ Integrated Payments → Marketplace with payout system at `/coach/marketplace`
- ✅ Marketplace → `/coach/marketplace`
- ✅ Integrations → Settings integrations panel
- ✅ HSA/FSA → Billing section shows HSA/FSA eligibility note for coach plans

---

## 10. Complete AI Code Generator Prompt

---

**Paste everything below into your AI code generator:**

---

You are a **Senior Lead Full-Stack Engineer**. Build **SuperFit** — a complete production SaaS fitness web app. No coming-soon labels. No shortcuts. Build EVERYTHING listed. This rivals MyFitnessPal + Strong App + Everfit.io in a single platform.

## TECH STACK
Next.js 14 App Router · TypeScript · Tailwind CSS · shadcn/ui (Neutral) · Zustand (persist) · Framer Motion 11 · Recharts 2 · Lucide React (only) · howler.js · react-dropzone · react-image-crop · @hello-pangea/dnd · emoji-picker-react · react-player · react-window

Fonts: DM Sans (display) + Inter (UI) + JetBrains Mono (timers)

## THREE USER ROLES — COMPLETELY SEPARATE SHELLS

**1. Regular User:** `/` routes with sidebar + mobile bottom nav
**2. Coach:** `/coach/*` routes with completely different horizontal nav — no shared layout with users
**3. Admin:** `/admin/*` routes with separate admin sidebar — separate login at `/admin/login`

Each role has completely different navigation, pages, and data access. A user cannot see coach pages. A coach cannot see admin pages.

## SIDEBAR BEHAVIOR (CRITICAL)
The user sidebar uses icon-click as expand/collapse trigger:
- Sidebar starts EXPANDED (240px) on desktop
- Clicking any nav ICON (when collapsed at 64px) → EXPANDS sidebar AND navigates to that route
- Clicking the ACTIVE nav item (when expanded) → COLLAPSES sidebar
- Clicking anywhere on the sidebar outside nav items (when expanded) → COLLAPSES sidebar
- Framer Motion animates width 240↔64, labels fade in/out
- When collapsed: show Radix Tooltip on icon hover with label
- On mobile: sidebar hidden, uses bottom tab nav (5 tabs + raised center + Log button)

## COLOR SYSTEM
```css
.dark { --bg-base:#0a0a0a; --bg-surface:#111111; --bg-elevated:#1a1a1a; --border-subtle:#1f1f1f; --border-default:#2a2a2a; --text-primary:#fafafa; --text-secondary:#a3a3a3; --text-tertiary:#525252; --accent:#22c55e; --accent-bg:rgba(34,197,94,0.10); --chart-purple:#c084fc; --chart-blue:#60a5fa; --chart-amber:#fbbf24; --chart-red:#f87171; }
.light { --bg-base:#ffffff; --bg-surface:#f9f9f9; --border-subtle:#e5e7eb; --text-primary:#0a0a0a; --text-secondary:#4b5563; --accent:#16a34a; }
```
Fonts: DM Sans for headings/metrics, Inter for UI/body, JetBrains Mono for timers.

## ONBOARDING — 11-STEP GUIDED CALCULATOR FLOW
Multi-step with hero illustrations each step, animated progress bar, back/next controls. Steps:
1. Welcome + name + photo
2. Biometrics (sex, age, height, weight, goal weight, unit toggle)
3. Goals (6 cards: weight loss, muscle gain, recomp, maintenance, endurance, general)
4. Activity level (4 cards with step counts described)
5. Exercise frequency (days/week number picker, session duration chips, exercise type chips, experience level cards)
6. Dietary preferences (6 cards + allergy chips)
7. Supplement use (multi-select chips) + rate of change target (weekly pace)
8. Health conditions (optional multi-select with skip)
9. Water Calculator step: climate selector + pregnancy/breastfeeding + caffeine + alcohol → auto-calculates water goal with animated breakdown, "Set as my goal"
10. Results: auto-calculated BMR/TDEE/calorie target/protein/carbs/fat/water displayed as stat cards with count-up animations, "How we calculated this" accordion
11. Celebration: confetti + feature spotlight + "Enter SuperFit"

## DIARY — FOOD + EXERCISE + AI SCAN
Three tabs: Food Diary | Exercise Diary | AI Scans

**Food diary:** CalendarStrip + MacroSummaryBar + 6 meal accordion sections + Net Calories (consumed − exercise burned). Add food → FoodSearchSheet with tabs: Search | AI Snap | Barcode | Voice | Saved Meals | History.

**Exercise diary:** Add exercises that log calories burned, feeding back into net calorie calculation. Shows today's planned workout as shortcut.

**AI Scan tab (FULLY IMPLEMENTED UI):**
Camera viewfinder or image upload → 1.5s loading animation → shows detected food list (mock AI in MVP — random selection from food DB) → each item shows name, portion estimate, macros → user can edit quantity, remove items → Add to meal slot selector → "Save to Diary" adds all items AND saves the image as blob URL. Scan history shows past scans with thumbnails.

## HYDRATION — FULL CALENDAR + CUSTOM DRINKS + CAFFEINE MONITOR

**4 view modes:** Day | Week | Month | Year (chip selector at top)

**Day view:** Animated SVG ring + quick-add buttons + drink type chip selector (each shows hydration factor) + log list + Caffeine Monitor card (today's caffeine vs 400mg limit, by-drink breakdown, bar goes amber at 70%, red at 100%).

**Week view:** 7-bar chart colored by goal % + day table.

**Month view:** Calendar grid where each day cell shows a mini ring with color coding (green/amber/red/gray).

**Year view:** 12-month bar chart + stats.

**Custom Drink Modal:** Name + emoji icon + color + caffeine per 100ml slider + hydration factor slider (0.0–1.0 with labels) + save to favorites.

All existing drink types show hydration factors: Water ×1.0, Sparkling ×1.0, Tea ×0.8, Juice ×0.85, Sports drink ×0.9, Coffee ×0.5, Energy drink ×0.4.

## TIMER HUB — ZERO COMING SOON, ALL MODES FULLY WORKING
**9 modes:** Tabata | HIIT | EMOM | AMRAP | Boxing | Circuit | Running | Yoga | Custom

**Each mode has:**
- Configuration panel with relevant inputs (pre-filled with sensible defaults)
- Full-screen timer view with large SVG ring (JetBrains Mono countdown, color changes by phase)
- Controls: Restart | Play/Pause | Skip
- Round indicators

**howler.js sounds for all transitions:**
- Work start: bell.mp3 (embedded data URL or CDN)
- Rest start: softer beep
- 3-second countdown: three short beeps
- Halfway alert: single chime
- Round complete: double bell

**Advanced Settings Panel (fully wired, not decorative):**
Prep countdown (3/5/10/15s) | Work/Rest sound selector (Bell/Beep/Whistle + custom upload via react-dropzone) | 3-second beeps toggle | Halfway alert | Screen keep-awake (navigator.wakeLock) | Color pulse animation | Vibration (navigator.vibrate) | Show exercise GIF | Volume slider.

**Custom Timer Builder:**
Dynamic interval list with @hello-pangea/dnd drag-to-reorder. Each interval: name + duration picker (mm:ss) + type selector + color picker. Rounds input. Save as template. All saves to Zustand store and persists.

**useTimer hook** drives all timer logic with setInterval: decrements secondsRemaining each tick, advances intervals, plays sounds via howler, handles between-rounds rest, detects complete state.

## MEAL PLANNER — WEEKLY / MONTHLY / YEARLY

**3 views:** Week (grid: meal slot rows × day columns) | Month (calendar grid, day cells) | Year (12 monthly cards)

**Week grid:** Each cell shows planned meal thumbnail + name + kcal. Drag-to-move meals between cells using @hello-pangea/dnd. "+ Add" in empty cells.

**Add Meal Modal (rich UX):** Search (food DB + recipes) | Drinks tab | My Recipes tab | AI Suggest tab (suggests items to complete day's macros). Recipe builder inside modal: name + cover image upload + ingredients list + instructions + auto-calculated macros. Any food OR drink can be planned (drinks show hydration ml alongside calories).

**Month view:** Calendar with dot indicators per meal slot (green=filled, gray=empty) + total kcal per day.

**Year view:** 12 mini-calendar cards showing plan coverage %.

## GROCERY LIST — DAY-BASED, CARD-TYPE

Left panel: week date navigation + day chip selector.
Right panel: category card grid (2–3 per row).

**Each category card:** Cover image (uploadable, react-dropzone) + category name (editable inline) + item list with checkboxes + "Add Item" inline input + drag-to-reorder items. Long-press item → context menu (Edit, Add image, Duplicate, Delete). Category card: rename, change image, change color, collapse/expand.

**Add Category card** (dashed border): opens modal with name + image + color.

**Smart generate from meal plan** extracts all ingredients from the week's recipes and populates category cards.

## CALCULATORS — GUIDED ONBOARDING FEEL

Hub page with 4 category sections (Body / Nutrition / Training / Lifestyle), each showing calculator cards with icon + name + description.

First-time users: "Start with Guided Assessment" card linking to onboarding calculator flow.

Each calculator page: Hero section (name + what it measures + illustration + "how it's calculated" accordion) → Form section (multi-step appearance, pre-filled from user profile) → Results section (slides in, large result number + category badge + explanation + action links).

**Water Calculator (`/calculators/water`):** Climate selector (4 options with imagery) + pregnancy/breastfeeding/caffeine/alcohol inputs → animated result: "2,850 ml" count-up + breakdown table + bottle count visual + "Set as my hydration goal" button.

Build ALL 16 calculators including water, BMI, protein, creatine, calorie deficit (Hall model with weight loss curve chart), 1RM, TDEE, body fat, macros, VO2 max, HR zones, IF window, ideal weight, reverse diet, calories burned, caffeine limit.

## PROGRESS — PHOTOS WITH WEIGHT TAGGING + SMART COMPARISON

**Photo upload:** react-dropzone → react-image-crop (3:4 ratio) → tag date + weight + body fat % + position (Front/Side/Back) + notes + "mark as baseline" toggle.

**Gallery:** 3-col grid with date + weight overlay chips. Sort by newest/oldest/position. Filter chips.

**Compare Mode:**
- LEFT panel: baseline/earliest photo OR user selects any "before" photo
- RIGHT panel: ALWAYS the most recent photo (cannot be changed) with "After" label
- Weight difference chip (green for loss, red for gain)
- Days elapsed chip
- "Save comparison" exports side-by-side image
- "Share to community" posts it

## COMMUNITY — TWITTER/X PARITY

**Full Twitter feature set:**
- For You / Following feed tabs
- Post composer: text + up to 4 images + GIF + poll (2–4 options + duration) + thread creation
- All post types: workout share, meal share, PR celebration, text, image, video, poll
- Actions: Like (animated heart) | Reply (inline thread) | Repost (direct or quote with comment) | Bookmark | Share sheet
- Quote posts show original post preview inline
- @mentions auto-complete → user picker
- #hashtags are clickable → hashtag feed pages
- Character counter (280, circular indicator)
- Trending section (top 10 hashtags with counts)
- Who to follow suggestions
- Notification feed: likes, replies, reposts, follows, mentions — with per-type filter tabs
- Bookmarks page: all bookmarked posts
- User profile pages: banner + avatar + bio + stats + Posts/Replies/Media/Likes tabs
- Block, mute, report all functional
- Edit post within 15 minutes
- Pin posts on own profile
- react-window for virtual scroll of feed (performance)
- All data in useCommunityStore (Zustand)

## MESSAGES — FACEBOOK MESSENGER PARITY

**Conversation list:** Search + pin + mute + archive + delete + mark unread. Unread count badges.

**Chat window features:**
- Message bubbles: right (mine, green) / left (theirs, gray)
- Message types: text, image (inline preview), video (react-player), audio (waveform + play), file (icon + download), GIF, sticker, workout share card, food share card
- Reactions: row of emojis on hover → click to react → shows who reacted on hover
- Reply to specific message: shows quoted mini-preview above input
- Message context menu: React | Reply | Forward | Copy | Delete (for everyone) | Edit (mine, within 15min)
- Seen receipts: tiny avatar below last read message
- Typing indicators: animated 3-dot bubble
- "Active now" / "Last seen X ago" status
- Media gallery: all shared images/videos accessible from chat header "Info"

**Composer:**
- + button expands to: Photo/Video | File | Location | Workout share | Food share
- GIF picker (grid of labeled GIF placeholders)
- emoji-picker-react full emoji keyboard
- Voice recording: press-hold mic button, waveform animation, release to send, swipe left to cancel
- @mention support with user picker

**Group chats:**
- Create from selecting multiple contacts
- Group name + photo (uploadable)
- Admin roles: add/remove members, change name/photo
- Pin messages in group → shown in header
- Custom group emoji + nicknames per member

**Video/voice calls:** Full UI (mock): full-screen video with self-view, mute/video/end controls, duration counter.

**All data in useMessagesStore (Zustand)**

## COACHING DISCOVERY + COACHING PAGES

**Discovery page filter panel:**
Specialty (multi-select chips) | Location (city input + distance radius OR "Online only") | Price range slider | Rating filter | Availability toggle | Language | Gender | Experience level.

**Coach cards:** Cover + avatar + name + verified badge + rating + specialty chips + location + price → "View Profile" + "Message" buttons.

**Coach profile page:** Banner + avatar + Follow/Subscribe/Message CTAs + tabs (About/Programs/Posts/Reviews). Subscription plans (3 tiers). Reviews with rating histogram. Posts feed (locked posts blurred for non-subscribers).

**Active coaching page:** 3-column Image-3-style layout. Left: AI chat card + enrolled programs. Center: coach feed posts + workout submissions. Right: streak counter + weekly check-in + upcoming sessions + nutrition summary.

## COACH PAGES — SEPARATE SHELL (EVERFIT.IO PARITY)
Different horizontal nav from user shell. Pages:
1. **Dashboard:** Revenue metrics + client activity feed + today's sessions + quick actions
2. **Clients:** Searchable table with compliance % + weight trend sparklines. Per-client detail: full data access + coach notes + assign program
3. **Programs:** Program builder with weekly grid (drag-drop exercises per day). Publish as free/paid. Assign to clients.
4. **Content:** Post composer (post/tutorial/course/meal plan/challenge). Content calendar. Analytics per post.
5. **Schedule:** Availability calendar + session booking + buffer settings + cancellation policy
6. **Broadcast:** Compose message to all/group clients. Scheduled broadcasts. Send history with open rates.
7. **Forms:** Drag-drop form builder (text/number/scale/yes-no/multi-choice). Send to clients. View responses.
8. **Marketplace:** Sell programs/courses/bundles. Pricing + access control. Earnings + payout.
9. **Coach Settings:** Profile, payment info, branding, notification preferences.

## ADMIN PANEL — SEPARATE SHELL + SEPARATE LOGIN
URL: `/admin/*`, Login at `/admin/login` (separate from user/coach login)
Roles: super_admin | moderator | support | analytics

Pages:
1. **Overview:** DAU/MAU, new users, revenue, flagged content, pending coach verifications
2. **Users:** Search/filter table, per-user detail, suspend/delete/give premium
3. **Coaches:** Verification queue (approve/reject with certification review), all coaches table
4. **Content Moderation:** Flagged queue with Remove/Dismiss/Warn/Ban actions
5. **Food Database:** Approve/reject user-submitted foods, edit any food item
6. **Platform Analytics:** Charts for DAU, growth, feature usage, revenue, geographic breakdown, retention cohorts
7. **Payments:** Transaction history, payouts to coaches, refunds

## SETTINGS — FULL + REAL (11 sections)
Profile | Goals & Nutrition | Workout Preferences | Notifications (all toggles + time pickers) | Privacy (6 toggles) | Appearance (theme/font size/reduce motion) | Integrations (8 toggle cards) | Accessibility | Billing (plan + history) | Account (2FA + active sessions + connected accounts) | About

**Danger Zone (inside Account):**
- Deactivate Account → flow: reason picker → confirmation → deactivated state with reactivation message
- Delete Account → flow: type "DELETE" input + 30-day grace period
- Export My Data → generates ZIP download with CSV files

## ZUSTAND STORES — ALL 10 PERSISTED
useUserStore | useNutritionStore | useDiaryStore (food+exercise+AI scans) | useHydrationStore | useWorkoutStore | useProgressStore | useTimerStore | useMealPlannerStore | useGroceryStore | useCommunityStore | useMessagesStore | useCoachingStore | useAdminStore (session storage, not persisted)

## MOCK DATA — ALL STORES SEEDED (no empty screens)
60 foods | 80 exercises | 6 coaches (different locations, specialties, prices) | 30 days weight history | 5 workout sessions + 4 routines | 7 days hydration | 6 custom drink types | 20 community posts (tweets/workout/meal/PR types) | 4 conversations with message history | current week meal planner filled | current week grocery list | 5 admin users | 10 flagged content items

## ANIMATIONS (Framer Motion — all implemented)
Page entry: y 12→0, opacity 0→1, 280ms ease-out | Card stagger: staggerChildren 0.07 | Bottom sheet: y 100%→0 | Modal: scale 0.96→1 | Sidebar: width 240↔64 | Number count-up: useMotionValue | Set completion: scale spring + green flash | Achievement: scale 0→1 + rotate spring | Confetti: custom particles for onboarding completion | Photo comparison: slide-in from sides

## RECHARTS — all charts use CSS variables for colors (never hardcoded hex)

## ROUTING GUARDS
- User routes: redirect to /login if !isAuthenticated, redirect to /onboarding if !onboardingComplete
- Coach routes: redirect to / if !user.isCoach
- Admin routes: redirect to /admin/login if !adminSession
- Onboarding: redirect to / if onboardingComplete

## FINAL CHECKLIST
- [ ] 3 completely separate shells (user/coach/admin)
- [ ] Sidebar: icon-click expands/collapses + tooltip when collapsed
- [ ] All 11 onboarding steps including water calculator
- [ ] Diary: food + exercise + AI scan (UI + image save + food add)
- [ ] Hydration: Day/Week/Month/Year calendar, custom drinks, caffeine monitor
- [ ] Timer: ALL 9 modes fully working, howler.js sounds, advanced settings all wired
- [ ] Meal planner: week/month/year views, dynamic add-meal modal with recipe builder, drinks supported
- [ ] Grocery list: day-based, card-type categories with images, drag-to-reorder
- [ ] Calculators: ALL 16 built including water, onboarding-style UX, results slide in
- [ ] Progress photos: weight tagging on upload, compare = after always latest
- [ ] Community: full Twitter/X feature parity
- [ ] Messages: full Facebook Messenger feature parity
- [ ] Coaching: discovery with location filter + coach profile + active coaching 3-col layout
- [ ] Coach pages: 9 pages (dashboard/clients/programs/content/schedule/broadcast/forms/marketplace/settings)
- [ ] Admin panel: 7 pages + separate login
- [ ] Settings: all 11 sections including deactivate/delete danger zone
- [ ] All stores seeded (no empty screens)
- [ ] All Framer Motion animations
- [ ] All Recharts using CSS variables
- [ ] Routing guards per role
- [ ] Mobile responsive (bottom nav on <768px)

---

*SuperFit System Documentation v2.0*
*Updated: March 2026*
*Includes: Everfit.io parity + Twitter community + Messenger DMs + Full timer engine + Admin panel + Coach-only shell + Guided onboarding calculators + Dynamic meal planner + Smart grocery list*
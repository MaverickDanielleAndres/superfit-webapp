// ══════════════════════════════════════════
// USER
// ══════════════════════════════════════════
export type Sex = 'male' | 'female'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very_active'
export type FitnessGoal = 'weight_loss' | 'muscle_gain' | 'recomposition' | 'maintenance' | 'endurance' | 'general'
export type DietaryPreference = 'omnivore' | 'vegan' | 'vegetarian' | 'keto' | 'paleo' | 'flexitarian'
export type MeasurementSystem = 'metric' | 'imperial'
export type ExercisePreference = 'weights' | 'cardio' | 'hiit' | 'yoga' | 'cycling' | 'running' | 'martial_arts' | 'crossfit' | 'sports'

export interface UserProfile {
    id: string
    name: string
    email: string
    avatar: string | null
    age: number
    sex: Sex
    height: number       // cm
    currentWeight: number       // kg
    goalWeight: number       // kg
    goal: FitnessGoal
    activityLevel: ActivityLevel
    weeklyWorkouts: number       // sessions per week
    sessionDuration: number       // minutes
    exercisePreferences: ExercisePreference[]
    dietaryPreference: DietaryPreference
    measurementSystem: MeasurementSystem
    bmr: number       // auto-calculated, kcal
    tdee: number       // auto-calculated, kcal
    dailyCalorieTarget: number       // kcal
    proteinTarget: number       // grams
    carbTarget: number       // grams
    fatTarget: number       // grams
    fiberTarget: number       // grams
    waterTargetMl: number       // ml
    isPro: boolean
    isCoach: boolean
    onboardingComplete: boolean
    joinDate: string       // ISO date string
    timezone: string
    role: 'user' | 'coach' | 'admin'
    accountStatus?: 'active' | 'suspended' | 'inactive' | 'pending_review'
}

// ══════════════════════════════════════════
// NUTRITION
// ══════════════════════════════════════════
export type MealSlot = 'breakfast' | 'morning_snack' | 'lunch' | 'afternoon_snack' | 'dinner' | 'evening_snack'
export type NutrientCategory = 'Protein' | 'Grains' | 'Vegetables' | 'Fruits' | 'Dairy' | 'Nuts' | 'Fats' | 'Beverages' | 'Supplements' | 'Snacks' | 'Restaurant' | 'Other'

export interface FoodItem {
    id: string
    name: string
    brand?: string
    imageUrl?: string
    servingSize: number       // grams
    servingUnit: string       // 'g' | 'ml' | 'oz' | 'piece' | 'cup' etc.
    calories: number       // per serving
    protein: number       // grams per serving
    carbs: number       // grams per serving
    fat: number       // grams per serving
    fiber?: number
    sugar?: number
    sodium?: number       // mg
    potassium?: number       // mg
    vitaminC?: number       // mg
    calcium?: number       // mg
    iron?: number       // mg
    cholesterol?: number       // mg
    saturatedFat?: number      // grams
    category: NutrientCategory
    isVerified: boolean
    isCustom?: boolean
    barcode?: string
}

export interface MealEntry {
    id: string
    foodItemId: string
    foodItem: FoodItem
    quantity: number       // multiplier of servingSize (1 = one serving)
    mealSlot: MealSlot
    loggedAt: string       // ISO datetime
    notes?: string
}

export interface DayLog {
    date: string           // YYYY-MM-DD
    entries: MealEntry[]
}

export interface SavedMeal {
    id: string
    name: string
    entries: Omit<MealEntry, 'id' | 'loggedAt'>[]
}

export interface WeeklyMealPlan {
    id: string
    name: string
    days: Record<number, Record<MealSlot, string[]>>  // dayIndex → mealSlot → foodItemIds
}

export interface GroceryCategory {
    id: string;
    name: string;
    items: GroceryItem[];
}

export interface GroceryItem {
    id: string;
    name: string;
    checked: boolean;
    quantity: string;
    image?: string;
}

// ══════════════════════════════════════════
// WORKOUTS
// ══════════════════════════════════════════
export type SetType = 'warmup' | 'working' | 'failure' | 'dropset'
export type MovementPattern = 'push' | 'pull' | 'squat' | 'hinge' | 'carry' | 'rotation' | 'cardio' | 'core' | 'isolation'
export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'forearms' | 'quads' | 'hamstrings' | 'glutes' | 'calves' | 'core' | 'traps' | 'lats' | 'cardio'
export type Equipment = 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight' | 'resistance_band' | 'kettlebell' | 'suspension' | 'pull_up_bar' | 'bench' | 'rack'
export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

export interface Exercise {
    id: string
    name: string
    muscleGroups: MuscleGroup[]    // primary muscle groups
    secondaryGroups?: MuscleGroup[]
    equipment: Equipment[]
    movementPattern: MovementPattern
    difficulty: Difficulty
    instructions: string[]
    gifUrl?: string
    videoUrl?: string
    isCustom?: boolean
}

export interface SetLog {
    id: string
    setNumber: number
    weight: number         // kg or lbs (user's preference)
    reps: number
    rpe?: number         // 1–10
    setType: SetType
    completed: boolean
    restSeconds?: number         // recommended rest
    notes?: string
}

export interface ExerciseLog {
    id: string
    exerciseId: string
    exercise: Exercise
    sets: SetLog[]
    notes?: string
    isSuperset: boolean
    supersetGroupId?: string      // links exercises in a superset
    targetSets?: number
    targetReps?: string      // e.g., "8-12" or "5"
    targetWeight?: number
}

export interface WorkoutSession {
    id: string
    name: string
    date: string         // YYYY-MM-DD
    startTime: string         // ISO datetime
    endTime?: string
    duration?: number         // minutes
    exercises: ExerciseLog[]
    totalVolume: number         // total kg lifted (sets × reps × weight)
    calories?: number         // estimated calories burned
    notes?: string
    isCompleted: boolean
    routineId?: string         // which routine it was based on
    isTemplate: boolean        // is this a template (not a logged session)
}

export interface WorkoutRoutine {
    id: string
    name: string
    description?: string
    exercises: {
        exerciseId: string
        targetSets: number
        targetReps: string        // "8-12" or "5×5" etc.
        restSeconds: number
        notes?: string
    }[]
    scheduledDays?: number[]      // 0=Sun, 1=Mon ... 6=Sat
    category?: string
}

// ══════════════════════════════════════════
// HYDRATION
// ══════════════════════════════════════════
export type DrinkType = 'water' | 'coffee' | 'tea' | 'juice' | 'sports_drink' | 'milk' | 'sparkling' | 'smoothie' | 'custom'

export interface DrinkEntry {
    id: string
    type: DrinkType
    label: string        // display name
    amountMl: number
    caffeinesMg?: number
    hydrationFactor: number        // 1.0=water, 0.8=tea, 0.5=coffee, -0.3=alcohol
    loggedAt: string        // ISO datetime
    customIcon?: string // for custom drinks
    customColor?: string // for custom drinks
}

export interface HydrationDay {
    date: string
    entries: DrinkEntry[]
    goalMl: number
    totalHydrationMl: number    // sum of amountMl × hydrationFactor
    totalCaffeineMg: number
}

// ══════════════════════════════════════════
// PROGRESS
// ══════════════════════════════════════════
export interface WeightEntry {
    date: string
    weight: number   // kg
    bodyFat?: number   // percentage
    notes?: string
}

export interface BodyMeasurements {
    date: string
    neck?: number
    shoulders?: number
    chest?: number
    upperArm?: number
    forearm?: number
    waist?: number
    hips?: number
    thigh?: number
    calf?: number
    custom?: Record<string, number>
}

export interface ProgressPhoto {
    id: string
    date: string
    url: string
    notes?: string
    weightAtTime?: number // Auto-grabbed weight logic
}

export interface PersonalRecord {
    exerciseId: string
    exerciseName: string
    weight: number
    reps: number
    estimated1RM: number
    date: string
}

// ══════════════════════════════════════════
// TIMER
// ══════════════════════════════════════════
export type TimerMode = 'tabata' | 'hiit' | 'emom' | 'amrap' | 'circuit' | 'custom' | 'round_timer' | 'countdown' | 'yoga' | 'boxing'
export type IntervalType = 'work' | 'rest' | 'prepare' | 'transition'

export interface TimerInterval {
    id: string
    name: string
    durationSeconds: number
    type: IntervalType
    color: string
    exerciseGifUrl?: string
    coachingCue?: string
}

export interface TimerConfig {
    id: string
    name: string
    mode: TimerMode
    intervals: TimerInterval[]
    totalRounds: number
    prepSeconds: number        // countdown before starting
    soundEnabled: boolean
    halfwayAlert: boolean      // Advanced Setting
    restBetweenRounds: number      // seconds
}

// ══════════════════════════════════════════
// MESSAGES (Messenger Parity)
// ══════════════════════════════════════════
export interface MessageReaction {
    userId: string;
    emoji: string;
}

export interface MessageAttachment {
    id: string;
    type: 'image' | 'video' | 'file';
    url: string;
    thumbnailUrl?: string;
    name?: string;
}

export interface ChatMessage {
    id: string;
    threadId: string;
    senderId: string;
    text: string;
    createdAt: string;
    status: 'sent' | 'delivered' | 'read';
    reactions: MessageReaction[];
    attachments: MessageAttachment[];
    replyToId?: string; // For thread replies
}

export interface ChatThread {
    id: string;
    participants: { id: string, name: string, avatar: string }[];
    isGroup: boolean;
    groupName?: string;
    groupAvatar?: string;
    lastMessage?: ChatMessage;
    unreadCount: number;
    updatedAt: string;
}

// ══════════════════════════════════════════
// COMMUNITY (Twitter Parity)
// ══════════════════════════════════════════
export interface CommunityPoll {
    question: string;
    options: { id: string; text: string; votes: number }[];
    totalVotes: number;
    userVotedId?: string;
}

export interface CommunityPost {
    id: string
    userId: string
    userName: string
    userHandle: string // Twitter style handle @handle
    userAvatar: string
    isCoach: boolean
    isVerified?: boolean
    type: 'workout' | 'meal' | 'progress' | 'text' | 'pr' | 'challenge'
    content: string
    mediaUrls?: string[] // Support multiple media
    poll?: CommunityPoll
    workoutRef?: { name: string; duration: number; volume: number }
    mealRef?: { calories: number; protein: number }
    prRef?: { exercise: string; weight: number; reps: number }
    likes: number
    comments: number
    reposts: number // Twitter parity
    views?: number // Twitter parity
    isLiked?: boolean
    isReposted?: boolean
    repostedFrom?: { userId: string; userName: string; userHandle: string } // If this is a retweet
    parentId?: string // If this is a reply to another tweet
    postedAt: string
}

export interface Challenge {
    id: string
    name: string
    description: string
    type: 'steps' | 'calories' | 'workouts' | 'water' | 'protein' | 'custom'
    startDate: string
    endDate: string
    participants: number
    isJoined?: boolean
    leaderboard: { userId: string; name: string; avatar: string; score: number }[]
}

// ══════════════════════════════════════════
// COACHING
// ══════════════════════════════════════════
export type CoachSpecialty = 'weight_loss' | 'muscle_gain' | 'powerlifting' | 'athletic_performance' | 'prenatal' | 'senior' | 'rehabilitation' | 'nutrition' | 'cardio' | 'hiit' | 'yoga' | 'mindfulness'

export interface Coach {
    id: string
    name: string
    avatar: string
    coverImage: string
    specialty: CoachSpecialty[]
    bio: string
    shortBio: string          // 1-2 sentences for cards
    certifications: string[]
    rating: number          // 0–5
    reviewCount: number
    clientCount: number
    pricePerMonth: number          // USD
    isVerified: boolean
    isAvailable: boolean
    languages: string[]
    yearsExp: number
    location: string
}

export interface FormCheck {
    id: string;
    clientId: string;
    videoUrl: string;
    exerciseName: string;
    notes: string;
    status: 'pending' | 'reviewed';
    coachFeedback?: string;
    coachVideoUrl?: string; // Voiceover/markup reply
    submittedAt: string;
    reviewedAt?: string;
}

export interface CoachingProgram {
    id: string;
    title: string;
    description: string;
    weeks: number;
    tasks: { id: string, title: string, isCompleted: boolean }[];
    workouts: WorkoutRoutine[];
}

export interface CoachPost {
    id: string
    coachId: string
    type: 'text' | 'image' | 'video' | 'workout' | 'meal_plan' | 'challenge'
    title?: string
    content: string
    mediaUrl?: string
    tags: string[]
    likes: number
    comments: number
    saves: number
    postedAt: string
    isExclusive: boolean           // subscriber-only
    isLiked?: boolean           // by current user
    isSaved?: boolean
}

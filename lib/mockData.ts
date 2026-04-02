import { UserProfile, DrinkEntry } from '@/types'
import { calculateBMR, calculateTDEE, calculateProteinTarget, calculateWaterGoal } from './calculations'

export const getMockUser = (): UserProfile => {
    const weight = 73
    const height = 180
    const age = 28
    const sex = 'male'
    const activityLevel = 'very_active'
    const goal = 'recomposition'

    const bmr = calculateBMR(weight, height, age, sex)
    const tdee = calculateTDEE(bmr, activityLevel)
    const proteinTarget = calculateProteinTarget(weight, goal, activityLevel)
    const calorieTarget = 2400
    const fatTarget = Math.round((calorieTarget * 0.28) / 9)
    const carbTarget = Math.round((calorieTarget - (proteinTarget * 4) - (fatTarget * 9)) / 4)

    return {
        id: 'user-123',
        name: 'Alex Mercer',
        email: 'alex.m@example.com',
        avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Alex',
        age,
        sex,
        height,
        currentWeight: weight,
        goalWeight: 75,
        goal,
        activityLevel,
        weeklyWorkouts: 5,
        sessionDuration: 60,
        exercisePreferences: ['weights', 'hiit'],
        dietaryPreference: 'omnivore',
        measurementSystem: 'metric',
        bmr,
        tdee,
        dailyCalorieTarget: calorieTarget,
        proteinTarget,
        carbTarget,
        fatTarget,
        fiberTarget: 38,
        waterTargetMl: calculateWaterGoal(weight, activityLevel),
        isPro: true,
        isCoach: false,
        onboardingComplete: true,
        joinDate: new Date().toISOString(),
        timezone: 'America/New_York',
        role: 'user'
    }
}

export const getMockHydrationEntries = (): DrinkEntry[] => {
    return [
        { id: '1', type: 'water', label: 'Morning Glass', amountMl: 500, hydrationFactor: 1, loggedAt: new Date(new Date().setHours(6, 30)).toISOString() },
        { id: '2', type: 'coffee', label: 'Black Coffee', amountMl: 300, caffeinesMg: 120, hydrationFactor: 0.5, loggedAt: new Date(new Date().setHours(7, 30)).toISOString() },
        { id: '3', type: 'water', label: 'Water Bottle', amountMl: 750, hydrationFactor: 1, loggedAt: new Date(new Date().setHours(10, 0)).toISOString() }
    ]
}

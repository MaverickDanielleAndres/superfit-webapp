import { ActivityLevel, FitnessGoal, Sex } from '@/types'

export const calculateBMR = (weightKg: number, heightCm: number, age: number, sex: Sex): number => {
    if (sex === 'male') {
        return 10 * weightKg + 6.25 * heightCm - 5 * age + 5
    } else {
        return 10 * weightKg + 6.25 * heightCm - 5 * age - 161
    }
}

export const calculateTDEE = (bmr: number, activityLevel: ActivityLevel): number => {
    const multipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        very_active: 1.725
    }
    return bmr * multipliers[activityLevel]
}

export const calculateProteinTarget = (weightKg: number, goal: FitnessGoal, activityLevel: ActivityLevel): number => {
    let multiplier = 1.6 // Base for active individuals

    if (goal === 'muscle_gain' || goal === 'recomposition') {
        multiplier = 2.2
    } else if (goal === 'weight_loss') {
        multiplier = 2.0 // High protein to preserve muscle
    } else if (activityLevel === 'sedentary') {
        multiplier = 1.2
    }

    return Math.round(weightKg * multiplier)
}

export const calculateWaterGoal = (weightKg: number, activityLevel: ActivityLevel): number => {
    // Base: 35ml per kg of body weight
    let ml = weightKg * 35

    if (activityLevel === 'moderate') {
        ml += 500
    } else if (activityLevel === 'very_active') {
        ml += 1000
    }

    return Math.round(ml)
}

export const calculateBMI = (weightKg: number, heightCm: number): { bmi: number, category: string } => {
    const heightM = heightCm / 100
    const bmi = Number((weightKg / (heightM * heightM)).toFixed(1))

    let category = 'Healthy weight'
    if (bmi < 18.5) category = 'Underweight'
    else if (bmi >= 25 && bmi < 29.9) category = 'Overweight'
    else if (bmi >= 30) category = 'Obese'

    return { bmi, category }
}

export const calculateCreatine = (weightKg: number) => {
    // Standard loading phase is ~0.3g/kg/day, maintenance is 0.03-0.05g/kg/day
    // Simplified to standard clinical recommendations: 20-25g load, 3-5g maintain
    const loadPhase = Math.round(weightKg * 0.3)
    const maintainPhase = Math.max(3, Math.round(weightKg * 0.04))

    return {
        loadDaily: Math.min(25, loadPhase),
        maintainDaily: Math.min(5, maintainPhase)
    }
}

export const getDeficitScenarios = (tdee: number, currentWeight: number, goalWeight: number) => {
    // Utilizing a simplified Hall Model where 1kg of fat ~ 7700 kcal
    const weightDiff = currentWeight - goalWeight
    if (weightDiff <= 0) return [] // Only calcs for loss here

    const totalKcalDeficitNeeded = weightDiff * 7700

    return [
        { deficit: 300, label: "Mild (0.25kg/wk)", weeks: Math.round(totalKcalDeficitNeeded / (300 * 7)) },
        { deficit: 500, label: "Moderate (0.5kg/wk)", weeks: Math.round(totalKcalDeficitNeeded / (500 * 7)) },
        { deficit: 750, label: "Aggressive (0.75kg/wk)", weeks: Math.round(totalKcalDeficitNeeded / (750 * 7)) },
        { deficit: 1000, label: "Extreme (1kg/wk)", weeks: Math.round(totalKcalDeficitNeeded / (1000 * 7)) }
    ]
}

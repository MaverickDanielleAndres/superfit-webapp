'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar as CalendarIcon, ShoppingCart, GripVertical, ChevronRight, ChevronLeft, Plus, Search, X, Flame, CalendarDays, MoreHorizontal, Utensils } from 'lucide-react'
import { cn } from '@/lib/utils'
import { requestApi } from '@/lib/api/client'
import { toast } from 'sonner'

interface RecipeSearchItem {
    id: string
    name: string
    cals: number
    protein: number
    carbs: number
    fat: number
    image: string
    badges: string[]
}

export default function MealPlannerPage() {
    const [activeTab, setActiveTab] = useState<'plan' | 'list'>('plan')
    const [viewMode, setViewMode] = useState<'weekly' | 'monthly' | 'yearly'>('weekly')

    // Mock Weekly Data Structure
    const currentWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const [activeDay, setActiveDay] = useState('Mon')

    const [showMealSearch, setShowMealSearch] = useState(false)
    const [addingToMeal, setAddingToMeal] = useState<{ day: string, meal: string } | null>(null)
    const [recipeSearchQuery, setRecipeSearchQuery] = useState('')
    const [recipeSearchResults, setRecipeSearchResults] = useState<RecipeSearchItem[]>([])
    const [isRecipeSearchLoading, setIsRecipeSearchLoading] = useState(false)
    const [recipeSearchError, setRecipeSearchError] = useState<string | null>(null)

    const [viewRecipe, setViewRecipe] = useState<any>(null)
    const [showRecipeBuilder, setShowRecipeBuilder] = useState(false)

    const [plan, setPlan] = useState<Record<string, Record<string, { id: string, name: string, cals: number }[]>>>({
        Mon: { breakfast: [{ id: '1', name: 'Oatmeal & Protein', cals: 350 }], lunch: [{ id: '2', name: 'Chicken Bowl', cals: 550 }], dinner: [{ id: '3', name: 'Salmon', cals: 450 }], snacks: [{ id: '4', name: 'Yogurt', cals: 120 }] },
        Tue: { breakfast: [], lunch: [{ id: '5', name: 'Turkey Wrap', cals: 400 }], dinner: [], snacks: [] },
        Wed: { breakfast: [], lunch: [], dinner: [], snacks: [] },
        Thu: { breakfast: [{ id: '6', name: 'Eggs & Toast', cals: 300 }], lunch: [], dinner: [], snacks: [] },
        Fri: { breakfast: [], lunch: [], dinner: [{ id: '7', name: 'Steak & Potato', cals: 700 }], snacks: [] },
        Sat: { breakfast: [], lunch: [], dinner: [], snacks: [] },
        Sun: { breakfast: [], lunch: [], dinner: [], snacks: [] },
    })

    const [groceryList, setGroceryList] = useState([
        { category: 'Produce', image: 'https://images.unsplash.com/photo-1518843875459-f738682238a6?w=400&fit=crop', items: [{ id: 1, name: 'Spinach', checked: false }, { id: 2, name: 'Asparagus', checked: true }, { id: 3, name: 'Bananas', checked: false }] },
        { category: 'Proteins', image: 'https://images.unsplash.com/photo-1603048297172-c92544798d5e?w=400&fit=crop', items: [{ id: 4, name: 'Chicken Breast (2 lbs)', checked: false }, { id: 5, name: 'Wild Salmon', checked: false }] },
        { category: 'Dairy & Eggs', image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400&fit=crop', items: [{ id: 6, name: 'Greek Yogurt', checked: true }, { id: 7, name: 'Eggs (1 Dozen)', checked: false }] },
    ])

    const fallbackRecipes: RecipeSearchItem[] = [
        { id: 'fallback-1', name: 'Grilled Chicken & Rice', cals: 550, protein: 40, carbs: 52, fat: 16, image: 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?w=100&fit=crop', badges: ['High Protein'] },
        { id: 'fallback-2', name: 'Avocado Toast', cals: 320, protein: 12, carbs: 30, fat: 18, image: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=100&fit=crop', badges: ['Vegan'] },
        { id: 'fallback-3', name: 'Protein Smoothie', cals: 280, protein: 28, carbs: 24, fat: 6, image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=100&fit=crop', badges: ['Quick'] },
        { id: 'fallback-4', name: 'Beef Stir Fry', cals: 620, protein: 39, carbs: 50, fat: 24, image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=100&fit=crop', badges: ['High Protein'] },
    ]

    const displayedRecipes = recipeSearchQuery.trim().length >= 2 ? recipeSearchResults : fallbackRecipes

    const toggleGroceryItem = (catIndex: number, itemId: number) => {
        const newList = [...groceryList]
        const item = newList[catIndex].items.find(i => i.id === itemId)
        if (item) item.checked = !item.checked
        setGroceryList(newList)
    }

    const removeMeal = (day: string, mealKey: string, itemId: string) => {
        setPlan(prev => ({ 
            ...prev, 
            [day]: { 
                ...prev[day], 
                [mealKey]: prev[day]?.[mealKey]?.filter((i: any) => i.id !== itemId) || [] 
            } 
        }))
        toast.success(`Removed from ${day}'s plan`)
    }

    const openMealSearch = (day: string, mealKey: string) => {
        setAddingToMeal({ day, meal: mealKey })
        setRecipeSearchQuery('')
        setRecipeSearchError(null)
        setShowMealSearch(true)
    }

    const generateGroceryListFromPlan = () => {
        const allMeals = Object.values(plan)
            .flatMap((dayPlan) => Object.values(dayPlan).flatMap((entries) => entries.map((entry) => entry.name)))

        const uniqueMeals = Array.from(new Set(allMeals))

        if (!uniqueMeals.length) {
            toast.error('Add meals to your plan before generating a grocery list.')
            return
        }

        setGroceryList([
            {
                category: 'Planned Meals',
                image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400&fit=crop',
                items: uniqueMeals.map((mealName, index) => ({
                    id: Date.now() + index,
                    name: mealName,
                    checked: false,
                })),
            },
        ])

        setActiveTab('list')
        toast.success('Grocery list generated from your current plan.')
    }

    const sendToInstacart = () => {
        const uncheckedItems = groceryList.flatMap((category) => category.items.filter((item) => !item.checked).map((item) => item.name))

        if (!uncheckedItems.length) {
            toast.error('No unchecked items to send to Instacart.')
            return
        }

        const query = encodeURIComponent(uncheckedItems.join(', '))
        window.open(`https://www.instacart.com/store/search_v3/${query}`, '_blank', 'noopener,noreferrer')
        toast.success('Opening Instacart search in a new tab.')
    }

    const confirmAddMeal = (recipeName: string, cals: number) => {
        if (!addingToMeal) return
        setPlan(prev => ({ 
            ...prev, 
            [addingToMeal.day]: { 
                ...prev[addingToMeal.day], 
                [addingToMeal.meal]: [...(prev[addingToMeal.day]?.[addingToMeal.meal] || []), { id: Date.now().toString(), name: recipeName, cals }] 
            } 
        }))
        setShowMealSearch(false)
        toast.success(`Added ${recipeName} to ${addingToMeal.day}`)
        setAddingToMeal(null)
    }

    const getDayTotal = (dayObj: any) => {
        if (!dayObj) return 0
        return Object.values(dayObj).reduce((sum: number, arr: any) => sum + (arr || []).reduce((s: number, i: any) => s + i.cals, 0), 0) as number
    }

    React.useEffect(() => {
        if (!showMealSearch) return

        const query = recipeSearchQuery.trim()
        if (query.length < 2) {
            setRecipeSearchResults([])
            setRecipeSearchError(null)
            setIsRecipeSearchLoading(false)
            return
        }

        let isCancelled = false
        setIsRecipeSearchLoading(true)

        const timer = setTimeout(() => {
            void (async () => {
                try {
                    const response = await requestApi<{ recipes: RecipeSearchItem[] }>(`/api/v1/meal-planner/recipes/search?query=${encodeURIComponent(query)}&limit=10`)
                    if (isCancelled) return
                    setRecipeSearchResults(response.data.recipes)
                    setRecipeSearchError(null)
                } catch (error) {
                    if (isCancelled) return
                    setRecipeSearchResults([])
                    setRecipeSearchError(error instanceof Error ? error.message : 'Unable to search recipes.')
                } finally {
                    if (!isCancelled) {
                        setIsRecipeSearchLoading(false)
                    }
                }
            })()
        }, 300)

        return () => {
            isCancelled = true
            clearTimeout(timer)
        }
    }, [recipeSearchQuery, showMealSearch])

    // Dynamic renderers based on view mode
    const renderWeeklyView = () => (
        <AnimatePresence mode="wait">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col md:flex-row gap-6">
                {/* Calendar Picker Sidebar */}
                <div className="w-full md:w-[280px] shrink-0 bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-5 flex flex-col shadow-sm">
                    <div className="flex items-center justify-between mb-6 px-1">
                        <button className="w-[32px] h-[32px] flex items-center justify-center rounded-full bg-[var(--bg-elevated)] text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--border-subtle) transition-colors"><ChevronLeft className="w-[16px] h-[16px]" /></button>
                        <span className="font-display font-bold text-[16px] text-(--text-primary)">This Week</span>
                        <button className="w-[32px] h-[32px] flex items-center justify-center rounded-full bg-[var(--bg-elevated)] text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--border-subtle) transition-colors"><ChevronRight className="w-[16px] h-[16px]" /></button>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        {currentWeek.map(day => {
                            const hasItems = plan[day] && Object.values(plan[day]).some((arr: any) => arr?.length > 0)
                            const totalCals = getDayTotal(plan[day])
                            return (
                                <button
                                    key={day}
                                    onClick={() => setActiveDay(day)}
                                    className={cn("flex items-center justify-between h-[52px] px-4 rounded-[14px] transition-all cursor-pointer group",
                                        activeDay === day ? 'bg-(--accent-bg-strong) border border-(--accent) shadow-sm' : 'bg-transparent border border-transparent text-(--text-secondary) hover:bg-[var(--bg-elevated)] hover:border-(--border-default)'
                                    )}
                                >
                                    <span className={cn("font-body text-[15px]", activeDay === day ? 'font-bold text-(--accent)' : 'font-medium group-hover:text-(--text-primary)')}>{day}</span>
                                    {hasItems && (
                                        <div className="flex items-center gap-2">
                                            <span className={cn("font-body text-[12px] font-semibold mt-0.5", activeDay === day ? "text-(--accent)" : "text-(--text-tertiary)")}>{totalCals}</span>
                                            <div className={cn("w-[6px] h-[6px] rounded-full", activeDay === day ? "bg-(--accent)" : "bg-(--chart-blue)")} />
                                        </div>
                                    )}
                                </button>
                            )
                        })}
                    </div>

                    <div className="mt-8 pt-6 border-t border-(--border-subtle)">
                        <button onClick={generateGroceryListFromPlan} className="w-full h-[48px] rounded-[14px] bg-(--text-primary) text-(--bg-base) font-body text-[14px] font-bold hover:opacity-90 transition-opacity shadow-[0_4px_14px_rgba(0,0,0,0.1)] cursor-pointer">
                            Generate Grocery List
                        </button>
                    </div>
                </div>

                {/* Daily Schedule Editor */}
                <div className="flex-1 bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-6 sm:p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-(--border-subtle)">
                        <div className="flex items-center gap-4">
                            <div className="w-[48px] h-[48px] rounded-[14px] bg-emerald-500/10 flex items-center justify-center">
                                <CalendarDays className="w-[24px] h-[24px] text-emerald-500" />
                            </div>
                            <div>
                                <h2 className="font-display font-bold text-[24px] text-(--text-primary) leading-tight">{activeDay}&apos;s Menu</h2>
                                <p className="font-body text-[14px] text-(--text-secondary)">Plan your exact meals for the day.</p>
                            </div>
                        </div>
                        <div className="text-right bg-[var(--bg-elevated)] border border-(--border-default) rounded-[16px] py-2 px-4 shadow-sm">
                            <span className="block font-body text-[11px] text-(--text-secondary) uppercase tracking-wider font-bold mb-0.5">Planned Calories</span>
                            <div className="flex items-center gap-1.5">
                                <Flame className="w-[14px] h-[14px] text-orange-500" />
                                <span className="font-display text-[20px] text-(--text-primary) font-black leading-none">{getDayTotal(plan[activeDay])}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map((meal) => {
                            const mealKey = meal.toLowerCase()
                            const plannedItems = plan[activeDay]?.[mealKey] || []
                            const mealTotal = plannedItems.reduce((s: number, i: any) => s + i.cals, 0)

                            return (
                                <div key={meal} className="group/meal border border-transparent hover:border-(--border-subtle) rounded-[20px] p-2 transition-colors">
                                    <div className="flex items-center justify-between mb-3 px-2">
                                        <h3 className="font-body font-bold text-[16px] text-(--text-primary) tracking-tight flex items-center gap-2">
                                            <Utensils className="w-[16px] h-[16px] text-(--text-tertiary)" />
                                            {meal}
                                        </h3>
                                        {plannedItems.length > 0 && <span className="font-body text-[13px] font-bold text-(--text-secondary)">{mealTotal} kcal</span>}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {plannedItems.map((item: any) => (
                                            <div key={item.id} className="bg-[var(--bg-elevated)] border border-(--border-default) rounded-[16px] p-4 flex items-center justify-between group shadow-sm hover:border-(--border-subtle) transition-all">
                                                <div className="flex flex-1 min-w-0 items-center gap-4">
                                                    <div className="w-[32px] h-[32px] shrink-0 rounded-full bg-(--bg-surface) flex items-center justify-center cursor-grab active:cursor-grabbing border border-(--border-subtle)">
                                                        <GripVertical className="w-[14px] h-[14px] text-(--text-tertiary) group-hover:text-(--text-primary) transition-colors" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <span className="block font-body text-[16px] text-(--text-primary) font-bold truncate">{item.name} <span className="text-[13px] text-(--text-tertiary) font-normal ml-2">{item.cals} kcal</span></span>
                                                        <div className="flex flex-wrap gap-2 mt-1 hidden sm:flex">
                                                            <span className="inline-block px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 font-body text-[11px] font-bold">Protein-Rich</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button onClick={() => setViewRecipe(item)} className="w-[36px] h-[36px] rounded-full bg-(--bg-surface) border border-(--border-subtle) flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary) transition-colors cursor-pointer">
                                                        <MoreHorizontal className="w-[16px] h-[16px]" />
                                                    </button>
                                                    <button
                                                        onClick={() => removeMeal(activeDay, mealKey, item.id)}
                                                        className="w-[36px] h-[36px] rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
                                                    >
                                                        <X className="w-[16px] h-[16px]" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => openMealSearch(activeDay, mealKey)}
                                            className="w-full h-[48px] rounded-[16px] border border-dashed border-(--border-default) flex items-center justify-center gap-2 text-(--text-secondary) hover:text-(--accent) hover:border-(--accent) hover:bg-(--accent-bg-strong) transition-all cursor-pointer font-body font-semibold text-[14px]"
                                        >
                                            <Plus className="w-[16px] h-[16px]" /> Add to {meal}
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    )

    const renderMonthlyView = () => (
        <AnimatePresence mode="wait">
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="font-display font-bold text-[24px] text-(--text-primary)">October 2026</h2>
                    <div className="flex gap-2">
                        <button className="h-[40px] px-4 rounded-[12px] bg-[var(--bg-elevated)] text-(--text-primary) font-body text-[14px] font-semibold border border-(--border-default) hover:border-(--border-subtle)">Auto-fill Month</button>
                    </div>
                </div>
                {/* Simple Grid Mockup for Monthly Calendar */}
                <div className="grid grid-cols-7 gap-px bg-(--border-subtle) rounded-[16px] overflow-hidden border border-(--border-subtle)">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="bg-[var(--bg-elevated)] p-3 text-center">
                            <span className="font-body text-[12px] font-bold text-(--text-secondary) uppercase tracking-wide">{day}</span>
                        </div>
                    ))}
                    {Array.from({ length: 35 }).map((_, i) => {
                        const date = i - 2 // Offset to mock a real month
                        const isCurrentMonth = date > 0 && date <= 31
                        const hasData = isCurrentMonth && [2, 5, 6, 9, 12, 14, 18].includes(date)
                        return (
                            <div key={i} className={cn("bg-(--bg-surface) min-h-[100px] p-2 flex flex-col transition-colors group", isCurrentMonth ? "hover:bg-[var(--bg-elevated)] cursor-pointer" : "opacity-40 pointer-events-none")}>
                                <span className={cn("font-display text-[16px] font-bold self-end mb-2", date === 14 ? "w-[28px] h-[28px] bg-(--accent) text-white rounded-full flex items-center justify-center leading-none" : "text-(--text-primary)")}>
                                    {isCurrentMonth ? date : ''}
                                </span>
                                {hasData && (
                                    <div className="mt-auto flex flex-col gap-1">
                                        <div className="h-[4px] w-full bg-emerald-500 rounded-full opacity-80" />
                                        <div className="h-[4px] w-3/4 bg-blue-500 rounded-full opacity-80" />
                                    </div>
                                )}
                                {!hasData && isCurrentMonth && (
                                    <div className="mt-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openMealSearch(`Oct ${date}`, 'breakfast')} className="w-full h-[24px] rounded-[6px] bg-(--text-primary) text-white flex items-center justify-center">
                                            <Plus className="w-[14px] h-[14px]" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </motion.div>
        </AnimatePresence>
    )

    const renderYearlyView = () => (
        <AnimatePresence mode="wait">
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-12 overflow-hidden shadow-sm text-center relative max-h-[600px]">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-(--bg-surface) z-10" />

                <div className="relative z-20 mb-8 max-w-[480px]">
                    <div className="w-[80px] h-[80px] rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <CalendarDays className="w-[40px] h-[40px] text-purple-500" />
                    </div>
                    <h3 className="font-display font-bold text-[32px] text-(--text-primary) leading-tight mb-4">Macro Trends & Yearly Overview</h3>
                    <p className="font-body text-[16px] text-(--text-secondary) leading-relaxed">
                        Analyzing nutritional data over a 12-month period. Track adherence, average caloric surpluses/deficits, and seasonal dietary habits.
                    </p>
                    <button className="mt-8 h-[48px] px-8 rounded-[14px] bg-[var(--bg-elevated)] border border-(--border-subtle) font-body text-[15px] font-bold text-(--text-primary) shadow-sm hover:border-(--border-default) transition-all cursor-pointer">
                        Generate 2026 Report
                    </button>
                </div>

                {/* Faux heat map in background */}
                <div className="absolute bottom-0 left-0 right-0 p-8 grid grid-cols-12 gap-2 opacity-30 pointer-events-none scale-110 origin-bottom">
                    {Array.from({ length: 96 }).map((_, i) => (
                        <div key={i} className={cn("h-[24px] rounded-[4px]", Math.random() > 0.5 ? "bg-emerald-500" : Math.random() > 0.5 ? "bg-emerald-400" : "bg-(--border-subtle)")} />
                    ))}
                </div>
            </motion.div>
        </AnimatePresence>
    )

    const renderGroceryList = () => (
        <AnimatePresence mode="wait">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-6 sm:p-8 shadow-sm">
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="font-display font-bold text-[24px] text-(--text-primary) leading-tight">Master Grocery List</h2>
                        <p className="font-body text-[14px] text-(--text-secondary) mt-1">Generated from your planned weekly meals.</p>
                    </div>
                    <button onClick={sendToInstacart} className="h-[44px] px-6 rounded-[14px] bg-emerald-500 text-white font-body text-[14px] font-bold shadow-[0_4px_14px_rgba(16,185,129,0.3)] hover:-translate-y-[1px] transition-all flex items-center gap-2 cursor-pointer w-max">
                        <ShoppingCart className="w-[18px] h-[18px]" /> Send to Instacart
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groceryList.map((cat, i) => (
                        <div key={i} className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] overflow-hidden shadow-sm group hover:border-(--border-default) transition-colors flex flex-col">
                            <div className="relative h-[120px] shrink-0 overflow-hidden">
                                <img src={cat.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={cat.category} />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-end p-5">
                                    <h3 className="font-display font-black text-[22px] text-white tracking-wide">{cat.category}</h3>
                                </div>
                            </div>
                            <div className="p-4 flex-1 flex flex-col gap-2">
                                {cat.items.map((item) => (
                                    <label key={item.id} className="flex items-center gap-3 p-3 hover:bg-[var(--bg-elevated)] rounded-[12px] cursor-pointer transition-colors border border-transparent hover:border-(--border-default)">
                                        <div className="relative flex items-center justify-center">
                                            <input
                                                type="checkbox"
                                                checked={item.checked}
                                                onChange={() => toggleGroceryItem(i, item.id)}
                                                className="peer appearance-none w-[22px] h-[22px] rounded-[6px] border-2 border-(--border-subtle) checked:border-emerald-500 checked:bg-emerald-500 transition-colors cursor-pointer"
                                            />
                                            <Plus className="w-[14px] h-[14px] text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 peer-checked:rotate-45 transition-all duration-300 transform scale-75 peer-checked:scale-100" />
                                        </div>
                                        <span className={cn("font-body text-[15px] font-semibold transition-all", item.checked ? 'text-(--text-tertiary) line-through decoration-2' : 'text-(--text-primary)')}>
                                            {item.name}
                                        </span>
                                    </label>
                                ))}
                                <button onClick={() => {
                                    const name = window.prompt('Enter grocery item name')
                                    if (!name || !name.trim()) return

                                    setGroceryList((current) => {
                                        const updated = [...current]
                                        updated[i] = {
                                            ...updated[i],
                                            items: [
                                                ...updated[i].items,
                                                { id: Date.now(), name: name.trim(), checked: false },
                                            ],
                                        }
                                        return updated
                                    })
                                    toast.success('Item added to grocery list.')
                                }} className="flex items-center gap-2 text-(--text-secondary) hover:text-(--text-primary) p-3 mt-1 font-body text-[14px] font-bold transition-colors w-full rounded-[12px] hover:bg-[var(--bg-elevated)] cursor-pointer border border-dashed border-transparent hover:border-(--border-default)">
                                    <Plus className="w-[16px] h-[16px]" /> Add Item
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </AnimatePresence>
    )

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto h-full flex flex-col gap-8 pb-20"
        >
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div>
                    <h1 className="font-display font-black text-[36px] text-(--text-primary) leading-tight tracking-tight mb-4">Meal Planner</h1>

                    {/* View Modes */}
                    {activeTab === 'plan' && (
                        <div className="flex bg-(--bg-surface) p-1 rounded-[14px] border border-(--border-subtle) w-max shadow-sm">
                            {(['weekly', 'monthly', 'yearly'] as const).map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    className={cn("px-5 py-2.5 rounded-[10px] font-body text-[14px] font-bold capitalize transition-all", viewMode === mode ? "bg-[var(--bg-elevated)] text-(--accent) shadow-sm" : "text-(--text-secondary) hover:text-(--text-primary) bg-transparent")}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex bg-(--bg-surface) p-1 rounded-[14px] border border-(--border-subtle) w-max shadow-sm">
                    <button
                        onClick={() => setActiveTab('plan')}
                        className={cn("px-6 py-2.5 rounded-[10px] font-body text-[14px] font-bold transition-all flex items-center gap-2", activeTab === 'plan' ? 'bg-(--text-primary) text-(--bg-base) shadow-sm' : 'text-(--text-secondary) hover:text-(--text-primary) bg-transparent')}
                    >
                        <CalendarDays className="w-[16px] h-[16px]" /> Planning
                    </button>
                    <button
                        onClick={() => setActiveTab('list')}
                        className={cn("px-6 py-2.5 rounded-[10px] font-body text-[14px] font-bold transition-all flex items-center gap-2", activeTab === 'list' ? 'bg-(--text-primary) text-(--bg-base) shadow-sm' : 'text-(--text-secondary) hover:text-(--text-primary) bg-transparent')}
                    >
                        <ShoppingCart className="w-[16px] h-[16px]" /> Groceries
                    </button>
                </div>
            </div>

            <div className="w-full">
                {activeTab === 'plan' && viewMode === 'weekly' && renderWeeklyView()}
                {activeTab === 'plan' && viewMode === 'monthly' && renderMonthlyView()}
                {activeTab === 'plan' && viewMode === 'yearly' && renderYearlyView()}
                {activeTab === 'list' && renderGroceryList()}
            </div>

            {/* Meal Search Modal */}
            <AnimatePresence>
                {showMealSearch && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMealSearch(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="w-full max-w-lg bg-(--bg-surface) rounded-[24px] shadow-2xl relative z-10 flex flex-col overflow-hidden max-h-[85vh] border border-(--border-subtle)">
                            <div className="p-6 border-b border-(--border-subtle) flex flex-col gap-4 bg-[var(--bg-elevated)]">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="font-display font-bold text-[20px] text-(--text-primary)">Add to {addingToMeal?.meal}</h2>
                                        <p className="font-body text-[13px] text-(--text-secondary)">{addingToMeal?.day}</p>
                                    </div>
                                    <button onClick={() => setShowMealSearch(false)} className="w-[32px] h-[32px] rounded-full bg-(--bg-surface) border border-(--border-default) flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary) transition-colors"><X className="w-[16px] h-[16px]" /></button>
                                </div>
                                <div className="relative">
                                    <Search className="w-[18px] h-[18px] text-(--text-secondary) absolute left-4 top-1/2 -translate-y-1/2" />
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Search recipes, custom meals, or database..."
                                        value={recipeSearchQuery}
                                        onChange={(event) => setRecipeSearchQuery(event.target.value)}
                                        className="w-full h-[52px] pl-12 pr-4 rounded-[14px] bg-(--bg-surface) border border-(--border-default) focus:outline-none focus:border-(--accent) font-body text-[15px] text-(--text-primary) transition-colors"
                                    />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                                <button onClick={() => {setShowMealSearch(false); setShowRecipeBuilder(true)}} className="w-full h-[52px] rounded-[14px] border border-dashed border-(--accent) text-(--accent) flex items-center justify-center gap-2 font-bold mb-2 hover:bg-(--accent)/10 transition-colors">
                                    <Plus className="w-[18px] h-[18px]"/> Create Custom Recipe
                                </button>
                                <span className="font-body text-[12px] font-bold text-(--text-secondary) uppercase tracking-wider ml-2 mt-2">{recipeSearchQuery.trim().length >= 2 ? 'Search Results' : 'Saved Recipes'}</span>

                                {isRecipeSearchLoading && (
                                    <div className="py-10 flex flex-col items-center text-(--text-secondary)">
                                        <Search className="w-[22px] h-[22px] animate-pulse" />
                                        <span className="mt-2 text-[13px]">Searching online recipes...</span>
                                    </div>
                                )}

                                {!isRecipeSearchLoading && recipeSearchError && (
                                    <div className="text-center py-8 text-[13px] text-red-600">{recipeSearchError}</div>
                                )}

                                {!isRecipeSearchLoading && !recipeSearchError && displayedRecipes.map((recipe) => (
                                    <button
                                        key={recipe.id}
                                        onClick={() => confirmAddMeal(recipe.name, recipe.cals)}
                                        className="flex items-center gap-4 p-3 rounded-[16px] bg-[var(--bg-elevated)] border border-transparent hover:border-(--accent) transition-all text-left group cursor-pointer shadow-sm"
                                    >
                                        <div className="w-[72px] h-[72px] shrink-0 overflow-hidden rounded-[12px] border border-(--border-subtle)">
                                            <img src={recipe.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={recipe.name} />
                                        </div>
                                        <div className="flex-1">
                                            <span className="block font-display font-bold text-[17px] text-(--text-primary) leading-tight mb-1">{recipe.name}</span>
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className="font-body text-[13px] font-bold text-(--text-secondary)">{recipe.cals} kcal</span>
                                                <span className="w-1 h-1 rounded-full bg-(--border-subtle)" />
                                                <span className="font-body text-[13px] text-(--text-tertiary)">{recipe.protein}g P</span>
                                            </div>
                                            <div className="flex gap-1">
                                                {recipe.badges.map(b => (
                                                    <span key={b} className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-(--bg-surface) text-(--text-tertiary) border border-(--border-default)">{b}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="w-[36px] h-[36px] rounded-[10px] bg-(--text-primary) text-(--bg-base) flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 ml-2">
                                            <Plus className="w-[18px] h-[18px]" />
                                        </div>
                                    </button>
                                ))}

                                {!isRecipeSearchLoading && !recipeSearchError && recipeSearchQuery.trim().length >= 2 && displayedRecipes.length === 0 && (
                                    <div className="text-center py-8 text-[13px] text-(--text-secondary)">No recipes found for this search.</div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Custom Recipe Builder Modal */}
            <AnimatePresence>
                {showRecipeBuilder && (
                    <div className="fixed inset-0 z-50 flex justify-end">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowRecipeBuilder(false)} />
                        <motion.div initial={{ opacity: 0, x: '100%' }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="w-full max-w-xl h-full bg-(--bg-surface) shadow-2xl relative z-10 flex flex-col border-l border-(--border-subtle)">
                            <div className="flex items-center justify-between p-6 border-b border-(--border-subtle) shrink-0 bg-[var(--bg-elevated)]">
                                <div>
                                    <h2 className="font-display font-bold text-[20px] text-(--text-primary)">Custom Recipe Builder</h2>
                                </div>
                                <button onClick={() => setShowRecipeBuilder(false)} className="w-[32px] h-[32px] rounded-full bg-(--bg-surface) border border-(--border-default) flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary)"><X className="w-[16px] h-[16px]" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                                <div>
                                    <label className="block text-[13px] font-bold text-(--text-primary) mb-2">Recipe Name</label>
                                    <input type="text" placeholder="e.g. Grandma's Lasagna" className="w-full h-[48px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) text-[14px] outline-none focus:border-(--accent) focus:ring-1 focus:ring-(--accent)" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[13px] font-bold text-(--text-primary) mb-2">Calories</label>
                                        <input type="number" placeholder="kcal" className="w-full h-[48px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) text-[14px] outline-none focus:border-(--accent)" />
                                    </div>
                                    <div>
                                        <label className="block text-[13px] font-bold text-(--text-primary) mb-2">Protein (g)</label>
                                        <input type="number" placeholder="g" className="w-full h-[48px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) text-[14px] outline-none focus:border-(--accent)" />
                                    </div>
                                    <div>
                                        <label className="block text-[13px] font-bold text-(--text-primary) mb-2">Carbs (g)</label>
                                        <input type="number" placeholder="g" className="w-full h-[48px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) text-[14px] outline-none focus:border-(--accent)" />
                                    </div>
                                    <div>
                                        <label className="block text-[13px] font-bold text-(--text-primary) mb-2">Fat (g)</label>
                                        <input type="number" placeholder="g" className="w-full h-[48px] px-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) text-[14px] outline-none focus:border-(--accent)" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[13px] font-bold text-(--text-primary) mb-2">Ingredients List</label>
                                    <textarea placeholder="Line by line ingredients..." className="w-full h-[120px] p-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) text-[14px] outline-none focus:border-(--accent) resize-none" />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-bold text-(--text-primary) mb-2">Instructions</label>
                                    <textarea placeholder="Step by step..." className="w-full h-[120px] p-4 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) text-[14px] outline-none focus:border-(--accent) resize-none" />
                                </div>
                            </div>
                            <div className="p-6 border-t border-(--border-subtle) bg-[var(--bg-elevated)] shrink-0">
                                <button onClick={() => {
                                    const id = toast.loading('Saving custom recipe...')
                                    setTimeout(() => { toast.success('Recipe saved to library!', { id }); setShowRecipeBuilder(false) }, 800)
                                }} className="w-full h-[52px] rounded-[16px] bg-(--accent) text-white font-bold text-[15px] shadow-[0_4px_14px_rgba(16,185,129,0.3)] hover:opacity-90 transition-opacity cursor-pointer">
                                    Save Recipe
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Recipe Detail Modal */}
            <AnimatePresence>
                {viewRecipe && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewRecipe(null)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-2xl bg-(--bg-surface) rounded-[24px] shadow-2xl relative z-10 flex flex-col overflow-hidden max-h-[85vh] border border-(--border-subtle)">
                            <div className="p-6 border-b border-(--border-subtle) flex items-center justify-between shrink-0 bg-[var(--bg-elevated)]">
                                <h2 className="font-display font-bold text-[24px] text-(--text-primary)">{viewRecipe.name}</h2>
                                <button onClick={() => setViewRecipe(null)} className="w-[32px] h-[32px] rounded-full bg-(--bg-surface) border border-(--border-default) flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary)"><X className="w-[16px] h-[16px]" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="bg-[var(--bg-elevated)] border border-(--border-subtle) rounded-[12px] p-3 text-center">
                                        <span className="block text-[11px] text-(--text-secondary) uppercase tracking-wider font-bold mb-1">Cals</span>
                                        <span className="block font-bold text-[18px] text-(--text-primary)">{viewRecipe.cals || 450}</span>
                                    </div>
                                    <div className="bg-[var(--bg-elevated)] border border-(--border-subtle) rounded-[12px] p-3 text-center">
                                        <span className="block text-[11px] text-(--text-secondary) uppercase tracking-wider font-bold mb-1">Protein</span>
                                        <span className="block font-bold text-[18px] text-(--text-primary)">35g</span>
                                    </div>
                                    <div className="bg-[var(--bg-elevated)] border border-(--border-subtle) rounded-[12px] p-3 text-center">
                                        <span className="block text-[11px] text-(--text-secondary) uppercase tracking-wider font-bold mb-1">Carbs</span>
                                        <span className="block font-bold text-[18px] text-(--text-primary)">45g</span>
                                    </div>
                                    <div className="bg-[var(--bg-elevated)] border border-(--border-subtle) rounded-[12px] p-3 text-center">
                                        <span className="block text-[11px] text-(--text-secondary) uppercase tracking-wider font-bold mb-1">Fat</span>
                                        <span className="block font-bold text-[18px] text-(--text-primary)">12g</span>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-bold text-[16px] text-(--text-primary) mb-4 border-b border-(--border-subtle) pb-2 flex items-center gap-2"><ShoppingCart className="w-[16px] h-[16px]" /> Ingredients</h3>
                                    <ul className="flex flex-col gap-2">
                                        {['8 oz Chicken Breast', '1 cup Jasmine Rice', '1/2 cup Broccoli', '1 tbsp Olive Oil'].map((ing, i) => (
                                            <li key={i} className="flex items-center gap-2 text-[14px] text-(--text-secondary)">
                                                <div className="w-1.5 h-1.5 rounded-full bg-(--accent)" /> {ing}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="font-bold text-[16px] text-(--text-primary) mb-4 border-b border-(--border-subtle) pb-2 flex items-center gap-2"><Flame className="w-[16px] h-[16px]" /> Instructions</h3>
                                    <ol className="flex flex-col gap-3 list-decimal list-inside text-[14px] text-(--text-secondary) leading-relaxed">
                                        <li>Preheat grill or pan to medium-high heat.</li>
                                        <li>Season chicken breast with salt, pepper, and desired spices.</li>
                                        <li>Grill chicken for 6-8 minutes per side or until internal temperature reaches 165°F.</li>
                                        <li>Cook jasmine rice according to package directions.</li>
                                        <li>Steam broccoli until tender. Serve together.</li>
                                    </ol>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

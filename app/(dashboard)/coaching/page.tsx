'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CoachCard } from '@/components/coaching/CoachCard'
import { AIAssistantCard } from '@/components/coaching/AIAssistantCard'
import { ClientHub } from '@/components/coaching/ClientHub'
import { Search, Filter, MapPin, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCoachingStore } from '@/store/useCoachingStore'

export default function CoachingPage() {
    const { activeCoachId, coaches } = useCoachingStore()
    const [activeTab, setActiveTab] = useState<'marketplace' | 'hub'>(activeCoachId ? 'hub' : 'marketplace')

    // Filters
    const [searchQuery, setSearchQuery] = useState('')
    const [locationFilter, setLocationFilter] = useState('')
    const [specialtyFilter, setSpecialtyFilter] = useState('')
    const [ratingFilter, setRatingFilter] = useState('')
    const [sortFilter, setSortFilter] = useState('recommended')

    const filteredCoaches = useMemo(() => {
        return coaches.filter(c => {
            const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.bio.toLowerCase().includes(searchQuery.toLowerCase())
            // Add fallback checks since the global store types might lack location, we mock it via tags/name for now or just skip location
            const location = (c as any).location || 'Online Only'
            const matchesLocation = locationFilter ? location === locationFilter : true
            const matchesSpecialty = specialtyFilter ? c.tags.some(tag => tag.toLowerCase().replace(' ', '_').includes(specialtyFilter)) : true
            const matchesRating = ratingFilter ? c.rating >= parseFloat(ratingFilter) : true
            return matchesSearch && matchesLocation && matchesSpecialty && matchesRating
        }).sort((a, b) => {
            if (sortFilter === 'price_low') return (a.pricing?.basic || 0) - (b.pricing?.basic || 0)
            if (sortFilter === 'price_high') return (b.pricing?.basic || 0) - (a.pricing?.basic || 0)
            if (sortFilter === 'rating') return b.rating - a.rating
            return 0
        })
    }, [coaches, searchQuery, locationFilter, specialtyFilter, ratingFilter, sortFilter])

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto h-full pb-20 pt-2"
        >
            {/* Main Content Area (Left 2/3) */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
                    <div>
                        <h1 className="font-display font-bold text-[22px] sm:text-[24px] lg:text-[28px] text-(--text-primary) leading-tight mb-2">
                            {activeTab === 'marketplace' ? 'Coaching Marketplace' : 'Client Hub'}
                        </h1>
                        <p className="font-body text-[14px] text-(--text-secondary)">
                            {activeTab === 'marketplace' ? 'Partner with world-class professionals to accelerate your growth.' : 'Your active programs, form checks, and daily habits.'}
                        </p>
                    </div>

                    <div className="flex border border-(--border-default) rounded-[14px] overflow-hidden bg-[var(--bg-elevated)] p-1 shrink-0 h-max">
                        <button onClick={() => setActiveTab('marketplace')} className={cn("px-6 py-2 rounded-[10px] font-body text-[13px] font-bold transition-all cursor-pointer", activeTab === 'marketplace' ? 'bg-(--text-primary) text-(--bg-base) shadow-sm' : 'text-(--text-secondary) hover:text-(--text-primary)')}>Marketplace</button>
                        <button onClick={() => setActiveTab('hub')} className={cn("px-6 py-2 rounded-[10px] font-body text-[13px] font-bold transition-all cursor-pointer", activeTab === 'hub' ? 'bg-(--text-primary) text-(--bg-base) shadow-sm' : 'text-(--text-secondary) hover:text-(--text-primary)')}>My Hub</button>
                    </div>
                </div>

                {activeTab === 'marketplace' ? (
                    <>
                        {/* Advanced Filter Bar */}
                        <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[20px] p-4 mb-6 shadow-sm flex flex-col sm:flex-row flex-wrap gap-3">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-[14px] top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-(--text-tertiary)" />
                                <input
                                    type="text"
                                    placeholder="Search by name, bio..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full h-[44px] pl-[38px] pr-[16px] rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) text-[14px] font-body text-(--text-primary) placeholder:text-(--text-tertiary) focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all outline-none"
                                />
                            </div>

                            <select
                                value={locationFilter}
                                onChange={e => setLocationFilter(e.target.value)}
                                className="h-[44px] px-[16px] rounded-[12px] border border-(--border-default) bg-[var(--bg-elevated)] text-(--text-primary) font-body text-[14px] outline-none focus:border-emerald-500 min-w-[140px] cursor-pointer"
                            >
                                <option value="">All Locations</option>
                                <option value="New York, NY">New York, NY</option>
                                <option value="London, UK">London, UK</option>
                                <option value="San Francisco, CA">San Francisco, CA</option>
                                <option value="Online Only">Online Only</option>
                            </select>

                            <select
                                value={specialtyFilter}
                                onChange={e => setSpecialtyFilter(e.target.value)}
                                className="h-[44px] px-[16px] rounded-[12px] border border-(--border-default) bg-[var(--bg-elevated)] text-(--text-primary) font-body text-[14px] outline-none focus:border-emerald-500 min-w-[140px] cursor-pointer"
                            >
                                <option value="">All Specialties</option>
                                <option value="weight">Weight Loss</option>
                                <option value="hypertrophy">Muscle Gain</option>
                                <option value="powerlifting">Powerlifting</option>
                                <option value="nutrition">Nutrition</option>
                            </select>

                            <select
                                value={ratingFilter}
                                onChange={e => setRatingFilter(e.target.value)}
                                className="h-[44px] px-[16px] rounded-[12px] border border-(--border-default) bg-[var(--bg-elevated)] text-(--text-primary) font-body text-[14px] outline-none focus:border-emerald-500 min-w-[140px] cursor-pointer"
                            >
                                <option value="">Any Rating</option>
                                <option value="4.9">4.9+ Stars</option>
                                <option value="4.5">4.5+ Stars</option>
                                <option value="4.0">4.0+ Stars</option>
                            </select>

                            <select
                                value={sortFilter}
                                onChange={e => setSortFilter(e.target.value)}
                                className="h-[44px] px-[16px] rounded-[12px] border border-(--border-default) bg-[var(--bg-elevated)] text-(--text-primary) font-body text-[14px] outline-none focus:border-emerald-500 min-w-[140px] cursor-pointer sm:ml-auto"
                            >
                                <option value="recommended">Sort by: Recommended</option>
                                <option value="price_low">Price: Low to High</option>
                                <option value="price_high">Price: High to Low</option>
                                <option value="rating">Highest Rated</option>
                            </select>
                        </div>

                        {/* Coach Grid */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-[16px]">
                            <AnimatePresence>
                                {filteredCoaches.map((coach, i) => (
                                    <motion.div
                                        key={coach.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: i * 0.05, duration: 0.3 }}
                                        className="relative bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                                    >
                                        <div className="absolute top-4 right-4 z-10 bg-[var(--bg-elevated)] px-3 py-1.5 rounded-full border border-(--border-subtle) flex items-center gap-1.5 shadow-sm">
                                            <MapPin className="w-[12px] h-[12px] text-emerald-500" />
                                            <span className="font-body font-bold text-[11px] text-(--text-secondary) uppercase tracking-wider">{(coach as any).location || 'Online'}</span>
                                        </div>
                                        <div className="p-1">
                                            <CoachCard 
                                                id={coach.id}
                                                name={coach.name}
                                                avatar={coach.avatar || ''}
                                                location={(coach as any).location || 'Online'}
                                                specialty={coach.tags}
                                                shortBio={coach.bio}
                                                rating={coach.rating}
                                                reviewCount={coach.reviewCount}
                                                price={coach.pricing?.basic || 50}
                                                isAvailable={true}
                                            />
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {filteredCoaches.length === 0 && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                                    <div className="w-[64px] h-[64px] rounded-full bg-[var(--bg-elevated)] border border-(--border-subtle) flex items-center justify-center mb-4">
                                        <Filter className="w-[24px] h-[24px] text-(--text-tertiary)" />
                                    </div>
                                    <h3 className="font-display font-bold text-[18px] text-(--text-primary) mb-2">No Coaches Found</h3>
                                    <p className="text-(--text-secondary) font-body text-[14px] max-w-[300px]">We couldn&apos;t find anyone matching those precise filters. Try broadening your criteria.</p>
                                    <button onClick={() => { setSearchQuery(''); setLocationFilter(''); setSpecialtyFilter(''); setRatingFilter(''); }} className="mt-6 text-emerald-500 font-bold text-[14px]">Clear Filters</button>
                                </motion.div>
                            )}
                        </div>
                    </>
                ) : (
                    <ClientHub />
                )}
            </div>

            {/* Side Panel (Marketplace only right info) */}
            {activeTab === 'marketplace' && (
                <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-[16px]">
                    <AIAssistantCard />

                    <div className="bg-(--bg-surface) border border-(--border-subtle) rounded-[24px] p-6 shadow-sm text-center flex flex-col items-center">
                        <div className="w-[56px] h-[56px] rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 border border-emerald-500/20">
                            <Star className="w-[24px] h-[24px] text-emerald-500" />
                        </div>
                        <h3 className="font-display font-black text-[16px] text-(--text-primary) leading-tight mb-2">
                            Why hire a coach?
                        </h3>
                        <p className="font-body text-[13px] text-(--text-secondary) leading-relaxed mb-4">
                            Achieve goals faster with bespoke programming, expert form corrections, and daily accountability.
                        </p>
                        <button className="w-full py-2.5 rounded-[12px] bg-[var(--bg-elevated)] border border-(--border-default) font-bold text-[13px] hover:border-emerald-500 transition-colors">Read Success Stories</button>
                    </div>
                </div>
            )}
        </motion.div>
    )
}

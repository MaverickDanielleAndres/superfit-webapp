/**
 * useCommunityStore.ts
 * Manages the community social feed, challenges, and leaderboard state (Twitter Parity).
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CommunityPost, Challenge } from '@/types'

export interface CommunityComment {
    id: string
    authorId: string;
    authorName: string
    authorHandle: string
    authorAvatar: string
    content: string
    likes: number
    isLiked?: boolean
    timestamp: string
}

interface CommunityState {
    posts: CommunityPost[]
    challenges: Challenge[]
    addPost: (post: Omit<CommunityPost, 'id' | 'likes' | 'comments' | 'reposts' | 'views'>) => void
    likePost: (postId: string, userId: string) => void
    repostPost: (postId: string, userId: string, userName: string, userHandle: string) => void
    addComment: (postId: string, comment: Omit<CommunityComment, 'id' | 'likes' | 'isLiked'>) => void
    deletePost: (postId: string) => void
}

// Seed mock posts
const MOCK_POSTS: CommunityPost[] = [
    {
        id: 'post_1',
        userId: 'user_2',
        userName: 'Sarah Jenkins',
        userHandle: '@sarahj_lifts',
        userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&fit=crop',
        isCoach: false,
        isVerified: true,
        type: 'progress',
        content: 'Hit a new PR on squats today! 120kg for 3 reps. The new hypertrophy program is really paying off. 💪🔥',
        mediaUrls: ['https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=400&fit=crop&q=80'],
        likes: 124,
        comments: 12,
        reposts: 5,
        views: 3402,
        postedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'post_2',
        userId: 'user_3',
        userName: 'Mike Chen',
        userHandle: '@mike_runs',
        userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&fit=crop',
        isCoach: false,
        type: 'text',
        content: 'Finished my first half marathon prep week. The SuperFit endurance plan was brutal but exactly what I needed. Looking forward to the long run on Sunday.',
        likes: 45,
        comments: 3,
        reposts: 0,
        views: 890,
        postedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'post_3',
        userId: 'coach_1',
        userName: 'Coach Marcus',
        userHandle: '@marcus_strength',
        userAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&fit=crop',
        isCoach: true,
        isVerified: true,
        type: 'text',
        content: 'What is your biggest struggle when it comes to hitting your daily protein target?',
        poll: {
            question: 'What is your biggest struggle when it comes to hitting your daily protein target?',
            options: [
                { id: 'opt_1', text: 'Too expensive', votes: 120 },
                { id: 'opt_2', text: 'Tired of shakes', votes: 340 },
                { id: 'opt_3', text: 'Hard to track', votes: 85 },
                { id: 'opt_4', text: 'Vegan/Vegetarian limitations', votes: 210 },
            ],
            totalVotes: 755
        },
        likes: 512,
        comments: 89,
        reposts: 42,
        views: 12500,
        postedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    }
]

export const useCommunityStore = create<CommunityState>()(
    persist(
        (set) => ({
            posts: MOCK_POSTS,
            challenges: [],

            addPost: (post) => set(state => ({
                posts: [{
                    ...post,
                    id: `post_${Date.now()}`,
                    likes: 0,
                    comments: 0,
                    reposts: 0,
                    views: 0,
                }, ...state.posts]
            })),

            likePost: (postId, userId) => set(state => ({
                posts: state.posts.map(p => {
                    if (p.id !== postId) return p
                    const wasLiked = p.isLiked;
                    return { ...p, isLiked: !wasLiked, likes: wasLiked ? p.likes - 1 : p.likes + 1 }
                })
            })),

            repostPost: (postId, userId, userName, userHandle) => set(state => {
                const postIndex = state.posts.findIndex(p => p.id === postId);
                if (postIndex === -1) return state;

                const originalPost = state.posts[postIndex];

                // Increase original post repost count
                const updatedPosts = [...state.posts];
                updatedPosts[postIndex] = { ...originalPost, isReposted: true, reposts: originalPost.reposts + 1 };

                // Add new post representing the repost
                const repost: CommunityPost = {
                    ...originalPost,
                    id: `repost_${Date.now()}`,
                    repostedFrom: { userId, userName, userHandle },
                    postedAt: new Date().toISOString()
                }

                return { posts: [repost, ...updatedPosts] };
            }),

            addComment: (postId, comment) => set(state => ({
                posts: state.posts.map(p => {
                    if (p.id !== postId) return p
                    return {
                        ...p,
                        comments: p.comments + 1 // Simply incrementing counter for now for UI purity
                    }
                })
            })),

            deletePost: (postId) => set(state => ({
                posts: state.posts.filter(p => p.id !== postId)
            })),
        }),
        { name: 'superfit-community-storage-v2' }
    )
)

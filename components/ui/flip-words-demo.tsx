import { FlipWords } from '@/components/ui/flip-words'

export function FlipWordsDemo() {
  const words = ['with consistency', 'with smart programming', 'with recovery-first habits', 'with coach guidance']

  return (
    <div className='mx-auto max-w-4xl px-4 py-16 text-center text-3xl font-semibold text-white md:text-5xl'>
      Build your best body
      <FlipWords words={words} className='ml-2 text-lime-400' />
    </div>
  )
}

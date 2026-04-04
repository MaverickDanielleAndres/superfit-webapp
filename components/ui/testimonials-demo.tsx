"use client";

import { motion } from "motion/react";
import { TestimonialsColumn, type TestimonialItem } from "@/components/ui/testimonials-columns-1";

const testimonials: TestimonialItem[] = [
  {
    text: "I've tried five different tracking apps. SuperFit is the first one that actually keeps up with how I train. The workout session flow is flawless.",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
    name: "Marcus T.",
    role: "Athlete · 8 months",
  },
  {
    text: "Managing 30+ clients used to mean juggling five tools. Now it's one portal. The program builder and broadcast feature alone saved me 6 hours a week.",
    image: "https://randomuser.me/api/portraits/women/44.jpg",
    name: "Priya K.",
    role: "Coach · 200+ clients",
  },
  {
    text: "Coaching sync with athlete logs is fast and clear. I can review sessions and adjust training the same day.",
    image: "https://randomuser.me/api/portraits/men/56.jpg",
    name: "Jordan W.",
    role: "Coach · Hybrid",
  },
  {
    text: "SuperFit gives me clean metrics every day. I don't waste time stitching tools together before training.",
    image: "https://randomuser.me/api/portraits/women/18.jpg",
    name: "Ana M.",
    role: "Athlete · 1 year",
  },
  {
    text: "Client programming, communication, and follow-ups are finally in one operational flow.",
    image: "https://randomuser.me/api/portraits/men/48.jpg",
    name: "Rafael G.",
    role: "Coach · Strength",
  },
  {
    text: "Weekly check-ins are easier to manage and my clients stay aligned on training and nutrition.",
    image: "https://randomuser.me/api/portraits/women/67.jpg",
    name: "Tina S.",
    role: "Coach · Women’s Strength",
  },
  {
    text: "The hydration and nutrition logging workflow is fast enough that I actually use it every day.",
    image: "https://randomuser.me/api/portraits/men/12.jpg",
    name: "Ethan L.",
    role: "Athlete · 6 months",
  },
  {
    text: "Broadcast segmentation and forms made client ops far more predictable week to week.",
    image: "https://randomuser.me/api/portraits/women/70.jpg",
    name: "Lina F.",
    role: "Coach · Online",
  },
  {
    text: "Role-based access finally gave us control without slowing down teams.",
    image: "https://randomuser.me/api/portraits/men/73.jpg",
    name: "Owen R.",
    role: "Athlete · 10 months",
  },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

export const Testimonials = () => {
  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        viewport={{ once: true }}
        className="mx-auto flex max-w-[640px] flex-col items-center justify-center text-center"
      >
        <h2 className="font-[var(--font-display)] text-[36px] font-bold tracking-[-0.02em] sm:text-[44px]">
          Trusted by athletes and coaches
        </h2>
      </motion.div>

      <div className="mt-10 flex max-h-[740px] justify-center gap-6 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent)]">
        <TestimonialsColumn testimonials={firstColumn} duration={15} />
        <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
        <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
      </div>
    </div>
  );
};

export default Testimonials;

"use client";

import React from "react";
import { motion } from "motion/react";

export interface TestimonialItem {
  text: string;
  image: string;
  name: string;
  role: string;
}

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: TestimonialItem[];
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map(({ text, image, name, role }, i) => (
                <div
                  className="testimonial-card w-full max-w-xs rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8"
                  key={`${name}-${i}`}
                >
                  <div className="text-sm leading-relaxed text-[var(--text-secondary)]">{text}</div>
                  <div className="mt-5 flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      width={40}
                      height={40}
                      src={image}
                      alt={name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div className="flex flex-col">
                      <div className="font-[var(--font-display)] text-sm font-semibold tracking-tight leading-5 text-[var(--text-primary)]">
                        {name}
                      </div>
                      <div className="font-[var(--font-mono)] text-xs leading-5 tracking-tight text-[var(--text-tertiary)]">
                        {role}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.div>
    </div>
  );
};

'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DatabaseIcon,
  PresentationIcon,
  BarChart3Icon,
  LayersIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const slides = [
  { id: 0, key: 'ambition' },
  { id: 1, key: 'primaryflow' },
] as const;

function SlideAmbition() {
  const pillars = [
    {
      icon: DatabaseIcon,
      title: 'Data Wrangling',
      description:
        'Hours spent collecting and cleaning data from multiple disconnected sources',
    },
    {
      icon: PresentationIcon,
      title: 'Streamlined Creation',
      description:
        'Less formatting, more value. Less box-moving, faster time to market.',
    },
    {
      icon: BarChart3Icon,
      title: 'Unified Platform',
      description:
        'One place where everything comes together—data, artifacts, and orchestration.',
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-4xl font-bold mb-4 text-center"
      >
        Ambition
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-muted-foreground text-lg mb-12 text-center max-w-2xl"
      >
        Documents and data are scattered across tools. Great work shouldn't be
        this hard.
      </motion.p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl">
        {pillars.map((pillar, index) => (
          <motion.div
            key={pillar.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 + index * 0.15 }}
            className="flex flex-col items-center text-center p-6 rounded-xl bg-card border"
          >
            <div className="p-4 rounded-full bg-primary/10 mb-4">
              <pillar.icon className="size-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{pillar.title}</h3>
            <p className="text-muted-foreground">{pillar.description}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.9 }}
        className="mt-12 flex items-center gap-2 text-muted-foreground"
      >
        <LayersIcon className="size-5" />
        <span className="text-lg">Let's simplify the journey.</span>
      </motion.div>
    </div>
  );
}

function SlidePrimaryFlow() {
  const features = [
    'Primary data sources and analysis',
    'Create and schedule integrated document generation',
    'Orchestrate data and functionality across modules to achieve flow state',
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-4xl md:text-5xl font-bold mb-6 text-center text-primary"
      >
        Primary Flow
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-muted-foreground text-lg mb-10 text-center max-w-xl"
      >
        One place to query, assemble, and orchestrate your day-to-day workflows.
      </motion.p>

      <div className="flex flex-col gap-4">
        {features.map((feature, index) => (
          <motion.div
            key={feature}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.4 + index * 0.15 }}
            className="flex items-center gap-3"
          >
            <CheckCircleIcon className="size-5 text-primary flex-shrink-0" />
            <span className="text-lg">{feature}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function DemoPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);

  const goToSlide = (index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setDirection(1);
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? '-100%' : '100%',
      opacity: 0,
    }),
  };

  const renderSlide = () => {
    switch (slides[currentSlide].key) {
      case 'ambition':
        return <SlideAmbition />;
      case 'primaryflow':
        return <SlidePrimaryFlow />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Main content */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="absolute inset-0"
          >
            {renderSlide()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="p-6 flex items-center justify-between border-t bg-background/80 backdrop-blur">
        <Button
          variant="ghost"
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className="gap-2"
        >
          <ArrowLeftIcon className="size-4" />
          Previous
        </Button>

        {/* Dots */}
        <div className="flex gap-2">
          {slides.map((slide) => (
            <button
              key={slide.id}
              onClick={() => goToSlide(slide.id)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                currentSlide === slide.id
                  ? 'bg-primary w-8'
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
            />
          ))}
        </div>

        <Button
          variant="ghost"
          onClick={nextSlide}
          disabled={currentSlide === slides.length - 1}
          className="gap-2"
        >
          Next
          <ArrowRightIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
}

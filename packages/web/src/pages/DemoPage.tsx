'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DatabaseIcon,
  PresentationIcon,
  BarChart3Icon,
  LayersIcon,
  SparklesIcon,
  ZapIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const slides = [
  { id: 0, key: 'why' },
  { id: 1, key: 'introducing' },
  { id: 2, key: 'pop' },
] as const;

function SlideWhy() {
  const painPoints = [
    {
      icon: DatabaseIcon,
      title: 'Data Aggregation',
      description: 'Hours spent collecting data from multiple disconnected sources',
    },
    {
      icon: PresentationIcon,
      title: 'Manual Presentations',
      description: 'Building slides from scratch for every stakeholder meeting',
    },
    {
      icon: BarChart3Icon,
      title: 'Repetitive Analytics',
      description: 'Creating the same charts and metrics over and over',
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
        Why We Built This
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-muted-foreground text-lg mb-12 text-center max-w-2xl"
      >
        Your workflow is fragmented. We're here to fix that.
      </motion.p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl">
        {painPoints.map((point, index) => (
          <motion.div
            key={point.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 + index * 0.15 }}
            className="flex flex-col items-center text-center p-6 rounded-xl bg-card border"
          >
            <div className="p-4 rounded-full bg-destructive/10 mb-4">
              <point.icon className="size-8 text-destructive" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{point.title}</h3>
            <p className="text-muted-foreground">{point.description}</p>
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
        <span className="text-lg">It's time to collapse the complexity.</span>
      </motion.div>
    </div>
  );
}

function SlideIntroducing() {
  const features = [
    'Unified data integration',
    'Automated report generation',
    'Real-time analytics dashboard',
    'One-click presentations',
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, type: 'spring' }}
        className="p-6 rounded-full bg-primary/10 mb-8"
      >
        <SparklesIcon className="size-16 text-primary" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-4xl md:text-5xl font-bold mb-4 text-center"
      >
        Introducing
      </motion.h1>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="text-3xl md:text-4xl font-bold mb-8 text-center text-primary"
      >
        Primary Orchestration Platform
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="text-muted-foreground text-lg mb-10 text-center max-w-xl"
      >
        One platform to orchestrate all your data, insights, and presentations.
      </motion.p>

      <div className="flex flex-col gap-3">
        {features.map((feature, index) => (
          <motion.div
            key={feature}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
            className="flex items-center gap-3"
          >
            <CheckCircleIcon className="size-5 text-primary" />
            <span className="text-lg">{feature}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function SlidePop() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-2xl text-muted-foreground mb-8 text-center"
      >
        <motion.span
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="font-semibold text-foreground"
        >
          P
        </motion.span>
        rimary{' '}
        <motion.span
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="font-semibold text-foreground"
        >
          O
        </motion.span>
        rchestration{' '}
        <motion.span
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.6 }}
          className="font-semibold text-foreground"
        >
          P
        </motion.span>
        latform
      </motion.div>

      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          duration: 0.8,
          delay: 0.8,
          type: 'spring',
          stiffness: 200,
        }}
        className="relative"
      >
        <div className="text-9xl md:text-[12rem] font-black text-primary">
          POP!
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 1.4 }}
          className="absolute -top-4 -right-4"
        >
          <ZapIcon className="size-12 text-yellow-500 fill-yellow-500" />
        </motion.div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.6 }}
        className="text-xl text-muted-foreground mt-8 text-center max-w-lg"
      >
        Simple. Powerful. Ready to transform your workflow.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.8 }}
        className="mt-10"
      >
        <Button size="lg" className="text-lg px-8">
          Get Started
          <ArrowRightIcon className="ml-2 size-5" />
        </Button>
      </motion.div>
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
      case 'why':
        return <SlideWhy />;
      case 'introducing':
        return <SlideIntroducing />;
      case 'pop':
        return <SlidePop />;
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

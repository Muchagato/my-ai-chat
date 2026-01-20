'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  RefreshCwIcon,
  DatabaseIcon,
  CalendarClockIcon,
  BrushIcon,
  SparklesIcon,
  LayoutTemplateIcon,
  PlugIcon,
  MessageSquareIcon,
  FolderIcon,
  PlusCircleIcon,
  ShieldCheckIcon,
  BarChart3Icon,
  UserCheckIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  RocketIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const slides = [
  { id: 0, key: 'content-update' },
  { id: 1, key: 'content-canvas' },
  { id: 2, key: 'data-sources' },
  { id: 3, key: 'eval-pipelines' },
] as const;

function SlideContentUpdate() {
  const features = [
    {
      icon: DatabaseIcon,
      text: 'Direct database connections',
    },
    {
      icon: CalendarClockIcon,
      text: 'Automated cronjob scheduling',
    },
    {
      icon: RefreshCwIcon,
      text: 'Deterministic, predictable updates',
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="p-5 rounded-full bg-blue-500/10 mb-6"
      >
        <RefreshCwIcon className="size-12 text-blue-500" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-4xl md:text-5xl font-bold mb-3 text-center"
      >
        Content Update
      </motion.h1>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-500 text-sm font-medium mb-6"
      >
        Less AI, More Reliability
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="text-muted-foreground text-lg mb-10 text-center max-w-2xl"
      >
        For documents that don't change much, you don't need AI guesswork.
        Content Update provides deterministic, scheduled updates directly from your data sources.
      </motion.p>

      <div className="flex flex-col md:flex-row gap-6">
        {features.map((feature, index) => (
          <motion.div
            key={feature.text}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
            className="flex items-center gap-3 px-5 py-3 rounded-lg bg-card border"
          >
            <feature.icon className="size-5 text-blue-500" />
            <span>{feature.text}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function SlideContentCanvas() {
  const capabilities = [
    'No template uploads required',
    'AI-generated document structure',
    'Standardized styling rules',
    'Fully automated population',
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <motion.div
        initial={{ opacity: 0, rotate: -10 }}
        animate={{ opacity: 1, rotate: 0 }}
        transition={{ duration: 0.6, type: 'spring' }}
        className="p-5 rounded-full bg-purple-500/10 mb-6"
      >
        <BrushIcon className="size-12 text-purple-500" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-4xl md:text-5xl font-bold mb-3 text-center"
      >
        Content Canvas
      </motion.h1>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="px-4 py-1.5 rounded-full bg-purple-500/10 text-purple-500 text-sm font-medium mb-6 flex items-center gap-2"
      >
        <SparklesIcon className="size-4" />
        AI-Powered Creation
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="text-muted-foreground text-lg mb-10 text-center max-w-2xl"
      >
        Forget templates entirely. Content Canvas uses AI to build and populate
        documents completely from scratch using your standardized styling and rules.
      </motion.p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
        {capabilities.map((capability, index) => (
          <motion.div
            key={capability}
            initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-card border"
          >
            <LayoutTemplateIcon className="size-5 text-purple-500 shrink-0" />
            <span>{capability}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function SlideDataSources() {
  const currentSources = [
    { name: 'Bondflow', status: 'live' },
  ];

  const plannedSources = [
    { name: 'BBG Chat', icon: MessageSquareIcon },
    { name: 'SharePoint', icon: FolderIcon },
    { name: 'And more...', icon: PlusCircleIcon },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="p-5 rounded-full bg-green-500/10 mb-6"
      >
        <PlugIcon className="size-12 text-green-500" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-4xl md:text-5xl font-bold mb-3 text-center"
      >
        More Data Sources
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-muted-foreground text-lg mb-10 text-center max-w-2xl"
      >
        We're expanding our integrations to connect with all your essential data sources.
      </motion.p>

      <div className="flex flex-col md:flex-row gap-8 items-center">
        {/* Current */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col items-center"
        >
          <span className="text-sm text-muted-foreground mb-3">Current</span>
          <div className="flex flex-col gap-2">
            {currentSources.map((source) => (
              <div
                key={source.name}
                className="flex items-center gap-3 px-5 py-3 rounded-lg bg-green-500/10 border border-green-500/20"
              >
                <div className="size-2 rounded-full bg-green-500 animate-pulse" />
                <span className="font-medium text-green-500">{source.name}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Arrow */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <ArrowRightIcon className="size-8 text-muted-foreground" />
        </motion.div>

        {/* Planned */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col items-center"
        >
          <span className="text-sm text-muted-foreground mb-3">Coming Soon</span>
          <div className="flex flex-col gap-2">
            {plannedSources.map((source, index) => (
              <motion.div
                key={source.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                className="flex items-center gap-3 px-5 py-3 rounded-lg bg-card border border-dashed"
              >
                <source.icon className="size-5 text-muted-foreground" />
                <span>{source.name}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function SlideEvalPipelines() {
  const benefits = [
    {
      icon: ShieldCheckIcon,
      title: 'Eval Pipelines',
      description: 'Integrated evaluation ensures accuracy across all outputs',
    },
    {
      icon: BarChart3Icon,
      title: 'Transparent Data',
      description: 'Full visibility to cross-check any suspicious values',
    },
    {
      icon: UserCheckIcon,
      title: 'Human in the Loop',
      description: '80% less work, but you stay in control',
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="p-5 rounded-full bg-orange-500/10 mb-6"
      >
        <ShieldCheckIcon className="size-12 text-orange-500" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-4xl md:text-5xl font-bold mb-3 text-center"
      >
        Eval Pipelines & Feedback
      </motion.h1>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="px-4 py-1.5 rounded-full bg-orange-500/10 text-orange-500 text-sm font-medium mb-6"
      >
        Accuracy You Can Trust
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="text-muted-foreground text-lg mb-10 text-center max-w-2xl"
      >
        We want every output to be accurate. Built-in evaluation pipelines and
        full data transparency mean you can trust the results—and verify them when needed.
      </motion.p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
        {benefits.map((benefit, index) => (
          <motion.div
            key={benefit.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 + index * 0.15 }}
            className="flex flex-col items-center text-center p-6 rounded-xl bg-card border"
          >
            <div className="p-3 rounded-full bg-orange-500/10 mb-4">
              <benefit.icon className="size-6 text-orange-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
            <p className="text-sm text-muted-foreground">{benefit.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function FuturePage() {
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
      case 'content-update':
        return <SlideContentUpdate />;
      case 'content-canvas':
        return <SlideContentCanvas />;
      case 'data-sources':
        return <SlideDataSources />;
      case 'eval-pipelines':
        return <SlideEvalPipelines />;
    }
  };

  const slideLabels = [
    'Content Update',
    'Content Canvas',
    'Data Sources',
    'Eval & Feedback',
  ];

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="p-4 border-b flex items-center justify-center gap-2"
      >
        <RocketIcon className="size-5 text-primary" />
        <span className="font-semibold">Roadmap</span>
      </motion.div>

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

        {/* Dots with labels */}
        <div className="flex gap-3">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => goToSlide(slide.id)}
              className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                currentSlide === slide.id
                  ? 'opacity-100'
                  : 'opacity-50 hover:opacity-75'
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  currentSlide === slide.id
                    ? 'bg-primary w-8'
                    : 'bg-muted-foreground/30'
                }`}
              />
              <span className="text-xs hidden md:block">{slideLabels[index]}</span>
            </button>
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

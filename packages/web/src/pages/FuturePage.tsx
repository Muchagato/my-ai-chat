'use client';
import { motion } from 'motion/react';
import {
  RefreshCwIcon,
  Wand2Icon,
  PlugIcon,
  ShieldCheckIcon,
  RocketIcon,
  MessageSquareIcon,
  FolderIcon,
  BarChart3Icon,
  ArrowRightIcon,
  Link2Icon,
} from 'lucide-react';

export function FuturePage() {
  const plannedSources = [
    { name: 'Allocations', icon: BarChart3Icon },
    { name: 'BBG Chat', icon: MessageSquareIcon },
    { name: 'Filesystem', icon: FolderIcon },
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
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-6">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-2xl md:text-3xl font-bold mb-6 text-center"
        >
          What's Coming Next
        </motion.h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl w-full">
          {/* Content Update */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="p-5 rounded-xl bg-card border"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2.5 rounded-full bg-blue-500/10">
                <RefreshCwIcon className="size-5 text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Content Update</h3>
                <span className="text-xs text-blue-500 font-medium">
                  Slides on Rails
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Documents that update themselves. Set it once, stay current
              forever.
            </p>
            <ul className="text-sm text-muted-foreground space-y-1.5">
              <li className="flex items-center gap-2">
                <div className="size-1.5 rounded-full bg-blue-500" />
                Scheduled, automated refreshes
              </li>
              <li className="flex items-center gap-2">
                <div className="size-1.5 rounded-full bg-blue-500" />
                Deterministic updates from your data
              </li>
              <li className="flex items-center gap-2">
                <div className="size-1.5 rounded-full bg-blue-500" />
                No manual intervention required
              </li>
            </ul>
          </motion.div>

          {/* Generative Docs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="p-5 rounded-xl bg-card border"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2.5 rounded-full bg-purple-500/10">
                <Wand2Icon className="size-5 text-purple-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Generative Docs</h3>
                <span className="text-xs text-purple-500 font-medium">
                  AI-Powered Creation
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Let AI draft and structure your documents while you focus on the
              content that matters.
            </p>
            <ul className="text-sm text-muted-foreground space-y-1.5">
              <li className="flex items-center gap-2">
                <div className="size-1.5 rounded-full bg-purple-500" />
                AI-assisted document drafting
              </li>
              <li className="flex items-center gap-2">
                <div className="size-1.5 rounded-full bg-purple-500" />
                Intelligent structure and layout
              </li>
              <li className="flex items-center gap-2">
                <div className="size-1.5 rounded-full bg-purple-500" />
                Consistent styling across outputs
              </li>
            </ul>
          </motion.div>

          {/* Data Sources */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="p-5 rounded-xl bg-card border"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2.5 rounded-full bg-green-500/10">
                <PlugIcon className="size-5 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">More Data Sources</h3>
                <span className="text-xs text-green-500 font-medium">
                  Expanding Integrations
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Connecting with all your essential data sources.
            </p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="size-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium text-green-500">
                  Bondflow
                </span>
              </div>
              <ArrowRightIcon className="size-4 text-muted-foreground" />
              <div className="flex gap-2">
                {plannedSources.map((source) => (
                  <div
                    key={source.name}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/50 border border-dashed"
                  >
                    <source.icon className="size-3.5 text-muted-foreground" />
                    <span className="text-xs">{source.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Eval Pipelines */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="p-5 rounded-xl bg-card border"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2.5 rounded-full bg-orange-500/10">
                <ShieldCheckIcon className="size-5 text-orange-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Eval Pipelines</h3>
                <span className="text-xs text-orange-500 font-medium">
                  Accuracy You Can Trust
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Every output should be accurate and verifiable.
            </p>
            <ul className="text-sm text-muted-foreground space-y-1.5">
              <li className="flex items-center gap-2">
                <div className="size-1.5 rounded-full bg-orange-500" />
                Integrated evaluation pipelines
              </li>
              <li className="flex items-center gap-2">
                <div className="size-1.5 rounded-full bg-orange-500" />
                Full data transparency
              </li>
              <li className="flex items-center gap-2">
                <div className="size-1.5 rounded-full bg-orange-500" />
                Human in the loop—you stay in control
              </li>
            </ul>
          </motion.div>

          {/* Interoperability */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="p-5 rounded-xl bg-card border md:col-span-2"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2.5 rounded-full bg-cyan-500/10">
                <Link2Icon className="size-5 text-cyan-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Interoperability</h3>
                <span className="text-xs text-cyan-500 font-medium">
                  MCP First
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              All our tools are built MCP-first. Use Primary Flow as your hub,
              or connect via MCP from your preferred interface—you choose the
              entry point. We're actively working with llm@cib to integrate the
              Bondflow MCP server.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

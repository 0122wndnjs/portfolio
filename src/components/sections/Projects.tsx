import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { categories, projects } from "../../data/projects";
import ProjectModal from "../common/ProjectModal";

gsap.registerPlugin(ScrollTrigger);

/* =========================
   Folder Icon Component
========================= */
function FolderIcon({
  category,
  onClick,
}: {
  category: any;
  onClick: () => void;
}) {
  const folderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!folderRef.current) return;

    gsap.fromTo(
      folderRef.current,
      { opacity: 0, y: 30, scale: 0.9 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: "power3.out",
        scrollTrigger: {
          trigger: folderRef.current,
          start: "top 85%",
        },
      }
    );
  }, []);

  return (
    <motion.div
      ref={folderRef}
      onClick={onClick}
      className="group cursor-pointer flex flex-col items-center"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Folder */}
      <div className="relative w-32 h-32 mb-3">
        {/* Folder tab */}
        <div
          className={`absolute top-0 left-0 w-16 h-6 rounded-t-lg bg-gradient-to-br ${category.color} opacity-80`}
        />

        {/* Folder body */}
        <div
          className={`absolute top-4 left-0 w-full h-full rounded-2xl bg-gradient-to-br ${category.color} opacity-70 group-hover:opacity-90 transition-opacity`}
        />

        {/* Folder front */}
        <div
          className={`absolute top-6 left-0 w-full h-[90%] rounded-2xl bg-gradient-to-br ${category.color} border-2 border-white/20 shadow-2xl group-hover:shadow-3xl transition-all`}
        >
          {/* Icon */}
          <div className="absolute inset-0 flex items-center justify-center text-5xl text-white/90">
            {category.icon}
          </div>

          {/* Count badge */}
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white text-black text-xs font-bold flex items-center justify-center shadow-lg">
            {category.count}
          </div>
        </div>

        {/* Glow effect */}
        <div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-30 blur-xl transition-opacity`}
        />
      </div>

      {/* Label */}
      <div className="text-center px-2">
        <p className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors">
          {category.name}
        </p>
      </div>
    </motion.div>
  );
}

/* =========================
   Finder Window Component
========================= */
function FinderWindow({
  category,
  onClose,
  onProjectClick,
}: {
  category: any;
  onClose: () => void;
  onProjectClick: (project: any) => void;
}) {
  const filteredProjects = projects.filter((p) => p.category === category.id);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-5xl max-h-[85vh] rounded-xl overflow-hidden bg-gradient-to-br from-gray-900/95 to-black/95 border border-white/20 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* macOS title bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-800/50 border-b border-white/10">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
            />
            <button className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors" />
            <button className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors" />
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`text-2xl bg-gradient-to-br ${category.color} bg-clip-text text-transparent`}
            >
              {category.icon}
            </div>
            <p className="text-sm font-medium text-white">{category.name}</p>
          </div>

          <div className="w-20" />
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 bg-gray-800/30 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="text-white/60 hover:text-white transition-colors">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button className="text-white/60 hover:text-white transition-colors">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          <div className="text-xs text-white/50">
            {filteredProjects.length} items
          </div>
        </div>

        {/* Content area */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)] custom-scrollbar">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onProjectClick(project)}
                className="group cursor-pointer flex flex-col items-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* File icon */}
                <div className="relative w-24 h-28 mb-3">
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/10 to-white/5 border border-white/20 group-hover:border-blue-400/50 transition-all shadow-lg">
                    {/* Document lines */}
                    <div className="absolute top-4 left-3 right-3 space-y-1.5">
                      <div className="h-1 bg-white/20 rounded" />
                      <div className="h-1 bg-white/20 rounded w-3/4" />
                      <div className="h-1 bg-white/20 rounded w-1/2" />
                    </div>

                    {/* Status badge */}
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 text-center border border-blue-400/30">
                        {project.status}
                      </div>
                    </div>
                  </div>

                  {/* Glow */}
                  <div className="absolute inset-0 rounded-lg bg-blue-500/0 group-hover:bg-blue-500/20 blur-xl transition-all" />
                </div>

                {/* Label */}
                <div className="text-center px-2 max-w-full">
                  <p className="text-xs text-white/90 group-hover:text-blue-300 transition-colors truncate">
                    {project.title}
                  </p>
                  <p className="text-[10px] text-white/40 mt-0.5">
                    {project.year}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* =========================
   Main Section
========================= */
export default function Projects() {
  const [openCategory, setOpenCategory] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!titleRef.current) return;

    gsap.fromTo(
      titleRef.current,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: titleRef.current,
          start: "top 80%",
        },
      }
    );
  }, []);

  return (
    <section
      id="projects"
      ref={sectionRef}
      className="relative w-full bg-black py-32 text-white overflow-hidden"
    >
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* Title */}
        <div ref={titleRef} className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            Selected Projects
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Browse through project categories and explore my work
          </p>
        </div>

        {/* Folder Grid */}
        <div className="grid grid-cols-2  lg:grid-cols-4 gap-8 lg:gap-12 max-w-5xl mx-auto">
          {categories.map((category) => (
            <FolderIcon
              key={category.id}
              category={category}
              onClick={() => setOpenCategory(category)}
            />
          ))}
        </div>
      </div>

      {/* Finder Window */}
      <AnimatePresence>
        {openCategory && (
          <FinderWindow
            category={openCategory}
            onClose={() => setOpenCategory(null)}
            onProjectClick={(project) => {
              setSelectedProject(project);
              setOpenCategory(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Project Detail Modal */}
      <AnimatePresence>
        {selectedProject && (
          <ProjectModal
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
          />
        )}
      </AnimatePresence>

      {/* Custom scrollbar styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.7);
        }
        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </section>
  );
}

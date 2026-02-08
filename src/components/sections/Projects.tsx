import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { categories, projects } from "../../data/projects";
import ProjectModal from "../common/ProjectModal";

gsap.registerPlugin(ScrollTrigger);

/* =========================
   Types
========================= */
type Category = {
  id: string;
  name: string;
  color: string;
  icon: any;
};

type Project = {
  id: number;
  title: string;
  category: string;
  desc: string;
  tech: string[];
  year: string;
  status: string;
  link?: string | null;
  images?: string[];
  details?: string[];
};

/* =========================
   Folder Icon Component
========================= */
function FolderIcon({
  category,
  count,
  onClick,
}: {
  category: Category;
  count: number;
  onClick: () => void;
}) {
  const folderRef = useRef<HTMLDivElement>(null);
  const Icon = category.icon;

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
          className={`absolute top-6 left-0 w-full h-[90%] rounded-2xl bg-gradient-to-br ${category.color} border-2 border-white/20 shadow-2xl transition-all`}
        >
          {/* Icon */}
          <div className="absolute inset-0 flex items-center justify-center text-white/90">
            <Icon size={44} />
          </div>

          {/* macOS style badge */}
          <div className="absolute -top-3 -right-3 min-w-[40px] h-10 px-3 rounded-full bg-red-500 text-white text-sm font-semibold flex items-center justify-center shadow-xl">
            {count}
          </div>
        </div>

        {/* Glow */}
        <div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-30 blur-xl transition-opacity`}
        />
      </div>

      <div className="text-center px-2">
        <p className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors">
          {category.name}
        </p>
      </div>
    </motion.div>
  );
}

/* =========================
   Finder Window
========================= */
function FinderWindow({
  category,
  onClose,
  onProjectClick,
}: {
  category: Category;
  onClose: () => void;
  onProjectClick: (project: Project) => void;
}) {
  const filteredProjects = projects.filter((p) => p.category === category.id);
  const Icon = category.icon;

  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(8);

  // 반응형 페이지 수
  useEffect(() => {
    const updateLayout = () => {
      if (window.innerWidth < 640) {
        setPerPage(4); // 모바일 2x2
      } else {
        setPerPage(8); // PC 4x2
      }
    };

    updateLayout();
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  }, []);

  const totalPages = Math.ceil(filteredProjects.length / perPage);

  const pagedProjects = filteredProjects.slice(
    page * perPage,
    page * perPage + perPage
  );

  const goPrev = () => setPage((p) => Math.max(p - 1, 0));
  const goNext = () => setPage((p) => Math.min(p + 1, totalPages - 1));

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
        {/* Title bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-800/50 border-b border-white/10">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-3 h-3 rounded-full bg-red-500"
            />
            <button className="w-3 h-3 rounded-full bg-yellow-500" />
            <button className="w-3 h-3 rounded-full bg-green-500" />
          </div>

          <div className="flex items-center gap-3">
            <Icon className="text-white" size={20} />
            <p className="text-sm font-medium text-white">{category.name}</p>
          </div>

          {/* page navigation */}
          {totalPages > 1 ? (
            <div className="flex items-center gap-2">
              <button
                onClick={goPrev}
                disabled={page === 0}
                className="px-2 py-1 text-xs rounded bg-white/10 text-white/80 disabled:opacity-30"
              >
                ←
              </button>
              <button
                onClick={goNext}
                disabled={page === totalPages - 1}
                className="px-2 py-1 text-xs rounded bg-white/10 text-white/80 disabled:opacity-30"
              >
                →
              </button>
            </div>
          ) : (
            <div className="w-12" />
          )}
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 bg-gray-800/30 border-b border-white/10 flex items-center justify-between">
          <div className="text-xs text-white/50">
            {filteredProjects.length} items
          </div>
          <div className="text-xs text-white/40">
            Page {page + 1} / {Math.max(totalPages, 1)}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-110px)]">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {pagedProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onProjectClick(project)}
                className="group cursor-pointer flex flex-col items-center"
                whileHover={{ scale: 1.05 }}
              >
                <div className="relative w-24 h-28 mb-3">
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/10 to-white/5 border border-white/20 shadow-lg">
                    <div className="absolute top-4 left-3 right-3 space-y-1.5">
                      <div className="h-1 bg-white/20 rounded" />
                      <div className="h-1 bg-white/20 rounded w-3/4" />
                      <div className="h-1 bg-white/20 rounded w-1/2" />
                    </div>

                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 text-center border border-blue-400/30">
                        {project.status}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center px-2 max-w-full">
                  <p className="text-xs text-white/90 truncate">
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
  const [openCategory, setOpenCategory] = useState<Category | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

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

  /* =========================
     Auto count calculation
  ========================= */
  const categoryCounts = categories.reduce((acc: any, cat: Category) => {
    acc[cat.id] = projects.filter((p) => p.category === cat.id).length;
    return acc;
  }, {});

  return (
    <section
      id="projects"
      className="relative w-full bg-black py-32 text-white overflow-hidden"
    >
      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* Title */}
        <div ref={titleRef} className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4">My Works</h2>
          <p className="text-white/60">Browse through project categories</p>
        </div>

        {/* Folder Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 max-w-5xl mx-auto">
          {categories.map((category: Category) => (
            <FolderIcon
              key={category.id}
              category={category}
              count={categoryCounts[category.id] || 0}
              onClick={() => setOpenCategory(category)}
            />
          ))}
        </div>
      </div>

      {/* Finder */}
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

      {/* Modal */}
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

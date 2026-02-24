import { useState, useEffect } from "react";
import { motion, AnimatePresence, useSpring, useTransform, useMotionValue } from "framer-motion";

import { categories, projects } from "../../data/projects";
import ProjectModal from "../common/ProjectModal";

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
   Animated Folder Icon Component
========================= */
function FolderIcon({
  category,
  count,
  index,
  onClick,
}: {
  category: Category;
  count: number;
  index: number;
  onClick: () => void;
}) {
  const Icon = category.icon;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group cursor-pointer flex flex-col items-center"
    >
      <motion.div 
        whileHover={{ scale: 1.05, y: -5 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        className="relative w-32 h-32 sm:w-40 sm:h-40 mb-4 flex-shrink-0"
      >
        {/* Dynamic Shadow / Glow */}
        <div 
          className="absolute inset-x-4 -bottom-4 h-1/2 bg-black opacity-30 blur-2xl group-hover:opacity-50 transition-opacity"
        />
        
        {/* Folder Back Tab */}
        <div
          className={`absolute top-0 left-0 w-16 sm:w-20 h-8 sm:h-10 rounded-t-xl bg-gradient-to-br ${category.color} opacity-70`}
        />
        <div
          className={`absolute top-0 left-0 w-16 sm:w-20 h-8 sm:h-10 rounded-t-xl bg-gradient-to-br ${category.color} opacity-90 backdrop-blur-sm`}
        />

        {/* Folder Body (Back) */}
        <div
          className={`absolute top-6 sm:top-8 left-0 w-full h-[calc(100%-24px)] sm:h-[calc(100%-32px)] rounded-2xl sm:rounded-3xl bg-gradient-to-br ${category.color} opacity-60 backdrop-blur-md`}
        />

        {/* Paper Inside (Simulated files) */}
        <motion.div 
          animate={{ y: isHovered ? -15 : 0, rotate: isHovered ? -2 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="absolute top-4 left-4 right-4 h-3/4 bg-white/10 rounded-xl border border-white/20"
        />
        <motion.div 
          animate={{ y: isHovered ? -8 : 0, rotate: isHovered ? 2 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.05 }}
          className="absolute top-5 left-3 right-5 h-3/4 bg-white/5 rounded-xl border border-white/10"
        />

        {/* Folder Front Cover */}
        <motion.div
           animate={{ rotateX: isHovered ? -15 : 0 }}
           style={{ transformOrigin: "bottom" }}
           transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className={`absolute top-8 sm:top-10 left-0 w-full h-[calc(100%-32px)] sm:h-[calc(100%-40px)] rounded-2xl sm:rounded-3xl bg-gradient-to-br ${category.color} border-t border-l border-white/30 shadow-[0_-5px_15px_rgba(0,0,0,0.2)] flex items-center justify-center overflow-hidden z-10`}
        >
          {/* Internal gradient shine */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-50" />
          
          {/* Main Icon */}
          <motion.div 
            animate={{ scale: isHovered ? 1.1 : 1 }}
            className="text-white drop-shadow-md z-10"
          >
            <Icon size={48} className="sm:w-14 sm:h-14" />
          </motion.div>
        </motion.div>

        {/* Notification Badge */}
        {count > 0 && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, delay: 0.3 }}
            className="absolute -top-2 -right-2 sm:-top-1 sm:-right-1 min-w-[32px] sm:min-w-[40px] h-8 sm:h-10 px-2 sm:px-3 rounded-full bg-red-500 border-2 border-slate-900 text-white text-xs sm:text-sm font-bold flex items-center justify-center shadow-lg z-20"
          >
            {count}
          </motion.div>
        )}
      </motion.div>

      {/* Label Text */}
      <div className="text-center px-4">
        <p className="text-sm sm:text-base font-semibold text-white/90 group-hover:text-blue-300 transition-colors drop-shadow-md">
          {category.name}
        </p>
      </div>
    </motion.div>
  );
}

/* =========================
   Finder Window (macOS style)
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

  // Responsive Layout Setup
  useEffect(() => {
    const updateLayout = () => {
      if (window.innerWidth < 640) setPerPage(4);
      else if (window.innerWidth < 1024) setPerPage(6);
      else setPerPage(8);
    };
    updateLayout();
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  }, []);

  const totalPages = Math.ceil(filteredProjects.length / perPage);
  const pagedProjects = filteredProjects.slice(page * perPage, page * perPage + perPage);

  const goPrev = () => setPage((p) => Math.max(p - 1, 0));
  const goNext = () => setPage((p) => Math.min(p + 1, totalPages - 1));

  // 3D Parallax logic for window
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 100, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 100, damping: 20 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["3deg", "-3deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-3deg", "3deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };

  return (
    <motion.div
      initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
      animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
      exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6 bg-black/40"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { x.set(0); y.set(0); }}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative w-full max-w-5xl rounded-2xl overflow-hidden bg-slate-900/80 backdrop-blur-2xl border border-white/20 shadow-[0_30px_100px_rgba(0,0,0,0.8)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Inner Glare / Ambient light */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50 pointer-events-none z-0" />

        {/* macOS Title bar */}
        <div className="relative z-10 flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10 handle cursor-default">
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="w-3.5 h-3.5 rounded-full bg-[#FF5F56] border border-black/10 hover:brightness-75 transition-all shadow-inner flex items-center justify-center group">
              <span className="opacity-0 group-hover:opacity-100 text-black/50 text-[10px] pb-0.5 leading-none">x</span>
            </button>
            <button disabled className="w-3.5 h-3.5 rounded-full bg-[#FFBD2E] border border-black/10 shadow-inner" />
            <button disabled className="w-3.5 h-3.5 rounded-full bg-[#27C93F] border border-black/10 shadow-inner" />
          </div>

          <div className="flex items-center gap-2.5 absolute left-1/2 -translate-x-1/2 px-4">
            <Icon className="text-white/80" size={16} />
            <p className="text-sm font-semibold text-white/90 tracking-wide">{category.name}</p>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 ? (
            <div className="flex items-center gap-1.5 bg-black/20 rounded-md p-1 border border-white/5">
              <button onClick={goPrev} disabled={page === 0} className="w-7 h-6 flex items-center justify-center rounded bg-white/10 hover:bg-white/20 text-white/90 disabled:opacity-30 disabled:hover:bg-white/10 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button onClick={goNext} disabled={page === totalPages - 1} className="w-7 h-6 flex items-center justify-center rounded bg-white/10 hover:bg-white/20 text-white/90 disabled:opacity-30 disabled:hover:bg-white/10 transition-colors">
                 <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          ) : (
            <div className="w-16" />
          )}
        </div>

        {/* Toolbar Info */}
        <div className="relative z-10 px-6 py-2 bg-black/20 border-b border-white/5 flex items-center justify-between text-[11px] text-white/50 font-medium tracking-wide font-mono">
          <div>{filteredProjects.length} items found</div>
          <div>Page {page + 1} of {Math.max(totalPages, 1)}</div>
        </div>

        {/* Project Grid Content */}
        <div className="relative z-10 p-6 sm:p-8 min-h-[40vh] max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:hidden">
          {pagedProjects.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-white/40 mt-10">
               <Icon size={48} className="opacity-20 mb-4" />
               <p>No projects in this folder yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
              {pagedProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 20 }}
                  onClick={() => onProjectClick(project)}
                  className="group cursor-pointer flex flex-col items-center"
                >
                  <motion.div 
                    whileHover={{ scale: 1.08, y: -5 }} 
                    whileTap={{ scale: 0.95 }}
                    className="relative w-full aspect-[4/5] sm:aspect-square mb-4 rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-white/10 to-white/5 border border-white/20 shadow-lg flex items-center justify-center"
                  >
                     {/* App Icon Representation */}
                     <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-20 group-hover:opacity-40 transition-opacity`} />
                     
                     {/* Thumbnail or Icon */}
                     {project.images && project.images.length > 0 ? (
                       <img src={project.images[0]} alt={project.title} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                     ) : (
                       <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 border border-white/10 shadow-inner flex items-center justify-center z-10 backdrop-blur-sm">
                          <span className="text-3xl sm:text-4xl text-white font-black opacity-80">
                            {project.title.charAt(0)}
                          </span>
                       </div>
                     )}

                     {/* Status Badge */}
                     <div className="absolute bottom-2 left-2 right-2 flex justify-center z-20">
                        <span className="text-[9px] sm:text-[10px] px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 shadow-lg font-medium whitespace-nowrap">
                          {project.status}
                        </span>
                     </div>
                  </motion.div>

                  <div className="text-center w-full px-2">
                    <p className="text-sm font-medium text-white/90 group-hover:text-white truncate drop-shadow-sm transition-colors">
                      {project.title}
                    </p>
                    <p className="text-[11px] text-white/40 mt-1 font-mono">
                      {project.year}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
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

  // Auto count calculation
  const categoryCounts = categories.reduce((acc: any, cat: Category) => {
    acc[cat.id] = projects.filter((p) => p.category === cat.id).length;
    return acc;
  }, {});

  return (
    <section id="projects" className="relative w-full bg-black py-32 text-white overflow-hidden selection:bg-purple-500/30">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-900/20 to-black z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-blue-600/10 rounded-[100%] blur-[120px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-6xl px-6 lg:px-8">
        
        {/* Title Area */}
        <div className="text-center mb-24 cursor-default">
           <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-xs font-bold text-teal-300 tracking-[0.2em] uppercase">Showcase</span>
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight mb-6"
          >
            Selected <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">Works</span>
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 font-light max-w-2xl mx-auto"
          >
            Explore my portfolio of applications, smart contracts, and full-stack solutions organized by domain.
          </motion.p>
        </div>

        {/* Folder Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 lg:gap-16 max-w-5xl mx-auto">
          {categories.map((category: Category, index: number) => (
             <FolderIcon
               key={category.id}
               category={category}
               count={categoryCounts[category.id] || 0}
               index={index}
               onClick={() => setOpenCategory(category)}
             />
          ))}
        </div>
      </div>

      {/* Finder Modal */}
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

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedProject && (
          <ProjectModal
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

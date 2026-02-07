import { motion } from "framer-motion";

export default function ProjectCard({ project, onClick }: any) {
  return (
    <motion.div
      layoutId={`project-${project.id}`}
      onClick={onClick}
      className="group relative cursor-pointer rounded-2xl overflow-hidden"
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 border border-white/10" />

      <div className="relative z-10 p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
            {project.status}
          </span>
          <span className="text-xs text-white/40">
            {project.year}
          </span>
        </div>

        <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-blue-300 transition-colors">
          {project.title}
        </h3>

        <p className="text-sm text-white/60 mb-4 line-clamp-2">
          {project.desc}
        </p>

        <div className="flex flex-wrap gap-2">
          {project.tech.slice(0, 3).map((tech: string, i: number) => (
            <span
              key={i}
              className="text-xs px-2 py-1 rounded-md bg-white/5 text-white/70 border border-white/10"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

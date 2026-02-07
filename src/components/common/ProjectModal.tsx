import { motion } from "framer-motion";
import { categories } from "../../data/projects";

type ProjectModalProps = {
  project: any;
  onClose: () => void;
};

export default function ProjectModal({ project, onClose }: ProjectModalProps) {
  const hasLink = Boolean(project.link);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      onClick={onClose}
    >
      <motion.div
        layoutId={`project-${project.id}`}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="relative w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-black border border-white/20 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* macOS-style title bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
            />
            <button className="w-3 h-3 rounded-full bg-yellow-500" />
            <button className="w-3 h-3 rounded-full bg-green-500" />
          </div>

          <div className="flex-1 text-center">
            <p className="text-sm text-white/60">Project Details</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(85vh-60px)] custom-scrollbar">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm border border-blue-500/30">
                {project.status}
              </span>
              <span className="text-white/50 text-sm">{project.year}</span>
            </div>

            <h2 className="text-4xl font-bold text-white mb-4">
              {project.title}
            </h2>

            <p className="text-lg text-white/70 leading-relaxed">
              {project.longDesc}
            </p>
          </div>

          {/* Screenshot Section */}
          {project.images && project.images.length > 0 && (
            <div className="mb-10">
              <h3 className="text-xl font-semibold text-white mb-4">
                Screenshots
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                {project.images.map((img: string, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="overflow-hidden rounded-xl border border-white/10 bg-white/5"
                  >
                    <img
                      src={img}
                      alt={`${project.title} screenshot ${i + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Tech Stack */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white mb-4">
              Technology Stack
            </h3>
            <div className="flex flex-wrap gap-3">
              {project.tech.map((tech: string, i: number) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 text-white text-sm font-medium"
                >
                  {tech}
                </motion.span>
              ))}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-6">
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <p className="text-sm text-white/50 mb-2">Category</p>
              <p className="text-white font-medium">
                {categories.find((c) => c.id === project.category)?.name}
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <p className="text-sm text-white/50 mb-2">Year</p>
              <p className="text-white font-medium">{project.year}</p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-8 pt-8 border-t border-white/10">
            {hasLink ? (
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center py-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold hover:opacity-90 transition-opacity"
              >
                Visit Project →
              </a>
            ) : (
              <div className="w-full py-4 rounded-xl bg-gray-700/40 text-gray-400 text-center font-semibold border border-gray-600">
                Private Project / NDA
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

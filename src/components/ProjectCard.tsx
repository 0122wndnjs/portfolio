import React, { useState } from "react";
import { motion } from "framer-motion";
import type { Project } from "../data/projects";

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <motion.div
  className="relative w-full max-w-sm h-96 cursor-pointer perspective rounded-xl shadow-lg overflow-hidden bg-white dark:bg-dark-navy border border-transparent"
          onClick={() => setFlipped(!flipped)}
      layout
      whileHover={{ borderColor: "#6366f1" }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <motion.div
        className={`absolute w-full h-full rounded-xl shadow-lg overflow-hidden bg-white dark:bg-dark-navy`}
        style={{
          backfaceVisibility: "hidden",
          transformStyle: "preserve-3d",
          rotateY: flipped ? 180 : 0,
        }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* 앞면 */}
        <img
          src={project.image}
          alt={project.title}
          className="object-cover w-full h-40"
          draggable={false}
        />
        <div className="p-4">
          <h3 className="text-xl font-bold mb-2">{project.title}</h3>
          <p className="text-sm mb-2">{project.description}</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {project.techStack.map((tech) => (
              <span
                key={tech}
                className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded"
              >
                {tech}
              </span>
            ))}
          </div>
          {project.demo && (
            <a
              href={project.demo}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline text-sm"
              onClick={(e) => e.stopPropagation()}
            >
              Demo &rarr;
            </a>
          )}
        </div>
      </motion.div>

      <motion.div
        className={`absolute w-full h-full rounded-xl shadow-lg overflow-auto p-4 bg-white dark:bg-dark-navy`}
        style={{
          backfaceVisibility: "hidden",
          transformStyle: "preserve-3d",
          rotateY: flipped ? 0 : -180,
        }}
        animate={{ rotateY: flipped ? 0 : -180 }}
        transition={{ duration: 0.6 }}
      >
        {/* 뒷면 */}
        <h3 className="text-xl font-bold mb-4">{project.title} 상세</h3>
        <p className="mb-4 font-semibold">{project.role}</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          {project.details?.map((detail, i) => (
            <li key={i}>{detail}</li>
          ))}
        </ul>
      </motion.div>
    </motion.div>
  );
}

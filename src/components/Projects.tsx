import React, { useState } from "react";
import ProjectCard from "./ProjectCard";
import { projects } from "../data/projects";
import type { ProjectType } from "../data/projects";

const filterOptions: ("All" | ProjectType)[] = [
  "All",
  "Frontend",
  "Backend",
  "Fullstack",
  "SmartContract",
];

export default function Projects() {
  const [filter, setFilter] = useState<"All" | ProjectType>("All");

  const filteredProjects =
    filter === "All"
      ? projects
      : projects.filter((p) => p.type === filter);

  return (
    <section
      id="projects"
      className="py-20 px-6 bg-gray-50 dark:bg-dark-navy text-black dark:text-white"
    >
      <div className="max-w-7xl mx-auto">
      <h2 className="text-6xl font-bold mb-16 text-center font-vitroCore">PROJECTS</h2>

        {/* 필터 버튼 */}
        <div className="flex justify-center mb-10 flex-wrap gap-3">
          {filterOptions.map((option) => (
            <button
              key={option}
              className={`px-4 py-2 rounded-full font-semibold transition
                ${
                  filter === option
                    ? "bg-indigo-600 text-white"
                    : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                }`}
              onClick={() => setFilter(option)}
            >
              {option === "SmartContract" ? "스마트 컨트랙트" : option}
            </button>
          ))}
        </div>

        {/* 프로젝트 카드 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 justify-center">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.title} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}


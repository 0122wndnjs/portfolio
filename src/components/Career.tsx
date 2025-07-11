import { career, type Career } from "../data/career";
import { FaRegCalendarAlt } from "react-icons/fa";

export default function Career() {
  return (
    <section
      id="experience"
      className="py-20 px-6 bg-white dark:bg-gray-900 text-black dark:text-white"
    >
      <h2 className="text-6xl font-bold mb-16 text-center font-vitroCore">
        CAREER
      </h2>

      <div className="max-w-5xl mx-auto space-y-20">
        {career.map((exp, idx) => (
          <div
            key={idx}
            className="
              flex flex-col items-center md:flex-row md:items-start md:space-x-16
              text-center md:text-left
            "
          >
            <div
              className="
                w-48 h-48 rounded-full overflow-hidden border-4 border-indigo-500 
                bg-white dark:bg-gray-800 shadow-lg flex-shrink-0
                mb-6 md:mb-0
                mx-auto
              "
            >
              <img
                src={exp.logo}
                alt={`${exp.company} 로고`}
                className="w-full h-full object-contain"
                draggable={false}
              />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-1">{exp.company}</h3>
              <p className="text-indigo-600 dark:text-indigo-400 font-semibold mb-1">
                {exp.period}
              </p>
              <p className="italic mb-2">“{exp.mission}”</p>
              <p className="mb-3 font-medium">{exp.role}</p>

              <ul className="space-y-4 text-sm max-w-xl mx-auto md:mx-0">
                {exp.projects.map((p, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <FaRegCalendarAlt />
                      <span>{p.date}</span>
                      {p.name && (
                        <span className="text-gray-800 dark:text-gray-200 font-bold font-vitroCore ml-2">
                          {p.name}
                        </span>
                      )}
                    </div>

                    <ul className="pl-4 list-disc space-y-1">
                      {p.description.map((line, j) => (
                        <li
                          key={j}
                          className="text-gray-700 dark:text-gray-300"
                        >
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

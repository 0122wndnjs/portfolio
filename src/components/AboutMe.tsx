import {
  FaBirthdayCake,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaGraduationCap,
  FaUser,
  FaGithub,
} from "react-icons/fa";

const profileData = [
  { icon: <FaUser />, label: "이름", value: "김주원" },
  { icon: <FaBirthdayCake />, label: "생년월일", value: "1993-01-22" },
  { icon: <FaMapMarkerAlt />, label: "위치", value: "서울특별시" },
  { icon: <FaPhoneAlt />, label: "전화번호", value: "+82 10-6661-4589" },
  { icon: <FaEnvelope />, label: "이메일", value: "0122wndnjs@gmail.com" },
  {
    icon: <FaGraduationCap />,
    label: "학력",
    value: (
      <div>
        <div>University of Minnesota - Twin Cities</div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Major: Computer Science
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Minor: Mathematics
        </div>
      </div>
    ),
  },
];

export default function AboutMe() {
  return (
    <section
      id="about"
      className="py-24 px-6 bg-gray-100 text-black dark:bg-gray-800 dark:text-white flex flex-col items-center"
    >
      <h2 className="text-6xl font-bold mb-16 text-center font-vitroCore">
        ABOUT ME
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-6 max-w-6xl w-full mb-16">
        {profileData.map(({ icon, label, value }, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center sm:flex-row sm:items-start gap-3 text-center sm:text-left"
          >
            <div className="text-indigo-500 text-2xl">{icon}</div>
            <div>
              <p className="font-semibold">{label}</p>
              <div className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                {value}
              </div>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => window.open("https://github.com/0122wndnjs", "_blank")}
        className="flex items-center gap-2 bg-black text-white text-xl
                   dark:bg-white dark:text-black
                   font-semibold py-4 px-8 rounded transition
                   hover:bg-gray-900 dark:hover:bg-gray-100"
        aria-label="Visit GitHub"
      >
        <FaGithub size={32} />
        Github
      </button>
    </section>
  );
}

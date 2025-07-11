import { FaBirthdayCake, FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaGraduationCap, FaUser } from "react-icons/fa";

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
      <div className="text-sm text-gray-500">Major: Computer Science</div>
      <div className="text-sm text-gray-500">Minor: Mathematics</div>
    </div>
  )
}
];

export default function AboutMe() {
  return (
    <section
      id="about-section"
      className="py-24 px-6 bg-gray-100 text-black dark:bg-gray-800 dark:text-white flex flex-col items-center bg-vscode-light"
    >
      <h2 className="text-6xl font-bold mb-16 text-center font-vitroCore">ABOUT ME</h2>

      {/* Profile Info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-6 max-w-6xl w-full mb-16">
        {profileData.map(({ icon, label, value }, idx) => (
          <div key={idx} className="flex items-start space-x-3">
            <div className="text-indigo-500 text-xl mt-1">{icon}</div>
            <div>
              <p className="font-semibold">{label}</p>
              <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

import { useState } from "react";
import { IoClose, IoMenu } from "react-icons/io5";
import { Link } from "react-scroll";

const sections = ["Home", "About", "Skills", "Projects", "Career"];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 h-16 shadow-md z-50 bg-gray-100 text-black dark:bg-dark-navy dark:text-white">
      <div className="flex justify-between items-center max-w-7xl mx-auto h-full px-6">
        <div className="text-2xl font-bold font-vitroCore">Joowon Kim</div>
        {/* 데스크탑 메뉴 */}
        <nav className="hidden md:flex gap-6">
          {sections.map((section) => (
            <Link
              key={section}
              to={section.toLowerCase()}
              smooth={true}
              duration={500}
              offset={-64} // 헤더 높이 고려
              className="cursor-pointer hover:text-indigo-500 transition"
            >
              {section}
            </Link>
          ))}
        </nav>

        {/* 모바일 메뉴 버튼 */}
        <div className="md:hidden">
          <button onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <IoClose size={24} /> : <IoMenu size={24} />}
          </button>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      {menuOpen && (
        <div className="md:hidden bg-gray-200 dark:bg-gray-900 px-6 py-4 space-y-4">
          {sections.map((section) => (
            <Link
              key={section}
              to={section.toLowerCase()}
              smooth={true}
              duration={500}
              offset={-64}
              onClick={() => setMenuOpen(false)}
              className="block text-lg cursor-pointer"
            >
              {section}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}

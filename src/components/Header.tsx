import DarkModeToggle from "./DarkModeToggle";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 shadow-md z-50 flex justify-between items-center p-4 max-w-7xl mx-auto bg-white text-black dark:bg-dark-navy dark:text-white">
      <div className="text-xl font-bold">Joowon Kim</div>
      <DarkModeToggle />
    </header>
  );
}

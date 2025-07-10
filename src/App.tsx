import "./App.css";
import Header from "./components/Header";
import Hero from "./components/Hero";

function App() {
  return (
    <div className="scroll-smooth">
      <Header />
      <Hero />
      <section className="h-screen flex items-center justify-center bg-gray-100 text-black dark:bg-gray-800 dark:text-white">
        <h2 className="text-3xl">About Me</h2>
      </section>

      <section className="h-screen flex items-center justify-center bg-white text-black dark:bg-gray-900 dark:text-white">
        <h2 className="text-3xl">Projects</h2>
      </section>

      <section className="h-screen flex items-center justify-center bg-slate-100 text-black dark:bg-gray-700 dark:text-white">
        <h2 className="text-3xl">Experience</h2>
      </section>

      <section className="h-[80vh] flex items-center justify-center bg-gray-900 text-white dark:bg-gray-100 dark:text-black">
        <h2 className="text-3xl">Contact</h2>
      </section>
    </div>
  );
}

export default App;

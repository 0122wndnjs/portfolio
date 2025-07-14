import "./App.css";
import AboutMe from "./components/AboutMe";
import Career from "./components/Career";
import Header from "./components/Header";
import Home from "./components/Home";
import Projects from "./components/Projects";
import Skills from "./components/Skills";
import DarkModeFloating from "./components/DarkModeFloating";
import { useEffect } from "react";
import Footer from "./components/Footer";

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
    if (!localStorage.getItem("theme")) {
      localStorage.setItem("theme", "dark");
    }
  }, []);
  return (
    <div className="scroll-smooth">
      <Header />
      <DarkModeFloating />

      <Home />
      <AboutMe />
      <Skills />
      <Projects />
      <Career />
      <Footer />
    </div>
  );
}

export default App;

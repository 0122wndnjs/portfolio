import "./App.css";
import AboutMe from "./components/AboutMe";
import Career from "./components/Career";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Projects from "./components/Projects";
import Skills from "./components/Skills";

function App() {
  return (
    <div className="scroll-smooth">
      <Header />
      <Hero />
      <AboutMe />
      <Skills />
      <Projects />
      <Career />
    </div>
  );
}

export default App;

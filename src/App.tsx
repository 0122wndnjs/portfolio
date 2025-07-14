import "./App.css";
import AboutMe from "./components/AboutMe";
import Career from "./components/Career";
import Header from "./components/Header";
import Home from "./components/Home";
import Projects from "./components/Projects";
import Skills from "./components/Skills";
import DarkModeFloating from "./components/DarkModeFloating";

function App() {
  return (
    <div className="scroll-smooth">
      <Header />
      <DarkModeFloating />

      <Home />
      <AboutMe />
      <Skills />
      <Projects />
      <Career />
    </div>
  );
}

export default App;

import Hero from "@/components/sections/Hero";
import Expertise from "@/components/sections/Expertise";
import Projects from "@/components/sections/Projects";
import Experience from "@/components/sections/Experience";
import TechStack from "@/components/sections/TechStack";
import Contact from "@/components/sections/Contact";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Expertise />
      <Projects />
      <Experience />
      <TechStack />
      <Contact />
    </>
  );
}

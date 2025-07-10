import './App.css'

function App() {
  return (
    <div className="scroll-smooth">
      <section className="h-screen flex items-center justify-center bg-black text-white">
        <h1 className="text-5xl font-bold">👋 Hello, I'm Joowon</h1>
      </section>

      <section className="h-screen flex items-center justify-center bg-gray-100 text-black">
        <h2 className="text-3xl">About Me</h2>
      </section>

      <section className="h-screen flex items-center justify-center bg-white text-black">
        <h2 className="text-3xl">Projects</h2>
      </section>

      <section className="h-screen flex items-center justify-center bg-slate-100 text-black">
        <h2 className="text-3xl">Experience</h2>
      </section>

      <section className="h-[80vh] flex items-center justify-center bg-gray-900 text-white">
        <h2 className="text-3xl">Contact</h2>
      </section>
    </div>
  )
}

export default App

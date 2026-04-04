import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

function MainLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="flex-1 w-full">{children}</main>
      <Footer />
    </div>
  );
}

export default MainLayout;

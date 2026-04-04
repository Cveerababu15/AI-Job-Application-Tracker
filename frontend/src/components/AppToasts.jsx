import { ToastContainer } from "react-toastify";
import { useTheme } from "../hooks/useTheme.js";

export default function AppToasts() {
  const { theme } = useTheme();

  return (
    <ToastContainer
      position="top-right"
      autoClose={3200}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme={theme === "dark" ? "dark" : "light"}
    />
  );
}

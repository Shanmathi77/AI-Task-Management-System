import React, { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div style={styles.toastContainer}>
        {toasts.map((toast) => (
          <div key={toast.id} style={styles.toast}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

// ✅ Fixed styles
const styles = {
  toastContainer: {
    position: "fixed",
    top: 20,
    right: 20,
    zIndex: 9999,
  },
  toast: {
    background: "#333",
    color: "#fff",
    padding: "10px 20px",
    borderRadius: "8px",
    marginBottom: "10px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  },
};

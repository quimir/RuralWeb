import { useToast } from "../../store/useToast";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return createPortal(
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[10000] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`pointer-events-auto flex items-center gap-3 p-4 rounded-xl shadow-lg border ${
              toast.type === "success"
                ? "bg-white border-green-100 text-green-800"
                : toast.type === "error"
                ? "bg-white border-red-100 text-red-800"
                : "bg-white border-blue-100 text-blue-800"
            }`}
          >
            {toast.type === "success" && (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
            {toast.type === "error" && (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
            {toast.type === "info" && (
              <Info className="w-5 h-5 text-blue-500" />
            )}

            <p className="text-sm font-medium flex-1">{toast.message}</p>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
}

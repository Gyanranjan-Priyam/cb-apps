"use client";

export function SecureQuizWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <style jsx global>{`
        /* Disable text selection */
        * {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
        
        /* Disable image dragging */
        img {
          -webkit-user-drag: none;
          -moz-user-drag: none;
          -ms-user-drag: none;
          user-drag: none;
        }
        
        /* Hide scrollbar but keep functionality */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.3);
        }
        
        /* Prevent printing */
        @media print {
          body {
            display: none !important;
          }
        }
      `}</style>
      {children}
    </div>
  );
}

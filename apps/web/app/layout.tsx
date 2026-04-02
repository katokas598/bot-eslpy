import { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body style={{ margin: 0, fontFamily: "Segoe UI, sans-serif", background: "#0f172a", color: "#e2e8f0" }}>
        {children}
      </body>
    </html>
  );
}

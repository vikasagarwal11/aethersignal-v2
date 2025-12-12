import "./globals.css";

export const metadata = {
  title: "AetherSignal Mock Preview",
  description: "Signals dashboard prototype",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="h-screen overflow-hidden bg-[#0F1115] text-gray-100">
        {children}
      </body>
    </html>
  );
}

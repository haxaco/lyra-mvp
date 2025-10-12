import { ThemeProvider } from "@lyra/ui";
import "../styles/globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider defaultTheme="dark">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

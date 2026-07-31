import { AuthProvider } from "@/shared/providers/AuthProvider";

export const metadata = {
  title: "Pratikar Admin",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

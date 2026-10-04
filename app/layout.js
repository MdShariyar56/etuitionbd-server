export const metadata = {
  title: "eTuitionBD API",
  description: "REST API for the eTuitionBD tuition management platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>{children}</body>
    </html>
  );
}

import './globals.css'

export const metadata = {
  title: 'Diff Viewer - Compare Files with Word-Level Highlighting',
  description: 'Professional text diff viewer with side-by-side and inline views, search, collapsible sections, and export to HTML/PDF',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  )
}

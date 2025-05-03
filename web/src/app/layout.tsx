import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PDFBooker - Merge and Enhance PDFs',
  description: 'Merge multiple PDFs into one with page numbers and more',
}

// Check if we're using a test/placeholder key (for development)
const isDevelopmentKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes('xxxx') || 
                         process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes('dummy') ||
                         process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === 'pk_test_example';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // If using a test key in development, skip authentication
  if (isDevelopmentKey) {
    return (
      <html lang="en">
        <body className={inter.className}>
          <nav className="bg-white shadow-sm p-4">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <Link href="/" className="text-xl font-bold text-primary-600">PDFBooker</Link>
              <div className="flex items-center space-x-4">
                <Link href="/pricing" className="text-gray-600 hover:text-primary-600">Pricing</Link>
                <div className="text-gray-500">[Dev Mode]</div>
              </div>
            </div>
          </nav>
          <main className="min-h-screen p-6 md:p-12">
            {children}
          </main>
          <footer className="mt-10 text-center text-sm text-gray-500 p-6">
            <p>© {new Date().getFullYear()} PDFBooker. All rights reserved.</p>
          </footer>
        </body>
      </html>
    )
  }

  // Production mode with valid Clerk keys
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <nav className="bg-white shadow-sm p-4">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <Link href="/" className="text-xl font-bold text-primary-600">PDFBooker</Link>
              <div className="flex items-center space-x-4">
                <Link href="/pricing" className="text-gray-600 hover:text-primary-600">Pricing</Link>
                <UserButton afterSignOutUrl="/" />
              </div>
            </div>
          </nav>
          <main className="min-h-screen p-6 md:p-12">
            {children}
          </main>
          <footer className="mt-10 text-center text-sm text-gray-500 p-6">
            <p>© {new Date().getFullYear()} PDFBooker. All rights reserved.</p>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  )
}
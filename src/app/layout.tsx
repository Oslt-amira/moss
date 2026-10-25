import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'MOSS — Where the digital takes root', description: 'A living experiment at the intersection of nature and code. Touch, explore, and leave something growing.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }

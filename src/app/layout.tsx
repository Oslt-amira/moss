import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { icons: { icon: [{url:'/favicon.ico',sizes:'16x16 32x32'},{url:'/favicon.svg',type:'image/svg+xml',sizes:'any'}], apple:'/apple-touch-icon.png' }, title: 'MOSS — Where the digital takes root', description: 'A living experiment at the intersection of nature and code. Touch, explore, and leave something growing.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }

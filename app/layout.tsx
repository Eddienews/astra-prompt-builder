import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
const geistSans=Geist({variable:'--font-geist-sans',subsets:['latin']});
const geistMono=Geist_Mono({variable:'--font-geist-mono',subsets:['latin']});
export const metadata: Metadata={title:'Astra Prompt Studio — From idea to clear instructions',description:'Build a focused prompt for GPT-6 Astra. Describe your goal, choose how Astra should work, and copy a ready-to-use prompt. No API key required.',metadataBase:new URL('https://astra-prompt-studio.eddienews.chatgpt.site'),icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body></html>;}

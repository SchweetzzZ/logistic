import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-plus-jakarta-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: 'LogiFlow — Cotação inteligente de fretes B2B',
  description: 'Plataforma de gestão e simulação inteligente de fretes B2B, cálculo automático de cubagem e cotação multi-transportadora.',
  openGraph: {
    title: 'LogiFlow — Cotação inteligente de fretes B2B',
    description: 'Plataforma de gestão e simulação inteligente de fretes B2B, cálculo automático de cubagem e cotação multi-transportadora.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`scroll-smooth ${plusJakartaSans.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans bg-white text-zinc-900 antialiased selection:bg-amber-500/20 selection:text-amber-900">
        {children}
      </body>
    </html>
  );
}

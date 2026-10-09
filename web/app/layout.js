import './globals.css';
import Script from 'next/script';
import { assetPath } from '../lib/site-path';
export const metadata = {
  title: 'UFFeScience Research Group — Projects and research',
  description:
    'Projects, people and eScience research at the Institute of Computing, Universidade Federal Fluminense.',
  icons: { icon: assetPath('/uffescience-logo.png') },
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-T2J14TCC5C"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag() { window.dataLayer.push(arguments); }
            gtag('js', new Date());
            gtag('config', 'G-T2J14TCC5C');
          `}
        </Script>
      </body>
    </html>
  );
}

import './globals.css';
import {assetPath} from '../lib/site-path';
export const metadata = {
 title: 'UFFeScience Research Group — Projects and research',
 description: 'Projects, people and eScience research at the Institute of Computing, Universidade Federal Fluminense.',
 icons: { icon: assetPath('/uffescience-logo.png') },
};
export default function RootLayout({ children }) {
 return <html lang="en"><body>{children}</body></html>;
}

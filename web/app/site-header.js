import { assetPath, homePath } from '../lib/site-path';
import Link from 'next/link';
import { Github, ArrowUpRight } from 'lucide-react';
export default function SiteHeader() {
  return (
    <header className="site-header">
      <a className="logo-link" href={homePath('#inicio')} aria-label="UFFeScience — home">
        <img src={assetPath('/uffescience-logo.png')} alt="UFF eScience" width="100" height="100" />
        <span>
          Research Group<small>Institute of Computing / UFF</small>
        </span>
      </a>
      <nav aria-label="Main navigation">
        <Link href="/publicacoes/">Publications</Link>
        <Link href="/papers/">Papers</Link>
        <a href={homePath('#projetos')}>Projects</a>
        <a href={homePath('#pessoas')}>Team</a>
      </nav>
      <a
        className="header-github"
        href="https://github.com/UFFeScience"
        target="_blank"
        rel="noreferrer"
      >
        <Github size={18} />
        <span>GitHub</span>
        <ArrowUpRight size={15} />
      </a>
    </header>
  );
}

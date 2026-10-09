import { ArrowUpRight, ArrowRight, Github } from 'lucide-react';
import { getGithub, getNews } from '../lib/data';
import Projects from './projects';
import LinkedinPosts from './linkedin-posts';
import SiteHeader from './site-header';
import People from './people';
import HomeCarousel from './home-carousel';
import Papers from './papers';
import { assetPath } from '../lib/site-path';
import { readPeople } from '../lib/people-store';
import { readPapers } from '../lib/papers-store';

export default async function Home() {
  const [github, news, people, papers] = await Promise.all([
    getGithub(),
    getNews(),
    readPeople(),
    readPapers(),
  ]);
  const activity = {
    items: Object.values(github.details || {}).flatMap((detail) => detail.updates || []),
    fetchedAt: github.fetchedAt,
  };
  return (
    <>
      <SiteHeader />
      <main>
        <section id="inicio" className="intro campus-hero">
          <div className="intro-copy">
            <div className="kicker">
              <span /> UNIVERSIDADE FEDERAL FLUMINENSE
            </div>
            <h1>
              UFFeScience
              <br />
              <span>Research Group</span>
            </h1>
            <p>
              Welcome to the official page of the UFF eScience Research Group, part of the Institute
              of Computing at Universidade Federal Fluminense (UFF).
            </p>
            <p>
              Our group is dedicated to advancing research in Data Science, Data Management, Machine
              Learning, and their applications in multiple domains of Science (Bioinformatics,
              Astronomy, etc). Here you will find information about our team, ongoing projects, and
              scientific publications.
            </p>
            <div className="intro-actions">
              <a className="primary-button" href="#projetos">
                Explore projects <ArrowRight size={17} />
              </a>
              <a className="quiet-link" href="#pessoas">
                Meet the team <ArrowUpRight size={16} />
              </a>
            </div>
            <div className="intro-location">Institute of Computing · Niterói, Rio de Janeiro</div>
          </div>
          <aside className="intro-campus">
            <HomeCarousel
              photos={[
                {
                  src: '/group.jpeg',
                  alt: 'Illustration of UFFeScience research group members',
                },
                {
                  src: '/instituto.jpg',
                  alt: 'Institute of Computing at Universidade Federal Fluminense',
                },
              ]}
            />
          </aside>
        </section>
        <section id="novidades" className="news-section">
          <div className="section-heading">
            <div>
              <div className="kicker">PUBLICATIONS / EVENTS / RESULTS</div>
              <h2>Publications and news</h2>
            </div>
          </div>
          <LinkedinPosts news={news} />
        </section>
        <People people={people} />
        <Papers papers={papers} />
        <section id="projetos" className="projects-section">
          <div className="section-heading">
            <div>
              <div className="kicker">PROJECTS / PEOPLE / ACTIVITY</div>
              <h2>Group projects</h2>
            </div>
            <span className="source-label">
              <span className="status-dot" />
              {'GitHub activity'}
            </span>
          </div>
          <p className="section-description">
            Explore our projects, meet the contributors and follow the latest updates.
          </p>
          <Projects
            repos={github.repos}
            initialActivity={activity}
            initialDetails={github.details}
          />
          <div className="projects-footer">
            <span>Contributions, discussions and new releases</span>
            <a
              href="https://github.com/orgs/UFFeScience/repositories"
              target="_blank"
              rel="noreferrer"
            >
              All projects on GitHub <ArrowUpRight size={14} />
            </a>
          </div>
        </section>
      </main>
      <footer>
        <div className="footer-brand">
          <img src={assetPath('/uffescience-logo.png')} alt="UFF eScience" width="70" height="70" />
          <p>
            UFFeScience Research Group
            <small>Institute of Computing · Universidade Federal Fluminense</small>
          </p>
        </div>
        <a href="#inicio">Back to top ↑</a>
        <a
          href="https://github.com/UFFeScience"
          target="_blank"
          rel="noreferrer"
          aria-label="UFFeScience on GitHub"
        >
          <Github size={21} />
        </a>
      </footer>
    </>
  );
}

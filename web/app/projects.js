'use client';
import { useState } from 'react';
import { ArrowUpRight, Star, ChevronDown } from 'lucide-react';
import { assetPath } from '../lib/site-path';
import { recentTopics, activityBars } from '../lib/project-summary';
function Avatar({ person }) {
  const [failed, setFailed] = useState(false);
  return failed || !person.avatar ? (
    <span className="avatar-fallback" aria-label={person.actor}>
      {person.actor.slice(0, 2).toUpperCase()}
    </span>
  ) : (
    <img
      src={assetPath(person.avatar)}
      alt={person.actor}
      width="32"
      height="32"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
const dateLabel = (date) =>
  new Date(date).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    timeZone: 'America/Sao_Paulo',
  });
function MiniActivity({ updates, referenceDate }) {
  const days = activityBars(updates, referenceDate);
  const maximum = Math.max(...days.map((day) => day.count), 1);
  if (!days.some((day) => day.count)) return null;
  return (
    <div
      className="mini-project-activity"
      title="Daily distribution of available public activity. This sample may not include the full history. Days are in UTC."
    >
      <div
        className="mini-project-bars"
        role="img"
        aria-label={`Available public activity: ${days
          .filter((day) => day.count)
          .map((day) => `${day.date}: ${day.count} activities`)
          .join('; ')}`}
      >
        {days.map((day) => (
          <span
            key={day.date}
            style={{ height: day.count ? `${Math.max(8, (day.count / maximum) * 100)}%` : '2px' }}
            title={`${day.date}: ${day.count} available activities`}
          />
        ))}
      </div>
      <small>Recent activity</small>
    </div>
  );
}
function Project({ repo, detail, referenceUpdates, referenceDate }) {
  const [expanded, setExpanded] = useState(false);
  const updates = detail?.updatesAvailable ? detail.updates : referenceUpdates;
  const topics = recentTopics(updates);
  const people = detail?.contributorsAvailable
    ? detail.contributors
    : [...new Map(updates.map((update) => [update.actor, update])).values()].slice(0, 5);
  return (
    <article className="project-entry compact-project">
      <div className="project-entry-header">
        <div className="project-entry-info">
          <div className="project-name-line">
            <a href={repo.html_url} target="_blank" rel="noreferrer">
              <h3>{repo.name}</h3>
              <ArrowUpRight size={15} />
            </a>
            <span className="project-stars" aria-label={`${repo.stargazers_count} stars`}>
              <Star size={13} />
              {repo.stargazers_count}
            </span>
          </div>
          {repo.description && <p title={repo.description}>{repo.description}</p>}
          <div className="project-recent">
            <ul>
              {topics.slice(0, expanded ? 6 : 2).map((update) => (
                <li key={update.id}>
                  <span className="update-marker" />
                  <a
                    href={update.url}
                    title={update.title || `${update.actor} ${update.action}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {update.title || `${update.actor} ${update.action}`}
                  </a>
                  <time dateTime={update.date}>{dateLabel(update.date)}</time>
                </li>
              ))}
            </ul>
            {!topics.length && (
              <p className="project-no-updates">
                {detail?.updatesAvailable
                  ? `Last updated: ${dateLabel(repo.pushed_at)} · no recent public activity.`
                  : 'Activity is currently unavailable.'}
              </p>
            )}
            {topics.length > 2 && (
              <button className="project-expand" onClick={() => setExpanded(!expanded)}>
                {expanded ? 'Show less' : 'More activity'}
                <ChevronDown size={12} className={expanded ? 'rotated' : ''} />
              </button>
            )}
          </div>
        </div>
        <div className="project-people">
          <span>Contributors</span>
          <div className="project-avatar-stack">
            {people.map((person) => (
              <a
                key={person.actor}
                href={person.profileUrl}
                title={person.actor}
                aria-label={`Profile of ${person.actor}`}
                target="_blank"
                rel="noreferrer"
              >
                <Avatar person={person} />
              </a>
            ))}
          </div>
          {!people.length && (
            <small>{detail?.contributorsAvailable ? 'Unavailable.' : 'Photos unavailable.'}</small>
          )}
          <MiniActivity updates={updates} referenceDate={detail?.fetchedAt || referenceDate} />
        </div>
      </div>
    </article>
  );
}
export default function Projects({ repos, initialActivity, initialDetails }) {
  const [limit, setLimit] = useState(6);
  const details = initialDetails || {};
  return (
    <div className="project-directory">
      {repos.slice(0, limit).map((repo) => (
        <Project
          key={repo.name}
          repo={repo}
          detail={details[repo.name]}
          referenceDate={initialActivity.fetchedAt}
          referenceUpdates={initialActivity.items.filter((item) => item.project === repo.name)}
        />
      ))}
      {!repos.length && <p className="no-activity">The project list is currently unavailable.</p>}
      {repos.length > limit && (
        <button className="activity-more" onClick={() => setLimit(limit + 6)}>
          More projects <ChevronDown size={14} />
        </button>
      )}
      <p className="directory-note">
        Photos show GitHub contributors. Public activity may appear with a delay.
      </p>
    </div>
  );
}

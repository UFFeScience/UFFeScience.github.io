export function normalizeEvents(events) {
  return [
    ...new Map(
      events.filter((event) => event.public !== false).map((event) => [event.id, event]),
    ).values(),
  ]
    .map((event) => {
      const p = event.payload || {},
        project = event.repo?.name;
      if (!project || !event.actor?.login) return null;
      const repoUrl = `https://github.com/${project}`;
      let action,
        title = '',
        url = repoUrl,
        category;
      switch (event.type) {
        case 'PushEvent':
          action = 'updated the project';
          category = 'Development';
          break;
        case 'PullRequestEvent':
          action =
            p.action === 'closed'
              ? p.pull_request?.merged
                ? 'merged a contribution'
                : 'closed a proposal'
              : p.action === 'opened'
                ? 'proposed a contribution'
                : p.action === 'reopened'
                  ? 'reopened a proposal'
                  : 'updated a contribution';
          title = p.pull_request?.title || '';
          url = p.pull_request?.html_url || repoUrl;
          category = 'Collaboration';
          break;
        case 'IssuesEvent':
          action =
            p.action === 'closed'
              ? 'completed a task'
              : p.action === 'opened'
                ? 'opened a task'
                : p.action === 'reopened'
                  ? 'reopened a task'
                  : 'updated a task';
          title = p.issue?.title || '';
          url = p.issue?.html_url || repoUrl;
          category = 'Tasks';
          break;
        case 'IssueCommentEvent':
          action = 'joined a discussion';
          title = p.issue?.title || '';
          url = p.comment?.html_url || p.issue?.html_url || repoUrl;
          category = 'Discussion';
          break;
        case 'PullRequestReviewEvent':
          action = 'reviewed a contribution';
          title = p.pull_request?.title || '';
          url = p.review?.html_url || p.pull_request?.html_url || repoUrl;
          category = 'Review';
          break;
        case 'ReleaseEvent':
          action = 'published a release';
          title = p.release?.name || p.release?.tag_name || '';
          url = p.release?.html_url || repoUrl;
          category = 'New release';
          break;
        case 'CreateEvent':
          if (p.ref_type === 'repository') {
            action = 'created a project';
            category = 'New project';
          } else if (p.ref_type === 'tag') {
            action = 'tagged a release';
            title = p.ref || '';
            category = 'Version';
          } else return null;
          break;
        default:
          return null;
      }
      return {
        id: event.id,
        project: project.split('/').slice(1).join('/'),
        repoUrl,
        actor: event.actor.login,
        avatar: event.actor.avatar_url,
        profileUrl: `https://github.com/${event.actor.login}`,
        action,
        title,
        url,
        category,
        date: event.created_at,
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

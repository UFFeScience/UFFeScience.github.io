---
layout: page
title: Projects
permalink: /projects/
---


# Research Projects

Welcome to the UFF eScience Group projects page. Here you will find information about our ongoing and completed research projects.


<h2 style="margin-top:2em;">Filter by Language</h2>
<div style="margin-bottom:1em;">
	{% assign languages = "Go,Scala,Python,JavaScript,CSS,Java" | split: "," %}
	{% for lang in languages %}
		<button class="button" onclick="filterProjects('{{ lang }}')" style="margin-right:8px;margin-bottom:8px;">{{ lang }}</button>
	{% endfor %}
	<button class="button button-primary" onclick="filterProjects('')">All</button>
</div>

<table id="projects-table" style="width:100%;border-collapse:collapse;">
	<thead>
		<tr style="background:#f6fff6;">
			<th>Project</th>
			<th>Description</th>
			<th>Language</th>
			<th>License</th>
			<th>Stars</th>
			<th>Last Updated</th>
			<th>Team</th>
			<th>GitHub</th>
		</tr>
	</thead>
	<tbody>
		{% assign sorted_projects = site.projects | sort: 'weight' %}
		{% for project in sorted_projects %}
		<tr class="project-row" data-language="{{ project.language }}" style="border-bottom:1px solid #eee;">
			<td><a href="{{ project.url | relative_url }}"><strong>{{ project.title }}</strong></a></td>
			<td>{{ project.excerpt | markdownify | strip_html | truncate: 80 }}</td>
			<td>{{ project.language }}</td>
			<td>{% if project.license %}{{ project.license }}{% else %}-{% endif %}</td>
			<td>{% if project.stars %}{{ project.stars }}{% else %}-{% endif %}</td>
			<td>{% if project.last_updated %}{{ project.last_updated }}{% else %}-{% endif %}</td>
			<td>
				<div style="display:flex;gap:8px;align-items:center;">
				{% assign team = site.data.team %}
				{% for member in team %}
					<div style="text-align:center;">
						<img src="{{ member.photo | default: '/images/team/default.png' }}" alt="{{ member.name }}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;display:block;margin:auto;">
						<span style="font-size:12px;display:block;">{{ member.name | split: ' ' | first }}</span>
					</div>
				{% endfor %}
				</div>
			</td>
			<td><a class="button button-primary" href="{{ project.repo }}" target="_blank">GitHub</a></td>
		</tr>
		{% endfor %}
	</tbody>
</table>

<script>
function filterProjects(lang) {
	var rows = document.querySelectorAll('.project-row');
	rows.forEach(function(row) {
		if (!lang || row.getAttribute('data-language') === lang) {
			row.style.display = '';
		} else {
			row.style.display = 'none';
		}
	});
}
</script>

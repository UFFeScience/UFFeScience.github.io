---
layout: page
title: Publications
permalink: /publications/
---

# Publications

Browse the scientific publications from the UFF eScience Group, categorized by research area.

{% for category in site.data.publications %}
## {{ category.name }}
{% for pub in category.papers %}
- **{{ pub.title }}**<br>
  {{ pub.authors }}<br>
  _{{ pub.journal }}_, {{ pub.year }}
{% endfor %}
{% endfor %}

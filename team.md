---
title: Team
layout: teams
description: Team
permalink: "/team/"
intro_image_absolute: true
intro_image_hide_on_mobile: false
---

# Our Team

Meet the members of the UFF eScience Group.

{% for member in site.data.team %}
## {{ member.name }}
**Role:** {{ member.role }}

{{ member.bio }}

---
{% endfor %}


from pathlib import Path

project = "cardew"
author = "Maurizio Berta"
release = "0.0.1"

extensions = [
    "myst_parser",
    "sphinx_design",
]

myst_enable_extensions = [
    "colon_fence",
]

# Markdown and reStructuredText support
source_suffix = {
    ".rst": "restructuredtext",
    ".md": "markdown",
}

# Documentation source and build directories
root_doc = "index"

templates_path = ["_templates"]
exclude_patterns = ["_build", "Thumbs.db", ".DS_Store"]

# PyData Sphinx Theme
html_theme = "pydata_sphinx_theme"

html_title = project
html_static_path = ["_static"]

html_theme_options = {
    "show_toc_level": 2,
    "navigation_with_keys": True,
    "show_nav_level": 2,
    "navbar_end": ["theme-switcher", "navbar-icon-links"],
    "icon_links": [
        {
            "name": "GitHub",
            "url": "https://github.com/mauriziobrt/Cardew",
            "icon": "fa-brands fa-github",
        },
    ],
}
copyright = '2025-%Y, Maurizio Berta'
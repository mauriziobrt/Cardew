# Cornelius
A graph interface for exploring data and creating interactive scores. Distributed as an Obsidian Plugin.

![alt text](image.png)


The name is inspired by Cornelius Cardew's graphical scores.

## How to use

In Obsidian, create a new Vault (see [Obsidian Docs](https://obsidian.md/)). Clone the reposityory inside the vault's folder at ```vault-name/.obsidian/plugins```.
In Obsidian's setting allow for external plugin and enable Cornelius.

Extended documentation can be found at [Cornelius Docs](https://mauriziobrt.github.io.cornelius)

## Build Documentation

1. Create Python envrionment
2. Activate Python environment
3. python -m pip install sphinx pydata-sphinx-theme myst-parser sphinx-autobuild
4. python -m sphinx -b html docs docs/_build/html OR python -m sphinx_autobuild docs docs/_build/html

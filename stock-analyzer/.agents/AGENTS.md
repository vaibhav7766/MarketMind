# Workspace Agent Rules

## Shell Environment
When running terminal commands using the `run_command` tool, if the command depends on the user's interactive tools (like `uv`, `nvm`, `node`, `npm`, etc.), you must run it using `zsh` and explicitly source the user's `~/.zshrc`. 

For example, do NOT run:
`uv run something` or `export PATH=... && uv run something`

Instead, you MUST run:
`zsh -i -c 'uv run something'` 
or 
`zsh -c "source ~/.zshrc && uv run something"`

This ensures that tools installed by the user via nvm, cargo, etc. are properly loaded into the `$PATH` before execution.

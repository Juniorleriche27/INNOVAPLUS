# Prompts Directory

This folder centralizes prompt templates and related documentation for PieAgency.

## Structure

- `base_prompt.md` - default system prompt describing the assistant persona and high level rules.
- Additional `.md` or `.json` files can capture scenario-specific prompts (e.g. onboarding, marketing copy).
- Sub-folders may group prompts by domain (backend, frontend, marketing).

## Guidelines

1. Store human readable prompts in Markdown. Use fenced code blocks for snippets.
2. Include a short metadata block at the top of each file describing its intent, target model, and owners.
3. When prompts are programmatically consumed, keep machine-focused formats (YAML/JSON) alongside their Markdown explanation.
4. Document major revisions inline so collaborators understand the changes.


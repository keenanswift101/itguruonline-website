---
name: skill-creation
description: 'Creating and managing VS Code Copilot customization files. Use when: writing .agent.md files, SKILL.md files, .prompt.md templates, copilot-instructions.md, .instructions.md, debugging agent invocations, fixing YAML frontmatter, or packaging workflows into reusable skills.'
---

# Skill Creation Skill

## When to Use
- Creating new agent definitions (`.github/agents/*.agent.md`)
- Writing skill packages (`.github/skills/<name>/SKILL.md`)
- Building prompt templates (`.github/prompts/*.prompt.md`)
- Setting up workspace instructions (`copilot-instructions.md`)
- Debugging why an agent/skill isn't being discovered or invoked
- Fixing YAML frontmatter syntax issues

## File Locations

| Type | Path | Scope |
|------|------|-------|
| Workspace Instructions | `.github/copilot-instructions.md` | All interactions |
| File Instructions | `.github/instructions/*.instructions.md` | Specific file patterns |
| Agents | `.github/agents/*.agent.md` | Workspace |
| Skills | `.github/skills/<name>/SKILL.md` | Workspace |
| Prompts | `.github/prompts/*.prompt.md` | Workspace |
| User Agents | `%APPDATA%/Code/User/prompts/*.agent.md` | User profile |

## Procedures

### Create an Agent
1. Determine the agent's single focused role
2. Choose minimal tools needed (read, edit, search, execute, agent, web, todo)
3. Write description with "Use when:" + specific trigger keywords
4. Define persona in body with clear constraints
5. Add step-by-step approach
6. Save to `.github/agents/<name>.agent.md`
7. Validate: description is keyword-rich, tools are minimal, constraints are clear

### Create a Skill
1. Create folder: `.github/skills/<name>/`
2. Create `SKILL.md` with `name` matching folder name exactly
3. Write description (max 1024 chars) with trigger keywords
4. Write "When to Use" section with bullet points
5. Write "Procedures" with numbered steps
6. Add references to any bundled scripts/assets
7. Keep body under 500 lines — use `references/` for overflow

### Validate Frontmatter
- All YAML between `---` markers
- Required: `description` (agents), `name` + `description` (skills)
- Quote descriptions containing colons: `description: "Use when: doing X"`
- Use spaces not tabs for indentation
- Tool aliases: read, edit, search, execute, agent, web, todo
- Model names: exact strings like `"Claude Sonnet 4"`

### Debug Discovery Issues
1. Check description contains relevant keywords
2. Verify file is in correct location
3. Validate YAML syntax (no tabs, proper quoting)
4. Confirm `name` matches folder for skills
5. Check `user-invocable` and `disable-model-invocation` settings
6. Restart VS Code if changes not reflected

## Anti-patterns
- Vague descriptions ("A helpful agent")
- Too many tools (Swiss-army agents)
- Monolithic SKILL.md (>500 lines without references)
- `applyTo: "**"` on instructions (burns context everywhere)
- Name/folder mismatch on skills

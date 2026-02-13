# Grandma's Kitchen Background Assets

Drop final background art files in this folder using these exact names:

- `home-kitchen.webp` (or `.jpg`)
- `italian-kitchen.webp` (or `.jpg`)
- `mexican-kitchen.webp` (or `.jpg`)
- `greek-kitchen.webp` (or `.jpg`)
- `spanish-kitchen.webp` (or `.jpg`)
- `french-kitchen.webp` (or `.jpg`)
- `lebanese-kitchen.webp` (or `.jpg`)
- `persian-kitchen.webp` (or `.jpg`)
- `chinese-kitchen.webp` (or `.jpg`)
- `indian-kitchen.webp` (or `.jpg`)
- `japanese-kitchen.webp` (or `.jpg`)
- `jamaican-kitchen.webp` (or `.jpg`)

Current `.svg` files are placeholders so the UI works immediately.

The app also supports `.png` files with the same names.

## Generate with OpenAI

From project root:

```bash
npm run assets:kitchens:generate
```

This script reads `OPENAI_API_KEY` from either:

- your shell env, or
- `apps/web/.env.local`

Optional refresh/archive mode:

```bash
npm run assets:kitchens:generate -- --archive --tag 2026-02-week2
```

Generate only specific cuisines:

```bash
npm run assets:kitchens:generate -- --ids lebanese,persian
```

Force regenerate even if file exists:

```bash
npm run assets:kitchens:generate -- --force --ids italian
```

Recommended export settings:

- Resolution: `2560x1440` minimum (16:9)
- Format: `webp` preferred, quality ~75-85
- Keep text-free artwork whenever possible
- Leave visual breathing room in the center for chat/recipe cards

No code changes are needed when replacing placeholders with final files.

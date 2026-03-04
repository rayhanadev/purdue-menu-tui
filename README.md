# pmenu

<video src="demo.mp4" controls></video>

A terminal UI for browsing Purdue University dining court menus.

Built with [OpenTUI](https://github.com/anomalyco/opentui) and [Bun](https://bun.com).

## Install

Requires [Bun](https://bun.com) to be installed.

```bash
bun install -g @rayhanadev/purdue-menus
```

Then run:

```bash
pmenu
```

## Features

- Browse all Purdue dining courts and restaurants
- View meals, stations, and menu items
- See full nutrition facts, ingredients, allergens, and dietary traits
- Navigate between dates
- Favorite locations and items
- Filter/search locations and items
- Vim-style keyboard navigation

## Keybindings

| Key       | Action               |
| --------- | -------------------- |
| `j` / `k` | Navigate up/down     |
| `h` / `l` | Switch meals         |
| `Enter`   | Open / select        |
| `Esc`     | Go back              |
| `<` / `>` | Previous / next date |
| `f`       | Toggle favorite      |
| `/`       | Filter               |
| `q`       | Quit                 |

## Development

```bash
bun install
bun dev
```

## License

MIT

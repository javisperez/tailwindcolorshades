# Color Shades Generator for Tailwind CSS

A modern tool for generating color palettes for your Tailwind CSS projects. Built with Vue 3, TypeScript, and Vite.

## Live Demo

Visit [https://javisperez.github.io/tailwindcolorshades](https://javisperez.github.io/tailwindcolorshades) to try it out.

## What is this?

This tool helps you create custom color palettes for Tailwind CSS by generating shades and tints from a base color. It supports both Tailwind CSS v3 and v4 configurations, with support for OKLCH and HEX format.

The goal is to simplify the process of creating custom color scales that maintain consistent visual harmony and proper contrast across all shade levels.

## Features

- **Multiple Color Formats**: Generate colors in OKLCH, RGB, or HEX formats
- **Tailwind v3 & v4 Support**: Compatible with both Tailwind CSS versions
- **Color Generation**: Automatically generates 11 shades (50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950)
- **Customizable Names**: Auto-generate color names or provide your own
- **Export Options**: Copy generated configurations directly to your clipboard
- **Import Existing Configs**: Load and modify your existing Tailwind color configurations
- **URL Sharing**: Share your palettes via URL parameters
- **Selective Export**: Choose which shade levels to include in your config

## How to Use

1. Pick a base color using the color picker or adding the code in the color picker input
2. The tool automatically generates 11 shades from light (50) to dark (950)
3. Customize palette names or toggle which shades to include
4. Copy the generated configuration (top button) and paste it into your Tailwind config file

## Development

### Prerequisites

- Node.js 22+
- pnpm

### Project Setup

```sh
pnpm install
```

### Development Server

Start the development server with hot-reload:

```sh
pnpm dev
```

### Build for Production

Type-check, compile and minify:

```sh
pnpm build
```

### Testing (TODO)

Run unit tests with Vitest:

```sh
pnpm test:unit
```

### Linting

Lint and fix code:

```sh
pnpm lint
```

## Contributing

Contributions are welcome! Feel free to fork this repository and submit pull requests for:

- Bug fixes
- New features
- Documentation improvements
- Performance enhancements

## License

This project is open source and available under the MIT License.

# 🧠 NeuroZen Landing Page

Landing page for NeuroZen - A platform transforming workplace wellness through technology. Built with Astro, featuring bilingual support (Spanish/English) and modern responsive design.

## ✨ Features

- 🌍 **Internationalization (i18n)**: Full support for Spanish and English with seamless language switching
- 📱 **Fully Responsive**: Optimized for all screen sizes from mobile to desktop
- 🎨 **Modern UI/UX**: Clean design with smooth animations and transitions
- 🚀 **Fast Performance**: Built with Astro for optimal loading speeds
- ♿ **Accessible**: Semantic HTML and ARIA labels for better accessibility
- 💳 **Purchase Flow**: Complete checkout experience with plan selection
- 👨‍⚕️ **Psychologists Section**: Showcase of certified professionals
- 💬 **Testimonials Carousel**: Interactive carousel with user reviews
- 📊 **Pricing Plans**: Three tiers (Basic, Advanced, Professional) 

## 🚀 Project Structure

```text
/
├── public/
│   └── favicon.png
├── src/
│   ├── assets/
│   │   ├── Gifs/
│   │   ├── Icons/
│   │   ├── images/
│   │   └── Redes_Sociales/
│   ├── components/
│   │   ├── FooterComponents/
│   │   ├── HeaderComponents/
│   │   ├── HeroComponents/
│   │   └── MainComponents/
│   ├── consts/
│   │   ├── comments.ts
│   │   ├── menu-item.ts
│   │   └── psychologists.ts
│   ├── helpers/
│   │   └── formatPsychologistName.ts
│   ├── i18n/
│   │   ├── ui.ts
│   │   └── utils.ts
│   ├── layouts/
│   │   └── Layout.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── compra.astro
│   │   ├── 404.astro
│   │   └── en/
│   │       ├── index.astro
│   │       ├── compra.astro
│   │       └── 404.astro
│   ├── styles/
│   │   └── global.css
│   └── types/
│       ├── comment.ts
│       ├── MenuItem.ts
│       └── Psychologist.ts
├── astro.config.mjs
├── tailwind.config.mjs
└── package.json
```

## 🛠️ Tech Stack

- **Framework**: [Astro](https://astro.build) v5.14.3
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **Language**: TypeScript
- **Package Manager**: pnpm
- **Node Version**: v22.19.0

## 🌐 Internationalization

The site supports two languages:

- 🇪🇸 Spanish (default) - Available at `/`
- 🇬🇧 English - Available at `/en/`

Translations are managed in `src/i18n/ui.ts` with over 160 translation keys covering all sections.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                | Action                                           |
| :--------------------- | :----------------------------------------------- |
| `pnpm install`         | Installs dependencies                            |
| `pnpm dev`             | Starts local dev server at `localhost:4321`      |
| `pnpm build`           | Build your production site to `./dist/`          |
| `pnpm preview`         | Preview your build locally, before deploying     |
| `pnpm astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `pnpm astro -- --help` | Get help using the Astro CLI                     |

## 📄 Pages

### Main Pages

- **Home** (`/`, `/en/`): Landing page with all sections
  - Hero section with CTA
  - Benefits showcase
  - Wellness exercises gallery
  - Pricing plans
  - User testimonials carousel
  - Psychologists team
- **Purchase** (`/compra`, `/en/compra`): Checkout page

  - Plan selection display
  - Payment form
  - Language switcher
  - Query parameters preserved across language changes

- **404** (`/404`, `/en/404`): Custom error pages for both languages

## 🎨 Key Components

### Layout Components

- **Header**: Fixed navigation with language switcher and mobile menu
- **Footer**: Multi-column footer with social links and newsletter signup
- **Layout**: Base layout with SEO meta tags

### Main Components

- **Hero**: Landing section with gradient background
- **Benefits**: Feature cards with icons
- **Gallery**: Image showcase with grid layout
- **Prices**: Three-tier pricing cards with feature lists
- **Comments**: Interactive testimonials carousel
- **Psychologists**: Team showcase with professional profiles

### UI Components

- **Link**: Reusable button/link component with gradient styles
- **LanguageSwitcher**: Toggle between Spanish/English with flag icons
- **MobileMenu**: Responsive hamburger menu

## 🔧 Configuration

### Astro Config (`astro.config.mjs`)

```javascript
i18n: {
  defaultLocale: 'es',
  locales: ['es', 'en'],
  routing: {
    prefixDefaultLocale: false
  }
}
```

### Tailwind Config

Custom color palette with green theme and gradient utilities.

## 🎯 SEO Features

- Meta descriptions and keywords
- Open Graph tags
- Semantic HTML structure
- Proper heading hierarchy
- Alt text for all images
- Sitemap ready

## 📱 Responsive Design

Breakpoints:

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

All components are mobile-first with responsive utilities.

## 🚀 Deployment

The project is ready to be deployed to any static hosting platform:

```sh
pnpm build
```

The built files will be in the `./dist/` directory.

## 👀 Want to learn more?

- [Astro Documentation](https://docs.astro.build)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

---

**Built with ❤️ by the NeuroZen team**

# OrthoHouse UK — React Website

A modern, responsive website for **OrthoHouse UK**, a provider of prosthetic limbs, orthotic solutions, biomedical devices and rehabilitation services. Built with React 18, Vite, Supabase and Framer Motion.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Environment Variables](#environment-variables)
4. [Running the Project](#running-the-project)
5. [Building for Production](#building-for-production)
6. [Project Structure](#project-structure)
7. [Modules Explained](#modules-explained)
   - [Public Pages](#1-public-pages)
   - [Admin Dashboard](#2-admin-dashboard)
   - [Layout Components](#3-layout-components)
   - [Home Page Components](#4-home-page-components)
   - [Authentication & Authorization](#5-authentication--authorization)
   - [Data Layer (Supabase)](#6-data-layer-supabase)
   - [Custom Hooks](#7-custom-hooks)
   - [SEO Module](#8-seo-module)
   - [Utility Functions](#9-utility-functions)
   - [Styles](#10-styles)
8. [Tech Stack](#tech-stack)

---

## Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher (comes with Node.js)
- A **Supabase** project (the default keys are already configured for the OrthoHouse UK project)

---

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/kamelfcis/OrthoHouse.git

# 2. Navigate into the project folder
cd OrthoHouse

# 3. Install dependencies
npm install
```

---

## Environment Variables

The project connects to Supabase for its backend. Default values are already embedded in the code, but you can override them by creating a `.env` file in the project root:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

If no `.env` file is provided the app will use the built-in OrthoHouse UK Supabase project.

---

## Running the Project

```bash
# Start the development server (defaults to http://localhost:3001)
npm run dev
```

Open your browser at **http://localhost:3001**.

---

## Building for Production

```bash
# Create an optimized production build
npm run build

# Preview the production build locally
npm run preview
```

The build output is written to the `dist/` folder and is ready to be deployed to any static hosting provider (Netlify, Vercel, Cloudflare Pages, etc.).

---

## Project Structure

```
OrthoHouse/
├── public/                  # Static assets (images, fonts, videos, manifest)
│   ├── assets/
│   │   ├── fonts/           # Custom icon font (lte-font)
│   │   ├── images/          # Logos, page images, service icons
│   │   └── videos/          # Background / promotional videos
│   ├── manifest.json        # PWA manifest
│   ├── robots.txt           # Search engine rules
│   └── sitemap.xml          # Sitemap for SEO
│
├── src/
│   ├── main.jsx             # Application entry point
│   ├── App.jsx              # Root component — defines all routes
│   ├── index.css            # Global styles and CSS variables
│   │
│   ├── components/
│   │   ├── Layout/          # Shared layout: Navbar, Footer, ChatAssistant, etc.
│   │   ├── Home/            # Home page sections: Hero, Stats, Gallery, etc.
│   │   ├── admin/           # Admin layout, protected route, 3D background
│   │   └── SEO/             # Dynamic meta-tag manager
│   │
│   ├── pages/
│   │   ├── Home.jsx         # Home page
│   │   ├── About.jsx        # About Us page
│   │   ├── Products.jsx     # Product catalogue
│   │   ├── ProductDetail.jsx# Single product page
│   │   ├── Blog.jsx         # Blog listing
│   │   ├── BlogDetail.jsx   # Single blog post
│   │   ├── Services.jsx     # Partners listing
│   │   ├── PartnerInfo.jsx  # Single partner page
│   │   ├── Gallery.jsx      # Image gallery
│   │   ├── Team.jsx         # Team members
│   │   ├── Testimonials.jsx # Client testimonials
│   │   ├── Contact.jsx      # Contact form
│   │   ├── NotFound.jsx     # 404 page
│   │   └── admin/           # Admin dashboard pages (see below)
│   │
│   ├── contexts/
│   │   └── AuthContext.jsx   # Authentication context provider
│   │
│   ├── hooks/
│   │   ├── useBranchData.js  # Fetches all branch-specific data from Supabase
│   │   ├── useParallax.js    # Parallax scroll effect
│   │   └── useSmoothScroll.js# Smooth scroll for anchor links
│   │
│   ├── lib/
│   │   └── supabase.js       # Supabase client initialization
│   │
│   ├── utils/
│   │   ├── animations.js     # Scroll, parallax and debounce helpers
│   │   ├── seoData.js        # Structured data generators (JSON-LD)
│   │   └── validation.js     # Form input validation
│   │
│   └── styles/
│       ├── template.css      # Base template styles
│       ├── buttons.css       # Button component styles
│       ├── brand-gradients.css# Brand gradient definitions
│       ├── icons.css          # Icon font styles
│       └── responsive.css     # Responsive breakpoints
│
├── scripts/
│   └── generate-sitemap.js   # Sitemap generator script
│
├── index.html                # HTML entry point with meta tags & preloads
├── vite.config.js            # Vite configuration (build, dev server, chunks)
├── package.json              # Dependencies and scripts
└── .gitignore
```

---

## Modules Explained

### 1. Public Pages

Located in `src/pages/`. All pages are **lazy-loaded** for performance (code splitting). Each page has a matching `.css` file for its styles.

| Page | Route | Description |
|------|-------|-------------|
| **Home** | `/` | Landing page with hero video, partner carousel, stats, capabilities, gallery and newsletter sections |
| **About** | `/about` | Company story, mission and values |
| **Products** | `/products` | Browsable product catalogue with category filtering and search |
| **Product Detail** | `/products/:id` | Single product page with images, specifications and partner info |
| **Partners** | `/partners` | Grid of partner companies with descriptions and logos |
| **Partner Info** | `/partners/:id` | Detailed partner profile with associated products |
| **Blog** | `/blog` | Blog listing with search functionality |
| **Blog Detail** | `/blog/:id` | Full blog article with structured data for SEO |
| **Gallery** | `/gallery` | Masonry image gallery of products and events |
| **Team** | `/team` | Team member cards |
| **Testimonials** | `/testimonials` | Client testimonials and reviews |
| **Contact** | `/contact` | Contact form with validation, map and company info |
| **404** | `*` | Not-found page |

### 2. Admin Dashboard

Located in `src/pages/admin/`. All admin routes are protected by `ProtectedRoute` which checks authentication through Supabase and role-based access.

| Page | Route | Description |
|------|-------|-------------|
| **Login** | `/admin/login` | Admin login form (Supabase email/password auth) |
| **Dashboard** | `/admin/dashboard` | Overview with statistics and quick actions |
| **Products** | `/admin/products` | CRUD management for products (add, edit, delete, upload images) |
| **Blogs** | `/admin/blogs` | Create and manage blog posts |
| **Partners** | `/admin/partners` | Manage partner companies and logos |
| **Categories** | `/admin/categories` | Product category management |
| **Messages** | `/admin/messages` | View and manage contact form submissions |
| **Page Content** | `/admin/page-content` | Edit website page content (hero text, sections, etc.) |
| **Users** | `/admin/users` | User management (admin and branch managers) |
| **Branches** | `/admin/branches` | Branch management for multi-location support |

The admin panel uses its own layout (`AdminLayout.jsx`) with a sidebar navigation, header and a Three.js animated background.

### 3. Layout Components

Located in `src/components/Layout/`. These wrap every public page.

| Component | Description |
|-----------|-------------|
| **Layout** | Main wrapper — renders Navbar, page content, Footer, GoToTop button and ChatAssistant |
| **Navbar** | Responsive navigation bar with scroll-aware sticky behaviour and mobile hamburger menu |
| **Footer** | Site footer with company info, quick links, social media icons and contact details |
| **SplashScreen** | Animated loading screen shown on first visit while the app loads |
| **CookieConsent** | GDPR-compliant cookie consent banner with category toggles |
| **ChatAssistant** | AI-powered chat widget that answers questions about products, pages, contacts and more using data from Supabase |
| **GoToTop** | Floating scroll-to-top button (appears after scrolling past 400px) |
| **WaveDivider** | SVG wave section divider for visual separation |

### 4. Home Page Components

Located in `src/components/Home/`. Each section of the home page is a separate lazy-loaded component.

| Component | Description |
|-----------|-------------|
| **Hero** | Full-screen hero section with embedded YouTube background video, animated title and CTA buttons |
| **HeroPartnersCarousel** | Swiper carousel showcasing partner company logos |
| **Stats** | Animated counter section showing company statistics (patients served, products, etc.) |
| **Capabilities** | Service capabilities grid with icons and descriptions |
| **HomeGallery** | Coverflow-effect image carousel pulling product images from Supabase |
| **Newsletter** | Email newsletter subscription section |
| **About** | Brief company introduction with image |
| **Services** | Service offering cards |
| **CeoVisionMission** | CEO profile with vision/mission statement tabs |
| **Testimonials** | Client testimonial carousel |
| **CTA** | Call-to-action section |

### 5. Authentication & Authorization

| File | Description |
|------|-------------|
| `src/contexts/AuthContext.jsx` | React Context provider that manages auth state using Supabase Auth. Provides `signIn`, `signOut`, `user`, `appUser`, role checks (`isAdmin`, `isBranchManager`, `canAccessAdmin`) |
| `src/components/admin/ProtectedRoute.jsx` | Route guard that redirects unauthenticated users to `/admin/login`. Supports optional `requireAdmin` prop for admin-only pages |

**Roles:**
- `admin` — Full access to all admin pages
- `branch_content_manager` — Limited access to branch-specific content

### 6. Data Layer (Supabase)

| File | Description |
|------|-------------|
| `src/lib/supabase.js` | Initializes the Supabase client with URL, anon key and auth options |
| `src/hooks/useBranchData.js` | Custom hook that fetches all data for a branch in parallel — page content, company info, statistics, products, partners and blogs from 6 Supabase tables using `Promise.all` for fast loading |

**Supabase tables used:** `branches`, `branch_page_content`, `page_sections`, `company_info`, `company_statistics`, `branch_products`, `products`, `product_categories`, `product_images`, `partners`, `branch_partners`, `blogs`, `app_users`

**Supabase storage buckets:** `product-images`, `partner-logos`

### 7. Custom Hooks

Located in `src/hooks/`.

| Hook | Description |
|------|-------------|
| `useBranchData(branchCode)` | Fetches and organizes all data for a given branch from Supabase. Returns `{ branchData, loading, error }` |
| `useParallax(speed, enabled)` | Applies a parallax scroll effect to the referenced element. Desktop only (disabled below 768px). Uses `requestAnimationFrame` throttling |
| `useSmoothScroll()` | Handles smooth scrolling for anchor links and scrolls to top on route changes |

### 8. SEO Module

| File | Description |
|------|-------------|
| `src/components/SEO/SEO.jsx` | Dynamically updates document `<title>`, meta description, Open Graph tags, Twitter Card tags, canonical URL and JSON-LD structured data per page |
| `src/utils/seoData.js` | Generates Organization, Website and LocalBusiness structured data schemas |
| `scripts/generate-sitemap.js` | Node script to generate `sitemap.xml` (`npm run generate-sitemap`) |

### 9. Utility Functions

Located in `src/utils/`.

| File | Description |
|------|-------------|
| `animations.js` | `smoothScrollTo`, `scrollToTop`, `initParallax`, `matchHeight`, `debounce`, `throttle` helper functions |
| `seoData.js` | Functions to generate JSON-LD structured data: `generateOrganizationSchema`, `generateWebsiteSchema`, `generateLocalBusinessSchema` |
| `validation.js` | Form validation helpers used by the Contact page and Newsletter |

### 10. Styles

Located in `src/styles/`. Global stylesheets imported through `index.css`.

| File | Description |
|------|-------------|
| `template.css` | Base template styles — typography, grid layout, section spacing |
| `buttons.css` | Button variants (primary, outline, gradient) |
| `brand-gradients.css` | Brand gradient CSS classes and backgrounds |
| `icons.css` | Custom icon font (lte-font) mappings |
| `responsive.css` | Media query breakpoints and responsive overrides |

CSS variables for brand colours are defined in `index.css`:
- `--brand-primary: #005f9a`
- `--brand-secondary: #2478b5`
- `--brand-tertiary: #2dadd5`

---

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| **React 18** | UI library with lazy loading and Suspense |
| **Vite 5** | Build tool and dev server with HMR |
| **React Router 6** | Client-side routing |
| **Supabase** | Backend — database, auth, file storage |
| **Framer Motion** | Page and component animations |
| **Swiper** | Touch-enabled carousels and sliders |
| **Three.js** | 3D animated background in the admin panel |
| **react-hot-toast** | Toast notifications |
| **react-intersection-observer** | Scroll-triggered animations |
| **react-countup** | Animated number counters |
| **react-masonry-css** | Masonry grid layout for the gallery |
| **Terser** | JavaScript minification for production builds |


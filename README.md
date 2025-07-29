# Modern Dashboard

A modern, responsive dashboard built with Next.js and Shadcn UI components.

## Features

- 🎨 **Modern Design**: Built with Shadcn UI components and Tailwind CSS
- 📱 **Responsive**: Works seamlessly on desktop, tablet, and mobile devices
- 🎯 **TypeScript**: Full type safety with TypeScript
- 🚀 **Performance**: Optimized for speed with Next.js App Router
- 🎭 **Theming**: Supports light and dark themes
- 📊 **Dashboard Components**: Pre-built cards, charts, tables, and analytics

## Tech Stack

- **Framework**: Next.js 15+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI
- **Icons**: Lucide React

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the dashboard.

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── meta-ads/          # Meta Ads performance tracker
│   └── crm/               # CRM section
├── components/
│   ├── ui/                # Shadcn UI components
│   ├── dashboard/         # Custom dashboard components
│   ├── meta-ads/          # Meta Ads components
│   └── crm/               # CRM components
├── lib/                   # Utility functions
├── types/                 # TypeScript type definitions
└── hooks/                 # Custom React hooks
```

## Meta Ads Performance Tracker

The dashboard includes a comprehensive Meta Ads performance tracker that connects to the Facebook Graph API to display real-time advertising metrics.

### Features

- 📊 **Real-time Metrics**: Total investment, cost per lead, reach, and CPC
- 📈 **Performance Charts**: Monthly investment trends with interactive charts
- 🔄 **Auto-refresh**: Configurable data refresh intervals
- 📱 **Responsive Design**: Optimized for all device sizes
- 🎨 **Visual Cards**: Color-coded metric cards with icons

### Setup

1. Copy the environment variables:
```bash
cp .env.example .env.local
```

2. Get your Meta access token:
   - Visit [Facebook Graph API Explorer](https://developers.facebook.com/tools/explorer/)
   - Generate a token with `ads_read` and `ads_management` permissions
   - Copy the token to your `.env.local` file

3. Configure the token:
```env
NEXT_PUBLIC_META_ACCESS_TOKEN=your_meta_access_token_here
```

### API Integration

The tracker uses the Facebook Graph API v18.0 with the following endpoint:
```
https://graph.facebook.com/v18.0/act_1021480798184024/insights?fields=spend,impressions,clicks,reach&time_range[since]=2025-07-01&time_range[until]=2025-07-31&access_token={{env_variable}}
```

### Components

- `MetaAdsContent` - Main container component
- `MetaAdsPerformanceCards` - Individual metric cards
- `MonthlyInvestmentChart` - Investment trend visualization
- `MetaAdsService` - API service for data fetching

## Customization

### Adding New Components

Add new dashboard sections by creating components in `src/components/dashboard/` and importing them into the main layout.

### Styling

The project uses Tailwind CSS for styling. You can customize the theme in `tailwind.config.js` and the component styles are defined using Tailwind classes.

### Adding Charts

The dashboard includes placeholder areas for charts. You can integrate your preferred charting library like:
- Chart.js
- Recharts
- D3.js
- Victory

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

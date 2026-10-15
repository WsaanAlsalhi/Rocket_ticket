# Rocket Mission

A NASA-inspired digital mission ticket system. Participants register and instantly get a personalized Rocket Mission ticket, generated as a PNG, previewed on the website, downloadable on demand, and stored in Supabase.

## Project Links

- **GitHub:** [Rocket_ticket Repository](https://github.com/WsaanAlsalhi/Rocket_ticket)
- **Live Website:** [Rocket Mission Website](https://rocket-ticket-two.vercel.app)

## Features

- Participant registration (name, country, optional email)
- Automatic Mission ID generation
- Automatic seat assignment
- Personalized ticket generated from a template (passenger, Mission ID, seat, team, destination, launch date, status)
- Ticket preview directly on the website
- Manual ticket download as PNG (no automatic download)
- Ticket storage in Supabase Storage
- Ticket URL saved in the participant database

## Tech Stack

- **Next.js 14** (App Router)
- **React 18**
- **Supabase** (database + storage)
- **@napi-rs/canvas** (server-side ticket rendering)
- **Vercel** (hosting)

## How It Works

```
Participant
     ↓
Enter Name + Country
     ↓
Registration (/api/register)
     ↓
Generate Mission ID & Seat
     ↓
Generate Ticket PNG (/api/generate-ticket)
     ↓
Display Ticket Preview
     ↓
Upload Ticket to Supabase Storage (/api/upload-ticket)
     ↓
Save Ticket URL to Database
```

## Project Structure

```
Rocket_ticket/
│
├── app/
│   ├── api/
│   │   ├── register/
│   │   ├── generate-ticket/
│   │   └── upload-ticket/
│   ├── page.js
│   ├── layout.js
│   └── globals.css
│
├── fonts/
│   └── DejaVuSans.ttf
│
├── public/
│   ├── ticket-template.png
│   └── stickers/
│       └── sticker.jpeg
│
├── next.config.js
├── package.json
├── package-lock.json
└── supabase.sql
```

## Database

Participant information is stored in Supabase:

| Field        | Description                    |
| ------------ | ------------------------------ |
| name         | Participant name               |
| country      | Participant country            |
| email        | Optional email                 |
| mission_id   | Generated Mission ID           |
| seat         | Assigned seat                  |
| ticket_url   | Public URL of the stored ticket |
| created_at   | Registration date              |

The full schema is in `supabase.sql`.

## Local Development

```bash
git clone https://github.com/WsaanAlsalhi/Rocket_ticket.git
cd Rocket_ticket
npm install
npm run dev
```

The app runs at `http://localhost:3000`.

### Environment Variables

Create a `.env.local` file in the project root. Use the variable names that match your code; typical values are:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Never expose the service role key in client-side code or commit it to Git.

### Supabase Setup

1. Create a Supabase project.
2. Run `supabase.sql` in the SQL editor.
3. Create a public Storage bucket for tickets (the bucket name must match the one used in `app/api/upload-ticket`).
4. Add the environment variables above.

## Deployment (Vercel)

The project is connected to Vercel and deploys automatically from the `main` branch.

1. Import the repository in Vercel.
2. Add the same environment variables in **Project Settings → Environment Variables**.
3. Push to `main` to trigger a deployment.

### Important Build Notes

`@napi-rs/canvas` is a native module and must not be bundled by webpack. `next.config.js` handles this and also makes sure the font and template are included in the serverless bundle:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@napi-rs/canvas'],
    outputFileTracingIncludes: {
      '/api/generate-ticket': [
        './fonts/**/*',
        './public/ticket-template.png',
        './public/stickers/**/*',
      ],
    },
  },
};

module.exports = nextConfig;
```

The ticket route runs on the Node.js runtime (`export const runtime = 'nodejs'`).

## Customizing the Ticket

Text positions are defined as ratios of the template size in the `FIELDS` array in `app/api/generate-ticket/route.js`, so they keep working if you change the template resolution. To move a field, adjust its `x` / `y` values slightly (for example by `0.005`).

## Troubleshooting

| Problem | Likely cause |
| ------- | ------------ |
| Build fails on `skia.linux-x64-gnu.node` | `@napi-rs/canvas` missing from `serverComponentsExternalPackages` |
| Ticket text is invisible | Text color matches the template background |
| Text shows as squares | Font file not included in the bundle or not registered |
| "Ticket generated, but saving it failed" | Missing env vars, wrong bucket name, missing storage policy, or missing `ticket_url` column |

## License

All rights reserved unless stated otherwise by the repository owner.

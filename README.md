#  Rocket Mission

A NASA-inspired digital mission ticket system that allows participants to register and instantly generate a personalized Rocket Mission ticket.

## 🔗 Project Links

- **GitHub:** [Rocket_ticket Repository](https://github.com/WsaanAlsalhi/Rocket_ticket)
- **Live Website:** [Rocket Mission Website](https://rocket-ticket-two.vercel.app)

##  Features

- Participant registration
- Name and country input
- Optional email field
- Automatic Mission ID generation
- Automatic seat assignment
- Personalized mission ticket generation
- Ticket preview directly on the website
- Ticket download as PNG
- Ticket storage in Supabase Storage
- Ticket URL saved in the participant database

##  Technologies

- **Next.js**
- **React**
- **Supabase**
- **Sharp**
- **Vercel**
- **JavaScript**

## 🔄 How It Works

```text
Participant
     ↓
Enter Name + Country
     ↓
Registration
     ↓
Generate Mission ID & Seat
     ↓
Generate Personalized Ticket
     ↓
Display Ticket
     ↓
Save Ticket to Supabase Storage
     ↓
Save Ticket URL to Database
```

##  Main Project Structure

```text
Rocket_ticket/
│
├── app/
│   ├── api/
│   │   ├── register/
│   │   ├── generate-ticket/
│   │   └── upload-ticket/
│   │
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
├── package.json
├── package-lock.json
└── supabase.sql
```

##  Database

Participant information is stored in Supabase, including:

- Name
- Country
- Email
- Mission ID
- Seat
- Ticket URL
- Registration date

##  Deployment

The project is connected to **Vercel** and deployed from the GitHub repository.

##  Local Development

Clone the repository and install dependencies:

```bash
git clone https://github.com/WsaanAlsalhi/Rocket_ticket.git
cd Rocket_ticket
npm install
```

Run the development server:

```bash
npm run dev
```

Configure Supabase by running the `supabase.sql` file and adding the required environment variables.


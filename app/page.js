'use client';

import { useState } from 'react';

export default function HomePage() {
  const [form, setForm] = useState({ name: '', country: '', email: '' });
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [error, setError] = useState('');
  const [participant, setParticipant] = useState(null);
  const [ticketImage, setTicketImage] = useState(null); // base64 data URL
  const [ticketUrl, setTicketUrl] = useState(null);     // public URL from Supabase

  // Generic input handler
  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  // Convert a base64 data URL into a Blob (needed for FormData upload)
  function dataUrlToBlob(dataUrl) {
    const [header, base64] = dataUrl.split(',');
    const mime = header.match(/:(.*?);/)[1];
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!form.name.trim() || !form.country.trim()) {
      setError('Please enter your name and country.');
      return;
    }

    try {
      setStatus('loading');

      // 1) Register the participant
      const regRes = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const regData = await regRes.json();
      if (!regRes.ok) throw new Error(regData.error || 'Registration failed');

      const p = regData.participant;
      setParticipant(p);

      // 2) Generate the ticket image (base64 data URL)
      const genRes = await fetch('/api/generate-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: p.name,
          country: p.country,
          missionId: p.mission_id,
          seat: p.seat,
        }),
      });
      const genData = await genRes.json();
      if (!genRes.ok) throw new Error(genData.error || 'Ticket generation failed');

      setTicketImage(genData.image);

      // 3) Upload the ticket to Supabase Storage and save ticket_url
      const blob = dataUrlToBlob(genData.image);
      const formData = new FormData();
      formData.append('ticket', blob, `ticket-${p.id}.png`);
      formData.append('participantId', p.id);

      const upRes = await fetch('/api/upload-ticket', {
        method: 'POST',
        body: formData,
      });
      const upData = await upRes.json();
      if (!upRes.ok) throw new Error(upData.error || 'Upload failed');

      setTicketUrl(upData.ticket_url);
      setStatus('done');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong');
      setStatus('error');
    }
  }

  // Download the ticket as PNG (prefer the public URL if available)
  function handleDownload() {
    if (!ticketImage) return;
    const a = document.createElement('a');
    a.href = ticketUrl || ticketImage;
    a.download = `rocket-ticket-${participant?.mission_id || 'ticket'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // Reset everything for a new registration
  function reset() {
    setForm({ name: '', country: '', email: '' });
    setParticipant(null);
    setTicketImage(null);
    setTicketUrl(null);
    setError('');
    setStatus('idle');
  }

  return (
    <main className="container">
      <h1 className="title">🚀 ROCKET MISSION</h1>
      <p className="subtitle">Register and get your personalized mission ticket</p>

      {status !== 'done' && (
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="name">Full Name *</label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Yousif Al-Salhi"
                disabled={status === 'loading'}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="country">Country *</label>
              <input
                id="country"
                type="text"
                value={form.country}
                onChange={(e) => update('country', e.target.value)}
                placeholder="Oman"
                disabled={status === 'loading'}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="email">Email (optional)</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="you@example.com"
                disabled={status === 'loading'}
              />
            </div>

            <button
              className="btn"
              type="submit"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'GENERATING MISSION…' : 'GET MY TICKET'}
            </button>

            {error && <p className="error">{error}</p>}
          </form>
        </div>
      )}

      {status === 'done' && participant && ticketImage && (
        <div className="card ticket-wrap">
          {/* Prefer the Supabase public URL, fall back to base64 preview */}
          <img
            src={ticketUrl || ticketImage}
            alt="Rocket Mission Ticket"
            className="ticket-img"
          />

          <div className="meta">
            <span><b>Name:</b> {participant.name}</span>
            <span><b>Mission:</b> {participant.mission_id}</span>
            <span><b>Seat:</b> {participant.seat}</span>
          </div>

          <div className="actions">
            <button className="btn" onClick={handleDownload}>
              ⬇ DOWNLOAD PNG
            </button>
            <button className="btn btn-ghost" onClick={reset}>
              NEW REGISTRATION
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

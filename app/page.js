'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [email, setEmail] = useState('');

  const [participant, setParticipant] = useState(null);
  const [ticketImage, setTicketImage] = useState(null); // object URL for preview and download
  const [ticketUrl, setTicketUrl] = useState(null);     // public URL from Supabase (reference only)

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  // Cleanup: revoke the object URL when it changes or on unmount
  useEffect(() => {
    return () => {
      if (ticketImage) URL.revokeObjectURL(ticketImage);
    };
  }, [ticketImage]);

  // Reads a JSON body if possible, otherwise falls back to plain text.
  // Needed because platform errors (for example 413) are not JSON.
  async function readBody(response) {
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return { error: text.slice(0, 200) };
    }
  }

  async function registerParticipant(event) {
    event.preventDefault();
    setError('');
    setSaveMessage('');
    setLoading(true);

    try {
      // 1) Register participant
      const registerResponse = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          country: country.trim(),
          email: email.trim() || null,
        }),
      });

      const registerData = await readBody(registerResponse);

      if (!registerResponse.ok) {
        throw new Error(
          registerData.details ||
            registerData.error ||
            'Could not register participant.'
        );
      }

      const p = registerData.participant;
      if (!p) throw new Error('Participant data was not returned.');

      // 2) Generate ticket image (PNG blob)
      const generateResponse = await fetch('/api/generate-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: p.name,
          country: p.country,
          mission_id: p.mission_id,
          seat: p.seat,
        }),
      });

      if (!generateResponse.ok) {
        const generateData = await readBody(generateResponse);
        throw new Error(
          generateData.details ||
            generateData.error ||
            'Could not generate ticket.'
        );
      }

      const blob = await generateResponse.blob();
      if (!blob || blob.size === 0) {
        throw new Error('Generated ticket is empty.');
      }

      const objectUrl = URL.createObjectURL(blob);
      setParticipant(p);
      setTicketImage(objectUrl);

      // 3) Upload ticket to Supabase Storage and save the ticket URL
      try {
        const formData = new FormData();
        formData.append('ticket', blob, `${p.mission_id}.png`);
        formData.append('participantId', p.id);

        const uploadResponse = await fetch('/api/upload-ticket', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await readBody(uploadResponse);

        if (!uploadResponse.ok) {
          console.error('Ticket upload failed:', uploadResponse.status, uploadData);
          const reason = uploadData.details || uploadData.error || `HTTP ${uploadResponse.status}`;
          setSaveMessage(`Ticket generated, but saving it failed: ${reason}`);
        } else {
          setTicketUrl(uploadData.ticket_url);
          setSaveMessage('Ticket generated and saved successfully.');
        }
      } catch (uploadError) {
        console.error('Ticket upload error:', uploadError);
        setSaveMessage(
          `Ticket generated, but saving it failed: ${uploadError?.message || 'network error'}`
        );
      }
    } catch (registrationError) {
      console.error('Registration process failed:', registrationError);
      setError(registrationError?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  // Runs only when the user clicks the button. It always downloads the local
  // blob, because the "download" attribute is ignored for cross-origin URLs
  // (such as a Supabase public URL), which would open the image instead.
  function downloadTicket() {
    if (!ticketImage || !participant) return;

    const link = document.createElement('a');
    link.href = ticketImage;
    link.download = `Rocket-Mission-${participant.mission_id}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function createAnotherTicket() {
    if (ticketImage) URL.revokeObjectURL(ticketImage);
    setName('');
    setCountry('');
    setEmail('');
    setParticipant(null);
    setTicketImage(null);
    setTicketUrl(null);
    setError('');
    setSaveMessage('');
  }

  return (
    <main className="container">
      {!participant && (
        <section className="registration">
          <div className="logo">🚀</div>
          <h1 className="title">JOIN THE MISSION</h1>
          <p className="subtitle">Become part of the Rocket Mission.</p>
          <p className="form-note">
            Note: Please enter your name and country in English.
          </p>

          <form onSubmit={registerParticipant}>
            <div className="form-group">
              <label htmlFor="name">Your Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name in English"
                maxLength={50}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="country">Country</label>
              <input
                id="country"
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Enter your country in English"
                maxLength={40}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">
                Email <span className="optional">(Optional)</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
              <small>Email is optional.</small>
            </div>

            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Generating Ticket...' : '🚀 Generate My Ticket'}
            </button>
          </form>

          {error && <div className="error">{error}</div>}
        </section>
      )}

      {participant && (
        <section className="result">
          <h2>MISSION TICKET</h2>
          <p className="mission-success">
            Your mission ticket has been generated.
          </p>

          <div className="ticket-wrapper">
            <img
              src={ticketImage}
              className="generated-ticket"
              alt="Generated Rocket Mission Ticket"
            />
          </div>

          {saveMessage && (
            <div className="email-success">{saveMessage}</div>
          )}

          <div className="actions">
            <button className="download-button" onClick={downloadTicket}>
              ⬇ Download My Ticket
            </button>

            <a
              href="/stickers/sticker.jpeg"
              download="Rocket-Mission-Sticker.jpeg"
              className="secondary-button"
              style={{ textDecoration: 'none' }}
            >
              🎨 Download Sticker
            </a>
          </div>

          <button
            className="secondary-button"
            onClick={createAnotherTicket}
            style={{ marginTop: 12 }}
          >
            Create Another Ticket
          </button>
        </section>
      )}
    </main>
  );
}

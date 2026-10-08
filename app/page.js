'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [email, setEmail] = useState('');

  const [participant, setParticipant] = useState(null);
  const [ticketImage, setTicketImage] = useState(null); // object URL for preview
  const [ticketUrl, setTicketUrl] = useState(null);     // public URL from Supabase

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  // Cleanup: revoke object URL when it changes or on unmount
  useEffect(() => {
    return () => {
      if (ticketImage) URL.revokeObjectURL(ticketImage);
    };
  }, [ticketImage]);

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

      const registerData = await registerResponse.json();

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
        let generateData = {};
        try {
          generateData = await generateResponse.json();
        } catch {}
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

      // 3) Upload ticket to Supabase Storage and save ticket_url
      try {
        const formData = new FormData();
        formData.append('ticket', blob, `${p.mission_id}.png`);
        formData.append('participantId', p.id);

        const uploadResponse = await fetch('/api/upload-ticket', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok) {
          console.error('Ticket upload failed:', uploadData);
          setSaveMessage('Ticket generated, but saving it failed.');
        } else {
          setTicketUrl(uploadData.ticket_url);
          setSaveMessage('Ticket generated and saved successfully.');
        }
      } catch (uploadError) {
        console.error('Ticket upload error:', uploadError);
        setSaveMessage('Ticket generated, but saving it failed.');
      }
    } catch (registrationError) {
      console.error('Registration process failed:', registrationError);
      setError(registrationError?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  function downloadTicket() {
    if (!ticketImage || !participant) return;

    const link = document.createElement('a');
    // Prefer the Supabase public URL when available
    link.href = ticketUrl || ticketImage;
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
              src={ticketUrl || ticketImage}
              className="generated-ticket"
              alt="Generated Rocket Mission Ticket"
            />
          </div>

          {saveMessage && (
            <div className="email-success">{saveMessage}</div>
          )}

          <button className="download-button" onClick={downloadTicket}>
            Download My Ticket
          </button>

          <button
            className="secondary-button"
            onClick={createAnotherTicket}
          >
            Create Another Ticket
          </button>
        </section>
      )}
    </main>
  );
}

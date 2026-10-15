'use client';

import { useEffect, useState } from 'react';

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/participants');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load');
        setParticipants(data.participants || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <main className="container" style={{ maxWidth: 1200 }}>
      <h1 className="title" style={{ marginBottom: 20 }}>
        👥 Registered Participants
      </h1>

      {loading && <p style={{ textAlign: 'center' }}>Loading…</p>}
      {error && <div className="error">{error}</div>}

      {!loading && !error && participants.length === 0 && (
        <p style={{ textAlign: 'center', opacity: 0.7 }}>
          No participants yet.
        </p>
      )}

      {!loading && participants.length > 0 && (
        <div
          style={{
            display: 'grid',
            gap: 20,
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          }}
        >
          {participants.map((p) => (
            <div
              key={p.id}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
                padding: 16,
              }}
            >
              {p.ticket_image_url ? (
                <a href={p.ticket_image_url} target="_blank" rel="noreferrer">
                  <img
                    src={p.ticket_image_url}
                    alt={`Ticket for ${p.name}`}
                    style={{
                      width: '100%',
                      borderRadius: 8,
                      marginBottom: 12,
                    }}
                  />
                </a>
              ) : (
                <div
                  style={{
                    height: 120,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: 8,
                    marginBottom: 12,
                    fontSize: 12,
                    opacity: 0.6,
                  }}
                >
                  No ticket image
                </div>
              )}

              <p style={{ marginBottom: 4 }}>
                <b>#{p.id}</b> — {p.name}
              </p>
              <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 2 }}>
                🌍 {p.country} · 🪑 {p.seat} · 🆔 {p.mission_id}
              </p>
              <p style={{ fontSize: 12, opacity: 0.6, marginBottom: 8 }}>
                📧 {p.email || '—'}
              </p>
              <p style={{ fontSize: 11, opacity: 0.5 }}>
                🕒 {new Date(p.created_at).toLocaleString()}
              </p>

              {p.ticket_image_url && (
                <a
                  href={p.ticket_image_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-block',
                    marginTop: 10,
                    fontSize: 12,
                    color: '#56ccf2',
                    wordBreak: 'break-all',
                  }}
                >
                  {p.ticket_image_url}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

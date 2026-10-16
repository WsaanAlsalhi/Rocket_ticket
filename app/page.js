"use client";

import { useEffect, useState } from "react";
import "./globals.css";

export default function Home() {
    const [name, setName] = useState("");
    const [country, setCountry] = useState("");
    const [ticket, setTicket] = useState(null);
    const [ticketImage, setTicketImage] = useState("");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [saveMessage, setSaveMessage] = useState("");

    useEffect(() => {
        return () => {
            if (ticketImage) {
                URL.revokeObjectURL(ticketImage);
            }
        };
    }, [ticketImage]);

    async function readResponse(response) {
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.error || "The request failed.");
        }

        return data;
    }

    async function registerParticipant(event) {
        event.preventDefault();

        setError("");
        setSaveMessage("");
        setLoading(true);

        try {
            // Step 1: Register the participant.
            const registerResponse = await fetch("/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    country,
                }),
            });

            const participant = await readResponse(registerResponse);

            // Step 2: Generate the PNG ticket.
            const generateResponse = await fetch(
                "/api/generate-ticket",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: participant.name,
                        country: participant.country,
                        mission_id: participant.mission_id,
                        seat: participant.seat,
                    }),
                }
            );

            if (!generateResponse.ok) {
                const data = await generateResponse.json().catch(() => ({}));
                throw new Error(data.error || "Ticket generation failed.");
            }

            const blob = await generateResponse.blob();
            const imageUrl = URL.createObjectURL(blob);

            setTicket(participant);
            setTicketImage(imageUrl);

            // Step 3: Upload the ticket and save its URL.
            setSaving(true);

            try {
                const formData = new FormData();

                formData.append(
                    "file",
                    blob,
                    `${participant.mission_id}.png`
                );

                formData.append("mission_id", participant.mission_id);

                const uploadResponse = await fetch("/api/upload-ticket", {
                    method: "POST",
                    body: formData,
                });

                await readResponse(uploadResponse);

                setSaveMessage("Ticket generated and saved successfully.");
            } catch (uploadError) {
                console.error("Ticket save error:", uploadError);

                setSaveMessage(
                    "Ticket generated, but automatic saving failed. You can still download it."
                );
            } finally {
                setSaving(false);
            }

        } catch (requestError) {
            console.error("Registration flow error:", requestError);
            setError(requestError.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    }

    function downloadTicket() {
        if (!ticketImage || !ticket) return;

        const link = document.createElement("a");
        link.href = ticketImage;
        link.download = `Rocket-Mission-${ticket.mission_id}.png`;

        document.body.appendChild(link);
        link.click();
        link.remove();
    }

    function createAnotherTicket() {
        setName("");
        setCountry("");
        setTicket(null);
        setTicketImage("");
        setError("");
        setSaveMessage("");
    }

    return (
        <main className="page-container">
            <header className="site-header">
                <div className="brand-mark">R2S</div>
                <div className="brand-copy">
                    <span>RACE2SPACE OMAN</span>
                    <small>ROCKET MISSION REGISTRATION</small>
                </div>
            </header>

            {!ticket && (
                <section className="registration-card">
                    <div className="rocket-icon" aria-hidden="true">
                        🚀
                    </div>

                    <p className="eyebrow">YOUR JOURNEY STARTS HERE</p>

                    <h1>JOIN THE MISSION</h1>

                    <p className="subtitle">
                        Become part of the Rocket Mission.
                    </p>

                    <form onSubmit={registerParticipant}>
                        <div className="form-group">
                            <label htmlFor="participant-name">
                                Your Name
                            </label>

                            <input
                                id="participant-name"
                                type="text"
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                                placeholder="Enter your name"
                                maxLength={50}
                                autoComplete="name"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="participant-country">
                                Country
                            </label>

                            <input
                                id="participant-country"
                                type="text"
                                value={country}
                                onChange={(event) =>
                                    setCountry(event.target.value)
                                }
                                placeholder="Enter your country"
                                maxLength={40}
                                autoComplete="country-name"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="primary-button"
                            disabled={loading}
                        >
                            {loading
                                ? "Generating Ticket..."
                                : "Generate My Ticket"}
                        </button>
                    </form>

                    {error && (
                        <p className="message error-message" role="alert">
                            {error}
                        </p>
                    )}
                </section>
            )}

            {ticket && (
                <section className="ticket-section">
                    <p className="eyebrow">MISSION CONFIRMED</p>

                    <h1>YOUR MISSION TICKET</h1>

                    <p className="ticket-intro">
                        Your ticket has been generated.
                    </p>

                    <div className="ticket-details">
                        <div>
                            <span>PASSENGER</span>
                            <strong>{ticket.name}</strong>
                        </div>

                        <div>
                            <span>MISSION ID</span>
                            <strong>{ticket.mission_id}</strong>
                        </div>

                        <div>
                            <span>SEAT</span>
                            <strong>{ticket.seat}</strong>
                        </div>
                    </div>

                    <div className="ticket-image-wrapper">
                        <img
                            src={ticketImage}
                            className="generated-ticket"
                            alt={`Rocket Mission ticket for ${ticket.name}`}
                        />
                    </div>

                    {saving && (
                        <p className="message">
                            Saving your ticket...
                        </p>
                    )}

                    {saveMessage && (
                        <p className="message" role="status">
                            {saveMessage}
                        </p>
                    )}

                    <div className="action-buttons">
                        <button
                            type="button"
                            className="primary-button"
                            onClick={downloadTicket}
                        >
                            Download My Ticket
                        </button>

                        <button
                            type="button"
                            className="secondary-button"
                            onClick={createAnotherTicket}
                        >
                            Create Another Ticket
                        </button>
                    </div>

                    {error && (
                        <p className="message error-message" role="alert">
                            {error}
                        </p>
                    )}
                </section>
            )}
        </main>
    );
}

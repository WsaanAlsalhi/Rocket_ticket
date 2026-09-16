"use client";

import { useState } from "react";
import "./globals.css";

export default function Home() {
    const [name, setName] = useState("");
    const [country, setCountry] = useState("");
    const [email, setEmail] = useState("");

    const [ticket, setTicket] = useState(null);
    const [ticketImage, setTicketImage] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [emailMessage, setEmailMessage] = useState("");

    async function registerParticipant(event) {
        event.preventDefault();

        setError("");
        setEmailMessage("");
        setLoading(true);

        try {
            // STEP 1: Register participant
            const registerResponse = await fetch("/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: name.trim(),
                    country: country.trim(),
                    email: email.trim() || null,
                }),
            });

            const registerData = await registerResponse.json();

            if (!registerResponse.ok) {
                throw new Error(
                    registerData.error ||
                    "Could not register participant."
                );
            }

            // STEP 2: Generate ticket
            const generateResponse = await fetch(
                "/api/generate-ticket",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: registerData.name,
                        country: registerData.country,
                        mission_id: registerData.mission_id,
                        seat: registerData.seat,
                    }),
                }
            );

            if (!generateResponse.ok) {
                const data = await generateResponse.json();

                throw new Error(
                    data.error ||
                    "Could not generate ticket."
                );
            }

            const blob = await generateResponse.blob();

            const imageUrl = URL.createObjectURL(blob);

            // Show ticket immediately
            setTicket(registerData);
            setTicketImage(imageUrl);

            // STEP 3: Upload ticket to Supabase Storage
            const formData = new FormData();

            formData.append(
                "file",
                blob,
                `${registerData.mission_id}.png`
            );

            formData.append(
                "mission_id",
                registerData.mission_id
            );

            try {
                const uploadResponse = await fetch(
                    "/api/upload-ticket",
                    {
                        method: "POST",
                        body: formData,
                    }
                );

                const uploadData =
                    await uploadResponse.json();

                if (!uploadResponse.ok) {
                    console.error(
                        "Ticket upload failed:",
                        uploadData.error
                    );
                }
            } catch (uploadError) {
                console.error(
                    "Ticket upload error:",
                    uploadError
                );
            }

            // STEP 4: Send stickers only if email exists
            if (email.trim()) {
                try {
                    const emailResponse = await fetch(
                        "/api/send-stickers",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                email: email.trim(),
                                name: registerData.name,
                                mission_id:
                                    registerData.mission_id,
                            }),
                        }
                    );

                    const emailData =
                        await emailResponse.json();

                    if (emailResponse.ok) {
                        setEmailMessage(
                            "Your stickers have been sent to your email."
                        );
                    } else {
                        setEmailMessage(
                            emailData.error ||
                            "Ticket generated, but stickers could not be sent."
                        );
                    }
                } catch (emailError) {
                    console.error(
                        "Email error:",
                        emailError
                    );

                    setEmailMessage(
                        "Ticket generated successfully, but stickers could not be sent."
                    );
                }
            }
        } catch (error) {
            console.error(error);

            setError(
                error.message ||
                "Something went wrong."
            );
        } finally {
            setLoading(false);
        }
    }

    function downloadTicket() {
        if (!ticketImage || !ticket) {
            return;
        }

        const link =
            document.createElement("a");

        link.href = ticketImage;

        link.download =
            `Rocket-Mission-${ticket.mission_id}.png`;

        document.body.appendChild(link);

        link.click();

        link.remove();
    }

    function createAnotherTicket() {
        if (ticketImage) {
            URL.revokeObjectURL(ticketImage);
        }

        setName("");
        setCountry("");
        setEmail("");

        setTicket(null);
        setTicketImage(null);

        setError("");
        setEmailMessage("");
    }

    return (
        <main className="container">

            {!ticket && (
                <section className="registration">

                    <div className="logo">
                        🚀
                    </div>

                    <h1 className="title">
                        JOIN THE MISSION
                    </h1>

                    <p className="subtitle">
                        Become part of the Rocket Mission.
                    </p>

                    <form
                        onSubmit={registerParticipant}
                    >

                        <div className="form-group">

                            <label htmlFor="name">
                                Your Name
                            </label>

                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(event) =>
                                    setName(
                                        event.target.value
                                    )
                                }
                                placeholder="Enter your name"
                                maxLength={50}
                                required
                            />

                        </div>

                        <div className="form-group">

                            <label htmlFor="country">
                                Country
                            </label>

                            <input
                                id="country"
                                type="text"
                                value={country}
                                onChange={(event) =>
                                    setCountry(
                                        event.target.value
                                    )
                                }
                                placeholder="Enter your country"
                                maxLength={40}
                                required
                            />

                        </div>

                        <div className="form-group">

                            <label htmlFor="email">

                                Email

                                <span className="optional">
                                    {" "} (Optional)
                                </span>

                            </label>

                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(event) =>
                                    setEmail(
                                        event.target.value
                                    )
                                }
                                placeholder="Enter your email"
                            />

                            <small>
                                Add your email to receive
                                Rocket Mission stickers.
                            </small>

                        </div>

                        <button
                            type="submit"
                            className="submit-button"
                            disabled={loading}
                        >
                            {loading
                                ? "Generating Ticket..."
                                : "🚀 Generate My Ticket"}
                        </button>

                    </form>

                    {error && (
                        <div className="error">
                            {error}
                        </div>
                    )}

                </section>
            )}

            {ticket && (
                <section className="result">

                    <h2>
                        MISSION TICKET
                    </h2>

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

                    {emailMessage && (
                        <div className="email-success">
                            {emailMessage}
                        </div>
                    )}

                    <button
                        className="download-button"
                        onClick={downloadTicket}
                    >
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
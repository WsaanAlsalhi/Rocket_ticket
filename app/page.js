"use client";

import { useRef, useState } from "react";

import { toPng } from "html-to-image";

import "./globals.css";


export default function Home() {

    const ticketRef = useRef(null);


    const [name, setName] = useState("");

    const [country, setCountry] = useState("");

    const [ticket, setTicket] = useState(null);

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");


    async function registerParticipant(event) {

        event.preventDefault();

        setError("");

        setLoading(true);


        try {

            const response = await fetch(
                "/api/register",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        name,
                        country
                    })
                }
            );


            const data = await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Registration failed"
                );

            }


            setTicket(data);

        } catch (err) {

            setError(
                err.message ||
                "Something went wrong"
            );

        } finally {

            setLoading(false);

        }

    }


    async function downloadTicket() {

        if (!ticketRef.current) {
            return;
        }


        try {

            const dataUrl = await toPng(
                ticketRef.current,
                {
                    pixelRatio: 3,

                    cacheBust: true
                }
            );


            const link =
                document.createElement("a");


            link.download =
                `Rocket-Mission-${ticket.mission_id}.png`;


            link.href = dataUrl;


            link.click();

        } catch (err) {

            console.error(err);

            setError(
                "Could not generate ticket image."
            );

        }

    }


    function createAnotherTicket() {

        setTicket(null);

        setName("");

        setCountry("");

        setError("");

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
                        Become part of our Rocket Mission.
                    </p>


                    <form
                        onSubmit={registerParticipant}
                    >

                        <div className="form-group">

                            <label>
                                Your Name
                            </label>

                            <input
                                type="text"
                                value={name}
                                onChange={(e) =>
                                    setName(e.target.value)
                                }
                                placeholder="Enter your name"
                                maxLength={50}
                                required
                            />

                        </div>


                        <div className="form-group">

                            <label>
                                Country
                            </label>

                            <input
                                type="text"
                                value={country}
                                onChange={(e) =>
                                    setCountry(e.target.value)
                                }
                                placeholder="Enter your country"
                                maxLength={40}
                                required
                            />

                        </div>


                        <button
                            className="submit-button"
                            type="submit"
                            disabled={loading}
                        >

                            {loading
                                ? "Preparing Mission..."
                                : "🚀 Generate My Ticket"
                            }

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


                    <div
                        className="ticket-wrapper"
                        ref={ticketRef}
                    >

                        <div className="ticket">

                            <img
                                src="/ticket-template.png"
                                className="ticket-background"
                                alt="Rocket Mission Ticket"
                                crossOrigin="anonymous"
                            />


                            <div className="ticket-name">
                                {ticket.name}
                            </div>


                            <div className="ticket-id">
                                MISSION ID: {ticket.mission_id}
                            </div>


                            <div className="ticket-seat">
                                SEAT: {ticket.seat}
                            </div>


                            <div className="ticket-country">
                                COUNTRY: {ticket.country}
                            </div>

                        </div>

                    </div>


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


                    {error && (

                        <div className="error">
                            {error}
                        </div>

                    )}

                </section>

            )}

        </main>

    );

}
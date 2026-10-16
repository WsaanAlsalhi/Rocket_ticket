"use client";

import { useState } from "react";

import "./globals.css";


export default function Home() {

    const [name, setName] =
        useState("");

    const [country, setCountry] =
        useState("");

    const [ticket, setTicket] =
        useState(null);

    const [ticketImage, setTicketImage] =
        useState(null);

    const [loading, setLoading] =
        useState(false);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");


    async function registerParticipant(event) {

        event.preventDefault();

        setError("");

        setLoading(true);


        try {

            /*
             * Step 1:
             * Register participant
             */

            const registerResponse =
                await fetch(
                    "/api/register",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            name,
                            country
                        })
                    }
                );


            const registerData =
                await registerResponse.json();


            if (!registerResponse.ok) {

                throw new Error(
                    registerData.error ||
                    "Registration failed."
                );

            }


            /*
             * Step 2:
             * Generate the final PNG
             */

            const generateResponse =
                await fetch(
                    "/api/generate-ticket",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            name:
                                registerData.name,

                            country:
                                registerData.country,

                            mission_id:
                                registerData.mission_id,

                            seat:
                                registerData.seat

                        })
                    }
                );


            if (!generateResponse.ok) {

                const data =
                    await generateResponse.json();

                throw new Error(
                    data.error ||
                    "Ticket generation failed."
                );

            }


            /*
             * Step 3:
             * Convert response to Blob
             */

            const blob =
                await generateResponse.blob();


            /*
             * Step 4:
             * Create temporary image URL
             */

            const imageUrl =
                URL.createObjectURL(blob);


            setTicket(
                registerData
            );

            setTicketImage(
                imageUrl
            );


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


    async function saveTicket() {

        if (!ticketImage || !ticket) {

            return;

        }


        setSaving(true);

        setError("");


        try {

            /*
             * Download the generated image
             * as a Blob.
             */

            const imageResponse =
                await fetch(ticketImage);


            const blob =
                await imageResponse.blob();


            /*
             * Send PNG to Storage API.
             */

            const formData =
                new FormData();


            formData.append(
                "file",
                blob,
                `${ticket.mission_id}.png`
            );


            formData.append(
                "mission_id",
                ticket.mission_id
            );


            const uploadResponse =
                await fetch(
                    "/api/upload-ticket",
                    {
                        method: "POST",

                        body: formData
                    }
                );


            const uploadData =
                await uploadResponse.json();


            if (!uploadResponse.ok) {

                throw new Error(
                    uploadData.error ||
                    "Could not save ticket."
                );

            }


            /*
             * Download to user's computer.
             */

            const link =
                document.createElement("a");


            link.href =
                ticketImage;


            link.download =
                `Rocket-Mission-${ticket.mission_id}.png`;


            document.body.appendChild(link);


            link.click();


            link.remove();


        } catch (error) {

            console.error(error);

            setError(
                error.message ||
                "Could not save ticket."
            );

        } finally {

            setSaving(false);

        }

    }


    function createAnotherTicket() {

        setName("");

        setCountry("");

        setTicket(null);

        setTicketImage(null);

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
                        Become part of the Rocket Mission.
                    </p>


                    <form
                        onSubmit={
                            registerParticipant
                        }
                    >

                        <div className="form-group">

                            <label>
                                Your Name
                            </label>

                            <input
                                type="text"

                                value={name}

                                onChange={
                                    (event) =>
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

                            <label>
                                Country
                            </label>

                            <input
                                type="text"

                                value={country}

                                onChange={
                                    (event) =>
                                        setCountry(
                                            event.target.value
                                        )
                                }

                                placeholder="Enter your country"

                                maxLength={40}

                                required
                            />

                        </div>


                        <button
                            type="submit"

                            className="submit-button"

                            disabled={loading}
                        >

                            {loading

                                ? "Generating Ticket..."

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


                    <div className="ticket-wrapper">

                        <img
                            src={ticketImage}

                            className="generated-ticket"

                            alt="Generated Rocket Mission Ticket"
                        />

                    </div>


                    <button
                        className="download-button"

                        onClick={
                            saveTicket
                        }

                        disabled={saving}
                    >

                        {saving

                            ? "Saving Ticket..."

                            : "Download My Ticket"

                        }

                    </button>


                    <button
                        className="secondary-button"

                        onClick={
                            createAnotherTicket
                        }
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

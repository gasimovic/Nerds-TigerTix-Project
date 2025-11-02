import { useState, useRef } from "react";

// Voice-enabled conversational interface methods
/*
Input: None
Output: None
*/
function SpeechToText() {
    const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition; // Web Speech API
    const recognitionRef = useRef(null);
    const [listening, setListening] = useState(false); // state of listening
    const [usersSpeech, setUsersSpeech] = useState(""); // stores the user's speech
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(true);
    const [llmResponse, setLLMResponse] = useState(""); // stores the llm's response

    // Sprint 2, Task 2 - Text-to-Speech Response
    /*
    Input: Text
    Output: None
    Purpose: Converts text to speech using the Speech Synthesis API.
    */
    const speak = (text) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US"; // type of voice
        utterance.rate = 1.0; // voice speed
        speechSynthesis.speak(utterance);
    }

    // Sprint 2, Task 2 - LLM Chat Integration
    /*
    Input: usersSpeechFinal
    Output: None
    Purpose: Waits until the final utterance is sent, then gets the proposed bookings.
    */
    const onSpeechFinal = (usersSpeechFinal) => {
        setUsersSpeech(usersSpeechFinal);
        getProposedBookingsFromLLM(usersSpeechFinal);
    }

    // Sprint 2, Task 2 - LLM Chat Integration
    /*
    Input: usersSpeechFinal
    Output: None
    Purpose: Gets the proposed bookings from the LLM.
    */
    const getProposedBookingsFromLLM = async (usersSpeechFinal) => {
        if (!usersSpeechFinal?.trim()) return; // returns when the user is not done speaking

        const response = await fetch("http://localhost:7001/api/llm/parse", {
                method: "POST", // POST to displayed text endpoint
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({text: usersSpeechFinal})
            }
        );

        const data = await response.json(); // gets the LLM's response

        setLLMResponse(data.message); // sets the LLM's response

        speak(data.message); // speaks the LLM's response
    }

    // Sprint 2, Task 2 - Voice Input Capture
    /*
    Input: None
    Output: None
    Purpose: Listens for user speech.
    */
    const startListening = () => {
        if (!SpeechRecognition) { // error when Web Speech API does not work
            alert("Speech recognition error.");
            return;
        };

        const audio = new Audio('/beep.mp3'); // loads the beep
        audio.play(); // plays beep when the recording button gets clicked

        const recognition = new SpeechRecognition(); // listens for user speech
        recognition.lang = "en-US"; // recognizes english
        recognition.interimResults = true;
        recognition.continuous = false; // stops recording after some time

        recognition.onresult = (event) => { 
            const last = event.results.length - 1; // gets the last listening part
            const transcript = event.results[last][0].transcript;

            if (event.results[last].isFinal) {
                onSpeechFinal(transcript); // handles the entire phrase the user spoke
            };
        };

        recognition.onerror = (err) => { // handles recognition error
            console.error("SpeechRecognition error:", err);
            setListening(false);
        };

        recognition.onend = () => stopListening(); // stops listening

        recognitionRef.current = recognition;
        recognition.start();
        setListening(true); // sets listening status
    }

    // Sprint 2, Task 2 - Voice Input Capture
    /*
    Input: None
    Output: None
    Purpose: Stops listening for user speech.
    */
    const stopListening = () => {
        recognitionRef.current?.stop(); // stops speech recognition
        setListening(false);
        getProposedBookingsFromLLM(); // gets the proposed bookings from the LLM
    }

    // Renders the speech to text UI features
    return (
        <div>
            <div>
                <button onClick={listening ? stopListening : startListening}>
                    {listening ? "🛑 Stop Recording Speech" : "🎙️ Record Speech"}
                </button>
            </div>

        <div>
            <textarea
                rows="1"
                value={usersSpeech}
                placeholder="Your speech will appear here..."
                onChange={(e) => setText(e.target.value)}
                style={{ 
                    marginTop: "16px", 
                    width: "460px", 
                    padding: "8px"
                }}
            />
        </div>
        
        <div>
            <textarea
                rows="1"
                value={llmResponse}
                placeholder="LLM response will appear here..."
                onChange={(e) => setText(e.target.value)}
                style={{ 
                    marginTop: "16px", 
                    width: "460px", 
                    padding: "8px"
                }}
            />
        </div>
        </div>
    );
}

export default SpeechToText;

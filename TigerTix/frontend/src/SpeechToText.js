import { useState, useRef } from "react";

function SpeechToText() {
    const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognitionRef = useRef(null);
    const [listening, setListening] = useState(false);
    const [usersSpeech, setUsersSpeech] = useState("");
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(true);
    const [llmResponse, setLLMResponse] = useState("");

    const speak = (text) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US";
        utterance.rate = 1.0;
        speechSynthesis.speak(utterance);
    }

    const onSpeechFinal = (usersSpeechFinal) => {
        setUsersSpeech(usersSpeechFinal);
        getProposedBookingsFromLLM(usersSpeechFinal);
    }

    const getProposedBookingsFromLLM = async (usersSpeechFinal) => {
        if (!usersSpeechFinal?.trim()) return;

        const response = await fetch("http://localhost:7001/api/llm/parse", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({text: usersSpeechFinal})
            }
        );

        const data = await response.json();

        setLLMResponse(data.message);

        speak(data.message);
    }

    const startListening = () => {
        if (!SpeechRecognition) {
            alert("Speech recognition not supported in this browser.");
            return;
        };

        const audio = new Audio('/beep.mp3'); // plays a beep when the recording button gets clicked
        audio.play();

        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.interimResults = true;
        recognition.continuous = false;

        recognition.onresult = (event) => {
            const last = event.results.length - 1;
            const transcript = event.results[last][0].transcript;

            if (event.results[last].isFinal) {
                onSpeechFinal(transcript);
            };
        };

        recognition.onerror = (err) => {
            console.error("SpeechRecognition error:", err);
            setListening(false);
        };

        recognition.onend = () => stopListening();

        recognitionRef.current = recognition;
        recognition.start();
        setListening(true);
    }

    const stopListening = () => {
        recognitionRef.current?.stop();
        setListening(false);
        getProposedBookingsFromLLM();
    }

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

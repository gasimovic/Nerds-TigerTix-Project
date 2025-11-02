import { useState, useRef } from "react";

function SpeechToText() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognitionRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [text, setText] = useState("");

  const startListening = () => {
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    const audio = new Audio('/beep.mp3'); // plays a beep when the recording button gets clicked
    audio.play();

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join(" ");
      setText(transcript);
    };

    recognition.onerror = (err) => {
      console.error("SpeechRecognition error:", err);
      setListening(false);
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  return (
    <div>
        <div>
            <button onClick={listening ? stopListening : startListening}>
                {listening ? "🛑 Stop Recording Speech" : "🎙️ Record Speech"}
            </button>
        </div>

      <textarea
        rows="1"
        value={text}
        placeholder="Your speech will appear here..."
        onChange={(e) => setText(e.target.value)}
        style={{ 
            marginTop: "16px", 
            width: "360px", 
            padding: "8px"
        }}
      />
    </div>
  );
}

export default SpeechToText;

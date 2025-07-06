import React, { useEffect, useState, useRef } from "react";
import { auth, provider } from "./firebase";
import { signInWithPopup, signOut } from "firebase/auth";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Scatter, ScatterChart
} from 'recharts';

const BACKEND_URL = "https://fingery-v2.onrender.com/api"; // Change if deployed

function TypingTest({ user }) {
  const [words, setWords] = useState([]);
  const [input, setInput] = useState("");
  const startTimeRef = useRef(null); // Use ref instead of state for timing

  const [finished, setFinished] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [timeData, setTimeData] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef();

  useEffect(() => {
    axios.get(`${BACKEND_URL}/words?count=25`).then(res => {
      console.log("[DEBUG] GET /words response:", res);
      setWords(res.data.words);
      setInput("");
      startTimeRef.current = null; // Reset start time
      setFinished(false);
      setAnalytics(null);
      setTimeData([]);
      setShowAnalytics(false);
    }).catch(err => {
      console.error("[ERROR] GET /words:", err);
      setErrorMsg("Failed to load words: " + (err.message || err));
    });
  }, []);

  // Safety mechanism: Ensure analytics are sent when test is finished
  useEffect(() => {
    if (finished && !analytics && !isLoading) {
      console.log("[DEBUG] Safety mechanism triggered - sending analytics");
      const targetText = words.join(" ");
      const finalTime = Date.now();
      
      if (startTimeRef.current && input.length >= targetText.length) {
        analyzeTypingTest(input, finalTime, startTimeRef.current);
      }
    }
  }, [finished, analytics, isLoading, input, words]);

  const getCharacterClass = (wordIndex, charIndex, inputValue) => {
    const targetText = words.join(" ");
    let currentInputIndex = 0;
    
    // Calculate the global character index
    for (let i = 0; i < wordIndex; i++) {
      currentInputIndex += words[i].length + 1; // +1 for space
    }
    currentInputIndex += charIndex;
    
    if (currentInputIndex >= inputValue.length) return "char-default";
    if (currentInputIndex < inputValue.length) {
      return targetText[currentInputIndex] === inputValue[currentInputIndex] ? "char-correct" : "char-incorrect";
    }
    return "char-default";
  };

  const handleInput = async e => {
    const newInput = e.target.value;
    setInput(newInput);
    
    // Set start time on first character
    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
      console.log("[DEBUG] Test started at:", startTimeRef.current);
    }
    
    const targetText = words.join(" ");
    
    // Update real-time data for backend processing
    const currentTime = Date.now();
    const timeElapsed = (currentTime - startTimeRef.current) / 1000;
    
    // Add to time data for backend analytics
    setTimeData(prev => [...prev, { 
      time: timeElapsed, 
      input_length: newInput.length,
      timestamp: currentTime 
    }]);
    
    // Check if test is complete (reached the end of target text)
    if (newInput.length >= targetText.length) {
      const finalTime = Date.now();
      console.log("[DEBUG] Test completed. Input length:", newInput.length, "Target length:", targetText.length);
      console.log("[DEBUG] Start time:", startTimeRef.current, "End time:", finalTime);
      console.log("[DEBUG] About to send analytics POST request...");
      
      setFinished(true);
      
      // Send data to backend for comprehensive analysis
      await analyzeTypingTest(newInput, finalTime, startTimeRef.current);
    }
  };

  const analyzeTypingTest = async (inputText, endTimeValue, startTimeValue) => {
    setIsLoading(true);
    setErrorMsg("");
    
    // For guest users, use local calculations
    if (!user) {
      console.log("[DEBUG] Guest user - using local analytics");
      const basicAnalytics = calculateBasicStats(inputText, endTimeValue, startTimeValue);
      setAnalytics(basicAnalytics);
      setIsLoading(false);
      return;
    }
    
    // For logged-in users, try backend analytics first
    const payload = {
      words: words,
      input_text: inputText,
      start_time: startTimeValue,
      end_time: endTimeValue,
      time_data: Array.isArray(timeData) ? timeData : []
    };
    
    console.log("[DEBUG] Sending analytics payload:", payload);
    console.log("[DEBUG] User token available:", !!user.accessToken);
    
    try {
      const response = await axios.post(
        `${BACKEND_URL}/analyze-typing`,
        payload,
        { 
          headers: { 
            Authorization: `Bearer ${user.accessToken}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      console.log("[DEBUG] Analytics response:", response);
      setAnalytics(response.data.analytics);
    } catch (error) {
      let msg = "Failed to load analytics. Please try again.";
      if (error.response) {
        console.error("[ERROR] Backend response:", error.response);
        if (error.response.data && error.response.data.detail) {
          msg = `Backend error: ${error.response.data.detail}`;
        }
      } else if (error.message) {
        msg = `Network error: ${error.message}`;
      }
      setErrorMsg(msg);
      console.error("[ERROR] Analytics error:", error);
      
      // Fallback to basic calculations if backend fails
      const basicAnalytics = calculateBasicStats(inputText, endTimeValue, startTimeValue);
      setAnalytics(basicAnalytics);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateBasicStats = (inputText, endTimeValue, startTimeValue) => {
    // Fallback basic calculations if backend is unavailable
    const targetText = words.join(" ");
    const timeTaken = (endTimeValue - startTimeValue) / 1000 / 60; // in minutes
    
    let correct = 0;
    let incorrect = 0;
    const minLength = Math.min(inputText.length, targetText.length);
    
    for (let i = 0; i < minLength; i++) {
      if (targetText[i] === inputText[i]) {
        correct++;
      } else {
        incorrect++;
      }
    }
    
    if (inputText.length > targetText.length) {
      incorrect += inputText.length - targetText.length;
    }
    
    const total = correct + incorrect;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const wpm = timeTaken > 0 ? Math.round(words.length / timeTaken) : 0;
    const rawWpm = timeTaken > 0 ? Math.round((inputText.length / 5) / timeTaken) : 0;
    
    return {
      wpm,
      raw_wpm: rawWpm,
      accuracy,
      correct_chars: correct,
      incorrect_chars: incorrect,
      total_chars: total,
      time_taken: (endTimeValue - startTimeValue) / 1000,
      word_count: words.length,
      char_count: inputText.length,
      errors: incorrect,
      consistency: 100.0,
      burst: wpm,
      time_data: timeData,
      wpm_data: [],
      accuracy_data: [],
      char_analysis: {
        total_typed: inputText.length,
        total_target: targetText.length,
        errors: [],
        error_rate: total > 0 ? (incorrect / total * 100) : 0,
        completion_percentage: targetText.length > 0 ? (inputText.length / targetText.length * 100) : 0
      }
    };
  };

  const renderWords = () => {
    return words.map((word, wordIndex) => (
      <span key={wordIndex} className="word">
        {word.split("").map((char, charIndex) => {
          const charClass = getCharacterClass(wordIndex, charIndex, input);
          
          return (
            <span 
              key={`${wordIndex}-${charIndex}`} 
              className={`char ${charClass}`}
            >
              {char}
            </span>
          );
        })}
        {wordIndex < words.length - 1 && (
          <span className={`char ${getCharacterClass(wordIndex, word.length, input)}`}> </span>
        )}
      </span>
    ));
  };

  // --- Binning logic ---
  const totalTime = analytics?.time_data?.length ? analytics.time_data[analytics.time_data.length - 1].time : 0;
  const numBins = 10;
  const binSize = totalTime / numBins;

  // Prepare bins
  const bins = Array.from({ length: numBins }, (_, i) => ({
    start: i * binSize,
    end: (i + 1) * binSize,
    wpm: [],
    accuracy: [],
    errors: [],
  }));

  // Fill bins with WPM/accuracy data
  (analytics?.time_data || []).forEach((td, idx) => {
    const binIdx = Math.min(Math.floor(td.time / binSize), numBins - 1);
    // Find corresponding wpm/accuracy
    const wpm = analytics?.wpm_data?.[idx]?.wpm;
    const accuracy = analytics?.accuracy_data?.[idx]?.accuracy;
    if (wpm !== undefined) bins[binIdx].wpm.push(wpm);
    if (accuracy !== undefined) bins[binIdx].accuracy.push(accuracy);
  });

  // Fill bins with errors
  (analytics?.char_analysis?.errors || []).forEach(err => {
    // Find the closest time for this char position
    let time = null;
    if (analytics?.time_data) {
      const td = analytics.time_data.find(t => t.input_length === err.position + 1);
      if (td) time = td.time;
    }
    if (time !== null) {
      const binIdx = Math.min(Math.floor(time / binSize), numBins - 1);
      bins[binIdx].errors.push(err);
    }
  });

  // Prepare chart data: one point per bin
  const binnedChartData = bins.map((bin, i) => {
    const avgWpm = bin.wpm.length ? (bin.wpm.reduce((a, b) => a + b, 0) / bin.wpm.length) : null;
    const avgAcc = bin.accuracy.length ? (bin.accuracy.reduce((a, b) => a + b, 0) / bin.accuracy.length) : null;
    return {
      bin: i,
      time: (bin.start + bin.end) / 2,
      wpm: avgWpm,
      accuracy: avgAcc,
      errors: bin.errors,
      binStart: bin.start,
      binEnd: bin.end,
    };
  });

  // Error dots: one per bin if any error exists
  const errorDots = binnedChartData.filter(d => d.errors && d.errors.length > 0);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="custom-tooltip" style={{background:'#222',color:'#fff',padding:'10px',borderRadius:'8px',fontSize:'0.95rem'}}>
          <div><b>Time:</b> {data ? `${data.binStart.toFixed(2)}s - ${data.binEnd.toFixed(2)}s` : ''}</div>
          {data?.wpm !== null && <div><b>Avg WPM:</b> {data.wpm.toFixed(2)}</div>}
          {data?.accuracy !== null && <div><b>Avg Accuracy:</b> {data.accuracy.toFixed(2)}%</div>}
          {data?.errors && data.errors.length > 0 && (
            <div style={{color:'#ff4d4f',marginTop:'0.5em'}}>
              <b>Errors:</b>
              <ul style={{margin:0,paddingLeft:'1em'}}>
                {data.errors.map((err, i) => (
                  <li key={i}>Typed '{err.typed}' instead of '{err.expected}' at position {err.position}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const renderAnalytics = () => {
    if (!showAnalytics || !analytics) return null;
    
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="analytics-container"
      >
        <h3>Detailed Analytics</h3>
        
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{analytics.wpm}</div>
            <div className="stat-label">WPM</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{analytics.raw_wpm}</div>
            <div className="stat-label">Raw WPM</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{analytics.accuracy}%</div>
            <div className="stat-label">Accuracy</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{analytics.time_taken}s</div>
            <div className="stat-label">Time</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{analytics.correct_chars}</div>
            <div className="stat-label">Correct</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{analytics.incorrect_chars}</div>
            <div className="stat-label">Errors</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{analytics.consistency}%</div>
            <div className="stat-label">Consistency</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{analytics.burst}</div>
            <div className="stat-label">Burst WPM</div>
          </div>
        </div>
        
        <div className="charts-container">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={binnedChartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                type="number"
                domain={[0, totalTime]}
                ticks={Array.from({length: numBins+1}, (_,i) => (i*binSize))}
                label={{ value: 'Time (s)', position: 'insideBottomRight', offset: -5 }}
                tickFormatter={t => t.toFixed(1)}
              />
              <YAxis yAxisId="left" label={{ value: 'WPM', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'Accuracy (%)', angle: -90, position: 'insideRight' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="wpm" stroke="#4f8cff" dot={false} name="WPM" strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="accuracy" stroke="#00e396" dot={false} name="Accuracy (%)" strokeWidth={2} />
              <Scatter yAxisId="left" data={errorDots} dataKey="time" fill="#ff4d4f" name="Errors" shape="circle" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0 }} 
      className="test-area"
    >
      <div className="words-container">
        <div className="words">
          {renderWords()}
        </div>
        <div className="cursor-line"></div>
      </div>
      
      <input
        id="typing-input"
        name="typing-input"
        ref={inputRef}
        className="typing-input"
        value={input}
        onChange={handleInput}
        disabled={finished}
        placeholder="Start typing..."
        autoFocus
      />
      
      <AnimatePresence>
        {finished && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            exit={{ scale: 0.8, opacity: 0 }} 
            className="results"
          >
            {isLoading ? (
              <div className="loading">
                <div className="loading-spinner"></div>
                <p>Analyzing your typing performance...</p>
              </div>
            ) : analytics ? (
              <>
                <div className="results-content">
                  <div className="result-item">
                    <span className="result-label">WPM</span>
                    <span className="result-value">{analytics.wpm}</span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Raw WPM</span>
                    <span className="result-value">{analytics.raw_wpm}</span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Accuracy</span>
                    <span className="result-value">{analytics.accuracy}%</span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Time</span>
                    <span className="result-value">{analytics.time_taken}s</span>
                  </div>
                </div>
                
                <div className="results-actions">
                  {!user && (
                    <div className="guest-note">
                      <small>📊 Analytics calculated locally (Sign in for advanced features)</small>
                    </div>
                  )}
                  <button 
                    onClick={() => setShowAnalytics(!showAnalytics)} 
                    className="analytics-btn"
                  >
                    {showAnalytics ? 'Hide' : 'Show'} Analytics
                  </button>
                  <button onClick={() => window.location.reload()} className="restart-btn">
                    Restart Test
                  </button>
                </div>
                
                {renderAnalytics()}
              </>
            ) : (
              <div className="error">
                <p>{errorMsg || "Failed to load analytics. Please try again."}</p>
                <div className="error-actions">
                  <button 
                    onClick={() => {
                      const finalTime = Date.now();
                      if (startTimeRef.current) {
                        analyzeTypingTest(input, finalTime, startTimeRef.current);
                      }
                    }} 
                    className="retry-btn"
                  >
                    Retry Analytics
                  </button>
                  <button onClick={() => window.location.reload()} className="restart-btn">
                    Restart Test
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => setShow(false));
    }
  };

  if (!show) return null;
  return (
    <button className="pwa-install-btn" onClick={handleInstall}>
      Install fingery App
    </button>
  );
}

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  const handleSignIn = () => {
    signInWithPopup(auth, provider);
  };
  const handleSignOut = () => {
    signOut(auth);
  };

  return (
    <div className="container">
      <motion.header 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="header"
      >
        <h1>fingery</h1>
        <div className="auth-section">
          {user ? (
            <>
              <span className="user-name">{user.displayName}</span>
              <button onClick={handleSignOut} className="auth-btn sign-out">
                Sign Out
              </button>
            </>
          ) : (
            <>
              <span className="guest-indicator">Guest User</span>
              <button onClick={handleSignIn} className="auth-btn sign-in">
                Sign In with Google
              </button>
            </>
          )}
        </div>
      </motion.header>
      <TypingTest user={user} />
      <InstallPWAButton />
      <footer>
        <small>Minimalist Speed Typing Test &copy; {new Date().getFullYear()}</small>
      </footer>
    </div>
  );
}

export default App;

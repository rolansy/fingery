import React, { useEffect, useState, useRef } from "react";
import { auth, provider } from "./firebase";
import { signInWithPopup, signOut } from "firebase/auth";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

const BACKEND_URL = "http://localhost:8000/api"; // Change if deployed

function TypingTest({ user }) {
  const [words, setWords] = useState([]);
  const [input, setInput] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [finished, setFinished] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [rawWpm, setRawWpm] = useState(0);
  const [correctChars, setCorrectChars] = useState(0);
  const [incorrectChars, setIncorrectChars] = useState(0);
  const [timeData, setTimeData] = useState([]);
  const [charData, setCharData] = useState([]);
  const [wpmData, setWpmData] = useState([]);
  const [accuracyData, setAccuracyData] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const inputRef = useRef();

  useEffect(() => {
    axios.get(`${BACKEND_URL}/words?count=25`).then(res => {
      setWords(res.data.words);
      setInput("");
      setStartTime(null);
      setEndTime(null);
      setFinished(false);
      setWpm(0);
      setRawWpm(0);
      setAccuracy(0);
              setCorrectChars(0);
        setIncorrectChars(0);
        setTimeData([]);
      setCharData([]);
      setWpmData([]);
      setAccuracyData([]);
      
      setShowAnalytics(false);
    });
  }, []);

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

  const calculateStats = (inputValue, endTimeValue) => {
    const targetText = words.join(" ");
    const timeTaken = (endTimeValue - startTime) / 1000 / 60; // in minutes
    
    // Calculate correct and incorrect characters
    let correct = 0;
    let incorrect = 0;
    const minLength = Math.min(inputValue.length, targetText.length);
    
    for (let i = 0; i < minLength; i++) {
      if (targetText[i] === inputValue[i]) {
        correct++;
      } else {
        incorrect++;
      }
    }
    
    // Add remaining characters as incorrect if input is longer
    if (inputValue.length > targetText.length) {
      incorrect += inputValue.length - targetText.length;
    }
    
    const total = correct + incorrect;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    
    // Calculate WPM (words per minute)
    const wordCount = words.length;
    const wpmValue = timeTaken > 0 ? Math.round(wordCount / timeTaken) : 0;
    
    // Calculate raw WPM (based on actual characters typed)
    const rawWpmValue = timeTaken > 0 ? Math.round((inputValue.length / 5) / timeTaken) : 0;
    
    return {
      wpm: wpmValue,
      rawWpm: rawWpmValue,
      accuracy,
      correctChars: correct,
      incorrectChars: incorrect,
      totalChars: total,
      timeTaken: (endTimeValue - startTime) / 1000
    };
  };

  const handleInput = e => {
    if (!startTime) setStartTime(Date.now());
    
    const newInput = e.target.value;
    setInput(newInput);
    
    const targetText = words.join(" ");
    
    // Update real-time data
    const currentTime = Date.now();
    const timeElapsed = (currentTime - startTime) / 1000;
    
    // Calculate current stats
    const currentStats = calculateStats(newInput, currentTime);
    
    // Update time series data
    setTimeData(prev => [...prev, { time: timeElapsed, wpm: currentStats.wpm, accuracy: currentStats.accuracy }]);
    setWpmData(prev => [...prev, { time: timeElapsed, wpm: currentStats.wpm }]);
    setAccuracyData(prev => [...prev, { time: timeElapsed, accuracy: currentStats.accuracy }]);
    
    // Check if test is complete (reached the end of target text)
    if (newInput.length >= targetText.length) {
      const finalTime = Date.now();
      setEndTime(finalTime);
      setFinished(true);
      
      const finalStats = calculateStats(newInput, finalTime);
      setWpm(finalStats.wpm);
      setRawWpm(finalStats.rawWpm);
      setAccuracy(finalStats.accuracy);
      setCorrectChars(finalStats.correctChars);
      setIncorrectChars(finalStats.incorrectChars);
      
      // Save detailed stats to backend
      if (user) {
        const detailedStats = {
          ...finalStats,
          timeData: timeData,
          wpmData: wpmData,
          accuracyData: accuracyData,
          charData: charData,
          targetText: targetText,
          inputText: newInput,
          wordCount: words.length,
          testDuration: finalStats.timeTaken
        };
        
        axios.post(
          `${BACKEND_URL}/detailed-stats`,
          detailedStats,
          { headers: { Authorization: `Bearer ${user.accessToken}` } }
        );
      }
    }
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

  const renderAnalytics = () => {
    if (!showAnalytics) return null;
    
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="analytics-container"
      >
        <h3>Detailed Analytics</h3>
        
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{wpm}</div>
            <div className="stat-label">WPM</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{rawWpm}</div>
            <div className="stat-label">Raw WPM</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{accuracy}%</div>
            <div className="stat-label">Accuracy</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{Math.round((endTime - startTime) / 1000)}s</div>
            <div className="stat-label">Time</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{correctChars}</div>
            <div className="stat-label">Correct</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{incorrectChars}</div>
            <div className="stat-label">Errors</div>
          </div>
        </div>
        
        <div className="charts-container">
          <div className="chart">
            <h4>WPM Timeline</h4>
            <div className="chart-placeholder">
              <div className="chart-line">
                {wpmData.map((point, i) => (
                  <div 
                    key={i}
                    className="chart-point"
                    style={{
                      left: `${(point.time / Math.max(...wpmData.map(p => p.time))) * 100}%`,
                      bottom: `${(point.wpm / Math.max(...wpmData.map(p => p.wpm))) * 100}%`
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          
          <div className="chart">
            <h4>Accuracy Timeline</h4>
            <div className="chart-placeholder">
              <div className="chart-line">
                {accuracyData.map((point, i) => (
                  <div 
                    key={i}
                    className="chart-point"
                    style={{
                      left: `${(point.time / Math.max(...accuracyData.map(p => p.time))) * 100}%`,
                      bottom: `${point.accuracy}%`
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
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
            <div className="results-content">
              <div className="result-item">
                <span className="result-label">WPM</span>
                <span className="result-value">{wpm}</span>
              </div>
              <div className="result-item">
                <span className="result-label">Raw WPM</span>
                <span className="result-value">{rawWpm}</span>
              </div>
              <div className="result-item">
                <span className="result-label">Accuracy</span>
                <span className="result-value">{accuracy}%</span>
              </div>
              <div className="result-item">
                <span className="result-label">Time</span>
                <span className="result-value">{Math.round((endTime - startTime) / 1000)}s</span>
              </div>
            </div>
            
            <div className="results-actions">
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
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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
            <button onClick={handleSignIn} className="auth-btn sign-in">
              Sign In with Google
            </button>
          )}
        </div>
      </motion.header>
      <TypingTest user={user} />
      <footer>
        <small>Minimalist Speed Typing Test &copy; {new Date().getFullYear()}</small>
      </footer>
    </div>
  );
}

export default App;

import React, { useState, useEffect } from 'react';

const App = () => {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [screenshotPath, setScreenshotPath] = useState('');
  const [loading, setLoading] = useState(false); // Add loading state
  const [error, setError] = useState(''); // Add error state
  const [logs, setLogs] = useState([]); // Add logs state to store console logs

  // Helper function to add logs
  const addLog = (message) => {
    setLogs((prevLogs) => [...prevLogs, message]); // Append new log to the logs array
    console.log(message); // Log to the browser console (Inspect Element)
  };

  // Listen for events from the Electron main process
  useEffect(() => {
    if (window.electron) {
      if (window.electron.onScreenshotTaken) {
        window.electron.onScreenshotTaken((filePath) => {
          setScreenshotPath(filePath);
          addLog(`Screenshot saved at: ${filePath}`);
          solveProblem(filePath); // Send the screenshot to the backend
        });
      }

      if (window.electron.onSolutionReceived) {
        window.electron.onSolutionReceived((solution) => {
          setResponse(solution); // Update the response state with the solution
          addLog(`Solution received: ${solution}`);
        });
      }

      if (window.electron.onSolutionError) {
        window.electron.onSolutionError((errorMessage) => {
          setError(errorMessage); // Update the error state with the error message
          addLog(`Error received: ${errorMessage}`);
        });
      }
    }
  }, []);

  const fetchAnswer = async () => {
    setLoading(true);
    setError('');
    addLog('Fetching answer...');
    try {
      const res = await fetch('http://localhost:3000/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setResponse(data.answer);
      addLog(`Answer received: ${data.answer}`);
    } catch (err) {
      setError('Failed to fetch answer.');
      addLog('Failed to fetch answer.');
    } finally {
      setLoading(false);
    }
  };

  const solveProblem = async (filePath) => {
    setLoading(true);
    setError('');
    addLog('Sending screenshot to backend...');
    try {
      const formData = new FormData();
      formData.append('screenshot', new Blob([filePath], { type: 'image/png' })); // Ensure the file is sent as a Blob

      const res = await fetch('http://localhost:3000/api/solve', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setResponse(data.solution);
      addLog(`Solution received: ${data.solution}`);
    } catch (err) {
      setError('Failed to solve the problem.');
      addLog('Failed to solve the problem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 bg-opacity-90 h-screen flex flex-col items-center justify-center text-white p-4">
      <p>⌘+b to hide/show</p>
      <p>⌘+q to quit</p>
      <p>⌘ ↑↓←→ to move</p>
      <p>⌘+h to screenshot and solve</p>
      <textarea
        className="w-72 p-2 text-black rounded-lg"
        placeholder="Type your question here..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />
      <button
        onClick={fetchAnswer}
        className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Get Answer
      </button>
      {loading && <p className="mt-4 text-yellow-500">Loading...</p>}
      {error && <p className="mt-4 text-red-500">{error}</p>}
      {response && (
        <div className="mt-4 bg-gray-800 p-4 rounded">
          <h3 className="text-lg">Response:</h3>
          <pre className="whitespace-pre-wrap">{response}</pre> {/* Preserve formatting */}
        </div>
      )}
      {screenshotPath && (
        <div className="mt-4 bg-gray-800 p-4 rounded">
          <h2 className="text-lg">Screenshot Path:</h2>
          <p>{screenshotPath}</p>
        </div>
      )}
      <div className="mt-4 bg-gray-800 p-4 rounded w-full max-w-lg">
        <h2 className="text-lg">Console Logs:</h2>
        <div className="text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
          {logs.map((log, index) => (
            <p key={index}>{log}</p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
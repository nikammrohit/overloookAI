import React, { useState, useEffect } from 'react';

const App = () => {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [screenshotPath, setScreenshotPath] = useState('');
  const [loading, setLoading] = useState(false); // Add loading state
  const [error, setError] = useState(''); // Add error state

  // Helper function to log messages to the console
  const logToConsole = (message) => {
    console.log(message); // Log to the browser console (Inspect Element)
  };

  // Listen for events from the Electron main process
  useEffect(() => {
    if (window.electron) {
      if (window.electron.onScreenshotTaken) {
        window.electron.onScreenshotTaken((filePath) => {
          setScreenshotPath(filePath);
          logToConsole(`Screenshot saved at: ${filePath}`);
          solveProblem(filePath); // Send the screenshot to the backend
        });
      }

      if (window.electron.onSolutionReceived) {
        window.electron.onSolutionReceived((solution) => {
          setResponse(solution); // Update the response state with the solution
          logToConsole(`Solution received: ${solution}`);
        });
      }

      if (window.electron.onSolutionError) {
        window.electron.onSolutionError((errorMessage) => {
          setError(errorMessage); // Update the error state with the error message
          logToConsole(`Error received: ${errorMessage}`);
        });
      }
    }
  }, []);

  const fetchAnswer = async () => {
    setLoading(true);
    setError('');
    logToConsole('Fetching answer...');
    try {
      const res = await fetch('http://localhost:3000/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setResponse(data.answer);
      logToConsole(`Answer received: ${data.answer}`);
    } catch (err) {
      setError('Failed to fetch answer.');
      logToConsole('Failed to fetch answer.');
    } finally {
      setLoading(false);
    }
  };

  const solveProblem = async (filePath) => {
    setLoading(true);
    setError('');
    logToConsole('Sending screenshot to backend...');
    try {
      const formData = new FormData();
      formData.append('screenshot', new Blob([filePath], { type: 'image/png' })); // Ensure the file is sent as a Blob

      const res = await fetch('http://localhost:3000/api/solve', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setResponse(data.solution);
      logToConsole(`Solution received: ${data.solution}`);
    } catch (err) {
      setError('Failed to solve the problem.');
      logToConsole('Failed to solve the problem.');
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
    </div>
  );
};

export default App;
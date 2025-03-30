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
    <div className="h-screen flex flex-col items-center justify-center glass text-base-content p-4"// Set background with 60% opacity
    >
      <div className="card glass w-full max-w-4xl h-full max-h-4xl overflow-auto">
        <div className="card-body">
          <h2 className="card-title text-center text-gray-500 text-2xl">Overlook AI</h2>
          <div className="flex flex-row justify-between w-full">
            {/* Left side */}
            <div className="flex flex-col gap-2">
              <p className="text-gray-600">⌘ + b to hide/show</p>
              <p className="text-gray-600">⌘ + q to quit</p>
            </div>

            {/* Right side */}
            <div className="flex flex-col gap-2">
              <p className="text-gray-600">⌘ + ↑↓←→ to move</p>
              <p className="text-gray-600">⌘ + h to screenshot and solve</p>
            </div>
          </div>
          <textarea
            className="textarea textarea-bordered w-full mt-4 text-gray-500"
            placeholder="Type your question here..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <div className="card-actions justify-end mt-4">
            <button
              onClick={fetchAnswer}
              className={`btn btn-primary ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Get Answer'}
            </button>
          </div>
          {error && <p className="alert alert-error mt-4">{error}</p>}
          {response && (
            <div className="alert alert-success mt-4 w-full max-h-64 overflow-auto">
              <h3 className="text-lg">Response:</h3>
              <pre className="whitespace-pre-wrap">{response}</pre> {/* Preserve formatting */}
            </div>
          )}
          {screenshotPath && (
            <div className="alert alert-info mt-4 w-full">
              <h2 className="text-lg">Screenshot Path:</h2>
              <p>{screenshotPath}</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default App;
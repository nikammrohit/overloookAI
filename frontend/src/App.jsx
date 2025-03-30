import React, { useState, useEffect } from 'react';

const App = () => {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [screenshotPath, setScreenshotPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false); // State to track drag-and-drop

  const logToConsole = (message) => {
    console.log(message);
  };

  useEffect(() => {
    if (window.electron) {
      if (window.electron.onScreenshotTaken) {
        window.electron.onScreenshotTaken(async (filePath) => {
          setScreenshotPath(filePath);
          logToConsole(`Screenshot saved at: ${filePath}`);
  
          try {
            // Read the file from the path using Electron's IPC method
            const fileDataBase64 = await window.electron.readFile(filePath); // Custom IPC method
            const fileData = Uint8Array.from(atob(fileDataBase64), (c) => c.charCodeAt(0)); // Convert base64 to Uint8Array
            const fileName = filePath.split('/').pop(); // Extract file name from path
            const file = new File([fileData], fileName, { type: 'image/png' });
  
            // Send the file to the backend
            solveProblem(file);
          } catch (err) {
            setError('Failed to read screenshot file.');
            logToConsole('Failed to read screenshot file:', err);
          }
        });
      }
  
      if (window.electron.onSolutionReceived) {
        window.electron.onSolutionReceived((solution) => {
          setResponse(solution);
          logToConsole(`Solution received: ${solution}`);
        });
      }
  
      if (window.electron.onSolutionError) {
        window.electron.onSolutionError((errorMessage) => {
          setError(errorMessage);
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

  const solveProblem = async (file) => {
    setLoading(true);
    setError('');
    logToConsole('Sending screenshot to backend...');
    try {
      const formData = new FormData();
      formData.append('screenshot', file);

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

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type === 'image/png') {
      setScreenshotPath(file.name); // Set the file name
      logToConsole(`File dropped: ${file.name}`);
      solveProblem(file); // Send the file to the backend
    } else {
      setError('Only PNG files are supported.');
    }
  };

  return (
    <div
      className={`h-screen flex flex-col items-center justify-center custom-glass p-4 ${
        dragging ? 'border-4 border-dashed border-blue-500' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="w-full max-w-4xl h-full max-h-4xl overflow-auto rounded-lg p-6 shadow-lg">
        <h2 className="text-center text-gray-500 text-2xl font-semibold">Overlook AI</h2>
        <div className="flex flex-row justify-between w-full mt-4">
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
          className="w-full mt-4 p-2 border border-gray-300 bg-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
          placeholder="Type your question here..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <div className="flex justify-end mt-4">
          <button
            onClick={fetchAnswer}
            className={`px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Get Answer'}
          </button>
        </div>
        {error && <p className="mt-4 p-4 bg-red-100 text-red-500 rounded-md">{error}</p>}
        {response && (
          <div className="mt-4 p-4 bg-green-100 text-green-700 rounded-md max-h-64 overflow-auto">
            <h3 className="text-lg font-semibold">Response:</h3>
            <pre className="whitespace-pre-wrap">{response}</pre>
          </div>
        )}
        {screenshotPath && (
          <div className="mt-4 p-4 bg-blue-100 text-blue-700 rounded-md">
            <h3 className="text-lg font-semibold">Screenshot Path:</h3>
            <p>{screenshotPath}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
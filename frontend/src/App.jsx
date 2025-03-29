import React, { useState, useEffect } from 'react';

const App = () => {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [screenshotPath, setScreenshotPath] = useState('');

  // Listen for the screenshot-taken event
  useEffect(() => {
    if (window.electron && window.electron.onScreenshotTaken) {
      window.electron.onScreenshotTaken((filePath) => {
        setScreenshotPath(filePath);
        solveProblem(filePath); // Optionally send the screenshot to the backend
      });
    }
  }, []);

  const fetchAnswer = async () => {
    const res = await fetch('http://localhost:3000/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    const data = await res.json();
    setResponse(data.answer);
  };

  const solveProblem = async (filePath) => {
    const formData = new FormData();
    formData.append('screenshot', new Blob([filePath], { type: 'image/png' })); // Ensure the file is sent as a Blob
  
    const res = await fetch('http://localhost:3000/api/solve', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    setResponse(data.solution);
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
      {response && (
        <div className="mt-4 bg-gray-800 p-4 rounded">
          <h2 className="text-lg">AI Response:</h2>
          <p>{response}</p>
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
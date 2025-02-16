import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { analyzeMatch } from "./services/matching";
import { Input } from "@/components/ui/input";
import * as pdfjsLib from "pdfjs-dist/webpack";
import { StorageService } from "./services/storage";

const App = () => {
  const [resume, setResume] = useState(() => {
    return localStorage.getItem("savedResume") || "";
  });
  const [jobDescription, setJobDescription] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [apiKey, setApiKey] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

  useEffect(() => {
    // Save resume to localStorage whenever it changes
    localStorage.setItem("savedResume", resume);
  }, [resume]);

  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      console.log("Chrome API available");
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        console.log("Current tab:", tabs[0]);
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: "getJobDescription" },
          (response) => {
            console.log("Response:", response);
            if (response?.jobDescription) {
              setJobDescription(response.jobDescription);
            }
          }
        );
      });
    } else {
      console.log("Chrome API not available");
    }
  }, []);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    const hasKey = await StorageService.hasApiKey();
    setHasApiKey(hasKey);
    setIsLoading(false);
  };

  const handleSaveApiKey = async () => {
    try {
      if (!apiKey.trim()) {
        setError("Please enter a valid API key");
        return;
      }
      await StorageService.setApiKey(apiKey);
      setHasApiKey(true);
    } catch (error) {
      setError("Failed to save API key");
    }
  };

  if (isLoading) {
    return (
      <div className="w-96 p-4">
        <Card>
          <CardContent className="space-y-4">
            <div>Loading...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasApiKey) {
    return (
      <div className="w-96 p-4">
        <Card>
          <CardHeader>
            <CardTitle>API Key Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block mb-2 font-medium">
                Enter Gemini API Key
              </label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
                className="w-full mb-2"
              />
              <Button onClick={handleSaveApiKey} className="w-full">
                Save API Key
              </Button>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleResumeUpload = async (event) => {
    const file = event.target.files[0];
    if (file && file.type === "application/pdf") {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item) => item.str).join(" ");
        }
        setResume(text);
        setResumeFile(file);
      } catch (err) {
        setError("Failed to read PDF file");
        console.error(err);
      }
    }
  };

  // In App.jsx
  // Update handleAnalyze function
  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError(null);

      // if (!resume.trim()) {
      //   throw new Error('Please provide both resume and job description');
      // }

      const result = await analyzeMatch(resume, jobDescription);

      // Validate result structure before setting
      if (!result || typeof result.matchPercentage === "undefined") {
        throw new Error("Invalid analysis result received");
      }

      setAnalysis(result);
    } catch (err) {
      setError(err.message || "Failed to analyze match. Please try again.");
      console.error("Analysis error:", err);
    } finally {
      setLoading(false);
    }
  };

  // In App.jsx - Update the return statement to include analysis display
  return (
    <div className="w-96 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Resume Job Matcher - v6</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block mb-2 font-medium">Upload Resume</label>
            <Input
              type="file"
              accept=".pdf"
              onChange={handleResumeUpload}
              className="w-full"
            />
          </div>

          <Button onClick={handleAnalyze} className="w-full" disabled={loading}>
            {loading ? "Analyzing..." : "Analyze Match"}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {analysis && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Match Score</h3>
                <Progress value={analysis.matchPercentage} />
                <p className="text-sm mt-1">
                  {analysis.matchPercentage}% Match
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Skills</h3>
                <div className="text-sm">
                  <p>
                    <strong>Matching:</strong>{" "}
                    {analysis.analysis.skills.matching.join(", ")}
                  </p>
                  <p>
                    <strong>Missing:</strong>{" "}
                    {analysis.analysis.skills.missing.join(", ")}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Experience Analysis</h3>
                <p className="text-sm">
                  {analysis.analysis.experience.analysis}
                </p>
              </div>

              {analysis.suggestions.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Suggestions</h3>
                  <ul className="text-sm list-disc pl-4">
                    {analysis.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default App;

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Upload } from 'lucide-react';
import { Switch } from '../components/ui/switch';

const LeetCodeUploadForm = () => {
  const [code, setCode] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [topic, setTopic] = useState('');
  const [language, setLanguage] = useState('python');
  const [name, setName] = useState('');
  const [leetcodeNumber, setLeetCodeNumber] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    document.body.classList.add('dark');
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      const fileExtension = getFileExtension();
      console.log('File extension:', fileExtension);
      reader.onload = (e) => {
        setCode(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!difficulty || !topic || !code || !name || !leetcodeNumber) {
      setErrorMessage('Please fill all required fields.');
      return;
    }

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          difficulty,
          topic,
          name,
          leetcodeNumber,
          extension: getFileExtension(),
        }),
      });

      const result = await response.json();
      if (response.ok) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        setErrorMessage(result.error || 'Error uploading solution');
      }
    } catch (error) {
      console.error('Error uploading solution:', error);
      setErrorMessage('An error occurred while uploading the solution.');
    }
  };

  const handleThemeToggle = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    document.body.classList.toggle('dark', !isDarkMode);
    localStorage.setItem('theme', newTheme);
    setIsDarkMode(!isDarkMode);
  };

  const getFileExtension = () => {
    switch (language) {
      case 'python':
        return '.py';
      case 'javascript':
        return '.js';
      case 'java':
        return '.java';
      case 'cpp':
        return '.cpp';
      default:
        return '.txt';
    }
  };

  const isSubmitDisabled = !name || !leetcodeNumber || !difficulty || !topic || !language;

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <Card className="w-full max-w-3xl relative">
        <CardHeader>
          <CardTitle>Upload LeetCode Solution</CardTitle>
          <div className="absolute top-4 right-4">
            <Switch
              id="darkModeSwitch"
              checked={isDarkMode}
              onCheckedChange={handleThemeToggle}
            />
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="LeetCode Problem Title"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leetcodeNumber">LeetCode Number</Label>
              <Input
                id="leetcodeNumber"
                type="text"
                placeholder="Enter your LeetCode number"
                value={leetcodeNumber}
                onChange={(e) => setLeetCodeNumber(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Solution Code</Label>
              <Textarea
                id="code"
                placeholder="Paste your code here..."
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="h-64 font-mono"
                required
              />
              <div className="mt-2">
                <Label htmlFor="file">Or upload a file</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Input
                    id="file"
                    type="file"
                    accept=".py,.js,.java,.cpp"
                    onChange={handleFileChange}
                    className="flex-1"
                  />
                  <Upload className="w-6 h-6 text-gray-400" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Select value={topic} onValueChange={setTopic} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select topic" />
                </SelectTrigger>
                <SelectContent>
                  {["Arrays", "Strings", "Dynamic Programming", "Backtracking", "Bit Manipulation", "Greedy", "Graphs", "Trees", "Math", "Hash Table", "Sorting", "Searching", "Two_Pointers", "Sliding Window", "Union Find", "Heap", "Stack", "Queue", "Recursion", "Binary Search", "Trie", "Divide and Conquer", "Monotonic_Stack"].map((topicValue) => (
                    <SelectItem key={topicValue} value={topicValue.toLowerCase().replace(/_/g, ' ')}>
                      {topicValue}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Programming Language</Label>
              <Select value={language} onValueChange={setLanguage} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="java">Java</SelectItem>
                  <SelectItem value="cpp">C++</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {errorMessage && <div className="text-red-600 mt-2">{errorMessage}</div>}
            <Button type="submit" className="w-full" disabled={isSubmitDisabled}>
              Upload Solution
            </Button>
            {showSuccess && (
              <Alert className="mt-4">
                <AlertDescription>Solution uploaded successfully!</AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeetCodeUploadForm;
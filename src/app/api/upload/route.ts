import { Octokit } from '@octokit/core';
import { NextResponse } from 'next/server';

interface UploadData {
  code: string;
  difficulty: string;
  topic: string;
  name: string;
  leetcodeNumber: string;
  extension: string;
}

const token = process.env.GITHUB_TOKEN || ''; // GitHub Authentication token

// Instantiate Octokit with authentication token
const octokit = new Octokit({ auth: token });

// Define constants for repository owner and name
const REPO_OWNER = 'msnabiel';
const REPO_NAME = 'LeetCode';

// GitHub file content response type
interface FileContent {
  type: 'file';
  sha: string;
  path: string;
}

// Function to upload the solution to GitHub
async function uploadToGitHub({ code, difficulty, topic, name, leetcodeNumber, extension }: UploadData) {
  try {
    const fileName = `${leetcodeNumber}-${name}${extension}`;
    
    // Capitalize first letter of difficulty and construct path
    const capitalizedDifficulty = difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
    const difficultyFilePath = `${capitalizedDifficulty}/${fileName}`;

    // Format topic path (replace spaces with underscores and capitalize)
    const formattedTopic = topic
      .toLowerCase()
      .replace(/ /g, '_') // Replace all spaces with underscores
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('_');
    const topicFilePath = `Topics/${formattedTopic}/${fileName}`;

    // Encode the code to base64
    const content = Buffer.from(code).toString('base64');

    // Upload the file to the difficulty folder
    await uploadFile(difficultyFilePath, content, `Add ${fileName} solution under ${capitalizedDifficulty}`);

    // Upload the file to the topic folder
    await uploadFile(topicFilePath, content, `Add ${fileName} solution under ${formattedTopic}`);

    return { success: true, filePaths: [difficultyFilePath, topicFilePath] };
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('GitHub upload error:', error.message);
      return { success: false, error: error.message };
    } else {
      console.error('Unknown error during GitHub upload');
      return { success: false, error: 'Unknown error' };
    }
  }
}

// Helper function to upload a file
async function uploadFile(filePath: string, content: string, message: string) {
  // Check if the file already exists in the repository
  const response = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
    owner: REPO_OWNER,
    repo: REPO_NAME,
    path: filePath,
  }).catch(() => null); // If file does not exist, we proceed to create it

  // If the file exists, update it; otherwise, create a new file
  if (response?.data) {
    const existingFile = response.data as FileContent;
    // File exists, update it
    await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: filePath,
      message: `Update ${filePath} solution`,
      content: content,
      sha: existingFile.sha, // Required to update the file
    });
  } else {
    // File does not exist, create it
    await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: filePath,
      message: message,
      content: content,
    });
  }
}

// API route handler for App Router
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { code, difficulty, topic, name, leetcodeNumber, extension } = data;

    // Ensure all required fields are provided
    if (!code || !difficulty || !topic || !name || !leetcodeNumber || !extension) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Call the function to upload the solution to GitHub
    const result = await uploadToGitHub({
      code,
      difficulty,
      topic,
      name,
      leetcodeNumber,
      extension,
    });

    // Check if result contains filePaths and return the appropriate response
    if (result.success && result.filePaths) {
      return NextResponse.json({
        message: `Solution uploaded successfully to ${result.filePaths.join(', ')}`
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Error uploading solution to GitHub' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

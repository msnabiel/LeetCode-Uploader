import { Octokit } from '@octokit/core';
import { NextResponse } from 'next/server';

interface UploadData {
  code: string;
  difficulty: string;
  topics: string[];
  name: string;
  leetcodeNumber: string;
  extension: string;
}

const token = process.env.GITHUB_TOKEN;

if (!token) {
  throw new Error('GITHUB_TOKEN is not defined in environment variables');
}

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

// Define a custom error type for Octokit errors
interface OctokitError extends Error {
  status?: number;
}

// Function to format path segments (consistent space handling)
function formatPathSegment(segment: string): string {
  return segment
    .trim()
    .replace(/[^\w\s]/g, '')     // Remove special characters
    .split(/\s+/)                // Split on whitespace
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('_');
}

// Function to upload the solution to GitHub
async function uploadToGitHub({ code, difficulty, topics, name, leetcodeNumber, extension }: UploadData) {
  try {
    // Format the file name: remove special characters and replace spaces with hyphens
    const formattedName = name
      .trim()
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')  // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-');     // Replace spaces with hyphens
    
    const fileName = `${leetcodeNumber}-${formattedName}${extension}`;
    const capitalizedDifficulty = difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
    const difficultyFilePath = `${capitalizedDifficulty}/${fileName}`;
    const content = Buffer.from(code).toString('base64');

    // Upload to difficulty folder
    await uploadFile(difficultyFilePath, content, `Add ${fileName} solution under ${capitalizedDifficulty}`);

    // Sequentially upload to each topic folder
    const topicPaths: string[] = [];
    for (const topic of topics) {
      // Format topic name: capitalize words and replace spaces with underscores
      const formattedTopic = formatPathSegment(topic);
      const topicFilePath = `Topics/${formattedTopic}/${fileName}`;
      await uploadFile(topicFilePath, content, `Add ${fileName} solution under ${formattedTopic}`);
      topicPaths.push(topicFilePath);
    }

    return { 
      success: true, 
      filePaths: [difficultyFilePath, ...topicPaths] 
    };
  } catch (error) {
    console.error('GitHub upload error:', error);
    return { success: false, error: 'Error uploading solution to GitHub' };
  }
}

// Helper function to upload a file with retry mechanism
async function uploadFile(filePath: string, content: string, message: string, retryCount = 3) {
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      // First, try to create the directory structure if it doesn't exist
      const pathParts = filePath.split('/');
      let currentPath = '';
      
      // Iterate through path parts to ensure each directory level exists
      for (let i = 0; i < pathParts.length - 1; i++) {
        const pathSegment = formatPathSegment(pathParts[i]);
        currentPath += (currentPath ? '/' : '') + pathSegment;
        try {
          await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: currentPath,
          });
        } catch (error) {
          const octokitError = error as OctokitError;
          if (octokitError.status === 404) {
            // Directory doesn't exist, create it with a .gitkeep file
            await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
              owner: REPO_OWNER,
              repo: REPO_NAME,
              path: `${currentPath}/.gitkeep`,
              message: `Create ${currentPath} directory`,
              content: Buffer.from('').toString('base64'),
            });
          }
        }
      }

      // Now proceed with file upload
      const response = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: filePath,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28',
          'If-None-Match': '',
          'Cache-Control': 'no-cache'
        }
      }).catch((error: OctokitError) => {
        if (error.status === 404) {
          return null;
        }
        throw error;
      });

      const requestParams = {
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: filePath,
        message: message,
        content: content,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      };

      if (response?.data) {
        const existingFile = response.data as FileContent;
        await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
          ...requestParams,
          sha: existingFile.sha,
        });
      } else {
        await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', requestParams);
      }

      return;

    } catch (error) {
      const octokitError = error as OctokitError;
      if (octokitError.status === 409 && attempt < retryCount) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      console.error(`Error uploading file ${filePath} (attempt ${attempt}/${retryCount}):`, error);
      throw error;
    }
  }
}

// API route handler for App Router
export async function POST(request: Request) {
  try {
    if (!process.env.GITHUB_TOKEN) {
      return NextResponse.json(
        { error: 'GitHub token not configured' },
        { status: 500 }
      );
    }

    const data = await request.json();
    const { code, difficulty, topics, name, leetcodeNumber, extension } = data;

    // Validate input
    if (!code || !difficulty || !topics?.length || !name || !leetcodeNumber || !extension) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Additional validation for file name characters
    if (!/^[\w\-\s]+$/.test(name)) {
      return NextResponse.json(
        { error: 'Problem name contains invalid characters' },
        { status: 400 }
      );
    }

    const result = await uploadToGitHub({
      code,
      difficulty,
      topics,
      name,
      leetcodeNumber,
      extension,
    });

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

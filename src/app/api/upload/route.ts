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

const token = process.env.GITHUB_TOKEN; // GitHub Authentication token

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
    .toLowerCase()
    .replace(/ /g, '_')
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('_');
}

// Function to upload the solution to GitHub
async function uploadToGitHub({ code, difficulty, topics, name, leetcodeNumber, extension }: UploadData) {
  try {
    // Replace spaces with hyphens in the problem name
    const formattedName = name.trim().toLowerCase().replace(/ /g, '-');
    const fileName = `${leetcodeNumber}-${formattedName}${extension}`;
    const capitalizedDifficulty = difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
    const difficultyFilePath = `${capitalizedDifficulty}/${fileName}`;
    const content = Buffer.from(code).toString('base64');

    // Upload to difficulty folder
    await uploadFile(difficultyFilePath, content, `Add ${fileName} solution under ${capitalizedDifficulty}`);

    // Sequentially upload to each topic folder
    const topicPaths: string[] = [];
    for (const topic of topics) {
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
    const data = await request.json();
    const { code, difficulty, topics, name, leetcodeNumber, extension } = data;

    // Ensure all required fields are provided
    if (!code || !difficulty || !topics?.length || !name || !leetcodeNumber || !extension) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Call the function to upload the solution to GitHub
    const result = await uploadToGitHub({
      code,
      difficulty,
      topics,
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

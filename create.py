import os

# Define the path to the Desktop for user 'msnabiel' on a Mac
desktop_path = "/Users/msnabiel/Desktop"
root_dir = os.path.join(desktop_path, "LeetCode")

# Define the subdirectories under the Topics folder
topics = [
    "Arrays", "Strings", "Dynamic_Programming", "Backtracking", "Bit_Manipulation",
    "Greedy", "Graphs", "Trees", "Math", "Hash_Table", "Sorting", "Searching", 
    "Two_Pointers", "Sliding_Window", "Union_Find", "Heap", "Stack", "Queue", 
    "Recursion", "Binary_Search", "Trie", "Divide_and_Conquer", "Monotonic_Stack"
]

# Define the subdirectories under Utilities
utilities = ["readme_generator.py", "leetcode_template.py"]

# Create the main LeetCode folder on Desktop
os.makedirs(root_dir, exist_ok=True)

# Create the subfolders: Easy, Medium, Hard, Topics, and Utilities
os.makedirs(os.path.join(root_dir, "Easy"), exist_ok=True)
os.makedirs(os.path.join(root_dir, "Medium"), exist_ok=True)
os.makedirs(os.path.join(root_dir, "Hard"), exist_ok=True)

# Create the Topics subfolder and its subdirectories with dummy text files
topics_folder = os.path.join(root_dir, "Topics")
os.makedirs(topics_folder, exist_ok=True)

for topic in topics:
    topic_folder_path = os.path.join(topics_folder, topic)
    os.makedirs(topic_folder_path, exist_ok=True)
    # Create a dummy .txt file inside each topic folder
    with open(os.path.join(topic_folder_path, f"{topic}_example.txt"), 'w') as file:
        file.write(f"# Dummy file for {topic} topic\n")
        file.write(f"# Add your code solutions for {topic} here.\n")

# Create the Easy, Medium, and Hard folders with dummy .txt files
difficulty_folders = ["Easy", "Medium", "Hard"]
for difficulty in difficulty_folders:
    difficulty_folder_path = os.path.join(root_dir, difficulty)
    # Create a dummy .txt file inside each difficulty folder
    with open(os.path.join(difficulty_folder_path, f"{difficulty}_example.txt"), 'w') as file:
        file.write(f"# Dummy file for {difficulty} level\n")
        file.write(f"# Add your {difficulty} level code solutions here.\n")

# Create the Utilities folder and the Python files with dummy content
utilities_folder = os.path.join(root_dir, "Utilities")
os.makedirs(utilities_folder, exist_ok=True)

for utility in utilities:
    utility_file_path = os.path.join(utilities_folder, utility)
    with open(utility_file_path, 'w') as file:
        file.write("# This is a placeholder for the script\n")
        file.write(f"# {utility} - Add your utility code here.\n")

# Create the README.md file with dummy content
readme_file_path = os.path.join(root_dir, "README.md")
with open(readme_file_path, 'w') as readme_file:
    readme_file.write("# LeetCode Project\n")
    readme_file.write("This is a project for LeetCode problems categorized by difficulty and topic.\n")
    readme_file.write("\n## Folders and Files\n")
    readme_file.write("The project contains the following folders:\n")
    readme_file.write("- `Easy`, `Medium`, `Hard` - Difficulty folders\n")
    readme_file.write("- `Topics` - Folder containing various topics with solutions.\n")
    readme_file.write("- `Utilities` - Utility scripts for various purposes.\n")

print(f"Project structure with dummy files created at: {os.path.abspath(root_dir)}")
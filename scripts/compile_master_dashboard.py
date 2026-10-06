import os
import shutil

def main():
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src_path = os.path.join(repo_root, "dashboard/dist/index.html")
    dest_path = os.path.join(repo_root, "TheOneSystem_MasterArtifact.html")
    
    if not os.path.exists(src_path):
        print(f"Error: Source HTML file not found at {src_path}")
        return
        
    shutil.copyfile(src_path, dest_path)
    print(f"✅ Compile success: Master Control Panel generated at {dest_path}")

if __name__ == "__main__":
    main()

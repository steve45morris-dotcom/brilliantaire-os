import os
import json

def main():
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    json_path = os.path.join(repo_root, "dashboard/public/dashboard-data.json")
    html_path = os.path.join(repo_root, "dashboard/dist/index.html")

    if not os.path.exists(json_path):
        print(f"Error: JSON data file not found at {json_path}")
        return

    if not os.path.exists(html_path):
        print(f"Error: HTML index file not found at {html_path}")
        return

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    data_json = json.dumps(data)

    with open(html_path, "r", encoding="utf-8") as f:
        html_content = f.read()

    # Inject window.DASHBOARD_DATA right after <head> or before the first script
    injection = f"<script>window.DASHBOARD_DATA = {data_json};</script>"
    
    if "<head>" in html_content:
        html_content = html_content.replace("<head>", f"<head>{injection}")
    else:
        # Fallback if no <head>
        html_content = html_content.replace("<body>", f"<body>{injection}")

    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html_content)

    print(f"✅ Injected DASHBOARD_DATA into {html_path}")

if __name__ == "__main__":
    main()

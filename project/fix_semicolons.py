"""
Fix parenthesis/semicolon order in templates.
"""
import os
import re

templates_dir = r"c:\Users\Leke\Documents\GitHub\shop\project\src\templates"

for root, dirs, files in os.walk(templates_dir):
    for f in files:
        if f.endswith(".jsx") or f.endswith(".js"):
            fpath = os.path.join(root, f)
            with open(fpath, "r", encoding="utf-8") as file:
                content = file.read()
            
            if ".; }" in content or ".;" in content:
                print(f"Fixing semicolon in: {fpath}")
                new_content = re.sub(
                    r"setError\((.*?)\;\ \}",
                    r"setError(\1); }",
                    content
                )
                with open(fpath, "w", encoding="utf-8") as file:
                    file.write(new_content)

print("Finished fixing semicolons!")

import os
import re

def strip_conflict_markers():
    with open("conflicts.txt", "r") as f:
        files = f.read().splitlines()
        
    for filepath in files:
        if not os.path.exists(filepath): continue
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
            
        # Match any line that starts with <<<<<<<, =======, or >>>>>>> allowing leading whitespace
        content = re.sub(r'^[ \t]*<<<<<<<.*?\n', '', content, flags=re.MULTILINE)
        content = re.sub(r'^[ \t]*=======.*?\n', '', content, flags=re.MULTILINE)
        content = re.sub(r'^[ \t]*>>>>>>>.*?\n', '', content, flags=re.MULTILINE)
        
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
            
    print("Conflict markers stripped from {} files.".format(len(files)))

if __name__ == "__main__":
    strip_conflict_markers()

import os
import glob
import re

def cleanup_duplicate_imports():
    root_dir = os.path.join('src', 'app')
    spec_files = glob.glob(os.path.join(root_dir, '**/*.spec.ts'), recursive=True)
    
    for f in spec_files:
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Find RxJS imports
        match = re.search(r'import\s+\{\s*([^}]+)\s*\}\s*from\s*[\'"]rxjs[\'"]', content)
        if match:
            imports_str = match.group(1)
            # Split by comma, strip whitespace
            imports = [i.strip() for i in imports_str.split(',') if i.strip()]
            # Remove duplicates while preserving order
            seen = set()
            unique_imports = []
            for i in imports:
                if i not in seen:
                    unique_imports.append(i)
                    seen.add(i)
            
            new_imports_str = ', '.join(unique_imports)
            new_match = f'import {{ {new_imports_str} }} from "rxjs"'
            content = content.replace(match.group(0), new_match)
            
            with open(f, 'w', encoding='utf-8') as file:
                file.write(content)

if __name__ == "__main__":
    cleanup_duplicate_imports()

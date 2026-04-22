import os
import glob
import re

def fix_snackbars():
    root_dir = os.path.join('src', 'app')
    spec_files = glob.glob(os.path.join(root_dir, '**/*.spec.ts'), recursive=True)
    
    for f in spec_files:
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        
        if 'provide: MatSnackBar' in content:
            print(f"Ensuring imports for {f}")
            
            # Ensure MatSnackBar is imported
            if 'import { MatSnackBar }' not in content and 'import { MatSnackBar,' not in content and 'MatSnackBar } from' not in content:
                content = "import { MatSnackBar } from '@angular/material/snack-bar';\n" + content
            
            # Ensure of is imported from rxjs
            if 'of(' in content:
                if 'from \'rxjs\'' in content or 'from \"rxjs\"' in content:
                    if 'import { of }' not in content and ', of }' not in content and '{ of, }' not in content:
                        content = re.sub(r'import\s+\{\s*([^}]+)\s*\}\s*from\s*[\'"]rxjs[\'"]', r'import { \1, of } from "rxjs"', content)
                else:
                    content = "import { of } from 'rxjs';\n" + content
            
            with open(f, 'w', encoding='utf-8') as file:
                file.write(content)

if __name__ == "__main__":
    fix_snackbars()
